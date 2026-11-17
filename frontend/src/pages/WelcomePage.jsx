import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import BrandMark from '../components/BrandMark';

const suggestions = [
  'Explain recursion with a short C++ example',
  'Who made you?',
  'Help me plan a 7-day DSA revision schedule',
  'Process aur thread mein kya difference hai?',
];

export default function WelcomePage() {
  const { user } = useAuth();
  const { startChat } = useOutletContext();
  const [busy, setBusy] = useState(false);

  const start = async (prompt) => {
    if (busy) return;
    setBusy(true);
    await startChat(prompt);
    setBusy(false);
  };

  return (
    <div className="custom-scroll flex h-full flex-col items-center overflow-y-auto px-6 py-10">
      <div className="my-auto w-full max-w-2xl text-center">
        <BrandMark size={84} className="mx-auto animate-bob" />
        <h1 className="mt-7 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Kya help chahiye, <span className="text-haldi-deep dark:text-haldi">{user?.first_name || 'dost'}</span>?
        </h1>
        <p className="mt-3 text-muted">Ask in English or Hinglish. You can attach an image too.</p>

        <div className="mt-9 grid gap-3 text-left sm:grid-cols-2">
          {suggestions.map((prompt, i) => (
            <button
              key={prompt}
              onClick={() => start(prompt)}
              disabled={busy}
              className={`group rounded-xl border-2 border-ink bg-paper-2 px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:bg-haldi hover:text-ink disabled:opacity-60 dark:border-ink-4 dark:bg-ink-2 dark:hover:border-ink ${
                i % 2 ? 'sm:rotate-[0.6deg]' : 'sm:-rotate-[0.6deg]'
              } hover:rotate-0`}
            >
              <span className="mr-1.5 font-mono text-chili group-hover:text-ink">&gt;</span>
              {prompt}
            </button>
          ))}
        </div>

        <button
          onClick={() => start()}
          disabled={busy}
          className="sticker mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-haldi px-5 py-2.5 font-display text-sm font-bold text-ink transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Plus size={16} strokeWidth={3} />
          New chat
        </button>
      </div>
    </div>
  );
}
