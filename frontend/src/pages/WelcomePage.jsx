// src/pages/WelcomePage.jsx

export default function WelcomePage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="inline-block bg-gradient-to-br from-purple-600 to-blue-500 p-4 rounded-full">
           {/* You can place your logo SVG here */}
           <div className="w-12 h-12"></div>
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-gray-300">Select a chat to start messaging</h1>
      </div>
    </div>
  );
}