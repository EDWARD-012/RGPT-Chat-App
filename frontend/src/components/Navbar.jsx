// src/components/Navbar.jsx
import { useEffect, useState } from "react";
import { Sun, Moon, LogOut } from "lucide-react";
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import SidebarToggle from "./SidebarToggle";

export default function Navbar({ isSidebarOpen, setIsSidebarOpen }) {
  const [darkMode, setDarkMode] = useState(false);
  const { token, logout } = useAuth(); // Get auth state and logout function

  // Initialize theme and apply it immediately; listen to system changes only when no explicit user preference
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = storedTheme ? storedTheme === "dark" : prefersDark;

    setDarkMode(isDark);

    // apply immediately so UI reflects the stored/system preference without waiting for another render
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    // If the user hasn't chosen a preference, update when system preference changes
    let mql;
    const handleChange = (e) => {
      const stored = localStorage.getItem("theme");
      if (stored) return; // respect explicit user choice
      const newDark = e.matches;
      setDarkMode(newDark);
      if (newDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    };

    if (window.matchMedia) {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
      if (mql.addEventListener) {
        mql.addEventListener("change", handleChange);
      } else if (mql.addListener) {
        mql.addListener(handleChange);
      }
    }

    return () => {
      if (mql) {
        if (mql.removeEventListener) {
          mql.removeEventListener("change", handleChange);
        } else if (mql.removeListener) {
          mql.removeListener(handleChange);
        }
      }
    };
  }, []);

  // Toggle theme: update state, html class and persist choice
  const toggleTheme = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };


return (
    <header className="sticky top-0 z-10 w-full border-b bg-white/95 backdrop-blur dark:bg-gray-900/80 dark:border-gray-700/50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
            {/* Left Side: Sidebar Toggle */}
            <div className="flex items-center gap-4 flex-1">
                <SidebarToggle 
                    isSidebarOpen={isSidebarOpen} 
                    setIsSidebarOpen={setIsSidebarOpen} 
                />
            </div>

            {/* Center: Brand/Chat Page */}
            <div className="flex-1 flex justify-center items-center">
                <span className="text-white">R</span>GPT Chat
            </div>


            {/* Right Side: Controls */}
            <div className="flex items-center gap-3 flex-3 justify-end">
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    style={{
                        width: 35,
                        borderRadius: '100%',
                    }}
                    aria-label="Toggle theme"
                >
                    {darkMode ? (
                        <Sun className="h-5 w-5 text-gray-700 dark:text-yellow-400" />
                    ) : (
                        <Moon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                    )}
                </button>

                {/* Auth Controls */}
                {token ? (
                    <button
                        onClick={logout}
                        className="flex items-center gap-4 bg-gray-800/70 hover:bg-gray-700 text-gray-300 rounded-md py-2 px-4 transition-colors"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                ) : (
                    <Link to="/login" className="font-semibold text-gray-700 dark:text-gray-300 hover:opacity-80">
                        Sign In
                    </Link>
                )}
            </div>
        </div>
    </header>
);
}