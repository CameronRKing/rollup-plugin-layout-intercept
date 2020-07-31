<script>
import { onMount } from 'svelte';
import App from './App.svelte';
import 'jquery';
import 'golden-layout';
import 'golden-layout/src/css/goldenlayout-base.css';
import 'golden-layout/src/css/goldenlayout-translucent-theme.css';

function loadScript(src) {
    return new Promise(resolve => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        document.head.appendChild(script);
    });
}

function loadCss(href) {
    return new Promise(resolve => {
        const link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        document.head.appendChild(link);
    });
}

function registerSvelteComponent(name, CmpClass, callbacks={}) {
    return [name, function(container, componentState) {
        if (componentState.lm_title) {
            container.setTitle(componentState.lm_title);
        }
        const cmp = new CmpClass({
            target: container.getElement()[0],
            props: componentState
        });

        Object.keys(callbacks).forEach(event => cmp.$on(event, callbacks[event]));

        return cmp;
    }];
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
                    componentName: 'App',
                    componentState: $$restProps
                }]
            }]
        }]
    };

    layout = new GoldenLayout(config);

    // emit('init')

    layout.registerComponent(...registerSvelteComponent('App', App));

    setTimeout(() => layout.init(), 100);
    setTimeout(() => {
        // emit('loaded')
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
            header.style.display = 'block';
            content.style.background = contentBg;
            base.style.background = baseBg;
        };

        window.hideLayout();
    }, 200);
});

</script>