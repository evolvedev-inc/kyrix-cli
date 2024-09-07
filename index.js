#!/usr/bin/env node

const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');

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
        const prismaPath = path.join(targetPath, 'prisma');
        const utilsPath = path.join(targetPath, 'src', 'utils');

        if (!fs.existsSync(prismaPath)) {
          fs.mkdirSync(prismaPath);
        }

        if (!fs.existsSync(utilsPath)) {
          fs.mkdirSync(utilsPath, { recursive: true });
        }

        fs.writeFileSync(path.join(prismaPath, 'migration.prisma'), `
          datasource db {
            provider = "postgresql"
            url      = env("DATABASE_URL")
          }

          generator client {
            provider = "prisma-client-js"
          }
        `);

        fs.writeFileSync(path.join(utilsPath, 'connect.db.ts'), `
          import { PrismaClient } from '@prisma/client';

          const prisma = new PrismaClient();

          export default prisma;
        `);

        console.log(chalk.green('PostgreSQL+Prisma setup completed.'));
        dependencies = {
          "prisma": "^4.0.0",
          "@prisma/client": "^4.0.0"
        };
      } else if (dbChoice === '2') {
        // MongoDB+Mongoose setup
        const mongoosePath = path.join(targetPath, 'src', 'utils');

        if (!fs.existsSync(mongoosePath)) {
          fs.mkdirSync(mongoosePath, { recursive: true });
        }

        fs.writeFileSync(path.join(mongoosePath, 'connect.db.ts'), `
          import mongoose from 'mongoose';

          const connectDB = async () => {
            try {
              const conn = await mongoose.connect(process.env.MONGO_URI || '', {
                useNewUrlParser: true,
                useUnifiedTopology: true
              });
              console.log('MongoDB connected:', conn.connection.host);
            } catch (error) {
              console.error('MongoDB connection error:', error);
              process.exit(1);
            }
          };

          export default connectDB;
        `);

        console.log(chalk.green('MongoDB+Mongoose setup completed.'));
        dependencies = {
          "mongoose": "^7.0.0"
        };
      } else {
        console.log(chalk.red('Invalid choice.'));
        rl.close();
        return;
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
