#!/usr/bin/env node

const simpleGit = require('simple-git');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');



// Define the Kyrix repo url
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
    console.log(`The folder ${projectName} already exists. Please use another name or delete the existing folder.`);
    process.exit(1);
  }
}


// Clone the repo
console.log(`Creating the kyrix-app into ${targetPath}...`);

simpleGit().clone(repoUrl, targetPath).then(() => {
  console.log('Kyrix-app created successfully.');
}).catch( err => {
  console.error('failed to create kyrix-app: ', err);
});
