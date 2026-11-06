import { readdirSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const VIRTUAL = 'virtual:track-editor-media';
const RESOLVED = '\0' + VIRTUAL;
const AUDIO = new Set(['.mp3', '.m4a', '.wav', '.ogg']);
const IMAGES = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function collect(root, folder, extensions) {
  const output = [];
  function visit(directory) {
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, item.name);
      if (item.isDirectory()) visit(absolute);
      else if (item.isFile() && extensions.has(extname(item.name).toLowerCase())) {
        const path = relative(root, absolute).split(sep).map(encodeURIComponent).join('/');
        output.push('/' + path);
      }
    }
  }
  visit(join(root, folder));
  return output.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function trackEditorMediaPlugin(root = process.cwd()) {
  const publicRoot = join(root, 'public');
  const folders = [join(publicRoot, 'audio', 'tracks'), join(publicRoot, 'images')];
  return {
    name: 'track-editor-media-catalog',
    resolveId(id) { if (id === VIRTUAL) return RESOLVED; },
    load(id) {
      if (id !== RESOLVED) return;
      return 'export default ' + JSON.stringify({
        audio: collect(publicRoot, 'audio/tracks', AUDIO),
        images: collect(publicRoot, 'images', IMAGES)
      }) + ';';
    },
    configureServer(server) {
      server.watcher.add(folders);
      server.watcher.on('all', (event, path) => {
        if (!['add', 'unlink', 'addDir', 'unlinkDir'].includes(event)) return;
        if (!folders.some(folder => path.startsWith(folder))) return;
        const module = server.moduleGraph.getModuleById(RESOLVED);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload', path: '/editor.html' });
      });
    }
  };
}
