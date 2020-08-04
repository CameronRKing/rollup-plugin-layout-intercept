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

            if (importee == './SvelteBridge.svelte' && importer.endsWith('_LayoutWrapper.svelte')) {
                return replacePath('_LayoutWrapper.svelte', 'SvelteBridge.svelte');
            }
        },
        load(id) {
            if (id.endsWith('_LayoutWrapper.svelte')) return fs.readFileSync(path.resolve(__dirname, './LayoutWrapper.svelte'), 'utf8');
            if (id.endsWith('SvelteBridge.svelte')) return fs.readFileSync(path.resolve(__dirname, './SvelteBridge.svelte'), 'utf8');
        }
    };
}