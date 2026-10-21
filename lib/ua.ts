export function parseUA(ua: string) {
  const s = ua.toLowerCase();
  const os = /windows/.test(s) ? "Windows"
    : /iphone|ipad|ipod/.test(s) ? "iOS"
    : /mac os x|macintosh/.test(s) ? "macOS"
    : /android/.test(s) ? "Android"
    : /cros/.test(s) ? "ChromeOS"
    : /linux/.test(s) ? "Linux" : "Other";
  const browser = /edg\//.test(s) ? "Edge"
    : /opr\/|opera/.test(s) ? "Opera"
    : /firefox|fxios/.test(s) ? "Firefox"
    : /chrome|crios/.test(s) ? "Chrome"
    : /safari/.test(s) ? "Safari" : "Other";
  const device = /ipad|tablet/.test(s) ? "tablet" : /mobi|iphone|android/.test(s) ? "mobile" : "desktop";
  return { os, browser, device };
}

export const isBot = (ua: string) =>
  !ua || /bot|crawl|spider|slurp|preview|headless|lighthouse|curl|wget|python|node-fetch/i.test(ua);
