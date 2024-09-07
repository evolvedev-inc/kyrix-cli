const fs = require('fs');
const path = require('path');

module.exports.setupDocker = (targetPath, dbChoice) => {
  const dockerPath = path.join(targetPath, 'src', 'docker');

  if (!fs.existsSync(dockerPath)) {
    fs.mkdirSync(dockerPath, { recursive: true });
  }

  let dockerComposeYml;

  if (dbChoice === '1') {
    // PostgreSQL+Prisma Docker setup
    dockerComposeYml = `
      version: '3'
      services:
        db:
          image: postgres:latest
          container_name: postgres
          environment:
            POSTGRES_USER: ${process.env.POSTGRES_USER || 'user'}
            POSTGRES_PASSWORD: ${process.env.POSTGRES_PASSWORD || 'password'}
            POSTGRES_DB: ${process.env.POSTGRES_DB || 'mydb'}
          ports:
            - "5432:5432"
          networks:
            - kyrix-network

      networks:
        kyrix-network:
          driver: bridge
    `;
  } else if (dbChoice === '2') {
    // MongoDB+Mongoose Docker setup
    dockerComposeYml = `
      version: '3'
      services:
        db:
          image: mongo:latest
          container_name: mongo
          environment:
            MONGO_INITDB_ROOT_USERNAME: ${process.env.MONGO_INITDB_ROOT_USERNAME || 'root'}
            MONGO_INITDB_ROOT_PASSWORD: ${process.env.MONGO_INITDB_ROOT_PASSWORD || 'password'}
          ports:
            - "27017:27017"
          networks:
            - kyrix-network

      networks:
        kyrix-network:
          driver: bridge
    `;
  }

  fs.writeFileSync(path.join(dockerPath, 'docker-compose.yml'), dockerComposeYml);

  console.log('Docker setup completed.');
};
