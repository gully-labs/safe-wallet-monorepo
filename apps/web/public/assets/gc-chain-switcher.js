/*!
 * Gully chain switcher 1.0.4  <gc-chain-switcher surface="core" current="6714"></gc-chain-switcher>
 * Canonical source: gully-labs/gully-ops sites/_shared/gc-chain-switcher/gc-chain-switcher.js (spec: README.md next to it).
 * One network switcher for every Gully surface (Core app, gullycore.xyz, docs, explorer, bridge, offerwall, kre8, Multisig),
 * fed by the Gully Core manifest's chain list (https://gullycore.xyz/manifest.json, chains[].surfaces says which surface
 * lists which chain). No dependencies, shadow DOM, ES module: Node can import chainsFor() for tests. This is a NETWORK
 * switcher; the product switcher (gc-switcher.js) is a different component.
 *
 * Attributes
 *   surface    core | site | docs | explorer | bridge | offerwall | kre8 | multisig   (which chains to list; required)
 *   current    chain id of the chain the page is on (default: ?chain= in the URL, then the remembered chain, then the first live one)
 *   manifest   URL or "#id" of a <script type="application/json"> holding the manifest (default https://gullycore.xyz/manifest.json)
 *   health     URL of the surface's own health endpoint for the current chain ("{chainId}" is replaced); optional
 *   theme      light (default) | dark
 *   mode       link (default: switching navigates to ?chain=<id> on this page) | event (only fires gc-chain-change; the app routes)
 *   wallet     on (default) | off: hide the "Switch wallet to <Chain>" line
 *   compact-below  viewport width in px under which the trigger is icon-only (default 480; a crowded header passes e.g. 1500)
 * Events      gc-chain-change {detail:{chainId, chain}}   on the host element, before navigation
 * Behaviour   ?chain= deep link; toast on switch; "Switch wallet to <Chain>" inline when the connected wallet is on another chain
 *             (wallet_switchEthereumChain, then wallet_addEthereumChain with the manifest's RPC and explorer); last chain remembered
 *             (localStorage gc-chain); search appears over 6 rows; arrows, Home/End, Esc; aria-label "Network: <name>".
 */
export const GC_CHAIN_SWITCHER_VERSION = '1.0.4';
export const DEFAULT_MANIFEST = 'https://gullycore.xyz/manifest.json';
export const SURFACES = ['core', 'site', 'docs', 'explorer', 'bridge', 'offerwall', 'kre8', 'multisig'];

/** The chains a surface lists, from the manifest: flagged for the surface, mainnets then testnets, by manifest order;
    current first. Coming chains stay listed (disabled) so the owner's "no waitlist, one line" rule has a place to render. */
export function chainsFor(manifest, surface, currentId) {
  if (!SURFACES.includes(surface)) throw new Error(`gc-chain-switcher: unknown surface "${surface}"`);
  const flagged = (manifest.chains || []).filter((c) => {
    const s = c.surfaces || {};
    if (surface === 'explorer') return !!s.explorer;
    return !!s[surface];
  }).map((c) => (c.statusBy && c.statusBy[surface] ? { ...c, status: c.statusBy[surface] } : c)); // live on this surface first
  const cur = flagged.find((c) => String(c.chainId) === String(currentId) && c.status !== 'coming'); // a coming chain is never current
  const rest = flagged.filter((c) => c !== cur);
  const main = rest.filter((c) => c.kind === 'mainnet'), test = rest.filter((c) => c.kind !== 'mainnet');
  return { current: cur || null, mainnets: main, testnets: test, all: [...(cur ? [cur] : []), ...main, ...test] };
}

/** The href a row opens: the surface's own page with ?chain=<id> (mode=link), or the explorer for the explorer surface. */
export function hrefFor(chain, surface, location) {
  if (surface === 'explorer' && chain.surfaces?.explorer) return chain.surfaces.explorer;
  const u = new URL(location.href);
  u.searchParams.set('chain', String(chain.chainId));
  return u.pathname + u.search + u.hash;
}

const isBrowser = typeof window !== 'undefined' && typeof customElements !== 'undefined';
if (isBrowser && !customElements.get('gc-chain-switcher')) {
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const CSS = `
:host{display:inline-block;--gcs-ink:#0F0E0B;--gcs-paper:#fff;--gcs-cream:#FEF4E3;--gcs-line:#E3D9C7;--gcs-muted:#6B655A;--gcs-accent:#FD7716;--gcs-live:#1E9E5A;--gcs-warn:#D9A400;--gcs-down:#D23B2B;--gcs-radius:12px;font:var(--gcs-font,500 14px/1.2 Inter,system-ui,sans-serif);color:var(--gcs-ink)}
:host([theme=dark]){--gcs-ink:#FEF4E3;--gcs-paper:#1A1917;--gcs-cream:#242321;--gcs-line:#3A3732;--gcs-muted:#A39D90}
*{box-sizing:border-box}
.trig{display:inline-flex;align-items:center;gap:8px;min-height:var(--gcs-trig-h,44px);min-width:var(--gcs-trig-h,44px);padding:0 12px 0 8px;border:var(--gcs-trig-border,1px solid var(--gcs-line));border-radius:var(--gcs-trig-radius,999px);background:var(--gcs-trig-bg,var(--gcs-paper));color:inherit;cursor:pointer;font:inherit}
.trig:hover{border-color:var(--gcs-accent)}
.trig:focus-visible,.row:focus-visible,.srch:focus-visible,.wal:focus-visible{outline:2px solid var(--gcs-accent);outline-offset:2px}
.ic{position:relative;width:24px;height:24px;flex:none}
.ic img,.ic .lt{width:24px;height:24px;border-radius:50%;display:block}
.ic .lt{display:grid;place-items:center;background:var(--gcs-cream);font:700 11px/1 Inter,system-ui,sans-serif;color:var(--gcs-muted)}
.dot{position:absolute;right:-2px;bottom:-2px;width:9px;height:9px;border-radius:50%;border:2px solid var(--gcs-paper);background:var(--gcs-muted)}
.dot.ok{background:var(--gcs-live)}.dot.slow{background:var(--gcs-warn)}.dot.down{background:var(--gcs-down)}
.name{white-space:nowrap}
.chev{width:16px;height:16px;flex:none;transition:transform .2s}
:host([open]) .chev{transform:rotate(180deg)}
:host(.compact) .name,:host(.compact) .chev{display:none}:host(.compact) .trig{padding:0 10px}
.pop{position:fixed;z-index:1000;width:min(340px,calc(100vw - 24px));margin:0;padding:8px;border:1px solid var(--gcs-line);border-radius:16px;background:var(--gcs-paper);color:var(--gcs-ink);box-shadow:0 18px 50px rgba(15,14,11,.18)}
.pop::backdrop{background:transparent}
.srch{width:100%;min-height:40px;margin:0 0 6px;padding:0 12px;border:1px solid var(--gcs-line);border-radius:10px;background:var(--gcs-cream);color:inherit;font:inherit}
.grp{margin:6px 8px 2px;font:600 11px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:1px;text-transform:uppercase;color:var(--gcs-muted)}
ul{list-style:none;margin:0;padding:0}
.row{display:grid;grid-template-columns:24px 1fr auto;align-items:center;gap:10px;width:100%;min-height:44px;padding:6px 10px;border:0;border-radius:10px;background:transparent;color:inherit;text-decoration:none;text-align:left;font:inherit;cursor:pointer}
.row:hover{background:var(--gcs-cream)}
.row[aria-current=true]{background:var(--gcs-cream)}
.row[aria-disabled=true]{cursor:default;opacity:.62}
.row .t{display:flex;flex-direction:column;gap:2px;min-width:0}
.row .n{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row .s{font-size:12px;color:var(--gcs-muted)}
.chip{font:600 10px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.6px;text-transform:uppercase;padding:4px 7px;border-radius:999px;border:1px solid var(--gcs-line);color:var(--gcs-muted)}
.chip.live{color:var(--gcs-live);border-color:var(--gcs-live)}
.chk{width:16px;height:16px;color:var(--gcs-accent)}
.wal{display:flex;align-items:center;gap:8px;width:100%;min-height:40px;margin:6px 0 0;padding:0 12px;border:1px solid var(--gcs-accent);border-radius:10px;background:transparent;color:var(--gcs-ink);font:inherit;cursor:pointer}
.empty{padding:12px 10px;color:var(--gcs-muted);font-size:13px}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1001;padding:10px 14px;border-radius:999px;background:var(--gcs-ink);color:var(--gcs-cream);font:500 13px/1.2 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:gcs-in .2s ease-out}
@keyframes gcs-in{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
@media (prefers-reduced-motion:reduce){.chev,.toast{transition:none;animation:none}}`;
  const CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const CHECK = '<svg class="chk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  const manifestCache = new Map();
  async function loadManifest(src) {
    if (src.startsWith('#')) { const el = document.querySelector(`script${src}`); return JSON.parse(el ? el.textContent : '{}'); }
    if (!manifestCache.has(src)) manifestCache.set(src, fetch(src, { credentials: 'omit' }).then((r) => r.json()).catch(() => ({ chains: [] })));
    return manifestCache.get(src);
  }
  const remembered = () => { try { return localStorage.getItem('gc-chain'); } catch { return null; } };
  const remember = (id) => { try { localStorage.setItem('gc-chain', String(id)); } catch {} };

  class GcChainSwitcher extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._m = null; this._health = {}; this._q = ''; }
    /* Every attribute is also a PROPERTY with a setter that reflects to the attribute (1.0.4). React 19 (and other
       frameworks) assign a prop as a property once the element is upgraded: with getter-only accessors the assignment
       threw "Cannot set property surface of #<GcChainSwitcher> which has only a getter" on every re-render after the
       module loaded (owner console, app.gullycore.xyz 2026-11-09: SiteNav → "[route] failed to load or render" on
       /app/governance and /embed). Attributes that change after connection re-render. */
    static observedAttributes = ['surface', 'current', 'mode', 'manifest', 'health', 'theme', 'wallet', 'compact-below'];
    get surface() { return this.getAttribute('surface') || 'site'; }
    set surface(v) { this.setAttribute('surface', String(v)); }
    get mode() { return this.getAttribute('mode') || 'link'; }
    set mode(v) { this.setAttribute('mode', String(v)); }
    get current() { return this.getAttribute('current') || ''; }
    set current(v) { if (v == null || v === '') this.removeAttribute('current'); else this.setAttribute('current', String(v)); }
    get manifest() { return this.getAttribute('manifest') || DEFAULT_MANIFEST; }
    set manifest(v) { this.setAttribute('manifest', String(v)); }
    get health() { return this.getAttribute('health') || ''; }
    set health(v) { if (v == null || v === '') this.removeAttribute('health'); else this.setAttribute('health', String(v)); }
    get theme() { return this.getAttribute('theme') || 'light'; }
    set theme(v) { this.setAttribute('theme', String(v)); }
    get wallet() { return this.getAttribute('wallet') || 'on'; }
    set wallet(v) { this.setAttribute('wallet', String(v)); }
    get compactBelow() { return parseInt(this.getAttribute('compact-below') || '480', 10); }
    set compactBelow(v) { this.setAttribute('compact-below', String(v)); }
    attributeChangedCallback(name, was, now) {
      if (was === now || !this._root || !this._m) return; // before connection the attributes are read in connectedCallback
      if (name === 'current' && now && chainsFor(this._m, this.surface, now).current) this._cur = String(now);
      this.render();
      if (name === 'current' || name === 'health') this.probe();
    }
    async connectedCallback() {
      const sheet = document.createElement('style'); sheet.textContent = CSS; this.shadowRoot.append(sheet);
      this._root = document.createElement('div'); this.shadowRoot.append(this._root);
      // icon-only trigger below compact-below px (default 480; a crowded header may pass a larger value)
      const below = parseInt(this.getAttribute('compact-below') || '480', 10);
      const mq = window.matchMedia(`(max-width: ${below}px)`);
      const compact = () => this.classList.toggle('compact', mq.matches);
      compact(); mq.addEventListener?.('change', compact);
      this._m = await loadManifest(this.getAttribute('manifest') || DEFAULT_MANIFEST);
      const url = new URLSearchParams(location.search).get('chain');
      const first = chainsFor(this._m, this.surface).all.find((c) => c.status !== 'coming');
      const want = this.getAttribute('current') || url || remembered();
      this._cur = want && chainsFor(this._m, this.surface, want).current ? want : (first ? String(first.chainId) : '');
      this.render();
      this.probe();
      if (window.ethereum && this.getAttribute('wallet') !== 'off') {
        window.ethereum.request({ method: 'eth_chainId' }).then((id) => { this._wallet = parseInt(id, 16); this.render(); }).catch(() => {});
        window.ethereum.on?.('chainChanged', (id) => { this._wallet = parseInt(id, 16); this.render(); });
      }
      document.addEventListener('click', (e) => { if (this._open && !e.composedPath().includes(this)) this.close(); });
    }
    data() { return chainsFor(this._m || { chains: [] }, this.surface, this._cur); }
    icon(c) { return c.icon ? `<img src="${esc(c.icon)}" alt="" width="24" height="24" loading="lazy">` : `<span class="lt" aria-hidden="true">${esc(String(c.name || '?').slice(0, 1))}</span>`; }
    row(c, current) {
      const coming = c.status === 'coming';
      const chip = `<span class="chip${coming ? '' : ' live'}">${coming ? 'Coming' : 'Live'}</span>`;
      const sub = coming ? (c.note ? esc(c.note.split('. ')[0]) : 'Not on this surface yet') : `${esc(c.native || '')}${c.kind !== 'mainnet' ? ' · testnet' : ''}`;
      const inner = `<span class="ic">${this.icon(c)}</span><span class="t"><span class="n">${esc(c.name)}</span><span class="s">${sub}</span></span>${current ? CHECK : chip}`;
      if (coming) return `<li><div class="row" role="option" aria-disabled="true">${inner}</div></li>`;
      const href = hrefFor(c, this.surface, location);
      return `<li><a class="row" role="option" href="${esc(href)}" data-id="${c.chainId}"${current ? ' aria-current="true"' : ''}>${inner}</a></li>`;
    }
    render() {
      const d = this.data(); const cur = d.current;
      const q = this._q.trim().toLowerCase();
      const match = (c) => !q || c.name.toLowerCase().includes(q) || String(c.chainId).includes(q) || (c.native || '').toLowerCase().includes(q);
      const main = d.mainnets.filter(match), test = d.testnets.filter(match);
      const h = this._health[cur?.chainId] || '';
      const walletDiffers = this._wallet && cur && this._wallet !== cur.chainId && cur.status !== 'coming';
      const list = (title, rows) => rows.length ? `<p class="grp">${title}</p><ul role="listbox">${rows.map((c) => this.row(c, false)).join('')}</ul>` : '';
      this._root.innerHTML = `
<button class="trig" type="button" aria-haspopup="listbox" aria-expanded="${!!this._open}" aria-label="Network: ${esc(cur ? cur.name : 'choose a chain')}">
  <span class="ic">${cur ? this.icon(cur) : '<span class="lt">?</span>'}<span class="dot ${h}" title="${h === 'ok' ? 'RPC answers' : h === 'slow' ? 'RPC is slow' : h === 'down' ? 'RPC did not answer' : 'checking'}"></span></span>
  <span class="name">${esc(cur ? cur.name : 'Choose a chain')}</span>${CHEV}
</button>
<div class="pop" role="dialog" aria-label="Choose a network" ${this._open ? '' : 'hidden'}>
  ${d.all.length > 6 ? `<input class="srch" type="search" placeholder="Search chains" aria-label="Search chains" value="${esc(this._q)}">` : ''}
  ${cur && match(cur) ? `<ul role="listbox" aria-label="Current">${this.row(cur, true)}</ul>` : ''}
  ${list('Mainnets', main)}${list('Testnets', test)}
  ${!d.all.length ? '<p class="empty">No chains for this surface yet.</p>' : !main.length && !test.length && !(cur && match(cur)) ? '<p class="empty">No chain matches.</p>' : ''}
  ${walletDiffers ? `<button class="wal" type="button">Switch wallet to ${esc(cur.name)}</button>` : ''}
</div>`;
      this._root.querySelector('.trig').onclick = () => (this._open ? this.close() : this.open());
      const s = this._root.querySelector('.srch'); if (s) { s.oninput = () => { this._q = s.value; const keep = s.selectionStart; this.render(); const s2 = this._root.querySelector('.srch'); if (s2) { s2.focus(); s2.setSelectionRange(keep, keep); } }; }
      this._root.querySelectorAll('a.row').forEach((a) => { a.onclick = (e) => this.pick(e, a.dataset.id); });
      const w = this._root.querySelector('.wal'); if (w) w.onclick = () => this.switchWallet(cur);
      this._root.onkeydown = (e) => this.keys(e);
      if (this._open) this.place();
    }
    open() { this._open = true; this.setAttribute('open', ''); this.render(); (this._root.querySelector('.srch') || this._root.querySelector('[aria-current=true]') || this._root.querySelector('a.row'))?.focus(); }
    close() { this._open = false; this.removeAttribute('open'); this._q = ''; this.render(); this._root.querySelector('.trig')?.focus(); }
    place() { const t = this._root.querySelector('.trig').getBoundingClientRect(), p = this._root.querySelector('.pop'); const w = Math.min(340, innerWidth - 24); p.style.top = `${Math.round(t.bottom + 6)}px`; p.style.left = `${Math.round(Math.max(12, Math.min(t.left, innerWidth - w - 12)))}px`; }
    keys(e) {
      if (!this._open) { if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { if (e.target.classList.contains('trig')) { e.preventDefault(); this.open(); } } return; }
      const rows = [...this._root.querySelectorAll('a.row')]; const i = rows.indexOf(this.shadowRoot.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); this.close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); (rows[i + 1] || rows[0])?.focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); (rows[i - 1] || rows[rows.length - 1])?.focus(); }
      else if (e.key === 'Home') { e.preventDefault(); rows[0]?.focus(); }
      else if (e.key === 'End') { e.preventDefault(); rows[rows.length - 1]?.focus(); }
    }
    pick(e, id) {
      const c = this.data().all.find((x) => String(x.chainId) === String(id)); if (!c) return;
      remember(id);
      const ev = new CustomEvent('gc-chain-change', { detail: { chainId: c.chainId, chain: c }, bubbles: true, cancelable: true });
      const go = this.dispatchEvent(ev);
      this.toast(`Switched to ${c.name}`);
      if (this.mode === 'event' || !go) { e.preventDefault(); this._cur = String(id); this.close(); this.probe(); }
      // mode=link: the anchor navigates to ?chain=<id> (or the explorer)
    }
    async switchWallet(c) {
      const hex = '0x' + Number(c.chainId).toString(16);
      try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hex }] }); this.toast(`Wallet on ${c.name}`); }
      catch (err) {
        if (err && (err.code === 4902 || /unrecognized|not added|4902/i.test(String(err.message)))) {
          try {
            await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: hex, chainName: c.name, nativeCurrency: { name: c.native || 'ETH', symbol: c.native || 'ETH', decimals: 18 }, rpcUrls: [c.rpc].filter(Boolean), blockExplorerUrls: [c.explorer].filter(Boolean) }] });
            this.toast(`${c.name} added to your wallet`);
          } catch { this.toast('Your wallet declined the switch', true); }
        } else this.toast('Your wallet declined the switch', true);
      }
    }
    async probe() {
      const d = this.data(); const c = d.current; if (!c || !c.health?.rpc) return;
      const t0 = performance.now(); const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 4000);
      let state = 'down';
      try {
        const r = await fetch(c.health.rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }), signal: ctl.signal });
        if (r.ok) state = performance.now() - t0 > 2000 ? 'slow' : 'ok';
      } catch {} finally { clearTimeout(timer); }
      const own = this.getAttribute('health');
      if (own && state !== 'down') { try { const r = await fetch(own.replace('{chainId}', c.chainId), { signal: AbortSignal.timeout(4000) }); if (!r.ok) state = 'slow'; } catch { state = 'slow'; } }
      this._health[c.chainId] = state; this.render();
    }
    toast(msg, err) {
      const host = document.querySelector('.toasts');
      if (host && typeof window.toast === 'function') { window.toast(msg, err ? 'err' : undefined); return; }
      const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status'); this.shadowRoot.append(t); setTimeout(() => t.remove(), 2800);
    }
  }
  customElements.define('gc-chain-switcher', GcChainSwitcher);
}
