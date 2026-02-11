# Portfolio — Robert Hidri

A modular portfolio website with a plugin architecture. Content is driven by JSON configuration files, keeping data separate from presentation.

## Live Site

[robert26912.github.io/portofolio](https://robert26912.github.io/portofolio/)

## Architecture

The site uses a **JSON-driven modular system**:

- **Landing page** (`index.html`) — Profile, projects, experience, references. All content loaded from `config/profile.json` by `profile-loader.js`.
- **Dashboard** (`dashboard.html`) — Browsable tile grid of all project modules. Loaded from `config/modules-bundle.json` by `module-loader.js`.
- **Modules** — Self-contained folders under `modules/`, each with `module.json` (metadata) and `content.json` (details).

```
portfolio/
├── index.html              # Landing page
├── dashboard.html           # Project dashboard
├── architecture.html        # Architecture visualizer
├── style.css               # Main stylesheet + design tokens
├── responsive.css           # All responsive breakpoints
├── dashboard.css            # Dashboard styles
├── architecture.css         # Architecture page styles
├── sanitize.js              # Shared utilities: sanitize, theme toggle, debounce
├── profile-loader.js        # Loads profile.json → renders landing page
├── module-loader.js         # Discovers modules → renders dashboard
├── architecture.js          # Architecture page logic
├── config/
│   ├── profile.json         # All personal/professional data
│   ├── modules.json         # Module registry (fallback)
│   └── modules-bundle.json  # Bundled module data (fast load)
├── modules/
│   ├── python/              # Python projects module
│   ├── cpp/                 # C/C++ projects module
│   ├── web-dev/             # Web development module
│   ├── devops/              # DevOps module
│   ├── architecture/        # Architecture module
│   └── dev-tools/           # Interactive dev tools
├── media/                   # Project images (drop files here)
│   ├── smartscale/          # SmartScale project images
│   ├── carbon-calc/         # Carbon Calculator images
│   ├── arduino-sense/       # ArduinoSense images
│   └── portfolio/           # This Website images
├── Robert_Hidri_CV.pdf      # Downloadable CV
├── og-image.png             # Social sharing preview image
├── robots.txt               # Search engine directives
└── .gitignore               # Git exclusion rules
```

## Technologies

- **HTML5** — Semantic markup with ARIA accessibility attributes
- **CSS3** — Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript** — ES6+ classes, async/await, event delegation
- **No frameworks** — Zero dependencies, zero build step
- **Dark/Light theme** — Toggle via button, persists via localStorage, dark default

## Security Features

- Content Security Policy (CSP) meta tags
- XSS protection via HTML entity sanitization
- URL validation (blocks `javascript:`, `data:` schemes)
- Email obfuscation (multi-layer, not plain base64)
- Honeypot email trap for bots
- `rel="noopener noreferrer"` on all external links

## Accessibility

- Skip-to-content link
- ARIA labels, roles, and states throughout
- Keyboard navigation for all interactive elements
- Focus trapping in modals
- `prefers-reduced-motion` support
- Minimum font sizes meeting WCAG guidelines

## Adding Project Images

1. Drop your image into the matching `media/` subfolder (e.g. `media/carbon-calc/1.jpg`)
2. Add the path to the project's `media.images` array in `config/profile.json`:
   ```json
   "media": {
     "images": ["media/carbon-calc/1.jpg"]
   }
   ```
3. The landing page preview will show the image when you click the project tile

Tips: use `.jpg` for photos, `.png` for screenshots. Keep files under 200KB. The preview area is 21:9 so wide images work best.

## Adding a New Module

1. Create a folder: `modules/your-module/`
2. Add `module.json` with metadata (id, title, icon, category, enabled)
3. Add `content.json` with detail content (summary, projects, skills)
4. Register in `config/modules.json` or add to `config/modules-bundle.json`
5. The dashboard will automatically discover and display it

## Local Development

```bash
# Clone and open (no build step needed)
git clone https://github.com/Robert26912/portofolio.git
cd portofolio

# Serve locally (any static server works)
python3 -m http.server 8000
# or
npx serve .
```

## License

© 2026 Robert Hidri. All rights reserved.
