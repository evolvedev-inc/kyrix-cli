import fs from 'fs';
import path from 'path';

export const setupDrizzle = (targetPath, chalk, db) => {
  // Paths for the configuration files and folders
  const drizzleConfigPath = path.join(targetPath, 'drizzle.config.ts');
  const dbFolderPath = path.join(targetPath, 'src', 'server', 'db');
  const indexPath = path.join(dbFolderPath, 'index.ts');
  const schemaPath = path.join(dbFolderPath, 'schema.ts');
  const trpcPath = path.join(targetPath, 'src', 'server', 'trpc');
  const mainPath = path.join(targetPath, 'src', 'server', 'main.ts');

  // Create directories if they do not exist
  if (!fs.existsSync(dbFolderPath)) {
    fs.mkdirSync(dbFolderPath, { recursive: true });
  }

  // Database provider based on the selected DB
  const provider = db === 'postgresql' ? 'postgresql' : 'mysql';

  // Write Drizzle configuration file
  const drizzleConfigContent = `
    import { defineConfig } from 'drizzle-kit';

    export default defineConfig({
      schema: './src/server/db/schema.ts',
      out: './migrations',
      dialect: '${provider}',
      dbCredentials: {
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        database: process.env.DB_NAME!,
        password: process.env.DB_PASSWORD!,
      },
      verbose: true,
      strict: true,
    });
  `;
  fs.writeFileSync(drizzleConfigPath, drizzleConfigContent);

  // Write index.ts file
  const indexContent = `
    import { drizzle } from 'drizzle-orm/${provider}2';
    import ${provider} from '${provider}2/promise';
    import * as schema from '../db/schema';

    const connection = await ${provider}.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
    });

    export const db = drizzle(connection, { schema, mode: 'default' });
  `;
  fs.writeFileSync(indexPath, indexContent);

  // Write schema.ts file with dynamic content based on the selected database
  let schemaContent;
  if (provider === 'postgresql') {
    schemaContent = `
      import { pgTable, serial, varchar, text, timestamp } from 'drizzle-kit';

      export const Product = pgTable('product', {
        id: serial().primaryKey(),
        createdAt: timestamp().defaultNow(),
        title: varchar(255),
        desc: text(),
      });
    `;
  } else if (provider === 'mysql') {
    schemaContent = `
      import { timestamp, char, varchar, int, mysqlTable } from 'drizzle-orm/mysql-core';

      export const products = mysqlTable('products', {
        id: int('product_id').autoincrement().primaryKey(),
        createdAt: timestamp('created_at').defaultNow(),
        title: varchar('title', { length: 255 }).notNull(),
        description: char('description', { length: 255 }).notNull(),
      });
    `;
  } else {
    throw new Error('Unsupported database type for Drizzle configuration.');
  }
  fs.writeFileSync(schemaPath, schemaContent);

  // Write src/server/main.ts file with dynamic content based on the selected database
  let mainContent = `
    import http from 'http';
    import type { ViteDevServer } from 'vite';
    import { createCallerFactory } from '@trpc/server';
    import { createHTTPHandler } from '@trpc/server/adapters/standalone';

    import {
      createKyrixMiddleware,
      createViteDevServer,
      execMiddlewares,
      type SSRData,
    } from '@kyrix/server';

    import { serverEnv as env } from './env';
    import { appRouter } from './trpc/root';
    import { createTRPCContext } from './trpc/trpc';
    import { middlewareFactory } from './middlewares';
    import { db } from './db';

    const root = process.cwd();
    const isProduction = env.NODE_ENV === 'production';
    const BASE = process.env.BASE || '/';

    // TRPC handler
    const trpcHandler = createHTTPHandler({
      router: appRouter,
      createContext: (args) => createTRPCContext({ ...args, serverEnv: env, db }),
      batching: { enabled: true },
      onError: ({ error }) => console.error(\`HTTP TRPC ERROR \${error.message}\`),
    });

    let vite: ViteDevServer | undefined;
    (async function () {
      if (!isProduction) {
        const react = (await import('@vitejs/plugin-react-swc')).default;
        vite = await createViteDevServer({
          port: env.SERVER_PORT,
          viteConfig: {
            base: BASE,
            plugins: [react()],
          },
        });
      }
    })();

    http
      .createServer((req, res) => {
        execMiddlewares(req, res, [...middlewareFactory], async (req, res) => {
          if (req.url?.startsWith('/api/trpc')) {
            req.url = req.url?.replace('/api/trpc', '');
            return trpcHandler(req, res);
          }

          const callerFactory = createCallerFactory()(appRouter);
          const trpcCaller = callerFactory({ req, res, env, db });

          let data: SSRData = { meta: undefined, initialData: undefined };
          try {
            data = await trpcCaller.kyrix.ssr({ path: req.url || '/' });
          } catch {
            data = { meta: undefined, initialData: undefined };
          }

          const kyrixServe = createKyrixMiddleware({
            isProduction,
            root,
            port: env.SERVER_PORT,
            viteServer: vite,
            ssrData: data,
          });

          return kyrixServe(req, res);
        });
      })
      .listen(env.SERVER_PORT, 'localhost', () => {
        console.log(\`Server running on http://localhost:\${env.SERVER_PORT}\`);
      });
  `;
  fs.writeFileSync(mainPath, mainContent);

  let trpcContent;
  if (provider === 'mysql') {
    trpcContent = `
      import type { MySql2Database } from 'drizzle-orm/mysql2';
      import { initTRPC } from '@trpc/server';
      import { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
      import { serverEnv as env, type ServerEnv } from '../env';
      import { z } from 'zod';
      import superJSON from 'superjson';
      import * as schema from '../db/schema';

      export const createTRPCContext = async ({
        req,
        res,
        serverEnv: env,
        db,
      }: CreateHTTPContextOptions & {
        serverEnv: ServerEnv;
        db: MySql2Database<typeof schema>;
      }) => {
        return { req, res, env, db };
      };

      const t = initTRPC.context<TRPCContext>().create({
        errorFormatter: ({ shape, error }) => {
          return {
            ...shape,
            data: {
              ...shape.data,
              // Stack trace is removed in production to avoid leaking potential sensitive information.
              stack: env.NODE_ENV !== 'production' ? shape.data.stack : undefined,
              zodError: error.cause instanceof z.ZodError ? error.cause.flatten() : null,
            },
          };
        },
        isDev: env.NODE_ENV !== 'production',
        transformer: superJSON,
      });

      export const router = t.router;
      export const publicProcedure = t.procedure;

      export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
    `;
  } else if (provider === 'postgresql') {
    // Add PostgreSQL-specific trpcContent here
  } else {
    throw new Error('Error when creating Drizzle configuration.');
  }

  if (provider === 'postgresql') {
    console.log(chalk.green('PostgreSQL+Drizzle setup completed.'));
  } else {
    console.log(chalk.green('MySQL+Drizzle setup completed.'));
  }
};
