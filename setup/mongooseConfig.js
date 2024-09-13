import fs from "fs";
import path from "path";
import { connectDB } from "./contents/MongoDBContent/connectDB.js";
import { mainContent } from "./contents/MongoDBContent/mainContent.js";
import { formatWithPrettier } from "../utils/formatter.js";

export const setupMongoose = async (targetPath, chalk) => {
  const mongoosePath = path.join(targetPath, "src", "server");
  const mainPath = path.join(targetPath, "src", "server");

  // Ensure directories exist
  if (!fs.existsSync(mongoosePath)) {
    fs.mkdirSync(mongoosePath, { recursive: true });
  }

  // Format content before writing to files
  const formattedConnectDB = await formatWithPrettier(
    path.join(mongoosePath, "connect.db.ts"),
    connectDB
  );
  const formattedMainContent = await formatWithPrettier(
    path.join(mainPath, "main.ts"),
    mainContent
  );

  // Write files
  fs.writeFileSync(
    path.join(mongoosePath, "connect.db.ts"),
    formattedConnectDB
  );
  fs.writeFileSync(path.join(mainPath, "main.ts"), formattedMainContent);
};
