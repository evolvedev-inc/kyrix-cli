#!/usr/bin/env node

const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const { confirm, select, text } = require('@clack/prompts');

// Dynamically import chalk (ESM)
let chalk;
(async () => {
  chalk = (await import('chalk')).default;

  // Import configuration files
  const { setupPrisma } = require('./setup/prismaConfig');
  const { setupMongoose } = require('./setup/mongooseConfig');
  const { setupDocker } = require('./setup/dockerConfig');

  // Define the Kyrix repo URL
  const repoUrl = 'https://github.com/evolvedev-inc/kyrix.git';

  // Target folder for the project
  const projectName = process.argv[2] || 'kyrix-app';

  // Determine the target directory
  let targetPath;

  if (projectName === '.' || projectName === './') {
    // Clone into the current directory
    targetPath = process.cwd();
  } else {
    // Create a new directory for the project
    targetPath = path.join(process.cwd(), projectName);

    // Check if the folder already exists
    if (fs.existsSync(targetPath)) {
      console.log(chalk.red(`The folder ${chalk.bold(projectName)} already exists. Please use another name or delete the existing folder.`));
      process.exit(1);
    }
  }

  // Clone the repo
  console.log(chalk.blue(`Creating the Kyrix app in ${chalk.green(targetPath)}...`));

  try {
    await simpleGit().clone(repoUrl, targetPath);
    
    // Remove the .git folder if it exists
    const gitFolderPath = path.join(targetPath, '.git');
    if (fs.existsSync(gitFolderPath)) {
      fs.rmSync(gitFolderPath, { recursive: true });
    }

    console.log(chalk.green('Kyrix app created successfully!'));

    // Prompt user for database connection
    const connectDb = await confirm({
      message: chalk.cyan('Do you want to connect the Kyrix app with a database?'),
    });

    if (connectDb) {
      const dbChoice = await select({
        message: chalk.cyan(
          'Choose your database connection:'
        ),
        options: [
          { label: chalk.bold.magenta('1. PostgreSQL+Prisma'), value: '1' },
          { label: chalk.bold.magenta('2. MongoDB+Mongoose'), value: '2' }
        ],
      });

      let dependencies;

      if (dbChoice === '1') {
        // PostgreSQL+Prisma setup
        setupPrisma(targetPath, chalk);
        dependencies = {
          "prisma": "^4.0.0",
          "@prisma/client": "^4.0.0"
        };
      } else if (dbChoice === '2') {
        // MongoDB+Mongoose setup
        setupMongoose(targetPath, chalk);
        dependencies = {
          "mongoose": "^7.0.0"
        };
      } else {
        console.log(chalk.red('Invalid choice.'));
        return;
      }

      // Prompt user for Docker usage
      const useDocker = await confirm({
        message: chalk.cyan('Do you want to use Docker?'),
      });

      if (useDocker) {
        // Docker setup
        setupDocker(targetPath, dbChoice, chalk);
      } else {
        console.log(chalk.yellow('Skipping Docker setup.'));
      }

      // Update dependencies in package.json
      const packageJsonPath = path.join(targetPath, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Add or update dependencies
      packageJson.dependencies = {
        ...packageJson.dependencies,
        ...dependencies
      };

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      // Conditional log based on target path
      if (projectName === '.' || projectName === './') {
        console.log(chalk.yellow('Please run `npm install` to install the new dependencies.'));
      } else {
        console.log(chalk.yellow(`Please run ${chalk.bold('npm install')} in the ${chalk.bold(targetPath)} directory to install the new dependencies.`));
      }
    } else {
      console.log(chalk.yellow('Skipping database connection setup.'));
    }
  } catch (err) {
    console.error(chalk.red('Failed to create Kyrix app: '), err);
  }
})();
