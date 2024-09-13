import fs from "fs";
import path from "path";
import { schemaContent } from "./contents/PrismaContent/SchemaContent.js";
import { dbContent } from "./contents/PrismaContent/DBContent.js";
import { trpcContent } from "./contents/PrismaContent/TRPCContent.js";
import { mainContent } from "./contents/PrismaContent/MainContent.js";
import { formatWithPrettier } from "../utils/formatter.js";

export const setupPrisma = async (targetPath, chalk, db) => {
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

  // Format the content before writing it to the file
  const formattedSchemaContent = await formatWithPrettier(
    path.join(prismaPath, "schema.prisma"),
    schemaContent(provider)
  );
  const formattedDBContent = await formatWithPrettier(
    path.join(connectDBPath, "connect.db.ts"),
    dbContent
  );
  const formattedtrpcContent = await formatWithPrettier(
    path.join(trpcPath, "trpc.ts"),
    trpcContent
  );
  const formattedMainContent = await formatWithPrettier(
    path.join(mainPath, "main.ts"),
    mainContent
  );

  // Write files
  fs.writeFileSync(
    path.join(prismaPath, "schema.prisma"),
    formattedSchemaContent
  );
  fs.writeFileSync(
    path.join(connectDBPath, "connect.db.ts"),
    formattedDBContent
  );
  fs.writeFileSync(path.join(trpcPath, "trpc.ts"), formattedtrpcContent);
  fs.writeFileSync(path.join(mainPath, "main.ts"), formattedMainContent);
};
