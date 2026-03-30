import { useEffect, useState, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import { logout } from './store/authSlice';
import { useAuth } from './hooks/useAuth';

interface SessionRestorerProps {
  children: ReactNode;
}

/**
 * SessionRestorer sits at the top of the app (inside <Provider>) and
 * handles the gap between "tokens exist in localStorage" and "Redux has
 * fully hydrated user + business data".
 *
 * Flow:
 *  - On first render, authSlice.initialState has already read tokens from
 *    localStorage (isAuthenticated: true, token: "...", user: null).
 *  - If the user is authenticated but user data is missing, we fire
 *    fetchProfileAndBusinesses() once to populate Redux.
 *  - While restoring we show a full-screen spinner so child routes never
 *    render with a partial state.
 *  - If the fetch fails (truly expired token, revoked session), we dispatch
 *    logout() to clear everything and let the user hit the login page.
 */
export function SessionRestorer({ children }: SessionRestorerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);
  const { fetchProfileAndBusinesses } = useAuth();

  // true while we are mid-restore; avoids rendering protected routes early
  const [restoring, setRestoring] = useState(() => {
    // Only block render if we have a persisted token but no user yet
    return isAuthenticated && !user;
  });

  useEffect(() => {
    // Nothing to restore: either not authenticated, or user is already loaded
    if (!isAuthenticated || user) {
      setRestoring(false);
      return;
    }

    let cancelled = false;

    async function restore() {
      try {
        await fetchProfileAndBusinesses(token ?? '');
      } catch {
        // Tokens are expired or revoked — clear everything
        dispatch(logout());
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }

    restore();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount only

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Restoring session…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
