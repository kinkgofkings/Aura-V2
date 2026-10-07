/**
 * App Badging & Device Notification Helper
 * Implements the W3C App Badging API (navigator.setAppBadge / clearAppBadge)
 * alongside dynamic canvas-rendered favicon badges for full cross-device support.
 */

let originalFaviconHref: string | null = null;

export function updateDeviceAppBadge(count: number): void {
  if (typeof window === 'undefined') return;

  const validCount = Math.max(0, Math.floor(count));

  // 1. Native W3C App Badging API (Supported by Android PWA Launcher, Moto App Launcher, Chrome, Edge)
  if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
    if (validCount > 0) {
      navigator.setAppBadge(validCount).catch((err) => {
        console.debug('navigator.setAppBadge caught:', err);
      });
    } else {
      navigator.clearAppBadge().catch((err) => {
        console.debug('navigator.clearAppBadge caught:', err);
      });
    }
  }

  // 2. Update Document Title
  try {
    const baseTitle = 'Aura';
    if (validCount > 0) {
      document.title = `(${validCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  } catch {}

  // 3. Dynamic Favicon Badge (Instagram-style red badge stamped on browser tab icon)
  updateFaviconBadge(validCount);
}

export function clearDeviceAppBadge(): void {
  updateDeviceAppBadge(0);
}

function updateFaviconBadge(count: number): void {
  if (typeof document === 'undefined') return;

  const favicon = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!favicon) return;

  if (!originalFaviconHref) {
    originalFaviconHref = favicon.href;
  }

  if (count <= 0) {
    if (originalFaviconHref) {
      favicon.href = originalFaviconHref;
    }
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = '/icon.png';

  img.onload = () => {
    // Draw base icon
    ctx.clearRect(0, 0, 64, 64);
    ctx.drawImage(img, 0, 0, 64, 64);

    // Draw Instagram-style crimson-red notification badge in top-right
    const badgeRadius = count > 9 ? 18 : 16;
    const badgeX = 64 - badgeRadius;
    const badgeY = badgeRadius;

    // Outer glow / shadow
    ctx.save();
    ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444'; // Instagram vibrant red
    ctx.fill();
    ctx.restore();

    // White border
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // White bold text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${count > 9 ? '20px' : '22px'} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = count > 99 ? '99+' : count.toString();
    ctx.fillText(text, badgeX, badgeY + 1);

    favicon.href = canvas.toDataURL('image/png');
  };

  img.onerror = () => {
    // If icon image fails to load, draw standalone badge
    ctx.clearRect(0, 0, 64, 64);
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count.toString(), 32, 32);
    favicon.href = canvas.toDataURL('image/png');
  };
}
