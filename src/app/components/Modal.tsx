import { Component } from 'solid-js';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const Modal: Component<Props> = (props) => (
  <div class="modal-backdrop" onClick={props.onCancel}>
    <div class="modal-card" onClick={(e) => e.stopPropagation()}>
      <p class="modal-message">{props.message}</p>
      <div class="modal-actions">
        <button class="btn-modal-cancel" onClick={props.onCancel}>
          Cancel
        </button>
        <button class="btn-modal-confirm" onClick={props.onConfirm}>
          Confirm
        </button>
      </div>
    </div>
  </div>
);
