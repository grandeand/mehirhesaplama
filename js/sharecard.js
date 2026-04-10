// ============================================
// MEHIR HESAPLAMA - SHARE CARD GENERATOR
// Creates a beautiful shareable image from results
// ============================================

const ShareCard = (() => {

  const CARD_WIDTH = 1080;
  const CARD_HEIGHT = 1350;

  const tierColors = {
    bronze: { primary: '#CD7F32', secondary: '#8B5E3C', glow: 'rgba(205,127,50,0.3)' },
    silver: { primary: '#C0C0C0', secondary: '#808080', glow: 'rgba(192,192,192,0.3)' },
    gold: { primary: '#D4A843', secondary: '#9E7A2F', glow: 'rgba(212,168,67,0.3)' },
    platinum: { primary: '#B9F2FF', secondary: '#6BA3B0', glow: 'rgba(185,242,255,0.3)' },
    diamond: { primary: '#E8D5F5', secondary: '#9B59B6', glow: 'rgba(155,89,182,0.3)' }
  };

  function formatNumber(num) {
    return new Intl.NumberFormat('tr-TR').format(num);
  }

  function formatTL(amount) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency', currency: 'TRY',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount);
  }

  // Draw rounded rectangle
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Generate share card as canvas
  function generate(result, name, gender) {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const ctx = canvas.getContext('2d');

    const colors = tierColors[result.tier.class] || tierColors.gold;

    // --- Background ---
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
    bgGrad.addColorStop(0, '#0A0A14');
    bgGrad.addColorStop(0.5, '#12121F');
    bgGrad.addColorStop(1, '#0A0A14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // --- Decorative stars ---
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * CARD_WIDTH;
      const y = Math.random() * CARD_HEIGHT;
      const size = Math.random() * 2.5 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Top glow circle ---
    const glowGrad = ctx.createRadialGradient(CARD_WIDTH / 2, 200, 50, CARD_WIDTH / 2, 200, 400);
    glowGrad.addColorStop(0, colors.glow);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, CARD_WIDTH, 600);

    // --- Title ---
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 42px "Segoe UI", Arial, sans-serif';
    ctx.fillText('💍 Mehir Hesaplama', CARD_WIDTH / 2, 100);

    // --- Name ---
    ctx.fillStyle = colors.primary;
    ctx.font = '700 56px "Segoe UI", Arial, sans-serif';
    ctx.fillText(name, CARD_WIDTH / 2, 190);

    // --- Tier Badge ---
    const tierText = `${result.tier.emoji} ${result.tier.name} Seviye`;
    ctx.font = '700 48px "Segoe UI", Arial, sans-serif';
    const tierWidth = ctx.measureText(tierText).width + 80;

    // Badge background
    roundRect(ctx, (CARD_WIDTH - tierWidth) / 2, 240, tierWidth, 70, 35);
    ctx.fillStyle = colors.glow;
    ctx.fill();
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = colors.primary;
    ctx.font = '700 38px "Segoe UI", Arial, sans-serif';
    ctx.fillText(tierText, CARD_WIDTH / 2, 286);

    // --- Main Gold Amount ---
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 120px "Segoe UI", Arial, sans-serif';
    ctx.fillText(formatNumber(result.totalGrams), CARD_WIDTH / 2, 460);

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '500 36px "Segoe UI", Arial, sans-serif';
    ctx.fillText('gram altın', CARD_WIDTH / 2, 510);

    // --- TL Amount ---
    ctx.fillStyle = colors.primary;
    ctx.font = '700 44px "Segoe UI", Arial, sans-serif';
    ctx.fillText('≈ ' + formatTL(result.totalTL), CARD_WIDTH / 2, 580);

    // --- Divider ---
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(140, 630);
    ctx.lineTo(CARD_WIDTH - 140, 630);
    ctx.stroke();

    // --- Category Scores ---
    const categories = [
      { label: '💃 Fiziksel', value: result.categoryScores.physical },
      { label: '👨‍👩‍👧 Demografik', value: result.categoryScores.demographic },
      { label: '🎓 Eğitim', value: result.categoryScores.education },
      { label: '🌟 Karakter', value: result.categoryScores.character }
    ];

    let barY = 680;
    const barX = 120;
    const barWidth = CARD_WIDTH - 240;
    const barHeight = 28;

    categories.forEach(cat => {
      // Label
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '500 28px "Segoe UI", Arial, sans-serif';
      ctx.fillText(cat.label, barX, barY);

      // Value
      ctx.textAlign = 'right';
      ctx.fillStyle = colors.primary;
      ctx.font = '700 28px "Segoe UI", Arial, sans-serif';
      ctx.fillText(cat.value + '%', barX + barWidth, barY);

      // Bar background
      barY += 14;
      roundRect(ctx, barX, barY, barWidth, barHeight, barHeight / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();

      // Bar fill
      const fillWidth = (cat.value / 100) * barWidth;
      if (fillWidth > 0) {
        roundRect(ctx, barX, barY, Math.max(fillWidth, barHeight), barHeight, barHeight / 2);
        const barGrad = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
        barGrad.addColorStop(0, colors.secondary);
        barGrad.addColorStop(1, colors.primary);
        ctx.fillStyle = barGrad;
        ctx.fill();
      }

      barY += barHeight + 36;
    });

    // --- Comment ---
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'italic 26px "Segoe UI", Arial, sans-serif';

    // Word wrap comment
    const comment = result.comment;
    const maxWidth = CARD_WIDTH - 160;
    const words = comment.split(' ');
    let line = '';
    let commentY = barY + 20;

    for (const word of words) {
      const testLine = line + word + ' ';
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line.trim(), CARD_WIDTH / 2, commentY);
        line = word + ' ';
        commentY += 36;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), CARD_WIDTH / 2, commentY);

    // --- Footer ---
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '400 26px "Segoe UI", Arial, sans-serif';
    ctx.fillText('mehirhesapla.com', CARD_WIDTH / 2, CARD_HEIGHT - 80);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '400 22px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Sen de hesapla! 👉', CARD_WIDTH / 2, CARD_HEIGHT - 40);

    return canvas;
  }

  // Convert canvas to blob
  async function toBlob(canvas) {
    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/png', 1.0);
    });
  }

  // Download the image
  function download(canvas, name) {
    const link = document.createElement('a');
    link.download = `mehir_${name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // Share using Web Share API (works on mobile for any app)
  async function shareNative(canvas, result, name) {
    const blob = await toBlob(canvas);
    const file = new File([blob], `mehir_${name}.png`, { type: 'image/png' });

    const shareData = {
      title: '💍 Mehir Hesaplama Sonucu',
      text: `${name} - ${result.tier.emoji} ${result.tier.name} Seviye! ${formatNumber(result.totalGrams)} gram altın\nSen de hesapla 👉 mehirhesapla.com`,
      files: [file]
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    }
    return false;
  }

  // Share to WhatsApp with image download + text
  async function shareWhatsApp(canvas, result, name) {
    // Download image first
    download(canvas, name);

    // Open WhatsApp with text
    const text = encodeURIComponent(
      `💍 ${name} - ${result.tier.emoji} ${result.tier.name} Seviye!\n` +
      `💰 ${formatNumber(result.totalGrams)} gram altın (${formatTL(result.totalTL)})\n\n` +
      `Sen de hesapla 👉 mehirhesapla.com`
    );
    setTimeout(() => {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }, 500);
  }

  // Share to X (Twitter)
  async function shareX(canvas, result, name) {
    download(canvas, name);
    const text = encodeURIComponent(
      `💍 ${name} - ${result.tier.emoji} ${result.tier.name} Seviye!\n` +
      `💰 ${formatNumber(result.totalGrams)} gram altın\n\n` +
      `Sen de hesapla 👉 mehirhesapla.com`
    );
    setTimeout(() => {
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }, 500);
  }

  return { generate, download, shareNative, shareWhatsApp, shareX, toBlob };

})();
