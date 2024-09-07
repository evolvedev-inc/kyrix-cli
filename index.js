#!/usr/bin/env node

const simpleGit = require('simple-git');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// Dynamically import chalk (ESM)
let chalk;
(async () => {
  chalk = (await import('chalk')).default;

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

  simpleGit().clone(repoUrl, targetPath).then(() => {
    console.log(chalk.green('Kyrix app created successfully!'));
  }).catch(err => {
    console.error(chalk.red('Failed to create Kyrix app: '), err);
  });
})();
