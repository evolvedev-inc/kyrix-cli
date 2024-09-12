#!/usr/bin/env node

import simpleGit from "simple-git";
import path from "path";
import fs from "fs";
import { confirm, select, isCancel } from "@clack/prompts";
import ora from "ora"; // Import ora for spinner
import chalk from "chalk";

// Import configuration files
import { setupPrisma } from "./setup/prismaConfig.js";
import { setupDrizzle } from "./setup/drizzleConfig.js";
import { setupMongoose } from "./setup/mongooseConfig.js";
import { setupDocker } from "./setup/dockerConfig.js";
import { setupDependencies } from "./setup/dependencies/config.js";
import { checkPackageManagers } from "./scripts/managerFinder.js";
import { intro } from "./utils/customIntro.js";
import { cleanUpOnExit } from "./utils/exitProcess.js";

// Get project name from command-line arguments
const args = process.argv.slice(2); // Skip "node" and script name
const projectName = args[0] || "kyrix-app"; // Default to "kyrix-app" if no name provided

(async () => {
  // Define the Kyrix repo URL
  const repoUrl = "https://github.com/evolvedev-inc/kyrix.git";

  // Check for available package managers
  const availableManagers = checkPackageManagers();

  // Determine the target directory
  let targetPath;

  if (projectName === "." || projectName === "./") {
    // Clone into the current directory
    targetPath = process.cwd();
  } else {
    // Create a new directory for the project
    targetPath = path.join(process.cwd(), projectName);

    // Check if the folder already exists
    if (fs.existsSync(targetPath)) {
      console.log(
        chalk.red(
          `The folder ${chalk.bold(
            projectName
          )} already exists. Please use another name or delete the existing folder.`
        )
      );
      process.exit(1);
    }
  }
  // Display an custom intro message using Clack
  intro("Welcome to Kyrix App Setup");

  // Prompt user for package manager selection
  let packageManagerChoice;
  try {
    packageManagerChoice = await select({
      message: "Choose your package manager:",
      options: availableManagers.map((manager) => ({
        label: manager,
        value: manager,
      })),
    });

    if (isCancel(packageManagerChoice)) {
      console.log("Operation cancelled by user.");
      cleanUpOnExit(targetPath);
      process.exit(0);
    }
  } catch (err) {
    console.error(chalk.red("Prompt error: "), err);
    cleanUpOnExit(targetPath);
    process.exit(1);
  }

  // Prompt if the user wants to connect a database
  let connectDb;
  try {
    connectDb = await confirm({
      message: chalk.cyan(
        "Do you want to connect the Kyrix app with a database?"
      ),
    });

    if (isCancel(connectDb)) {
      console.log("Operation cancelled by user.");
      cleanUpOnExit(targetPath);
      process.exit(0);
    }
  } catch (err) {
    console.error(chalk.red("Prompt error: "), err);
    cleanUpOnExit(targetPath);
    process.exit(1);
  }

  let dbChoice, ormChoice;

  if (connectDb) {
    // Ask for database selection
    try {
      dbChoice = await select({
        message: chalk.cyan("Choose your database connection:"),
        options: [
          { label: chalk.bold.magenta("1. PostgreSQL"), value: "postgresql" },
          { label: chalk.bold.magenta("2. MySQL"), value: "mysql" },
          { label: chalk.bold.magenta("3. MongoDB"), value: "mongodb" },
        ],
      });

      if (isCancel(dbChoice)) {
        console.log("Operation cancelled by user.");
        cleanUpOnExit(targetPath);
        process.exit(0);
      }

      // For PostgreSQL and MySQL, ask if the user wants an ORM
      if (dbChoice === "postgresql" || dbChoice === "mysql") {
        ormChoice = await select({
          message: chalk.cyan(`Choose an ORM for ${dbChoice}:`),
          options: [
            { label: chalk.bold.magenta("1. Prisma"), value: "prisma" },
            { label: chalk.bold.magenta("2. Drizzle"), value: "drizzle" },
          ],
        });

        if (isCancel(ormChoice)) {
          console.log("Operation cancelled by user.");
          cleanUpOnExit(targetPath);
          process.exit(0);
        }
      }
    } catch (err) {
      console.error(chalk.red("Prompt error: "), err);
      cleanUpOnExit(targetPath);
      process.exit(1);
    }
  }

  // Ask if the user wants to use Docker
  let useDocker;
  try {
    useDocker = await confirm({
      message: chalk.cyan("Do you want to use Docker?"),
    });

    if (isCancel(useDocker)) {
      console.log("Operation cancelled by user.");
      cleanUpOnExit(targetPath);
      process.exit(0);
    }
  } catch (err) {
    console.error(chalk.red("Prompt error: "), err);
    cleanUpOnExit(targetPath);
    process.exit(1);
  }

  // Set up spinner for cloning
  const spinner = ora({
    text:
      projectName === "." || projectName === "./"
        ? "Creating the Kyrix app in current directory..."
        : `Creating the Kyrix app in ${chalk.green(projectName)}...`,
    color: "cyan",
  }).start();

  try {
    // Perform the Git clone operation
    await simpleGit().clone(repoUrl, targetPath);

    // Remove the .git folder if it exists
    const gitFolderPath = path.join(targetPath, ".git");
    if (fs.existsSync(gitFolderPath)) {
      fs.rmSync(gitFolderPath, { recursive: true });
    }

    spinner.succeed(
      `Kyrix app created successfully ${
        projectName === "." || projectName === "./"
          ? "in current directory!"
          : `in ${chalk.green(projectName)}!`
      }`
    );

    // Now set up the database connection based on user config
    if (connectDb) {
      if (dbChoice === "postgresql") {
        if (ormChoice === "prisma") {
          setupPrisma(targetPath, chalk, dbChoice);
        } else if (ormChoice === "drizzle") {
          setupDrizzle(targetPath, chalk, dbChoice);
        }
      } else if (dbChoice === "mysql") {
        if (ormChoice === "prisma") {
          setupPrisma(targetPath, chalk, dbChoice);
        } else if (ormChoice === "drizzle") {
          setupDrizzle(targetPath, chalk, dbChoice);
        }
      } else if (dbChoice === "mongodb") {
        setupMongoose(targetPath, chalk);
      }

      if (useDocker) {
        setupDocker(targetPath, dbChoice, chalk);
      }

      // Dependencies
      setupDependencies(targetPath, ormChoice, dbChoice, chalk);

      // Dynamic install command
      const installCommand = {
        npm: "npm install",
        pnpm: "pnpm install",
        yarn: "yarn install",
        bun: "bun add",
      }[packageManagerChoice];

      if (projectName === "." || projectName === "./") {
        console.log(
          chalk.bgMagenta.bold.white(
            `Run ${installCommand} in the current directory to install the new dependencies.`
          )
        );
      } else {
        console.log(
          chalk.bgCyan.bold.white(
            `Run ${installCommand} in the ${projectName} directory to install the new dependencies.`
          )
        );
      }
    }
  } catch (err) {
    spinner.fail("Failed to create Kyrix app.");
    console.error(chalk.red("Failed to create Kyrix app: "), err);
    cleanUpOnExit(targetPath); // Cleanup on error
    process.exit(1);
  }
})();
