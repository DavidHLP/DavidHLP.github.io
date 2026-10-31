import { languageUrl } from "./content-language.ts";
import contentLabels from "../content/locales.json" with { type: "json" };

export const uiLanguages = ["zh-CN", "en", "ja"] as const;
export type UiLanguage = typeof uiLanguages[number];

// Keys are the terminal's original labels; article content never enters this table.
const labels: Record<string, readonly [string, string, string?]> = {
  "全窗口阅读": ["Full-window reading", "全画面で読む"],
  "全窗口阅读 ↗": ["Read full window ↗", "全画面で読む ↗"],
  "退出全窗口阅读 · Esc": ["Exit full-window reading · Esc", "全画面表示を終了 · Esc"],
  "RHINE LAB / SYSTEM PREFERENCES": ["RHINE LAB / SYSTEM PREFERENCES", "RHINE LAB / システム設定", "RHINE LAB / 系统偏好"],
  "RHINE LAB / ARCHIVE DIRECTORY": ["RHINE LAB / ARCHIVE DIRECTORY", "RHINE LAB / 資料目録", "RHINE LAB / 档案目录"],
  "SAVED ARCHIVES": ["SAVED ARCHIVES", "保存した資料", "收藏档案"],
  "ACCESS": ["ACCESS", "アクセス", "访问权限"],
  "CONNECTED": ["CONNECTED", "接続済み", "已连接"],
  "ACCESS PERMISSION REQUIRED": ["ACCESS PERMISSION REQUIRED", "アクセス許可が必要です", "需要访问权限"],
  "ID CONFIRMED : JOYCE MOORE": ["ID CONFIRMED : JOYCE MOORE", "本人確認済み : JOYCE MOORE", "身份已确认 : JOYCE MOORE"],
  "REQUEST RECEIVED": ["REQUEST RECEIVED", "リクエスト受信済み", "请求已接收"],
  "START PROCESSING...": ["START PROCESSING...", "処理を開始…", "开始处理…"],
  "SING...": ["SING...", "…", "…"],
  "PERMISSION AUTHORIZED": ["PERMISSION AUTHORIZED", "アクセス許可済み", "权限验证通过"],
  "WELCOME TO": ["WELCOME TO", "ようこそ", "欢迎访问"],
  "POWERED BY": ["POWERED BY", "提供", "技术支持"],
  "POWERED BY RHINE LAB": ["POWERED BY RHINE LAB", "提供 RHINE LAB", "技术支持 RHINE LAB"],
  "INTERNAL DATABASE / READY": ["INTERNAL DATABASE / READY", "内部データベース / 準備完了", "内部数据库 / 就绪"],
  "CONNECTING TO INTERNAL DATABASE": ["CONNECTING TO INTERNAL DATABASE", "内部データベースに接続中", "正在连接内部数据库"],
  "SELECTING FILES...": ["SELECTING FILES...", "資料を選択中…", "正在选择档案…"],
  "CONFIDENTIALITY:": ["CONFIDENTIALITY:", "機密区分:", "保密级别:"],
  "GENERAL BUSINESS USE": ["GENERAL BUSINESS USE", "一般業務用", "一般业务使用"],
  "BOOT SEQUENCE": ["BOOT SEQUENCE", "起動演出", "启动流程"],
  "SELECTION WAVE": ["SELECTION WAVE", "選択時の波", "选档波浪"],
  "IDLE MOTION": ["IDLE MOTION", "待機中の動き", "待机起伏"],
  "POINTER PARALLAX": ["POINTER PARALLAX", "ポインター視差", "指针视差"],
  "DRAG MOMENTUM": ["DRAG MOMENTUM", "ドラッグの慣性", "拖动惯性"],
  "SELECTION TRANSITION": ["SELECTION TRANSITION", "選択の切り替え", "选档过渡"],
  "DETAIL TRANSITION": ["DETAIL TRANSITION", "詳細の切り替え", "详情过渡"],
  "MODEL DECRYPTION": ["MODEL DECRYPTION", "モデルの復号", "模型解密"],
  "DOCUMENT REVEAL": ["DOCUMENT REVEAL", "本文の表示", "正文揭示"],
  "ROLLING TEXT": ["ROLLING TEXT", "文字スクロール", "文字滚动"],
  "ROLLING NUMBERS": ["ROLLING NUMBERS", "数字スクロール", "数字滚动"],
  "SURFACE TRANSITIONS": ["SURFACE TRANSITIONS", "画面の切り替え", "界面过渡"],
  "VIEWER NAVIGATION": ["VIEWER NAVIGATION", "ビューアーの操作", "查看器导航"],
  "VIEWER MODEL TRANSITION": ["VIEWER MODEL TRANSITION", "ビューアーモデルの切り替え", "查看器模型过渡"],
  "RHINE LAB / OBJECT STUDY": ["RHINE LAB / OBJECT STUDY", "RHINE LAB / モデル観察", "RHINE LAB / 模型观察"],
  "FASTENERS": ["FASTENERS", "固定具", "紧固件"],
  "OPTICAL COVER": ["OPTICAL COVER", "透明カバー", "透明盖板"],
  "REFRACTIVE RINGS": ["REFRACTIVE RINGS", "屈折リング", "折射环组"],
  "OPTICAL CORE": ["OPTICAL CORE", "光学コア", "光学核心"],
  "SUBSTRATE": ["SUBSTRATE", "情報基板", "信息基板"],
  "CARRIER": ["CARRIER", "背面板とフレーム", "背板与框架"],
  "档案三维模型：拖动旋转，方向键平移，滚轮或加减键缩放，Home 复位": ["3D archive model: drag to rotate, arrow keys to pan, scroll or +/- to zoom, Home to reset", "3D資料モデル：ドラッグで回転、矢印キーで移動、ホイールまたは+/-でズーム、Homeでリセット"],
  "请使用浏览器的全屏快捷键 F11": ["Use the browser's F11 shortcut for fullscreen", "ブラウザーのF11キーで全画面表示にしてください"],
  "CONNECTION INTERRUPTED": ["CONNECTION INTERRUPTED", "接続が中断されました", "连接中断"],
  "交互资源未能载入，可重新连接或直接阅读文章。": ["Interactive resources could not load. Reconnect or read the static article.", "操作用リソースを読み込めません。再接続するか、静的な記事を開いてください。"],
  "直接阅读文章 →": ["Read static article →", "静的な記事を開く →"],
  "RECONNECT →": ["RECONNECT →", "再接続 →", "重新连接 →"],
  "返回交互界面 ↗": ["Back to interactive view ↗", "インタラクティブ画面に戻る ↗"],
  "404 / 页面不存在": ["404 / Page not found", "404 / ページが見つかりません"],
  "返回档案阵列 →": ["Back to archive array →", "資料配列に戻る →"],
  "自定义壁纸无法读取，请在 Wallpaper Engine 属性中重新选择图片。": ["Could not read the custom wallpaper. Select the image again in Wallpaper Engine properties.", "壁紙画像を読み込めません。Wallpaper Engineのプロパティで画像を選び直してください。"],
  "波纹接力": ["Ripple relay", "波紋リレー"],
  "RIPPLE RELAY": ["RIPPLE RELAY", "波紋リレー", "波纹接力"],
  "再玩一次": ["Play again", "もう一度遊ぶ"],
  "结束游戏": ["End game", "ゲームを終了"],
  "接住波纹": ["Catch the ripple", "波紋を受け取る"],
  "点击抬起的档案，接住下一道波纹": ["Click the raised archive to catch the next ripple", "浮き上がった資料をクリックして次の波紋を受け取ります"],
  "这一侧没有可接力的档案，请退出后移动阵列再试": ["No archive is available on this side. Exit, move the array and retry", "この側に資料がありません。終了して配列を移動し、再試行してください"],
  "这道波纹停下了": ["The ripple stopped", "波紋が止まりました"],
  "接力结束": ["Relay finished", "リレー終了"],
  "已暂停": ["Paused", "一時停止中"],
  "3D 载入中…": ["Loading 3D…", "3Dを読み込み中…"],
  "3D 关闭中…": ["Closing 3D…", "3Dを終了中…"],
  "3D 关闭": ["3D off", "3Dオフ"],
  "3D 开启": ["3D on", "3Dオン"],
  "重新载入三维模型": ["Reload 3D models", "3Dモデルを再読み込み"],
  "取消关闭，恢复三维画面": ["Cancel closing and restore 3D", "終了を取り消して3Dを復元"],
  "卸载三维模型，保留 2D 界面": ["Unload 3D models and keep the 2D interface", "3Dモデルを解放して2D画面を維持"],
  "三维模型载入失败，请点击 3D 关闭重试。": ["3D models could not load. Click 3D off to retry.", "3Dモデルを読み込めません。3Dオフをクリックして再試行してください。"],
  "DESKTOP CONTROLS": ["DESKTOP CONTROLS", "デスクトップ操作", "桌面操作"],
  "拖动阵列或点击界面按钮浏览档案。桌面模式下，方向键与滚轮可能无法传入壁纸。": ["Drag the array or use the buttons to browse. Desktop mode may not receive arrow keys or scrolling.", "配列をドラッグするかボタンで資料を選択します。デスクトップでは矢印キーやホイールが届かない場合があります。"],
  "每次启动都会读取 Wallpaper Engine 中的设置。在此修改仅对当前运行生效，无法持久保存；如需保留，请在 Wallpaper Engine 的壁纸属性中调整。": ["Wallpaper Engine settings load on startup. Changes here last only for this run; use wallpaper properties to save them.", "起動時にWallpaper Engineの設定を読み込みます。ここでの変更は今回のみ有効です。保存するには壁紙のプロパティを変更してください。"],
  "界面语言": ["Interface language", "表示言語"],
  "三维研究档案阵列，点击选择，左右拖动切列，上下拖动或滚轮切换列内档案": ["3D archive array: click to select, drag horizontally to change columns, drag vertically or scroll to browse archives", "3D資料配列：クリックで選択、横ドラッグで列を切り替え、縦ドラッグまたはホイールで資料を選択"],
  "系统导航": ["System navigation", "システムナビゲーション"],
  "ARCHIVE INDEX": ["ARCHIVE INDEX", "資料検索"],
  "SAVED": ["SAVED", "保存済み"],
  "ENTER SYSTEM": ["ENTER SYSTEM", "システムへ"],
  "FILE NUMBER:": ["FILE NUMBER:", "資料番号:"],
  "ACCESS FILE": ["ACCESS FILE", "資料を開く"],
  "ARCHIVE / SELECT": ["ARCHIVE / SELECT", "資料 / 選択"],
  "COLUMN": ["COLUMN", "列"],
  "ARCHIVE OVERVIEW": ["ARCHIVE OVERVIEW", "資料一覧"],
  "DRAG TO INSPECT": ["DRAG TO INSPECT", "ドラッグで確認"],
  "REINITIALIZE ↗": ["REINITIALIZE ↗", "再起動 ↗"],
  "CLOSE": ["CLOSE", "閉じる"],
  "INTERNAL DATABASE": ["INTERNAL DATABASE", "内部データベース"],
  "READ AUTHORIZED": ["READ AUTHORIZED", "閲覧許可"],
  "− REMOVE FROM SAVED": ["− REMOVE FROM SAVED", "− 保存を解除"],
  "＋ SAVE ARCHIVE": ["＋ SAVE ARCHIVE", "＋ 資料を保存"],
  "EXPORT": ["EXPORT", "書き出す"],
  "SESSION AUTHORIZED": ["SESSION AUTHORIZED", "認証済みセッション"],
  "SYSTEM SETTINGS": ["SYSTEM SETTINGS", "システム設定"],
  "SUPER PERFORMANCE": ["SUPER PERFORMANCE", "高速モード"],
  "INTERFACE SOUND": ["INTERFACE SOUND", "操作音"],
  "BACKGROUND MUSIC": ["BACKGROUND MUSIC", "背景音楽"],
  "ANIMATION CONTROLS": ["ANIMATION CONTROLS", "アニメーション設定"],
  "RENDER QUALITY": ["RENDER QUALITY", "描画品質"],
  "KEYBOARD CONTROLS": ["KEYBOARD CONTROLS", "キーボード操作"],
  "FULLSCREEN": ["FULLSCREEN", "全画面表示"],
  "REINITIALIZE SYSTEM": ["REINITIALIZE SYSTEM", "システムを再起動"],
  "SEARCH UNAVAILABLE": ["SEARCH UNAVAILABLE", "検索を利用できません"],
  "LOADING SEARCH": ["LOADING SEARCH", "検索を読み込み中"],
  "CATALOG ONLY": ["CATALOG ONLY", "目録のみ"],
  "AUTHORIZED": ["AUTHORIZED", "許可済み"],
  "ANALYSIS OS / 1.0 · 使用 MiSans 字体（小米）": ["ANALYSIS OS / 1.0 · MiSans font by Xiaomi", "ANALYSIS OS / 1.0 · MiSansフォント（Xiaomi）"],
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
  "DEPARTMENT / 科室": ["DEPARTMENT", "部門", "科室"],
  "COLLECTION / 编目范围": ["COLLECTION", "収録範囲", "编目范围"],
  "RELATED / 相关人物": ["RELATED PEOPLE", "関連人物", "相关人物"],
  "STATUS / 状态": ["STATUS", "状態", "状态"],
  "目录访问": ["Catalog access", "目録のみ"],
  "已归档 · 可读取": ["Archived · Readable", "収録済み · 閲覧可能"],
  "发布": ["Published", "公開"],
  "更新": ["Updated", "更新"],
  "概述": ["Overview", "概要"],
  "研究记录": ["Research notes", "研究記録"],
  "访问日志": ["Access log", "閲覧履歴"],
  "ARTICLE / 正文": ["ARTICLE", "本文", "正文"],
  "RESEARCH NOTES / 研究记录": ["RESEARCH NOTES", "研究記録", "研究记录"],
  "ACCESS LOG / 本次访问": ["ACCESS LOG / THIS SESSION", "閲覧履歴 / このセッション", "访问日志 / 本次访问"],
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
  "设定参考": ["Reference", "参考資料"],
  "原文来源 ↗": ["Original source ↗", "原文の出典 ↗"],
  "原文来源": ["Original source", "原文の出典"],
  "关闭窗口": ["Close window", "ウィンドウを閉じる"],
  "档案检索": ["Archive search", "資料検索"],
  "内部档案检索": ["Internal archive search", "内部資料検索"],
  "输入档案编号、名称或科室": ["Search by archive ID, title or department", "資料番号・名称・部門で検索"],
  "检索档案": ["Search archives", "資料を検索"],
  "全部档案": ["All archives", "すべての資料"],
  "FILE / 档案": ["FILE", "資料", "档案"],
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
  "拆解、重组与清晰度变化": ["Explode, assemble and clarity changes", "分解・組み立て・鮮明さの変化"],
  "当前使用完整动画。": ["Full animation is enabled.", "すべてのアニメーションが有効です。"],
  "当前已减少动画。": ["Reduced animation is enabled.", "アニメーションを控えめにしています。"],
  "开场已跳过": ["Startup skipped", "起動演出を省略"],
  "阵列波动已关闭": ["Array waves disabled", "配列の揺れを無効化"],
  "文字滚动已关闭": ["Rolling text disabled", "文字スクロールを無効化"],
  "3D 已关闭 · 三维模型与渲染资源已释放": ["3D is off · Models and rendering resources released", "3Dはオフ · モデルと描画リソースを解放済み"],
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

const chineseLabels: Record<string, string> = {
  "ARCHIVE INDEX": "档案检索", "SAVED": "收藏", "ENTER SYSTEM": "进入系统",
  "FILE NUMBER:": "档案编号:", "ACCESS FILE": "读取档案", "ARCHIVE / SELECT": "档案 / 选择",
  "COLUMN": "列", "ARCHIVE OVERVIEW": "档案总览", "DRAG TO INSPECT": "拖动查看",
  "REINITIALIZE ↗": "重新启动 ↗", "CLOSE": "关闭", "INTERNAL DATABASE": "内部数据库",
  "READ AUTHORIZED": "读取已授权", "− REMOVE FROM SAVED": "− 取消收藏", "＋ SAVE ARCHIVE": "＋ 收藏档案",
  "EXPORT": "导出", "SESSION AUTHORIZED": "会话已授权", "SYSTEM SETTINGS": "系统设置",
  "SUPER PERFORMANCE": "超级性能模式", "INTERFACE SOUND": "界面音效", "BACKGROUND MUSIC": "背景音乐",
  "ANIMATION CONTROLS": "动效控制", "RENDER QUALITY": "渲染画质", "KEYBOARD CONTROLS": "键盘操作",
  "FULLSCREEN": "全屏", "REINITIALIZE SYSTEM": "重新启动系统", "SEARCH UNAVAILABLE": "检索不可用",
  "LOADING SEARCH": "检索加载中", "CATALOG ONLY": "仅目录", "AUTHORIZED": "已授权",
};

export function normalizeUiLanguage(value: unknown): UiLanguage {
  return uiLanguages.find(language => language === value) ?? "zh-CN";
}

export function translatedBootText(value: string, phrase: string, language: UiLanguage) {
  const translated = translateUiText(phrase, language);
  return translated === phrase ? value : translated.slice(0, Math.ceil(value.length / phrase.length * translated.length));
}

export function translateUiText(value: string, language: UiLanguage): string {
  const text = value.trim();
  const translated = (language === "zh-CN" ? labels[text]?.[2] ?? chineseLabels[text] : labels[text]?.[language === "en" ? 0 : 1]) ?? (contentLabels[language] as Record<string, string>)[text];
  if (translated !== undefined) return value.replace(text, translated);
  const count = /^(\d+) RECORDS FOUND$/.exec(text);
  if (count) return value.replace(text, language === "zh-CN" ? `找到 ${count[1]} 份档案` : language === "en" ? `${count[1]} RECORDS FOUND` : `${count[1]} 件の資料`);
  const prefixed = /^([/／]\s+)(.+)$/.exec(text);
  if (prefixed) return value.replace(text, prefixed[1] + translateUiText(prefixed[2], language));
  const modelFile = /^FILE (X-\d+)( \/ INTERNAL DATABASE)?$/.exec(text);
  if (modelFile) return value.replace(text, language === "zh-CN" ? `档案 ${modelFile[1]}${modelFile[2] ? " / 内部数据库" : ""}` : language === "ja" ? `資料 ${modelFile[1]}${modelFile[2] ? " / 内部データベース" : ""}` : text);
  if (language === "zh-CN") return value;
  if (text.startsWith("点击切换")) return value.replace(text, language === "en" ? `Click to change ${translateUiText(text.slice(4), language)}` : `${translateUiText(text.slice(4), language)}をクリックして切り替え`);
  const wallpaperQuality = "即时生效，仅限当前运行；长期设置请在 Wallpaper Engine 中调整。";
  if (text.startsWith(wallpaperQuality)) return value.replace(text, (language === "en" ? "Changes apply to this run only; save permanent settings in Wallpaper Engine. " : "変更は今回のみ有効です。保存するにはWallpaper Engineで設定してください。") + translateUiText(text.replace(wallpaperQuality, "即时生效并自动保存。"), language));
  const samples = /^(\d+) 采样$/.exec(text);
  if (samples) return value.replace(text, `${samples[1]} ${language === "en" ? "samples" : "サンプル"}`);
  const motion = /^当前使用自定义动画（(.+)）。$/.exec(text);
  if (motion) {
    const detail = motion[1].split("、").map(part => {
      const enabled = /^启用 (\d+) 项$/.exec(part);
      return enabled ? (language === "en" ? `${enabled[1]} enabled` : `${enabled[1]}項目が有効`) : translateUiText(part, language);
    }).join(language === "en" ? ", " : "、");
    return value.replace(text, language === "en" ? `Custom animation (${detail}).` : `カスタムアニメーション（${detail}）。`);
  }
  const quality = /^(超级性能模式已启用 · 画质设置暂被覆盖，关闭后恢复 · )?实际渲染 (\d+ × \d+) · (SMAA|原始抗锯齿) · 纹理 (\d+)×( · 已达到缓冲上限)?$/.exec(text);
  if (quality) return value.replace(text, language === "en"
    ? `${quality[1] ? "Performance mode overrides quality until disabled · " : ""}Rendered ${quality[2]} · ${quality[3] === "SMAA" ? "SMAA" : "Original antialiasing"} · Textures ${quality[4]}×${quality[5] ? " · Buffer limit reached" : ""}`
    : `${quality[1] ? "高速モードで画質を一時変更中 · " : ""}描画 ${quality[2]} · ${quality[3] === "SMAA" ? "SMAA" : "標準アンチエイリアス"} · テクスチャ ${quality[4]}×${quality[5] ? " · バッファー上限に到達" : ""}`);
  if (text.startsWith("选择档案 ")) return value.replace("选择档案 ", language === "en" ? "Select archive " : "資料を選択 ");
  if (text.startsWith("导出 ")) return value.replace(/^\s*导出 (.+) 档案\s*$/, language === "en" ? "Export $1 archive" : "資料 $1 を書き出す");
  return value;
}

let initialized = false;
export function currentUiLanguage(): UiLanguage {
  if (typeof location === "undefined") return "zh-CN";
  const requested = new URLSearchParams(location.search).get("lang");
  if (uiLanguages.includes(requested as UiLanguage)) return requested as UiLanguage;
  try {
    const saved = localStorage.getItem("rhine-language");
    if (uiLanguages.includes(saved as UiLanguage)) return saved as UiLanguage;
  } catch {}
  return normalizeUiLanguage(document.body.dataset.contentLanguage);
}

export function restoreContentLanguage() {
  const payload = document.getElementById("blog-data");
  if (!payload) return false;
  const target = languageUrl(JSON.parse(payload.textContent!).records, location.href, currentUiLanguage());
  if (new URL(target, location.href).pathname === location.pathname) return false;
  location.replace(target);
  return true;
}

export function initUiLanguage() {
  if (initialized) return;
  initialized = true;
  let language = currentUiLanguage();
  const articles = JSON.parse(document.getElementById("blog-data")?.textContent ?? '{"records":[]}').records;
  function translateLink(node: Node) {
    if (!(node instanceof HTMLAnchorElement) || !node.hasAttribute("href") || node.hasAttribute("download")) return;
    const url = new URL(node.href, location.href);
    if (url.origin === location.origin && /^\/(en\/|ja\/)?rss\.xml$/.test(url.pathname)) {
      node.href = language === "zh-CN" ? "/rss.xml" : `/${language}/rss.xml`;
      return;
    }
    if (url.origin !== location.origin || !(url.pathname === "/" || url.pathname.startsWith("/blog/"))) return;
    if (node.target.toLowerCase() === "_blank") node.removeAttribute("target");
    const target = languageUrl(articles, url.href, language);
    if (target !== url.pathname + url.search + url.hash) node.href = target;
  }
  const original = new WeakMap<Node, Map<string, { source: string; translated: string }>>();
  const excluded = 'script, style, template, pre, code, [translate="no"], .blog-body, .research-notes, #selected-title, #column-name, #archive-category, #hover-title, #selected-clearance, .detail-title-cn, .detail-content > h2, .metadata > div:not(:last-child) dd, .result-name, .result-row > span:nth-child(2), [data-filter]:not([data-filter="全部档案"]), #viewer-title';
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
    translateLink(node);
    if (node.parentElement?.closest(excluded) || node instanceof Element && node.matches(excluded)) {
      if (node instanceof Element) node.querySelectorAll("a[href]").forEach(translateLink);
      return;
    }
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
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="description"], meta[property="og:description"]')) meta.content = translateUiText(meta.content, language);
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (manifest) manifest.href = language === "zh-CN" ? "/manifest.webmanifest" : `/${language}/manifest.webmanifest`;
    document.querySelectorAll<HTMLElement>("[data-content-locale]").forEach(node => { node.hidden = node.dataset.contentLocale !== language; });
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
    const target = new URL(languageUrl(articles, location.href, language), location.href);
    if (document.documentElement.classList.contains("interactive")) target.searchParams.set("scene", "archive");
    document.dispatchEvent(new CustomEvent("rhine:languagechange", { detail: { url: target } }));
    location.assign(target.href);
  });
}
