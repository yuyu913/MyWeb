// 設定
const weddingDateTime = new Date('2026-02-28T12:00:00+08:00');
const gmapQuery = '晶綺盛宴 台鋁館';

// 倒數
function pad(n) { return n.toString().padStart(2, '0') }
function tick() {
  const now = new Date();
  let diff = Math.max(0, weddingDateTime - now);
  const d = Math.floor(diff / (1000 * 60 * 60 * 24)); diff -= d * 24 * 60 * 60 * 1000;
  const h = Math.floor(diff / (1000 * 60 * 60)); diff -= h * 60 * 60 * 1000;
  const m = Math.floor(diff / (1000 * 60)); diff -= m * 60 * 1000;
  document.getElementById('d').textContent = pad(d);
  document.getElementById('h').textContent = pad(h);
  document.getElementById('m').textContent = pad(m);
}
setInterval(tick, 1000); tick();

// Map
document.getElementById('gmap').src = 'https://www.google.com/maps?q=' + encodeURIComponent(gmapQuery) + '&output=embed';

// Snap + Active 控制（避免滑動空白）
const container = document.getElementById('container');
const panels = Array.from(document.querySelectorAll('.panel'));
let isAnimating = false;
function nearestIndex() {
  let idx = 0, min = Infinity, top = container.scrollTop;
  panels.forEach((p, i) => { const d = Math.abs(p.offsetTop - top); if (d < min) { min = d; idx = i; } });
  return idx;
}
function setActiveByScroll() { panels.forEach((p, i) => p.classList.toggle('active', i === nearestIndex())); }
function snapTo(idx) {
  if (idx < 0 || idx >= panels.length) return;
  isAnimating = true;
  panels[idx].scrollIntoView({ behavior: 'smooth' });
  panels.forEach((p, i) => p.classList.toggle('active', i === idx));
  setTimeout(() => { isAnimating = false; }, 650);
}
container.addEventListener('scroll', () => { if (!isAnimating) setActiveByScroll(); }, { passive: true });
container.addEventListener('wheel', (e) => {
  if (isAnimating) return;
  e.preventDefault();
  const dir = Math.sign(e.deltaY);
  snapTo(nearestIndex() + (dir > 0 ? 1 : -1));
}, { passive: false });
window.addEventListener('keydown', (e) => {
  if (isAnimating) return;
  const idx = nearestIndex();
  if (['PageDown', 'ArrowDown', ' '].includes(e.key)) { e.preventDefault(); snapTo(idx + 1); }
  if (['PageUp', 'ArrowUp'].includes(e.key)) { e.preventDefault(); snapTo(idx - 1); }
});
let touchStartY = 0;
container.addEventListener('touchstart', (e) => { touchStartY = e.changedTouches[0].clientY; }, { passive: true });
container.addEventListener('touchend', (e) => {
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dy) < 40) return;
  snapTo(nearestIndex() + (dy < 0 ? 1 : -1));
});

// 縮圖輪播
const thumbs = Array.from(document.querySelectorAll('.thumb'));
const mainImg = document.getElementById('mainImg');
let cur = 0;
function show(i) {
  cur = (i + thumbs.length) % thumbs.length;
  thumbs.forEach((b, bi) => b.classList.toggle('active', bi === cur));
  const img = thumbs[cur].querySelector('img');
  mainImg.src = img.src; mainImg.alt = img.alt;
}
thumbs.forEach((b, i) => b.addEventListener('click', () => show(i)));
document.querySelector('.arrow.next').addEventListener('click', () => show(cur + 1));

// 音樂
// const music = document.getElementById('bgm');
// const musicBtn = document.querySelector('.music-toggle');
// let musicOn = false;
// async function tryPlay(){ if(musicOn) return; try{ await music.play(); musicOn=true; musicBtn.classList.add('on'); }catch(_){} }
// ['click','wheel','touchstart','keydown'].forEach(evt=>window.addEventListener(evt, tryPlay));
// musicBtn.addEventListener('click', async ()=>{ if(music.paused){ await music.play(); musicOn=true; musicBtn.classList.add('on'); } else { music.pause(); musicOn=false; musicBtn.classList.remove('on'); } });

/// ===== 音樂播放控制（行動優化） =====
const music = document.getElementById('bgm');
const musicBtn = document.querySelector('.music-toggle');

music.loop = true;

let userMuted = false;          // 使用者有沒有「主動按暫停」
let pausedByBackground = false; // 是否因為進入背景而暫停（可回前景自動續播）

function updateBtn() {
  // 不用改文字，改用 data-state 給 CSS 切圖示
  musicBtn.dataset.state = music.paused ? 'paused' : 'playing';
}

async function tryAutoplay() {
  // 只有在「沒被使用者手動暫停」且「頁面在前景」才嘗試
  if (userMuted || document.hidden) return;
  try {
    await music.play();
  } catch (e) {
    // iOS 可能擋自動播放，等互動再試
  } finally {
    updateBtn();
  }
}

// 初載入：嘗試播放一次（若被擋就等互動）
document.addEventListener('DOMContentLoaded', tryAutoplay);

// 任一次互動後再嘗試播一次（僅一次；且不覆蓋使用者的暫停意願）
['click', 'touchstart', 'keydown'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (!userMuted && music.paused) tryAutoplay();
  }, { once: true, passive: true });
});

// 進/出前景：進背景一律暫停；回前景若不是使用者手動暫停才續播
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (!music.paused) {
      music.pause();
      pausedByBackground = true;
      updateBtn();
    }
  } else {
    if (pausedByBackground && !userMuted) {
      pausedByBackground = false;
      tryAutoplay();
    }
  }
});

// 按鈕：暫停/繼續（尊重使用者意願）
musicBtn.addEventListener('click', async () => {
  if (music.paused) {
    userMuted = false;
    await music.play();
  } else {
    userMuted = true;
    music.pause();
  }
  updateBtn();
});

// 同步按鈕狀態
music.addEventListener('play', updateBtn);
music.addEventListener('pause', updateBtn);
