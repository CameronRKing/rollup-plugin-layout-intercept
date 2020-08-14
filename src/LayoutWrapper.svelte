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

function runHooks(event, ...data) {
    getHooks(event).forEach(([name, hook]) => {
        if (typeof hook !== 'function') {
            console.warn(`layout-intercept/${event}/${name} must be a function`);
            return;
        }
        hook(...data);
    });
}

function makeCmp(component, state) {
    return {
        type: 'component',
        componentName: 'SvelteBridge',
        componentState: {
            ...state,
            component
        }
    }
}

let layout, baseRow;
onMount(async () => {
    const config = {
        content: [{
            type: 'row',
            isClosable: false,
            content:[{
                type: 'column',
                content:[{
                    type: 'component',
                    componentName: 'SvelteBridge',
                    componentState: { ...$$restProps, component: '/src/App.svelte' }
                }]
            }]
        }]
    };

    await loadScript('http://code.jquery.com/jquery-1.11.1.min.js');
    await Promise.all([
        loadScript('https://golden-layout.com/files/latest/js/goldenlayout.min.js'),
        loadCss('https://golden-layout.com/files/latest/css/goldenlayout-base.css'),
        loadCss('https://golden-layout.com/files/latest/css/goldenlayout-light-theme.css')
    ]);

    layout = new GoldenLayout(config);

    // maybe .replace should be renamed .register?
    window.__DIS__.replace('layout-intercept/makeCmp', makeCmp);
    window.__DIS__.replace('layout-intercept/gl_layout', layout);

    // the IIFE is necessary because:
    // Svelte apparently won't catch the reference to SvelteBridge inside a normal function like this
    // (keep getting 'SvelteBridge is not a constructor')
    // GoldenLayout won't allow an anonymous function, because they can't be used as constructors.
    // So I need a normal function that has a working reference to SvelteBridge
    // an IIFE seemed appropriate
    layout.registerComponent('SvelteBridge', function(container, componentState) {
        if (componentState.lm_title) container.setTitle(componentState.lm_title);
        else container.setTitle(componentState.component);

        const cmp = new SvelteBridge({
            target: container.getElement()[0],
            props: Object.assign(componentState, { gl_container: container, gl_layout: layout })
        });

        container.on('destroy', () => {
            try {
                cmp.$destroy();
            } catch(e) {
                console.warn('Are you using the svelte-devtools browser extension? Try disabling it.')
                throw e;
            }
        });

        return cmp;
    });

    /**
     * I tried for a few hours to switch between editing and normal views
     * in a way that preserves both the current App state and the editor layout.
     * But it seems as though GoldenLayout doesn't reattach all its event handlers
     * when you work with it on such a low level.
     * This code "works"; both App state and editor layout are preserved;
     * however, NONE OF THE GOLDEN LAYOUT UI WORKS and I have no idea why.
     *
     * I give up.
     * 
     * I leave the code commented out in case I want to take another crack at it in the future.
     **/
    // window.l = layout;

    // layout.registerComponent('AppPlaceholder', function(container, componentState) {
    //     return {};
    // });

    // function findApp(root) {
    //     return root.getItemsByFilter(item => item.isComponent && item.config.componentState.component == '/src/App')[0];
    // }

    // function findAppPlaceholder(root) {
    //     return root.getItemsByFilter(item => item.isComponent && item.componentName == 'AppPlaceholder')[0];
    // }

    // function setRoot(root) {
    //     // first, pull out the App component and mark where it was with a placeholder
    //     const app = findApp(layout.root.contentItems[0]);
    //     const appIdx = app.parent.contentItems.indexOf(app);
    //     app.parent.addChild({ type: 'component', componentName: 'AppPlaceholder', componentState: {} }, appIdx);
    //     app.parent.removeChild(app, true);

    //     // then, replace the appless root with the new root
    //     const oldRoot = layout.root.contentItems[0];
    //     layout.root.removeChild(oldRoot, true);
    //     oldRoot.element.remove();
    //     layout.root.addChild(root);

    //     // finally, add the App into the placeholder in the new root
    //     const placeholder = findAppPlaceholder(root);
    //     placeholder.parent.replaceChild(placeholder, app);
    //     app.container.show();
    // }

    setTimeout(() => layout.init(), 100);
    setTimeout(() => {
        // // the easiest way to hydrate a second config is to add it
        // // then remove it without destroying it
        // const editingRoot = layout.root.contentItems[0];
        // const app = findApp(editingRoot);
        // const appIdx = app.parent.contentItems.indexOf(app);
        // app.parent.addChild({ type: 'component', componentName: 'AppPlaceholder', componentState: {} }, appIdx);
        // app.parent.removeChild(app, true);
        // layout.root.removeChild(editingRoot, true);
        // editingRoot.element.remove();

        // layout.root.addChild({
        //     type: 'row',
        //     content: [{
        //         type: 'component',
        //         componentName: 'AppPlaceholder',
        //         componentState: {},
        //     }]
        // });
        // const normalRoot = layout.root.contentItems[0];
        // const placeholder = findAppPlaceholder(normalRoot);
        // placeholder.parent.replaceChild(placeholder, app);
        // app.container.show();
        baseRow = layout.root.contentItems[0];
        const header = document.querySelector('.lm_header'),
            content = document.querySelector('.lm_content'),
            base = document.querySelector('.lm_goldenlayout'),
            contentBg = content.style.background,
            baseBg = base.style.background;

        window.hideLayout = () => {
            // assume the App is in a single column on the rightmost side
            while (baseRow.contentItems.length > 1) {
                baseRow.removeChild(baseRow.contentItems[0]);
            }

            header.style.display = 'none';
            content.style.background = 'transparent';
            base.style.background = 'transparent';
        }

        let firstTime = true;
        window.showLayout = () => {
            if (firstTime) {
                firstTime = false;
                runHooks('onInit');
            }

            runHooks('onShow', baseRow, makeCmp);

            header.style.display = 'block';
            content.style.background = contentBg;
            base.style.background = baseBg;
        };

        hideLayout();
    }, 200);
});

</script>