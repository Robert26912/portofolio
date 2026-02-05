/**
 * PROFILE LOADER
 * Reads config/profile.json and populates the landing page
 * 
 * Sections supported:
 * - Hero (name, title, tagline, stats)
 * - About (heading, paragraphs, highlights)
 * - Skills (categories with items)
 * - Experience (timeline)
 * - Education (degrees, thesis)
 * - Hobbies (interests)
 * - References (quotes)
 * - Contact (links)
 */

class ProfileLoader {
    constructor() {
        this.profile = null;
        this.init();
    }

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
            if (!response.ok) throw new Error('Profile not found');
            this.profile = await response.json();
            this.render();
            console.log('✅ Profile loaded');
        } catch (error) {
            console.error('❌ Failed to load profile:', error);
        }
    }

    render() {
        this.renderHero();
        this.renderContactMini();
        this.renderSkillsSidebar();
        this.renderFeaturedProjects();
        this.renderExperience();
        this.renderEducation();
        this.renderReferences();
    }

    // ===== HERO (Compact with Profile Card + Expandable Bio) =====
    renderHero() {
        const p = this.profile;
        
        this.setText('heroName', p.name);
        this.setText('heroTitle', p.title);
        
        // Bio teaser (first sentence)
        const bioTeaser = document.getElementById('bioTeaser');
        if (bioTeaser && p.tagline) {
            const teaser = p.tagline.split('.')[0] + '.';
            bioTeaser.textContent = teaser;
        }
        
        // Full bio text
        const bioFullText = document.getElementById('bioFullText');
        if (bioFullText && p.tagline) {
            bioFullText.textContent = p.tagline;
        }
        
        // Bio highlights (from about section)
        const bioHighlights = document.getElementById('bioHighlights');
        if (bioHighlights && p.about && p.about.highlights) {
            bioHighlights.innerHTML = p.about.highlights.slice(0, 4).map(h => `
                <span class="bio-highlight">${h.icon} ${h.title}</span>
            `).join('');
        }
    }

    // ===== CONTACT MINI (Below Profile) =====
    renderContactMini() {
        const contact = this.profile.contact;
        if (!contact) return;

        const container = document.getElementById('contactMini');
        if (!container) return;

        container.innerHTML = contact.map(c => {
            // Protected email - click to reveal
            if (c.protected && c.label === 'Email') {
                const encoded = btoa(c.value);
                return `
                    <div class="contact-mini-tile" 
                         id="emailTile"
                         data-encoded="${encoded}"
                         onclick="revealEmailMini(this)"
                         role="button">
                        <span class="contact-mini-icon">${c.icon}</span>
                        <span class="contact-mini-label">Click to reveal email</span>
                    </div>
                `;
            }
            
            // Skip location for mini view
            if (!c.url) return '';
            
            const preferredClass = c.preferred ? 'preferred' : '';
            const badge = c.preferred ? '<span class="contact-mini-badge">★ Preferred</span>' : '';
            
            return `
                <a href="${c.url}" target="_blank" rel="noopener noreferrer" class="contact-mini-tile ${preferredClass}">
                    <span class="contact-mini-icon">${c.icon}</span>
                    <span class="contact-mini-label">${c.label}</span>
                    ${badge}
                </a>
            `;
        }).filter(Boolean).join('');
    }

    // ===== FEATURED PROJECTS (Showcase) =====
    renderFeaturedProjects() {
        const projects = this.profile.featuredProjects;
        if (!projects) return;

        const tilesContainer = document.getElementById('projectTiles');
        if (!tilesContainer) return;

        // Filter to featured only, max 4 for compact view
        const featured = projects.filter(p => p.featured !== false).slice(0, 4);
        
        // Render compact tiles
        tilesContainer.innerHTML = featured.map((project, index) => {
            const statusClass = project.status === 'Completed' ? 'status-done' : 
                               project.status === 'Active' ? 'status-active' : 'status-wip';
            return `
                <div class="project-tile ${index === 0 ? 'active' : ''}" 
                     data-project-index="${index}"
                     onmouseenter="profileLoader.showProject(${index})"
                     onclick="profileLoader.showProject(${index})">
                    <span class="tile-icon">${project.icon}</span>
                    <span class="tile-name">${project.shortName || project.name}</span>
                    <span class="tile-status ${statusClass}">${project.status}</span>
                </div>
            `;
        }).join('');

        // Store projects for reference
        this.featuredProjects = featured;
        
        // Show first project by default
        if (featured.length > 0) {
            this.showProject(0);
        }
    }

    showProject(index) {
        const project = this.featuredProjects[index];
        if (!project) return;

        // Update active tile
        document.querySelectorAll('.project-tile').forEach((tile, i) => {
            tile.classList.toggle('active', i === index);
        });

        // Update preview media
        const mediaEl = document.getElementById('previewMedia');
        if (mediaEl) {
            if (project.media && project.media.type === 'image' && project.media.images.length > 0) {
                mediaEl.innerHTML = `<img src="${project.media.images[0]}" alt="${project.name}" class="preview-image">`;
            } else if (project.media && project.media.type === 'video' && project.media.video) {
                mediaEl.innerHTML = `<video src="${project.media.video}" controls class="preview-video"></video>`;
            } else {
                // Placeholder
                const placeholder = project.media?.placeholder || project.icon || '📁';
                mediaEl.innerHTML = `
                    <div class="preview-placeholder">
                        <span class="preview-icon">${placeholder}</span>
                        <span class="preview-text">${project.status === 'In Progress' ? 'Coming Soon' : 'Preview'}</span>
                    </div>
                `;
            }
        }

        // Update thumbnails
        const thumbsEl = document.getElementById('previewThumbnails');
        if (thumbsEl) {
            if (project.media && project.media.images && project.media.images.length > 1) {
                thumbsEl.innerHTML = project.media.images.map((img, i) => `
                    <div class="thumb ${i === 0 ? 'active' : ''}" onclick="profileLoader.showImage(${index}, ${i})">
                        <img src="${img}" alt="Thumbnail ${i + 1}">
                    </div>
                `).join('');
                thumbsEl.style.display = 'flex';
            } else {
                thumbsEl.innerHTML = '';
                thumbsEl.style.display = 'none';
            }
        }

        // Update details
        const detailsEl = document.getElementById('previewDetails');
        if (detailsEl) {
            const tagsHtml = project.tags.map(tag => `<span class="preview-tag">${tag}</span>`).join('');
            
            let linksHtml = '';
            if (project.links) {
                if (project.links.thesis) {
                    linksHtml += `<a href="${project.links.thesis}" target="_blank" rel="noopener" class="preview-link">📄 Read Thesis</a>`;
                }
                if (project.links.github && project.links.github !== '') {
                    linksHtml += `<a href="${project.links.github}" target="_blank" rel="noopener" class="preview-link">💻 View Code</a>`;
                }
                if (project.links.demo) {
                    linksHtml += `<a href="${project.links.demo}" target="_blank" rel="noopener" class="preview-link">🎬 Watch Demo</a>`;
                }
                if (project.links.live) {
                    linksHtml += `<a href="${project.links.live}" target="_blank" rel="noopener" class="preview-link">🌐 Live Demo</a>`;
                }
            }
            
            const isPlaceholder = project.description.includes('[PLACEHOLDER]');
            const description = project.description.replace('[PLACEHOLDER] ', '');
            
            detailsEl.innerHTML = `
                <h3 class="preview-title">${project.name} ${isPlaceholder ? '<span class="wip-badge-sm">WIP</span>' : ''}</h3>
                <p class="preview-description">${description}</p>
                <div class="preview-tags">${tagsHtml}</div>
                <div class="preview-links">${linksHtml || '<span class="no-links">Links coming soon</span>'}</div>
            `;
        }
    }

    showImage(projectIndex, imageIndex) {
        const project = this.featuredProjects[projectIndex];
        if (!project || !project.media || !project.media.images) return;
        
        const mediaEl = document.getElementById('previewMedia');
        if (mediaEl) {
            mediaEl.innerHTML = `<img src="${project.media.images[imageIndex]}" alt="${project.name}" class="preview-image">`;
        }
        
        // Update active thumbnail
        document.querySelectorAll('.thumb').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === imageIndex);
        });
    }

    // ===== SKILLS SIDEBAR (Smooth tabs, click to expand) =====
    renderSkillsSidebar() {
        const skills = this.profile.skills;
        if (!skills) return;

        const container = document.getElementById('skillsSidebar');
        if (!container) return;

        // Add icons for each category
        const icons = {
            'Programming Languages': '💻',
            'IoT & Embedded': '🔌',
            'Data & Analytics': '📊',
            'Networking & Infrastructure': '🌐',
            'Tools & Methods': '🛠️',
            'Languages (Human)': '🗣️',
            'Design skills': '🎨'
        };

        container.innerHTML = skills.map((group, index) => `
            <div class="skill-tab" data-category="${index}" onclick="profileLoader.toggleSkillTab(${index})">
                <div class="skill-tab-header">
                    <span class="skill-tab-icon">${icons[group.category] || '📁'}</span>
                    <span class="skill-tab-name">${group.category.replace('Languages (Human)', 'Languages')}</span>
                </div>
                <div class="skill-tab-expand">
                    <div class="skill-tab-items">
                        ${group.items.map(item => `<span class="skill-item">${item}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    toggleSkillTab(index) {
        const tabs = document.querySelectorAll('.skill-tab');
        tabs.forEach((tab, i) => {
            if (i === index) {
                tab.classList.toggle('expanded');
            } else {
                tab.classList.remove('expanded');
            }
        });
    }

    // ===== EXPERIENCE (Tiles) =====
    renderExperience() {
        const experience = this.profile.experience;
        if (!experience) return;

        const container = document.getElementById('experienceTiles');
        if (!container) return;

        container.innerHTML = experience.map((exp, index) => {
            const dateRange = exp.endDate 
                ? `${exp.startDate} – ${exp.endDate}`
                : `${exp.startDate} – Present`;
            
            const icon = exp.icon || '💼';

            return `
                <div class="journey-tile" onclick="profileLoader.toggleExpand(this, 'exp-${index}')">
                    <div class="tile-header">
                        <span class="tile-icon">${icon}</span>
                        <div class="tile-info">
                            <h4>${exp.company || exp.role}</h4>
                            <span class="tile-date">${dateRange}</span>
                        </div>
                        <span class="tile-arrow">▸</span>
                    </div>
                    <div class="tile-expand" id="exp-${index}">
                        <p class="tile-role">${exp.role}${exp.location ? ' • ' + exp.location : ''}</p>
                        <p class="tile-desc">${exp.description}</p>
                        ${exp.tags ? `<div class="tile-tags">${exp.tags.map(t => `<span class="pill pill-sm">${t}</span>`).join('')}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===== EDUCATION (Tiles) =====
    renderEducation() {
        const education = this.profile.education;
        if (!education) return;

        const container = document.getElementById('educationTiles');
        if (!container) return;

        container.innerHTML = education.map((edu, index) => {
            const dateRange = edu.endDate 
                ? `${edu.startDate} – ${edu.endDate}`
                : edu.startDate;
            
            const icon = edu.icon || '🎓';

            const thesisHtml = edu.thesis
                ? `<div class="tile-thesis">
                    <strong>Thesis:</strong> ${edu.thesis.title}<br>
                    <span class="thesis-grade">Grade: ${edu.thesis.grade}</span>
                    ${edu.thesis.url ? `<a href="${edu.thesis.url}" target="_blank" rel="noopener" class="thesis-link">Read thesis →</a>` : ''}
                   </div>`
                : '';

            return `
                <div class="journey-tile" onclick="profileLoader.toggleExpand(this, 'edu-${index}')">
                    <div class="tile-header">
                        <span class="tile-icon">${icon}</span>
                        <div class="tile-info">
                            <h4>${edu.school}</h4>
                            <span class="tile-date">${dateRange}</span>
                        </div>
                        <span class="tile-arrow">▸</span>
                    </div>
                    <div class="tile-expand" id="edu-${index}">
                        <p class="tile-role">${edu.degree}${edu.location ? ' • ' + edu.location : ''}</p>
                        ${edu.gpa ? `<p class="tile-gpa">GPA: ${edu.gpa}</p>` : ''}
                        ${thesisHtml}
                        ${edu.highlights ? `<div class="tile-tags">${edu.highlights.slice(0, 4).map(h => `<span class="pill pill-sm">${h}</span>`).join('')}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Toggle expand/collapse for tiles
    toggleExpand(tileEl, expandId) {
        const expandEl = document.getElementById(expandId);
        const isExpanded = tileEl.classList.contains('expanded');
        
        // Close all others first
        document.querySelectorAll('.journey-tile.expanded').forEach(t => {
            if (t !== tileEl) {
                t.classList.remove('expanded');
            }
        });
        
        // Toggle this one
        tileEl.classList.toggle('expanded', !isExpanded);
    }

    // ===== HOBBIES =====
    renderHobbies() {
        const hobbies = this.profile.hobbies;
        if (!hobbies) return;

        const container = document.getElementById('hobbiesGrid');
        if (!container) return;

        container.innerHTML = hobbies.map(hobby => `
            <div class="hobby-card">
                <span class="hobby-icon">${hobby.icon}</span>
                <h4>${hobby.name}</h4>
                <p>${hobby.description}</p>
            </div>
        `).join('');
    }

    // ===== REFERENCES =====
    renderReferences() {
        const references = this.profile.references;
        if (!references) return;

        const container = document.getElementById('referencesGrid');
        if (!container) return;

        container.innerHTML = references.map(ref => `
            <div class="reference-card">
                <blockquote>"${ref.quote}"</blockquote>
                <div class="reference-author">
                    <strong>${ref.name}</strong>
                    <span>${ref.title}, ${ref.company}</span>
                </div>
            </div>
        `).join('');
    }

    // ===== CONTACT =====
    renderContact() {
        const contact = this.profile.contact;
        if (!contact) return;

        const container = document.getElementById('contactGrid');
        if (!container) return;

        container.innerHTML = contact.map(c => {
            // Protected email - click to reveal
            if (c.protected && c.label === 'Email') {
                const encoded = btoa(c.value);
                return `
                    <div class="contact-card contact-card-protected" 
                         data-encoded="${encoded}"
                         onclick="revealEmail(this)"
                         role="button"
                         tabindex="0">
                        <span class="contact-icon">${c.icon}</span>
                        <span class="contact-label">${c.label}</span>
                        <span class="contact-value">Click to reveal</span>
                        <span class="contact-hint">🔒 Protected from bots</span>
                    </div>
                `;
            }
            
            // Static (no URL, like location)
            if (!c.url) {
                return `
                    <div class="contact-card contact-card-static">
                        <span class="contact-icon">${c.icon}</span>
                        <span class="contact-label">${c.label}</span>
                        <span class="contact-value">${c.value}</span>
                    </div>
                `;
            }
            
            // Preferred contact (LinkedIn)
            const preferredClass = c.preferred ? 'contact-card-preferred' : '';
            const badge = c.preferred ? '<span class="contact-badge">✓ Preferred</span>' : '';
            
            return `
                <a href="${c.url}" target="_blank" rel="noopener noreferrer" class="contact-card ${preferredClass}">
                    <span class="contact-icon">${c.icon}</span>
                    <span class="contact-label">${c.label}</span>
                    <span class="contact-value">${c.value}</span>
                    ${badge}
                </a>
            `;
        }).join('');

        // Add contact note if exists
        const noteEl = document.querySelector('.contact-note');
        if (noteEl && this.profile.contactNote) {
            noteEl.textContent = this.profile.contactNote;
        }
    }

    // Helper
    setText(id, text) {
        const el = document.getElementById(id);
        if (el && text) el.textContent = text;
    }
}

// Email reveal function (global)
function revealEmail(el) {
    const encoded = el.dataset.encoded;
    if (!encoded) return;
    
    try {
        const email = atob(encoded);
        el.querySelector('.contact-value').textContent = email;
        el.querySelector('.contact-hint').textContent = '📧 Click to send email';
        el.classList.remove('contact-card-protected');
        el.classList.add('contact-card-revealed');
        el.onclick = () => window.location.href = 'mailto:' + email;
    } catch (e) {
        console.error('Failed to decode');
    }
}

// Mini email reveal function (for sidebar) - shows email inline
function revealEmailMini(el) {
    const encoded = el.dataset.encoded;
    if (!encoded) return;
    
    try {
        const email = atob(encoded);
        el.innerHTML = `
            <span class="contact-mini-icon">✉️</span>
            <span class="contact-mini-label">
                <span class="contact-mini-email">${email}</span>
            </span>
        `;
        el.classList.add('revealed');
        el.onclick = () => window.location.href = 'mailto:' + email;
    } catch (e) {
        console.error('Failed to decode');
    }
}

// Toggle bio expansion
function toggleBio() {
    const wrapper = document.getElementById('bioWrapper');
    if (wrapper) {
        wrapper.classList.toggle('expanded');
        const btn = document.getElementById('bioExpandBtn');
        if (btn) {
            const isExpanded = wrapper.classList.contains('expanded');
            btn.querySelector('.expand-text').textContent = isExpanded ? 'Show less' : 'Read more';
        }
    }
}

// CV Modal functions
function openCVModal() {
    document.getElementById('cvModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCVModal() {
    document.getElementById('cvModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.id === 'cvModal') {
        closeCVModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCVModal();
    }
});

// Start
const profileLoader = new ProfileLoader();