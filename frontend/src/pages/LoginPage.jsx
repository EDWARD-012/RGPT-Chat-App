import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { CircleAlert, CodeXml, Github, History, ImageIcon, Languages, LoaderCircle } from 'lucide-react';
import Logo from '../assets/logo.svg?react';
import api, { errorMessage } from '../services/api';
import { useAuth } from '../context/useAuth';

const features = [
  {
    icon: Languages,
    title: 'Answers in Hinglish',
    text: 'A friendly mix of Hindi and English, powered by Google Gemini.',
  },
  {
    icon: CodeXml,
    title: 'Code help',
    text: 'Syntax-highlighted code with a copy button. C++ unless you ask for another language.',
  },
  {
    icon: ImageIcon,
    title: 'Questions about images',
    text: 'Attach a screenshot or photo and ask about it.',
  },
  {
    icon: History,
    title: 'Saved history',
    text: 'Chats stay in your account. Rename, pin or delete them from the sidebar.',
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
    <div className="relative min-h-full overflow-hidden bg-gradient-to-br from-violet-800 via-indigo-800 to-blue-700 text-white">
      <div className="pointer-events-none absolute -top-40 -right-32 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 h-[28rem] w-[28rem] rounded-full bg-sky-400/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col px-6 py-8">
        <header className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <Logo className="h-5 w-6 text-white" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">RGPT</span>
        </header>

        <main className="flex flex-1 flex-col justify-center py-12">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-blue-100 ring-1 ring-white/20">
              React · Django REST Framework · Gemini
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Your coding friend that talks in Hinglish
            </h1>
            <p className="mt-4 text-lg text-blue-100/90">
              Ask questions, debug code or share an image. Sign in with Google and your chats are saved for next
              time.
            </p>

            <div className="mt-8 flex min-h-[44px] items-center gap-4">
              {!googleConfigured ? (
                <p className="text-sm text-amber-200">Google sign-in isn't configured for this deployment yet.</p>
              ) : signingIn ? (
                <p className="flex items-center gap-2 text-blue-100">
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Signing you in...
                </p>
              ) : (
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => setError('Google sign-in was cancelled or failed. Please try again.')}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  text="continue_with"
                />
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 flex max-w-md items-start gap-2 rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-100 ring-1 ring-red-300/40"
              >
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}
          </div>

          <ul className="mt-14 grid gap-4 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-sm">
                  <Icon className="h-5 w-5 text-blue-200" aria-hidden="true" />
                  <h2 className="mt-3 font-semibold">{feature.title}</h2>
                  <p className="mt-1 text-sm text-blue-100/80">{feature.text}</p>
                </li>
              );
            })}
          </ul>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-6 text-sm text-blue-100/80">
          <p>Built by Ravi Kumar Gupta (EDWARD7780)</p>
          <a
            href="https://github.com/EDWARD-012/RGPT-Chat-App"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-white"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            Source on GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}
