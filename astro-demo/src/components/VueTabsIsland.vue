<template>
  <div class="island" data-framework="vue">
    <div ref="tabListRef" role="tablist" class="tabs-container">
      <button v-for="(tab, i) in tabs" :key="i" role="tab" :aria-controls="'vue-tabpanel-' + i" :id="'vue-tab-' + i" :aria-selected="i === activeTab" :tabindex="i === activeTab ? '0' : '-1'">
        {{ tab.label }}
      </button>
    </div>
    <div v-for="(tab, i) in tabs" :key="'panel-' + i" :id="'vue-tabpanel-' + i" role="tabpanel" :aria-labelledby="'vue-tab-' + i" class="tab-panel" :hidden="i !== activeTab">
      {{ tab.content }}
    </div>
    <button @click="showToast" style="margin-top: 1.5rem">Toast from Vue</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const tabListRef = ref(null);
let ctrl = null;

const tabs = ref([
  { label: 'Tab A', content: 'Content for Tab A' },
  { label: 'Tab B', content: 'Content for Tab B' },
  { label: 'Tab C', content: 'Content for Tab C' },
]);
const activeTab = ref(0);

function showToast() {
  import('tatami-a11y').then(({ Toast }) => {
    Toast.show('Toast from Vue island', { variant: 'warning' });
  });
}

onMounted(async () => {
  if (tabListRef.value) {
    const { tatami } = await import('tatami-a11y/adapters/tatami.js');
    const { Tabs } = await import('tatami-a11y');
    ctrl = tatami(Tabs, { tabList: tabListRef.value });
  }
});

onUnmounted(() => {
  if (ctrl) {
    ctrl.destroy();
    ctrl = null;
  }
});
</script>