const TypingLoader = () => (
  <div className="flex items-center gap-1.5 p-2" aria-label="RGPT is typing">
    <span className="h-2 w-2 animate-bounce rounded-full bg-haldi [animation-delay:-0.3s]" />
    <span className="h-2 w-2 animate-bounce rounded-full bg-haldi [animation-delay:-0.15s]" />
    <span className="h-2 w-2 animate-bounce rounded-full bg-haldi" />
  </div>
);

export default TypingLoader;
