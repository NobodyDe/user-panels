import Point from "../common/Point";

type Props = { status: string };

export default function Active({ status }: Props) {
  const StatusFormat =
    status.charAt(0).toLocaleUpperCase("PT-BR") + status.slice(1);
  return (
    <div className="flex gap-2 items-center text-text">
      {status === "ativo" ? (
        <Point />
      ) : (
        <span className="relative inline-flex size-2.5 rounded-full bg-border shadow-[0_0_10px_var(--color-border)]" />
      )}
      {StatusFormat}
    </div>
  );
}
