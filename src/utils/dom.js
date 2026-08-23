/* ============================================================
   DOM Utility Helpers
   ============================================================ */

/**
 * Create an element with optional attributes, classes, and children
 */
export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);

  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class' || key === 'className') {
      if (Array.isArray(value)) {
        element.classList.add(...value.filter(Boolean));
      } else if (value) {
        element.className = value;
      }
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dk, dv]) => {
        element.dataset[dk] = dv;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'html') {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  });

  children.flat(Infinity).forEach(child => {
    if (child == null || child === false) return;
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });

  return element;
}

/**
 * Shorthand query selectors
 */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Set inner HTML and return the container
 */
export function setHTML(element, html) {
  element.innerHTML = html;
  return element;
}

/**
 * Lazy-load an image with fade-in
 */
export function lazyImage(src, alt = '', className = '') {
  const img = el('img', { alt, class: className });
  img.loading = 'lazy';

  img.onload = () => img.classList.add('loaded');
  img.onerror = () => {
    img.classList.add('loaded');
    img.style.background = 'var(--color-skeleton)';
  };
  img.src = src;

  return img;
}

/**
 * SVG icon helper (inline SVG strings)
 */
export const icons = {
  search: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  heart: `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  externalLink: `<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  x: `<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`,
  menu: `<svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  trash: `<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  tag: `<svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  fire: `<svg viewBox="0 0 24 24"><path d="M12 2c.5 2.5 2 4.5 2 7a4 4 0 1 1-8 0c0-1.5.5-3 1.5-4.5C8 5 9 4 12 2z M12 22c-4 0-7-3-7-7 0-2 .7-3.7 2-5 .5 2 2 3.5 4 4 2-.5 3.5-2 4-4 1.3 1.3 2 3 2 5 0 4-3 7-7 7z"/></svg>`,
};
