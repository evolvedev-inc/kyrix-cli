#!/usr/bin/env node

const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Import configuration files
const { setupPrisma } = require('./setup/prismaConfig');
const { setupMongoose } = require('./setup/mongooseConfig');
const { setupDocker } = require('./setup/dockerConfig');

// Dynamically import chalk (ESM)
let chalk;
(async () => {
  chalk = (await import('chalk')).default;

  // Create readline interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Define the Kyrix repo URL
  const repoUrl = 'https://github.com/evolvedev-inc/kyrix.git';

  // Define a function to prompt the user for input
  const prompt = (question) => new Promise((resolve) => {
    rl.question(question, resolve);
  });

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
    console.log(chalk.green('Kyrix app created successfully!'));

    // Prompt user for database connection
    const connectDb = await prompt('Do you want to connect the Kyrix app with a database? (Y/N) ');

    if (connectDb.toLowerCase() === 'y') {
      const dbChoice = await prompt('Choose your database connection:\n1. PostgreSQL+Prisma\n2. MongoDB+Mongoose\nEnter choice (1 or 2): ');

      let dependencies;

      if (dbChoice === '1') {
        // PostgreSQL+Prisma setup
        setupPrisma(targetPath);
        dependencies = {
          "prisma": "^4.0.0",
          "@prisma/client": "^4.0.0"
        };
      } else if (dbChoice === '2') {
        // MongoDB+Mongoose setup
        setupMongoose(targetPath);
        dependencies = {
          "mongoose": "^7.0.0"
        };
      } else {
        console.log(chalk.red('Invalid choice.'));
        rl.close();
        return;
      }

      // Prompt user for Docker usage
      const useDocker = await prompt('Do you want to use Docker? (Y/N) ');

      if (useDocker.toLowerCase() === 'y') {
        // Docker setup
        setupDocker(targetPath, dbChoice);
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

      console.log(chalk.blue('Updated package.json with new dependencies.'));
      console.log(chalk.yellow('Please run `npm install` to install the new dependencies.'));
    } else {
      console.log(chalk.yellow('Skipping database connection setup.'));
    }

    rl.close();
  } catch (err) {
    console.error(chalk.red('Failed to create Kyrix app: '), err);
    rl.close();
  }
})();
