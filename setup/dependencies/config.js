import fs from "fs";
import path from "path";

export const setupDependencies = (targetPath, ormChoice, dbChoice, chalk) => {
  let dependencies = {};
  let devDependencies = {};
  let scripts = {};

  // Set dependencies based on ORM selection
  if (ormChoice === "prisma") {
    dependencies = {
      "@prisma/client": "^5.19.1",
    };
    devDependencies = {
      prisma: "^5.19.1",
    };
    scripts = {
      "db:migrate": "prisma migrate dev",
      "db:push": "prisma db push",
      "db:studio": "prisma studio",
    };
  } else if (ormChoice === "drizzle") {
    scripts = {
      "db:generate": "drizzle-kit generate --config=drizzle.config.ts",
      "db:push": "drizzle-kit push --config=drizzle.config.ts",
      "db:studio": "drizzle-kit studio",
    };
    if (dbChoice === "postgresql") {
      dependencies = {
        "drizzle-orm": "^0.33.0",
        pg: "^8.11.5",
        postgres: "^3.4.4",
      };
      devDependencies = {
        "drizzle-kit": "^0.24.2",
      };
    } else if (dbChoice === "mysql") {
      dependencies = {
        "drizzle-orm": "^0.33.0",
        mysql2: "^3.11.2",
      };
      devDependencies = {
        "drizzle-kit": "^0.24.2",
      };
    }
  } else if (dbChoice === "mongodb") {
    // MongoDB setup, default to Mongoose
    dependencies = {
      mongoose: "^7.0.0",
    };
  }

  // Update dependencies in package.json
  const packageJsonPath = path.join(targetPath, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  // Add or update dependencies and devDependencies
  packageJson.dependencies = {
    ...packageJson.dependencies,
    ...dependencies,
  };

  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    ...devDependencies,
  };

  packageJson.scripts = {
    ...packageJson.scripts,
    ...scripts,
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};
