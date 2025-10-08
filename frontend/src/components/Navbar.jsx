// src/components/Navbar.jsx
import { useEffect, useState } from "react";
import { Sun, Moon, LogOut } from "lucide-react";
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import SidebarToggle from "./SidebarToggle";

export default function Navbar({ isSidebarOpen, setIsSidebarOpen }) {
  const [darkMode, setDarkMode] = useState(false);
  const { token, logout } = useAuth(); // Get auth state and logout function

  // Effect to set the initial theme based on localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    let isDark;
    if (storedTheme) {
      isDark = storedTheme === "dark";
    } else {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    setDarkMode(isDark);
  }, []);

  // Effect to apply the theme when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Function to toggle the theme
  const toggleTheme = () => {
    console.log('Toggle theme button clicked!'); // <-- ADD THIS LINE
    const isDark = !darkMode;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
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
            <div className="flex-1 flex justify-center">
                <Link to="/" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    <span className="text-purple-600">R</span>GPT Chat
                </Link>
            </div>

            {/* Right Side: Controls */}
            <div className="flex items-center gap-4 flex-1 justify-end">
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
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
                        className="flex items-center gap-2 bg-gray-800/70 hover:bg-gray-700 text-gray-300 rounded-md py-2 px-4 transition-colors"
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