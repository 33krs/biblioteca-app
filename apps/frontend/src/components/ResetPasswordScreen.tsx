import { useState } from 'react';
import * as authApi from '../lib/auth';

export default function ResetPasswordScreen({ token, onDone }: { token: string; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-lg p-6 bg-panel">
        <h1 className="font-display text-2xl font-semibold text-paper mb-1">Mi biblioteca</h1>

        {success ? (
          <>
            <p className="font-sans text-sm text-muted mb-6">Tu contraseña se actualizó correctamente.</p>
            <button
              type="button"
              onClick={onDone}
              className="font-sans w-full py-2 rounded text-sm font-medium bg-brass text-ink"
            >
              Ir a iniciar sesión
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <p className="font-sans text-sm text-muted mb-6">Elige una contraseña nueva.</p>

            <label className="font-sans text-xs block mb-1 text-muted">Contraseña nueva</label>
            <input
              aria-label="Contraseña nueva"
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
              {submitting ? 'Un momento...' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
