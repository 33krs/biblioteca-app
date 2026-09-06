import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthScreen() {
  const { login, register, forgotPassword } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await register(email, password, name);
      } else {
        await forgotPassword(email);
        setInfo('Si el email existe, te enviamos instrucciones para reestablecer la contraseña.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next: 'login' | 'register' | 'forgot') {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg p-6 bg-panel">
        <h1 className="font-display text-2xl font-semibold text-paper mb-1">Mi biblioteca</h1>
        <p className="font-sans text-sm text-muted mb-6">
          {mode === 'login' && 'Inicia sesión para ver tu estantería.'}
          {mode === 'register' && 'Crea una cuenta para empezar tu estantería.'}
          {mode === 'forgot' && 'Te enviamos un link para elegir una contraseña nueva.'}
        </p>

        {mode === 'register' && (
          <>
            <label className="font-sans text-xs block mb-1 text-muted">Nombre (opcional)</label>
            <input
              aria-label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-sans w-full px-3 py-2 rounded border text-sm mb-3 bg-ink text-paper border-border focus:outline-none"
            />
          </>
        )}

        <label className="font-sans text-xs block mb-1 text-muted">Email</label>
        <input
          aria-label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="font-sans w-full px-3 py-2 rounded border text-sm mb-3 bg-ink text-paper border-border focus:outline-none"
        />

        {mode !== 'forgot' && (
          <>
            <label className="font-sans text-xs block mb-1 text-muted">Contraseña</label>
            <input
              aria-label="Contraseña"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-sans w-full px-3 py-2 rounded border text-sm mb-4 bg-ink text-paper border-border focus:outline-none"
            />
          </>
        )}

        {error && <p className="font-sans text-xs text-red-300 mb-4">{error}</p>}
        {info && <p className="font-sans text-xs text-muted mb-4">{info}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="font-sans w-full py-2 rounded text-sm font-medium bg-brass text-ink disabled:opacity-60"
        >
          {submitting
            ? 'Un momento...'
            : mode === 'login'
              ? 'Entrar'
              : mode === 'register'
                ? 'Crear cuenta'
                : 'Enviar instrucciones'}
        </button>

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => switchMode('forgot')}
            className="font-sans w-full text-xs text-muted underline mt-4"
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}

        <button
          type="button"
          onClick={() => switchMode(mode === 'register' ? 'login' : mode === 'forgot' ? 'login' : 'register')}
          className="font-sans w-full text-xs text-muted underline mt-2"
        >
          {mode === 'register' && '¿Ya tienes cuenta? Inicia sesión'}
          {mode === 'forgot' && 'Volver a iniciar sesión'}
          {mode === 'login' && '¿No tienes cuenta? Regístrate'}
        </button>
      </form>
    </div>
  );
}
