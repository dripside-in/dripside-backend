/* Imported Modules */
import "colors";

/* Custom Imported Modules */
import { LoggerParams } from "../types";
import config from "./default";

/* Config Variable */
const { SERVER_NODE_ENV, SERVER_DEBUG_LOG_STATUS } = config.SERVER;
export const serverLogs: string[] = [];

const info: LoggerParams = (namespace, message, additional) => {
  const currentLog = `[${getTimeStamp()}] [${namespace}] [INFO] ${message}`;
  serverLogs.push(currentLog);
  if (additional) {
    console.info(currentLog.green, additional);
  } else {
    console.info(currentLog.green);
  }
};

const error: LoggerParams = (namespace, message, additional) => {
  const timestamp: string = `${getTimeStamp()}`;
  const currentLog = `[${timestamp}] [${namespace}] [ERROR] ${message}`;
  serverLogs.push(currentLog);
  if (additional) {
    console.error(currentLog.red, additional);
  } else {
    console.error(currentLog.red);
  }
};

const debug: LoggerParams = (namespace, message, additional) => {
  const timestamp: string = `${getTimeStamp()}`;
  const currentLog = `[${timestamp}] [${namespace}] [DEBUG] ${message}`;
  serverLogs.push(currentLog);
  if (SERVER_NODE_ENV === "development" || SERVER_DEBUG_LOG_STATUS === "ENABLE") {
    if (additional) {
      console.debug(currentLog.blue, additional);
    } else {
      console.debug(currentLog.blue);
    }
  }
};

const warn: LoggerParams = (namespace, message, additional) => {
  const timestamp: string = `${getTimeStamp()}`;
  const currentLog = `[${timestamp}] [${namespace}] [WARN] ${message}`;
  serverLogs.push(currentLog);
  if (additional) {
    console.warn(currentLog.yellow, additional);
  } else {
    console.warn(currentLog.yellow);
  }
};

const getTimeStamp = (): string => {
  return new Date().toLocaleString();
};

export default { info, error, debug, warn };
