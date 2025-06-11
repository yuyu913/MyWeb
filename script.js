let data = {};

// 先載入 JSON 檔
fetch('data/data.json')
  .then(response => response.json())
  .then(jsonData => {
    data = jsonData;
    console.log("資料載入完成", data);
  })
  .catch(error => {
    console.error("載入資料失敗！", error);
  });

// 綁定輸入框 input 事件（邊打邊查）
document.getElementById('searchInput').addEventListener('input', function () {
  const input = document.getElementById('searchInput').value.trim().toLowerCase();
  const groupNo = null; // 目前寫死搜全部

  const foundList = search(input, groupNo);

  if (foundList.length > 0) {
    document.getElementById('result').innerHTML = foundList
      .map(item => {
        const displayClean = item.display.replace(/\.png$/i, '');
        return `結果：${displayClean} 👉 內容：「${item.keyword}」`;
      })
      .join('<br>');
  } else {
    document.getElementById('result').innerText = "❌ 找不到對應資料";
  }
});

// 搜尋函式
function search(keyword, groupNo = null) {
  let result = [];

  if (groupNo && data[groupNo]) {
    // 搜特定組
    result = data[groupNo]
      .filter(item => item.keyword.toLowerCase().includes(keyword))
      .map(item => ({
        display: `${groupNo} 的 ${item.no}`,
        keyword: item.keyword
      }));
  } else {
    // 搜全部組
    for (let group in data) {
      const found = data[group]
        .filter(item => item.keyword.toLowerCase().includes(keyword))
        .map(item => ({
          display: `${group} 的 ${item.no}`,
          keyword: item.keyword
        }));
      result = result.concat(found);
    }
  }

  return result;
}
