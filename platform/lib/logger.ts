// Minimal structured logger for the Foundation Phase.
//
// Intentionally simple (no external logging service dependency yet) but with
// a consistent shape so it can be swapped for a real provider (e.g. Pino,
// Datadog, Sentry) later without touching call sites.
//
// IMPORTANT: never pass passwords, tokens, card data, or full webhook
// payloads to this logger. Prefer ids over raw sensitive payloads.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const REDACT_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'secret',
  'authorization',
  'cardNumber',
  'cvv',
]);

function redact(context?: LogContext): LogContext | undefined {
  if (!context) return context;
  const safe: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    safe[key] = REDACT_KEYS.has(key) ? '[redacted]' : value;
  }
  return safe;
}

function write(level: LogLevel, scope: string, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    scope,
    message,
    ...redact(context),
  };

  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

// Creates a logger bound to a scope, e.g. `createLogger('auth')`,
// `createLogger('billing.webhook')`.
export function createLogger(scope: string) {
  return {
    debug: (message: string, context?: LogContext) => write('debug', scope, message, context),
    info: (message: string, context?: LogContext) => write('info', scope, message, context),
    warn: (message: string, context?: LogContext) => write('warn', scope, message, context),
    error: (message: string, context?: LogContext) => write('error', scope, message, context),
  };
}

export const logger = createLogger('app');
