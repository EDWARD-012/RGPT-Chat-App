import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function SidebarToggle({ isSidebarOpen, setIsSidebarOpen }) {
  return (
    <button
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
    >
      {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
    </button>
  );
}
