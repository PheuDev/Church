// ============================================================
// Changement de mot de passe (première connexion)
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth.jsx';
import { Alert, Button, Field, Input, Card } from '../components/ui.jsx';
import { Cross, KeyRound } from 'lucide-react';

export function ChangePasswordPage() {
  const { changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(ev) {
    ev.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirm) {
      setError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Changement impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card narrow">
        <div className="auth-brand">
          <div className="brand-mark big"><Cross size={32} /></div>
          <h1>Changer le mot de passe</h1>
          <p>Pour des raisons de sécurité, vous devez définir un nouveau mot de passe.</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="Mot de passe actuel" required>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <Field label="Nouveau mot de passe" required hint="8 caractères minimum.">
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Confirmer le nouveau mot de passe" required>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </Field>
          <div className="auth-actions">
            <Button type="submit" variant="primary" loading={loading} className="btn-block" icon="Check">Valider</Button>
            <Button variant="ghost" className="btn-block" onClick={() => { logout(); navigate('/login'); }}>Se déconnecter</Button>
          </div>
        </form>
      </div>
    </div>
  );
}