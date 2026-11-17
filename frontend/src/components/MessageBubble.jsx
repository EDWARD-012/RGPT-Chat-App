import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Clipboard, ClipboardCheck, ImageIcon } from 'lucide-react';
import SyntaxHighlighter from '../lib/highlighter';
import { useAuth } from '../context/useAuth';
import Avatar from './Avatar';
import BrandMark from './BrandMark';

const MotionDiv = motion.div;

const CodeBlock = ({ className, children }) => {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');
  const language = /language-([\w+#-]+)/.exec(className || '')?.[1];

  // Inline `code` has no language and no line breaks.
  if (!language && !code.includes('\n')) {
    return (
      <code className="rounded bg-ink/10 px-1 py-0.5 font-mono text-[0.88em] before:content-none after:content-none dark:bg-paper/10">
        {children}
      </code>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; nothing else to do.
    }
  };

  return (
    <div className="not-prose my-3 overflow-hidden rounded-xl border-2 border-ink bg-ink text-sm dark:border-ink-4">
      <div className="flex items-center justify-between border-b border-ink-4 px-4 py-1.5">
        <span className="font-mono text-xs text-haldi">{language || 'text'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 p-1 font-mono text-xs text-paper/70 hover:text-haldi">
          {copied ? <ClipboardCheck size={14} /> : <Clipboard size={14} />}
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontFamily: 'var(--font-mono)' }}
        codeTagProps={{ style: { fontFamily: 'var(--font-mono)' } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

// Code blocks draw their own container, so skip the extra <pre>.
const Pre = ({ children }) => <>{children}</>;

function Attachment({ message }) {
  if (message.localPreview) {
    return <img src={message.localPreview} alt={message.attachment?.name || ''} className="mb-2 max-h-64 rounded-lg border-2 border-ink" />;
  }
  return (
    <p className="mb-1 inline-flex items-center gap-1.5 rounded-md bg-ink/10 px-2 py-1 font-mono text-xs">
      <ImageIcon size={14} aria-hidden="true" />
      {message.attachment.name}
    </p>
  );
}

export default function MessageBubble({ message }) {
  const { user } = useAuth();
  const isUser = message.is_from_user;

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {isUser ? <Avatar user={user} size={34} /> : <BrandMark size={34} animated={false} />}

      <div
        className={`min-w-0 max-w-[85%] rounded-2xl border-2 px-4 py-2.5 ${
          isUser
            ? 'rounded-tr-md border-ink bg-haldi text-ink'
            : 'rounded-tl-md border-paper-3 bg-paper-2 text-ink dark:border-ink-4 dark:bg-ink-2 dark:text-paper'
        }`}
      >
        {message.attachment && <Attachment message={message} />}
        {message.text && (
          <div className={`prose prose-sm prose-rgpt max-w-none break-words prose-p:my-2 prose-pre:my-0 ${isUser ? '' : 'prose-rgpt-themed'}`}>
            <ReactMarkdown components={{ code: CodeBlock, pre: Pre }}>{message.text}</ReactMarkdown>
          </div>
        )}
      </div>
    </MotionDiv>
  );
}
