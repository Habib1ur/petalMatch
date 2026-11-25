export interface ResultCardOptions {
  participantName: string;
  crushName: string;
  score: number;
  message: string;
}

/**
 * Render a luxury pastel compatibility card onto an offscreen HTML5 Canvas
 * and return a PNG Blob for reliable download across desktop and mobile browsers.
 */
export async function generateResultPngBlob(
  options: ResultCardOptions
): Promise<Blob | null> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Soft pastel gradient background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#FBCFE8");
  grad.addColorStop(0.5, "#E9D5FF");
  grad.addColorStop(1, "#FFF1E6");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Inner frosted card
  const pad = 72;
  const cardX = pad;
  const cardY = pad;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;
  const radius = 44;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fillStyle = "rgba(255, 255, 255, 0.84)";
  ctx.shadowColor = "rgba(53, 40, 58, 0.10)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ctx.fill();
  ctx.restore();

  // Subtle border
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.strokeStyle = "rgba(245, 166, 200, 0.55)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Brand header
  ctx.textAlign = "center";
  ctx.fillStyle = "#D979A7";
  ctx.font = "600 26px Inter, system-ui, sans-serif";
  ctx.fillText("P E T A L M A T C H", width / 2, 180);

  ctx.fillStyle = "#8D7D8D";
  ctx.font = "400 24px Inter, system-ui, sans-serif";
  ctx.fillText("Where names meet a little magic.", width / 2, 224);

  // Names
  ctx.fillStyle = "#35283A";
  ctx.font = "600 54px Georgia, serif";
  const namesLine = `${options.participantName.toUpperCase()}  ♡  ${options.crushName.toUpperCase()}`;
  ctx.fillText(namesLine, width / 2, 360, cardW - 100);

  // Progress circle
  const cx = width / 2;
  const cy = 620;
  const r = 175;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "#FCEBF2";
  ctx.lineWidth = 24;
  ctx.stroke();

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.PI * 2 * options.score) / 100;
  const arcGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  arcGrad.addColorStop(0, "#F5A6C8");
  arcGrad.addColorStop(0.5, "#D979A7");
  arcGrad.addColorStop(1, "#C5B5F5");

  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = arcGrad;
  ctx.lineWidth = 24;
  ctx.lineCap = "round";
  ctx.stroke();

  // Score text
  ctx.fillStyle = "#35283A";
  ctx.font = "700 108px Georgia, serif";
  ctx.fillText(`${options.score}%`, cx, cy + 36);

  // Result message
  ctx.fillStyle = "#35283A";
  ctx.font = "500 38px Georgia, serif";
  wrapText(ctx, options.message, width / 2, 930, cardW - 140, 52);

  // Footer
  ctx.fillStyle = "#8D7D8D";
  ctx.font = "500 22px Inter, system-ui, sans-serif";
  ctx.fillText("Just for fun · petalmatch", width / 2, 1190);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = `${line}${words[n]} `;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = `${words[n]} `;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
}
