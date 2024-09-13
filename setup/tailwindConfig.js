import fs from "fs";
import path from "path";
import { configContent } from "./contents/TailwindContent/config.js";
import { postcssContent } from "./contents/TailwindContent/postcss.js";
import { tsconfigNodeContent } from "./contents/TailwindContent/tsconfigNode.js";
import { viteConfigContent } from "./contents/TailwindContent/viteConfig.js";
import { globalcssContent } from "./contents/TailwindContent/globalcss.js";
import { formatWithPrettier } from "../utils/formatter.js";

export const setupTailwind = async (targetPath) => {
  const globalcssPath = path.join(targetPath, "src");

  // Format content before writing to files
  const formattedConfigContent = await formatWithPrettier(
    path.join(targetPath, "tailwind.config.ts"),
    configContent
  );
  const formattedPostcssContent = await formatWithPrettier(
    path.join(targetPath, "postcss.config.ts"),
    postcssContent
  );
  const formattedViteConfigContent = await formatWithPrettier(
    path.join(targetPath, "vite.config.ts"),
    viteConfigContent
  );
  const formattedtsConfigNodeContent = await formatWithPrettier(
    path.join(targetPath, "tsconfig.node.json"),
    tsconfigNodeContent
  );

  const formattedGlobalcssContent = await formatWithPrettier(
    path.join(globalcssPath, "globals.css"),
    globalcssContent
  );

  // Write files
  fs.writeFileSync(
    path.join(targetPath, "tailwind.config.ts"),
    formattedConfigContent
  );
  fs.writeFileSync(
    path.join(targetPath, "postcss.config.ts"),
    formattedPostcssContent
  );
  fs.writeFileSync(
    path.join(targetPath, "vite.config.ts"),
    formattedViteConfigContent
  );
  fs.writeFileSync(
    path.join(targetPath, "tsconfig.node.json"),
    formattedtsConfigNodeContent
  );
  fs.writeFileSync(
    path.join(globalcssPath, "globals.css"),
    formattedGlobalcssContent
  );
};
