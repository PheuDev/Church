// ============================================================
// ErrorBoundary — évite la page blanche totale en cas d'erreur
// de rendu : affiche un message lisible + bouton de rechargement
// ============================================================
import React from 'react';
import { Alert } from './ui.jsx';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // Trace complète en console pour le diagnostic (F12)
    console.error('[AD Gestion] Erreur de rendu :', error, info);
  }

  componentDidUpdate(prevProps) {
    // Réinitialise l'état d'erreur quand la route change
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null, info: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="page">
        <div className="page-header">
          <div className="page-header-text">
            <div>
              <h1>Une erreur est survenue</h1>
              <p>Cette page n'a pas pu s'afficher.</p>
            </div>
          </div>
        </div>

        <Alert tone="error">
          {error?.message || String(error)}
        </Alert>

        <details className="error-details">
          <summary>Détails techniques</summary>
          <pre>{(this.state.info?.componentStack || '').trim() || error?.stack || ''}</pre>
        </details>

        <div className="button-row">
          <button type="button" className="btn btn-primary" onClick={() => this.setState({ error: null, info: null })}>
            Réessayer
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
            Recharger la page
          </button>
          <a className="btn btn-ghost" href="/">Retour au tableau de bord</a>
        </div>
      </div>
    );
  }
}
