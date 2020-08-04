<script>
export let component;

$: cmp = $__DIS__[component];
</script>

<svelte:component this={cmp} {...$$restProps} />