// src/components/MessageBubble.jsx
import { User, Cpu, Clipboard } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
    <div className="relative bg-[#0d1117] rounded-md my-2">
      <button 
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 text-xs"
      >
        {copied ? 'Copied!' : <Clipboard size={14} />}
      </button>
      <SyntaxHighlighter style={atomDark} language={match[1]} PreTag="div">
        {code}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className={`${className} bg-gray-900 rounded-md px-1 py-0.5`}>
      {children}
    </code>
  );
};

export default function MessageBubble({ message }) {
  const isUser = message.is_from_user;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex items-start gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
        
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center self-start ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-300'
          }`}
        >
          
        </div>
        <div
          className={`prose prose-invert max-w-2xl p-4 rounded-xl ${
            isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          <ReactMarkdown components={{ code: CodeBlock }}>
            {message.text}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}