import fs from 'fs';
import path from 'path';

export default function layoutIntercept() {
    return {
        name: 'layout-intercept',
        resolveId(importee, importer) {
            if (importee.endsWith('/App.svelte') && importer.endsWith('main.js')) {
                return path.resolve(path.dirname(importer), importee).replace('App.svelte', '_LayoutWrapper.svelte');
            }
        },
        load(id) {
            if (id.endsWith('_LayoutWrapper.svelte')) return fs.readFileSync('./src/LayoutWrapper.svelte', 'utf8');
        }
    };
}