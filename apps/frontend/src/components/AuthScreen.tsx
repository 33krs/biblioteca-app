import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthScreen() {
  const { login, register } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg p-6 bg-panel">
        <h1 className="font-display text-2xl font-semibold text-paper mb-1">Mi biblioteca</h1>
        <p className="font-sans text-sm text-muted mb-6">
          {mode === 'login' ? 'Inicia sesión para ver tu estantería.' : 'Crea una cuenta para empezar tu estantería.'}
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

        {error && <p className="font-sans text-xs text-red-300 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="font-sans w-full py-2 rounded text-sm font-medium bg-brass text-ink disabled:opacity-60"
        >
          {submitting ? 'Un momento...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
          className="font-sans w-full text-xs text-muted underline mt-4"
        >
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </form>
    </div>
  );
}
