/* ===========================================
   Architecture Visualizer — Logic

   Uses event delegation (no inline onclick).
   Uses textContent instead of innerHTML for
   user/data-derived content (XSS safe).
   =========================================== */

'use strict';

/* --- File structure (updated to match actual repo) --- */
const fileStructure = {
    name: 'portfolio/',
    type: 'folder',
    children: [
        { name: 'index.html', type: 'html', size: '7 KB', desc: 'Main landing page — hero, projects, experience' },
        { name: 'dashboard.html', type: 'html', size: '3 KB', desc: 'Project dashboard with search & filters' },
        { name: 'architecture.html', type: 'html', size: '8 KB', desc: 'This architecture visualizer page' },
        { name: 'portfolio-blueprint.html', type: 'html', size: '30 KB', desc: 'Full portfolio reference/blueprint' },
        { name: 'style.css', type: 'css', size: '55 KB', desc: 'Landing page styles + light mode + accessibility' },
        { name: 'responsive.css', type: 'css', size: '6 KB', desc: 'All responsive breakpoints for landing page' },
        { name: 'dashboard.css', type: 'css', size: '8 KB', desc: 'Dashboard page styles' },
        { name: 'architecture.css', type: 'css', size: '7 KB', desc: 'Architecture page styles' },
        { name: 'sanitize.js', type: 'js', size: '2 KB', desc: 'Shared utilities: sanitize, theme toggle, debounce' },
        { name: 'profile-loader.js', type: 'js', size: '14 KB', desc: 'Loads profile.json → renders landing page' },
        { name: 'module-loader.js', type: 'js', size: '6 KB', desc: 'Loads modules → renders dashboard tiles' },
        { name: 'architecture.js', type: 'js', size: '4 KB', desc: 'Architecture page logic (this file)' },
        { name: 'Robert_Hidri_CV.pdf', type: 'pdf', size: '—', desc: 'Downloadable CV' },
        {
            name: 'config/',
            type: 'folder',
            children: [
                { name: 'profile.json', type: 'json', size: '8 KB', desc: 'All personal data, projects, skills, experience' },
                { name: 'modules-bundle.json', type: 'json', size: '12 KB', desc: 'Dashboard module definitions (bundled)' },
                { name: 'modules.json', type: 'json', size: '1 KB', desc: 'Module index for individual loading' }
            ]
        },
        {
            name: 'media/',
            type: 'folder',
            children: [
                { name: 'smartscale/', type: 'folder', desc: 'SmartScale project images' },
                { name: 'carbon-calc/', type: 'folder', desc: 'Carbon Calculator images' },
                { name: 'arduino-sense/', type: 'folder', desc: 'ArduinoSense images' },
                { name: 'portfolio/', type: 'folder', desc: 'Portfolio project images' }
            ]
        },
        {
            name: 'modules/',
            type: 'folder',
            children: [
                { name: 'python/', type: 'folder', desc: 'Python projects module' },
                { name: 'cpp/', type: 'folder', desc: 'C++ projects module' },
                { name: 'web-dev/', type: 'folder', desc: 'Web development module' },
                { name: 'devops/', type: 'folder', desc: 'DevOps module' },
                { name: 'architecture/', type: 'folder', desc: 'Architecture/design module' },
                { name: 'dev-tools/', type: 'folder', desc: 'Interactive browser tools' }
            ]
        }
    ]
};

/* --- Layer info data --- */
const layerInfo = {
    presentation: {
        title: 'Presentation Layer',
        description: 'The visual interface users interact with. HTML provides structure, CSS provides styling. No business logic here — just rendering.',
        files: ['index.html', 'dashboard.html', 'architecture.html', 'style.css', 'responsive.css', 'dashboard.css', 'architecture.css'],
        principles: ['Semantic HTML', 'CSS Grid/Flexbox', 'Responsive design', 'Accessibility (ARIA)', 'Light/dark theme via CSS custom properties']
    },
    logic: {
        title: 'Logic Layer',
        description: 'JavaScript classes that fetch data, process it, and update the DOM. Each file has a single responsibility. Event delegation over inline handlers. Shared utilities in sanitize.js.',
        files: ['profile-loader.js', 'module-loader.js', 'sanitize.js', 'architecture.js'],
        principles: ['ES6 Classes', 'Async/Await', 'Event delegation', 'XSS prevention via sanitize()', 'Theme toggle via localStorage']
    },
    data: {
        title: 'Data Layer',
        description: 'JSON configuration files that define ALL content. Change these files to update the site — no code changes needed. Single source of truth.',
        files: ['config/profile.json', 'config/modules-bundle.json', 'config/modules.json'],
        principles: ['Single source of truth', 'Schema consistency', 'Human-readable', 'Version controllable']
    },
    modules: {
        title: 'Module Layer',
        description: 'Self-contained feature folders. Each module has its own module.json + content.json. The dev-tools module even has custom JS. Drop in a folder = new module. Remove a folder = gone. Zero base-code changes.',
        files: ['modules/*/module.json', 'modules/*/content.json', 'modules/dev-tools/tools.js', 'media/*/'],
        principles: ['Self-contained', 'Hot-swappable', 'Independent', 'Discoverable', 'Objects are complete — world is dumb']
    }
};

/* --- Render file tree (XSS-safe: uses textContent) --- */
function renderFileTree(node, container) {
    const icons = {
        html: '📄', css: '🎨', js: '⚡', json: '📦',
        md: '📝', pdf: '📑', jpg: '🖼️', png: '🖼️',
        svg: '🖼️', txt: '📝'
    };

    if (node.type === 'folder') {
        const folderEl = document.createElement('div');
        folderEl.className = 'tree-item folder';
        folderEl.setAttribute('role', 'treeitem');
        folderEl.textContent = '📁 ' + node.name;
        if (node.desc) folderEl.title = node.desc;
        container.appendChild(folderEl);

        if (node.children) {
            const childContainer = document.createElement('div');
            childContainer.className = 'tree-children';
            childContainer.setAttribute('role', 'group');
            node.children.forEach(function (child) { renderFileTree(child, childContainer); });
            container.appendChild(childContainer);
        }
    } else {
        const fileEl = document.createElement('div');
        fileEl.className = 'tree-item file-' + node.type;
        fileEl.setAttribute('role', 'treeitem');
        fileEl.setAttribute('tabindex', '0');
        fileEl.dataset.fileName = node.name;
        fileEl.dataset.fileType = node.type;
        fileEl.dataset.fileSize = node.size || '';
        fileEl.dataset.fileDesc = node.desc || '';

        const icon = icons[node.type] || '📄';
        const nameSpan = document.createTextNode(icon + ' ' + node.name + ' ');
        fileEl.appendChild(nameSpan);

        if (node.size) {
            const sizeSpan = document.createElement('span');
            sizeSpan.className = 'file-size';
            sizeSpan.textContent = node.size;
            fileEl.appendChild(sizeSpan);
        }

        if (node.desc) fileEl.title = node.desc;
        container.appendChild(fileEl);
    }
}

/* --- Show layer info (XSS-safe: uses textContent + createElement) --- */
function showLayerInfo(layerId) {
    var info = layerInfo[layerId];
    if (!info) return;

    /* Update active state on layers */
    document.querySelectorAll('.layer').forEach(function (l) { l.classList.remove('active'); });
    var target = document.querySelector('[data-layer="' + layerId + '"]');
    if (target) target.classList.add('active');

    /* Build info panel content safely */
    var infoEl = document.getElementById('layerInfo');
    infoEl.innerHTML = ''; /* clear */

    var title = document.createElement('div');
    title.className = 'info-card-title';
    title.textContent = info.title;
    infoEl.appendChild(title);

    var content = document.createElement('div');
    content.className = 'info-card-content';

    var desc = document.createElement('p');
    desc.textContent = info.description;
    content.appendChild(desc);

    var filesLabel = document.createElement('p');
    filesLabel.innerHTML = '<strong>Files:</strong>';
    content.appendChild(filesLabel);

    var filesP = document.createElement('p');
    info.files.forEach(function (f, i) {
        var code = document.createElement('code');
        code.textContent = f;
        filesP.appendChild(code);
        if (i < info.files.length - 1) filesP.appendChild(document.createTextNode(' '));
    });
    content.appendChild(filesP);

    var princLabel = document.createElement('p');
    princLabel.innerHTML = '<strong>Principles:</strong>';
    content.appendChild(princLabel);

    var princP = document.createElement('p');
    princP.textContent = info.principles.join(', ');
    content.appendChild(princP);

    infoEl.appendChild(content);
}

/* --- Show file info (XSS-safe) --- */
function showFileInfo(el) {
    var infoEl = document.getElementById('layerInfo');
    infoEl.innerHTML = '';

    var title = document.createElement('div');
    title.className = 'info-card-title';
    title.textContent = el.dataset.fileName;
    infoEl.appendChild(title);

    var content = document.createElement('div');
    content.className = 'info-card-content';

    var typeP = document.createElement('p');
    typeP.innerHTML = '<strong>Type:</strong> ';
    typeP.appendChild(document.createTextNode(el.dataset.fileType.toUpperCase()));
    content.appendChild(typeP);

    var sizeP = document.createElement('p');
    sizeP.innerHTML = '<strong>Size:</strong> ';
    sizeP.appendChild(document.createTextNode(el.dataset.fileSize || 'Unknown'));
    content.appendChild(sizeP);

    if (el.dataset.fileDesc) {
        var descP = document.createElement('p');
        descP.textContent = el.dataset.fileDesc;
        content.appendChild(descP);
    }

    infoEl.appendChild(content);
}

/* --- Update stats from live data --- */
async function updateStats() {
    try {
        var responses = await Promise.all([
            fetch('config/profile.json'),
            fetch('config/modules-bundle.json')
        ]);
        var profile = await responses[0].json();
        var modules = await responses[1].json();

        var statFiles = document.getElementById('statFiles');
        var statLines = document.getElementById('statLines');
        var statModules = document.getElementById('statModules');
        var statProjects = document.getElementById('statProjects');

        if (statFiles) statFiles.textContent = String(fileStructure.children.length);
        if (statLines) statLines.textContent = '~4K';
        if (statModules) statModules.textContent = String(Object.keys(modules.modules || {}).length);
        if (statProjects) statProjects.textContent = String(profile.featuredProjects ? profile.featuredProjects.length : 0);

        var lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) lastUpdate.textContent = 'Live \u2022 ' + new Date().toLocaleTimeString();
    } catch (e) {
        console.error('Could not load stats:', e);
        var lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) lastUpdate.textContent = 'Offline';
    }
}

/* --- Initialize --- */
document.addEventListener('DOMContentLoaded', function () {
    /* Render file tree */
    var treeContainer = document.getElementById('fileTree');
    if (treeContainer) {
        fileStructure.children.forEach(function (child) { renderFileTree(child, treeContainer); });
    }

    /* Event delegation: layer clicks */
    var layerDiagram = document.getElementById('layerDiagram');
    if (layerDiagram) {
        layerDiagram.addEventListener('click', function (e) {
            var layer = e.target.closest('.layer');
            if (layer && layer.dataset.layer) showLayerInfo(layer.dataset.layer);
        });
        layerDiagram.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                var layer = e.target.closest('.layer');
                if (layer && layer.dataset.layer) {
                    e.preventDefault();
                    showLayerInfo(layer.dataset.layer);
                }
            }
        });
    }

    /* Event delegation: file tree clicks */
    if (treeContainer) {
        treeContainer.addEventListener('click', function (e) {
            var item = e.target.closest('.tree-item:not(.folder)');
            if (item && item.dataset.fileName) {
                treeContainer.querySelectorAll('.tree-item').forEach(function (t) { t.classList.remove('active'); });
                item.classList.add('active');
                showFileInfo(item);
            }
        });
        treeContainer.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                var item = e.target.closest('.tree-item:not(.folder)');
                if (item && item.dataset.fileName) {
                    e.preventDefault();
                    treeContainer.querySelectorAll('.tree-item').forEach(function (t) { t.classList.remove('active'); });
                    item.classList.add('active');
                    showFileInfo(item);
                }
            }
        });
    }

    /* Load live stats */
    updateStats();
});
