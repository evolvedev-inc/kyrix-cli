import { execSync } from "child_process";

export const checkPackageManagers = () => {
  const managers = ["pnpm", "npm", "yarn", "bun"];
  const availableManagers = [];

  managers.forEach((manager) => {
    try {
      execSync(`${manager} -v`, { stdio: "ignore" });
      availableManagers.push(manager);
    } catch (error) {
      //
    }
  });

  return availableManagers;
};
