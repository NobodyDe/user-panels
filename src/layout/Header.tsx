import { Users } from "lucide-react";
import { Fragment } from "react/jsx-runtime";

const options = [
  { label: "Painel", style: "font-bold text-text " },
  { label: "Administração", style: "text-text-foreground" },
  { label: "Usuários", style: "text-text font-semibold" },
];

export default function Header() {
  return (
    <header className="border-b border-border w-full h-16">
      <div className="w-full h-full px-22 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-md bg-brand shadow-[0_0_16px_var(--color-brand)]">
            <Users className="text-black size-5" strokeWidth={2.5} />
          </div>
          {options.map((op, index) => (
            <Fragment key={op.label}>
              {index > 0 && <span className="text-text-foreground">/</span>}
              <span className={op.style}>{op.label}</span>
            </Fragment>
          ))}
        </div>

        <div className="border border-border rounded-full flex gap-2 items-center p-2 px-4">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-brand shadow-[0_0_10px_var(--color-brand)]" />
          </span>
          <span className="text-text-foreground">API Falsa - 350ms</span>
        </div>
      </div>
    </header>
  );
}
