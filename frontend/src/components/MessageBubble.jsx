import { useAuth } from '../context/AuthContext';
import Logo from '../assets/logo.svg?react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Clipboard } from 'lucide-react';
import { useState } from 'react';

// CodeBlock component remains the same
const CodeBlock = ({ className, children }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const code = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return match ? (
    <div className="relative my-2 rounded-lg bg-[#282c34] text-sm">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-600">
        <span className="text-gray-400 text-xs font-sans">{match[1]}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 p-1 text-gray-300 hover:text-white text-xs">
          <Clipboard size={14} />
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}>
        {code}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className={`${className} bg-gray-200 dark:bg-gray-900 rounded-md px-1 py-0.5 text-red-500 dark:text-red-400`}>{children}</code>
  );
};

export default function MessageBubble({ message }) {
  const { user } = useAuth();
  const isUser = message.is_from_user;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? "justify-end flex-row-reverse" : "justify-start"}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden self-start">
        {isUser ? (
          <img
            src={user?.profile_picture_url || 'https://i.pravatar.cc/40'}
            alt="User"
            style={{ width: 32, height: 32, margin: 4}}
            className="rounded-full border border-gray-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-1">
            <Logo style={{ width: 32, height: 32, marginRight: 8}} className="logo" />
          </div>
        )}
        
      </div>
      
      {/* Message Content */}
      <div className={`prose dark:prose-invert max-w-none text-gray-900 dark:text-gray-200 p-3 rounded-xl ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
        <ReactMarkdown components={{ code: CodeBlock }}>
          {message.text}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}

