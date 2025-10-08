// src/components/TypingLoader.jsx

const TypingLoader = () => {
  return (
    <div className="flex items-center space-x-1.5 py-2">
      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '-0.3s' }} />
      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '-0.15s' }} />
      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
    </div>
  )
}

export default TypingLoader;