<script>
  import { Toast, Dropdown } from 'tatami-a11y';
  import { tatami } from '../../adapters/tatami.js';

  // --- Toast Naive ---
  let toastCount = $state(0);
  let toastResult = $state('Idle');

  function handleShowToastNaive() {
    Toast.show('Naive toast message', { variant: 'info' });
    toastResult = 'Toast shown';
  }

  function handleRerenderToastNaive() {
    toastCount++;
    setTimeout(() => {
      const toastEl = document.querySelector('.toast');
      if (toastEl && toastEl.isConnected) {
        toastResult = 'PASS: Toast survived re-render (naive)';
      } else {
        toastResult = 'FAIL: Toast removed from DOM after re-render';
      }
    }, 100);
  }

  // --- Toast Wrapper ---
  let toastWrapCount = $state(0);
  let toastWrapResult = $state('Idle');
  let toastContainerEl = $state(null);

  function handleShowToastWrapper() {
    Toast.show('Wrapper toast message', { variant: 'success' });
    toastWrapResult = 'Toast shown';
  }

  function handleRerenderToastWrapper() {
    toastWrapCount++;
    setTimeout(() => {
      const toastEl = document.querySelector('.toast');
      if (toastEl && toastEl.isConnected) {
        toastWrapResult = 'PASS: Toast survived re-render (wrapper)';
      } else {
        toastWrapResult = 'FAIL: Toast removed from DOM after re-render';
      }
    }, 100);
  }

  // --- Dropdown Naive ---
  let dropdownCount = $state(0);
  let dropdownResult = $state('Idle');
  let triggerEl = $state(null);
  let menuEl = $state(null);
  let dropdownNaive = null;

  $effect(() => {
    if (triggerEl && menuEl && !dropdownNaive) {
      dropdownNaive = new Dropdown({
        trigger: triggerEl,
        menu: menuEl,
      });
    }
  });

  function handleOpenDropdownNaive() {
    try {
      dropdownNaive?.open();
      dropdownResult = 'Dropdown opened';
    } catch (e) {
      dropdownResult = 'ERROR on open: ' + e.message;
    }
  }

  function handleRerenderDropdownNaive() {
    dropdownCount++;
    setTimeout(() => {
      try {
        dropdownNaive?.open();
        if (menuEl && menuEl.getAttribute('aria-hidden') === 'false') {
          dropdownResult = 'PASS: Dropdown works after re-render (naive)';
        } else {
          dropdownResult = 'FAIL: Dropdown menu not openable after re-render';
        }
      } catch (e) {
        dropdownResult = 'FAIL ERROR: ' + e.message;
      }
    }, 100);
  }

  // --- Dropdown Wrapper (use: action backed by tatami()) ---
  let dropdownWrapCount = $state(0);
  let dropdownWrapResult = $state('Idle');
  let triggerWrapEl = $state(null);
  let menuWrapEl = $state(null);
  let dropdownWrapCtrl = null;

  // Svelte use: action — tatami() replaces the inline new Dropdown() boilerplate.
  // Works for any tatami-a11y component: same pattern, different class name.
  function dropdownAction(node) {
    let initId = setTimeout(() => {
      if (node && menuWrapEl) {
        dropdownWrapCtrl = tatami(Dropdown, { trigger: node, menu: menuWrapEl });
      }
    }, 0);
    return {
      destroy() {
        clearTimeout(initId);
        dropdownWrapCtrl?.destroy();
        dropdownWrapCtrl = null;
      },
    };
  }

  function handleOpenDropdownWrapper() {
    try {
      dropdownWrapCtrl?.open();
      dropdownWrapResult = 'Dropdown opened';
    } catch (e) {
      dropdownWrapResult = 'ERROR on open: ' + e.message;
    }
  }

  function handleRerenderDropdownWrapper() {
    dropdownWrapCount++;
    setTimeout(() => {
      try {
        dropdownWrapCtrl?.open();
        if (menuWrapEl && menuWrapEl.getAttribute('aria-hidden') === 'false') {
          dropdownWrapResult = 'PASS: Dropdown works after re-render (tatami() wrapper)';
        } else {
          dropdownWrapResult = 'FAIL: Dropdown menu not openable after re-render';
        }
      } catch (e) {
        dropdownWrapResult = 'FAIL ERROR: ' + e.message;
      }
    }, 100);
  }
</script>

<div class="app">
  <h1>Svelte — Framework Interop Test</h1>

  <div class="test-section">
    <h3>Toast — Naive (no wrapper)</h3>
    <button onclick={handleShowToastNaive}>Show Toast</button>
    <button onclick={handleRerenderToastNaive}>Re-render (count: {toastCount})</button>
    <p class="result">{toastResult}</p>
  </div>

  <div class="test-section">
    <h3>Toast — Wrapper (use: action)</h3>
    <div bind:this={toastContainerEl}></div>
    <button onclick={handleShowToastWrapper}>Show Toast</button>
    <button onclick={handleRerenderToastWrapper}>Re-render (count: {toastWrapCount})</button>
    <p class="result">{toastWrapResult}</p>
  </div>

  <div class="test-section">
    <h3>Dropdown — Naive (no wrapper)</h3>
    <button bind:this={triggerEl}>Trigger</button>
    <div bind:this={menuEl}>
      <div role="menuitem">Item 1</div>
      <div role="menuitem">Item 2</div>
    </div>
    <button onclick={handleOpenDropdownNaive}>Open Dropdown</button>
    <button onclick={handleRerenderDropdownNaive}>Re-render (count: {dropdownCount})</button>
    <p class="result">{dropdownResult}</p>
  </div>

  <div class="test-section">
    <h3>Dropdown — Wrapper (mount() utility via use: action)</h3>
    <button use:dropdownAction={menuWrapEl} bind:this={triggerWrapEl}>Trigger</button>
    <div bind:this={menuWrapEl}>
      <div role="menuitem">Item 1</div>
      <div role="menuitem">Item 2</div>
    </div>
    <button onclick={handleOpenDropdownWrapper}>Open Dropdown</button>
    <button onclick={handleRerenderDropdownWrapper}>Re-render (count: {dropdownWrapCount})</button>
    <p class="result">{dropdownWrapResult}</p>
  </div>
</div>

<style>
  .app {
    font-family: system-ui, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .test-section {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .test-section h3 {
    margin-top: 0;
  }

  .test-section button {
    margin-right: 8px;
    margin-bottom: 8px;
    padding: 8px 16px;
    cursor: pointer;
  }

  .result {
    font-weight: bold;
    margin-top: 8px;
    padding: 8px;
    border-radius: 4px;
    background: #f5f5f5;
  }
</style>