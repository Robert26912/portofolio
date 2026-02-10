/**
 * Shared Security Utilities — Robert Hidri Portfolio
 *
 * Provides XSS-safe sanitization used by all JS modules.
 * Load this script BEFORE any module scripts.
 *
 * Philosophy: This is a "world" utility — dumb, consistent.
 * Any object (module) that needs sanitization just calls these.
 * Remove this file = nothing breaks structurally, you just lose the safety layer.
 */

/** Escape HTML entities to prevent XSS via innerHTML */
function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/** Sanitize a URL — only allow http(s), relative paths, mailto */
function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) return trimmed;
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return trimmed;
    if (trimmed.startsWith('mailto:')) return trimmed;
    return '#';
}

/** Obfuscate email: char codes -> reversed -> base64 */
function obfuscateEmail(email) {
    const charCodes = email.split('').map(c => c.charCodeAt(0));
    const reversed = charCodes.reverse().join('-');
    return btoa(reversed);
}

/** Deobfuscate email: base64 -> reversed -> char codes */
function deobfuscateEmail(encoded) {
    try {
        const reversed = atob(encoded);
        const charCodes = reversed.split('-').reverse().map(Number);
        return String.fromCharCode(...charCodes);
    } catch {
        return null;
    }
}

/** Debounce utility — delays execution until pause in calls */
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
