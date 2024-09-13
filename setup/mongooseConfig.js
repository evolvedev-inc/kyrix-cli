import fs from "fs";
import path from "path";
import { connectDB } from "./contents/MongoDBContent/connectDB.js";
import { mainContent } from "./contents/MongoDBContent/mainContent.js";

export const setupMongoose = (targetPath, chalk) => {
  const mongoosePath = path.join(targetPath, "src", "server");
  const mainPath = path.join(targetPath, "src", "server");

  if (!fs.existsSync(mongoosePath)) {
    fs.mkdirSync(mongoosePath, { recursive: true });
  }

  fs.writeFileSync(path.join(mongoosePath, "connect.db.ts"), connectDB);

  fs.writeFileSync(path.join(mainPath, "main.ts"), mainContent);
};
