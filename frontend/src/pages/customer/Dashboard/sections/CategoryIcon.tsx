import { Sparkles } from "lucide-react";

/** Category/service icon from the API: an emoji renders as text; anything else (or nothing) gets a generic icon. */
export default function CategoryIcon({ icon, className = "" }: { icon: string | null; className?: string }) {
  if (icon && [...icon].length <= 4) {
    return <span aria-hidden="true" className={className}>{icon}</span>;
  }
  return <Sparkles aria-hidden="true" className="h-5 w-5 text-brand" />;
}
