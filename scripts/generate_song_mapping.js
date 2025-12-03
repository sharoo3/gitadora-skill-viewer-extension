// generate_song_mapping.js
// 573.jpのお気に入り登録ページで実行して、曲名→cat/indexのマッピングを生成するスクリプト
//
// 使い方:
// 1. https://p.eagate.573.jp/game/gfdm/gitadora_galaxywave_delta/p/setting/favorite_register.html にログイン
// 2. 開発者ツール（F12）のコンソールで以下を実行
// 3. 生成されたJSONファイルがダウンロードされる

(async function() {
  const mapping = {};

  // カテゴリ0〜36をループ
  for (let cat = 0; cat <= 36; cat++) {
    console.log(`Fetching category ${cat}...`);

    const url = `https://p.eagate.573.jp/game/gfdm/gitadora_galaxywave_delta/p/setting/favorite_register.html?gtype=gf&cat=${cat}&favorite_list_index=1`;

    const response = await fetch(url);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const forms = doc.querySelectorAll('form[action="favorite_set.html"]');

    forms.forEach(form => {
      const indexInput = form.querySelector('input[name="index"]');
      const row = form.closest('tr');

      if (indexInput && row) {
        const titleBox = row.querySelector('.title_box a');
        if (titleBox) {
          const songName = titleBox.textContent.trim();
          const index = indexInput.value;

          if (songName && !mapping[songName]) {
            mapping[songName] = { index, cat: String(cat) };
          }
        }
      }
    });

    // サーバー負荷軽減のため少し待つ
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('Total songs:', Object.keys(mapping).length);

  // JSONファイルとしてダウンロード
  const blob = new Blob([JSON.stringify(mapping, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'song_mapping.json';
  a.click();
  URL.revokeObjectURL(url);

  console.log('Done! song_mapping.json downloaded.');
})();
