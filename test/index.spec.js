import { writable, get } from 'svelte/store';
import fs from 'fs';
import { expect } from 'chai';
import * as rollup from 'rollup';
import svelte from 'rollup-plugin-svelte';
import styles from 'rollup-plugin-styles';
import resolve from '@rollup/plugin-node-resolve';
import layoutIntercept from '..';
import { JSDOM } from 'jsdom';

describe('layout-intercept', () => {
    it('replaces the import of App.svelte in main.js with a Golden Layout wrapper component', () => {
        const plugin = layoutIntercept();
        const id = plugin.resolveId('./the/path/doesnt/matter/App.svelte', 'neither/does/this/one/main.js');
        expect(id).to.match(/_LayoutWrapper.svelte$/);

        const file = plugin.load(id);
        expect(file).to.equal(fs.readFileSync('./src/LayoutWrapper.svelte', 'utf8'));
    });
});

describe('browser behavior', () => {
    let dom;

    function layoutHeaderDisplay() {
        return dom.window.document.querySelector('.lm_header').style.display;
    }

    before(async function() {
        this.timeout(10000);

        const bundle = await rollup.rollup({
            input: 'test/main.js',
            plugins: [
                styles(),
                layoutIntercept(),
                svelte(),
                resolve(),
            ]
        });

        const { output: [{ code }] } = await bundle.generate({ format: 'iife' });

        // I can't import a svelte component into mocha
        // so I'll build and invoke it myself
        const appBundle = await rollup.rollup({
            input: 'test/App.svelte',
            plugins: [svelte(), resolve()]
        });
        const written = await appBundle.generate({ format: 'iife' });

        dom = new JSDOM('<!DOCTYPE html><body></body><script>' + code + '</script>', { runScripts: 'dangerously' });

        const App = (new Function('document', 'return ' + written.output[0].code))(dom.window.document);
        const store = writable({
            '/src/App': App
        });
        dom.window.__DIS__ = {
            subscribe: store.subscribe,
            replace: (name, val) => store.update(s => { s[name] = val; return s; }),
            get() { return get(store); },
        };

        return new Promise(resolve => setTimeout(resolve, 1000));
    });

    it('hides the layout by default', () => {
        expect(layoutHeaderDisplay()).to.equal('none');
    });

    it('exposes a showLayout() function that exposes the layout', () => {
        expect(layoutHeaderDisplay()).to.equal('none');
        dom.window.showLayout();
        expect(layoutHeaderDisplay()).to.equal('block');
    });

    it('exposes a hideLayout() function that hides the layout', () => {
        expect(layoutHeaderDisplay()).to.equal('block');
        dom.window.hideLayout();
        expect(layoutHeaderDisplay()).to.equal('none');
    });

    it('relies on window.__DIS__ (injected by peer dependency rollup-plugin-svelte-component-ioc) to mount Svelte components within the layout', () => {
        expect(dom.window.document.querySelector('#app')).to.be.ok;
    });

    it('runs hooks found in the dependency store when the layout is shown', () => {
        let hookCalled;
        dom.window.__DIS__.replace('layout-intercept/onShow/test', () => hookCalled = true);

        dom.window.showLayout();

        expect(hookCalled).to.be.true;
    });
});