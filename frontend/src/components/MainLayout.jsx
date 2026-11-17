import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CircleAlert, X } from 'lucide-react';
import { AppSidebar } from './AppSidebar.jsx';
import Navbar from './Navbar.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import api, { errorMessage } from '../services/api.js';
import { groupChatsByDate } from '../lib/utils.js';

const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;

export default function MainLayout() {
  const [chats, setChats] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktop);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const chatGroups = useMemo(() => groupChatsByDate(chats), [chats]);

  const refreshChats = useCallback(() => {
    return api
      .get('chats/')
      .then((res) => {
        if (!Array.isArray(res.data)) throw new Error('Unexpected response for chats/');
        setChats(res.data);
      })
      .catch((err) => setError(errorMessage(err, 'Could not load your chats.')));
  }, []);

  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  // On phones the sidebar is an overlay, so close it after navigating.
  useEffect(() => {
    if (!isDesktop()) setIsSidebarOpen(false);
  }, [location.pathname]);

  const startChat = useCallback(
    async (initialMessage) => {
      try {
        const res = await api.post('chats/');
        if (!res.data?.id) throw new Error('Unexpected response for a new chat');
        setChats((prev) => [res.data, ...prev]);
        navigate(`/chats/${res.data.id}`, initialMessage ? { state: { initialMessage } } : undefined);
      } catch (err) {
        setError(errorMessage(err, 'Could not start a new chat.'));
      }
    },
    [navigate],
  );

  const renameChat = async (chatId, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      await api.patch(`chats/${chatId}/`, { title: trimmed.slice(0, 200) });
      refreshChats();
    } catch (err) {
      setError(errorMessage(err, 'Could not rename the chat.'));
    }
  };

  const togglePin = async (chatId) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;
    try {
      await api.patch(`chats/${chatId}/`, { pinned: !chat.pinned });
      refreshChats();
    } catch (err) {
      setError(errorMessage(err, 'Could not update the chat.'));
    }
  };

  const deleteChat = async (chatId) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!window.confirm(`Delete "${chat?.title || 'this chat'}"?`)) return;
    try {
      await api.delete(`chats/${chatId}/`);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (location.pathname === `/chats/${chatId}`) navigate('/');
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the chat.'));
    }
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-paper text-ink dark:bg-ink dark:text-paper">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-20 bg-ink/50 backdrop-blur-[2px] md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <AppSidebar
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        allChats={chats}
        chatGroups={chatGroups}
        onNewChat={() => startChat()}
        onRenameChat={renameChat}
        onPinChat={togglePin}
        onDeleteChat={deleteChat}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 border-b border-chili/40 bg-chili/10 px-4 py-2 text-sm"
          >
            <CircleAlert className="h-4 w-4 shrink-0 text-chili" aria-hidden="true" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} aria-label="Dismiss" className="rounded p-1 hover:bg-chili/15">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <main className="min-h-0 flex-1">
          {/* Keyed by path so an error in one chat clears when you open another. */}
          <ErrorBoundary key={location.pathname}>
            <Outlet context={{ startChat, refreshChats }} />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
