// addTailwindDependencies.js
import fs from "fs";
import path from "path";

export const addTailwindDependencies = (targetPath) => {
  // Tailwind CSS dependencies
  const devDependencies = {
    tailwindcss: "^3.4.11",
    postcss: "^8.4.45",
    autoprefixer: "^10.4.20",
  };

  // Read the existing package.json
  const packageJsonPath = path.join(targetPath, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  // Ensure devDependencies is not undefined in package.json
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }

  // Merge Tailwind dependencies into devDependencies
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    ...devDependencies,
  };

  // Write the updated package.json back to disk
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};
