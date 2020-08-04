<script>
import { onMount } from 'svelte';
import App from './App.svelte';
/** @ioc-ignore */
import SvelteBridge from './SvelteBridge.svelte';

export function loadScript(src) {
    return new Promise(resolve => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        document.head.appendChild(script);
    });
}

export function loadCss(href) {
    return new Promise(resolve => {
        const link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        document.head.appendChild(link);
    });
}

function getHooks(event) {
    const store = window.__DIS__.get();
    return Object.keys(store)
        .filter(key => key.startsWith(`layout-intercept/${event}/`))
        .map(key => [key, store[key]]);
}

let layout, baseRow;
onMount(async () => {
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

    await Promise.all([
        loadScript('http://code.jquery.com/jquery-1.11.1.min.js'),
        loadScript('https://golden-layout.com/files/latest/js/goldenlayout.min.js'),
        loadCss('https://golden-layout.com/files/latest/css/goldenlayout-base.css'),
        loadCss('https://golden-layout.com/files/latest/css/goldenlayout-light-theme.css')
    ]);

    layout = new GoldenLayout(config);

    // the IIFE is necessary because:
    // Svelte apparently won't catch the reference to SvelteBridge inside a normal function like this
    // (keep getting 'SvelteBridge is undefined')
    // GoldenLayout won't allow an anonymous function, because they can't be used as constructors.
    // So I need a normal function that has a working reference to SvelteBridge
    // an IIFE seemed appropriate
    console.log('bridge is', SvelteBridge);
    layout.registerComponent('SvelteBridge', (function(SvelteBridge) {
        return function(container, componentState) {
            if (componentState.lm_title) container.setTitle(componentState.lm_title);

            return new SvelteBridge({
                target: container.getElement()[0],
                props: componentState
            });
        }
    })(SvelteBridge));

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