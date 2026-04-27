import { Component, For } from 'solid-js';
import { formatTime } from '../utils/formatTime';

interface Props {
  estimate: number; // milliseconds
  onUpdate: (newEstimate: number) => void;
}

interface Increment {
  label: string;
  ms: number;
}

const DECREMENTS: Increment[] = [
  { label: '−5h', ms: -5 * 60 * 60_000 },
  { label: '−1h', ms: -60 * 60_000 },
  { label: '−30m', ms: -30 * 60_000 },
  { label: '−15m', ms: -15 * 60_000 },
  { label: '−5m', ms: -5 * 60_000 },
];

const INCREMENTS: Increment[] = [
  { label: '+5m', ms: 5 * 60_000 },
  { label: '+15m', ms: 15 * 60_000 },
  { label: '+30m', ms: 30 * 60_000 },
  { label: '+1h', ms: 60 * 60_000 },
  { label: '+5h', ms: 5 * 60 * 60_000 },
];

export const EstimateButtons: Component<Props> = (props) => {
  const handleClick = (e: MouseEvent, deltaMs: number) => {
    e.stopPropagation();
    const next = Math.max(0, props.estimate + deltaMs);
    props.onUpdate(next);
  };

  return (
    <div class="estimate-buttons" onClick={(e) => e.stopPropagation()}>
      <For each={DECREMENTS}>
        {(inc) => (
          <button
            class="btn-increment"
            disabled={props.estimate === 0}
            onClick={(e) => handleClick(e, inc.ms)}
          >
            {inc.label}
          </button>
        )}
      </For>
      <span class="estimate-value">{formatTime(props.estimate)}</span>
      <For each={INCREMENTS}>
        {(inc) => (
          <button
            class="btn-increment"
            onClick={(e) => handleClick(e, inc.ms)}
          >
            {inc.label}
          </button>
        )}
      </For>
    </div>
  );
};