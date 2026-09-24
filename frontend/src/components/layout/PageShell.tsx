interface PageShellProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

/**
 * PageShell — shared visual wrapper every customer page uses so new pages
 * start consistent (title, optional description, panel container) without
 * re-typing the same markup in every folder's index.tsx.
 */
export default function PageShell({ title, description, children }: PageShellProps) {
  return (
    <div className="bg-panel border border-line rounded p-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      {description && <p className="text-muted text-sm mt-1">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
