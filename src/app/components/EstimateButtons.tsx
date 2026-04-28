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
  { label: '−1h', ms: -60 * 60_000 },
  { label: '−15m', ms: -15 * 60_000 },
  { label: '−5m', ms: -5 * 60_000 },
];

const INCREMENTS: Increment[] = [
  { label: '+5m', ms: 5 * 60_000 },
  { label: '+15m', ms: 15 * 60_000 },
  { label: '+1h', ms: 60 * 60_000 },
];

export const EstimateButtons: Component<Props> = (props) => {
  const handleClick = (e: MouseEvent, deltaMs: number) => {
    e.stopPropagation();
    const next = Math.max(0, props.estimate + deltaMs);
    props.onUpdate(next);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      props.onUpdate(props.estimate + 15 * 60_000);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      props.onUpdate(Math.max(0, props.estimate - 15 * 60_000));
    }
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
      <span
        class="estimate-value"
        tabIndex={0}
        role="spinbutton"
        aria-label="Time estimate"
        onKeyDown={handleKeyDown}
      >
        {formatTime(props.estimate) || '—'}
      </span>
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
