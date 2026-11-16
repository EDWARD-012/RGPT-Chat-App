import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { CircleAlert, ImagePlus, SendHorizontal, X } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import TypingLoader from '../components/TypingLoader';
import MessageBubble from '../components/MessageBubble';
import Logo from '../assets/logo.svg?react';
import api, { errorMessage } from '../services/api';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_IMAGES = 'image/png,image/jpeg,image/webp,image/heic,image/heif';

export default function ChatPage() {
  const { chatId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshChats } = useOutletContext();

  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const sentInitialFor = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Load the chat whenever the URL changes.
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setMessages([]);
    setError('');
    api
      .get(`chats/${chatId}/`)
      .then((res) => {
        if (cancelled) return;
        setMessages(res.data.messages || []);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(err.response?.status === 404 ? 'missing' : 'error');
        setError(errorMessage(err, 'Could not load this chat.'));
      });
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  // Preview for the image waiting in the composer.
  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (selected) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setError('Only images can be attached.');
      return;
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      setError('Images must be 4 MB or smaller.');
      return;
    }
    setError('');
    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = useCallback(
    async (text, attachment) => {
      const trimmed = text.trim();
      if (!trimmed && !attachment) return true;

      const tempId = `pending-${Date.now()}`;
      const localPreview = attachment ? URL.createObjectURL(attachment) : null;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          text: trimmed,
          is_from_user: true,
          attachment: attachment ? { name: attachment.name, type: attachment.type } : null,
          localPreview,
        },
      ]);
      setIsSending(true);
      setError('');

      const form = new FormData();
      if (trimmed) form.append('text', trimmed);
      if (attachment) form.append('file_upload', attachment);

      try {
        const res = await api.post(`chats/${chatId}/messages/`, form);
        setMessages((prev) => [
          ...prev.map((m) => (m.id === tempId ? { ...res.data.user_message, localPreview } : m)),
          res.data.bot_message,
        ]);
        refreshChats();
        return true;
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        if (localPreview) URL.revokeObjectURL(localPreview);
        setError(errorMessage(err, "Your message couldn't be sent. Please try again."));
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [chatId, refreshChats],
  );

  // A suggestion picked on the welcome page arrives as router state.
  useEffect(() => {
    const initialMessage = location.state?.initialMessage;
    if (status !== 'ready' || !initialMessage || sentInitialFor.current === chatId) return;
    sentInitialFor.current = chatId;
    navigate(location.pathname, { replace: true, state: null });
    sendMessage(initialMessage);
  }, [status, chatId, location.state, location.pathname, navigate, sendMessage]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isSending || (!input.trim() && !file)) return;
    const text = input;
    const attachment = file;
    setInput('');
    clearFile();
    const ok = await sendMessage(text, attachment);
    if (!ok) {
      // Put the message back so it can be retried.
      setInput(text);
      if (attachment) setFile(attachment);
    }
    textareaRef.current?.focus();
  };

  if (status === 'loading') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
        <Logo className="h-8 w-10 animate-pulse text-violet-600 dark:text-violet-400" aria-hidden="true" />
        <p className="text-sm">Loading chat...</p>
      </div>
    );
  }

  if (status === 'missing' || status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          {status === 'missing' ? "This chat doesn't exist or was deleted." : error}
        </p>
        <Link to="/" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
          Back to home
        </Link>
      </div>
    );
  }

  const canSend = !isSending && (input.trim() || file);

  return (
    <div className="flex h-full flex-col">
      <div className="custom-scroll flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
          {messages.length === 0 && !isSending && (
            <div className="pt-16 text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg font-medium text-gray-700 dark:text-gray-200">Start chatting with RGPT</p>
              <p className="mt-1 text-sm">Type a message below, or attach an image and ask about it.</p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isSending && (
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600">
                <Logo className="h-4 w-5 text-white" aria-hidden="true" />
              </span>
              <div className="rounded-2xl bg-gray-100 px-3 py-2 dark:bg-gray-800">
                <TypingLoader />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white/90 px-4 pb-4 pt-3 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto max-w-3xl">
          {error && (
            <div
              role="alert"
              className="mb-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} aria-label="Dismiss error">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {filePreview && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-gray-200 p-1.5 pr-2 dark:border-gray-700">
              <img src={filePreview} alt="" className="h-12 w-12 rounded object-cover" />
              <span className="max-w-[12rem] truncate text-sm text-gray-600 dark:text-gray-300">{file.name}</span>
              <button
                onClick={clearFile}
                className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-gray-50 p-2 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30 dark:border-gray-700 dark:bg-gray-900"
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full p-2 text-gray-500 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Attach an image"
              title="Attach an image"
            >
              <ImagePlus size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGES}
              className="hidden"
              onChange={(e) => selectFile(e.target.files?.[0])}
            />
            <TextareaAutosize
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Message RGPT..."
              minRows={1}
              maxRows={8}
              autoFocus
              className="flex-1 resize-none bg-transparent px-1 py-2 text-gray-900 outline-none placeholder:text-gray-500 dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-700"
              aria-label="Send message"
            >
              <SendHorizontal size={18} />
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-500">
            Enter to send, Shift + Enter for a new line. RGPT can get things wrong.
          </p>
        </div>
      </div>
    </div>
  );
}
