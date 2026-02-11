/**
 * ============================================================
 * PROFILE LOADER — Robert Hidri Portfolio
 * ============================================================
 * 
 * Reads config/profile.json and populates the landing page.
 * All DOM rendering is XSS-safe (HTML entities escaped).
 * 
 * Sections:
 *   - Hero (name, title, tagline, stats)
 *   - Bio (expandable teaser → full text + highlights)
 *   - Contact (mini tiles, email obfuscation)
 *   - Featured Projects (showcase with hover preview)
 *   - Skills Sidebar (accordion tabs)
 *   - Experience & Education (expandable tiles)
 *   - References (quote cards)
 * 
 * Security:
 *   - All user-facing strings passed through sanitize()
 *   - Email obfuscated with char-code splitting (not just base64)
 *   - CSP-compatible (no inline event handlers in templates)
 *   - Modal has focus trap for accessibility
 * 
 * @author Robert Hidri
 * @version 2.0.0
 */

/* ---------- Debug flag — set false for production ---------- */
const DEBUG = false;
function log(...args) { if (DEBUG) console.log(...args); }

/* Security utilities (sanitize, sanitizeUrl, obfuscateEmail, deobfuscateEmail)
   are loaded from sanitize.js — shared across all modules. */


/* ==========================================================
   PROFILE LOADER CLASS
   ========================================================== */
class ProfileLoader {

    constructor() {
        /** @type {Object|null} Parsed profile.json data */
        this.profile = null;

        /** @type {Array} Cached featured projects for showcase */
        this.featuredProjects = [];


        this.init();
    }

    /* ---------- Lifecycle ---------- */

    async init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            await this.setup();
        }
    }

    async setup() {
        try {
            const response = await fetch('config/profile.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.profile = await response.json();
            this.render();
            this.bindGlobalEvents();
            /* Orbs removed — clean background */
            log('✅ Profile loaded');
        } catch (error) {
            console.error('❌ Failed to load profile:', error.message);
            this.showFallback();
        }
    }

    /** Render all sections — each in its own try/catch so one failure doesn't break all */
    render() {
        const sections = [
            () => this.renderHero(),
            () => this.renderContactMini(),
            () => this.renderSkillsSidebar(),
            () => this.renderFeaturedProjects(),
            () => this.renderExperience(),
            () => this.renderEducation(),
            () => this.renderReferences(),
        ];

        sections.forEach((renderFn, i) => {
            try {
                renderFn();
            } catch (err) {
                console.error(`❌ Render section ${i} failed:`, err.message);
            }
        });
    }

    /** Show fallback content if profile.json fails to load */
    showFallback() {
        const name = document.getElementById('heroName');
        if (name) name.textContent = 'Robert Hidri';
        const title = document.getElementById('heroTitle');
        if (title) title.textContent = 'IoT Engineer';
    }


    /* ==========================================================
       HERO (Profile Card + Expandable Bio)
       ========================================================== */

    renderHero() {
        const p = this.profile;

        this.setText('heroName', p.name);
        this.setText('heroTitle', p.title);

        /* Bio teaser — first sentence */
        const bioTeaser = document.getElementById('bioTeaser');
        if (bioTeaser && p.tagline) {
            bioTeaser.textContent = p.tagline.split('.')[0] + '.';
        }

        /* Full bio text */
        const bioFullText = document.getElementById('bioFullText');
        if (bioFullText && p.tagline) {
            bioFullText.textContent = p.tagline;
        }

        /* Bio highlights (from about section) */
        const bioHighlights = document.getElementById('bioHighlights');
        if (bioHighlights && p.about?.highlights) {
            bioHighlights.innerHTML = p.about.highlights.slice(0, 4).map(h =>
                `<span class="bio-highlight">${sanitize(h.icon)} ${sanitize(h.title)}</span>`
            ).join('');
        }
    }


    /* ==========================================================
       CONTACT MINI TILES (Below profile in sidebar)
       ========================================================== */

    renderContactMini() {
        const contact = this.profile.contact;
        if (!contact) return;

        const container = document.getElementById('contactMini');
        if (!container) return;

        container.innerHTML = contact.map(c => {
            /* Protected email — click to reveal with obfuscation */
            if (c.protected && c.label === 'Email') {
                const encoded = obfuscateEmail(c.value);
                return `
                    <div class="contact-mini-tile"
                         id="emailTile"
                         data-enc="${sanitize(encoded)}"
                         role="button"
                         tabindex="0"
                         aria-label="Click to reveal email address">
                        <span class="contact-mini-icon">${sanitize(c.icon)}</span>
                        <span class="contact-mini-label">Click to reveal email</span>
                    </div>
                `;
            }

            /* Skip items with no URL (like location) */
            if (!c.url) return '';

            const preferredClass = c.preferred ? 'preferred' : '';
            const badge = c.preferred
                ? '<span class="contact-mini-badge">★ Preferred</span>'
                : '';

            return `
                <a href="${sanitizeUrl(c.url)}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="contact-mini-tile ${preferredClass}">
                    <span class="contact-mini-icon">${sanitize(c.icon)}</span>
                    <span class="contact-mini-label">${sanitize(c.label)}</span>
                    ${badge}
                </a>
            `;
        }).filter(Boolean).join('');

        /* Bind email reveal via event delegation (no inline onclick) */
        const emailTile = document.getElementById('emailTile');
        if (emailTile) {
            const revealHandler = () => this.revealEmail(emailTile);
            emailTile.addEventListener('click', revealHandler);
            emailTile.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    revealHandler();
                }
            });
        }
    }

    /** Reveal obfuscated email address */
    revealEmail(el) {
        const encoded = el.dataset.enc;
        if (!encoded) return;

        const email = deobfuscateEmail(encoded);
        if (!email) {
            console.error('Failed to decode email');
            return;
        }

        el.innerHTML = `
            <span class="contact-mini-icon">✉️</span>
            <span class="contact-mini-label">
                <span class="contact-mini-email">${sanitize(email)}</span>
            </span>
        `;
        el.classList.add('revealed');

        /* Second click opens mailto */
        el.onclick = () => { window.location.href = 'mailto:' + email; };
        el.setAttribute('aria-label', `Send email to ${email}`);
    }


    /* ==========================================================
       FEATURED PROJECTS (Showcase with hover preview)
       ========================================================== */

    renderFeaturedProjects() {
        const projects = this.profile.featuredProjects;
        if (!projects) return;

        const tilesContainer = document.getElementById('projectTiles');
        if (!tilesContainer) return;

        /* Filter to featured, max 4 */
        const featured = projects.filter(p => p.featured !== false).slice(0, 4);
        this.featuredProjects = featured;

        tilesContainer.innerHTML = featured.map((project, index) => {
            const statusClass = project.status === 'Completed' ? 'status-done'
                : project.status === 'Active' ? 'status-active' : 'status-wip';
            return `
                <div class="project-tile ${index === 0 ? 'active' : ''}"
                     data-project-index="${index}"
                     role="tab"
                     tabindex="0"
                     aria-selected="${index === 0}"
                     aria-label="${sanitize(project.shortName || project.name)}">
                    <span class="tile-icon">${sanitize(project.icon)}</span>
                    <span class="tile-name">${sanitize(project.shortName || project.name)}</span>
                    <span class="tile-status ${statusClass}">${sanitize(project.status)}</span>
                </div>
            `;
        }).join('');

        /* Bind events via delegation (no inline handlers) */
        tilesContainer.addEventListener('mouseenter', (e) => {
            const tile = e.target.closest('.project-tile');
            if (tile) this.showProject(Number(tile.dataset.projectIndex));
        }, true);

        tilesContainer.addEventListener('click', (e) => {
            const tile = e.target.closest('.project-tile');
            if (tile) this.showProject(Number(tile.dataset.projectIndex));
        });

        tilesContainer.addEventListener('keydown', (e) => {
            const tile = e.target.closest('.project-tile');
            if (tile && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                this.showProject(Number(tile.dataset.projectIndex));
            }
        });

        /* Show first project by default */
        if (featured.length > 0) this.showProject(0);
    }

    /** Update the showcase preview for a given project index */
    showProject(index) {
        const project = this.featuredProjects[index];
        if (!project) return;


        /* Update active tile */
        document.querySelectorAll('.project-tile').forEach((tile, i) => {
            tile.classList.toggle('active', i === index);
            tile.setAttribute('aria-selected', i === index);
        });

        /* Update preview media */
        const mediaEl = document.getElementById('previewMedia');
        if (mediaEl) {
            if (project.media?.images?.length > 0) {
                mediaEl.innerHTML = `<img src="${sanitizeUrl(project.media.images[0])}"
                                          alt="${sanitize(project.name)}"
                                          class="preview-image" loading="lazy">`;
            const images = project.media?.images?.filter(Boolean) || [];

            if (images.length > 0) {
                this.renderProjectMedia(mediaEl, project, images[0]);
            } else {
                const placeholder = project.media?.placeholder || project.icon || '📁';
                mediaEl.innerHTML = `
                    <div class="preview-placeholder">
                        <span class="preview-icon">${sanitize(placeholder)}</span>
                        <span class="preview-text">${project.status === 'In Progress' ? 'Coming Soon' : 'Preview'}</span>
                    </div>
                `;
            }
        }

        /* Update details panel */
        const detailsEl = document.getElementById('previewDetails');
        if (detailsEl) {
            const tagsHtml = (project.tags || [])
                .map(tag => `<span class="preview-tag">${sanitize(tag)}</span>`)
                .join('');

            let linksHtml = '';
            if (project.links) {
                if (project.links.thesis) {
                    linksHtml += `<a href="${sanitizeUrl(project.links.thesis)}" target="_blank" rel="noopener" class="preview-link">📄 Read Thesis</a>`;
                }
                if (project.links.github) {
                    linksHtml += `<a href="${sanitizeUrl(project.links.github)}" target="_blank" rel="noopener" class="preview-link">💻 View Code</a>`;
                }
                if (project.links.demo) {
                    linksHtml += `<a href="${sanitizeUrl(project.links.demo)}" target="_blank" rel="noopener" class="preview-link">🎬 Watch Demo</a>`;
                }
                if (project.links.live) {
                    linksHtml += `<a href="${sanitizeUrl(project.links.live)}" target="_blank" rel="noopener" class="preview-link">🌐 Live Demo</a>`;
                }
            }

            const isWip = project.description?.includes('[PLACEHOLDER]');
            const description = (project.description || '').replace('[PLACEHOLDER] ', '');

            detailsEl.innerHTML = `
                <h3 class="preview-title">
                    ${sanitize(project.name)} 
                    ${isWip ? '<span class="wip-badge-sm">WIP</span>' : ''}
                </h3>
                <p class="preview-description">${sanitize(description)}</p>
                <div class="preview-tags">${tagsHtml}</div>
                <div class="preview-links">${linksHtml || '<span class="no-links">Links coming soon</span>'}</div>
            `;
        }
    }

    renderProjectMedia(mediaEl, project, imagePath) {
        const currentImage = sanitizeUrl(imagePath);
        const canRenderImage = currentImage !== '#';

        mediaEl.innerHTML = canRenderImage
            ? `
                <div class="preview-media-gallery">
                    <img src="${currentImage}" alt="${sanitize(project.name)} preview" class="preview-image" loading="lazy">
                </div>
            `
            : `
                <div class="preview-placeholder">
                    <span class="preview-icon">${sanitize(project.icon || '📁')}</span>
                    <span class="preview-text">Preview unavailable</span>
                </div>
            `;

        const previewImage = mediaEl.querySelector('.preview-image');
        if (previewImage) {
            previewImage.addEventListener('error', () => {
                mediaEl.innerHTML = `
                    <div class="preview-placeholder">
                        <span class="preview-icon">${sanitize(project.icon || '📁')}</span>
                        <span class="preview-text">Preview unavailable</span>
                    </div>
                `;
            }, { once: true });
        }
    }



    /* ==========================================================
       SKILLS SIDEBAR (Accordion tabs, click to expand)
       ========================================================== */

    renderSkillsSidebar() {
        const skills = this.profile.skills;
        if (!skills) return;

        const container = document.getElementById('skillsSidebar');
        if (!container) return;

        const icons = {
            'Programming Languages': '💻',
            'IoT & Embedded': '🔌',
            'Data & Analytics': '📊',
            'Networking & Infrastructure': '🌐',
            'Tools & Methods': '🛠️',
            'Languages (Human)': '🗣️',
            'Design skills': '🎨',
        };

        container.innerHTML = skills.map((group, index) => `
            <div class="skill-tab" 
                 data-category="${index}"
                 role="button"
                 tabindex="0"
                 aria-expanded="false">
                <div class="skill-tab-header">
                    <span class="skill-tab-icon">${icons[group.category] || '📁'}</span>
                    <span class="skill-tab-name">${sanitize(group.category.replace('Languages (Human)', 'Languages'))}</span>
                </div>
                <div class="skill-tab-expand" aria-hidden="true">
                    <div class="skill-tab-items">
                        ${group.items.map(item => `<span class="skill-item">${sanitize(item)}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        /* Bind click/keyboard via delegation */
        container.addEventListener('click', (e) => {
            const tab = e.target.closest('.skill-tab');
            if (tab) this.toggleSkillTab(tab);
        });
        container.addEventListener('keydown', (e) => {
            const tab = e.target.closest('.skill-tab');
            if (tab && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                this.toggleSkillTab(tab);
            }
        });
    }

    toggleSkillTab(activeTab) {
        document.querySelectorAll('.skill-tab').forEach(tab => {
            if (tab === activeTab) {
                const isExpanded = tab.classList.toggle('expanded');
                tab.setAttribute('aria-expanded', isExpanded);
                tab.querySelector('.skill-tab-expand')?.setAttribute('aria-hidden', !isExpanded);
            } else {
                tab.classList.remove('expanded');
                tab.setAttribute('aria-expanded', 'false');
                tab.querySelector('.skill-tab-expand')?.setAttribute('aria-hidden', 'true');
            }
        });
    }


    /* ==========================================================
       EXPERIENCE (Expandable tiles)
       ========================================================== */

    renderExperience() {
        const experience = this.profile.experience;
        if (!experience) return;

        const container = document.getElementById('experienceTiles');
        if (!container) return;

        container.innerHTML = experience.map((exp, index) => {
            const dateRange = exp.endDate
                ? `${sanitize(exp.startDate)} – ${sanitize(exp.endDate)}`
                : `${sanitize(exp.startDate)} – Present`;
            const icon = exp.icon || '💼';

            return `
                <div class="journey-tile" 
                     data-expand-id="exp-${index}"
                     role="button"
                     tabindex="0"
                     aria-expanded="false">
                    <div class="tile-header">
                        <span class="tile-icon">${sanitize(icon)}</span>
                        <div class="tile-info">
                            <h4>${sanitize(exp.company || exp.role)}</h4>
                            <span class="tile-date">${dateRange}</span>
                        </div>
                        <span class="tile-arrow" aria-hidden="true">▸</span>
                    </div>
                    <div class="tile-expand" id="exp-${index}" aria-hidden="true">
                        <p class="tile-role">${sanitize(exp.role)}${exp.location ? ' • ' + sanitize(exp.location) : ''}</p>
                        <p class="tile-desc">${sanitize(exp.description)}</p>
                        ${exp.tags ? `<div class="tile-tags">${exp.tags.map(t => `<span class="pill pill-sm">${sanitize(t)}</span>`).join('')}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        /* Bind expand via delegation */
        this.bindTileExpand(container);
    }


    /* ==========================================================
       EDUCATION (Expandable tiles)
       ========================================================== */

    renderEducation() {
        const education = this.profile.education;
        if (!education) return;

        const container = document.getElementById('educationTiles');
        if (!container) return;

        container.innerHTML = education.map((edu, index) => {
            const dateRange = edu.endDate
                ? `${sanitize(edu.startDate)} – ${sanitize(edu.endDate)}`
                : sanitize(edu.startDate);
            const icon = edu.icon || '🎓';

            const thesisHtml = edu.thesis
                ? `<div class="tile-thesis">
                        <strong>Thesis:</strong> ${sanitize(edu.thesis.title)}<br>
                        <span class="thesis-grade">Grade: ${sanitize(edu.thesis.grade)}</span>
                        ${edu.thesis.url ? `<a href="${sanitizeUrl(edu.thesis.url)}" target="_blank" rel="noopener" class="thesis-link">Read thesis →</a>` : ''}
                   </div>`
                : '';

            return `
                <div class="journey-tile" 
                     data-expand-id="edu-${index}"
                     role="button"
                     tabindex="0"
                     aria-expanded="false">
                    <div class="tile-header">
                        <span class="tile-icon">${sanitize(icon)}</span>
                        <div class="tile-info">
                            <h4>${sanitize(edu.school)}</h4>
                            <span class="tile-date">${dateRange}</span>
                        </div>
                        <span class="tile-arrow" aria-hidden="true">▸</span>
                    </div>
                    <div class="tile-expand" id="edu-${index}" aria-hidden="true">
                        <p class="tile-role">${sanitize(edu.degree)}${edu.location ? ' • ' + sanitize(edu.location) : ''}</p>
                        ${edu.gpa ? `<p class="tile-gpa">GPA: ${sanitize(edu.gpa)}</p>` : ''}
                        ${thesisHtml}
                        ${edu.highlights ? `<div class="tile-tags">${edu.highlights.slice(0, 4).map(h => `<span class="pill pill-sm">${sanitize(h)}</span>`).join('')}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        this.bindTileExpand(container);
    }

    /** Shared: bind click/keyboard expand for journey tiles */
    bindTileExpand(container) {
        const handler = (e) => {
            const tile = e.target.closest('.journey-tile');
            if (!tile) return;

            /* Don't collapse if clicking a link inside the expanded area */
            if (e.target.closest('a')) return;

            const isExpanded = tile.classList.contains('expanded');

            /* Close all others first */
            container.querySelectorAll('.journey-tile.expanded').forEach(t => {
                if (t !== tile) {
                    t.classList.remove('expanded');
                    t.setAttribute('aria-expanded', 'false');
                }
            });

            /* Toggle this one */
            tile.classList.toggle('expanded', !isExpanded);
            tile.setAttribute('aria-expanded', !isExpanded);
        };

        container.addEventListener('click', handler);
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler(e);
            }
        });
    }


    /* ==========================================================
       REFERENCES
       ========================================================== */

    renderReferences() {
        const references = this.profile.references;
        if (!references) return;

        const container = document.getElementById('referencesGrid');
        if (!container) return;

        container.innerHTML = references.map(ref => `
            <div class="reference-card">
                <blockquote>"${sanitize(ref.quote)}"</blockquote>
                <div class="reference-author">
                    <strong>${sanitize(ref.name)}</strong>
                    <span>${sanitize(ref.title)}, ${sanitize(ref.company)}</span>
                </div>
            </div>
        `).join('');
    }


    /* ==========================================================
       GLOBAL EVENT BINDINGS
       ========================================================== */

    bindGlobalEvents() {
        /* --- Bio toggle --- */
        const bioToggle = document.getElementById('bioToggle');
        if (bioToggle) {
            const toggle = () => {
                const wrapper = document.getElementById('bioWrapper');
                if (!wrapper) return;
                const isExpanded = wrapper.classList.toggle('expanded');
                bioToggle.setAttribute('aria-expanded', isExpanded);
                const bioFull = document.getElementById('bioFull');
                if (bioFull) bioFull.setAttribute('aria-hidden', !isExpanded);
                const btn = document.getElementById('bioExpandBtn');
                if (btn) {
                    btn.querySelector('.expand-text').textContent = isExpanded ? 'Show less' : 'Read more';
                }
            };
            bioToggle.addEventListener('click', toggle);
            bioToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
            });
        }

        /* --- CV Modal --- */
        const cvOpen = document.getElementById('cvModalOpen');
        const cvModal = document.getElementById('cvModal');
        const cvClose = document.getElementById('cvModalClose');
        const cvCloseFooter = document.getElementById('cvModalCloseFooter');
        const cvIframe = document.getElementById('cvIframe');

        const openCV = () => {
            if (!cvModal) return;
            /* Lazy-load the PDF only when modal opens */
            if (cvIframe && !cvIframe.src) {
                cvIframe.src = 'Robert_Hidri_CV.pdf';
            }
            cvModal.classList.add('active');
            cvModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            /* Focus trap: focus the close button */
            cvClose?.focus();
        };

        const closeCV = () => {
            if (!cvModal) return;
            cvModal.classList.remove('active');
            cvModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            /* Return focus to the trigger button */
            cvOpen?.focus();
        };

        cvOpen?.addEventListener('click', openCV);
        cvClose?.addEventListener('click', closeCV);
        cvCloseFooter?.addEventListener('click', closeCV);

        /* Close modal on backdrop click */
        cvModal?.addEventListener('click', (e) => {
            if (e.target === cvModal) closeCV();
        });

        /* Close on Escape, focus trap inside modal */
        document.addEventListener('keydown', (e) => {
            if (!cvModal?.classList.contains('active')) return;

            if (e.key === 'Escape') {
                closeCV();
                return;
            }

            /* Focus trap: keep Tab within modal */
            if (e.key === 'Tab') {
                const focusable = cvModal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

        /* --- Mobile nav toggle --- */
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.getElementById('navLinks');
        if (navToggle && navLinks) {
            navToggle.addEventListener('click', () => {
                const isOpen = navLinks.classList.toggle('open');
                navToggle.classList.toggle('active', isOpen);
                navToggle.setAttribute('aria-expanded', isOpen);
            });

            /* Close mobile nav when a link is clicked */
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('open');
                    navToggle.classList.remove('active');
                    navToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }


    /* ==========================================================
       UTILITIES
       ========================================================== */

    /** Safely set text content of an element by ID */
    setText(id, text) {
        const el = document.getElementById(id);
        if (el && text) el.textContent = text; // textContent is XSS-safe
    }
}


/* ==========================================================
   INITIALIZE
   ========================================================== */
const profileLoader = new ProfileLoader();
