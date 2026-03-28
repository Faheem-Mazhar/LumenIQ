const DEFAULT_CHAINLIT_URL = 'http://localhost:8000'; // Localhost URL for Chainlit for now. Change this later to the production URL.

function normalizeUrl(url?: string) {
  return (url ?? DEFAULT_CHAINLIT_URL).replace(/\/$/, '');
}

const CHAINLIT_URL = normalizeUrl(import.meta.env.VITE_CHAINLIT_URL);

export function ChatbotPage() {
  return (
    <div className="relative font-switzer text-slate-900">
      <BackgroundBlobs />
      <main className="mx-auto flex min-h-[calc(100vh-220px)] max-w-[96rem] flex-col gap-6 px-4 pt-10 pb-16">
        <Header />
        <section className="flex flex-1 min-h-[min(720px,calc(100vh-280px))] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
          <iframe
            title="LumenIQ Chainlit assistant."
            src={CHAINLIT_URL}
            className="flex-1 w-full min-h-[560px] border-0 bg-white"
            allow="clipboard-read; clipboard-write"
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

function Header() {
  return (
    <div className="space-y-2">
      <h2 className="text-3xl font-outfit text-slate-900">AI Assistant</h2>
      <p className="text-slate-600">
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
        LumenIQ AI Powered Assistant
        </code>{' '}
      </p>
    </div>
  );
}
