import { Search } from "lucide-react";

export function DataTableHeader() {
  return (
    <header className="flex items-center">
      <div className="relative w-full max-w-[490px]">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-foreground"
        />
        <input
          type="search"
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar por nome ou e-mail"
          className="h-10 w-full rounded-lg border border-border bg-superface py-2 pr-3 pl-10"
        />
      </div>
      <div>
        <div className="bg-superface p-2 rounded-full px-3 border border-border flex gap-2 items-center">
          <span className="relative inline-flex size-2.5 rounded-full bg-border shadow-[0_0_10px_var(--color-border)]" />
          <span className="text-text-foreground">23 resultados</span>
        </div>
      </div>
    </header>
  );
}
