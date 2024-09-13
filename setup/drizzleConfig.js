import fs from "fs";
import path from "path";
import { drizzleConfigContent } from "./contents/DrizzleContent/drizzleConfigContent.js";
import { mainContent } from "./contents/DrizzleContent/mainContent.js";
import {
  indexContent,
  indexContentPostgreSQL,
} from "./contents/DrizzleContent/indexContent.js";
import {
  schemaContentMySQL,
  schemaContentPostgreSQL,
} from "./contents/DrizzleContent/schemaContent.js";
import {
  trpcContentMySQL,
  trpcContentPostgreSQL,
} from "./contents/DrizzleContent/trpcContent.js";
import { formatWithPrettier } from "../utils/formatter.js"; // Import your formatter function

export const setupDrizzle = async (targetPath, chalk, db) => {
  // Paths for the configuration files and folders
  const drizzleConfigPath = path.join(targetPath, "drizzle.config.ts");
  const dbFolderPath = path.join(targetPath, "src", "server", "db");
  const indexPath = path.join(dbFolderPath, "index.ts");
  const schemaPath = path.join(dbFolderPath, "schema.ts");
  const trpcPath = path.join(targetPath, "src", "server", "trpc", "trpc.ts");
  const mainPath = path.join(targetPath, "src", "server", "main.ts");

  // Create directories if they do not exist
  if (!fs.existsSync(dbFolderPath)) {
    fs.mkdirSync(dbFolderPath, { recursive: true });
  }

  // Database provider based on the selected DB
  const provider = db === "postgresql" ? "postgresql" : "mysql";

  // Format and write Drizzle configuration file
  const formattedDrizzleConfigContent = await formatWithPrettier(
    drizzleConfigPath,
    drizzleConfigContent(provider)
  );
  fs.writeFileSync(drizzleConfigPath, formattedDrizzleConfigContent);

  // Format and write index.ts file
  const formattedIndexContent =
    provider === "mysql"
      ? await formatWithPrettier(indexPath, indexContent(provider))
      : await formatWithPrettier(indexPath, indexContentPostgreSQL);
  fs.writeFileSync(indexPath, formattedIndexContent);

  // Format and write schema.ts file
  const schemaContent =
    provider === "postgresql" ? schemaContentPostgreSQL : schemaContentMySQL;
  const formattedSchemaContent = await formatWithPrettier(
    schemaPath,
    schemaContent
  );
  fs.writeFileSync(schemaPath, formattedSchemaContent);

  // Format and write src/server/main.ts file
  const formattedMainContent = await formatWithPrettier(mainPath, mainContent);
  fs.writeFileSync(mainPath, formattedMainContent);

  // Format and write trpc.ts file
  const trpcContent =
    provider === "mysql" ? trpcContentMySQL : trpcContentPostgreSQL;
  const formattedTrpcContent = await formatWithPrettier(trpcPath, trpcContent);
  fs.writeFileSync(trpcPath, formattedTrpcContent);
};
