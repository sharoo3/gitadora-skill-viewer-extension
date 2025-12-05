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
  const autoRegister = params.get('auto_register') === '1';
  const bulkRegister = params.get('bulk_register') === '1';

  console.log('[GSV] targetSongName:', targetSongName, 'instrument:', instrument, 'autoGenerate:', autoGenerate, 'autoRegister:', autoRegister, 'bulkRegister:', bulkRegister);

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
      const row = musicCell.closest('tr');
      if (!row) continue;

      // 登録ボタンのセルを探す
      // ギターフリークス: rowspan="2"のセル（ギター行とベース行で共有）
      // ドラムマニア: 同じ行の最初のtd（rowspanなし）
      let registerCell = row.querySelector('td[rowspan="2"]');
      if (!registerCell) {
        // ドラムマニアの場合: 最初のtdが登録ボタン
        registerCell = row.querySelector('td:first-child');
      }

      // ギターフリークスの場合のベース行判定
      const bassRow = row.nextElementSibling;
      const isGuitarFreaks = row.querySelector('td[rowspan="2"]') !== null;

      // どの行をハイライトするか決定
      const targetRow = (instrument === 'B' && bassRow && isGuitarFreaks) ? bassRow : row;

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

      // 反対の行は薄いハイライト（ギターフリークスのみ）
      if (isGuitarFreaks) {
        if (instrument === 'B' && row) {
          row.querySelectorAll('td:not(.music_cell):not([rowspan])').forEach(td => {
            td.style.backgroundColor = '#f0f0f0';
          });
        } else if (instrument === 'G' && bassRow) {
          bassRow.style.backgroundColor = '#f0f0f0';
          bassRow.querySelectorAll('td').forEach(td => {
            td.style.backgroundColor = '#f0f0f0';
          });
        }
      }

      // 登録ボタンを処理
      const form = registerCell?.querySelector('form[action="favorite_set.html"]');
      const submitBtn = form?.querySelector('input[type="submit"]');
      if (submitBtn) {
        if (autoRegister) {
          // 自動登録モード: 少し待ってからボタンをクリック
          setTimeout(() => {
            console.log('[GSV] Auto-clicking register button for:', targetSongName);
            submitBtn.click();
          }, 800);
        } else {
          // 通常モード: ボタンを目立たせるだけ
          submitBtn.style.transition = 'all 0.3s';
          submitBtn.style.transform = 'scale(1.1)';
          submitBtn.style.boxShadow = '0 0 10px #FFD700';
        }
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
  // 一括登録機能
  // ========================================

  async function processBulkRegister() {
    // キューを取得
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['bulkRegisterQueue', 'bulkRegisterGtype', 'bulkRegisterIndex', 'bulkRegisterListIndex'], resolve);
    });

    const queue = result.bulkRegisterQueue;
    const gtype = result.bulkRegisterGtype;
    let index = result.bulkRegisterIndex || 0;
    const listIndex = result.bulkRegisterListIndex || '1';

    if (!queue || queue.length === 0) {
      console.log('[GSV] No bulk register queue');
      return;
    }

    const total = queue.length;
    const current = queue[index];

    // ステータスオーバーレイを表示
    const statusOverlay = createStatusOverlay();
    statusOverlay.innerHTML = `⏳ 一括登録中...<br>${index + 1}/${total}: ${current.songName}`;

    // 曲を探して登録
    const musicCells = document.querySelectorAll('.music_cell');
    let found = false;

    for (const musicCell of musicCells) {
      const titleBox = musicCell.querySelector('.title_box a');
      if (!titleBox) continue;

      const songName = titleBox.textContent.trim();
      if (songName !== current.songName) continue;

      found = true;
      const row = musicCell.closest('tr');
      if (!row) break;

      // 登録ボタンのセルを探す
      // ギターフリークス: rowspan="2"のセル
      // ドラムマニア: 同じ行の最初のtd
      let registerCell = row.querySelector('td[rowspan="2"]');
      if (!registerCell) {
        registerCell = row.querySelector('td:first-child');
      }
      const form = registerCell?.querySelector('form[action="favorite_set.html"]');
      const submitBtn = form?.querySelector('input[type="submit"]');

      if (submitBtn) {
        // インデックスを更新
        index++;
        await new Promise((resolve) => {
          chrome.storage.local.set({ bulkRegisterIndex: index }, resolve);
        });

        // 次の曲があるかチェック
        if (index < total) {
          const nextSong = queue[index];
          statusOverlay.innerHTML = `⏳ 登録中...<br>${index}/${total}: ${current.songName}<br>次: ${nextSong.songName}`;

          // フォームにhidden inputを追加して次の曲情報を渡す
          // favorite_set.html後のリダイレクト先を制御できないので、
          // 登録後に自動的に次の曲のページに遷移する
          setTimeout(() => {
            // 次の曲のURLを準備
            const nextUrl = `https://p.eagate.573.jp/game/gfdm/gitadora_galaxywave_delta/p/setting/favorite_register.html?gtype=${gtype}&cat=${nextSong.cat}&favorite_list_index=${listIndex}&scroll_to_song=${encodeURIComponent(nextSong.songName)}&instrument=${nextSong.instrument}&bulk_register=1`;

            // 現在のページURLを保存して登録ボタンをクリック
            chrome.storage.local.set({ bulkRegisterNextUrl: nextUrl }, () => {
              console.log('[GSV] Clicking register button for:', current.songName);
              submitBtn.click();
            });
          }, 500);
        } else {
          // 最後の曲
          statusOverlay.innerHTML = `⏳ 最後の曲を登録中...<br>${index}/${total}: ${current.songName}`;

          // キューをクリア
          await new Promise((resolve) => {
            chrome.storage.local.remove(['bulkRegisterQueue', 'bulkRegisterGtype', 'bulkRegisterIndex', 'bulkRegisterListIndex', 'bulkRegisterNextUrl'], resolve);
          });

          setTimeout(() => {
            console.log('[GSV] Clicking register button for last song:', current.songName);
            submitBtn.click();
          }, 500);
        }
      }
      break;
    }

    if (!found) {
      statusOverlay.innerHTML = `⚠️ 曲が見つかりません<br>${current.songName}<br><br>次の曲に進みます...`;

      // 曲が見つからない場合は次へ
      index++;
      await new Promise((resolve) => {
        chrome.storage.local.set({ bulkRegisterIndex: index }, resolve);
      });

      if (index < total) {
        const nextSong = queue[index];
        setTimeout(() => {
          const nextUrl = `https://p.eagate.573.jp/game/gfdm/gitadora_galaxywave_delta/p/setting/favorite_register.html?gtype=${gtype}&cat=${nextSong.cat}&favorite_list_index=${listIndex}&scroll_to_song=${encodeURIComponent(nextSong.songName)}&instrument=${nextSong.instrument}&bulk_register=1`;
          location.href = nextUrl;
        }, 1500);
      } else {
        // 完了
        await new Promise((resolve) => {
          chrome.storage.local.remove(['bulkRegisterQueue', 'bulkRegisterGtype', 'bulkRegisterIndex', 'bulkRegisterListIndex', 'bulkRegisterNextUrl'], resolve);
        });
        statusOverlay.innerHTML = `✅ 一括登録完了！<br>${total}曲の処理が終了しました。`;
      }
    }
  }

  // favorite_set.html後のリダイレクト処理
  async function checkBulkRegisterRedirect() {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['bulkRegisterNextUrl'], resolve);
    });

    if (result.bulkRegisterNextUrl) {
      const nextUrl = result.bulkRegisterNextUrl;
      await new Promise((resolve) => {
        chrome.storage.local.remove(['bulkRegisterNextUrl'], resolve);
      });
      console.log('[GSV] Redirecting to next song:', nextUrl);
      location.href = nextUrl;
      return true;
    }
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
    // まず一括登録のリダイレクトをチェック
    if (await checkBulkRegisterRedirect()) {
      return;
    }

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

    // 一括登録モードの場合
    if (bulkRegister && isFavoriteRegisterPage) {
      await processBulkRegister();
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
