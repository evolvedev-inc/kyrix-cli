export const drizzleConfigContent = (provider) => `
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
