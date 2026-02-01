/**
 * MODULE LOADER
 * Discovers modules and creates tiles automatically
 * 
 * How it works:
 * 1. Reads config/modules.json to find available modules
 * 2. Loads module.json from each module folder
 * 3. Creates tiles on the dashboard
 * 4. Handles clicks to show details
 */

class ModuleLoader {
    constructor() {
        // Array to store all loaded modules
        this.modules = [];
        
        // Current filter (all, projects, tools, iot)
        this.currentFilter = 'all';
        
        // Current search text
        this.currentSearch = '';
        
        // DOM elements (will be set in init)
        this.tileGrid = null;
        
        // Start initialization
        this.init();
    }
    /**
     * Initialize the module loader
     */
    async init() {
        console.log('🚀 Module Loader starting...');
        
        // Wait for page to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            await this.setup();
        }
    }
    /**
     * Setup after page loads
     */
    async setup() {
        // Get the tile grid element from HTML
        this.tileGrid = document.getElementById('tileGrid');
        
        if (!this.tileGrid) {
            console.error('❌ Tile grid not found! Need element with id="tileGrid"');
            return;
        }
        
        // Discover and load all modules
        await this.discoverModules();
        
        // Display tiles
        this.renderTiles();
        // Set up event listeners for search and filters
        this.setupEventListeners();
        
        console.log('✅ Module Loader ready!');
    }


    /**
     * Discover and load all modules from config
     */
    async discoverModules() {
        console.log('🔍 Discovering modules...');
        
        try {
            // Load the module registry
            const response = await fetch('config/modules.json');
            
            if (!response.ok) {
                throw new Error('Module registry not found');
            }
            
            const registry = await response.json();
            
            // Load each module listed in registry
            for (const moduleName of registry.modules) {
                try {
                    await this.loadModule(moduleName);
                } catch (error) {
                    console.warn(`⚠️ Failed to load module: ${moduleName}`, error);
                }
            }
            
            console.log(`✅ Loaded ${this.modules.length} modules`);
            
        } catch (error) {
            console.error('❌ Failed to discover modules:', error);
        }
    }
    /**
     * Load a single module's data
     */
    async loadModule(moduleName) {
        const basePath = `modules/${moduleName}`;
        
        // Load module.json (metadata)
        const metadataResponse = await fetch(`${basePath}/module.json`);
        if (!metadataResponse.ok) {
            throw new Error(`module.json not found for ${moduleName}`);
        }
        const metadata = await metadataResponse.json();
        
        // Load content.json (data)
        let content = {};
        try {
            const contentResponse = await fetch(`${basePath}/content.json`);
            if (contentResponse.ok) {
                content = await contentResponse.json();
            }
        } catch (error) {
            console.log(`No content.json for ${moduleName}`);
        }
        
        // Store the complete module
        this.modules.push({
            ...metadata,
            content,
            path: moduleName
        });
        
        console.log(`✅ Loaded: ${metadata.title}`);
    }
    /**
     * Render all tiles on the page
     */
    renderTiles() {
        // Clear existing tiles
        this.tileGrid.innerHTML = '';
        
        // Filter modules based on current filter and search
        const filteredModules = this.getFilteredModules();
        
        // Show message if no modules
        if (filteredModules.length === 0) {
            this.tileGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <p>No modules found. Add modules to the modules/ folder!</p>
                </div>
            `;
            return;
        }
        
        // Create a tile for each module
        filteredModules.forEach(module => {
            const tile = this.createTile(module);
            this.tileGrid.appendChild(tile);
        });
        
        console.log(`📊 Rendered ${filteredModules.length} tiles`);
    }

    /**
     * Filter modules based on category and search
     */
    getFilteredModules() {
        return this.modules.filter(module => {
            // Check if enabled
            if (!module.enabled) return false;
            
            // Check category filter
            if (this.currentFilter !== 'all' && module.category !== this.currentFilter) {
                return false;
            }
            
            // Check search query
            if (this.currentSearch) {
                const searchLower = this.currentSearch.toLowerCase();
                const matchesTitle = module.title.toLowerCase().includes(searchLower);
                const matchesDescription = module.description.toLowerCase().includes(searchLower);
                
                if (!matchesTitle && !matchesDescription) {
                    return false;
                }
            }
            
            return true;
        });
    }



    /**
     * Create HTML element for a single tile
     */
    createTile(module) {
        // Create the tile container
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.moduleId = module.id;
        tile.dataset.category = module.category;
        
        // Add lock icon for private modules
        const lockBadge = module.visibility === 'private' 
            ? '<span class="lock-badge">🔒</span>' 
            : '';
        
        // Build tile HTML
        tile.innerHTML = `
            ${lockBadge}
            <div class="tile-icon">${module.icon || '📦'}</div>
            <h3 class="tile-title">${module.title}</h3>
            <p class="tile-description">${module.description}</p>
            <div class="tile-footer">
                <span class="tile-category">${module.category}</span>
            </div>
        `;
        
        // Add click handler
        tile.addEventListener('click', () => this.openModule(module));
        
        return tile;
    }


   /**
     * Open module detail view in modal
     */
    openModule(module) {
        console.log('📂 Opening module:', module.title);
        
        // Check if private
        if (module.visibility === 'private') {
            alert('This module requires authentication. Login coming in Phase 2!');
            return;
        }
        
        // Get modal elements
        const modal = document.getElementById('detailModal');
        const modalIcon = document.getElementById('modalIcon');
        const modalTitle = document.getElementById('modalTitle');
        const modalCategory = document.getElementById('modalCategory');
        const modalBody = document.getElementById('modalBody');
        
        // Set modal content
        modalIcon.textContent = module.icon || '📦';
        modalTitle.textContent = module.title;
        modalCategory.textContent = module.category;
        
        // Build body content
        let bodyHTML = '';
        
        // Check if this is an interactive tool module
        if (module.interactive && module.content.tools) {
            // Interactive tools module
            bodyHTML += `<p class="module-summary">${module.content.summary}</p>`;
            bodyHTML += '<div class="tools-list">';
            
            module.content.tools.forEach(tool => {
                bodyHTML += `
                    <div class="tool-item">
                        <h4>${tool.name}</h4>
                        <p>${tool.description}</p>
                        <button class="btn btn-primary" onclick="DevTools.loadTool('${tool.type}')">
            Open Tool
        </button>
                    </div>
                `;
            });
            
            bodyHTML += '</div>';
            bodyHTML += '<div id="toolWorkspace" class="tool-workspace"></div>';
            
        } else {
            // Regular content module (existing code)
            
            // Summary
            if (module.content.summary) {
                bodyHTML += `<p class="module-summary">${module.content.summary}</p>`;
            }
            
            // Projects section
            if (module.content.projects && module.content.projects.length > 0) {
                bodyHTML += '<div class="projects-section"><h3>Projects</h3>';
                
                module.content.projects.forEach(project => {
                    const statusClass = project.status ? project.status.toLowerCase().replace(' ', '-') : '';
                    
                    bodyHTML += `
                        <div class="project-card">
                            <h4>${project.name}</h4>
                            <p>${project.description}</p>
                    `;
                    
                    // Technologies
                    if (project.technologies && project.technologies.length > 0) {
                        bodyHTML += '<div class="tech-tags">';
                        project.technologies.forEach(tech => {
                            bodyHTML += `<span class="tech-tag">${tech}</span>`;
                        });
                        bodyHTML += '</div>';
                    }
                    
                    // Status
                    if (project.status) {
                        bodyHTML += `<span class="project-status ${statusClass}">${project.status}</span>`;
                    }
                    
                    bodyHTML += '</div>';
                });
                
                bodyHTML += '</div>';
            }
            
            // Skills section
            if (module.content.skills && module.content.skills.length > 0) {
                bodyHTML += '<div class="skills-section"><h3>Key Skills</h3><ul class="skills-list">';
                module.content.skills.forEach(skill => {
                    bodyHTML += `<li>${skill}</li>`;
                });
                bodyHTML += '</ul></div>';
            }
        }
        
        modalBody.innerHTML = bodyHTML;
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Skills section
        if (module.content.skills && module.content.skills.length > 0) {
            bodyHTML += '<div class="skills-section"><h3>Key Skills</h3><ul class="skills-list">';
            module.content.skills.forEach(skill => {
                bodyHTML += `<li>${skill}</li>`;
            });
            bodyHTML += '</ul></div>';
        }
        
        modalBody.innerHTML = bodyHTML;
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }
    /**
     * Set up event listeners for search and filters
     */
    setupEventListeners() {
        // Search input listener
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value;
                this.renderTiles();
                console.log('🔍 Search:', this.currentSearch);
            });
            // Modal close handlers
        const modal = document.getElementById('detailModal');
        const modalClose = document.getElementById('modalClose');
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        const modalBackdrop = document.querySelector('.modal-backdrop');
        
        // Function to close modal
        const closeModal = () => {
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = ''; // Restore scrolling
            }
        };
        
        // Close on X button
        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }
        
        // Close on Close button
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeModal);
        }
        
        // Close on backdrop click
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', closeModal);
        }
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
        }
        
        // Filter button listeners
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                filterButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Update filter and re-render
                this.currentFilter = e.target.dataset.category;
                this.renderTiles();
                console.log('🎯 Filter:', this.currentFilter);
            });
        });
    }

}

// Create instance when page loads
// This automatically starts the module loader
const moduleLoader = new ModuleLoader();