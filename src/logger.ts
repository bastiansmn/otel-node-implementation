// logger.js
import winston from 'winston';
import { context, trace, propagation } from '@opentelemetry/api';

// --- Format personnalisé : injection trace/span/user depuis OpenTelemetry ---
const otelFormat = winston.format((info) => {
  const ctx = context.active();
  const span = trace.getSpan(ctx);
  const baggage = propagation.getBaggage(ctx);

  if (span) {
    const spanContext = span.spanContext();
    info.trace_id = spanContext?.traceId ?? null;
    info.span_id = spanContext?.spanId ?? null;
  } else {
    info.trace_id = null;
    info.span_id = null;
  }

  const userId = baggage?.getEntry('userID')?.value;
  info.user_id = userId ?? null;

  let rootApplication = baggage?.getEntry("rootApplication")?.value ?? null;
  info.root_application = rootApplication ?? process.env.OTEL_SERVICE_NAME ?? null;

  return info;
});


// Format personnalisé pour inclure fichier et ligne
const fileLineFormat = winston.format((info) => {
  const stack = new Error().stack?.split('\n');
  if (stack && stack.length > 3) {
    // Ligne 3 ou 4 de la stack correspond à l'appelant
    const match = stack[3].match(/\((.*):(\d+):(\d+)\)/);
    if (match) {
      const [, file, line] = match;
      info.filename = file;
      info.lineno = line;
    }
  }
  return info;
});


// --- Configuration du logger ---
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ alias: "ts", format: 'YYYY-MM-DD HH:mm:ss,SSS' }),
    otelFormat(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// --- Redéfinir console.* pour rediriger vers Winston ---
function formatArg(arg) {
  if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

export default function setupLogger() {
  console.log = (...args) => logger.info(args.map(formatArg).join(' '));
  console.info = (...args) => logger.info(args.map(formatArg).join(' '));
  console.warn = (...args) => logger.warn(args.map(formatArg).join(' '));
  console.error = (...args) => logger.error(args.map(formatArg).join(' '));
  console.debug = (...args) => logger.debug(args.map(formatArg).join(' '));

  return logger
};
