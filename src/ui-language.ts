export const uiLanguages = ["zh-CN", "en", "ja"] as const;
export type UiLanguage = typeof uiLanguages[number];

// Keys are the terminal's original labels; article content never enters this table.
const labels: Record<string, readonly [string, string]> = {
  "界面语言": ["Interface language", "表示言語"],
  "三维研究档案阵列，点击选择，左右拖动切列，上下拖动或滚轮切换列内档案": ["3D archive array: click to select, drag horizontally to change columns, drag vertically or scroll to browse archives", "3D資料配列：クリックで選択、横ドラッグで列を切り替え、縦ドラッグまたはホイールで資料を選択"],
  "系统导航": ["System navigation", "システムナビゲーション"],
  "ARCHIVE INDEX": ["ARCHIVE INDEX", "資料検索"],
  "SAVED": ["SAVED", "保存済み"],
  "查看收藏档案": ["View saved archives", "保存した資料を表示"],
  "收藏档案": ["Saved archives", "保存した資料"],
  "系统设置": ["System settings", "システム設定"],
  "设置": ["Settings", "設定"],
  "亮色": ["Light", "ライト"],
  "暗色": ["Dark", "ダーク"],
  "切换为亮色模式": ["Switch to light mode", "ライトモードに切り替え"],
  "切换为暗色模式": ["Switch to dark mode", "ダークモードに切り替え"],
  "界面配色": ["Color theme", "配色"],
  "玻璃阵列随配色逐张过渡": ["The glass array transitions one card at a time", "ガラス配列の配色が順番に切り替わります"],
  "系统启动": ["System startup", "システム起動"],
  "进入档案": ["Enter archives", "資料を開く"],
  "档案选择": ["Archive selection", "資料の選択"],
  "档案内容": ["Archive content", "資料の内容"],
  "上一个档案": ["Previous archive", "前の資料"],
  "下一个档案": ["Next archive", "次の資料"],
  "上一列": ["Previous column", "前の列"],
  "下一列": ["Next column", "次の列"],
  "切换列": ["Switch column", "列を切り替え"],
  "前后档案": ["Browse archives", "資料を選択"],
  "读取": ["Read", "開く"],
  "360° 查看文档模型": ["360° document viewer", "文書モデルを360°表示"],
  "重播启动流程": ["Replay startup", "起動演出を再生"],
  "DEPARTMENT / 科室": ["DEPARTMENT", "部門"],
  "COLLECTION / 编目范围": ["COLLECTION", "収録範囲"],
  "RELATED / 相关人物": ["RELATED PEOPLE", "関連人物"],
  "STATUS / 状态": ["STATUS", "状態"],
  "目录访问": ["Catalog access", "目録のみ"],
  "已归档 · 可读取": ["Archived · Readable", "収録済み · 閲覧可能"],
  "发布": ["Published", "公開"],
  "更新": ["Updated", "更新"],
  "概述": ["Overview", "概要"],
  "研究记录": ["Research notes", "研究記録"],
  "访问日志": ["Access log", "閲覧履歴"],
  "ARTICLE / 正文": ["ARTICLE", "本文"],
  "RESEARCH NOTES / 研究记录": ["RESEARCH NOTES", "研究記録"],
  "ACCESS LOG / 本次访问": ["ACCESS LOG / THIS SESSION", "閲覧履歴 / このセッション"],
  "本次会话已通过身份验证。档案内容以当前终端可访问范围展示。": ["This session is authorized. Archives are shown within this terminal's access scope.", "このセッションは認証済みです。端末のアクセス範囲内で資料を表示します。"],
  "正文暂未加载，请重试或直接阅读静态文章。": ["The article could not load. Retry or open the static article.", "本文を読み込めませんでした。再試行するか、静的ページを開いてください。"],
  "正在加载正文…": ["Loading article…", "本文を読み込み中…"],
  "重试加载": ["Retry loading", "読み込みを再試行"],
  "重试加载 ↻": ["Retry loading ↻", "読み込みを再試行 ↻"],
  "直接阅读文章 ↗": ["Read static article ↗", "静的ページを開く ↗"],
  "已收藏": ["Saved", "保存済み"],
  "档案已加入收藏": ["Archive saved", "資料を保存しました"],
  "已取消收藏": ["Archive removed from saved", "保存を解除しました"],
  "收藏变更仅本次会话有效，浏览器未能保存": ["Saved for this session only; browser storage is unavailable", "ブラウザーに保存できないため、このセッションでのみ有効です"],
  "设定参考 ↗": ["Reference ↗", "参考資料 ↗"],
  "原文来源 ↗": ["Original source ↗", "原文の出典 ↗"],
  "关闭窗口": ["Close window", "ウィンドウを閉じる"],
  "档案检索": ["Archive search", "資料検索"],
  "内部档案检索": ["Internal archive search", "内部資料検索"],
  "输入档案编号、名称或科室": ["Search by archive ID, title or department", "資料番号・名称・部門で検索"],
  "检索档案": ["Search archives", "資料を検索"],
  "全部档案": ["All archives", "すべての資料"],
  "FILE / 档案": ["FILE", "資料"],
  "文章排序": ["Article order", "記事の並び順"],
  "档案编号": ["Archive ID", "資料番号"],
  "最近发布": ["Recently published", "公開日の新しい順"],
  "全文检索暂不可用": ["Full-text search is unavailable", "全文検索を利用できません"],
  "检索数据未能加载，请联网重试。": ["Search data could not load. Connect and retry.", "検索データを読み込めません。接続して再試行してください。"],
  "正在加载全文检索数据…": ["Loading full-text search…", "全文検索データを読み込み中…"],
  "尚无收藏档案": ["No saved archives", "保存した資料はありません"],
  "没有匹配的档案": ["No matching archives", "一致する資料がありません"],
  "读取档案时，选择 SAVE ARCHIVE 将其保存在此处。": ["Choose SAVE ARCHIVE while reading to save an archive here.", "資料の閲覧中に SAVE ARCHIVE を選ぶと、ここに保存されます。"],
  "尝试其他名称、档案编号，或切换科室分类。": ["Try another title, archive ID or department.", "別の名称・資料番号・部門をお試しください。"],
  "查看全部档案 →": ["View all archives →", "すべての資料を表示 →"],
  "重置检索 →": ["Reset search →", "検索をリセット →"],
  "订阅博客 RSS": ["Subscribe to blog RSS", "ブログのRSSを購読"],
  "RSS 订阅 ↗": ["Subscribe to RSS ↗", "RSSを購読 ↗"],
  "终端偏好设置": ["Terminal preferences", "端末の環境設定"],
  "降低三维画质和渲染分辨率，保留完整动效；关闭后恢复原画质": ["Reduce 3D quality and resolution while retaining animation; turn off to restore quality", "動きを保ったまま3D画質と解像度を下げます。オフにすると元に戻ります"],
  "操作与启动音效": ["Interface and startup sounds", "操作音と起動音"],
  "观测室 · 背景音乐": ["Observation room · Background music", "観測室 · BGM"],
  "音效音量": ["Sound volume", "効果音の音量"],
  "音乐音量": ["Music volume", "音楽の音量"],
  "字体许可": ["Font license", "フォントライセンス"],
  "切列": ["Columns", "列を切り替え"],
  "选档": ["Archives", "資料を選択"],
  "检索": ["Search", "検索"],
  "返回": ["Back", "戻る"],
  "动效设置": ["Animation settings", "アニメーション設定"],
  "完整": ["Full", "すべて"],
  "减少": ["Reduced", "控えめ"],
  "自定义": ["Custom", "カスタム"],
  "精细设置": ["Advanced settings", "詳細設定"],
  "完整、减少或按分项自定义；关闭后会立即收束当前动画（开场设置下次重播生效）": ["Full, reduced or custom animation; changes apply immediately, except startup on replay", "全体・控えめ・個別設定から選択できます。起動演出以外はすぐに反映されます"],
  "开场 / 阵列 / 详情 / 界面 / 360° 查看器": ["Startup / Array / Detail / Interface / 360° viewer", "起動 / 配列 / 詳細 / 画面 / 360°ビューアー"],
  "开场": ["Startup", "起動"],
  "档案阵列": ["Archive array", "資料配列"],
  "档案详情": ["Archive detail", "資料詳細"],
  "界面": ["Interface", "画面"],
  "360° 查看器": ["360° viewer", "360°ビューアー"],
  "开机标志、扫描与欢迎画面": ["Startup logo, scan and welcome", "起動ロゴ・スキャン・歓迎画面"],
  "选档时向阵列传播的波浪": ["Waves across the array on selection", "選択時に配列へ広がる波"],
  "停止操作后的阵列起伏": ["Array movement while idle", "待機中の配列の動き"],
  "镜头随指针的轻微偏移": ["Subtle camera movement with the pointer", "ポインターに追従するカメラの揺れ"],
  "松手后按实际速度继续滑行": ["Continue gliding after release", "手を離した後の慣性移動"],
  "切列、切档时的轨道移动": ["Navigation between columns and archives", "列と資料を切り替える移動"],
  "抽取、转正、归位与详情镜头": ["Extraction, alignment, return and detail camera", "取り出し・正面化・復帰・詳細カメラ"],
  "模型解密线与磨砂揭示": ["Model decryption lines and frosted reveal", "モデルの復号線とすりガラスの表示"],
  "正文的遮罩揭示": ["Article reveal", "本文の表示演出"],
  "标题、分类与权限标签滚动": ["Rolling titles, categories and access labels", "タイトル・分類・権限ラベルのスクロール"],
  "序号、列编号与档案编码滚动": ["Rolling counters and archive IDs", "番号・列番号・資料番号のスクロール"],
  "详情、检索、收藏与设置窗口过渡": ["Transitions for detail, search, saved and settings", "詳細・検索・保存・設定の切り替え"],
  "360° 旋转、平移、缩放与复位阻尼": ["360° rotation, pan, zoom and reset damping", "360°回転・移動・ズーム・復帰の減衰"],
  "拆解、重组与清晰度变化": ["Explode, assemble and clarity changes", "分解・組み立て・透明度の変化"],
  "当前使用完整动画。": ["Full animation is enabled.", "すべてのアニメーションが有効です。"],
  "当前已减少动画。": ["Reduced animation is enabled.", "アニメーションを控えめにしています。"],
  "预设：完整动画 · 选择会保存在本站": ["Preset: Full animation · Saved on this site", "プリセット：すべて · このサイトに保存されます"],
  "预设：减少动画 · 选择会保存在本站": ["Preset: Reduced animation · Saved on this site", "プリセット：控えめ · このサイトに保存されます"],
  "预设：自定义 · 选择会保存在本站": ["Preset: Custom · Saved on this site", "プリセット：カスタム · このサイトに保存されます"],
  "启用完整动画并重播 ↻": ["Enable full animation and replay ↻", "すべての動きを有効にして再生 ↻"],
  "开场设置将在下次重播时生效": ["Startup settings apply on the next replay", "起動設定は次の再生時に反映されます"],
  "已启用此动画": ["Animation enabled", "アニメーションを有効にしました"],
  "已关闭此动画": ["Animation disabled", "アニメーションを無効にしました"],
  "画质设置": ["Render quality settings", "画質設定"],
  "渲染画质": ["Render quality", "描画品質"],
  "画质预设": ["Quality preset", "画質プリセット"],
  "性能": ["Performance", "パフォーマンス"],
  "高": ["High", "高"],
  "极高": ["Ultra", "最高"],
  "清晰度 / 材质 / 阴影": ["Resolution / Materials / Shadows", "解像度 / 材質 / 影"],
  "渲染比例": ["Render scale", "描画倍率"],
  "相对屏幕像素，受密度上限限制；高比例改善细线": ["Relative to screen pixels, limited by pixel density; higher values improve fine lines", "画面ピクセルに対する倍率です。密度上限内で細い線を改善します"],
  "像素密度上限": ["Pixel density limit", "ピクセル密度上限"],
  "控制高密度屏幕的原生像素倍率": ["Limit native pixel density on high-density displays", "高密度画面のピクセル倍率を制限します"],
  "抗锯齿": ["Antialiasing", "アンチエイリアス"],
  "SMAA 平滑模型边缘与后处理结果": ["SMAA smooths model edges and post-processing", "SMAAでモデルの輪郭と後処理結果を滑らかにします"],
  "原始": ["Original", "標準"],
  "纹理过滤": ["Texture filtering", "テクスチャフィルタリング"],
  "改善倾斜视角下的标签细节": ["Improve label detail at oblique angles", "斜めから見たラベルの細部を改善します"],
  "透明材质分辨率": ["Transparent material resolution", "透明材質の解像度"],
  "控制盖板折射画面的清晰度": ["Control the clarity of cover refraction", "カバーの屈折像の鮮明さを調整します"],
  "阴影分辨率 · 阵列": ["Array shadow resolution", "配列の影の解像度"],
  "更高分辨率保留更细的投影边缘": ["Higher resolution retains finer shadow edges", "解像度を上げると影の輪郭が細かくなります"],
  "关闭": ["Off", "オフ"],
  "环境遮蔽 · 阵列": ["Array ambient occlusion", "配列の環境遮蔽"],
  "采样越多，接缝暗部越细腻": ["More samples improve shading in seams", "サンプル数を増やすと継ぎ目の陰影が滑らかになります"],
  "遮蔽分辨率 · 阵列": ["Array occlusion resolution", "配列の遮蔽解像度"],
  "降低可减轻环境遮蔽的渲染负担": ["Lower values reduce ambient occlusion cost", "値を下げると環境遮蔽の描画負荷が減ります"],
  "景深强度 · 阵列": ["Array depth of field", "配列の被写界深度"],
  "0% 关闭；100% 保留原始镜头虚化": ["0% disables blur; 100% retains the original lens blur", "0%で無効、100%で元のレンズぼけを維持します"],
  "即时生效并自动保存。清晰度与材质设置同步至 360° 查看器。高渲染比例更适合静态观察；缓冲上限为 829 万像素，硬件限制时自动收敛。": ["Changes apply immediately and are saved. Resolution and materials also apply to the 360° viewer. Higher render scales suit static viewing; buffers are capped at 8.29 million pixels and adapt to hardware limits.", "変更はすぐに適用・保存され、解像度と材質は360°ビューアーにも反映されます。高倍率は静止観察向けです。バッファーは829万ピクセルを上限にハードウェアへ適応します。"],
  "进入莱茵生命档案终端": ["Enter the Rhine Lab archive terminal", "ライン生命の資料端末に入る"],
  "正在准备终端…": ["Preparing terminal…", "端末を準備中…"],
  "关闭声音并进入": ["Enter without sound", "音声なしで開始"],
  "资源就绪后即可进入": ["Enter when resources are ready", "読み込み完了後に開始できます"],
  "点击进入 →": ["Click to enter →", "クリックして開始 →"],
  "轻触屏幕或按 Enter 开始": ["Tap or press Enter to begin", "タップまたはEnterで開始"],
  "正在准备声音…": ["Preparing audio…", "音声を準備中…"],
  "准备完成后开始播放": ["Playback starts when ready", "準備完了後に再生します"],
  "重试声音并进入 →": ["Retry audio and enter →", "音声を再試行して開始 →"],
  "声音暂未就绪，请重试或无声进入": ["Audio is unavailable. Retry or enter without sound", "音声を準備できません。再試行するか、音声なしで開始してください"],
  "档案模型": ["Archive model", "資料モデル"],
  "返回档案": ["Back to archive", "資料に戻る"],
  "玻璃模式": ["Glass mode", "ガラス表示"],
  "清晰": ["Clear", "クリア"],
  "磨砂": ["Frosted", "すりガラス"],
  "模型装配结构": ["Model assembly", "モデルの組み立て構造"],
  "紧固件": ["Fasteners", "固定具"],
  "透明盖板": ["Optical cover", "透明カバー"],
  "折射环组": ["Refraction rings", "屈折リング"],
  "光学核心": ["Optical core", "光学コア"],
  "信息基板": ["Information substrate", "情報基板"],
  "背板与框架": ["Backplate and frame", "背面板とフレーム"],
  "ASSEMBLY / 装配结构": ["ASSEMBLY", "組み立て構造"],
  "正在载入模型…": ["Loading model…", "モデルを読み込み中…"],
  "重新载入 ↗": ["Reload ↗", "再読み込み ↗"],
  "模型载入失败，请重试": ["Model could not load. Please retry", "モデルを読み込めません。再試行してください"],
  "拖动旋转": ["Drag to rotate", "ドラッグで回転"],
  "↑ ↓ ← → 平移": ["↑ ↓ ← → Pan", "↑ ↓ ← → 移動"],
  "滚轮缩放": ["Scroll to zoom", "ホイールでズーム"],
  "单指旋转": ["One finger to rotate", "1本指で回転"],
  "双指缩放 / 平移": ["Two fingers to zoom / pan", "2本指でズーム / 移動"],
  "拆解档案": ["Explode archive", "資料を分解"],
  "一键重组": ["Assemble", "組み立て"],
  "复位视角": ["Reset view", "視点をリセット"],
  "已组装": ["Assembled", "組み立て済み"],
  "已拆解": ["Exploded", "分解済み"],
  "正在拆解": ["Exploding", "分解中"],
  "正在重组": ["Assembling", "組み立て中"],
  "新版本已就绪": ["An update is ready", "更新を利用できます"],
  "更新并重启 ↻": ["Update and restart ↻", "更新して再起動 ↻"],
  "主屏幕与离线使用": ["Home screen and offline use", "ホーム画面とオフライン利用"],
  "APP / 主屏幕与离线": ["APP / HOME SCREEN AND OFFLINE", "アプリ / ホーム画面とオフライン"],
  "开发预览不保存离线副本。": ["Development previews do not save offline copies.", "開発プレビューではオフラインコピーを保存しません。"],
  "使用 HTTPS 地址后可保存离线副本。": ["Use HTTPS to save an offline copy.", "HTTPSでオフラインコピーを保存できます。"],
  "当前浏览器支持在线使用。": ["This browser supports online use.", "このブラウザーではオンラインで利用できます。"],
  "离线副本未能保存，可联网后重试。": ["Could not save the offline copy. Connect and retry.", "オフラインコピーを保存できません。接続して再試行してください。"],
  "离线资源已就绪，可离线浏览档案与模型。": ["Offline resources are ready for archives and models.", "資料とモデルをオフラインで閲覧できます。"],
  "正在准备离线资源，首次需要保持联网。": ["Preparing offline resources. Stay connected on first use.", "オフラインリソースを準備中です。初回は接続を維持してください。"],
  "已从主屏幕打开。": ["Opened from the home screen.", "ホーム画面から起動しました。"],
  "在 Safari 中轻点“分享”→“添加到主屏幕”，然后从主屏幕图标打开。": ["In Safari, tap Share → Add to Home Screen, then open the home screen icon.", "Safariで共有 → ホーム画面に追加を選び、ホーム画面のアイコンから開いてください。"],
  "安装后可在独立窗口中打开档案。": ["Install to open archives in a standalone window.", "インストールすると独立したウィンドウで資料を開けます。"],
  "可通过浏览器菜单安装或添加到主屏幕。": ["Install or add to the home screen from the browser menu.", "ブラウザーのメニューからインストールするか、ホーム画面に追加できます。"],
  "安装到设备 ↗": ["Install on device ↗", "デバイスにインストール ↗"],
  "新版本已准备好": ["An update is ready", "更新を利用できます"],
  "重试保存离线资源 ↻": ["Retry saving offline resources ↻", "オフライン保存を再試行 ↻"],
  "请通过浏览器菜单添加到主屏幕": ["Use the browser menu to add to the home screen", "ブラウザーのメニューからホーム画面に追加してください"],
};

export function normalizeUiLanguage(value: unknown): UiLanguage {
  return uiLanguages.find(language => language === value) ?? "zh-CN";
}

export function translateUiText(value: string, language: UiLanguage): string {
  if (language === "zh-CN") return value;
  const text = value.trim();
  const translated = labels[text]?.[language === "en" ? 0 : 1];
  if (translated !== undefined) return value.replace(text, translated);
  const count = /^(\d+) RECORDS FOUND$/.exec(text);
  if (count) return value.replace(text, language === "en" ? `${count[1]} RECORDS FOUND` : `${count[1]} 件の資料`);
  const samples = /^(\d+) 采样$/.exec(text);
  if (samples) return value.replace(text, `${samples[1]} ${language === "en" ? "samples" : "サンプル"}`);
  if (text.startsWith("选择档案 ")) return value.replace("选择档案 ", language === "en" ? "Select archive " : "資料を選択 ");
  if (text.startsWith("导出 ")) return value.replace(/^\s*导出 (.+) 档案\s*$/, language === "en" ? "Export $1 archive" : "資料 $1 を書き出す");
  return value;
}

export function initUiLanguage() {
  let language: UiLanguage = "zh-CN";
  try { language = normalizeUiLanguage(localStorage.getItem("rhine-language")); } catch {}
  const original = new WeakMap<Node, Map<string, { source: string; translated: string }>>();
  const excluded = "script, style, template, pre, code, .blog-body, .research-notes, .blog-static article, #selected-title, #column-name, #archive-category, #hover-title, #selected-clearance, .detail-title-cn, .detail-content > h2, .metadata dd, .result-name, #viewer-file";
  function value(node: Node, key: string, current: string, write: (text: string) => void) {
    let fields = original.get(node);
    if (!fields) { fields = new Map(); original.set(node, fields); }
    const previous = fields.get(key);
    const source = previous?.translated === current ? previous.source : current;
    const translated = translateUiText(source, language);
    fields.set(key, { source, translated });
    if (current !== translated) write(translated);
  }
  function translate(node: Node) {
    if (node.parentElement?.closest(excluded)) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      value(text, "text", text.data, translated => { text.data = translated; });
    } else if (node instanceof Element) {
      if (node.matches(excluded)) return;
      for (const name of ["aria-label", "title", "placeholder"]) {
        const current = node.getAttribute(name);
        if (current) value(node, name, current, translated => node.setAttribute(name, translated));
      }
      if (node instanceof HTMLSelectElement && node.matches("[data-ui-language]")) node.value = language;
      [...node.childNodes].forEach(translate);
    }
  }
  function apply() {
    document.documentElement.lang = language;
    document.documentElement.dataset.uiLanguage = language;
    translate(document.body);
  }
  apply();
  new MutationObserver(changes => {
    for (const change of changes) {
      if (change.type === "childList") change.addedNodes.forEach(translate);
      else translate(change.target);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "title", "placeholder"] });
  document.addEventListener("change", event => {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement) || !select.matches("[data-ui-language]")) return;
    language = normalizeUiLanguage(select.value);
    try { localStorage.setItem("rhine-language", language); } catch {}
    apply();
  });
}
