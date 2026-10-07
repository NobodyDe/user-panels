import type { Cargo } from "../types/user";

const stylePerStatus: Record<Cargo, string> = {
  admin: "bg-brand/15 border-brand/50 text-brand",
  editor: "bg-badge-muted/15 border-border text-text",
  leitor: "bg-muted border-border text-text-foreground",
};

type Props = { cargo: Cargo };

export default function Badge({ cargo }: Props) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 ${stylePerStatus[cargo]}`}
    >
      {cargo}
    </span>
  );
}
