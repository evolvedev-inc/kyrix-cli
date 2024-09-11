import fs from "fs";
import path from "path";
import { drizzleConfigContent } from "./contents/DrizzleContent/drizzleConfigContent.js";
import { mainContent } from "./contents/DrizzleContent/mainContent.js";
import { indexContent } from "./contents/DrizzleContent/indexContent.js";
import {
  schemaContentMySQL,
  schemaContentPostgreSQL,
} from "./contents/DrizzleContent/schemaContent.js";
import { trpcContentMySQL } from "./contents/DrizzleContent/trpcContent.js";

export const setupDrizzle = (targetPath, chalk, db) => {
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

  // Write Drizzle configuration file
  fs.writeFileSync(drizzleConfigPath, drizzleConfigContent(provider));

  // Write index.ts file
  fs.writeFileSync(indexPath, indexContent(provider));

  // Write schema.ts file with dynamic content based on the selected database
  let schemaContent;
  if (provider === "postgresql") {
    schemaContent = schemaContentPostgreSQL;
  } else if (provider === "mysql") {
    schemaContent = schemaContentMySQL;
  } else {
    throw new Error("Unsupported database type for Drizzle configuration.");
  }
  fs.writeFileSync(schemaPath, schemaContent);

  // Write src/server/main.ts file with dynamic content based on the selected database
  fs.writeFileSync(mainPath, mainContent);

  let trpcContent;
  if (provider === "mysql") {
    trpcContent = trpcContentMySQL;
  } else if (provider === "postgresql") {
    // Add PostgreSQL-specific trpcContent here
  } else {
    throw new Error("Error when creating Drizzle configuration.");
  }
  fs.writeFileSync(trpcPath, trpcContentMySQL);

  if (provider === "postgresql") {
    console.log(chalk.green("PostgreSQL+Drizzle setup completed."));
  } else {
    console.log(chalk.green("MySQL+Drizzle setup completed."));
  }
};
