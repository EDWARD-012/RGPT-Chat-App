// src/pages/ChatPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import MessageBubble from '../components/MessageBubble.jsx';
import TypingLoader from '../components/TypingLoader.jsx';
import { SendHorizontal, Cpu, Paperclip } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatTitle, setChatTitle] = useState('');
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages, isLoading]);

  useEffect(() => {
    if (!chatId) return;
    const fetchChat = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/chats/${chatId}/`);
        setMessages(res.data.messages || []);
        setChatTitle(res.data.title || "Chat");
      } catch (err) {
        console.error("Error fetching chat:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChat();
  }, [chatId]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() && !file) return;

    const tempId = Date.now();
    const userMessage = { id: tempId, text: input, file, is_from_user: true };
    setMessages(prev => [...prev, userMessage]);

    const currentInput = input;
    setInput('');
    setFile(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('text', currentInput);
      if (file) formData.append('file', file);

      const response = await api.post(`/chats/${chatId}/messages/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessages(prev =>
        prev.map(m => (m.id === tempId ? response.data.user_message : m)).concat(response.data.bot_message)
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[90vh] overflow-hidden">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Chats</h2>
        <div className="flex-1 overflow-y-auto space-y-2">
          {/* You can map your chat list here */}
          <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition">
            New Chat
          </button>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <div className="flex flex-col flex-1 bg-white dark:bg-gray-950">
        {/* NAVBAR */}
        

        {/* CHAT MESSAGES */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.length === 0 && !isLoading && (
              <p className="text-center text-gray-500 dark:text-gray-400">Start chatting with RGPT ✨</p>
            )}

            {messages
              .filter((msg) => msg && msg.id !== undefined)
              .map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

            {isLoading && (
              <div className="flex items-start gap-4 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500">
                  <Cpu size={20} color="white" />
                </div>
                <div className="p-4 rounded-xl bg-gray-200 dark:bg-gray-700">
                  <TypingLoader />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* INPUT BAR */}
        <footer className="p-4 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex items-end gap-3 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 border border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-purple-500 transition">
              
              {/* File upload */}
              <label className="cursor-pointer p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
                <Paperclip size={18} className="text-gray-600 dark:text-gray-300" />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>

              {/* Text area */}
              <TextareaAutosize
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message RGPT..."
                className="flex-1 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2 max-h-40"
                minRows={1}
                maxRows={6}
              />

              {/* Send button */}
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !file)}
                className="p-2 rounded-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                <SendHorizontal className="text-white" size={20} />
              </button>
            </form>

            {/* File name preview */}
            {file && (
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                📎 {file.name}
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
