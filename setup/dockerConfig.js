import fs from "fs";
import path from "path";
import { formatYAML } from "../utils/formatter.js";

export const setupDocker = async (targetPath, dbChoice, chalk) => {
  const dockerPath = path.join(targetPath, "src", "docker");

  if (!fs.existsSync(dockerPath)) {
    fs.mkdirSync(dockerPath, { recursive: true });
  }

  let dockerComposeYml;

  if (dbChoice === "postgresql") {
    // PostgreSQL+Prisma Docker setup
    dockerComposeYml = `
      version: '3'
      services:
        db:
          image: postgres:latest
          container_name: postgres
          environment:
            POSTGRES_USER: ${process.env.POSTGRES_USER || "user"}
            POSTGRES_PASSWORD: ${process.env.POSTGRES_PASSWORD || "password"}
            POSTGRES_DB: ${process.env.POSTGRES_DB || "mydb"}
          ports:
            - "5432:5432"
          networks:
            - kyrix-network

      networks:
        kyrix-network:
          driver: bridge
    `;
  } else if (dbChoice === "mongodb") {
    // MongoDB+Mongoose Docker setup
    dockerComposeYml = `
      version: '3'
      services:
        db:
          image: mongo:latest
          container_name: mongo
          environment:
            MONGO_INITDB_ROOT_USERNAME: ${
              process.env.MONGO_INITDB_ROOT_USERNAME || "root"
            }
            MONGO_INITDB_ROOT_PASSWORD: ${
              process.env.MONGO_INITDB_ROOT_PASSWORD || "password"
            }
          ports:
            - "27017:27017"
          networks:
            - kyrix-network

      networks:
        kyrix-network:
          driver: bridge
    `;
  } else if (dbChoice === "mysql") {
    // MySQL Docker setup
    dockerComposeYml = `
      version: '3'
      services:
        db:
          image: mysql:latest
          container_name: mysql
          environment:
            MYSQL_ROOT_PASSWORD: ${process.env.MYSQL_ROOT_PASSWORD || "root"}
            MYSQL_DATABASE: ${process.env.MYSQL_DATABASE || "mydb"}
            MYSQL_USER: ${process.env.MYSQL_USER || "user"}
            MYSQL_PASSWORD: ${process.env.MYSQL_PASSWORD || "password"}
          ports:
            - "3306:3306"
          networks:
            - kyrix-network

      networks:
        kyrix-network:
          driver: bridge
    `;
  }

  // Format the Docker Compose content
  const formattedDockerCompose = await formatYAML(
    path.join(dockerPath, "docker-compose.yml"),
    dockerComposeYml
  );

  fs.writeFileSync(
    path.join(dockerPath, "docker-compose.yml"),
    formattedDockerCompose
  );
};
