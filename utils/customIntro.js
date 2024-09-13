import chalk from "chalk";
import * as emoji from "node-emoji"; // Import node-emoji for emojis

export const intro = (message) => {
  // Create a colorful introduction with emojis
  const colorfulMessage = chalk.bgCyan.bold.white(
    ` ${emoji.get("rocket")} ${message} ${emoji.get("rocket")} `
  );

  // Display the colorful introduction
  console.log(colorfulMessage);
};
