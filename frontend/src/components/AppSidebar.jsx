import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Check, LogOut, MessageSquare, Pencil, Pin, PinOff, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import Avatar from './Avatar';
import BrandMark, { Wordmark } from './BrandMark';

const iconButton =
  'rounded-md p-1 text-muted transition hover:bg-paper-3 hover:text-ink dark:hover:bg-ink-4 dark:hover:text-paper';

function ChatItem({ chat, isEditing, editValue, setEditValue, onStartEdit, onSave, onCancel, onPin, onDelete }) {
  if (isEditing) {
    return (
      <li className="flex items-center gap-1 rounded-lg border-2 border-haldi bg-paper p-1.5 dark:bg-ink-3">
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
        <button onClick={() => onSave(chat.id)} className={iconButton} aria-label="Save title">
          <Check size={14} />
        </button>
        <button onClick={onCancel} className={iconButton} aria-label="Cancel rename">
          <X size={14} />
        </button>
      </li>
    );
  }

  return (
    <li className="group flex items-center rounded-lg">
      <NavLink
        to={`/chats/${chat.id}`}
        className={({ isActive }) =>
          `flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
            isActive
              ? 'bg-paper font-medium shadow-[inset_3px_0_0_0_var(--color-haldi-deep)] dark:bg-ink-3 dark:shadow-[inset_3px_0_0_0_var(--color-haldi)]'
              : 'hover:bg-paper/70 dark:hover:bg-ink-3/60'
          }`
        }
      >
        <MessageSquare size={15} className="shrink-0 text-muted" />
        <span className="truncate">{chat.title || 'New Chat'}</span>
      </NavLink>
      <div className="ml-1 flex shrink-0 gap-0.5 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <button onClick={() => onStartEdit(chat)} className={iconButton} aria-label="Rename chat" title="Rename">
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onPin(chat.id)}
          className={`${iconButton} ${chat.pinned ? 'text-chili' : ''}`}
          aria-label={chat.pinned ? 'Unpin chat' : 'Pin chat'}
          title={chat.pinned ? 'Unpin' : 'Pin'}
        >
          {chat.pinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        <button onClick={() => onDelete(chat.id)} className={`${iconButton} hover:text-chili`} aria-label="Delete chat" title="Delete">
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
      className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r-2 border-paper-3 bg-paper-2 transition-transform duration-200 dark:border-ink-4 dark:bg-ink-2 md:static md:z-auto ${
        open ? 'translate-x-0' : '-translate-x-full md:hidden'
      }`}
    >
      <div className="flex items-center gap-2.5 px-4 py-3.5">
        <BrandMark size={34} className="transition-transform duration-300 hover:-rotate-6" />
        <Wordmark className="flex-1 text-lg" />
        <button onClick={onClose} className={`${iconButton} md:hidden`} aria-label="Close sidebar">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3 px-3 pb-3">
        <button
          onClick={onNewChat}
          className="sticker flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-haldi py-2.5 font-display text-sm font-bold text-ink transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
        >
          <Plus size={16} strokeWidth={3} />
          New chat
        </button>
        <label className="flex items-center gap-2 rounded-xl border-2 border-transparent bg-paper px-3 py-2 focus-within:border-haldi-deep dark:bg-ink-3 dark:focus-within:border-haldi">
          <Search size={15} className="text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </label>
      </div>

      <nav className="custom-scroll flex-1 space-y-5 overflow-y-auto px-3 pb-3">
        {sections.map(([title, chats]) => (
          <div key={title}>
            <p
              className={`mb-1.5 px-2 font-mono text-[11px] font-semibold uppercase tracking-wider ${
                title === 'Pinned' ? 'text-chili' : 'text-muted'
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
          <p className="px-2 pt-6 text-center font-mono text-xs text-muted">
            {query ? 'No chats match your search.' : 'No chats yet. Start one above.'}
          </p>
        )}
      </nav>

      <div className="flex items-center gap-3 border-t-2 border-paper-3 p-3 dark:border-ink-4">
        <Avatar user={user} size={36} />
        <div className="min-w-0 flex-1 text-sm">
          {displayName && <p className="truncate font-semibold">{displayName}</p>}
          <p className="truncate font-mono text-xs text-muted">{user?.email}</p>
        </div>
        <button onClick={logout} className={`${iconButton} hover:text-chili`} aria-label="Sign out" title="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
