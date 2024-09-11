export const schemaContent = (provider) => `
datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Product {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  title     String
  desc      String
}
`;
