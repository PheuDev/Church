// ============================================================
// Application — routes et garde d'authentification
// ============================================================
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/auth.jsx';
import { AppLayout } from './layout/AppLayout.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { RESOURCES } from './api/resources.js';
import { GenericResourcePage } from './components/GenericResourcePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ChangePasswordPage } from './pages/ChangePasswordPage.jsx';
import { PersonPage } from './pages/PersonPage.jsx';
import { AttendancePage } from './pages/AttendancePage.jsx';
import { DocumentsPage } from './pages/DocumentsPage.jsx';
import { ChurchPage } from './pages/ChurchPage.jsx';
import { PageHeader, Alert, Spinner } from './components/ui.jsx';
import { ToastProvider } from './components/Toast.jsx';

// Chargés à la demande : Recharts (graphiques) ne pèse plus dans le bundle
// initial, utilisé uniquement par le tableau de bord et la finance.
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx').then((m) => ({ default: m.DashboardPage })));
const FinancePage = lazy(() => import('./pages/FinancePage.jsx').then((m) => ({ default: m.FinancePage })));

const SPECIFIC = {
  persons: () => <PersonPage />,
};

function ProtectedRoutes() {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace />;
  if (session.user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <AppLayout>
      <ErrorBoundary resetKey={location.pathname}>
        <Suspense fallback={<div className="page"><Spinner label="Chargement…" /></div>}>
        <Routes>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/" element={<DashboardPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/church" element={<ChurchPage />} />
          <Route path="/activities/:id/attendance" element={<AttendancePage />} />
          {Object.entries(RESOURCES).map(([key, res]) => (
            <Route
              key={key}
              path={`/${key}`}
              element={SPECIFIC[key] ? SPECIFIC[key]() : <GenericResourcePage resource={res} />}
            />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  );
}

function NotFoundPage() {
  return (
    <div className="page">
      <PageHeader title="Page introuvable" />
      <Alert tone="warning">La page demandée n'existe pas ou vous n'y avez pas accès.</Alert>
    </div>
  );
}

export function App() {
  const location = useLocation();
  return (
    <ToastProvider>
    <ErrorBoundary resetKey={`root:${location.pathname}`}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<ProtectedRoutes />} />
      </Routes>
    </ErrorBoundary>
    </ToastProvider>
  );
}