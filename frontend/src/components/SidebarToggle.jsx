import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function SidebarToggle({ isSidebarOpen, setIsSidebarOpen }) {
  return (
    <button
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      className="rounded-lg p-2 text-ink/70 transition hover:bg-paper-2 hover:text-ink dark:text-paper/70 dark:hover:bg-ink-3 dark:hover:text-paper"
      aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
    >
      {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
    </button>
  );
}
