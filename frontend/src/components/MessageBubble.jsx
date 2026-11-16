import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Clipboard, ClipboardCheck, ImageIcon } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import Avatar from './Avatar';
import Logo from '../assets/logo.svg?react';

const MotionDiv = motion.div;

const CodeBlock = ({ className, children }) => {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');
  const language = /language-(\w+)/.exec(className || '')?.[1];

  // Inline `code` has no language and no line breaks.
  if (!language && !code.includes('\n')) {
    return (
      <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em] before:content-none after:content-none dark:bg-white/10">
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
    <div className="not-prose my-3 overflow-hidden rounded-lg bg-[#282c34] text-sm">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-1.5">
        <span className="font-sans text-xs text-gray-400">{language || 'text'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 p-1 text-xs text-gray-300 hover:text-white">
          {copied ? <ClipboardCheck size={14} /> : <Clipboard size={14} />}
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
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
    return <img src={message.localPreview} alt={message.attachment?.name || ''} className="mb-2 max-h-64 rounded-lg" />;
  }
  return (
    <p className="mb-1 inline-flex items-center gap-1.5 rounded-md bg-black/10 px-2 py-1 text-xs dark:bg-white/10">
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {isUser ? (
        <Avatar user={user} size={32} />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600">
          <Logo className="h-4 w-5 text-white" aria-hidden="true" />
        </span>
      )}

      <div
        className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        {message.attachment && <Attachment message={message} />}
        {message.text && (
          <div
            className={`prose prose-sm max-w-none break-words prose-p:my-2 prose-pre:my-0 ${
              isUser ? 'prose-invert' : 'dark:prose-invert'
            }`}
          >
            <ReactMarkdown components={{ code: CodeBlock, pre: Pre }}>{message.text}</ReactMarkdown>
          </div>
        )}
      </div>
    </MotionDiv>
  );
}
