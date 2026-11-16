import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import Logo from '../assets/logo.svg?react';

const suggestions = [
  'Explain recursion with a short C++ example',
  'Who made you?',
  'Help me plan a 7-day DSA revision schedule',
  'What is the difference between a process and a thread?',
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
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-600/20">
          <Logo className="h-8 w-10 text-white" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Hi {user?.first_name || 'there'}, what can I help with?
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Ask in English or Hinglish. You can attach an image too.
        </p>

        <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
          {suggestions.map((prompt) => (
            <button
              key={prompt}
              onClick={() => start(prompt)}
              disabled={busy}
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 transition hover:border-violet-400 hover:bg-violet-50 disabled:opacity-60 dark:border-gray-800 dark:text-gray-300 dark:hover:border-violet-500/60 dark:hover:bg-violet-950/40"
            >
              {prompt}
            </button>
          ))}
        </div>

        <button
          onClick={() => start()}
          disabled={busy}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          <Plus size={16} />
          New chat
        </button>
      </div>
    </div>
  );
}
