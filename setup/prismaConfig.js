const fs = require('fs');
const path = require('path');

module.exports.setupPrisma = (targetPath, chalk) => {
  const prismaPath = path.join(targetPath, 'prisma');
  const connectDBPath = path.join(targetPath, 'src', 'server');
  const trpcPath = path.join(targetPath, 'src', 'server', 'trpc');
  const mainPath = path.join(targetPath, 'src', 'server');

  // Create directories if they do not exist
  if (!fs.existsSync(prismaPath)) {
    fs.mkdirSync(prismaPath, { recursive: true });
  }

  if (!fs.existsSync(connectDBPath)) {
    fs.mkdirSync(connectDBPath, { recursive: true });
  }

  if (!fs.existsSync(trpcPath)) {
    fs.mkdirSync(trpcPath, { recursive: true });
  }

  if (!fs.existsSync(mainPath)) {
    fs.mkdirSync(mainPath, { recursive: true });
  }

  // Write Prisma schema file
  fs.writeFileSync(path.join(prismaPath, 'schema.prisma'), `
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }

    generator client {
      provider = "prisma-client-js"
    }

    // Test schema
    model Product {
      id        String   @id @default(cuid())
      createdAt DateTime @default(now())
      title     String
      desc      String
    }
  `);

  // Write database connection file
  fs.writeFileSync(path.join(connectDBPath, 'connect.db.ts'), `
    import { PrismaClient } from '@prisma/client';

    const prismaClientSingleton = () => {
      return new PrismaClient();
    };

    export type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

    const globalForPrisma = globalThis as unknown as {
      prisma: PrismaClientSingleton | undefined;
    };

    const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

    export default prisma;

    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  `);

  // Write tRPC configuration file
  fs.writeFileSync(path.join(trpcPath, 'trpc.ts'), `
    import { initTRPC } from '@trpc/server';
    import { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
    import { serverEnv as env, type ServerEnv } from '../env';
    import { z } from 'zod';
    import superJSON from 'superjson';
    import type { PrismaClientSingleton } from '../connect.db';

    export const createTRPCContext = async ({
      req,
      res,
      serverEnv: env,
      db,
    }: CreateHTTPContextOptions & { serverEnv: ServerEnv; db: PrismaClientSingleton }) => {
      return { req, res, env, db };
    };

    const t = initTRPC.context<TRPCContext>().create({
      errorFormatter: ({ shape, error }) => {
        return {
          ...shape,
          data: {
            ...shape.data,
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
  `);

  // Write main.ts setup file (should be in `src/server`)
  fs.writeFileSync(path.join(mainPath, 'main.ts'), `
    import http from 'http';
    import type { ViteDevServer } from 'vite';
    import { createCallerFactory } from '@trpc/server';
    import { createHTTPHandler } from '@trpc/server/adapters/standalone';

    import { createKyrixMiddleware, execMiddlewares } from '@kyrix/server';
    import prisma from './connect.db';

    import { serverEnv as env } from './env';
    import { appRouter } from './trpc/root';
    import { createTRPCContext } from './trpc/trpc';
    import { middlewareFactory } from './middlewares';

    const root = process.cwd();
    const isProduction = env.NODE_ENV === 'production';
    const BASE = process.env.BASE || '/';

    // TRPC handler
    const trpcHandler = createHTTPHandler({
      router: appRouter,
      createContext: (args) => createTRPCContext({ ...args, serverEnv: env, db: prisma }),
      batching: { enabled: true },
      onError: ({ error }) => console.error(\`HTTP TRPC ERROR \${error.message}\`),
    });

    let vite: ViteDevServer | undefined;
    (async function () {
      if (!isProduction) {
        const { createViteDevServer } = await import('@kyrix/server');
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
          const trpcCaller = callerFactory({ req, res, env, db: prisma });

          const data = await trpcCaller.kyrix.ssr({ path: req.url || '/' });

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
  `);

  console.log(chalk.green('PostgreSQL+Prisma setup completed.'));
};
