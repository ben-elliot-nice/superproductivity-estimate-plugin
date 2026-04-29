import { Component, For } from 'solid-js';

export type SortKey = 'default' | 'estimate-asc' | 'estimate-desc' | 'scheduled-asc' | 'scheduled-desc';
export type ScheduleFilter = 'all' | 'scheduled' | 'unscheduled';
export type EstimateFilter = 'all' | 'estimated' | 'unestimated';

export interface FilterState {
  text: string;
  scheduleFilter: ScheduleFilter;
  estimateFilter: EstimateFilter;
  sort: SortKey;
}

export const DEFAULT_FILTER: FilterState = {
  text: '',
  scheduleFilter: 'all',
  estimateFilter: 'all',
  sort: 'default',
};

interface Props {
  filter: FilterState;
  onChange: (f: FilterState) => void;
}

const SCHEDULE_CYCLE: Record<ScheduleFilter, ScheduleFilter> = {
  all: 'scheduled',
  scheduled: 'unscheduled',
  unscheduled: 'all',
};

const ESTIMATE_CYCLE: Record<EstimateFilter, EstimateFilter> = {
  all: 'estimated',
  estimated: 'unestimated',
  unestimated: 'all',
};

const SCHEDULE_LABELS: Record<ScheduleFilter, string> = {
  all: 'All',
  scheduled: 'Scheduled',
  unscheduled: 'Unscheduled',
};

const ESTIMATE_LABELS: Record<EstimateFilter, string> = {
  all: 'All',
  estimated: 'Estimated',
  unestimated: 'Unestimated',
};

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Default', value: 'default' },
  { label: 'Estimate — High to Low', value: 'estimate-desc' },
  { label: 'Estimate — Low to High', value: 'estimate-asc' },
  { label: 'Scheduled — Soonest First', value: 'scheduled-asc' },
  { label: 'Scheduled — Latest First', value: 'scheduled-desc' },
];

export const FilterBar: Component<Props> = (props) => {
  const cycleSchedule = () =>
    props.onChange({ ...props.filter, scheduleFilter: SCHEDULE_CYCLE[props.filter.scheduleFilter] });

  const cycleEstimate = () =>
    props.onChange({ ...props.filter, estimateFilter: ESTIMATE_CYCLE[props.filter.estimateFilter] });

  return (
    <div class="filter-bar">
      <div class="filter-section">
        <span class="filter-section-label">Filter</span>
        <div class="filter-section-inner">
          <input
            class="filter-search"
            type="text"
            placeholder="Filter by project, task, or subtask title"
            value={props.filter.text}
            onInput={(e) => props.onChange({ ...props.filter, text: e.currentTarget.value })}
          />
          <button
            class="filter-cycle-btn"
            classList={{
              'filter-cycle--active': props.filter.scheduleFilter === 'scheduled',
              'filter-cycle--inverse': props.filter.scheduleFilter === 'unscheduled',
            }}
            title="Cycle: All → Scheduled → Unscheduled"
            onClick={cycleSchedule}
          >
            <span class="filter-emoji">📅</span>{SCHEDULE_LABELS[props.filter.scheduleFilter]}
          </button>
          <button
            class="filter-cycle-btn"
            classList={{
              'filter-cycle--active': props.filter.estimateFilter === 'estimated',
              'filter-cycle--inverse': props.filter.estimateFilter === 'unestimated',
            }}
            title="Cycle: All → Estimated → Unestimated"
            onClick={cycleEstimate}
          >
            <span class="filter-emoji">🕐</span>{ESTIMATE_LABELS[props.filter.estimateFilter]}
          </button>
        </div>
      </div>
      <div class="sort-section">
        <span class="filter-section-label">Sort</span>
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
