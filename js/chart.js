// ============================================
// MEHIR HESAPLAMA - RADAR CHART
// Vanilla Canvas API radar chart
// ============================================

const RadarChart = (() => {

  function draw(canvasId, scores) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    const size = canvas.parentElement.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;

    const labels = ['Fiziksel', 'Demografik', 'Eğitim', 'Karakter'];
    const values = [
      scores.physical / 100,
      scores.demographic / 100,
      scores.education / 100,
      scores.character / 100
    ];
    const numPoints = labels.length;
    const angleStep = (Math.PI * 2) / numPoints;
    const startAngle = -Math.PI / 2; // Start from top

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Draw grid rings
    const rings = [0.25, 0.5, 0.75, 1.0];
    rings.forEach(ring => {
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = startAngle + i * angleStep;
        const x = centerX + Math.cos(angle) * radius * ring;
        const y = centerY + Math.sin(angle) * radius * ring;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw axis lines
    for (let i = 0; i < numPoints; i++) {
      const angle = startAngle + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw data polygon - filled
    ctx.beginPath();
    for (let i = 0; i <= numPoints; i++) {
      const idx = i % numPoints;
      const angle = startAngle + idx * angleStep;
      const val = values[idx];
      const x = centerX + Math.cos(angle) * radius * val;
      const y = centerY + Math.sin(angle) * radius * val;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Gold gradient fill
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(212, 168, 67, 0.35)');
    gradient.addColorStop(1, 'rgba(212, 168, 67, 0.08)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Gold stroke
    ctx.strokeStyle = 'rgba(212, 168, 67, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points
    for (let i = 0; i < numPoints; i++) {
      const angle = startAngle + i * angleStep;
      const val = values[i];
      const x = centerX + Math.cos(angle) * radius * val;
      const y = centerY + Math.sin(angle) * radius * val;

      // Outer glow
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212, 168, 67, 0.3)';
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#F0D68A';
      ctx.fill();
    }

    // Draw labels
    ctx.font = '500 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < numPoints; i++) {
      const angle = startAngle + i * angleStep;
      const labelRadius = radius + 28;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;

      // Label background
      const text = labels[i];
      const metrics = ctx.measureText(text);
      const padding = 8;

      ctx.fillStyle = 'rgba(10, 10, 18, 0.7)';
      ctx.beginPath();
      ctx.roundRect(
        x - metrics.width / 2 - padding,
        y - 9 - 2,
        metrics.width + padding * 2,
        18 + 4,
        6
      );
      ctx.fill();

      // Label text
      ctx.fillStyle = 'rgba(245, 240, 232, 0.7)';
      ctx.fillText(text, x, y);

      // Score percentage
      const scoreText = Math.round(values[i] * 100) + '%';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillStyle = '#D4A843';
      ctx.fillText(scoreText, x, y + 14);
      ctx.font = '500 12px Inter, sans-serif';
    }
  }

  return { draw };

})();
