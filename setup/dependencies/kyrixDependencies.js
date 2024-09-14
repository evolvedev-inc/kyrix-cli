// addTailwindDependencies.js
import fs from "fs";
import path from "path";
import { getVersions } from "../../utils/versions.js";
import { log } from "console";

export const setUpKyrix = async (targetPath, packageManagerChoice) => {
  let dependencies = {};
  const versions = await getVersions();
  log(packageManagerChoice);

  // For npm and yarn
  if (packageManagerChoice === "npm" || packageManagerChoice === "yarn") {
    dependencies = {
      "@kyrix/react": versions.kyrix.react,
      "@kyrix/server": versions.kyrix.server,
    };
  } else if (
    packageManagerChoice === "pnpm" ||
    packageManagerChoice === "bun"
  ) {
    dependencies = {
      "@kyrix/react": `workspace: ${versions.kyrix.react}`,
      "@kyrix/server": `workspace: ${versions.kyrix.server}`,
    };
  }

  // Read the existing package.json
  const packageJsonPath = path.join(targetPath, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  // Ensure devDependencies is not undefined in package.json
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }
  packageJson.dependencies = {
    ...packageJson.dependencies,
    ...dependencies,
  };

  // Write the updated package.json back to disk
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};
