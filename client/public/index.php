<?php
/**
 * Stubia.id SEO Dynamic Router Entry Point
 * 
 * File ini diletakkan di folder /public agar disalin ke /dist oleh Vite.
 * Web server Apache (via .htaccess) mengarahkan seluruh request ke index.php ini.
 * Script ini mendeteksi URL, memuat data SEO secara dinamis untuk blog/artikel,
 * memanipulasi konten HTML dari index.html hasil build Vite, lalu mengembalikannya ke browser.
 */

// 1. Baca isi file index.html static hasil build Vite
$html_file = __DIR__ . '/index.html';
if (!file_exists($html_file)) {
    // Fallback jika file index.html tidak sengaja terhapus atau belum di-build
    echo "Error: index.html not found. Please build the frontend client first.";
    exit;
}
$html = file_get_contents($html_file);

// 2. Tentukan nilai default untuk Landing Page (Kondisi 1)
$page_title = "Platform UTBK Terbaik - Stubia";
$page_desc = "Stubia.id adalah platform tryout UTBK-SNBT dan Ujian Mandiri PTN terlengkap di Indonesia. Latihan soal UTBK, tryout ujian mandiri, dan simulasi tes untuk persiapan masuk PTN impianmu. Daftar gratis di Stubia.id sekarang!";
$page_image = "https://www.stubia.id/og-default.jpg";
$page_url = "https://www.stubia.id" . ($_SERVER['REQUEST_URI'] ?? '/');
$page_type = 'website';

// 3. Cek jika user sedang mengakses halaman blog detail (Kondisi 2)
// Format URL blog: /blog/slug-artikel
$request_uri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($request_uri, PHP_URL_PATH);

if (preg_match('/^\/blog\/([a-zA-Z0-9\-]+)$/', $path, $matches)) {
    $slug = $matches[1];

    // Jika variabel $artikel tidak didefinisikan dari scope controller backend,
    // kita fetch artikel secara dinamis menggunakan API NodeJS Stubia
    if (!isset($artikel)) {
        // Endpoint API untuk mendapatkan detail artikel berdasarkan slug
        $api_url = "https://api.stubia.id/api/articles/" . $slug;
        
        $ctx = stream_context_create([
            'http' => [
                'timeout' => 2, // Timeout cepat agar performa web tidak lambat jika API kendala
                'ignore_errors' => true
            ]
        ]);
        
        $response = @file_get_contents($api_url, false, $ctx);
        if ($response) {
            $json = json_decode($response, true);
            if (isset($json['success']) && $json['success'] && isset($json['data'])) {
                $artikel = $json['data'];
            }
        }
    }
}

// 4. Jika variabel $artikel didefinisikan (baik dari controller PHP luar atau dari fetch API di atas)
if (isset($artikel)) {
    // Mengakomodasi format objek ($artikel->judul) dan array ($artikel['judul'])
    $judul_artikel = is_object($artikel) ? ($artikel->judul ?? $artikel->title ?? '') : ($artikel['judul'] ?? $artikel['title'] ?? '');
    $ringkasan_artikel = is_object($artikel) ? ($artikel->ringkasan ?? $artikel->excerpt ?? '') : ($artikel['ringkasan'] ?? $artikel['excerpt'] ?? '');
    $gambar_artikel = is_object($artikel) ? ($artikel->cover_image ?? $artikel->detail_image ?? '') : ($artikel['cover_image'] ?? $artikel['detail_image'] ?? '');

    if (!empty($judul_artikel)) {
        $page_title = $judul_artikel . " - Stubia";
    }
    if (!empty($ringkasan_artikel)) {
        $page_desc = strip_tags($ringkasan_artikel);
        // Batasi deskripsi hingga sekitar 155-160 karakter untuk standard SEO Google
        if (mb_strlen($page_desc, 'UTF-8') > 160) {
            $page_desc = mb_strimwidth($page_desc, 0, 155, "...", 'UTF-8');
        }
    }
    if (!empty($gambar_artikel)) {
        $page_image = $gambar_artikel;
    }
    $page_type = 'article';
}

// 5. Ganti tag metadata di dalam <head> secara dinamis
// Menggunakan htmlspecialchars untuk mengamankan karakter khusus
$safe_title = htmlspecialchars($page_title, ENT_QUOTES, 'UTF-8');
$safe_desc = htmlspecialchars($page_desc, ENT_QUOTES, 'UTF-8');
$safe_url = htmlspecialchars($page_url, ENT_QUOTES, 'UTF-8');
$safe_image = htmlspecialchars($page_image, ENT_QUOTES, 'UTF-8');
$safe_type = htmlspecialchars($page_type, ENT_QUOTES, 'UTF-8');

// Replace Title & Description utama
$html = preg_replace('/<title>.*?<\/title>/i', "<title>{$safe_title}</title>", $html);
$html = preg_replace('/<meta name="description" content=".*?" \/>/i', "<meta name="description" content=\"{$safe_desc}\" />", $html);
$html = preg_replace('/<link rel="canonical" href=".*?" \/>/i', "<link rel=\"canonical\" href=\"{$safe_url}\" />", $html);

// Replace Open Graph metadata
$html = preg_replace('/<meta property="og:type" content=".*?" \/>/i', "<meta property=\"og:type\" content=\"{$safe_type}\" />", $html);
$html = preg_replace('/<meta property="og:title" content=".*?" \/>/i', "<meta property=\"og:title\" content=\"{$safe_title}\" />", $html);
$html = preg_replace('/<meta property="og:description" content=".*?" \/>/i', "<meta property=\"og:description\" content=\"{$safe_desc}\" />", $html);
$html = preg_replace('/<meta property="og:url" content=".*?" \/>/i', "<meta property=\"og:url\" content=\"{$safe_url}\" />", $html);
$html = preg_replace('/<meta property="og:image" content=".*?" \/>/i', "<meta property=\"og:image\" content=\"{$safe_image}\" />", $html);

// Replace Twitter Card metadata
$html = preg_replace('/<meta name="twitter:title" content=".*?" \/>/i', "<meta name=\"twitter:title\" content=\"{$safe_title}\" />", $html);
$html = preg_replace('/<meta name="twitter:description" content=".*?" \/>/i', "<meta name=\"twitter:description\" content=\"{$safe_desc}\" />", $html);
$html = preg_replace('/<meta name="twitter:image" content=".*?" \/>/i', "<meta name=\"twitter:image\" content=\"{$safe_image}\" />", $html);

// 6. Tampilkan HTML hasil modifikasi
echo $html;
