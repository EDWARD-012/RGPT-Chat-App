import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { CircleAlert, ImagePlus, SendHorizontal, X } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import TypingLoader from '../components/TypingLoader';
import MessageBubble from '../components/MessageBubble';
import BrandMark from '../components/BrandMark';
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
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
        <BrandMark size={48} className="animate-bob" />
        <p className="font-mono text-xs">loading chat...</p>
      </div>
    );
  }

  if (status === 'missing' || status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-ink/80 dark:text-paper/80">
          {status === 'missing' ? "This chat doesn't exist or was deleted." : error}
        </p>
        <Link to="/" className="sticker rounded-xl border-2 border-ink bg-haldi px-4 py-2 font-display text-sm font-bold text-ink">
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
            <div className="pt-16 text-center">
              <BrandMark size={56} className="mx-auto animate-bob" />
              <p className="mt-5 font-display text-xl font-bold">Bolo, kya poochna hai?</p>
              <p className="mt-1.5 text-sm text-muted">Type a message below, or attach an image and ask about it.</p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isSending && (
            <div className="flex items-start gap-3">
              <BrandMark size={34} />
              <div className="rounded-2xl rounded-tl-md border-2 border-paper-3 bg-paper-2 px-3 py-1.5 dark:border-ink-4 dark:bg-ink-2">
                <TypingLoader />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="px-4 pb-4 pt-2">
        <div className="mx-auto max-w-3xl">
          {error && (
            <div
              role="alert"
              className="mb-2 flex items-start gap-2 rounded-xl border-2 border-chili/50 bg-chili/10 px-3 py-2 text-sm"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-chili" aria-hidden="true" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} aria-label="Dismiss error">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {filePreview && (
            <div className="mb-2 inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-paper-2 p-1.5 pr-2 dark:border-ink-4 dark:bg-ink-2">
              <img src={filePreview} alt="" className="h-12 w-12 rounded-lg object-cover" />
              <span className="max-w-[12rem] truncate font-mono text-xs">{file.name}</span>
              <button
                onClick={clearFile}
                className="rounded p-1 text-muted hover:bg-paper-3 hover:text-ink dark:hover:bg-ink-4 dark:hover:text-paper"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="sticker flex items-end gap-2 rounded-2xl border-2 border-ink bg-paper-2 p-2 transition focus-within:-translate-y-0.5 dark:border-ink-4 dark:bg-ink-2 dark:focus-within:border-haldi"
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl p-2 text-muted transition hover:bg-paper-3 hover:text-ink dark:hover:bg-ink-4 dark:hover:text-paper"
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
              className="flex-1 resize-none bg-transparent px-1 py-2 outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink bg-haldi text-ink transition hover:-rotate-6 disabled:cursor-not-allowed disabled:rotate-0 disabled:border-transparent disabled:bg-paper-3 disabled:text-muted dark:disabled:bg-ink-4"
              aria-label="Send message"
            >
              <SendHorizontal size={18} />
            </button>
          </form>
          <p className="mt-2.5 text-center font-mono text-[11px] text-muted">
            Enter to send, Shift + Enter for a new line. RGPT can get things wrong.
          </p>
        </div>
      </div>
    </div>
  );
}
