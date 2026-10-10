// ============================================================
// Page de connexion
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth.jsx';
import { Alert, Button, Field, Input } from '../components/ui.jsx';
import { useI18n } from '../lib/i18n.jsx';

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(ev) {
    ev.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email.trim(), password);
      if (user.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || t('Connexion impossible.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark big"><img src="/logo-ad.svg" alt="AD Gestion" style={{ width: 52, height: 52, objectFit: 'contain' }} /></div>
          <h1>AD Gestion</h1>
          <p>{t("Plateforme de gestion opérationnelle d'église")}</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <Alert tone="error">{error}</Alert>}
          <Field label={t('E-mail ou pseudo')} required>
            <Input type="text" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </Field>
          <Field label={t('Mot de passe')} required>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <div className="auth-actions">
            <Button type="submit" variant="primary" loading={loading} className="btn-block">{t('Se connecter')}</Button>
          </div>
        </form>
        {import.meta.env.DEV && (
          <p className="auth-hint">Comptes de démonstration : <code>admin@ad-yaounde.org</code> / <code>ChangeMe123!</code></p>
        )}
      </div>
    </div>
  );
}