import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import {
  MessageSquare,
  LogOut,
  Plus,
  Edit2,
  Pin,
  PinOff,
  Check,
  X,
  Search,
} from 'lucide-react';
import Logo from '../assets/logo.svg?react';

// ChatList component
const ChatList = ({
  chats,
  onEdit,
  onPin,
  editingId,
  editValue,
  setEditValue,
  onEditSave,
  onEditCancel,
}) => (
  <ul className="space-y-1">
    {chats?.map((chat) => (
      <li key={chat.id} className="flex items-center group pr-2">
        <NavLink
          to={`/chats/${chat.id}`}
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded-md transition-colors text-sm truncate flex-1 ${
              isActive
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            }`
          }
        >
          <MessageSquare size={16} className="flex-shrink-0" />
          {editingId === chat.id ? (
            <input
              className="bg-transparent border-b border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white flex-1 outline-none"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEditSave(chat.id);
                if (e.key === 'Escape') onEditCancel();
              }}
            />
          ) : (
            <span className="truncate">{chat.title}</span>
          )}
        </NavLink>
        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {editingId === chat.id ? (
            <>
              <button
                onClick={() => onEditSave(chat.id)}
                className="text-green-500 hover:text-green-600 p-1"
              >
                <Check size={14} />
              </button>
              <button
                onClick={onEditCancel}
                className="text-red-500 hover:text-red-600 p-1"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(chat.id, chat.title)}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 p-1"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onPin(chat.id)}
                className={`p-1 ${
                  chat.pinned
                    ? 'text-yellow-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400'
                }`}
              >
                {chat.pinned ? <PinOff size={14} /> : <Pin size={14} />}
              </button>
            </>
          )}
        </div>
      </li>
    ))}
  </ul>
);

export function AppSidebar({
  allChats,
  chatGroups,
  handleNewChat,
  onRenameChat,
  onPinChat,
}) {
  const { logout, user } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [search, setSearch] = useState('');

  const pinnedChats = allChats?.filter((c) => c.pinned) || [];

  const handleEdit = (id, title) => {
    setEditingId(id);
    setEditValue(title);
  };
  const handleEditSave = (id) => {
    onRenameChat(id, editValue);
    setEditingId(null);
    setEditValue('');
  };
  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const filterChats = (chats) =>
    chats?.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase())
    ) || [];

  const renderChatGroup = (title, chats) => {
    const filtered = filterChats(chats);
    if (!filtered || filtered.length === 0) return null;
    return (
      <div>
        <p
          className={`text-xs font-bold px-2 mb-2 ${
            title === 'Pinned'
              ? 'text-yellow-500'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {title}
        </p>
        <ChatList
          chats={filtered}
          onEdit={handleEdit}
          onPin={onPinChat}
          editingId={editingId}
          editValue={editValue}
          setEditValue={setEditValue}
          onEditSave={handleEditSave}
          onEditCancel={handleEditCancel}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center gap-2">
        {/* --- This is the new, robust way to display the logo --- */}
        <Logo className="w-8 h-8 text-purple-600" />
        
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          RGPT
        </h1>
      </div>

      {/* ---- NEW CHAT ---- */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 text-white font-medium py-2 rounded-lg transition"
        >
          <Plus size={18} /> New Chat
        </button>
      </div>

      {/* ---- SEARCH ---- */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="bg-transparent w-full text-sm text-gray-800 dark:text-gray-200 outline-none placeholder-gray-500"
          />
        </div>
      </div>

      {/* ---- CHAT LIST ---- */}
      <div className="flex-grow overflow-y-auto p-3 space-y-4">
        {renderChatGroup('Pinned', pinnedChats)}
        {renderChatGroup('Today', chatGroups.today?.filter((c) => !c.pinned))}
        {renderChatGroup('Yesterday', chatGroups.yesterday?.filter((c) => !c.pinned))}
        {renderChatGroup('Previous 7 Days', chatGroups.previous7Days?.filter((c) => !c.pinned))}
        {renderChatGroup('Older', chatGroups.older?.filter((c) => !c.pinned))}
      </div>

      {/* ---- FOOTER PROFILE ---- */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={user?.profile_picture_url || 'https://i.pravatar.cc/40'}
            alt="profile"
            className="w-8 h-8 rounded-full"
          />
          <div className="text-sm">
            <p className="font-medium text-gray-900 dark:text-white truncate max-w-[100px]">
              {user?.first_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.email || 'example@gmail.com'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-gray-500 hover:text-red-500 transition"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
