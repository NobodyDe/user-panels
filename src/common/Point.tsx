export default function Point() {
  return (
    <div className="relative flex size-2.5">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
      <span className="relative inline-flex size-2.5 rounded-full bg-brand shadow-[0_0_10px_var(--color-brand)]" />
    </div>
  );
}
