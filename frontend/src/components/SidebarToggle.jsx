// src/components/SidebarToggle.jsx
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

export default function SidebarToggle({ isSidebarOpen, setIsSidebarOpen }) {
  return (
    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-700">
      {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
    </button>
  );
}