<script>
import { onMount } from 'svelte';
import App from './App.svelte';
import * as Widgets from '@lumino/widgets';
import { CommandRegistry } from '@lumino/commands';
import '@lumino/default-theme/style/index.css';
import SvelteWidget from './SvelteWidget.js';

const { BoxPanel, DockPanel, SplitPanel, Widget } = Widgets;


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

function makeCmp(component, state, opts={}) {
    return new SvelteWidget(component, state, opts);
}

const commands = new CommandRegistry();

let wrapper, main, dock, split, appWidget, lastParent;
onMount(async () => {
    main = new BoxPanel({ direction: 'left-to-right', spacing: 0 })
    split = new SplitPanel();
    dock = new DockPanel();
    BoxPanel.setStretch(dock, 1);
    main.addWidget(split);
    split.addWidget(dock);

    // to preserve editor layout on hide, the App widget is inserted/pulled from the widget hierarchy
    // and attached by itself, if we're not editing
    lastParent = dock;
    appWidget = new SvelteWidget('/src/App.svelte', $$props);
    Widget.attach(appWidget, wrapper);

    // maybe .replace should be renamed .register?
    window.__DIS__.replace('layout-intercept/layout', main);
    window.__DIS__.replace('layout-intercept/makeCmp', makeCmp);
    window.__DIS__.replace('layout-intercept/widgets', Widgets);

    window.hideLayout = () => {
        Widget.detach(main);

        lastParent = appWidget.parent;
        appWidget.parent = null;

        Widget.attach(appWidget, wrapper);
    }

    let firstTime = true;
    window.showLayout = () => {
        Widget.detach(appWidget);
        Widget.attach(main, wrapper);
        // this logic doesn't respect placement, but that's not a big deal for now
        lastParent.addWidget(appWidget);

        if (firstTime) {
            firstTime = false;
            runHooks('onInit', main, makeCmp, Widgets, commands);
        }

        runHooks('onShow', main, makeCmp, Widgets, commands);
    };
});

</script>

<style>
:global(html, body) {
    height: 100%;
}

:global(.lm-Widget) {
    height: 100% !important;
}
</style>

<div style="width: 100%; height: 100%;" bind:this={wrapper}></div>
<svelte:window on:resize={() => main.update()} on:keydown={e => commands.processKeydownEvent(e)} />