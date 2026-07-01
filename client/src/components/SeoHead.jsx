import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Stubia.id';
const DEFAULT_OG_IMAGE = 'https://www.stubia.id/og-default.jpg';
const BASE_URL = 'https://www.stubia.id';

/**
 * Komponen SEO reusable untuk Stubia.id
 * Menggunakan react-helmet-async untuk inject meta tags ke <head>
 *
 * @param {string}  title        - Judul halaman (suffix "| Stubia.id" otomatis ditambahkan)
 * @param {string}  description  - Meta description (maks 160 karakter)
 * @param {string}  [canonical]  - Path canonical relatif, contoh: "/blog/tips-utbk/cara-mengerjakan-soal"
 * @param {string}  [ogImage]    - URL gambar Open Graph
 * @param {string}  [ogType]     - Tipe Open Graph: 'website' | 'article' (default: 'website')
 * @param {Object}  [schema]     - JSON-LD schema object untuk Rich Results Google
 * @param {string}  [articlePublishedTime] - ISO date string untuk artikel (khusus og:article)
 * @param {string}  [articleAuthor]        - Nama penulis artikel
 */
export default function SeoHead({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  schema,
  articlePublishedTime,
  articleAuthor,
}) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Platform Tryout UTBK-SNBT & Ujian Mandiri PTN Terpercaya`;

  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : null;
  const imageUrl = ogImage || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      {/* ── Primary Meta ── */}
      <html lang="id" />
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* ── Open Graph ── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="id_ID" />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || SITE_NAME} />

      {/* ── OG Article (khusus halaman blog) ── */}
      {ogType === 'article' && articlePublishedTime && (
        <meta property="article:published_time" content={articlePublishedTime} />
      )}
      {ogType === 'article' && articleAuthor && (
        <meta property="article:author" content={articleAuthor} />
      )}

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content="@stubiaid" />

      {/* ── JSON-LD Schema ── */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
