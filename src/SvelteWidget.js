import { Widget } from '@lumino/widgets';
/** @ioc-ignore */
import SvelteBridge from './SvelteBridge.svelte';

export default class SvelteWidget extends Widget {
    constructor(component, props, { label }={}) {
        const node = document.createElement('div');
        super({ node });
        this.target = document.createElement('div');
        this.target.style.height = '100%';
        node.appendChild(this.target);
        this.cmpInstance = null;
        this.component = component;
        this.props = props;

        this.title.label = label ? label : component;
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