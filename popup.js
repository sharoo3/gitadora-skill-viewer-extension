// popup.js - 拡張機能ポップアップのスクリプト

document.addEventListener('DOMContentLoaded', async () => {
  const generateBtn = document.getElementById('generateBtn');
  const statusDiv = document.getElementById('status');

  // 現在のマッピング状態を確認
  chrome.storage.local.get(['songMapping'], (result) => {
    if (result.songMapping) {
      const count = Object.keys(result.songMapping).length;
      statusDiv.textContent = `${count} 曲のマッピングが保存済み`;
      statusDiv.classList.add('has-mapping');
    } else {
      statusDiv.textContent = 'マッピングがありません';
    }
  });

  // マッピング生成ボタン
  generateBtn.addEventListener('click', () => {
    // 573.jpのお気に入り登録ページを開く（auto_generate=1パラメータ付き）
    chrome.tabs.create({
      url: 'https://p.eagate.573.jp/game/gfdm/gitadora_galaxywave_delta/p/setting/favorite_register.html?gtype=gf&auto_generate=1'
    });
    window.close();
  });
});
