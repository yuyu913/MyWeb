let data = {};

// 先載入 JSON
fetch('./data/data.json')
  .then(response => response.json())
  .then(jsonData => {
    data = jsonData;
    console.log("資料載入完成", data);
  })
  .catch(error => {
    console.error("載入資料失敗！", error);
  });

// 綁定搜尋 input
document.getElementById('searchInput').addEventListener('input', function () {
  const input = document.getElementById('searchInput').value.trim().toLowerCase();
  const groupNo = null; // 搜全部

  const foundList = search(input, groupNo);

  if (foundList.length > 0) {
    document.getElementById('result').innerHTML = foundList
      .map(item => {
        const displayClean = item.display.replace(/\.png$/i, '');
        const imgPath = `./data/OK/${displayClean}.png`; // 圖片路徑
        const no = item.no;

        return `
          <span class="result-item" 
                data-img="${imgPath}" 
                data-no="${no}" 
                onmouseover="showPreview(this)" 
                onmouseout="hidePreview()">
            結果：${displayClean} 的 ${no} 👉 內容：「${item.keyword}」
          </span>
        `;
      })
      .join('<br>');
  } else {
    document.getElementById('result').innerText = "❌ 找不到對應資料";
  }
});

// 搜尋 function
function search(keyword, groupNo = null) {
  let result = [];

  if (groupNo && data[groupNo]) {
    result = data[groupNo]
      .filter(item => item.keyword.toLowerCase().includes(keyword))
      .map(item => ({
        display: `${groupNo}`,
        no: item.no,
        keyword: item.keyword
      }));
  } else {
    for (let group in data) {
      const found = data[group]
        .filter(item => item.keyword.toLowerCase().includes(keyword))
        .map(item => ({
          display: `${group}`,
          no: item.no,
          keyword: item.keyword
        }));
      result = result.concat(found);
    }
  }

  return result;
}

// hover 顯示預覽
function showPreview(element) {
  const imgPath = element.getAttribute('data-img');
  const no = parseInt(element.getAttribute('data-no'), 10);

  const preview = document.getElementById('hoverPreview');

  const cellSize = 100; // 一格大小 px
  const columns = 4;

  const column = (no - 1) % columns;
  const row = Math.floor((no - 1) / columns);

  const posX = -column * cellSize;
  const posY = -row * cellSize;

  preview.style.backgroundImage = `url('${imgPath}')`;
  preview.style.backgroundPosition = `${posX}px ${posY}px`;
  preview.style.display = 'block';
}

// hover 離開
function hidePreview() {
  const preview = document.getElementById('hoverPreview');
  preview.style.display = 'none';
}
