import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import SidebarToggle from './SidebarToggle';
import BrandMark, { Wordmark } from './BrandMark';

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
    <header className="flex items-center justify-between gap-3 border-b-2 border-paper-3 bg-paper/90 px-3 py-2.5 backdrop-blur dark:border-ink-4 dark:bg-ink/85">
      <div className="flex items-center gap-2">
        <SidebarToggle isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        {!isSidebarOpen && (
          <span className="flex items-center gap-2">
            <BrandMark size={26} />
            <Wordmark className="text-base" />
          </span>
        )}
      </div>
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 rounded-full border-2 border-ink px-3 py-1.5 font-mono text-xs transition hover:bg-haldi hover:text-ink dark:border-paper/30 dark:hover:border-haldi"
        aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {darkMode ? <Sun className="h-4 w-4 text-haldi" /> : <Moon className="h-4 w-4" />}
        {darkMode ? 'light' : 'dark'}
      </button>
    </header>
  );
}
