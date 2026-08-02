import { tatami } from 'tatami-a11y/adapters/tatami.js';
import { Dropdown } from 'tatami-a11y';
import { Toast } from 'tatami-a11y';

let ctrl = null;
let destroyed = false;

export function initJSDropdown() {
  const trigger = document.getElementById('js-dropdown-trigger');
  const menu = document.getElementById('js-dropdown-menu');

  if (!trigger || !menu || destroyed) return;

  ctrl = tatami(Dropdown, { trigger, menu });

  trigger.addEventListener('click', () => {
    if (ctrl && !destroyed) {
      ctrl.open();
    }
  });

  document.addEventListener('click', (e) => {
    if (ctrl && !destroyed && !trigger.contains(e.target) && !menu.contains(e.target)) {
      ctrl.close();
    }
  });
}

export function showToast() {
  if (!destroyed) {
    Toast.show('Toast from Plain JS island', { variant: 'info' });
  }
}

export function destroyJSDropdown() {
  destroyed = true;
  if (ctrl) {
    ctrl.destroy();
    ctrl = null;
  }
}