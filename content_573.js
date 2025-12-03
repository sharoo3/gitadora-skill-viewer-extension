// content_573.js - 573.jp用スクリプト（お気に入り登録ページでスクロール＆マッピング生成）

(function() {
  console.log('[GSV] content_573.js loaded');
  console.log('[GSV] URL:', location.href);

  // お気に入り登録ページかチェック
  const isFavoriteRegisterPage = location.pathname.includes('favorite_register.html');

  // URLからパラメータを取得
  const params = new URLSearchParams(location.search);
  const targetSongName = params.get('scroll_to_song');
  const instrument = params.get('instrument') || 'G'; // G=ギター, B=ベース
  const autoGenerate = params.get('auto_generate') === '1';

  console.log('[GSV] targetSongName:', targetSongName, 'instrument:', instrument, 'autoGenerate:', autoGenerate);

  // ========================================
  // マッピング生成機能
  // ========================================

  function isLoggedIn() {
    // ログインページへのリダイレクト案内があるかチェック
    const errorText = document.body.textContent || '';
    if (errorText.includes('ログインが必要です') || errorText.includes('e-amusementへのログインが必要です')) {
      return false;
    }
    // 現在のページに曲リストがあるかチェック
    const musicCells = document.querySelectorAll('.music_cell');
    return musicCells.length > 0;
  }

  async function generateMapping(statusDiv) {
    const mapping = {};
    const baseUrl = location.origin + location.pathname;
    const gtype = params.get('gtype') || 'gf';

    // カテゴリ0〜36をループ
    for (let cat = 0; cat <= 36; cat++) {
      statusDiv.textContent = `カテゴリ ${cat}/36 をスキャン中...`;

      const url = `${baseUrl}?gtype=${gtype}&cat=${cat}&favorite_list_index=1`;

      try {
        const response = await fetch(url);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const musicCells = doc.querySelectorAll('.music_cell');

        musicCells.forEach(cell => {
          const titleBox = cell.querySelector('.title_box a');
          if (titleBox) {
            const songName = titleBox.textContent.trim();
            if (songName && !mapping[songName]) {
              mapping[songName] = String(cat);
            }
          }
        });
      } catch (e) {
        console.error(`[GSV] Failed to fetch category ${cat}:`, e);
      }

      // サーバー負荷軽減のため少し待つ
      await new Promise(r => setTimeout(r, 500));
    }

    console.log('[GSV] Total songs:', Object.keys(mapping).length);
    return mapping;
  }

  async function saveMapping(mapping) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ songMapping: mapping }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log('[GSV] Mapping saved to chrome.storage');
          resolve();
        }
      });
    });
  }

  // ========================================
  // 曲スクロール機能
  // ========================================

  function scrollToSong() {
    if (!targetSongName) return false;

    // 曲名セルを探す
    const musicCells = document.querySelectorAll('.music_cell');

    for (const musicCell of musicCells) {
      const titleBox = musicCell.querySelector('.title_box a');
      if (!titleBox) continue;

      const songName = titleBox.textContent.trim();
      if (songName !== targetSongName) continue;

      // 該当する曲を見つけた
      const guitarRow = musicCell.closest('tr');
      if (!guitarRow) continue;

      // 登録ボタンのセルを探す（rowspan="2"のセル）
      const registerCell = guitarRow.querySelector('td[rowspan="2"]');

      // ベース行は次のtr
      const bassRow = guitarRow.nextElementSibling;

      // どの行をハイライトするか決定
      const targetRow = (instrument === 'B' && bassRow) ? bassRow : guitarRow;

      // スクロール
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // ハイライト効果を追加（ギター行とベース行で色を変える）
      const highlightColor = instrument === 'B' ? '#a0ffff' : '#ffffa0';
      const fadeColor = instrument === 'B' ? '#ccffff' : '#ffffcc';

      // 難易度行をハイライト
      targetRow.style.transition = 'background-color 0.3s';
      targetRow.style.backgroundColor = highlightColor;
      // 難易度行内のセルもハイライト
      targetRow.querySelectorAll('td').forEach(td => {
        td.style.transition = 'background-color 0.3s';
        td.style.backgroundColor = highlightColor;
      });

      // 曲名セルも同じ色でハイライト
      musicCell.style.transition = 'background-color 0.3s';
      musicCell.style.backgroundColor = highlightColor;

      // 登録ボタンのセルもハイライト
      if (registerCell) {
        registerCell.style.transition = 'background-color 0.3s';
        registerCell.style.backgroundColor = highlightColor;
      }

      // 反対の行は薄いハイライト
      if (instrument === 'B' && guitarRow) {
        guitarRow.querySelectorAll('td:not(.music_cell):not([rowspan])').forEach(td => {
          td.style.backgroundColor = '#f0f0f0';
        });
      } else if (instrument === 'G' && bassRow) {
        bassRow.style.backgroundColor = '#f0f0f0';
        bassRow.querySelectorAll('td').forEach(td => {
          td.style.backgroundColor = '#f0f0f0';
        });
      }

      // 登録ボタンも目立たせる
      const form = registerCell?.querySelector('form[action="favorite_set.html"]');
      const submitBtn = form?.querySelector('input[type="submit"]');
      if (submitBtn) {
        submitBtn.style.transition = 'all 0.3s';
        submitBtn.style.transform = 'scale(1.1)';
        submitBtn.style.boxShadow = '0 0 10px #FFD700';
      }

      // 数秒後にハイライトを薄める
      setTimeout(() => {
        targetRow.style.backgroundColor = fadeColor;
        targetRow.querySelectorAll('td').forEach(td => {
          td.style.backgroundColor = fadeColor;
        });
        musicCell.style.backgroundColor = fadeColor;
        if (registerCell) {
          registerCell.style.backgroundColor = fadeColor;
        }
      }, 2000);

      console.log('[GSV] Scrolled to song:', targetSongName, 'instrument:', instrument);
      return true;
    }

    console.log('[GSV] Song not found:', targetSongName);
    return false;
  }

  // ========================================
  // 初期化
  // ========================================

  function createStatusOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'gsv-status-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      background: #333;
      color: #fff;
      padding: 15px 20px;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  async function init() {
    // 自動生成モードの場合
    if (autoGenerate && isFavoriteRegisterPage) {
      const statusOverlay = createStatusOverlay();

      // ログインチェック
      if (!isLoggedIn()) {
        console.log('[GSV] Not logged in, skipping auto-generate');
        statusOverlay.innerHTML = '⚠️ ログインが必要です<br><br>573.jpにログインしてから、<br>拡張機能メニューで再度<br>「マッピング生成」を実行してください。';
        return;
      }

      statusOverlay.textContent = '⏳ マッピング生成中...';

      try {
        const mapping = await generateMapping(statusOverlay);
        await saveMapping(mapping);
        statusOverlay.innerHTML = `✅ 完了！<br>${Object.keys(mapping).length} 曲のマッピングを保存しました。<br>このタブを閉じてOKです。`;
      } catch (e) {
        console.error('[GSV] Mapping generation failed:', e);
        statusOverlay.textContent = '❌ エラー: ' + e.message;
      }
      return;
    }

    if (targetSongName) {
      scrollToSong();
    }
  }

  // ページ読み込み完了後に実行
  if (document.readyState === 'complete') {
    setTimeout(init, 500);
  } else {
    window.addEventListener('load', () => {
      setTimeout(init, 500);
    });
  }
})();
