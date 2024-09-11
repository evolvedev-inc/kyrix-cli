#!/usr/bin/env node

import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
import { confirm, select, text } from '@clack/prompts';
import ora from 'ora'; // Import ora for spinner
import chalk from 'chalk'; // Dynamically import chalk (ESM)

// Import configuration files
import { setupPrisma } from './setup/prismaConfig.js';
import { setupDrizzle } from './setup/drizzleConfig.js';
import { setupMongoose } from './setup/mongooseConfig.js';
import { setupDocker } from './setup/dockerConfig.js';
import { setupDependencies } from './setup/dependencies/config.js';

(async () => {
  // Define the Kyrix repo URL
  const repoUrl = 'https://github.com/evolvedev-inc/kyrix.git';

  // Prompt user for project directory
  const projectName = await text({
    message: chalk.cyan('What will be your project directory? (default: kyrix-app)'),
    initialValue: 'kyrix-app',
  });

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

  // Prompt if the user wants to connect a database
  const connectDb = await confirm({
    message: chalk.cyan('Do you want to connect the Kyrix app with a database?'),
  });

  let dbChoice, ormChoice;

  if (connectDb) {
    // Ask for database selection
    dbChoice = await select({
      message: chalk.cyan('Choose your database connection:'),
      options: [
        { label: chalk.bold.magenta('1. PostgreSQL'), value: 'postgresql' },
        { label: chalk.bold.magenta('2. MySQL'), value: 'mysql' },
        { label: chalk.bold.magenta('3. MongoDB'), value: 'mongodb' },
      ],
    });

    // For PostgreSQL and MySQL, ask if the user wants an ORM
    if (dbChoice === 'postgresql' || dbChoice === 'mysql') {
      const useOrm = await confirm({
        message: chalk.cyan('Do you want to use an ORM?'),
      });

      if (useOrm) {
        ormChoice = await select({
          message: chalk.cyan(`Choose an ORM for ${dbChoice}:`),
          options: [
            { label: chalk.bold.magenta('1. Prisma'), value: 'prisma' },
            { label: chalk.bold.magenta('2. Drizzle'), value: 'drizzle' },
          ],
        });
      }
    }
  }

  // Ask if the user wants to use Docker
  const useDocker = await confirm({
    message: chalk.cyan('Do you want to use Docker?'),
  });

  // Set up spinner for cloning
  const spinner = ora({
    text: projectName === '.' || projectName === './'
      ? 'Creating the Kyrix app in current directory...'
      : `Creating the Kyrix app in ${chalk.green(projectName)}...`,
    color: 'cyan',
  }).start();

  try {
    // Perform the Git clone operation
    await simpleGit().clone(repoUrl, targetPath);

    // Remove the .git folder if it exists
    const gitFolderPath = path.join(targetPath, '.git');
    if (fs.existsSync(gitFolderPath)) {
      fs.rmSync(gitFolderPath, { recursive: true });
    }

    spinner.succeed(`Kyrix app created successfully ${projectName === '.' || projectName === './' ? 'in current directory!' : `in ${chalk.green(projectName)}!`}`);

    // Now set up the database connection based on user config
    if (connectDb) {
      if (dbChoice === 'postgresql') {
        if (ormChoice === 'prisma') {
          setupPrisma(targetPath, chalk, dbChoice);
        } else if (ormChoice === 'drizzle') {
          setupDrizzle(targetPath, chalk, dbChoice);
        }
      } else if (dbChoice === 'mysql') {
        if (ormChoice === 'prisma') {
          setupPrisma(targetPath, chalk, dbChoice);
        } else if (ormChoice === 'drizzle') {
          setupDrizzle(targetPath, chalk, dbChoice);
        }
      } else if (dbChoice === 'mongodb') {
        setupMongoose(targetPath, chalk);
      }

      if (useDocker) {
        setupDocker(targetPath, dbChoice, chalk);
      } else {
        console.log(chalk.yellow('Skipping Docker setup.'));
      }

      // Dependencies
      setupDependencies(targetPath, ormChoice, dbChoice, chalk);

      if (projectName === '.' || projectName === './') {
        console.log(chalk.yellow(`Please run ${chalk.bold('npm install')} in the current directory to install the new dependencies.`));
      } else {
        console.log(chalk.yellow(`Please run ${chalk.bold('npm install')} in the ${chalk.bold(projectName)} directory to install the new dependencies.`));
      }
    } else {
      console.log(chalk.yellow('Skipping database connection setup.'));
    }
  } catch (err) {
    spinner.fail('Failed to create Kyrix app.');
    console.error(chalk.red('Failed to create Kyrix app: '), err);
  }
})();
