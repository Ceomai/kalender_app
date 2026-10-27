import { CATEGORIES } from '@/src/constants/categories';
import { useT } from '@/src/i18n';
import { Pill, PillRow } from '@/src/ui/Pill';

/** "All" + one pill per category; several can be active at once. */
export function CategoryFilter({
  active,
  onToggle,
  onClear,
  wrap,
}: {
  active: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  wrap?: boolean;
}) {
  const t = useT();
  return (
    <PillRow wrap={wrap}>
      <Pill label={t('cf.all')} selected={active.length === 0} onPress={onClear} />
      {CATEGORIES.map((c) => (
        <Pill
          key={c.id}
          label={c.label}
          icon={c.icon}
          colors={c.chip}
          selected={active.includes(c.id)}
          onPress={() => onToggle(c.id)}
        />
      ))}
    </PillRow>
  );
}
