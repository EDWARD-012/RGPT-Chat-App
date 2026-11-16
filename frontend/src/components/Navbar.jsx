import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import SidebarToggle from './SidebarToggle';

export default function Navbar({ isSidebarOpen, setIsSidebarOpen }) {
  // index.html applies the saved theme before React loads, so read it back here.
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white/90 px-3 py-2.5 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <div className="flex items-center gap-2">
        <SidebarToggle isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <span className="font-semibold">
          RGPT <span className="font-normal text-gray-500 dark:text-gray-400">Chat</span>
        </span>
      </div>
      <button
        onClick={toggleTheme}
        className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
        title={darkMode ? 'Light theme' : 'Dark theme'}
      >
        {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
      </button>
    </header>
  );
}
