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