export const trpcContent = `
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
`;
