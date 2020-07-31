<script>
import { onMount } from 'svelte';
import App from './App.svelte';
import SvelteBridge from './SvelteBridge.svelte';
import 'jquery';
import 'golden-layout';
import 'golden-layout/src/css/goldenlayout-base.css';
import 'golden-layout/src/css/goldenlayout-translucent-theme.css';

function getHooks(event) {
    const store = window.__DIS__.get();
    return Object.keys(store)
        .filter(key => key.startsWith(`layout-intercept/${event}/`))
        .map(key => [key, store[key]]);
}

let layout, baseRow;
onMount(() => {
    const config = {
        content: [{
            type: 'row',
            content:[{
                type: 'column',
                content:[{
                    type: 'component',
                    componentName: 'SvelteBridge',
                    componentState: { ...$$restProps, component: '/src/App' }
                }]
            }]
        }]
    };

    layout = new GoldenLayout(config);

    layout.registerComponent('SvelteBridge', function(container, componentState) {
        if (componentState.lm_title) container.setTitle(componentState.lm_title);

        return new SvelteBridge({
            target: container.getElement()[0],
            props: componentState
        });
    });

    setTimeout(() => layout.init(), 100);
    setTimeout(() => {
        baseRow = layout.root.contentItems[0];
        const header = document.querySelector('.lm_header'),
            content = document.querySelector('.lm_content'),
            base = document.querySelector('.lm_goldenlayout');

        const contentBg = content.style.background,
            baseBg = base.style.background;

        window.hideLayout = () => {
            while (baseRow.contentItems.length > 1) {
                baseRow.removeChild(baseRow.contentItems[0]);
            }

            header.style.display = 'none';
            content.style.background = 'transparent';
            base.style.background = 'transparent';
        }

        window.showLayout = () => {
            getHooks('onShow').forEach(([name, hook]) => {
                if (typeof hook !== 'function') {
                    console.warn(name + ' must be a function');
                    return;
                }
                hook();
            });

            header.style.display = 'block';
            content.style.background = contentBg;
            base.style.background = baseBg;
        };

        window.hideLayout();
    }, 200);
});

</script>