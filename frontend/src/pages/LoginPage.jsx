import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowUpRight, CircleAlert, Github, LoaderCircle } from 'lucide-react';
import BrandMark, { Wordmark } from '../components/BrandMark';
import DemoChat from '../components/DemoChat';
import api, { errorMessage } from '../services/api';
import { useAuth } from '../context/useAuth';

const PORTFOLIO_URL = 'https://edward7780.vercel.app';
const GITHUB_URL = 'https://github.com/EDWARD-012/RGPT-Chat-App';

const phrases = [
  'samjha do',
  'yeh error kya hai?',
  'dry run karke dikhao',
  'C++ mein likh do',
  'time complexity batao',
  'optimize karo',
  'segfault kyun?',
  'edge cases?',
];

const features = [
  {
    title: 'Hinglish mein jawab',
    text: 'Answers in a mix of Hindi and English, the way a friend would explain it.',
    className: 'bg-haldi text-ink -rotate-2',
  },
  {
    title: 'C++ by default',
    text: 'Highlighted code with a copy button. Ask for Python or JavaScript and it switches.',
    className: 'bg-paper text-ink rotate-[1.5deg]',
  },
  {
    title: 'Screenshot? Bhej do',
    text: 'Attach an image of an error, a diagram or a question and ask about it.',
    className: 'bg-chili text-ink -rotate-1',
  },
  {
    title: 'History stays',
    text: 'Chats are saved to your account. Pin, rename, search or delete them from the sidebar.',
    className: 'bg-ink-3 text-paper rotate-2 border-haldi',
  },
];

export default function LoginPage() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  if (token) return <Navigate to="/" replace />;

  const handleSuccess = async ({ credential }) => {
    setSigningIn(true);
    setError('');
    try {
      const res = await api.post('auth/google/', { token: credential });
      login(res.data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Sign-in failed. Please try again.'));
      setSigningIn(false);
    }
  };

  return (
    <div className="custom-scroll h-full overflow-y-auto overflow-x-hidden bg-ink text-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="/login" className="group flex items-center gap-2.5" aria-label="RGPT home">
          <BrandMark size={38} className="transition-transform duration-300 group-hover:-rotate-6" />
          <Wordmark className="text-xl" />
        </a>
        <nav className="flex items-center gap-4 font-mono text-xs sm:gap-6 sm:text-sm">
          <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-paper/70 hover:text-haldi">
            by EDWARD7780
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-paper/70 hover:text-haldi">
            <Github size={15} aria-hidden="true" />
            <span className="hidden sm:inline">source</span>
          </a>
        </nav>
      </header>

      <main className="mx-auto grid max-w-6xl gap-14 px-6 pb-16 pt-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12 lg:pt-12">
        <section className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-haldi">// gemini · django · react</p>
          <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">
            Bug mila?
            <br />
            <span className="relative inline-block text-haldi">
              Pooch le.
              <svg
                viewBox="0 0 300 20"
                preserveAspectRatio="none"
                className="absolute -bottom-3 left-0 h-4 w-full text-chili"
                aria-hidden="true"
              >
                <path
                  d="M3 14c30-9 55-9 80-2s50 8 75-1 52-9 78-1 40 6 61-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-paper/75">
            RGPT is a coding buddy that answers in Hinglish. Paste an error, ask it to explain a concept or send a
            screenshot. It runs on Google Gemini, and your chats are saved when you sign in.
          </p>

          <div className="mt-8 flex min-h-[44px] flex-wrap items-center gap-4">
            {!googleConfigured ? (
              <p className="text-sm text-haldi">Google sign-in isn't configured for this deployment yet.</p>
            ) : signingIn ? (
              <p className="flex items-center gap-2 text-paper/80">
                <LoaderCircle className="h-5 w-5 animate-spin text-haldi" aria-hidden="true" />
                Signing you in...
              </p>
            ) : (
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => setError('Google sign-in was cancelled or failed. Please try again.')}
                theme="outline"
                shape="pill"
                size="large"
                text="continue_with"
              />
            )}
            <span className="font-mono text-xs text-paper/50">free demo · no setup</span>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 flex max-w-md items-start gap-2 rounded-lg border border-chili/50 bg-chili/10 px-3 py-2 text-sm text-paper"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-chili" aria-hidden="true" />
              {error}
            </p>
          )}
        </section>

        <section aria-label="Example conversation" className="min-w-0">
          <DemoChat />
        </section>
      </main>

      <div className="overflow-hidden border-y-2 border-ink-4 bg-haldi py-3 text-ink" aria-hidden="true">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap font-mono text-sm font-semibold">
          {[...phrases, ...phrases].map((phrase, i) => (
            <span key={i} className="flex items-center gap-8">
              {phrase}
              <span className="text-chili">✱</span>
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="max-w-lg font-display text-3xl font-bold leading-tight tracking-tight">
          What it's good at
        </h2>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <li
              key={feature.title}
              className={`rounded-2xl border-2 border-ink p-5 transition-transform duration-300 [box-shadow:4px_4px_0_0_var(--color-ink-4)] hover:-translate-y-1 hover:rotate-0 ${feature.className}`}
            >
              <h3 className="font-display text-lg font-bold leading-snug">{feature.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed opacity-85">{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-ink-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono text-xs text-paper/60">
          <p>
            Built by{' '}
            <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer" className="text-paper underline decoration-haldi underline-offset-4 hover:text-haldi">
              Ravi Kumar Gupta (EDWARD7780)
            </a>
          </p>
          <div className="flex items-center gap-5">
            <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer" className="hover:text-haldi">
              Portfolio
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-haldi">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
