import { useState } from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import { useBusiness } from '../auth/hooks/useBusiness';

const DEFAULT_CHAINLIT_URL = 'http://localhost:8000'; // Localhost URL for Chainlit for now. Change this later to the production URL.

function normalizeUrl(url?: string) {
  return (url ?? DEFAULT_CHAINLIT_URL).replace(/\/$/, '');
}

const CHAINLIT_URL = normalizeUrl(import.meta.env.VITE_CHAINLIT_URL);

export function ChatbotPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const { user } = useAuth();
  const { activeBusiness, businesses } = useBusiness();
  const businessName = activeBusiness?.name ?? businesses[0]?.name ?? 'Your Business';

  const chainlitSrc = (() => {
    const url = new URL(CHAINLIT_URL);
    if (user?.id) url.searchParams.set('user_id', user.id);
    if (activeBusiness?.id) url.searchParams.set('business_id', activeBusiness.id);
    return url.toString();
  })();

  return (
    <div className="relative font-switzer text-slate-900">
      <BackgroundBlobs />
      <main className="mx-auto flex min-h-[calc(100vh-220px)] max-w-[96rem] flex-col gap-6 px-4 pt-10 pb-16">
        <Header businessName={businessName} />
        <section className="relative flex flex-1 min-h-[min(720px,calc(100vh-280px))] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Loading AI Assistant...</p>
              </div>
            </div>
          )}
          <iframe
            title="LumenIQ Chainlit assistant."
            src={chainlitSrc}
            className="flex-1 w-full min-h-[560px] border-0 bg-white"
            allow="clipboard-read; clipboard-write"
            onLoad={() => setIframeLoaded(true)}
          />
        </section>
      </main>
    </div>
  );
}

function BackgroundBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-slate-200/50 blur-3xl" />
    </div>
  );
}

function Header({ businessName }: { businessName: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-3xl font-outfit text-slate-900">The <span className="text-blue-600">{businessName}</span> Engine</h2>
      <h3 className="text-xl font-outfit text-slate-900">Our AI Powered Assistant</h3>
      <p className="text-slate-600">
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
        </code>{' '}
      </p>
    </div>
  );
}
