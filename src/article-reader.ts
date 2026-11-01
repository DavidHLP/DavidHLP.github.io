export class ArticleReader {
  private readonly parent: HTMLElement;
  private readonly next: ChildNode | null;
  private opener: HTMLElement | null = null;
  private scroll = 0;
  private panelScroll = 0;
  private restoredScroll = NaN;
  private anchor: { node: HTMLElement; offset: number } | null = null;

  private dialog: HTMLDialogElement;
  private article: HTMLElement;

  constructor(dialog: HTMLDialogElement, article: HTMLElement) {
    this.dialog = dialog;
    this.article = article;
    this.parent = article.parentElement!;
    this.next = article.nextSibling;
    dialog.addEventListener("cancel", event => { event.preventDefault(); this.close(); });
    dialog.addEventListener("close", () => {
      this.parent.insertBefore(article, this.next);
      article.scrollTop = this.scroll;
      const panel = article.querySelector<HTMLElement>("#tab-panel")!;
      panel.scrollTop = this.panelScroll;
      this.restoreAnchor(this.scrollRoot(), this.anchor);
      this.restoredScroll = this.scrollRoot().scrollTop;
      const opener = this.opener?.isConnected ? this.opener : article.querySelector<HTMLElement>('[data-action="read-full"]');
      opener?.focus({ preventScroll: true });
    });
  }

  get isOpen() { return this.dialog.open; }

  open(opener: HTMLElement) {
    if (this.isOpen) return;
    this.opener = opener;
    this.scroll = this.article.scrollTop;
    const panel = this.article.querySelector<HTMLElement>("#tab-panel")!;
    this.panelScroll = panel.scrollTop;
    const root = this.scrollRoot();
    const anchor = root.scrollTop === this.restoredScroll && this.anchor?.node.isConnected
      ? this.anchor
      : panel.scrollTop || this.scroll ? this.readingAnchor(root) : null;
    this.dialog.append(this.article);
    this.article.inert = false;
    this.dialog.showModal();
    this.dialog.scrollTop = 0;
    this.restoreAnchor(this.dialog, anchor);
  }

  close() {
    this.anchor = this.readingAnchor(this.dialog);
    this.dialog.close();
  }

  private scrollRoot() {
    const panel = this.article.querySelector<HTMLElement>("#tab-panel")!;
    return getComputedStyle(panel).overflowY === "visible" ? this.article : panel;
  }

  private readingAnchor(root: HTMLElement) {
    const top = this.readingTop(root);
    const node = [...this.article.querySelectorAll<HTMLElement>(".blog-body :is(h1,h2,h3,h4,p,pre,li,tr)")]
      .find(node => node.getBoundingClientRect().bottom > top);
    return node ? { node, offset: node.getBoundingClientRect().top - top } : null;
  }

  private restoreAnchor(root: HTMLElement, anchor: { node: HTMLElement; offset: number } | null) {
    if (!anchor?.node.isConnected) return;
    const bounds = root.getBoundingClientRect();
    const scale = root.offsetHeight ? bounds.height / root.offsetHeight : 1;
    root.scrollTop += (anchor.node.getBoundingClientRect().top - this.readingTop(root) - anchor.offset) / (scale || 1);
  }

  private readingTop(root: HTMLElement) {
    return root.getBoundingClientRect().top + (root === this.dialog ? (this.dialog.firstElementChild as HTMLElement)?.offsetHeight ?? 0 : 0);
  }
}
