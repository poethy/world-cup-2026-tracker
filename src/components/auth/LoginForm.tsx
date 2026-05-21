import React, { useState } from 'react';
import { supabase } from '../../utils/supabase';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      window.location.href = '/tracker';
    }
  };

  return (
    <>
      <style>{`
        .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .auth-form .field { display: flex; flex-direction: column; gap: 0.4rem; }
        .auth-form label { font-size: 0.875rem; font-weight: 500; color: #374151; }
        .auth-form input {
          padding: 0.65rem 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.95rem;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .auth-form input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.12); }
        .auth-error {
          padding: 0.65rem 0.875rem;
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          border-radius: 6px;
          font-size: 0.85rem;
        }
        .auth-submit {
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .auth-submit:hover:not(:disabled) { opacity: 0.9; }
        .auth-submit:disabled { opacity: 0.55; cursor: not-allowed; }
      `}</style>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>
    </>
  );
}
