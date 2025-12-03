# GSV Skill Graph

GITADORA Skill Viewer (gsv.fun) の機能を拡張するChrome拡張機能です。

## 機能

### 1. スキル履歴グラフ表示
プレイヤーページのスキル履歴テーブルの横に、スキル推移のグラフを表示します。

- Canvas APIによるグラフ描画
- スキル帯ごとの色分け（虹、金、銀、銅、赤グラ、赤、紫グラ、紫、青グラ、青、緑グラ、緑、黄グラ、黄、橙グラ、橙、白）
- グラデーション帯は上から下へのグラデーション表示
- ホバーで日付とスキル値を表示
- 最新スキル値と前回からの差分を表示

### 2. お気に入り登録ボタン
稼ぎ曲ページ（/kasegi/）の曲名横に★ボタンを追加します。

- クリックでGITADORA公式サイト（573.jp）のお気に入り登録ページを開く
- 該当カテゴリが自動で選択される
- 該当曲まで自動スクロール
- ギター（-G）は黄色、ベース（-B）は水色でハイライト
- 登録ボタンが強調表示される

## インストール

1. このリポジトリをクローンまたはダウンロード
2. Chromeで `chrome://extensions/` を開く
3. 「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. ダウンロードしたフォルダを選択

## 対応サイト

- https://gsv.fun/* - スキルグラフ、お気に入りボタン
- https://p.eagate.573.jp/game/gfdm/*/p/setting/* - 自動スクロール＆ハイライト

## ファイル構成

```
GSV/
├── manifest.json       # 拡張機能の設定
├── content.js          # gsv.fun用スクリプト
├── content_573.js      # 573.jp用スクリプト
├── song_mapping.json   # 曲名→カテゴリ/インデックスのマッピング
├── scripts/
│   └── generate_song_mapping.js  # マッピング生成スクリプト
└── README.md
```

## 付録: song_mapping.json の更新

新曲が追加された場合など、`song_mapping.json` を更新する必要がある場合は、以下の手順で再生成できます。

1. https://p.eagate.573.jp/game/gfdm/gitadora_galaxywave_delta/p/setting/favorite_register.html にログイン
2. 開発者ツール（F12）を開き、コンソールタブを選択
3. `scripts/generate_song_mapping.js` の内容をコピーして貼り付け、実行
4. 全カテゴリ（0〜36）を自動でスキャンし、完了後に `song_mapping.json` がダウンロードされる
5. ダウンロードしたファイルで既存の `song_mapping.json` を置き換える

※ スキャンには約20秒かかります（サーバー負荷軽減のため各カテゴリ間で500ms待機）

## ライセンス

MIT
