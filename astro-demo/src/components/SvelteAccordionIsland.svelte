<script>
  import { onMount, onDestroy } from 'svelte';

  export let items = [
    { label: 'Section 1', content: 'Content for section 1' },
    { label: 'Section 2', content: 'Content for section 2' },
    { label: 'Section 3', content: 'Content for section 3' },
  ];

  let containerRef;
  let ctrl = null;

  function showToast() {
    import('tatami-a11y').then(({ Toast }) => {
      Toast.show('Toast from Svelte island', { variant: 'error' });
    });
  }

  onMount(async () => {
    if (containerRef) {
      const { tatami } = await import('tatami-a11y/adapters/tatami.js');
      const { Accordion } = await import('tatami-a11y');
      ctrl = tatami(Accordion, { container: containerRef });
    }
  });

  onDestroy(() => {
    if (ctrl) {
      ctrl.destroy();
      ctrl = null;
    }
  });
</script>

<div class="island" data-framework="svelte">
  <div bind:this={containerRef} class="accordion-container" style="padding-bottom: 1rem">
    {#each items as item, i}
      <div class="accordion-item">
        <button class="accordion-trigger" aria-controls="svelte-panel-{i}" id="svelte-header-{i}">
          {item.label}
        </button>
        <div class="accordion-panel" id="svelte-panel-{i}" role="region" aria-labelledby="svelte-header-{i}" hidden>
          {item.content}
        </div>
      </div>
    {/each}
  </div>
  <button on:click={showToast} style="margin-top: 1.5rem">Toast from Svelte</button>
</div>