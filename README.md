# tanu fan site

歌ライバー tanuさんとリスナーたちの物語を、森の旅になぞらえて紹介するファンサイトです。

## ページ構成

ホームページは「ホーム → プロフィール → ミュージック → 配信 → おたのしみツール → プレミアムメンバー」の1ページ構成です。
おたのしみツールの各項目は別ページです。

- `index.html` : 1ページのホーム
- `news/index.html` : ニュース一覧
- `kiracome/index.html` : キラコメコピペツール（シートの最新データを自動取得）
- `journey/index.html` : 配信の軌跡
- `coming-soon/index.html` : Coming soon
- `assets/site.css` : 全ページ共通スタイル
- `assets/forest-map.svg` : ホームの古地図イラスト
- `gas/Code.gs` : スプレッドシートを読み取り専用JSONPで返すGASコード
- `.github/workflows/pages.yml` : GitHub ActionsでGitHub Pagesへ公開
