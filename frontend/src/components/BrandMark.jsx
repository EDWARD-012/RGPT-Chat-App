// The RGPT mark: a haldi chat bubble with an "R" and a blinking cursor,
// like a prompt waiting for you to type.
export default function BrandMark({ size = 32, animated = true, className = '', title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`shrink-0 ${className}`}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
    >
      {title && <title>{title}</title>}
      <path
        d="M14 5h36a10 10 0 0 1 10 10v25a10 10 0 0 1-10 10H28L14 60l2-10h-2A10 10 0 0 1 4 40V15A10 10 0 0 1 14 5z"
        fill="#ffc233"
        stroke="#0f0d0b"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M19 40V16h10.5a7.25 7.25 0 0 1 0 14.5H19M29 30.5 37 40"
        fill="none"
        stroke="#0f0d0b"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="41" y="35.5" width="10" height="4.5" rx="1.5" fill="#0f0d0b" className={animated ? 'animate-caret' : ''} />
    </svg>
  );
}

export function Wordmark({ className = '' }) {
  return (
    <span className={`font-display font-bold tracking-tight ${className}`}>
      RGPT
    </span>
  );
}
