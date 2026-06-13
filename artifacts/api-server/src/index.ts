import { spawn } from "child_process";
import path from "path";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "3000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Start FastAPI background server
const currentDir = import.meta.dirname;
const pythonPath = path.resolve(currentDir, "../../../mess-model/.venv/bin/python");
const backendAppPath = path.resolve(currentDir, "../../../backend/app.py");

logger.info({ pythonPath, backendAppPath }, "Launching FastAPI background server");

const pyProcess = spawn(pythonPath, [backendAppPath], {
  stdio: "inherit",
});

pyProcess.on("error", (err) => {
  logger.error({ err }, "Failed to start FastAPI background process");
});

pyProcess.on("exit", (code, signal) => {
  logger.warn({ code, signal }, "FastAPI background process exited");
});

// Clean up child process when parent exits
process.on("exit", () => {
  pyProcess.kill();
});

const cleanup = () => {
  pyProcess.kill();
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
