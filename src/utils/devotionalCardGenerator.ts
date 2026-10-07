import { DevotionalEntry } from '../content/devotionals';

/**
 * Generates high-fidelity visual cards for scripture & study notes directly on an HTML5 canvas.
 * Returns a high-res JPEG data URL suitable for social feed posts and lightbox viewing.
 */
export async function generateDevotionalCardImage(
  entry: DevotionalEntry,
  cardType: 'verse' | 'study'
): Promise<string> {
  const canvas = document.createElement('canvas');
  const width = 1080;
  const height = 1350; // Standard 4:5 portrait social ratio
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Deep Space Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#060814');
  bgGrad.addColorStop(0.5, '#0b0f26');
  bgGrad.addColorStop(1, '#050711');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Ambient Warm Glow
  const ambientGlow = ctx.createRadialGradient(width * 0.5, height * 0.2, 50, width * 0.5, height * 0.2, 550);
  ambientGlow.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
  ambientGlow.addColorStop(0.7, 'rgba(217, 119, 6, 0.05)');
  ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = ambientGlow;
  ctx.fillRect(0, 0, width, height);

  // 3. Inner Card Container Frame
  const margin = 60;
  const cardW = width - margin * 2;
  const cardH = height - margin * 2;
  const radius = 40;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(margin, margin, cardW, cardH, radius);
  ctx.fillStyle = 'rgba(15, 20, 45, 0.75)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // Helper for multi-line text wrapping
  const wrapText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): number => {
    const words = text.split(' ');
    let line = '';
    let curY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, curY);
        line = words[n] + ' ';
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, curY);
    return curY + lineHeight;
  };

  if (cardType === 'verse') {
    // Top Badge: "AURA SANCTUARY • MORNING MANNA"
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AURA SANCTUARY • SCRIPTURE PLAN', width / 2, margin + 80);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(entry.title || 'Morning Manna (Bread of Life)', width / 2, margin + 145);

    // Golden Decorative Line
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 120, margin + 180);
    ctx.lineTo(width / 2 + 120, margin + 180);
    ctx.stroke();

    // Reference Badge
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'italic 600 36px Georgia, serif';
    ctx.fillText(entry.reference, width / 2, margin + 245);

    // Scripture Verse Box
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.roundRect(margin + 40, margin + 300, cardW - 80, 580, 24);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Verse Text
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'italic 400 40px Georgia, serif';
    ctx.textAlign = 'center';
    const verseText = `“${entry.text}”`;
    wrapText(verseText, width / 2, margin + 440, cardW - 140, 60);

    // Values tags pill row
    if (entry.values && entry.values.length > 0) {
      let tagX = margin + 80;
      const tagY = margin + 940;
      ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';

      entry.values.forEach((val) => {
        const textWidth = ctx.measureText(val).width;
        const pillW = textWidth + 36;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, pillW, 46, 23);
        ctx.fill();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.stroke();

        ctx.fillStyle = '#fde68a';
        ctx.fillText(val, tagX + 18, tagY + 31);
        tagX += pillW + 16;
      });
    }

    // Bottom Sanctuary Branding
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Spiritual nourishment around the clock ✦ Aura Sanctuary', width / 2, height - margin - 50);

  } else {
    // Study Notes & Prayer Focus Card
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("TODAY'S TOPIC", margin + 60, margin + 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(entry.topic || 'The Ultimate Promise', margin + 60, margin + 140);

    // Key Points Header
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('KEY POINTS', margin + 60, margin + 220);

    let curY = margin + 265;
    ctx.font = '400 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#e2e8f0';

    (entry.points || []).forEach((point) => {
      // Draw green checkmark circle
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(margin + 75, curY - 8, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      curY = wrapText(point, margin + 105, curY, cardW - 170, 38) + 12;
    });

    // Reminder Box
    const reminderY = Math.max(curY + 20, margin + 620);
    ctx.save();
    ctx.fillStyle = 'rgba(217, 119, 6, 0.15)';
    ctx.roundRect(margin + 50, reminderY, cardW - 100, 160, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('💛 REMINDER', margin + 80, reminderY + 45);

    ctx.fillStyle = '#fef3c7';
    ctx.font = '500 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    wrapText(entry.reminder, margin + 80, reminderY + 90, cardW - 160, 36);

    // Prayer Focus Box
    const prayerY = reminderY + 195;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.roundRect(margin + 50, prayerY, cardW - 100, 230, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('🙏 PRAYER FOCUS', margin + 80, prayerY + 45);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'italic 400 26px Georgia, serif';
    wrapText(`"${entry.prayer}"`, margin + 80, prayerY + 95, cardW - 160, 38);

    // Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Morning Manna • Daily Devotional ✦ Aura Sanctuary', width / 2, height - margin - 50);
  }

  return canvas.toDataURL('image/jpeg', 0.88);
}
