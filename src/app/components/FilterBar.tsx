import { Component, For } from 'solid-js';

export type SortKey = 'default' | 'estimate-asc' | 'estimate-desc' | 'scheduled-asc';

export interface FilterState {
  text: string;
  scheduled: boolean;
  unscheduled: boolean;
  estimated: boolean;
  unestimated: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTER: FilterState = {
  text: '',
  scheduled: false,
  unscheduled: false,
  estimated: false,
  unestimated: false,
  sort: 'default',
};

interface Props {
  filter: FilterState;
  onChange: (f: FilterState) => void;
}

type ChipKey = 'scheduled' | 'unscheduled' | 'estimated' | 'unestimated';

const CHIPS: { label: string; key: ChipKey }[] = [
  { label: 'Scheduled', key: 'scheduled' },
  { label: 'Unscheduled', key: 'unscheduled' },
  { label: 'Estimated', key: 'estimated' },
  { label: 'Unestimated', key: 'unestimated' },
];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Default order', value: 'default' },
  { label: 'Estimate ↑', value: 'estimate-asc' },
  { label: 'Estimate ↓', value: 'estimate-desc' },
  { label: 'Scheduled ↑', value: 'scheduled-asc' },
];

export const FilterBar: Component<Props> = (props) => {
  const toggle = (key: ChipKey) => {
    const f = props.filter;
    let next = { ...f, [key]: !f[key] };
    // Enforce mutual exclusivity within pairs
    if (key === 'scheduled' && next.scheduled) next.unscheduled = false;
    if (key === 'unscheduled' && next.unscheduled) next.scheduled = false;
    if (key === 'estimated' && next.estimated) next.unestimated = false;
    if (key === 'unestimated' && next.unestimated) next.estimated = false;
    props.onChange(next);
  };

  return (
    <div class="filter-bar">
      <input
        class="filter-search"
        type="text"
        placeholder="Search tasks or projects…"
        value={props.filter.text}
        onInput={(e) => props.onChange({ ...props.filter, text: e.currentTarget.value })}
      />
      <div class="filter-controls">
        <For each={CHIPS}>
          {(chip) => (
            <button
              class="chip"
              classList={{ active: props.filter[chip.key] }}
              onClick={() => toggle(chip.key)}
            >
              {chip.label}
            </button>
          )}
        </For>
        <select
          class="sort-select"
          value={props.filter.sort}
          onChange={(e) =>
            props.onChange({ ...props.filter, sort: e.currentTarget.value as SortKey })
          }
        >
          <For each={SORT_OPTIONS}>
            {(opt) => <option value={opt.value}>{opt.label}</option>}
          </For>
        </select>
      </div>
    </div>
  );
};
