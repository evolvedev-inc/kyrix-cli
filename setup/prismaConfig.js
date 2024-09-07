const fs = require('fs');
const path = require('path');

module.exports.setupPrisma = (targetPath, chalk) => {
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
};
