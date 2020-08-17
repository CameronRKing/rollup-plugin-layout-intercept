import { Widget } from '@lumino/widgets';
/** @ioc-ignore */
import SvelteBridge from './SvelteBridge.svelte';

export default class SvelteWidget extends Widget {
    constructor(component, props, id='') {
        const node = document.createElement('div');
        super({ node });
        this.target = document.createElement('div');
        this.target.style.position = 'fixed';
        node.appendChild(this.target);
        this.cmpInstance = null;
        this.component = component;
        this.props = props;

        this.id = id;
        this.title.label = component;
        this.title.closable = true;
    }

    onAfterAttach() {
        this.cmpInstance = new SvelteBridge({
            target: this.target,
            props: { ...this.props, component: this.component }
        });
    }

    onBeforeDetach() {
        this.cmpInstance.$destroy();
    }
}