interface BadgeIconProps {
  name: string;
}

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0].toUpperCase();

  const first = parts[0];
  const last = parts[parts.length - 1];

  return (first[0] + last[0]).toUpperCase();
}

export default function BadgeIcon({ name }: BadgeIconProps) {
  return (
    <span className="text-text border border-border p-2 rounded-full font-semibold bg-muted">
      {getInitials(name)}
    </span>
  );
}
