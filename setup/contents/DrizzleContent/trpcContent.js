export const trpcContentMySQL = `
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