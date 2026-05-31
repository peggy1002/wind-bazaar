// 宣告一個變數，用來存放所有 JSON 檔案合併後的總資料
let gameDatabase = [];

// 精確定義 14 個分類與其對應的 JSON 檔案對照表
const categoryMapping = {
    '農作物': 'crops.json',
    '料理': 'recipes.json',
    '人物資料': 'npcs.json',
    '風車加工品': 'Windmillitems.json',
    '動物': 'animals.json',
    '昆蟲': 'insects.json',
    '釣魚': 'fishing.json',
    '市集捐贈': 'donation.json',
    '人物委託、事件': 'npcevents.json',
    '開店條件': 'shop.json', 
    '商店商品': 'shop_items.json',
    '養蜂、養菇': 'beemushroom.json',
    '採摘物': 'pickeditems.json',
    '花': 'flowers.json'
};

// 從對照表中取出所有的 JSON 檔名陣列
const jsonFiles = Object.values(categoryMapping);

// 當網頁一打開時，同時去讀取這 14 個檔案
window.onload = function() {
    const fetchTasks = jsonFiles.map(fileName => 
        fetch(`data/${fileName}`).then(response => {
            if (!response.ok) {
                throw new Error(`找不到檔案: data/${fileName}`);
            }
            return response.json().then(data => {
                // 在讀取資料時，自動幫每一筆資料加上一個「來源分類」的標記
                // 這樣就算你的 JSON 裡面原本沒有寫 "類別": "農作物"，網頁也能辨認！
                const categoryKey = Object.keys(categoryMapping).find(key => categoryMapping[key] === fileName);
                return data.map(item => {
                    if (!item.類別) {
                        item.類別 = categoryKey; 
                    }
                    return item;
                });
            });
        })
    );

    Promise.all(fetchTasks)
        .then(allDataArrays => {
            gameDatabase = allDataArrays.flat();
            console.log("14個分類資料庫全部載入成功！目前總共包含 " + gameDatabase.length + " 筆資料。");
        })
        .catch(error => {
            console.error("載入資料庫失敗，請檢查 data/ 資料夾內的檔名是否正確！", error);
            alert("資料載入失敗，詳細原因請按 F12 查看 Console。");
        });
};

// 綁定「搜尋按鈕」與 Enter 鍵
document.getElementById('searchBtn').addEventListener('click', performSearch);
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') { performSearch(); }
});

// 全自動大範圍搜尋功能
function performSearch() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    const container = document.getElementById('resultContainer');
    
    if (keyword === "") {
        container.innerHTML = '<p class="notice">請輸入要搜尋的關鍵字！</p>';
        return;
    }

    const matchedResults = gameDatabase.filter(item => {
        return Object.values(item).some(value => {
            if (value === null || value === undefined) return false;
            return value.toString().toLowerCase().includes(keyword);
        });
    });

    renderResults(matchedResults);
}

// 分類按鈕點擊篩選功能
function filterCategory(categoryName) {
    if (categoryName === '全部') {
        renderResults(gameDatabase);
        return;
    }
    // 篩選出標記與按鈕名稱相符的資料
    const matchedResults = gameDatabase.filter(item => item.類別 === categoryName);
    renderResults(matchedResults);
}

// 自動將結果生成精美網頁卡片的「超級萬用版」功能
function renderResults(results) {
    const container = document.getElementById('resultContainer');
    container.innerHTML = ""; // 先清空舊畫面

    if (results.length === 0) {
        container.innerHTML = '<p class="notice">找不到相關項目。</p>';
        return;
    }

    results.forEach(item => {
        const card = document.createElement('div');
        card.className = 'result-card';

        // --- 【大腦升級：萬用標題抓取邏輯】 ---
        // 1. 我們先找出這一筆資料裡面，所有欄位的名字（Keys）
        const allKeys = Object.keys(item);
        
        // 2. 排除掉我們自動加上的「類別」標籤
        const validKeys = allKeys.filter(k => k !== '類別');
        
        // 3. 直接拿這筆資料的「第一個欄位的值」來當作卡片的大標題！
        // 舉例：如果料理檔第一欄是 "成品": "香草沙拉"，大標題就是香草沙拉
        const firstKey = validKeys[0];
        const titleName = item[firstKey] || '未命名項目';
        
        const categoryName = item.類別 || '未知分類';

        // 4. 自動遍歷所有欄位（排除掉已經當作大標題的第一個欄位）
        let detailHtml = '<div class="info-grid">';
        for (const key in item) {
            if (key !== '類別' && key !== firstKey && item[key]) {
                detailHtml += `
                    <div class="info-item">
                        <span class="info-label">${key}：</span>${item[key]}
                    </div>
                `;
            }
        }
        detailHtml += '</div>';

        // 5. 組合輸出
        card.innerHTML = `
            <h3>${titleName} <span style="font-size:12px; color:#888;">[${categoryName}]</span></h3>
            ${detailHtml}
        `;
        container.appendChild(card);
    });
}