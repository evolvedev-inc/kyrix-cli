import { execSync } from "child_process";
import fs from "fs";
import prettier from "prettier";
import path from "path";

// Function to format Prisma schema files using Prisma CLI
const formatPrisma = (filePath) => {
  try {
    // Use Prisma CLI to format the schema
    execSync(`npx prisma format --schema=${filePath}`, { stdio: "inherit" });

    // Read and return the formatted content
    const formattedContent = fs.readFileSync(filePath, "utf8");
    return formattedContent;
  } catch (error) {
    console.error(`Error formatting Prisma file: ${error.message}`);
    throw error;
  }
};

// Function to format content based on file extension
export const formatWithPrettier = async (filePath, content) => {
  try {
    // Write the content to the file before formatting
    fs.writeFileSync(filePath, content);

    if (filePath.endsWith(".prisma")) {
      // Format Prisma files with Prisma CLI
      return formatPrisma(filePath);
    }

    const prettierOptions = {
      semi: true,
      singleQuote: true,
    };

    let parser;
    if (filePath.endsWith(".ts")) {
      parser = "typescript";
    } else if (filePath.endsWith(".js")) {
      parser = "babel";
    } else {
      throw new Error(`Unsupported file extension for file: ${filePath}`);
    }

    // Format content with Prettier
    const formattedContent = prettier.format(content, {
      ...prettierOptions,
      parser,
    });

    return formattedContent;
  } catch (error) {
    console.error(`Error formatting content with Prettier: ${error.message}`);
    throw error;
  }
};

// Define the function to format YAML content
export const formatYAML = async (filePath, content) => {
  try {
    // Ensure the file has the .yml or .yaml extension
    if (![".yml", ".yaml"].includes(path.extname(filePath))) {
      throw new Error(
        "File must have a .yml or .yaml extension for YAML formatting."
      );
    }

    const formatted = await prettier.format(content, {
      parser: "yaml", // Prettier's built-in YAML parser
    });

    return formatted;
  } catch (error) {
    console.error(`Error formatting YAML with Prettier: ${error.message}`);
    throw error;
  }
};
