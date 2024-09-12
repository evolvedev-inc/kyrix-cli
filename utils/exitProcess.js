import fs from "fs";

/**
 * Function to clean up created files and directories if the process is exited.
 * @param {string} targetPath - The path of the directory to be cleaned up.
 */
export const cleanUpOnExit = (targetPath) => {
  const cleanup = () => {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log(`Cleaned up ${targetPath}`);
    }
    process.exit();
  };

  // Register cleanup functions for different exit scenarios
  process.on("SIGINT", cleanup); // Handle Ctrl+C
  process.on("SIGTERM", cleanup); // Handle termination signals
  process.on("exit", cleanup); // Handle process exit
};
