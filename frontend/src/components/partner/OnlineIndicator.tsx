interface Props {
  online: boolean;
  onChange?: (online: boolean) => void;
}

export default function OnlineIndicator({ online, onChange }: Props) {
  const dot = (
    <span className="relative flex h-2.5 w-2.5">
      {online && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${online ? "bg-accent" : "bg-muted/50"}`} />
    </span>
  );
  const cls = `flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm ${
    online ? "border-accent bg-accent-soft text-[#b45309]" : "border-line bg-panel text-muted"
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
      className={`${cls} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-panel`}
    >
      {dot}
      {label}
    </button>
  );
}