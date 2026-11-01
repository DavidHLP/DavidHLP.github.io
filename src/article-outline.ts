import { articleScrollRoot } from "./article-reader.ts";

export function collectArticleHeadings(body: HTMLElement) {
  const headings = [...body.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6")]
    .filter(heading => heading.textContent?.trim() && !heading.closest(".sr-only,[hidden],[aria-hidden='true']"));
  const headingSet = new Set(headings);
  const nodes = [...body.ownerDocument.querySelectorAll<HTMLElement>("[id]")];
  const ids = new Set(nodes.map(node => node.id));
  const seen = new Set(nodes.filter(node => !headingSet.has(node)).map(node => node.id));
  headings.forEach((heading, index) => {
    if (!heading.id || seen.has(heading.id)) {
      let suffix = index + 1;
      while (ids.has(`rhine-heading-${suffix}`)) suffix++;
      heading.id = `rhine-heading-${suffix}`;
      ids.add(heading.id);
    }
    seen.add(heading.id);
  });
  return headings;
}

export class ArticleOutline {
  private outline: HTMLDetailsElement | null = null;
  private root: HTMLElement | null = null;
  private headings: HTMLElement[] = [];
  private links: HTMLAnchorElement[] = [];
  private count: HTMLElement | null = null;
  private title: HTMLElement | null = null;
  private frame = 0;
  private current = -1;
  private article: HTMLElement;

  constructor(article: HTMLElement) {
    this.article = article;
    window.addEventListener("resize", () => this.refresh());
  }

  render() {
    this.root?.removeEventListener("scroll", this.schedule);
    this.root = null;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.outline?.remove();
    this.outline = null;
    this.links = [];
    this.count = this.title = null;
    this.current = -1;
    this.article.style.removeProperty("--article-outline-top");
    this.article.style.removeProperty("--article-heading-offset");
    this.article.style.removeProperty("--article-outline-max-height");
    const body = this.article.querySelector<HTMLElement>(".blog-body");
    this.headings = body ? collectArticleHeadings(body) : [];
    if (!body || !this.headings.length) return;

    const outline = document.createElement("details");
    outline.className = "article-outline";
    const summary = document.createElement("summary");
    const label = document.createElement("span");
    label.textContent = "章节目录";
    this.count = document.createElement("span");
    this.count.className = "article-outline-count";
    this.title = document.createElement("span");
    this.title.className = "article-outline-title";
    this.count.translate = this.title.translate = false;
    const chevron = document.createElement("span");
    chevron.className = "article-outline-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "⌄";
    summary.append(label, this.count, this.title, chevron);
    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "章节目录");
    const list = document.createElement("ol");
    const minimum = Math.min(...this.headings.map(heading => Number(heading.tagName.slice(1))));
    this.headings.forEach(heading => {
      const item = document.createElement("li");
      item.style.setProperty("--outline-depth", String(Number(heading.tagName.slice(1)) - minimum));
      const link = document.createElement("a");
      link.href = `#${encodeURIComponent(heading.id)}`;
      link.translate = false;
      link.textContent = heading.textContent!.trim();
      link.addEventListener("click", event => {
        if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        for (let ancestor = heading.parentElement; ancestor && ancestor !== body; ancestor = ancestor.parentElement) {
          if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
        }
        this.collapse();
        requestAnimationFrame(() => {
          if (!heading.isConnected) return;
          if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
          this.schedule();
        });
      });
      item.append(link);
      list.append(item);
      this.links.push(link);
    });
    nav.append(list);
    outline.append(summary, nav);
    outline.addEventListener("toggle", () => {
      if (outline.open) { this.refresh(); this.revealCurrent(); }
    });
    outline.addEventListener("keydown", event => {
      if (event.key !== "Escape" || !outline.open) return;
      event.preventDefault();
      event.stopPropagation();
      this.collapse();
      summary.focus({ preventScroll: true });
    });
    body.before(outline);
    this.outline = outline;
    this.refresh();
  }

  collapse() {
    if (this.outline) this.outline.open = false;
  }

  refresh() {
    if (!this.outline) return;
    const root = articleScrollRoot(this.article);
    if (root !== this.root) {
      this.root?.removeEventListener("scroll", this.schedule);
      this.root = root;
      root.addEventListener("scroll", this.schedule, { passive: true });
    }
    const toolbar = root instanceof HTMLDialogElement ? (root.firstElementChild as HTMLElement)?.offsetHeight ?? 0 : 0;
    const padding = parseFloat(getComputedStyle(root).paddingTop) || 0;
    this.article.style.setProperty("--article-outline-top", `${toolbar}px`);
    this.article.style.setProperty("--article-heading-offset", `${toolbar + padding + this.outline.offsetHeight + 8}px`);
    this.schedule();
  }

  private schedule = () => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      if (!this.root || !this.outline) return;
      const bounds = this.root.getBoundingClientRect();
      const scale = this.root.offsetHeight ? bounds.height / this.root.offsetHeight : 1;
      const available = `${Math.max(44, (bounds.bottom - this.outline.getBoundingClientRect().bottom) / (scale || 1) - 8)}px`;
      if (this.article.style.getPropertyValue("--article-outline-max-height") !== available) this.article.style.setProperty("--article-outline-max-height", available);
      const offset = parseFloat(this.article.style.getPropertyValue("--article-heading-offset")) || 0;
      const top = bounds.top + offset * scale;
      let current = 0;
      let lastVisible = 0;
      this.headings.forEach((heading, index) => {
        if (!heading.getClientRects().length) return;
        lastVisible = index;
        if (heading.getBoundingClientRect().top <= top + 1) current = index;
      });
      if (this.root.scrollTop > 0 && this.root.scrollTop + this.root.clientHeight >= this.root.scrollHeight - 2) current = lastVisible;
      if (current === this.current) {
        if (this.outline.open) this.revealCurrent();
        return;
      }
      this.links[this.current]?.removeAttribute("aria-current");
      this.current = current;
      this.links[current].setAttribute("aria-current", "location");
      this.count!.textContent = `${String(current + 1).padStart(2, "0")} / ${String(this.headings.length).padStart(2, "0")}`;
      this.title!.textContent = this.headings[current].textContent!.trim();
      if (this.outline.open) this.revealCurrent();
    });
  };

  private revealCurrent() {
    const link = this.links[this.current];
    const nav = this.outline?.querySelector("nav");
    if (!link || !nav) return;
    const top = link.offsetTop;
    if (top < nav.scrollTop) nav.scrollTop = top;
    else if (top + link.offsetHeight > nav.scrollTop + nav.clientHeight) nav.scrollTop = top + link.offsetHeight - nav.clientHeight;
  }
}
