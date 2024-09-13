export const mainContent = `
    import http from 'http';
    import type { ViteDevServer } from 'vite';
    import { createCallerFactory } from '@trpc/server';
    import { createHTTPHandler } from '@trpc/server/adapters/standalone';

    import { createKyrixMiddleware, execMiddlewares } from '@kyrix/server';

    import { serverEnv as env } from './env';
    import { appRouter } from './trpc/root';
    import { createTRPCContext } from './trpc/trpc';
    import { middlewareFactory } from './middlewares';
    import connectDB from './connect.db';

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
  `;
