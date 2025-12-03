// content_573.js - 573.jp用スクリプト（お気に入り登録ページでスクロール）

(function() {
  console.log('[GSV] content_573.js loaded');
  console.log('[GSV] URL:', location.href);

  // URLからパラメータを取得
  const params = new URLSearchParams(location.search);
  const targetIndex = params.get('scroll_to_index');
  const instrument = params.get('instrument') || 'G'; // G=ギター, B=ベース

  console.log('[GSV] targetIndex:', targetIndex, 'instrument:', instrument);

  if (!targetIndex) {
    console.log('[GSV] No scroll_to_index parameter, exiting');
    return;
  }

  function scrollToSong() {
    // 該当するindexのhiddenフィールドを探す
    const forms = document.querySelectorAll('form[action="favorite_set.html"]');

    for (const form of forms) {
      const indexInput = form.querySelector('input[name="index"]');
      if (indexInput && indexInput.value === targetIndex) {
        // 該当する曲を見つけた
        // formは登録ボタンのセル内にある
        const registerCell = form.closest('td');
        if (!registerCell) continue;

        // 登録ボタンのセルはrowspan="2"なので、次の行がベース行
        const guitarRow = registerCell.closest('tr');
        if (!guitarRow) continue;

        // ベース行は次のtr（zebra_blackクラスを持つセルがある行）
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

        // 曲名セル（rowspan="2"でギター行にある）も同じ色でハイライト
        const musicCell = guitarRow.querySelector('.music_cell');
        if (musicCell) {
          musicCell.style.transition = 'background-color 0.3s';
          musicCell.style.backgroundColor = highlightColor;
        }

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
        const submitBtn = form.querySelector('input[type="submit"]');
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
          if (musicCell) {
            musicCell.style.backgroundColor = fadeColor;
          }
          if (registerCell) {
            registerCell.style.backgroundColor = fadeColor;
          }
        }, 2000);

        console.log('[GSV] Scrolled to song index:', targetIndex, 'instrument:', instrument);
        return true;
      }
    }
    return false;
  }

  // ページ読み込み完了後に実行
  if (document.readyState === 'complete') {
    setTimeout(scrollToSong, 500);
  } else {
    window.addEventListener('load', () => {
      setTimeout(scrollToSong, 500);
    });
  }
})();
