import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${stack || message}${metaString}`;
  })
);

// Define different transports based on environment
const transports = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
}

// Create the default logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Security audit logger for sensitive operations
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'security.log'),
      })
    ] : [])
  ],
});

// Create logger factory function
export const createLogger = (module: string) => {
  return {
    error: (message: string, meta?: any) => logger.error(message, { module, ...meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { module, ...meta }),
    info: (message: string, meta?: any) => logger.info(message, { module, ...meta }),
    http: (message: string, meta?: any) => logger.http(message, { module, ...meta }),
    debug: (message: string, meta?: any) => logger.debug(message, { module, ...meta }),
  };
};

// Security-specific logger
export const createSecurityLogger = (module: string) => {
  return {
    info: (message: string, meta?: any) => securityLogger.info(message, { module, ...meta }),
    warn: (message: string, meta?: any) => securityLogger.warn(message, { module, ...meta }),
    error: (message: string, meta?: any) => securityLogger.error(message, { module, ...meta }),
  };
};

// Express request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'http';
    
    logger.log(logLevel, `${req.method} ${req.originalUrl}`, {
      module: 'http',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId,
      username: req.user?.username,
    });
  });
  
  next();
};

// Export default logger for general use
export default logger;