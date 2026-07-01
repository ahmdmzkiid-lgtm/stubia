import { useEffect } from 'react';

/**
 * Custom SEO hook untuk Stubia.id
 * Mengatur document.title dan meta tags secara dinamis via react-helmet-async
 *
 * @param {Object} options
 * @param {string} options.title           - Judul halaman (tanpa suffix "| Stubia.id")
 * @param {string} options.description     - Meta description (maks 160 karakter)
 * @param {string} [options.canonicalUrl]  - URL canonical penuh (opsional)
 * @param {string} [options.ogImage]       - URL gambar untuk Open Graph (opsional)
 * @param {string} [options.ogType]        - Tipe OG: 'website' | 'article' (default: 'website')
 * @param {Object} [options.schema]        - JSON-LD schema object (opsional)
 */
export function useSEO({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  schema,
} = {}) {
  const siteName = 'Stubia.id';
  const defaultOgImage = 'https://www.stubia.id/og-default.jpg';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} — Platform Tryout UTBK-SNBT & Ujian Mandiri PTN`;

  useEffect(() => {
    // Set document title
    document.title = fullTitle;

    // Helper: set or create meta tag
    const setMeta = (selector, attr, value) => {
      if (!value) return;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attrName, attrVal] = attr.split('=');
        el.setAttribute(attrName, attrVal.replace(/"/g, ''));
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    // Helper: set or create link tag
    const setLink = (rel, href) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Meta Description
    setMeta('meta[name="description"]', 'name=description', description);

    // Canonical
    setLink('canonical', canonicalUrl);

    // Open Graph
    setMeta('meta[property="og:title"]', 'property=og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property=og:description', description);
    setMeta('meta[property="og:type"]', 'property=og:type', ogType);
    setMeta('meta[property="og:url"]', 'property=og:url', canonicalUrl);
    setMeta('meta[property="og:image"]', 'property=og:image', ogImage || defaultOgImage);
    setMeta('meta[property="og:site_name"]', 'property=og:site_name', siteName);
    setMeta('meta[property="og:locale"]', 'property=og:locale', 'id_ID');

    // Twitter Card
    setMeta('meta[name="twitter:card"]', 'name=twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name=twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name=twitter:description', description);
    setMeta('meta[name="twitter:image"]', 'name=twitter:image', ogImage || defaultOgImage);

    // JSON-LD Schema
    const schemaId = 'seo-schema-jsonld';
    let schemaEl = document.getElementById(schemaId);
    if (schema) {
      if (!schemaEl) {
        schemaEl = document.createElement('script');
        schemaEl.id = schemaId;
        schemaEl.type = 'application/ld+json';
        document.head.appendChild(schemaEl);
      }
      schemaEl.textContent = JSON.stringify(schema);
    } else if (schemaEl) {
      // Hapus schema lama jika halaman baru tidak punya schema
      schemaEl.remove();
    }
  }, [fullTitle, description, canonicalUrl, ogImage, ogType, schema]);
}
