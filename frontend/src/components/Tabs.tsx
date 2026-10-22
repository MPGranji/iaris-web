import type { CSSProperties } from 'react';

export interface TabItem<K extends string> {
  key: K;
  label: string;
}

interface TabsProps<K extends string> {
  id: string;
  items: TabItem<K>[];
  selected: K;
  onSelect: (key: K) => void;
  style?: CSSProperties;
}

export function Tabs<K extends string>({ id, items, selected, onSelect, style }: TabsProps<K>) {
  return (
    <div className="tabs" role="tablist" id={id} style={style}>
      {items.map((t) => (
        <button key={t.key} role="tab" type="button" aria-selected={t.key === selected} onClick={() => onSelect(t.key)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
