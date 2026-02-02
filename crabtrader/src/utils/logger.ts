export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

export interface Logger {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

const serializeMeta = (meta?: Record<string, unknown>) => {
  if (!meta || Object.keys(meta).length === 0) return "";
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [meta-unserializable]";
  }
};

export const createLogger = (level: LogLevel): Logger => {
  const threshold = LEVEL_WEIGHT[level];

  const log =
    (logLevel: LogLevel) =>
    (message: string, meta?: Record<string, unknown>) => {
      if (LEVEL_WEIGHT[logLevel] < threshold) return;
      const timestamp = new Date().toISOString();
      const payload = `${timestamp} [${logLevel.toUpperCase()}] ${message}${serializeMeta(meta)}`;
      if (logLevel === "error") {
        console.error(payload);
      } else if (logLevel === "warn") {
        console.warn(payload);
      } else {
        console.log(payload);
      }
    };

  return {
    debug: log("debug"),
    info: log("info"),
    warn: log("warn"),
    error: log("error")
  };
};
