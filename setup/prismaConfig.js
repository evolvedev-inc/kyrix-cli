import fs from "fs";
import path from "path";
import { schemaContent } from "./contents/PrismaContent/SchemaContent.js";
import { dbContent } from "./contents/PrismaContent/DBContent.js";
import { trpcContent } from "./contents/PrismaContent/TRPCContent.js";
import { mainContent } from "./contents/PrismaContent/MainContent.js";

export const setupPrisma = (targetPath, chalk, db) => {
  const prismaPath = path.join(targetPath, "prisma");
  const connectDBPath = path.join(targetPath, "src", "server");
  const trpcPath = path.join(targetPath, "src", "server", "trpc");
  const mainPath = path.join(targetPath, "src", "server");

  // Create directories if they do not exist
  if (!fs.existsSync(prismaPath)) fs.mkdirSync(prismaPath, { recursive: true });
  if (!fs.existsSync(connectDBPath))
    fs.mkdirSync(connectDBPath, { recursive: true });
  if (!fs.existsSync(trpcPath)) fs.mkdirSync(trpcPath, { recursive: true });
  if (!fs.existsSync(mainPath)) fs.mkdirSync(mainPath, { recursive: true });

  // Database provider
  const provider = db === "postgresql" ? "postgresql" : "mysql";

  // Write files
  fs.writeFileSync(
    path.join(prismaPath, "schema.prisma"),
    schemaContent(provider)
  );
  fs.writeFileSync(path.join(connectDBPath, "connect.db.ts"), dbContent);
  fs.writeFileSync(path.join(trpcPath, "trpc.ts"), trpcContent);
  fs.writeFileSync(path.join(mainPath, "main.ts"), mainContent);

  console.log(
    chalk.green(
      `${
        provider.charAt(0).toUpperCase() + provider.slice(1)
      }+Prisma setup completed.`
    )
  );
};
