interface SkillChipProps {
  label: string;
  variant: 'matched' | 'missing' | 'neutral';
}

export default function SkillChip({ label, variant }: SkillChipProps) {
  const styles = {
    matched: 'bg-fit-green/10 text-fit-green ring-1 ring-fit-green/30',
    missing: 'text-fit-red ring-1 ring-fit-red/30 bg-white',
    neutral: 'bg-[#FAFBFC] text-[#5B6270] ring-1 ring-[#E4E7EC]',
  } as const;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[variant]}`}
    >
      {label}
    </span>
  );
}
