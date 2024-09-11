import fs from 'fs';
import path from 'path';

export const setupDependencies = (targetPath, ormChoice,dbChoice, chalk) => {
  let dependencies = {};
  let devDependencies = {};

  // Set dependencies based on ORM selection
  if (ormChoice === 'prisma') {
    dependencies = {
      prisma: "^4.0.0",
      "@prisma/client": "^4.0.0",
    };
  } else if (ormChoice === 'drizzle') {
    if (dbChoice === 'postgresql') {
      dependencies = {
        "drizzle-orm": "^0.33.0",
        "pg": "^8.11.5",
        "postgres": "^3.4.4",
      };
      devDependencies = {
        "drizzle-kit": "^0.24.2",
      };
    } else if ( dbChoice === 'mysql') {
      dependencies = {
        "drizzle-orm": "^0.33.0",
        "mysql2": "^3.11.2",
      };
      devDependencies = {
        "drizzle-kit": "^0.24.2",
      };
    }
  } else if (dbChoice === 'mongodb') {
    // MongoDB setup, default to Mongoose
    dependencies = {
      mongoose: "^7.0.0",
    };
  }

  // Update dependencies in package.json
  const packageJsonPath = path.join(targetPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Add or update dependencies and devDependencies
  packageJson.dependencies = {
    ...packageJson.dependencies,
    ...dependencies
  };

  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    ...devDependencies
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log(chalk.green('Dependencies updated successfully.'));
};
