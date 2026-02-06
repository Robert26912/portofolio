/**
 * ============================================================
 * MODULE LOADER — Dashboard Discovery Engine
 * ============================================================
 * 
 * Discovers modules from config/modules-bundle.json (fast, single request)
 * or falls back to individual module.json + content.json files.
 * 
 * Features:
 *   - Category filtering
 *   - Debounced search (200ms)
 *   - XSS-safe rendering via sanitize()
 *   - Accessible modal with focus trap
 *   - Error boundaries per module
 * 
 * @author Robert Hidri
 * @version 2.0.0
 */

/* ---------- Debug flag — set false for production ---------- */
const ML_DEBUG = false;
function mlLog(...args) { if (ML_DEBUG) console.log(...args); }

/* ---------- Security: HTML Sanitizer ---------- */
function mlSanitize(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/** Sanitize a URL — only allow http(s), relative paths, mailto */
function mlSanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) return trimmed;
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return trimmed;
    if (trimmed.startsWith('mailto:')) return trimmed;
    return '#';
}

/** Debounce utility — delays execution until pause in calls */
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}


/* ==========================================================
   MODULE LOADER CLASS
   ========================================================== */
class ModuleLoader {

    constructor() {
        /** @type {Array<Object>} All loaded module data */
        this.modules = [];

        /** @type {string} Current category filter ('all' or category name) */
        this.currentFilter = 'all';

        /** @type {string} Current search query */
        this.currentSearch = '';

        /** @type {HTMLElement|null} The tile grid container */
        this.tileGrid = null;

        this.init();
    }


    /* ---------- Lifecycle ---------- */

    async init() {
        mlLog('🚀 Module Loader starting...');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            await this.setup();
        }
    }

    async setup() {
        this.tileGrid = document.getElementById('tileGrid');
        if (!this.tileGrid) {
            console.error('❌ Tile grid container (#tileGrid) not found');
            return;
        }

        await this.discoverModules();
        this.renderTiles();
        this.setupEventListeners();
        mlLog('✅ Module Loader ready');
    }


    /* ==========================================================
       MODULE DISCOVERY
       Primary: bundled JSON (1 request). Fallback: individual files.
       ========================================================== */

    async discoverModules() {
        mlLog('🔍 Discovering modules...');

        /* Strategy 1: Load from bundle (fast, single HTTP request) */
        try {
            const response = await fetch('config/modules-bundle.json');
            if (response.ok) {
                const bundle = await response.json();

                for (const [moduleId, moduleData] of Object.entries(bundle.modules)) {
                    if (moduleData.enabled) {
                        this.modules.push(moduleData);
                        mlLog(`  ✅ ${moduleData.title}`);
                    }
                }

                mlLog(`✅ Loaded ${this.modules.length} modules (bundled)`);
                return;
            }
        } catch (error) {
            console.warn('⚠️ Bundle not found, falling back to individual files');
        }

        /* Strategy 2: Load each module individually */
        try {
            const response = await fetch('config/modules.json');
            if (!response.ok) throw new Error('Module registry not found');
            const registry = await response.json();

            const loadPromises = registry.modules.map(name =>
                this.loadModule(name).catch(err => {
                    console.warn(`⚠️ Skipped module "${name}":`, err.message);
                })
            );
            await Promise.allSettled(loadPromises);

            mlLog(`✅ Loaded ${this.modules.length} modules (individual)`);
        } catch (error) {
            console.error('❌ Failed to discover modules:', error.message);
            this.showError('Unable to load project modules. Please refresh the page.');
        }
    }

    /** Load a single module's metadata + content */
    async loadModule(moduleName) {
        const basePath = `modules/${moduleName}`;

        /* Load metadata (required) */
        const metaRes = await fetch(`${basePath}/module.json`);
        if (!metaRes.ok) throw new Error(`module.json not found for "${moduleName}"`);
        const metadata = await metaRes.json();

        /* Load content (optional) */
        let content = {};
        try {
            const contentRes = await fetch(`${basePath}/content.json`);
            if (contentRes.ok) content = await contentRes.json();
        } catch {
            mlLog(`  ℹ️ No content.json for "${moduleName}"`);
        }

        this.modules.push({ ...metadata, content, path: moduleName });
        mlLog(`  ✅ ${metadata.title}`);
    }


    /* ==========================================================
       TILE RENDERING
       ========================================================== */

    renderTiles() {
        this.tileGrid.innerHTML = '';
        const filtered = this.getFilteredModules();

        if (filtered.length === 0) {
            this.tileGrid.innerHTML = `
                <div class="empty-state">
                    <p>No modules match your search.</p>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();
        filtered.forEach(mod => fragment.appendChild(this.createTile(mod)));
        this.tileGrid.appendChild(fragment);

        mlLog(`📊 Rendered ${filtered.length} tiles`);
    }

    /** Filter modules by category and search query */
    getFilteredModules() {
        return this.modules.filter(mod => {
            if (!mod.enabled) return false;
            if (this.currentFilter !== 'all' && mod.category !== this.currentFilter) return false;

            if (this.currentSearch) {
                const q = this.currentSearch.toLowerCase();
                const searchable = `${mod.title} ${mod.description}`.toLowerCase();
                if (!searchable.includes(q)) return false;
            }

            return true;
        });
    }

    /** Create a single tile DOM element */
    createTile(mod) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.moduleId = mod.id;
        tile.dataset.category = mod.category;
        tile.setAttribute('role', 'button');
        tile.setAttribute('tabindex', '0');
        tile.setAttribute('aria-label', `Open ${mod.title} module`);

        const lock = mod.visibility === 'private'
            ? '<span class="lock-badge" aria-label="Private module">🔒</span>'
            : '';

        tile.innerHTML = `
            ${lock}
            <div class="tile-icon" aria-hidden="true">${mlSanitize(mod.icon || '📦')}</div>
            <h3 class="tile-title">${mlSanitize(mod.title)}</h3>
            <p class="tile-description">${mlSanitize(mod.description)}</p>
            <div class="tile-footer">
                <span class="tile-category">${mlSanitize(mod.category)}</span>
            </div>
        `;

        /* Click and keyboard handlers */
        tile.addEventListener('click', () => this.openModule(mod));
        tile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.openModule(mod);
            }
        });

        return tile;
    }


    /* ==========================================================
       MODAL
       ========================================================== */

    openModule(mod) {
        mlLog('📂 Opening:', mod.title);

        if (mod.visibility === 'private') {
            this.showToast('This module requires authentication. Coming in Phase 2!');
            return;
        }

        const modal = document.getElementById('detailModal');
        const modalIcon = document.getElementById('modalIcon');
        const modalTitle = document.getElementById('modalTitle');
        const modalCategory = document.getElementById('modalCategory');
        const modalBody = document.getElementById('modalBody');

        if (!modal || !modalBody) return;

        modalIcon.textContent = mod.icon || '📦';
        modalTitle.textContent = mod.title;
        modalCategory.textContent = mod.category;

        /* Build body content with XSS-safe rendering */
        modalBody.innerHTML = this.buildModalContent(mod);

        /* Show modal */
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        /* Focus the close button for accessibility */
        document.getElementById('modalClose')?.focus();
    }

    /** Build the inner HTML for the modal body */
    buildModalContent(mod) {
        let html = '';

        /* Interactive tools module */
        if (mod.interactive && mod.content?.tools) {
            html += `<p class="module-summary">${mlSanitize(mod.content.summary || '')}</p>`;
            html += '<div class="tools-list">';
            mod.content.tools.forEach(tool => {
                html += `
                    <div class="tool-item">
                        <h4>${mlSanitize(tool.name)}</h4>
                        <p>${mlSanitize(tool.description)}</p>
                        <button class="btn btn-primary" data-tool-type="${mlSanitize(tool.type)}">Open</button>
                    </div>
                `;
            });
            html += '</div>';
            html += '<div id="toolWorkspace" class="tool-workspace"></div>';
            return html;
        }

        /* Regular content module */
        if (mod.content?.summary) {
            html += `<p class="module-summary">${mlSanitize(mod.content.summary)}</p>`;
        }

        /* Projects section */
        if (mod.content?.projects?.length > 0) {
            html += '<div class="projects-section"><h3>Projects</h3>';
            mod.content.projects.forEach(proj => {
                const statusClass = (proj.status || '').toLowerCase().replace(' ', '-');
                html += `<div class="project-card">`;
                html += `<h4>${mlSanitize(proj.name)}</h4>`;
                html += `<p>${mlSanitize(proj.description)}</p>`;

                if (proj.technologies?.length > 0) {
                    html += '<div class="tech-tags">';
                    proj.technologies.forEach(t => {
                        html += `<span class="tech-tag">${mlSanitize(t)}</span>`;
                    });
                    html += '</div>';
                }

                /* Project links */
                const hasLinks = proj.github || (proj.links && Object.keys(proj.links).length > 0);
                if (hasLinks) {
                    html += '<div class="project-links">';
                    if (proj.github) {
                        html += `<a href="${mlSanitizeUrl(proj.github)}" target="_blank" rel="noopener" class="project-link">View on GitHub →</a>`;
                    }
                    if (proj.links?.thesis) {
                        html += `<a href="${mlSanitizeUrl(proj.links.thesis)}" target="_blank" rel="noopener" class="project-link">Read Thesis →</a>`;
                    }
                    if (proj.links?.demo) {
                        html += `<a href="${mlSanitizeUrl(proj.links.demo)}" target="_blank" rel="noopener" class="project-link">View Demo →</a>`;
                    }
                    html += '</div>';
                }

                if (proj.status) {
                    html += `<span class="project-status ${mlSanitize(statusClass)}">${mlSanitize(proj.status)}</span>`;
                }
                html += '</div>';
            });
            html += '</div>';
        }

        /* Areas (hobbies) */
        if (mod.content?.areas?.length > 0) {
            html += '<div class="areas-grid">';
            mod.content.areas.forEach(area => {
                html += `
                    <div class="area-card">
                        <span class="area-icon">${mlSanitize(area.icon || '')}</span>
                        <h4>${mlSanitize(area.name)}</h4>
                        <p>${mlSanitize(area.description)}</p>
                    </div>
                `;
            });
            html += '</div>';
        }

        /* Downloads */
        if (mod.content?.downloads?.length > 0) {
            html += '<div class="downloads-section"><h3>Available Downloads</h3>';
            mod.content.downloads.forEach(dl => {
                const isPlaceholder = (dl.url || '').includes('PLACEHOLDER');
                html += `
                    <div class="download-card ${isPlaceholder ? 'placeholder' : ''}">
                        <div class="download-info">
                            <h4>${mlSanitize(dl.name)}</h4>
                            <p>${mlSanitize(dl.description)}</p>
                        </div>
                        ${isPlaceholder
                            ? '<span class="download-status">Coming soon</span>'
                            : `<a href="${mlSanitizeUrl(dl.url)}" target="_blank" rel="noopener" class="btn btn-primary">Download PDF</a>`
                        }
                    </div>
                `;
            });
            html += '</div>';
        }

        /* Roadmap */
        if (mod.content?.roadmap?.length > 0) {
            html += '<div class="roadmap-section"><h3>Learning Roadmap</h3>';
            mod.content.roadmap.forEach(item => {
                const priorityClass = (item.priority || '').toLowerCase();
                html += `
                    <div class="roadmap-card">
                        <div class="roadmap-info">
                            <h4>${mlSanitize(item.name)}</h4>
                            <p>${mlSanitize(item.description)}</p>
                        </div>
                        <div class="roadmap-actions">
                            <span class="roadmap-priority ${mlSanitize(priorityClass)}">${mlSanitize(item.priority || '')}</span>
                            ${item.url ? `<a href="${mlSanitizeUrl(item.url)}" target="_blank" rel="noopener" class="btn btn-secondary">Learn more →</a>` : ''}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        /* Skills list */
        if (mod.content?.skills?.length > 0) {
            html += '<div class="skills-section"><h3>Key Skills</h3><ul class="skills-list">';
            mod.content.skills.forEach(skill => {
                html += `<li>${mlSanitize(skill)}</li>`;
            });
            html += '</ul></div>';
        }

        /* Learning notes */
        if (mod.content?.learning_notes) {
            html += `<p class="module-note">📚 ${mlSanitize(mod.content.learning_notes)}</p>`;
        }

        return html;
    }


    /* ==========================================================
       EVENT LISTENERS
       ========================================================== */

    setupEventListeners() {
        /* Search — debounced to avoid excessive re-renders */
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const debouncedSearch = debounce((value) => {
                this.currentSearch = value;
                this.renderTiles();
            }, 200);

            searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
        }

        /* Category filters */
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
                this.currentFilter = btn.dataset.category;
                this.renderTiles();
            });
        });

        /* Modal close handlers */
        const modal = document.getElementById('detailModal');
        const closeBtn = document.getElementById('modalClose');
        const closeBtnFoot = document.getElementById('modalCloseBtn');
        const backdrop = document.querySelector('.modal-backdrop');

        const closeModal = () => {
            if (!modal) return;
            modal.classList.remove('active');
            document.body.style.overflow = '';
        };

        closeBtn?.addEventListener('click', closeModal);
        closeBtnFoot?.addEventListener('click', closeModal);
        backdrop?.addEventListener('click', closeModal);

        /* Keyboard: Escape to close, Tab trap */
        document.addEventListener('keydown', (e) => {
            if (!modal?.classList.contains('active')) return;

            if (e.key === 'Escape') {
                closeModal();
                return;
            }

            /* Focus trap */
            if (e.key === 'Tab') {
                const focusable = modal.querySelectorAll(
                    'button, [href], input, [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });

        /* Tool buttons (event delegation for dynamically created buttons) */
        document.getElementById('modalBody')?.addEventListener('click', (e) => {
            const toolBtn = e.target.closest('[data-tool-type]');
            if (toolBtn && typeof DevTools !== 'undefined') {
                DevTools.loadTool(toolBtn.dataset.toolType);
            }
        });
    }


    /* ==========================================================
       UTILITIES
       ========================================================== */

    /** Show an error message in the tile grid */
    showError(message) {
        if (this.tileGrid) {
            this.tileGrid.innerHTML = `
                <div class="empty-state error-state">
                    <p>⚠️ ${mlSanitize(message)}</p>
                </div>
            `;
        }
    }

    /** Show a non-blocking toast message (replaces alert()) */
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.setAttribute('role', 'alert');
        document.body.appendChild(toast);

        /* Animate in */
        requestAnimationFrame(() => toast.classList.add('visible'));

        /* Auto-dismiss after 3 seconds */
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}


/* ==========================================================
   INITIALIZE
   ========================================================== */
const moduleLoader = new ModuleLoader();
