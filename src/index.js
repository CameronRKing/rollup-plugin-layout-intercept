import fs from 'fs';
import path from 'path';

export default function layoutIntercept() {
    return {
        name: 'layout-intercept',
        resolveId(importee, importer) {
            function replacePath(original, replacement) {
                return path.resolve(path.dirname(importer), importee).replace(original, replacement);
            }
            if (importee.endsWith('/App.svelte') && importer.endsWith('main.js')) {
                return replacePath('App.svelte', '_LayoutWrapper.svelte');
            }

            if (importee == './SvelteWidget.js' && importer.endsWith('_LayoutWrapper.svelte')) {
                return replacePath('_LayoutWrapper.svelte', 'SvelteWidget.js');
            }

            if (importee == './SvelteBridge.svelte' && importer.endsWith('SvelteWidget.js')) {
                return replacePath('SvelteWidget.js', 'SvelteBridge.svelte');
            }
        },
        load(id) {
            if (id.endsWith('_LayoutWrapper.svelte')) return fs.readFileSync(path.resolve(__dirname, './LayoutWrapper.svelte'), 'utf8');
            if (id.endsWith('SvelteBridge.svelte')) return fs.readFileSync(path.resolve(__dirname, './SvelteBridge.svelte'), 'utf8');
            if (id.endsWith('SvelteWidget.js')) return fs.readFileSync(path.resolve(__dirname, './SvelteWidget.js'), 'utf8');
        }
    };
}