// content.js - 外部ライブラリ不要版（ライトモード）

(function() {
  let lastUrl = location.href;

  function findHistoryTable() {
    const tables = document.querySelectorAll('table');
    for (const t of tables) {
      const caption = t.querySelector('caption');
      if (caption && caption.textContent.includes('スキル履歴')) {
        return t;
      }
    }
    return null;
  }

  function initChart() {
    // 既にグラフが追加されている場合はスキップ
    if (document.querySelector('.gsv-skill-graph')) return;

    const historyTable = findHistoryTable();
    if (!historyTable) return;

    const rows = historyTable.querySelectorAll('tbody tr');
    const data = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const skill = parseFloat(cells[1]?.textContent?.trim());
        const date = cells[2]?.textContent?.trim();
        if (!isNaN(skill) && date) data.push({ date, skill });
      }
    });

    if (data.length === 0) return;

    data.sort((a, b) => new Date(a.date.replace(/\//g, '-')) - new Date(b.date.replace(/\//g, '-')));

    // スキル値に応じた色を返す関数
    const getSkillColor = (skill) => {
      if (skill >= 8500) return { color: 'url(#rainbow)', isGradient: true, name: '虹', gradColors: null };
      if (skill >= 8000) return { color: '#FFD700', isGradient: false, name: '金', gradColors: null };
      if (skill >= 7500) return { color: '#C0C0C0', isGradient: false, name: '銀', gradColors: null };
      if (skill >= 7000) return { color: '#CD7F32', isGradient: false, name: '銅', gradColors: null };
      if (skill >= 6500) return { color: '#ff4444', isGradient: true, name: '赤グラ', gradColors: ['#ff4444', '#FFFFFF'] };
      if (skill >= 6000) return { color: '#ff4444', isGradient: false, name: '赤', gradColors: null };
      if (skill >= 5500) return { color: '#9932CC', isGradient: true, name: '紫グラ', gradColors: ['#9932CC', '#FFFFFF'] };
      if (skill >= 5000) return { color: '#9932CC', isGradient: false, name: '紫', gradColors: null };
      if (skill >= 4500) return { color: '#4169E1', isGradient: true, name: '青グラ', gradColors: ['#4169E1', '#FFFFFF'] };
      if (skill >= 4000) return { color: '#4169E1', isGradient: false, name: '青', gradColors: null };
      if (skill >= 3500) return { color: '#32CD32', isGradient: true, name: '緑グラ', gradColors: ['#32CD32', '#FFFFFF'] };
      if (skill >= 3000) return { color: '#32CD32', isGradient: false, name: '緑', gradColors: null };
      if (skill >= 2500) return { color: '#FFD700', isGradient: true, name: '黄グラ', gradColors: ['#FFD700', '#FFFFFF'] };
      if (skill >= 2000) return { color: '#FFD700', isGradient: false, name: '黄', gradColors: null };
      if (skill >= 1500) return { color: '#FFA500', isGradient: true, name: '橙グラ', gradColors: ['#FFA500', '#FFFFFF'] };
      if (skill >= 1000) return { color: '#FFA500', isGradient: false, name: '橙', gradColors: null };
      return { color: '#888888', isGradient: false, name: '白', gradColors: null };
    };

    // 日付をミリ秒に変換する関数
    const dateToMs = (dateStr) => new Date(dateStr.replace(/\//g, '-')).getTime();

    // 期間を設定（データが1ヶ月以上あれば全期間、なければ1ヶ月固定）
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oldestDataDate = new Date(data[0].date.replace(/\//g, '-'));

    // データが1ヶ月より古い場合は全期間表示、そうでなければ1ヶ月固定
    const startDate = oldestDataDate < oneMonthAgo ? oldestDataDate : oneMonthAgo;
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    // 全データを使用
    const displayData = data;

    // 同じ日のデータをグループ化（1日に複数更新対応）
    const groupedByDate = {};
    displayData.forEach(d => {
      const dateOnly = d.date.split(' ')[0]; // 日付部分のみ
      if (!groupedByDate[dateOnly]) {
        groupedByDate[dateOnly] = [];
      }
      groupedByDate[dateOnly].push(d);
    });

    // ラッパー作成（テーブルとグラフを横並びに）
    const wrapper = document.createElement('div');
    wrapper.className = 'gsv-skill-graph';
    wrapper.style.cssText = `
      display: flex; align-items: flex-start; gap: 10px;
      max-width: 1200px; margin: 0 auto;
    `;

    // テーブルをラッパー内に移動
    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = 'flex-shrink: 0;';

    // キャプションの高さを取得
    const caption = historyTable.querySelector('caption');
    const captionHeight = caption ? caption.offsetHeight : 0;

    // 最新データと前回データを取得
    const latestData = displayData[displayData.length - 1];
    const prevData = displayData.length > 1 ? displayData[displayData.length - 2] : null;
    const latestSkillColor = getSkillColor(latestData.skill);
    const diff = prevData ? latestData.skill - prevData.skill : 0;
    const diffStr = diff > 0 ? `+${diff.toLocaleString()}` : diff < 0 ? diff.toLocaleString() : '±0';
    const diffColor = diff > 0 ? '#e74c3c' : diff < 0 ? '#3498db' : '#888';

    // グラフ全体のラッパー（最新情報 + グラフコンテナ）
    const graphWrapper = document.createElement('div');
    graphWrapper.style.cssText = `
      margin-top: ${captionHeight}px;
    `;

    // 最新スキル値表示（グラフの上）
    const latestInfo = document.createElement('div');
    const isRainbow = latestSkillColor.color === 'url(#rainbow)';
    const hasGradColors = latestSkillColor.gradColors !== null;
    const latestColorHex = isRainbow ? '#ff6b6b' : latestSkillColor.color;

    if (isRainbow) {
      // 虹色ボーダー用のスタイル
      latestInfo.style.cssText = `
        font-size: 14px; padding: 15px 20px;
        background: #000;
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 10px;
        width: 480px;
        box-sizing: content-box;
        border: 3px solid transparent;
        border-image: linear-gradient(135deg, #f22 10%, #f2f 20%, #22f 35%, #2ff 50%, #2f2 65%, #ff2 80%) 1;
      `;
    } else if (hasGradColors) {
      // グラデーション帯のボーダー
      latestInfo.style.cssText = `
        font-size: 14px; padding: 15px 20px;
        background: #000;
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 10px;
        width: 480px;
        box-sizing: content-box;
        border: 2px solid transparent;
        border-image: linear-gradient(to bottom, ${latestSkillColor.gradColors[0]}, ${latestSkillColor.gradColors[1]}) 1;
      `;
    } else {
      latestInfo.style.cssText = `
        font-size: 14px; padding: 15px 20px;
        background: #000;
        border: 2px solid ${latestColorHex};
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 10px;
        width: 480px;
        box-sizing: content-box;
      `;
    }

    // テキスト用のスタイル
    let skillValueStyle;
    if (isRainbow) {
      skillValueStyle = 'font-weight: bold; font-size: 28px; background: linear-gradient(135deg, #f22 10%, #f2f 20%, #22f 35%, #2ff 50%, #2f2 65%, #ff2 80%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;';
    } else if (hasGradColors) {
      skillValueStyle = `font-weight: bold; font-size: 28px; background: linear-gradient(to bottom, ${latestSkillColor.gradColors[0]}, ${latestSkillColor.gradColors[1]}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;`;
    } else {
      skillValueStyle = `color: ${latestColorHex}; font-weight: bold; font-size: 28px;`;
    }

    latestInfo.innerHTML = `
      <span style="${skillValueStyle}">
        ${latestData.skill.toLocaleString()}
      </span>
      <span style="color: #aaa;">
        ${latestData.date}
        <span style="color: ${diffColor}; margin-left: 10px; font-size: 14px;">${diffStr}</span>
      </span>
    `;
    graphWrapper.appendChild(latestInfo);

    // グラフコンテナ作成
    const container = document.createElement('div');
    container.style.cssText = `
      width: 500px; padding: 5px;
      background: #000000; position: relative;
      box-sizing: content-box;
    `;
    graphWrapper.appendChild(container);

    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = 500;
    const canvasHeight = 300;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.cssText = `width: ${canvasWidth}px; height: ${canvasHeight}px;`;
    container.appendChild(canvas);

    // ツールチップ用要素
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: absolute; display: none; padding: 8px 12px;
      background: #333; color: #fff; border-radius: 6px;
      font-size: 12px; pointer-events: none; z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      white-space: nowrap;
    `;
    container.appendChild(tooltip);

    // DOM構築
    historyTable.parentNode.insertBefore(wrapper, historyTable);
    tableContainer.appendChild(historyTable);
    wrapper.appendChild(tableContainer);
    wrapper.appendChild(graphWrapper);

    // 描画
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = canvasWidth, H = canvasHeight;
    const pad = { top: 10, right: 10, bottom: 25, left: 50 };
    const gW = W - pad.left - pad.right;
    const gH = H - pad.top - pad.bottom;

    const values = displayData.map(d => d.skill);
    const minV = 0;
    const maxV = values.length > 0 ? Math.ceil(Math.max(...values) / 500) * 500 : 5000;

    // X座標は時間ベースで計算（3ヶ月分固定）
    const toX = (dateStr) => {
      const ms = dateToMs(dateStr);
      const ratio = (ms - startMs) / (endMs - startMs);
      return pad.left + ratio * gW;
    };
    const toY = v => pad.top + gH - ((v - minV) / (maxV - minV || 1)) * gH;

    // 背景 - スキル帯ごとに色分け
    const skillBands = [
      { min: 8500, max: Infinity, color: '#ff6b6b' },  // 虹
      { min: 8000, max: 8500, color: '#FFD700' },      // 金
      { min: 7500, max: 8000, color: '#C0C0C0' },      // 銀
      { min: 7000, max: 7500, color: '#CD7F32' },      // 銅
      { min: 6500, max: 7000, color: '#ff4444' },      // 赤グラ
      { min: 6000, max: 6500, color: '#ff4444' },      // 赤
      { min: 5500, max: 6000, color: '#9932CC' },      // 紫グラ
      { min: 5000, max: 5500, color: '#9932CC' },      // 紫
      { min: 4500, max: 5000, color: '#4169E1' },      // 青グラ
      { min: 4000, max: 4500, color: '#4169E1' },      // 青
      { min: 3500, max: 4000, color: '#32CD32' },      // 緑グラ
      { min: 3000, max: 3500, color: '#32CD32' },      // 緑
      { min: 2500, max: 3000, color: '#FFD700' },      // 黄グラ
      { min: 2000, max: 2500, color: '#FFD700' },      // 黄
      { min: 1500, max: 2000, color: '#FFA500' },      // 橙グラ
      { min: 1000, max: 1500, color: '#FFA500' },      // 橙
      { min: 0, max: 1000, color: '#888888' },         // 白
    ];

    // まず全体を黒で塗る
    ctx.fillStyle = '#000000';
    ctx.fillRect(pad.left, pad.top, gW, gH);

    // スキル帯ごとに背景を描画
    skillBands.forEach(band => {
      const bandTop = Math.max(band.min, minV);
      const bandBottom = Math.min(band.max, maxV);

      if (bandTop < maxV && bandBottom > minV) {
        const y1 = toY(Math.min(bandBottom, maxV));
        const y2 = toY(Math.max(bandTop, minV));
        ctx.fillStyle = band.color + '20'; // 12% opacity
        ctx.fillRect(pad.left, y1, gW, y2 - y1);
      }
    });

    // グリッド線（横）
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    for (let v = minV; v <= maxV; v += 500) {
      const y = toY(v);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
    }

    // 月の区切り線（縦）- 全期間に対応
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([4, 4]);
    const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1); // 最初の月初め
    let currentMonth = new Date(monthStart);
    while (currentMonth <= endDate) {
      const x = pad.left + ((currentMonth.getTime() - startMs) / (endMs - startMs)) * gW;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + gH);
      ctx.stroke();
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }
    ctx.setLineDash([]);

    // Y軸ラベル
    ctx.fillStyle = '#ccc';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    for (let v = minV; v <= maxV; v += 500) {
      ctx.fillText(v.toLocaleString(), pad.left - 5, toY(v) + 4);
    }

    // 期間表示
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    const startLabel = `${startDate.getFullYear()}/${startDate.getMonth() + 1}/${startDate.getDate()}`;
    const endLabel = `${endDate.getFullYear()}/${endDate.getMonth() + 1}/${endDate.getDate()}`;
    ctx.textAlign = 'left';
    ctx.fillText(startLabel, pad.left, H - 5);
    ctx.textAlign = 'right';
    ctx.fillText(endLabel, W - pad.right, H - 5);

    // 折れ線 - 灰色で統一
    if (displayData.length > 0) {
      ctx.beginPath();
      ctx.moveTo(toX(displayData[0].date), toY(displayData[0].skill));
      displayData.forEach(d => ctx.lineTo(toX(d.date), toY(d.skill)));
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // ポイント（スキル値に応じた色）
    const pointPositions = [];
    const dates = Object.keys(groupedByDate);
    dates.forEach(date => {
      const group = groupedByDate[date];
      group.forEach((d, idx) => {
        const x = toX(d.date);
        const y = toY(d.skill);
        const isMultiple = group.length > 1;
        const skillColor = getSkillColor(d.skill);

        pointPositions.push({ x, y, data: d, isFirst: idx === 0, isLast: idx === group.length - 1, isMultiple, skillColor });

        ctx.beginPath();
        ctx.arc(x, y, isMultiple ? 6 : 5, 0, Math.PI * 2);

        // 虹色の場合は特別処理
        if (skillColor.color === 'url(#rainbow)') {
          const rainbowGrad = ctx.createLinearGradient(x - 5, y - 5, x + 5, y + 5);
          rainbowGrad.addColorStop(0.1, '#f22');
          rainbowGrad.addColorStop(0.2, '#f2f');
          rainbowGrad.addColorStop(0.35, '#22f');
          rainbowGrad.addColorStop(0.5, '#2ff');
          rainbowGrad.addColorStop(0.65, '#2f2');
          rainbowGrad.addColorStop(0.8, '#ff2');
          ctx.fillStyle = rainbowGrad;
        } else if (skillColor.gradColors) {
          // グラデーション帯の場合（上から下へ）
          const grad = ctx.createLinearGradient(x, y - 5, x, y + 5);
          grad.addColorStop(0, skillColor.gradColors[0]);
          grad.addColorStop(1, skillColor.gradColors[1]);
          if (isMultiple && idx !== group.length - 1) {
            ctx.globalAlpha = 0.5;
          }
          ctx.fillStyle = grad;
        } else if (isMultiple && idx !== group.length - 1) {
          // 同日の古いデータは薄くする
          ctx.fillStyle = skillColor.color + '80';
        } else {
          ctx.fillStyle = skillColor.color;
        }
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });

    // ホバー時のツールチップ
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvasWidth / rect.width);
      const my = (e.clientY - rect.top) * (canvasHeight / rect.height);

      let found = null;
      for (const p of pointPositions) {
        const dist = Math.sqrt((mx - p.x) ** 2 + (my - p.y) ** 2);
        if (dist < 15) {
          found = p;
          break;
        }
      }

      if (found) {
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 30) + 'px';
        const colorName = found.skillColor.name;
        const colorHex = found.skillColor.color === 'url(#rainbow)' ? '#ff6b6b' : found.skillColor.color;
        tooltip.innerHTML = `<strong>${found.data.date}</strong><br>スキル: ${found.data.skill.toLocaleString()} <span style="color:${colorHex}">(${colorName})</span>`;
      } else {
        tooltip.style.display = 'none';
      }
    });

    canvas.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });

    console.log(`[GSV] Chart rendered: ${displayData.length} points (${dates.length} days)`);
  }

  // debounce用タイマー
  let debounceTimer = null;

  function tryInitChart() {
    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      initChart();
    }, 300);
  }

  // 初回チェック
  setTimeout(initChart, 500);

  // MutationObserverでDOMの変更を監視
  const observer = new MutationObserver(() => {
    // URLが変わったらリセット
    if (location.href !== lastUrl) {
      lastUrl = location.href;
    }
    tryInitChart();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // SPAのナビゲーション対応（pushState/replaceState）
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    setTimeout(tryInitChart, 100);
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    setTimeout(tryInitChart, 100);
  };

  window.addEventListener('popstate', () => {
    setTimeout(tryInitChart, 100);
  });

  // ========================================
  // お気に入り登録ボタン機能（kasegiページ用）
  // ========================================

  let songMapping = null;

  async function loadSongMapping() {
    if (songMapping) return songMapping;
    try {
      // chrome.storageから読み込み
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['songMapping'], resolve);
      });
      if (result.songMapping) {
        songMapping = result.songMapping;
        console.log('[GSV] Song mapping loaded from storage:', Object.keys(songMapping).length, 'songs');
        return songMapping;
      } else {
        console.log('[GSV] No song mapping in storage. Please generate it from 573.jp favorite page.');
        return null;
      }
    } catch (e) {
      console.error('[GSV] Failed to load song mapping:', e);
      return null;
    }
  }

  function isKasegiPage() {
    return location.pathname.includes('/kasegi/');
  }

  function isSkillSheetPage() {
    // スキルシートページ: /ja/galaxywave_delta/1599/g or /d
    // ReactTableがなく、skill-table-hot/otherがある場合
    return /\/[a-z]{2}\/[^/]+\/\d+\/[gd]$/.test(location.pathname);
  }

  function hasSkillTables() {
    // スキルシートページの判定（通常のHTMLテーブル）
    return document.querySelector('#skill-table-hot') || document.querySelector('#skill-table-other');
  }

  function getGameType() {
    // URLからgtype判定
    // kasegiページ: /kasegi/g/ or /kasegi/d/
    if (location.pathname.includes('/kasegi/g/')) return 'gf';
    if (location.pathname.includes('/kasegi/d/')) return 'dm';
    // スキルシートページ: 末尾が /g or /d
    if (location.pathname.endsWith('/g')) return 'gf';
    if (location.pathname.endsWith('/d')) return 'dm';
    return '';
  }

  function getInstrumentFromPath() {
    // スキルシートページの場合、URLの末尾から楽器を判定
    if (location.pathname.endsWith('/g')) return 'G';
    if (location.pathname.endsWith('/d')) return 'G'; // ドラムの場合もデフォルトはG（ギターパート）
    return 'G';
  }

  // ページから曲リストを収集する関数
  function collectSongsFromPage(mapping) {
    const songs = [];

    if (isKasegiPage()) {
      // kasegiページ: ReactTable
      const rows = document.querySelectorAll('.ReactTable .rt-tr-group .rt-tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('.rt-td');
        if (cells.length < 3) return;

        const songNameCell = cells[1];
        const levelCell = cells[2];

        if (!songNameCell) return;

        const songName = songNameCell.textContent.trim();
        if (!songName) return;

        const cat = mapping[songName];
        if (cat === undefined) return;

        const levelText = levelCell?.textContent?.trim() || '';
        const instrument = levelText.endsWith('-B') ? 'B' : 'G';

        songs.push({ songName, cat, instrument });
      });
    } else if (isSkillSheetPage() && hasSkillTables()) {
      // スキルシートページ: 通常のHTMLテーブル
      const tables = document.querySelectorAll('#skill-table-hot tbody tr, #skill-table-other tbody tr');
      tables.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return;

        // 2番目のセルが曲名、3番目がレベル
        const songNameCell = cells[1];
        const levelCell = cells[2];

        if (!songNameCell) return;

        const songName = songNameCell.textContent.trim();
        if (!songName) return;

        const cat = mapping[songName];
        if (cat === undefined) return;

        // レベル情報から楽器を取得（例: "6.70 EXT-G" → G, "6.40 EXT-B" → B）
        const levelText = levelCell?.textContent?.trim() || '';
        const instrument = levelText.endsWith('-B') ? 'B' : 'G';

        songs.push({ songName, cat, instrument });
      });
    }

    return songs;
  }

  // 全曲登録ボタンを追加
  async function initBulkRegisterButton() {
    if (!isKasegiPage() && !isSkillSheetPage()) return;
    if (document.querySelector('.gsv-bulk-register-btn')) return;

    const mapping = await loadSongMapping();
    if (!mapping) return;

    // 挿入先の要素を探す
    let insertTarget = null;
    if (isKasegiPage()) {
      insertTarget = document.querySelector('.ReactTable');
    } else if (isSkillSheetPage()) {
      insertTarget = document.querySelector('#skill-table-hot');
    }
    if (!insertTarget) return;

    // ボタンコンテナ作成
    const btnContainer = document.createElement('div');
    btnContainer.className = 'gsv-bulk-register-container';
    btnContainer.style.cssText = `
      margin-bottom: 10px;
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    // お気に入りリスト選択ドロップダウン
    const listSelect = document.createElement('select');
    listSelect.className = 'gsv-favorite-list-select';
    listSelect.style.cssText = `
      padding: 8px 12px;
      font-size: 14px;
      border: 1px solid #ccc;
      border-radius: 5px;
      background: #fff;
      cursor: pointer;
    `;
    listSelect.innerHTML = `
      <option value="1">リスト1</option>
      <option value="2">リスト2</option>
      <option value="3">リスト3</option>
    `;

    // 保存されたリスト番号を読み込み
    chrome.storage.local.get(['favoriteListIndex'], (result) => {
      if (result.favoriteListIndex) {
        listSelect.value = result.favoriteListIndex;
      }
    });

    // リスト変更時に保存
    listSelect.addEventListener('change', () => {
      chrome.storage.local.set({ favoriteListIndex: listSelect.value });
    });

    // 全曲登録ボタン
    const bulkBtn = document.createElement('button');
    bulkBtn.className = 'gsv-bulk-register-btn';
    bulkBtn.textContent = '★ 全曲お気に入り登録';
    bulkBtn.style.cssText = `
      background: #FFD700;
      border: none;
      color: #000;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      padding: 8px 16px;
      border-radius: 5px;
      transition: all 0.2s;
    `;

    bulkBtn.addEventListener('mouseenter', () => {
      bulkBtn.style.background = '#FFC000';
    });
    bulkBtn.addEventListener('mouseleave', () => {
      bulkBtn.style.background = '#FFD700';
    });

    bulkBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      // 現在のページの全曲を収集
      const songs = collectSongsFromPage(mapping);

      if (songs.length === 0) {
        alert('登録可能な曲がありません');
        return;
      }

      const favoriteListIndex = listSelect.value;
      if (!confirm(`${songs.length}曲をリスト${favoriteListIndex}に登録します。よろしいですか？`)) {
        return;
      }

      // 登録キューをchrome.storageに保存
      const gtype = getGameType();
      await new Promise((resolve) => {
        chrome.storage.local.set({
          bulkRegisterQueue: songs,
          bulkRegisterGtype: gtype,
          bulkRegisterIndex: 0,
          bulkRegisterListIndex: favoriteListIndex
        }, resolve);
      });

      // 最初の曲の登録ページを開く
      const firstSong = songs[0];
      const encodedSongName = encodeURIComponent(firstSong.songName);
      const url = `https://p.eagate.573.jp/game/gfdm/gitadora_galaxywave_delta/p/setting/favorite_register.html?gtype=${gtype}&cat=${firstSong.cat}&favorite_list_index=${favoriteListIndex}&scroll_to_song=${encodedSongName}&instrument=${firstSong.instrument}&bulk_register=1`;
      window.open(url, '_blank');
    });

    btnContainer.appendChild(listSelect);
    btnContainer.appendChild(bulkBtn);
    insertTarget.parentNode.insertBefore(btnContainer, insertTarget);
    console.log('[GSV] Bulk register button initialized');
  }

  // 選択されたお気に入りリスト番号を取得
  async function getFavoriteListIndex() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['favoriteListIndex'], (result) => {
        resolve(result.favoriteListIndex || '1');
      });
    });
  }

  // ★ボタンを作成する共通関数
  function createFavoriteButton(songName, cat, instrument) {
    const btn = document.createElement('button');
    btn.className = 'gsv-fav-btn';
    btn.textContent = '★';
    btn.title = 'お気に入り登録';
    btn.style.cssText = `
      background: transparent;
      border: 1px solid #FFD700;
      color: #FFD700;
      cursor: pointer;
      font-size: 12px;
      padding: 1px 4px;
      border-radius: 3px;
      transition: all 0.2s;
      line-height: 1;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#FFD700';
      btn.style.color = '#000';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
      btn.style.color = '#FFD700';
    });

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const gtype = getGameType();
      const favoriteListIndex = await getFavoriteListIndex();
      const encodedSongName = encodeURIComponent(songName);
      const url = `https://p.eagate.573.jp/game/gfdm/gitadora_galaxywave_delta/p/setting/favorite_register.html?gtype=${gtype}&cat=${cat}&favorite_list_index=${favoriteListIndex}&scroll_to_song=${encodedSongName}&instrument=${instrument}&auto_register=1`;
      window.open(url, '_blank');
    });

    return btn;
  }

  async function initFavoriteButtons() {
    if (!isKasegiPage() && !isSkillSheetPage()) return;
    if (document.querySelector('.gsv-fav-btn')) return;

    const mapping = await loadSongMapping();
    if (!mapping) return;

    // 全曲登録ボタンも初期化
    initBulkRegisterButton();

    if (isKasegiPage()) {
      // kasegiページ: ReactTable
      const rows = document.querySelectorAll('.ReactTable .rt-tr-group .rt-tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('.rt-td');
        if (cells.length < 3) return;

        const songNameCell = cells[1];
        const levelCell = cells[2];

        if (!songNameCell) return;

        const songName = songNameCell.textContent.trim();
        if (!songName) return;

        const cat = mapping[songName];
        if (cat === undefined) return;

        if (row.querySelector('.gsv-fav-btn')) return;

        const levelText = levelCell?.textContent?.trim() || '';
        const instrument = levelText.endsWith('-B') ? 'B' : 'G';

        // ★ボタン用のセルを作成
        const btnCell = document.createElement('div');
        btnCell.className = 'rt-td gsv-fav-cell';
        btnCell.style.cssText = `
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 24 0 auto;
          width: 24px;
          max-width: 24px;
          height: 34px;
          max-height: 34px;
          padding: 0;
          box-sizing: border-box;
        `;

        const btn = createFavoriteButton(songName, cat, instrument);
        btnCell.appendChild(btn);
        row.appendChild(btnCell);
      });
    } else if (isSkillSheetPage() && hasSkillTables()) {
      // スキルシートページ: 通常のHTMLテーブル
      const rows = document.querySelectorAll('#skill-table-hot tbody tr, #skill-table-other tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return;

        const songNameCell = cells[1];
        const levelCell = cells[2];

        if (!songNameCell) return;

        const songName = songNameCell.textContent.trim();
        if (!songName) return;

        const cat = mapping[songName];
        if (cat === undefined) return;

        if (row.querySelector('.gsv-fav-btn')) return;

        const levelText = levelCell?.textContent?.trim() || '';
        const instrument = levelText.endsWith('-B') ? 'B' : 'G';

        // ★ボタン用のセルを作成（通常のtd）
        const btnCell = document.createElement('td');
        btnCell.className = 'gsv-fav-cell';
        btnCell.style.cssText = `
          text-align: center;
          padding: 2px 4px;
        `;

        const btn = createFavoriteButton(songName, cat, instrument);
        btnCell.appendChild(btn);
        row.appendChild(btnCell);
      });
    }

    console.log('[GSV] Favorite buttons initialized');
  }

  // お気に入りボタンの初期化（debounce付き）
  let favDebounceTimer = null;
  function tryInitFavoriteButtons() {
    if (favDebounceTimer) return;
    favDebounceTimer = setTimeout(() => {
      favDebounceTimer = null;
      initFavoriteButtons();
    }, 300);
  }

  // 初回チェック
  setTimeout(initFavoriteButtons, 500);

  // MutationObserverの更新（お気に入りボタンも監視）
  const favObserver = new MutationObserver(() => {
    tryInitFavoriteButtons();
  });

  favObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
