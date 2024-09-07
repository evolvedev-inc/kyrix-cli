const fs = require('fs');
const path = require('path');

module.exports.setupMongoose = (targetPath, chalk) => {
  const mongoosePath = path.join(targetPath, 'src', 'server');
  const mainPath = path.join(targetPath, 'src', 'server');

  if (!fs.existsSync(mongoosePath)) {
    fs.mkdirSync(mongoosePath, { recursive: true });
  }

  fs.writeFileSync(path.join(mongoosePath, 'connect.db.ts'), `
    import mongoose from 'mongoose';

    const connectDB = async () => {
      try {
        const conn = await mongoose.connect(process.env.MONGO_URI || '');
        console.log('MongoDB connected:', conn.connection.host);
      } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
      }
    };

    export default connectDB;
  `);

  fs.writeFileSync(path.join(mainPath, 'main.ts'), `
    import http from 'http';
    import type { ViteDevServer } from 'vite';
    import { createCallerFactory } from '@trpc/server';
    import { createHTTPHandler } from '@trpc/server/adapters/standalone';

    import { createKyrixMiddleware, execMiddlewares } from '@kyrix/server';

    import { serverEnv as env } from './env';
    import { appRouter } from './trpc/root';
    import { createTRPCContext } from './trpc/trpc';
    import { middlewareFactory } from './middlewares';
    import connectDB from './server/connect.db';

    const root = process.cwd();
    const isProduction = env.NODE_ENV === 'production';
    const BASE = process.env.BASE || '/';

    // TRPC handler
    const trpcHandler = createHTTPHandler({
      router: appRouter,
      createContext: (args) => createTRPCContext({ ...args, serverEnv: env }),
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

    connectDB();

    http
      .createServer((req, res) => {
        execMiddlewares(req, res, [...middlewareFactory], async (req, res) => {
          if (req.url?.startsWith('/api/trpc')) {
            req.url = req.url?.replace('/api/trpc', '');
            return trpcHandler(req, res);
          }

          const callerFactory = createCallerFactory()(appRouter);
          const trpcCaller = callerFactory({ req, res, env });

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

  console.log(chalk.green('MongoDB+Mongoose setup completed.'));
};
