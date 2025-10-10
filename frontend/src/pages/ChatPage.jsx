import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { SendHorizontal, X, Paperclip } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import TypingLoader from "../components/TypingLoader";
import MessageBubble from "../components/MessageBubble";
import logo from "../assets/logo.svg";

export default function ChatPage() {
  const { user } = useAuth();
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(scrollToBottom, [messages, isTyping]);

  // Load chat
  useEffect(() => {
    if (!chatId) {
        setMessages([]);
        return;
    };
    setIsLoading(true);
    api
      .get(`/chats/${chatId}/`)
      .then((res) => setMessages(res.data.messages || []))
      .catch((err) => console.error("Error loading chat:", err))
      .finally(() => setIsLoading(false));
  }, [chatId]);

  // Send message
  const handleSendMessage = async (e) => {
    if(e) e.preventDefault();
    if (!input.trim() && !file) return;
    const tempId = Date.now();

    const UserMessage = {
      id: tempId,
      text: input || "",
      is_from_user: true,
      file: file ? URL.createObjectURL(file) : null,
    };

    setMessages((prev) => [...prev, UserMessage]);
    const currentInput = input;
    const currentFile = file;
    setInput("");
    setFile(null);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const formData = new FormData();
      if(currentInput) formData.append("text", currentInput);
      if (currentFile) {
        formData.append('file_upload', currentFile);
      }

      const res = await api.post(`/chats/${chatId}/messages/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessages((prev) =>
        prev
          .map((m) => (m.id === tempId ? res.data.user_message : m))
          .concat(res.data.bot_message)
      );
    } catch (err) {
      console.error("Message send failed:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[90vh] overflow-hidden">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-800 p-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Chats
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2">
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
          <div className="max-w-3xl mx-auto space-y-6">
            {isLoading  && !isTyping && (
              <div className="flex items-start gap-3 justify-start">
                <div className="flex flex-col items-center justify-center py-6">
                  <img
                    src={logo}
                    alt="RGPT Logo"
                    style={{ width: 32, height: 32, margin: 4}}
                    className="rounded-full border border-gray-300 animate-spin-slow"
                    //className="w-10 h-10 mb-3 animate-spin-slow"
                  />
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Loading Chat...</p>
                </div>
              </div>
            )}
  
            {!isLoading && messages.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">
                Start chatting with RGPT ✨
              </p>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.is_from_user ? "justify-end" : "justify-start"
                }`}
              >
                <MessageBubble message={msg} />
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-4 justify-start py-2">
                <img
                  src={logo}
                  alt="AI"
                  style={{ width: 32, height: 32 }}
                  className="rounded-full bg-gradient-to-br from-purple-600 to-blue-500 p-1 animate-spin-slow"
                />
                <div className="p-4 rounded-xl bg-gray-200 dark:bg-gray-700">
                  <p className="text-gray-700 dark:text-gray-300 text-sm animate-pulse-text">
                    Thinking...
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* INPUT BAR */}
        <footer className="p-4 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSendMessage}
              className="flex items-end gap-3 bg-gray-100 dark:bg-gray-800 rounded-2xl p-2 border border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-purple-500 transition"
            >
              {/* File Upload */}
              <label className="cursor-pointer p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
                <Paperclip size={18} className="text-gray-600 dark:text-gray-300" />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
              {/* Text Area */}
              <TextareaAutosize
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message RGPT..."
                minRows={1}
                maxRows={6}
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-3 outline-none resize-y text-gray-900 focus:ring-purple-500 focus:border-purple-500"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={isTyping || (!input.trim() && !file)}
                className="p-2 rounded-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                <SendHorizontal className="text-white" size={20} />
              </button>
            </form>

            {/* File Name Preview */}
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
