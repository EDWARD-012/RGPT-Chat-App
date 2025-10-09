import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar.jsx";
import Navbar from "./Navbar.jsx";
import api from "../services/api.js";
import { groupChatsByDate } from "../lib/utils.js";

export default function MainLayout() {
  const [allChats, setAllChats] = useState([]);
  const [chatGroups, setChatGroups] = useState({ today: [], yesterday: [], previous7Days: [], older: [] });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const fetchChatSessions = () => {
    api.get('/chats/')
      .then(res => {
        setAllChats(res.data);
        setChatGroups(groupChatsByDate(res.data));
      })
      .catch(err => console.error("Error fetching chat sessions:", err));
  };

  useEffect(() => { fetchChatSessions(); }, []);

  const handleNewChat = async () => {
    try {
      const res = await api.post('/chats/');
      fetchChatSessions(); 
      navigate(`/chats/${res.data.id}`);
    } catch (error) { console.error("Error creating new chat:", error); }
  };

  const handleRenameChat = async (chatId, newTitle) => {
    try {
      await api.patch(`/chats/${chatId}/`, { title: newTitle });
      fetchChatSessions();
    } catch (error) { console.error("Error renaming chat:", error); }
  };

  const handlePinChat = async (chatId) => {
    const chatToPin = allChats.find(c => c.id === chatId);
    if (!chatToPin) return;
    try {
      await api.patch(`/chats/${chatId}/`, { pinned: !chatToPin.pinned });
      fetchChatSessions();
    } catch (error) { console.error("Error pinning chat:", error); }
  };

  return (
    <div className="flex bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
        {isSidebarOpen && (
            <AppSidebar
            allChats={allChats}
            chatGroups={chatGroups}
            handleNewChat={handleNewChat}
            onRenameChat={handleRenameChat}
            onPinChat={handlePinChat}
            />
        )}

        <div className="flex-1 flex flex-col min-h-0">
            <Navbar
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            />
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            <Outlet />
            </div>
        </div>
        </div>
  );
}
