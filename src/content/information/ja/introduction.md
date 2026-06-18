<div class="not-prose flex flex-col md:flex-row justify-between items-start border-b border-weak/20 pb-6 mb-8 gap-4 select-text">
  <div>
    <h1 class="text-3xl font-serif font-light mb-1">賀恋棚 (が れんほう)</h1>
    <p class="text-xs font-mono text-weak uppercase tracking-wider">// ジュニア Java バックエンドエンジニア</p>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs font-mono text-secondary">
    <div>居住地: 中国 重慶 / 年齢: 22歳</div>
    <div>WeChat: b1372998589</div>
    <div>メール: <a href="mailto:lysf15520112973@163.com" class="hover:underline">lysf15520112973@163.com</a></div>
    <div>電話: +86 15520112973</div>
    <div>GitHub: <a href="https://github.com/DavidHLP" target="_blank" class="hover:underline">github.com/DavidHLP</a></div>
    <div>ブログ: <a href="https://davidhlp.github.io/" target="_blank" class="hover:underline">davidhlp.github.io</a></div>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 01 ]</span> 実務・インターン経験

<div class="relative pl-6 border-l border-weak/10 my-4 flex flex-col gap-6">
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary">アリババクラウド · Aegis ホストセキュリティ（デリバリー開発）</div>
      <div class="text-xs font-mono text-weak">// 2026.01 - 2026.06</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase tracking-wider">バックエンド开发インターン</div>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>業務背景</strong>：プライベートクラウド環境におけるホストセキュリティ製品（Aegis）のサーバー侧R&Dに従事。クラスター側のリソース管理、AI資産識別、クエリ最適化、オンラインのトラブルシューティング等を担当。</li>
      <li><strong>クラスター側リソース連携</strong>：Platform、Cluster、ECS、BMS等の多種多様なリソースデータからGPU情報を単独で収集・集計し、上層リソースの効率的な統計、条件抽出、複雑な検索クエリをサポート。</li>
      <li><strong>AI資産識別機能</strong>：OllamaやOpenClaw等のコンテナ動作テスト環境を設計・構築。コンテナ動作状態、GPU関連、脆弱性データに基づき、AI実行環境のリスク識別およびセキュリティ表示を実装。</li>
      <li><strong>慢クエリSQL最適化</strong>：複雑なSQL実行計画の分析とインデックス調整により、統計クエリの応答速度を秒単位からミリ秒単位へと大幅に改善。</li>
      <li><strong>containerd/Harbor 障害対応</strong>：containerd 実行環境における Harbor の TLS 証明書検証障害および CA 信頼チェーンのエラーに対応。障害診断チェックリストおよびスクリプトを整備。</li>
      <li><strong>不具合解析・バグ修正</strong>：オンライン環境で Arthas 診断ツール（<code>watch</code>, <code>trace</code>, <code>stack</code>）を駆使し、呼び出しパスやスタックトレースを捕捉。20個以上のバグや不具合を単独で特定・修正。</li>
    </ul>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 02 ]</span> プロジェクト実績

<div class="relative pl-6 border-l border-weak/10 my-4 flex flex-col gap-8">
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary flex items-center gap-2">
        <span>ResiCache: キャッシュ保護ミドルウェア</span>
        <a href="https://github.com/DavidHLP/ResiCache" target="_blank" class="text-xs font-mono text-weak hover:text-primary">[GITHUB]</a>
      </div>
      <div class="text-xs font-mono text-weak">// 2025.01 - 現在</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase">技術スタック: Spring Boot 3 / Redis / Redisson / Caffeine / SPI / Micrometer</div>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>声明型キャッシュ実装</strong>：Spring AOP に基づき、<code>@RedisCacheable</code> 等のアノテーションを自作。キャッシュ読み込み、空値書き込み、事前リフレッシュ、TTLジッターなどのロジックをビジネスコードから分離。</li>
      <li><strong>責任連鎖設計</strong>：<code>CacheHandlerChain</code> により、BloomFilter、SyncLock、PreRefresh、TTLジッター等の機能を独立したハンドラーとして区分、SPIプラグインに対応。</li>
      <li><strong>キャッシュペネトレーション/アバランチ防御</strong>：JVM BitSet + Redis Pipeline による階層的ブルームフィルタでペネトレーションを防御。TTLランダムジッターと非同期事前リフレッシュでアバランチを防止。</li>
      <li><strong>ホットキー対策</strong>：ローカル JVM ロックと Redisson 分散ロックを組み合わせた二段階同期ロック制御により、ホットキー期限切れ時のデータベース負荷集中を防止。</li>
      <li><strong>可観測性とテスト</strong>：Micrometer を導入してキャッシュヒット率、遅延等の統計指標を公開。Testcontainers 技術により Docker コンテナ上で Redis 結合テストを自動化。</li>
    </ul>
  </div>
  <div class="relative select-text">
    <span class="absolute -left-[29px] top-2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary"></span>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
      <div class="font-serif font-medium text-lg text-primary flex items-center gap-2">
        <span>オンライン判定システム UltiCode</span>
        <a href="https://github.com/DavidHLP/UltiCode" target="_blank" class="text-xs font-mono text-weak hover:text-primary">[GITHUB]</a>
      </div>
      <div class="text-xs font-mono text-weak">// 2025.10 - 現在</div>
    </div>
    <div class="text-xs font-mono text-remark mb-3 uppercase">技術スタック: Spring Boot 3 / Security / Redis / JWT / MeiliSearch / Docker / Vue 3</div>
    <ul class="list-disc pl-4 text-sm text-secondary space-y-2">
      <li><strong>コード判定サンドボックス</strong>：Docker コンテナによる安全な隔離実行環境を構築。seccomp権限制限、非rootユーザー、リソース制限を適用し、ユーザーコードによる悪意ある脱出やシステム破壊を防止。</li>
      <li><strong>非同期タスク判定フロー</strong>：Redis Stream と Consumer Group を採用し、判定タスクフローを非同期化して負荷を平滑化。ハートビート監視と自動再試行を組み合わせ信頼性を確保。</li>
      <li><strong>ランキング集計の最適化</strong>：ICPC/IOI 形式のランキング集計アルゴリズムを、ループ処理から多次元集計クエリへとリファクタリングし、更新時の CPU 負荷を削減。</li>
      <li><strong>多段階キャッシュと検索</strong>：Caffeine + Redis を用いたローカル・分散型二段階キャッシュを実装。MeiliSearch を導入し、高スループットな全文検索をサポート。</li>
    </ul>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 03 ]</span> スキル要約

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 select-text">
  <div class="border border-weak/10 p-5 bg-background/50 relative">
    <span class="absolute -top-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -top-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <h3 class="text-xs font-mono text-primary uppercase mb-2">// バックエンド開発 ＆ データベース</h3>
    <ul class="list-disc pl-4 text-xs text-secondary space-y-1.5">
      <li>Java / JVM およびエンタープライズフレームワーク (Spring Boot, Security, MyBatis-Plus) に習熟。</li>
      <li>MySQL データベースの設計・最適化。スロークエリ調査、実行計画の分析、インデックスのチューニングの実務経験。</li>
      <li>Redis キャッシュ保護設計、Redisson 分散ロック、多段階キャッシュ構築の深い理解。</li>
    </ul>
  </div>
  <div class="border border-weak/10 p-5 bg-background/50 relative">
    <span class="absolute -top-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -top-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -left-1 text-[8px] font-mono text-weak/50">+</span>
    <span class="absolute -bottom-1 -right-1 text-[8px] font-mono text-weak/50">+</span>
    <h3 class="text-xs font-mono text-primary uppercase mb-2">// コンテナ ＆ トラブルシューティング</h3>
    <ul class="list-disc pl-4 text-xs text-secondary space-y-1.5">
      <li>Docker コンテナネットワーク、セキュリティ制限に習熟。containerd、Harbor、K8s イメージ TLS 証明書エラー等の対処スキル。</li>
      <li>Arthas 診断ツール (watch, trace, stack) によるメソッド遅延、エラー追跡などのオンライン診断の実務経験。</li>
      <li>Git、Maven、Flyway マイグレーション、Micrometer による可観測性構築。</li>
    </ul>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 04 ]</span> 学歴・受賞歴

<div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 select-text">
  <div class="flex flex-col gap-2">
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider">// 学歴</h3>
    <div class="border-l border-weak/20 pl-4 py-1">
      <div class="font-serif font-medium text-base text-primary">洛陽師範学院</div>
      <div class="text-xs text-secondary">データサイエンスとビッグデータ技術 · 学士課程</div>
      <div class="text-xs font-mono text-remark mt-1">GPA: 3.6 / 4.0 (2021.09 - 2026.07)</div>
    </div>
  </div>
  <div class="flex flex-col gap-2">
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider">// 受賞歴</h3>
    <div class="border-l border-weak/20 pl-4 py-1 text-xs text-secondary space-y-1.5">
      <div>🏆 全国三等賞 · <strong>2025 藍橋杯 Java ソフトウェアデザイン B グループ</strong></div>
      <div>🏆 全国三等賞 · <strong>2024 テディカップデータ分析スキルコンテスト</strong></div>
      <div>🏆 全国三等賞 · <strong>2023 全国高校コンピューター能力チャレンジコンテスト</strong></div>
    </div>
  </div>
</div>

## <span class="font-mono text-xs text-weak uppercase tracking-widest mr-2">[ SEC 05 ]</span> 価値創出

<div class="border-t border-weak/10 pt-6 mt-8 flex flex-col gap-6 select-text">
  <div>
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider mb-2">// 強み・コアスキル</h3>
    <p class="text-sm text-secondary leading-relaxed">
      プライベートクラウド環境におけるセキュリティ製品開発および実業務でのバグ修正経験を持ち、キャッシュやデータベースのパフォーマンス改善に強みがあります。トラブルシューティング手法を診断チェックリストや検証自動化スクリプトとしてドキュメント化し、チームの開発効率向上に貢献できます。可観測性（Observability）とコンテナセキュリティへの関心が高く、2つのプロジェクトをフルスクラッチで実装しました。
    </p>
  </div>
  <div>
    <h3 class="text-xs font-mono text-weak uppercase tracking-wider mb-2">// 自己PR</h3>
    <p class="text-sm text-secondary leading-relaxed font-light">
      Java バックエンド開発およびシステムの可用性向上に注力し、クリーンでモジュール化された凝集度の高いコードの執筆を徹底しています。インターン業務および個人プロジェクトを通じて、リアルタイムなモニタリングとトラブルシューティング能力を磨いてきました。複雑なビジネスドメインおよび大規模システムに挑戦し、高可用かつ高性能なシステム基盤構築に貢献したいと考えています。
    </p>
  </div>
</div>