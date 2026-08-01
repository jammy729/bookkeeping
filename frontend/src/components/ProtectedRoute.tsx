import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/useAuth';
import { getLoginUrl, replaceLocation } from '../lib/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // The login page lives on the apex zone, so this is a cross-origin URL.
      // react-router's <Navigate> treats string targets as internal paths and
      // would loop forever against the catch-all — a full page navigation is
      // required here.
      replaceLocation(getLoginUrl());
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t('loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // The redirect effect is in flight; render nothing so the protected
    // subtree never flashes on screen.
    return null;
  }

  return <>{children}</>;
}
