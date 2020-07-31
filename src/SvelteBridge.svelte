<script>

const __DIS__ = window.__DIS__;
export let component;

$: cmp = $__DIS__[component];
</script>

<svelte:component this={cmp} {...$$restProps} />