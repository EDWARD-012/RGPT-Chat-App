import { useEffect, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import BrandMark from './BrandMark';
import TypingLoader from './TypingLoader';

// Scripted examples for the landing page, so visitors can see what RGPT does
// before signing in. The "Who made you?" answer is the exact line from the
// system prompt.
const demos = [
  {
    label: 'Debug',
    user: 'bhai yeh code segfault kyun de raha hai? 😩',
    reply: 'Arre chill 😎 Loop `i <= n` tak chal raha hai, par array mein sirf `n` elements hain. Last round mein `arr[n]` out of bounds ho jata hai. Condition badal do:',
    code: 'for (int i = 0; i < n; i++) {\n    sum += arr[i];\n}',
  },
  {
    label: 'Explain',
    user: 'recursion simple language mein samjhao',
    reply: 'Recursion matlab function khud ko chhote input ke saath call karta hai, jab tak base case na aa jaye. Factorial dekho:',
    code: 'int fact(int n) {\n    if (n <= 1) return 1;   // base case\n    return n * fact(n - 1);\n}',
  },
  {
    label: 'Who made you?',
    user: 'Who made you?',
    reply: 'I was created by Ravi Kumar Gupta (EDWARD7780).',
  },
];

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setReduced(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// Renders `inline code` inside the reply text.
function withInlineCode(text) {
  return text.split('`').map((part, i) =>
    i % 2 ? (
      <code key={i} className="rounded bg-paper/10 px-1 py-0.5 font-mono text-[0.85em] text-haldi">
        {part}
      </code>
    ) : (
      part
    ),
  );
}

export default function DemoChat() {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  // Bumped on every chip click so picking the current demo replays it.
  const [run, setRun] = useState(0);
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState('typing'); // typing | thinking | replying | done
  const [shownWords, setShownWords] = useState(0);
  const demo = demos[index];
  const words = demo.reply.split(' ');

  useEffect(() => {
    if (reduced) {
      setTyped(demo.user.length);
      setShownWords(demo.reply.split(' ').length);
      setPhase('done');
      return;
    }

    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    setTyped(0);
    setShownWords(0);
    setPhase('typing');

    let t = 500;
    for (let i = 1; i <= demo.user.length; i++) {
      at(t, () => setTyped(i));
      t += 42;
    }
    t += 350;
    at(t, () => setPhase('thinking'));
    t += 1200;
    at(t, () => setPhase('replying'));
    const count = demo.reply.split(' ').length;
    for (let i = 1; i <= count; i++) {
      at(t, () => setShownWords(i));
      t += 55;
    }
    at(t + 200, () => setPhase('done'));
    if (autoplay) at(t + 4500, () => setIndex((n) => (n + 1) % demos.length));

    return () => timers.forEach(clearTimeout);
  }, [index, run, autoplay, reduced, demo]);

  const sent = phase !== 'typing';

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border-2 border-ink-4 bg-ink-2 [box-shadow:6px_6px_0_0_var(--color-haldi)]">
        <div className="flex items-center gap-2 border-b border-ink-4 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-chili" />
          <span className="h-3 w-3 rounded-full bg-haldi" />
          <span className="h-3 w-3 rounded-full bg-paper-4" />
          <span className="ml-2 font-mono text-xs text-paper/50">example chat</span>
        </div>

        <div className="flex h-[22rem] flex-col justify-end gap-4 p-4 sm:p-5" aria-live="polite">
          {sent && (
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-haldi px-4 py-2.5 text-[15px] font-medium text-ink">
                {demo.user}
              </p>
            </div>
          )}

          {phase === 'thinking' && (
            <div className="flex items-start gap-2.5">
              <BrandMark size={30} animated={false} />
              <div className="rounded-2xl rounded-tl-md bg-ink-3 px-3 py-2">
                <TypingLoader />
              </div>
            </div>
          )}

          {(phase === 'replying' || phase === 'done') && (
            <div className="flex items-start gap-2.5">
              <BrandMark size={30} animated={false} />
              <div className="min-w-0 max-w-[88%] rounded-2xl rounded-tl-md bg-ink-3 px-4 py-2.5 text-[15px] leading-relaxed text-paper">
                <p>{withInlineCode(words.slice(0, shownWords).join(' '))}</p>
                {demo.code && phase === 'done' && (
                  <pre className="mt-3 overflow-x-auto rounded-lg border border-ink-4 bg-ink p-3 font-mono text-[12.5px] leading-relaxed text-haldi">
                    {demo.code}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-ink-4 p-3">
          <div className="flex h-10 flex-1 items-center rounded-xl bg-ink-3 px-3 text-sm">
            {!sent && typed > 0 ? (
              <span className="truncate text-paper">
                {demo.user.slice(0, typed)}
                <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-caret bg-haldi" />
              </span>
            ) : (
              <span className="text-paper/40">Message RGPT...</span>
            )}
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-haldi text-ink">
            <SendHorizontal size={18} />
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-xs text-paper/50">try:</span>
        {demos.map((d, i) => (
          <button
            key={d.label}
            onClick={() => {
              setAutoplay(false);
              setIndex(i);
              setRun((r) => r + 1);
            }}
            className={`rounded-full border-2 px-3 py-1 font-mono text-xs transition ${
              i === index
                ? 'border-haldi bg-haldi text-ink'
                : 'border-ink-4 text-paper/80 hover:border-haldi hover:text-haldi'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
