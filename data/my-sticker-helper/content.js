(() => {
  function sanitizeFileName(name) {
    return name
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\./g, '')
      .trim();
  }

  const titleNode = document.querySelector('p.mdCMN38Item01Ttl');
  const title = titleNode ? titleNode.innerText.trim() : '無標題';
  const cleanTitle = sanitizeFileName(title);

  // 先抓 ul
  let targetNode = document.querySelector('ul.mdCMN09Ul.FnStickerList');
  let foundMode = '';

  if (targetNode) {
    foundMode = 'ul';
  } else {
    // fallback 抓 div 或其他
    targetNode = document.querySelector('div.mdCMN09Cont') || document.querySelector('div.mdCMN09Image');
    if (targetNode) {
      foundMode = 'div';
    }
  }

  if (!targetNode) {
    console.error('❌ 找不到貼圖容器節點 (ul 或 div)');
    return;
  }

  // 改成 scroll 到「上方」，不要放中間
  targetNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
  targetNode.style.outline = '6px dashed orange';

  console.log(`🖼️ 已將節點捲動置中並標記 (模式: ${foundMode})，請用 F12 → 右鍵節點 → Capture Node Screenshot`);
  console.log(`✅ 建議檔名（無副檔名）: "${cleanTitle}"`);

  // 自動複製檔名
  try {
    navigator.clipboard.writeText(cleanTitle).then(() => {
      console.log('✅ 已將建議檔名複製到剪貼簿');
    }).catch(err => {
      console.warn('⚠️ 無法自動複製，請自行複製:', cleanTitle);
    });
  } catch (err) {
    console.warn('⚠️ 無法自動複製，請自行複製:', cleanTitle);
  }
})();
