interface Props {
  online: boolean;
  onChange?: (online: boolean) => void;
}

export default function OnlineIndicator({ online, onChange }: Props) {
  const dot = (
    <span className="relative flex h-2.5 w-2.5">
      {online && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff8a3d] opacity-40 motion-reduce:animate-none" />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${online ? "bg-[#ff8a3d]" : "bg-slate-400"}`} />
    </span>
  );
  const cls = `flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm ${
    online ? "text-slate-700" : "text-slate-500"
  }`;
  const label = online ? "Online" : "Offline";

  if (!onChange) {
    return (
      <span className={cls}>
        {dot}
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={online}
      onClick={() => onChange(!online)}
      className={`${cls} transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338ca]`}
    >
      {dot}
      {label}
    </button>
  );
}