#!/usr/bin/env node

const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Dynamically import chalk (ESM)
let chalk;
(async () => {
  chalk = (await import('chalk')).default;

  // Import configuration files
  const { setupPrisma } = require('./setup/prismaConfig');
  const { setupMongoose } = require('./setup/mongooseConfig');
  const { setupDocker } = require('./setup/dockerConfig');

  // Create readline interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Define the Kyrix repo URL
  const repoUrl = 'https://github.com/evolvedev-inc/kyrix.git';

  // Define a function to prompt the user for input with color
  const prompt = (question, color) => new Promise((resolve) => {
    rl.question(chalk[color](question), resolve);
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
    const connectDb = await prompt(chalk.cyan('Do you want to connect the Kyrix app with a database? (Y/N) '), 'cyan');

    if (connectDb.toLowerCase() === 'y') {
       const dbChoice = await prompt(
        chalk.cyan(
          'Choose your database connection:\n' +
          `${chalk.bold.magenta('1. PostgreSQL+Prisma')}\n` +
          `${chalk.bold.magenta('2. MongoDB+Mongoose')}\n` +
          'Enter choice (1 or 2): '
        ),
        'cyan'
      );

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
        rl.close();
        return;
      }

      // Prompt user for Docker usage
      const useDocker = await prompt(chalk.cyan('Do you want to use Docker? (Y/N) '), 'cyan');

      if (useDocker.toLowerCase() === 'y') {
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

      console.log(chalk.blue('Updated package.json with new dependencies.'));
      
      // Conditional log based on target path
      if (projectName === '.' || projectName === './') {
        console.log(chalk.yellow('Please run `npm install` to install the new dependencies.'));
      } else {
        console.log(chalk.yellow(`Please run ${chalk.bold('npm install')} in the ${chalk.bold(targetPath)} directory to install the new dependencies.`));
      }
    } else {
      console.log(chalk.yellow('Skipping database connection setup.'));
    }

    rl.close();
  } catch (err) {
    console.error(chalk.red('Failed to create Kyrix app: '), err);
    rl.close();
  }
})();
