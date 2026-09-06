import rateLimit from 'express-rate-limit';

// Los tests de integración golpean estos endpoints muchas veces seguidas
// desde la misma IP; se desactiva ahí con DISABLE_RATE_LIMIT (ver .env.test).
function isDisabled(): boolean {
  return process.env.DISABLE_RATE_LIMIT === 'true';
}

export function makeLimiter(options: { windowMs: number; max: number; message: string }) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: isDisabled,
    message: { error: options.message },
  });
}

// Registro y reseteo de contraseña: generosos, pero acotan scripts que
// prueben emails en cadena.
export const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Demasiadas solicitudes, probá de nuevo en unos minutos',
});

// Login: el objetivo principal es frenar fuerza bruta sobre contraseñas.
export const loginLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos de inicio de sesión, probá de nuevo en unos minutos',
});

// Forgot-password: cada solicitud manda un email/log, así que va más
// restringido para no poder usarlo para spamear a un usuario.
export const forgotPasswordLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Demasiadas solicitudes de reseteo, probá de nuevo más tarde',
});
