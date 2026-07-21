/**
 * In-App Browser (WebView) Detection Utility
 * 
 * Detects if the user is browsing from a social media in-app browser
 * (Instagram, TikTok, Facebook, LINE, etc.) which commonly block
 * OAuth pop-ups and third-party cookies.
 */

/**
 * Checks if the current browser is an In-App Browser (WebView)
 * @returns {{ isInAppBrowser: boolean, appName: string | null }}
 */
export function detectInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || '';

  const inAppPatterns = [
    { pattern: /Instagram/i, name: 'Instagram' },
    { pattern: /FBAN|FBAV|FB_IAB/i, name: 'Facebook' },
    { pattern: /BytedanceWebview|TikTok/i, name: 'TikTok' },
    { pattern: /Line\//i, name: 'LINE' },
    { pattern: /Twitter/i, name: 'Twitter/X' },
    { pattern: /Snapchat/i, name: 'Snapchat' },
    { pattern: /Pinterest/i, name: 'Pinterest' },
    { pattern: /MicroMessenger/i, name: 'WeChat' },
    { pattern: /Telegram/i, name: 'Telegram' },
    // Generic WebView detection (fallback)
    { pattern: /\bwv\b|WebView/i, name: 'WebView' },
  ];

  for (const { pattern, name } of inAppPatterns) {
    if (pattern.test(ua)) {
      return { isInAppBrowser: true, appName: name };
    }
  }

  // Additional heuristic: iOS standalone WebView (no Safari identifier)
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /Safari/i.test(ua);
  const isChrome = /CriOS/i.test(ua);
  if (isIOS && !isSafari && !isChrome) {
    return { isInAppBrowser: true, appName: 'In-App Browser' };
  }

  return { isInAppBrowser: false, appName: null };
}

/**
 * Generates a URL to open the current page in the device's default browser.
 * - Android: Uses `intent://` scheme to open in Chrome.
 * - iOS: Uses the current URL directly (user must tap Safari "Open in Safari" button).
 * - Other: Returns the current URL for copy-to-clipboard.
 * 
 * @param {string} [url] - URL to open. Defaults to current page URL.
 * @returns {{ url: string, method: 'intent' | 'copy', instruction: string }}
 */
export function getOpenInBrowserLink(url) {
  const targetUrl = url || window.location.href;
  const ua = navigator.userAgent || '';

  const isAndroid = /Android/i.test(ua);

  if (isAndroid) {
    // Android intent:// scheme to open in Chrome
    const intentUrl = targetUrl
      .replace(/^https?:\/\//, '');
    return {
      url: `intent://${intentUrl}#Intent;scheme=https;package=com.android.chrome;end`,
      method: 'intent',
      instruction: 'Tap tombol di bawah untuk membuka di Chrome',
    };
  }

  // iOS and others: copy URL for manual pasting
  return {
    url: targetUrl,
    method: 'copy',
    instruction: 'Salin link ini dan buka di Safari atau Chrome',
  };
}
