# tanu fan site

歌ライバー tanuさんとリスナーたちの物語を、森の旅になぞらえて紹介するファンサイトです。

## ページ構成

ホームページは「ホーム → プロフィール → ミュージック → 配信 → おたのしみツール → プレミアムメンバー」の1ページ構成です。おたのしみツールの各項目は別ページです。

- `index.html` : 1ページのホーム
- `news/index.html` : ニュース一覧
- `kiracome/index.html` : キラコメコピペツール（シートの最新データを自動取得）
- `journey/index.html` : 配信の軌跡
- `coming-soon/index.html` : Coming soon
- `assets/site.css` : 全ページ共通スタイル
- `assets/forest-map.svg` : ホームの古地図イラスト
- `gas/Code.gs` : スプレッドシートを読み取り専用JSONPで返すGASコード
- `.github/workflows/pages.yml` : GitHub ActionsでGitHub Pagesへ公開

## スプレッドシートとの自動同期

GitHub Pagesは静的ホスティングのため、スプレッドシートの読み取りはGoogle Apps Script（GAS）で行います。`gas/Code.gs` は既存のGAS画面を残しつつ、`?data=1` へのアクセスにはシートのA・B列を読み取り専用JSONPで返します。キラコメページを開くたびに最新データを取得します。

### GAS側の設定

1. Apps Scriptエディターで `gas/Code.gs` の内容を既存プロジェクトの `Code.gs` に反映します。既存の `Index.html` は残してください。
2. **デプロイ → デプロイを管理** からウェブアプリを編集し、新しいバージョンをデプロイします。
3. 既存の公開設定を維持してください。シート自体を公開する必要はありません。

## GitHub Pagesで公開する

公開リポジトリ `tanu-fan-site` の `main` ブランチにpushし、リポジトリの **Settings → Pages → Build and deployment → Source** で `GitHub Actions` を選択します。
