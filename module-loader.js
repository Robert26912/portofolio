/**
 * MODULE LOADER
 * Discovers modules and creates tiles automatically
 * 
 * How it works:
 * 1. Reads config/modules-bundle.json (FAST — one request)
 * 2. Falls back to individual files if bundle missing
 * 3. Filters by category / search / enabled
 * 4. Renders tiles in CSS Grid
 * 5. Opens modal with project details
 */

class ModuleLoader {
    constructor() {
        this.modules = [];
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.tileGrid = null;
        this.init();
    }

    async init() {
        console.log('🚀 Module Loader starting...');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            await this.setup();
        }
    }

    async setup() {
        this.tileGrid = document.getElementById('tileGrid');
        if (!this.tileGrid) {
            console.error('❌ Tile grid not found!');
            return;
        }

        await this.discoverModules();
        this.renderTiles();
        this.setupEventListeners();
        console.log('✅ Module Loader ready!');
    }

    // ===== DISCOVERY =====

    async discoverModules() {
        console.log('🔍 Discovering modules...');

        try {
            const response = await fetch('config/modules-bundle.json');
            if (response.ok) {
                const bundle = await response.json();
                for (const [moduleId, moduleData] of Object.entries(bundle.modules)) {
                    if (moduleData.enabled) {
                        this.modules.push(moduleData);
                        console.log(`  ✅ ${moduleData.title}`);
                    }
                }
                console.log(`✅ Loaded ${this.modules.length} modules (bundled)`);
                return;
            }
        } catch (error) {
            console.warn('⚠️ Bundle not found, falling back to individual files');
        }

        // Fallback: load individually
        try {
            const response = await fetch('config/modules.json');
            if (!response.ok) throw new Error('Module registry not found');
            const registry = await response.json();

            for (const moduleName of registry.modules) {
                try {
                    await this.loadModule(moduleName);
                } catch (error) {
                    console.warn(`⚠️ Failed: ${moduleName}`, error);
                }
            }
            console.log(`✅ Loaded ${this.modules.length} modules (individual)`);
        } catch (error) {
            console.error('❌ Failed to discover modules:', error);
        }
    }

    async loadModule(moduleName) {
        const basePath = `modules/${moduleName}`;

        const metaRes = await fetch(`${basePath}/module.json`);
        if (!metaRes.ok) throw new Error(`module.json not found for ${moduleName}`);
        const metadata = await metaRes.json();

        let content = {};
        try {
            const contentRes = await fetch(`${basePath}/content.json`);
            if (contentRes.ok) content = await contentRes.json();
        } catch (e) {
            console.log(`No content.json for ${moduleName}`);
        }

        this.modules.push({ ...metadata, content, path: moduleName });
        console.log(`  ✅ ${metadata.title}`);
    }

    // ===== RENDERING =====

    renderTiles() {
        this.tileGrid.innerHTML = '';
        const filtered = this.getFilteredModules();

        if (filtered.length === 0) {
            this.tileGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem;">
                    <p style="color: var(--text-dim);">No modules match your search.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(mod => {
            this.tileGrid.appendChild(this.createTile(mod));
        });

        console.log(`📊 Rendered ${filtered.length} tiles`);
    }

    getFilteredModules() {
        return this.modules.filter(mod => {
            if (!mod.enabled) return false;
            if (this.currentFilter !== 'all' && mod.category !== this.currentFilter) return false;
            if (this.currentSearch) {
                const q = this.currentSearch.toLowerCase();
                const inTitle = mod.title.toLowerCase().includes(q);
                const inDesc  = mod.description.toLowerCase().includes(q);
                if (!inTitle && !inDesc) return false;
            }
            return true;
        });
    }

    createTile(mod) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.moduleId = mod.id;
        tile.dataset.category = mod.category;

        const lock = mod.visibility === 'private' ? '<span class="lock-badge">🔒</span>' : '';

        tile.innerHTML = `
            ${lock}
            <div class="tile-icon">${mod.icon || '📦'}</div>
            <h3 class="tile-title">${mod.title}</h3>
            <p class="tile-description">${mod.description}</p>
            <div class="tile-footer">
                <span class="tile-category">${mod.category}</span>
            </div>
        `;

        tile.addEventListener('click', () => this.openModule(mod));
        return tile;
    }

    // ===== MODAL =====

    openModule(mod) {
        console.log('📂 Opening:', mod.title);

        if (mod.visibility === 'private') {
            alert('This module requires authentication. Coming in Phase 2!');
            return;
        }

        const modal         = document.getElementById('detailModal');
        const modalIcon     = document.getElementById('modalIcon');
        const modalTitle    = document.getElementById('modalTitle');
        const modalCategory = document.getElementById('modalCategory');
        const modalBody     = document.getElementById('modalBody');

        modalIcon.textContent     = mod.icon || '📦';
        modalTitle.textContent    = mod.title;
        modalCategory.textContent = mod.category;

        // Build body content
        let html = '';

        if (mod.interactive && mod.content.tools) {
            // ===== Interactive tools module =====
            html += `<p class="module-summary">${mod.content.summary || ''}</p>`;
            html += '<div class="tools-list">';
            mod.content.tools.forEach(tool => {
                html += `
                    <div class="tool-item">
                        <h4>${tool.name}</h4>
                        <p>${tool.description}</p>
                        <button class="btn btn-primary" onclick="DevTools.loadTool('${tool.type}')">Open</button>
                    </div>
                `;
            });
            html += '</div>';
            html += '<div id="toolWorkspace" class="tool-workspace"></div>';

        } else {
            // ===== Regular content module =====

            // Summary
            if (mod.content.summary) {
                html += `<p class="module-summary">${mod.content.summary}</p>`;
            }

            // Projects
            if (mod.content.projects && mod.content.projects.length > 0) {
                html += '<div class="projects-section"><h3>Projects</h3>';
                mod.content.projects.forEach(proj => {
                    const statusClass = proj.status ? proj.status.toLowerCase().replace(' ', '-') : '';
                    html += `<div class="project-card">`;
                    html += `<h4>${proj.name}</h4>`;
                    html += `<p>${proj.description}</p>`;

                    if (proj.technologies && proj.technologies.length > 0) {
                        html += '<div class="tech-tags">';
                        proj.technologies.forEach(t => { html += `<span class="tech-tag">${t}</span>`; });
                        html += '</div>';
                    }

                    if (proj.status) {
                        html += `<span class="project-status ${statusClass}">${proj.status}</span>`;
                    }

                    html += '</div>';
                });
                html += '</div>';
            }

            // Skills — FIX: this was outside the else block before, 
            // placed AFTER modal was shown, causing double render
            if (mod.content.skills && mod.content.skills.length > 0) {
                html += '<div class="skills-section"><h3>Key Skills</h3><ul class="skills-list">';
                mod.content.skills.forEach(skill => {
                    html += `<li>${skill}</li>`;
                });
                html += '</ul></div>';
            }

            // Interests (for architecture module)
            if (mod.content.interests && mod.content.interests.length > 0) {
                html += '<div class="skills-section"><h3>Interests</h3><ul class="skills-list">';
                mod.content.interests.forEach(interest => {
                    html += `<li>${interest}</li>`;
                });
                html += '</ul></div>';
            }

            // Learning notes
            if (mod.content.learning_notes) {
                html += `<p class="module-summary" style="margin-top: 1.5rem; font-style: italic; font-size: 0.8125rem;">📚 ${mod.content.learning_notes}</p>`;
            }
        }

        // Set content and show modal — ONCE only (was done twice before)
        modalBody.innerHTML = html;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // ===== EVENT LISTENERS =====

    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value;
                this.renderTiles();
            });
        }

        // Filters
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.category;
                this.renderTiles();
            });
        });

        // Modal close
        const modal        = document.getElementById('detailModal');
        const closeBtn     = document.getElementById('modalClose');
        const closeBtnFoot = document.getElementById('modalCloseBtn');
        const backdrop     = document.querySelector('.modal-backdrop');

        const closeModal = () => {
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        };

        if (closeBtn)     closeBtn.addEventListener('click', closeModal);
        if (closeBtnFoot) closeBtnFoot.addEventListener('click', closeModal);
        if (backdrop)     backdrop.addEventListener('click', closeModal);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    }
}

// Start
const moduleLoader = new ModuleLoader();
