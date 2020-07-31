import fs from 'fs';
import { expect } from 'chai';
import * as rollup from 'rollup';
import svelte from 'rollup-plugin-svelte';
import styles from 'rollup-plugin-styles';
import resolve from '@rollup/plugin-node-resolve';
import layoutIntercept from '..';
import { JSDOM } from 'jsdom';

describe.skip('layout-intercept', () => {
    it('replaces the import of App.svelte in main.js with a Golden Layout wrapper component', () => {
        const plugin = layoutIntercept();
        const id = plugin.resolveId('./the/path/doesnt/matter/App.svelte', 'neither/does/this/one/main.js');
        expect(id).to.equal('src/_LayoutWrapper.svelte');

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

        fs.writeFileSync('./bundle.js', code);

        dom = new JSDOM('<!DOCTYPE html><body></body><script>' + code + '</script>', { runScripts: 'dangerously' });

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
});