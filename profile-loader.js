/**
 * PROFILE LOADER
 * Reads config/profile.json and populates the landing page
 * 
 * Same pattern as module-loader.js:
 * 1. Fetch data from JSON
 * 2. Build HTML from data
 * 3. Insert into DOM
 * 
 * To add new experience/skills/etc: just edit profile.json
 * No code changes needed.
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
            // Page still works with static fallback content
        }
    }

    render() {
        this.renderHero();
        this.renderAbout();
        this.renderSkills();
        this.renderExperience();
        this.renderContact();
    }

    // ===== HERO =====
    renderHero() {
        const p = this.profile;
        
        const nameEl = document.getElementById('heroName');
        const titleEl = document.getElementById('heroTitle');
        const taglineEl = document.getElementById('heroTagline');
        const statsEl = document.getElementById('heroStats');

        if (nameEl) nameEl.textContent = p.name;
        if (titleEl) titleEl.textContent = p.title;
        if (taglineEl) taglineEl.textContent = p.tagline;
        
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

        const headingEl = document.getElementById('aboutHeading');
        const textEl = document.getElementById('aboutText');
        const highlightsEl = document.getElementById('aboutHighlights');

        if (headingEl) headingEl.textContent = about.heading;
        
        if (textEl && about.paragraphs) {
            textEl.innerHTML = about.paragraphs.map(p => `<p>${p}</p>`).join('');
        }

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

    // ===== CONTACT =====
    renderContact() {
        const contact = this.profile.contact;
        if (!contact) return;

        const container = document.getElementById('contactGrid');
        if (!container) return;

        container.innerHTML = contact.map(c => `
            <a href="${c.url}" ${c.url.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} class="contact-card">
                <span class="contact-icon">${c.icon}</span>
                <span class="contact-label">${c.label}</span>
                <span class="contact-value">${c.value}</span>
            </a>
        `).join('');
    }
}

// Start
const profileLoader = new ProfileLoader();
