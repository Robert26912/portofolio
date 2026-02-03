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
        this.renderAbout();
        this.renderFeaturedProjects();
        this.renderSkills();
        this.renderExperience();
        this.renderEducation();
        this.renderHobbies();
        this.renderReferences();
        this.renderContact();
    }

    // ===== HERO =====
    renderHero() {
        const p = this.profile;
        
        this.setText('heroName', p.name);
        this.setText('heroTitle', p.title);
        this.setText('heroTagline', p.tagline);
        
        const statsEl = document.getElementById('heroStats');
        if (statsEl && p.stats) {
            statsEl.innerHTML = p.stats.map(stat => `
                <div class="stat">
                    <span class="stat-value">${stat.value}</span>
                    <span class="stat-label">${stat.label}</span>
                </div>
            `).join('');
        }
    }

    // ===== ABOUT =====
    renderAbout() {
        const about = this.profile.about;
        if (!about) return;

        this.setText('aboutHeading', about.heading);
        
        const textEl = document.getElementById('aboutText');
        if (textEl && about.paragraphs) {
            textEl.innerHTML = about.paragraphs.map(p => `<p>${p}</p>`).join('');
        }

        const highlightsEl = document.getElementById('aboutHighlights');
        if (highlightsEl && about.highlights) {
            highlightsEl.innerHTML = about.highlights.map(h => `
                <div class="highlight-card">
                    <span class="highlight-icon">${h.icon}</span>
                    <h4>${h.title}</h4>
                    <p>${h.text}</p>
                </div>
            `).join('');
        }
    }

    // ===== FEATURED PROJECTS =====
    renderFeaturedProjects() {
        const projects = this.profile.featuredProjects;
        if (!projects) return;

        const tilesContainer = document.getElementById('projectTiles');
        if (!tilesContainer) return;

        // Filter to featured only (or first 5)
        const featured = projects.filter(p => p.featured !== false).slice(0, 5);
        
        // Render tiles
        tilesContainer.innerHTML = featured.map((project, index) => {
            const statusClass = project.status === 'Completed' ? 'status-done' : 
                               project.status === 'Active' ? 'status-active' : 'status-wip';
            return `
                <div class="project-tile ${index === 0 ? 'active' : ''}" 
                     data-project-index="${index}"
                     onmouseenter="profileLoader.showProject(${index})"
                     onclick="profileLoader.showProject(${index})">
                    <span class="tile-icon">${project.icon}</span>
                    <div class="tile-content">
                        <h4>${project.shortName || project.name}</h4>
                        <span class="tile-status ${statusClass}">${project.status}</span>
                    </div>
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

    // ===== SKILLS =====
    renderSkills() {
        const skills = this.profile.skills;
        if (!skills) return;

        const container = document.getElementById('skillsGrid');
        if (!container) return;

        container.innerHTML = skills.map(group => `
            <div class="skill-group">
                <h4>${group.category}</h4>
                <div class="skill-pills">
                    ${group.items.map(item => `<span class="pill">${item}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }

    // ===== EXPERIENCE =====
    renderExperience() {
        const experience = this.profile.experience;
        if (!experience) return;

        const container = document.getElementById('experienceTimeline');
        if (!container) return;

        container.innerHTML = experience.map(exp => {
            const dateRange = exp.endDate 
                ? `${exp.startDate} – ${exp.endDate}`
                : exp.startDate;
            
            const title = exp.company 
                ? `${exp.role} — ${exp.company}`
                : exp.role;

            const locationHtml = exp.location 
                ? `<p class="timeline-location">${exp.location}</p>`
                : '';

            const tagsHtml = exp.tags && exp.tags.length > 0
                ? `<div class="timeline-tags">
                    ${exp.tags.map(tag => `<span class="pill pill-sm">${tag}</span>`).join('')}
                   </div>`
                : '';

            return `
                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <h3>${title}</h3>
                            <span class="timeline-date">${dateRange}</span>
                        </div>
                        ${locationHtml}
                        <p>${exp.description}</p>
                        ${tagsHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===== EDUCATION =====
    renderEducation() {
        const education = this.profile.education;
        if (!education) return;

        const container = document.getElementById('educationTimeline');
        if (!container) return;

        container.innerHTML = education.map(edu => {
            const dateRange = edu.endDate 
                ? `${edu.startDate} – ${edu.endDate}`
                : edu.startDate;

            const gpaHtml = edu.gpa 
                ? `<p class="timeline-gpa">GPA: ${edu.gpa}</p>`
                : '';

            const thesisHtml = edu.thesis
                ? `<div class="thesis-card">
                    <strong>Thesis:</strong> ${edu.thesis.title}<br>
                    <span class="thesis-grade">Grade: ${edu.thesis.grade}</span>
                    ${edu.thesis.url ? `<a href="${edu.thesis.url}" target="_blank" rel="noopener" class="thesis-link">Read thesis →</a>` : ''}
                   </div>`
                : '';

            const highlightsHtml = edu.highlights && edu.highlights.length > 0
                ? `<div class="timeline-tags">
                    ${edu.highlights.map(h => `<span class="pill pill-sm">${h}</span>`).join('')}
                   </div>`
                : '';

            return `
                <div class="timeline-item">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <h3>${edu.degree}</h3>
                            <span class="timeline-date">${dateRange}</span>
                        </div>
                        <p class="timeline-location">${edu.school}${edu.location ? ', ' + edu.location : ''}</p>
                        ${gpaHtml}
                        ${thesisHtml}
                        ${highlightsHtml}
                    </div>
                </div>
            `;
        }).join('');
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

// Start
const profileLoader = new ProfileLoader();