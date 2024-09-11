export const mainContent = `
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
// Not tied to kyrix in any way, you can modify this as needed.
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
        // Extend this as needed, if you need to modify the vite config.
        // Hot Module Reload (HMR), won't work with this custom server,
        // Nodemon is used as an alternative which works pretty fast.
        base: BASE,
        plugins: [react()],
      },
    });
  }
})();

http
  .createServer((req, res) => {
    execMiddlewares(req, res, [...middlewareFactory], async (req, res) => {
      // All the paths matching /api/trpc/* are reserved for tRPC only.
      if (req.url?.startsWith('/api/trpc')) {
        req.url = req.url?.replace('/api/trpc', '');
        return trpcHandler(req, res);
      }

      // Creating trpc caller which will call the kyrixRouter from within server.
      const callerFactory = createCallerFactory()(appRouter);
      const trpcCaller = callerFactory({ req, res, env, db });

      // Getting the metadata and initial data per route.
      let data: SSRData = { meta: undefined, initialData: undefined };
      try {
        data = await trpcCaller.kyrix.ssr({ path: req.url || '/' });
      } catch {
        data = { meta: undefined, initialData: undefined };
      }

      // Kyrix handles index.html modification, development and production mode.
      const kyrixServe = createKyrixMiddleware({
        isProduction,
        root,
        port: env.SERVER_PORT,
        viteServer: vite,
        ssrData: data,
      });

      return kyrixServe(req, res);
    });
}).listen(env.SERVER_PORT, 'localhost', () => {
    console.log(\`Server running on http://localhost:\${env.SERVER_PORT}\`);
});

`;
