import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Check, LogOut, MessageSquare, Pencil, Pin, PinOff, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import Avatar from './Avatar';
import Logo from '../assets/logo.svg?react';

const iconButton = 'rounded p-1 text-gray-500 transition hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700';

function ChatItem({ chat, isEditing, editValue, setEditValue, onStartEdit, onSave, onCancel, onPin, onDelete }) {
  if (isEditing) {
    return (
      <li className="flex items-center gap-1 rounded-md bg-gray-200 p-1.5 dark:bg-gray-800">
        <input
          className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          autoFocus
          maxLength={200}
          aria-label="Chat title"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(chat.id);
            if (e.key === 'Escape') onCancel();
          }}
        />
        <button onClick={() => onSave(chat.id)} className={`${iconButton} text-green-600`} aria-label="Save title">
          <Check size={14} />
        </button>
        <button onClick={onCancel} className={iconButton} aria-label="Cancel rename">
          <X size={14} />
        </button>
      </li>
    );
  }

  return (
    <li className="group flex items-center rounded-md">
      <NavLink
        to={`/chats/${chat.id}`}
        className={({ isActive }) =>
          `flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors ${
            isActive ? 'bg-gray-200 dark:bg-gray-800' : 'hover:bg-gray-200/70 dark:hover:bg-gray-800/70'
          }`
        }
      >
        <MessageSquare size={15} className="shrink-0 text-gray-500 dark:text-gray-400" />
        <span className="truncate">{chat.title || 'New Chat'}</span>
      </NavLink>
      <div className="ml-1 flex shrink-0 gap-0.5 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <button onClick={() => onStartEdit(chat)} className={iconButton} aria-label="Rename chat" title="Rename">
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onPin(chat.id)}
          className={`${iconButton} ${chat.pinned ? 'text-amber-500 dark:text-amber-400' : ''}`}
          aria-label={chat.pinned ? 'Unpin chat' : 'Pin chat'}
          title={chat.pinned ? 'Unpin' : 'Pin'}
        >
          {chat.pinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        <button
          onClick={() => onDelete(chat.id)}
          className={`${iconButton} hover:text-red-600 dark:hover:text-red-400`}
          aria-label="Delete chat"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

export function AppSidebar({ open, onClose, allChats, chatGroups, onNewChat, onRenameChat, onPinChat, onDeleteChat }) {
  const { logout, user } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [search, setSearch] = useState('');

  const startEdit = (chat) => {
    setEditingId(chat.id);
    setEditValue(chat.title || '');
  };
  const saveEdit = (id) => {
    onRenameChat(id, editValue);
    setEditingId(null);
  };
  const cancelEdit = () => setEditingId(null);

  const query = search.trim().toLowerCase();
  const matches = (chats) => (chats || []).filter((c) => (c.title || '').toLowerCase().includes(query));
  const unpinned = (chats) => (chats || []).filter((c) => !c.pinned);

  const sections = [
    ['Pinned', matches(allChats.filter((c) => c.pinned))],
    ['Today', matches(unpinned(chatGroups.today))],
    ['Yesterday', matches(unpinned(chatGroups.yesterday))],
    ['Previous 7 days', matches(unpinned(chatGroups.previous7Days))],
    ['Older', matches(unpinned(chatGroups.older))],
  ].filter(([, chats]) => chats.length > 0);

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-gray-200 bg-gray-50 transition-transform duration-200 dark:border-gray-800 dark:bg-gray-900 md:static md:z-auto ${
        open ? 'translate-x-0' : '-translate-x-full md:hidden'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600">
          <Logo className="h-4 w-5 text-white" aria-hidden="true" />
        </span>
        <span className="flex-1 text-lg font-semibold">RGPT</span>
        <button onClick={onClose} className={`${iconButton} md:hidden`} aria-label="Close sidebar">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3 p-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 py-2 font-medium text-white shadow-sm transition hover:opacity-90"
        >
          <Plus size={16} />
          New chat
        </button>
        <label className="flex items-center gap-2 rounded-lg bg-gray-200/70 px-3 py-2 dark:bg-gray-800">
          <Search size={15} className="text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
          />
        </label>
      </div>

      <nav className="custom-scroll flex-1 space-y-4 overflow-y-auto px-3 pb-3">
        {sections.map(([title, chats]) => (
          <div key={title}>
            <p
              className={`mb-1 px-2 text-xs font-semibold ${
                title === 'Pinned' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'
              }`}
            >
              {title}
            </p>
            <ul className="space-y-0.5">
              {chats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isEditing={editingId === chat.id}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onStartEdit={startEdit}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  onPin={onPinChat}
                  onDelete={onDeleteChat}
                />
              ))}
            </ul>
          </div>
        ))}
        {sections.length === 0 && (
          <p className="px-2 pt-4 text-center text-sm text-gray-500">
            {query ? 'No chats match your search.' : 'No chats yet. Start one above.'}
          </p>
        )}
      </nav>

      <div className="flex items-center gap-3 border-t border-gray-200 p-3 dark:border-gray-800">
        <Avatar user={user} size={36} />
        <div className="min-w-0 flex-1 text-sm">
          {displayName && <p className="truncate font-medium">{displayName}</p>}
          <p className="truncate text-gray-500 dark:text-gray-400">{user?.email}</p>
        </div>
        <button onClick={logout} className={`${iconButton} hover:text-red-600`} aria-label="Sign out" title="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
