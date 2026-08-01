<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Toast, Dropdown } from 'tatami-a11y';
import { tatami } from '../../adapters/tatami.js';

// --- Toast Naive ---
const toastCount = ref(0);
const toastResult = ref('Idle');

function handleShowToastNaive() {
  Toast.show('Naive toast message', { variant: 'info' });
  toastResult.value = 'Toast shown';
}

function handleRerenderToastNaive() {
  toastCount.value++;
  setTimeout(() => {
    const toastEl = document.querySelector('.toast');
    if (toastEl && toastEl.isConnected) {
      toastResult.value = 'PASS: Toast survived re-render (naive)';
    } else {
      toastResult.value = 'FAIL: Toast removed from DOM after re-render';
    }
  }, 100);
}

// --- Toast Wrapper ---
const toastWrapCount = ref(0);
const toastWrapResult = ref('Idle');
const toastContainerRef = ref(null);

function handleShowToastWrapper() {
  Toast.show('Wrapper toast message', { variant: 'success' });
  toastWrapResult.value = 'Toast shown';
}

function handleRerenderToastWrapper() {
  toastWrapCount.value++;
  setTimeout(() => {
    const toastEl = document.querySelector('.toast');
    if (toastEl && toastEl.isConnected) {
      toastWrapResult.value = 'PASS: Toast survived re-render (wrapper)';
    } else {
      toastWrapResult.value = 'FAIL: Toast removed from DOM after re-render';
    }
  }, 100);
}

// --- Dropdown Naive ---
const dropdownCount = ref(0);
const dropdownResult = ref('Idle');
const triggerRef = ref(null);
const menuRef = ref(null);
let dropdownNaive = null;

onMounted(() => {
  if (triggerRef.value && menuRef.value) {
    dropdownNaive = new Dropdown({
      trigger: triggerRef.value,
      menu: menuRef.value,
    });
  }
});

function handleOpenDropdownNaive() {
  try {
    dropdownNaive?.open();
    dropdownResult.value = 'Dropdown opened';
  } catch (e) {
    dropdownResult.value = 'ERROR on open: ' + e.message;
  }
}

function handleRerenderDropdownNaive() {
  dropdownCount.value++;
  setTimeout(() => {
    try {
      dropdownNaive?.open();
      const menu = menuRef.value;
      if (menu && menu.getAttribute('aria-hidden') === 'false') {
        dropdownResult.value = 'PASS: Dropdown works after re-render (naive)';
      } else {
        dropdownResult.value = 'FAIL: Dropdown menu not openable after re-render';
      }
    } catch (e) {
      dropdownResult.value = 'FAIL ERROR: ' + e.message;
    }
  }, 100);
}

// --- Dropdown Wrapper ---
const dropdownWrapCount = ref(0);
const dropdownWrapResult = ref('Idle');
const triggerWrapRef = ref(null);
const menuWrapRef = ref(null);
let dropdownWrapCtrl = null;

onMounted(() => {
  // tatami() replaces the manual new Dropdown() + destroy() boilerplate.
  // Works for any tatami-a11y component — same three lines every time.
  dropdownWrapCtrl = tatami(Dropdown, {
    trigger: triggerWrapRef.value,
    menu: menuWrapRef.value,
  });
});

onUnmounted(() => {
  dropdownWrapCtrl?.destroy();
  dropdownWrapCtrl = null;
});

function handleOpenDropdownWrapper() {
  try {
    dropdownWrapCtrl?.open();
    dropdownWrapResult.value = 'Dropdown opened';
  } catch (e) {
    dropdownWrapResult.value = 'ERROR on open: ' + e.message;
  }
}

function handleRerenderDropdownWrapper() {
  dropdownWrapCount.value++;
  setTimeout(() => {
    try {
      dropdownWrapCtrl?.open();
      const menu = menuWrapRef.value;
      if (menu && menu.getAttribute('aria-hidden') === 'false') {
        dropdownWrapResult.value = 'PASS: Dropdown works after re-render (tatami() wrapper)';
      } else {
        dropdownWrapResult.value = 'FAIL: Dropdown menu not openable after re-render';
      }
    } catch (e) {
      dropdownWrapResult.value = 'FAIL ERROR: ' + e.message;
    }
  }, 100);
}
</script>

<template>
  <div class="app">
    <h1>Vue — Framework Interop Test</h1>

    <div class="test-section">
      <h3>Toast — Naive (no wrapper)</h3>
      <button @click="handleShowToastNaive">Show Toast</button>
      <button @click="handleRerenderToastNaive">Re-render (count: {{ toastCount }})</button>
      <p class="result">{{ toastResult }}</p>
    </div>

    <div class="test-section">
      <h3>Toast — Wrapper (ref + onMounted/onUnmounted)</h3>
      <div ref="toastContainerRef" />
      <button @click="handleShowToastWrapper">Show Toast</button>
      <button @click="handleRerenderToastWrapper">Re-render (count: {{ toastWrapCount }})</button>
      <p class="result">{{ toastWrapResult }}</p>
    </div>

    <div class="test-section">
      <h3>Dropdown — Naive (no wrapper)</h3>
      <button ref="triggerRef">Trigger</button>
      <div ref="menuRef">
        <div role="menuitem">Item 1</div>
        <div role="menuitem">Item 2</div>
      </div>
      <button @click="handleOpenDropdownNaive">Open Dropdown</button>
      <button @click="handleRerenderDropdownNaive">Re-render (count: {{ dropdownCount }})</button>
      <p class="result">{{ dropdownResult }}</p>
    </div>

    <div class="test-section">
      <h3>Dropdown — Wrapper (mount() utility)</h3>
      <button ref="triggerWrapRef">Trigger</button>
      <div ref="menuWrapRef">
        <div role="menuitem">Item 1</div>
        <div role="menuitem">Item 2</div>
      </div>
      <button @click="handleOpenDropdownWrapper">Open Dropdown</button>
      <button @click="handleRerenderDropdownWrapper">Re-render (count: {{ dropdownWrapCount }})</button>
      <p class="result">{{ dropdownWrapResult }}</p>
    </div>
  </div>
</template>

<style scoped>
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