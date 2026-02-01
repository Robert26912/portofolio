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
     * Open module detail view (for now, just log to console)
     */
    openModule(module) {
        console.log('📂 Opening module:', module.title);
        
        // Check if private
        if (module.visibility === 'private') {
            alert('This module requires authentication. Login coming in Phase 2!');
            return;
        }
        
        // For now, just show an alert with module info
        // We'll create a proper modal in the next block
        alert(`${module.title}\n\n${module.content.summary || module.description}`);
    }
}

// Create instance when page loads
// This automatically starts the module loader
const moduleLoader = new ModuleLoader();