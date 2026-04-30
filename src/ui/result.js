/**
 * Result Screen - Game Over / Clear UI (DOM-based)
 * - Grade dramatic reveal with CSS animation
 * - Detailed stats breakdown
 * - Share button (html2canvas -> PNG download)
 */

/**
 * Show the result screen
 * @param {object} data - Result data from ScoreManager.getResultData()
 */
export function showResultScreen(data) {
  const resultDiv = document.getElementById('result-screen');
  const isClear = data.reason === 'clear';
  const title = isClear ? 'GAME CLEAR!' : 'GAME OVER';
  const titleColor = isClear ? '#4fc3f7' : '#ff1744';
  const grade = data.grade || 'D';
  const gradeColor = getGradeColor(grade);

  resultDiv.innerHTML = `
    <div id="result-card" class="result-card">
      <!-- Header -->
      <div class="result-header">
        <h1 class="result-title" style="color: ${titleColor}">${title}</h1>
        <p class="result-mode">${(data.mode || 'normal').toUpperCase()} MODE | STAGE ${data.stage || '?'}</p>
      </div>

      <!-- Grade -->
      <div class="result-grade-area">
        <div class="result-grade grade-reveal" style="color: ${gradeColor}; text-shadow: 0 0 30px ${gradeColor}40;">${grade}</div>
      </div>

      <!-- Score -->
      <div class="result-score-area">
        <div class="result-final-score">${(data.finalScore || data.score || 0).toLocaleString()}</div>
        <div class="result-score-label">FINAL SCORE</div>
      </div>

      <!-- Multipliers -->
      <div class="result-multipliers">
        ${data.comboMultiplier > 1 ? `<span class="mult-badge">COMBO x${data.comboMultiplier.toFixed(1)}</span>` : ''}
        ${data.accuracyMultiplier > 1 ? `<span class="mult-badge">ACC x${data.accuracyMultiplier.toFixed(1)}</span>` : ''}
        ${data.noDamageStages > 0 ? `<span class="mult-badge">NO DMG x${data.noDamageStages}</span>` : ''}
      </div>

      <!-- Stats -->
      <div class="result-stats">
        <div class="stat-row"><span class="stat-label">QTE Max Combo</span><span class="stat-value">${data.maxCombo || 0}</span></div>
        <div class="stat-row"><span class="stat-label">QTE Accuracy</span><span class="stat-value">${data.accuracy || 0}%</span></div>
        <div class="stat-row"><span class="stat-label">Great / Good / Fail</span><span class="stat-value">${data.totalGreat || 0} / ${data.totalGood || 0} / ${data.totalFail || 0}</span></div>
        <div class="stat-row"><span class="stat-label">Remaining HP</span><span class="stat-value">${data.remainingHP || 0}</span></div>
        ${data.noDamageStages > 0 ? `<div class="stat-row"><span class="stat-label">No-Damage Stages</span><span class="stat-value">${data.noDamageStages}</span></div>` : ''}
      </div>

      <!-- Score Breakdown -->
      <div class="result-breakdown">
        <div class="breakdown-row"><span>Survival</span><span>${data.survivalScore || 0}</span></div>
        <div class="breakdown-row"><span>QTE</span><span>${data.qteScore || 0}</span></div>
        <div class="breakdown-row"><span>Clear Bonus</span><span>${data.stageClearScore || 0}</span></div>
        ${data.bossKillScore > 0 ? `<div class="breakdown-row"><span>Boss Kill</span><span>${data.bossKillScore}</span></div>` : ''}
      </div>

      <!-- Buttons -->
      <div class="result-buttons">
        <button id="btn-share" class="result-btn result-btn-share">SHARE</button>
        <button id="btn-return" class="result-btn result-btn-return">RETURN</button>
      </div>

      <!-- Watermark for share image -->
      <div class="result-watermark">QTE DODGE | ${new Date().toLocaleDateString()}</div>
    </div>
  `;

  // Styles
  injectResultStyles();

  // Show
  resultDiv.style.display = 'flex';
  resultDiv.style.justifyContent = 'center';
  resultDiv.style.alignItems = 'center';

  // Button events
  document.getElementById('btn-return').addEventListener('click', () => {
    window.returnToIntro();
  });

  document.getElementById('btn-share').addEventListener('click', () => {
    captureAndDownload();
  });
}

/**
 * Grade -> color mapping
 */
function getGradeColor(grade) {
  switch (grade) {
    case 'SS': return '#ffd740';
    case 'S':  return '#ff6e40';
    case 'A':  return '#4fc3f7';
    case 'B':  return '#66bb6a';
    case 'C':  return '#9e9e9e';
    case 'D':  return '#616161';
    default:   return '#9e9e9e';
  }
}

/**
 * Capture result card as PNG and download
 */
async function captureAndDownload() {
  const card = document.getElementById('result-card');
  if (!card) return;

  try {
    // Dynamic import html2canvas from CDN
    if (!window.html2canvas) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      document.head.appendChild(script);
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
    }

    const canvas = await window.html2canvas(card, {
      backgroundColor: '#0d0d2b',
      scale: 2,
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qte-dodge-result-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  } catch (e) {
    console.warn('Share capture failed:', e);
    alert('Screenshot capture failed. Try right-clicking to save instead.');
  }
}

/**
 * Inject result screen CSS (only once)
 */
function injectResultStyles() {
  if (document.getElementById('result-styles')) return;

  const style = document.createElement('style');
  style.id = 'result-styles';
  style.textContent = `
    .result-card {
      display: flex; flex-direction: column; align-items: center;
      width: 800px; height: 600px; padding: 24px;
      background: linear-gradient(135deg, #0d0d2b 0%, #1a1a3e 50%, #0d0d2b 100%);
      border: 2px solid #2a2a5e; border-radius: 8px;
      color: #e0e0e0; font-family: monospace; position: relative; overflow: hidden;
    }
    .result-card::before {
      content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background-image: linear-gradient(rgba(42,42,94,0.2) 1px, transparent 1px),
        linear-gradient(90deg, rgba(42,42,94,0.2) 1px, transparent 1px);
      background-size: 40px 40px; pointer-events: none;
    }
    .result-header { text-align: center; z-index: 1; }
    .result-title {
      font-size: 36px; font-weight: 900; letter-spacing: 4px;
      margin: 0 0 4px 0; animation: resultTitleIn 0.6s ease-out;
    }
    .result-mode { font-size: 13px; color: #7c7caa; letter-spacing: 3px; margin: 0; }

    .result-grade-area { z-index: 1; margin: 12px 0 8px; }
    .result-grade {
      font-size: 72px; font-weight: 900; letter-spacing: 8px;
    }
    .grade-reveal { animation: gradeReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both; }

    .result-score-area { text-align: center; z-index: 1; margin-bottom: 8px; }
    .result-final-score {
      font-size: 28px; font-weight: 700; color: #ffd740;
      animation: scoreCount 0.5s ease-out 0.8s both;
    }
    .result-score-label { font-size: 11px; color: #7c7caa; letter-spacing: 4px; }

    .result-multipliers {
      display: flex; gap: 8px; z-index: 1; margin-bottom: 10px;
    }
    .mult-badge {
      padding: 3px 10px; font-size: 11px; font-weight: 700;
      border: 1px solid #ffd74060; color: #ffd740; border-radius: 3px;
      background: rgba(255,215,64,0.08);
    }

    .result-stats {
      width: 360px; z-index: 1; margin-bottom: 8px;
    }
    .stat-row {
      display: flex; justify-content: space-between; padding: 3px 0;
      font-size: 12px; border-bottom: 1px solid #2a2a4e;
    }
    .stat-label { color: #9e9eaa; }
    .stat-value { color: #e0e0e0; font-weight: 600; }

    .result-breakdown {
      width: 280px; z-index: 1; margin-bottom: 12px;
      padding: 6px 12px; background: rgba(255,255,255,0.03);
      border-radius: 4px; border: 1px solid #2a2a4e;
    }
    .breakdown-row {
      display: flex; justify-content: space-between; padding: 2px 0;
      font-size: 11px; color: #8888aa;
    }

    .result-buttons { display: flex; gap: 12px; z-index: 1; }
    .result-btn {
      padding: 10px 32px; font-size: 14px; font-weight: 700; font-family: monospace;
      border: 2px solid; border-radius: 6px; cursor: pointer;
      background: transparent; letter-spacing: 2px; transition: all 0.2s;
    }
    .result-btn:hover { transform: translateY(-2px); }
    .result-btn-share { border-color: #66bb6a; color: #66bb6a; }
    .result-btn-share:hover { background: rgba(102,187,106,0.15); box-shadow: 0 0 15px rgba(102,187,106,0.3); }
    .result-btn-return { border-color: #4fc3f7; color: #4fc3f7; }
    .result-btn-return:hover { background: rgba(79,195,247,0.15); box-shadow: 0 0 15px rgba(79,195,247,0.3); }

    .result-watermark {
      position: absolute; bottom: 8px; right: 12px;
      font-size: 9px; color: #3a3a5e; z-index: 1;
    }

    @keyframes resultTitleIn {
      0% { opacity: 0; transform: translateY(-20px) scale(0.8); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes gradeReveal {
      0% { opacity: 0; transform: scale(3) rotate(-10deg); }
      60% { opacity: 1; transform: scale(0.9) rotate(2deg); }
      100% { opacity: 1; transform: scale(1) rotate(0deg); }
    }
    @keyframes scoreCount {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}
