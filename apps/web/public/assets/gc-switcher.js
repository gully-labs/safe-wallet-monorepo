/*!
 * GullyChain product switcher  <gc-switcher current="bridge"></gc-switcher>
 * Canonical source: gully-labs/gully-ops sites/_shared/gc-switcher/gc-switcher.js (spec: README.md next to it).
 * Copies live in gully-street, hyperlane-warp-ui-template (gully/), gully-explorer and eth-faucet: change the
 * canonical file, then copy it over byte for byte (each copy carries the same GC_SWITCHER_VERSION).
 * No dependencies, shadow DOM (the host page's CSS cannot restyle it), brand kit v3 tokens.
 *
 * Attributes
 *   current    app | bridge | explorer | faucet | safe | verify | id | docs | dev | status   (highlighted item + trigger label)
 *   safe-live  kept for older surfaces; ignored since 1.1.0 (Gully Safe is live at safe.gullychain.xyz)
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.customElements || window.customElements.get('gc-switcher')) return;

  var GC_SWITCHER_VERSION = '1.1.0';
  var HOME = 'https://gullychain.xyz/';
  // Every entry is a Gully product, so every link opens in the same tab (one product family).
  var PRODUCTS = [
    { id: 'app', label: 'App', desc: 'Social trading app', href: 'https://app.gullychain.xyz/', icon: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>' },
    { id: 'bridge', label: 'Bridge', desc: 'Move ETH in and out', href: 'https://testnet-bridge.gullychain.xyz/', icon: '<path d="M3 18h18M5 18v-5a7 7 0 0 1 14 0v5M9 18v-4M15 18v-4"/>' },
    { id: 'explorer', label: 'Explorer', desc: 'Blocks, txs, tokens', href: 'https://testnet-explorer.gullychain.xyz/', icon: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5M8.5 11h5"/>' },
    { id: 'faucet', label: 'Faucet', desc: 'Free testnet ETH', href: 'https://faucet.gullychain.xyz/', icon: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>' },
    { id: 'safe', label: 'Safe', desc: 'Multisig, passkey signers', href: 'https://safe.gullychain.xyz/', icon: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><circle cx="12" cy="11" r="2"/><path d="M12 13v3"/>' },
    { id: 'verify', label: 'Verify', desc: 'Contract source, Sourcify', href: 'https://verify.gullychain.xyz/', icon: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>' },
    { id: 'id', label: 'Gully ID', desc: 'One sign-in for every app', href: 'https://gullyid.xyz/', icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>' },
    { id: 'docs', label: 'Docs', desc: 'Guides and reference', href: 'https://docs.gullychain.xyz/', icon: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>' },
    { id: 'dev', label: 'Developers', desc: 'Starters and grants', href: 'https://dev.gullychain.xyz/', icon: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>' },
    { id: 'status', label: 'Status', desc: 'Uptime of every service', href: 'https://status.gullylabs.xyz/', icon: '<path d="M3 12h4l3-7 4 14 3-7h4"/>' }
  ];
  var ICON = 'data:image/png;base64,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';
  var WORDMARK = '<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1051 179" width="1051" height="179"><defs><linearGradient id="wmg" gradientUnits="userSpaceOnUse" x1="529.20" y1="0" x2="1058.40" y2="0"><stop offset="0" stop-color="#00B2FA"></stop><stop offset="1" stop-color="#46FB04"></stop></linearGradient></defs><g transform="translate(-7.80 138.00)"><path fill="#F2F5F7" d="M71-140.80L71-140.80Q81.20-140.80 89.10-140.20Q97-139.60 103.90-138.50Q110.80-137.40 117.60-135.40L117.60-135.40L114.80-108.20Q107.60-108.40 100.80-108.50Q94-108.60 87-108.70Q80-108.80 71.40-108.80L71.40-108.80Q64.40-108.80 59.70-107.20Q55-105.60 52.30-101.20Q49.60-96.80 48.40-88.90Q47.20-81 47.20-68.80L47.20-68.80Q47.20-53.40 49.10-44.80Q51-36.20 55.40-32.80Q59.80-29.40 67.60-29.40L67.60-29.40Q72.80-29.40 77.10-30.10Q81.40-30.80 85-32.20L85-32.20Q86-32.60 87-32.80L87-32.80L87-79.40L123-79.40L123 0L95.40 0L92-14.40Q89.80-12 86.60-9.20L86.60-9.20Q80.80-4.20 72.40-0.70Q64 2.80 53 2.80L53 2.80Q37.40 2.80 27.30-4.50Q17.20-11.80 12.50-27.60Q7.80-43.40 7.80-69L7.80-69Q7.80-95.80 13.90-111.50Q20-127.20 33.90-134Q47.80-140.80 71-140.80ZM143.40-99.40L179.80-99.40L179.80-36.40Q179.60-31.80 181.80-29.80Q184-27.80 189-27.80L189-27.80Q193.80-27.80 199-29.20L199-29.20Q202.80-30.20 208-32.60L208-32.60L208-99.40L244.60-99.40L244.60 0L216 0L212.80-14.60Q203.20-6 193.60-1.80L193.60-1.80Q183.40 2.80 172.40 2.80L172.40 2.80Q143.40 2.80 143.40-25L143.40-25L143.40-99.40ZM267.20-140L303.40-140L303.40-34.20Q303.40-29.80 306.10-27.80Q308.80-25.80 314-25.80L314-25.80L321.40-25.80L325.40-2Q322.80-0.40 317.80 0.60Q312.80 1.60 307.60 2.10Q302.40 2.60 298.80 2.60L298.80 2.60Q284 2.60 275.60-4.60Q267.20-11.80 267.20-24.80L267.20-24.80L267.20-140ZM338-140L374.20-140L374.20-34.20Q374.20-29.80 376.90-27.80Q379.60-25.80 384.80-25.80L384.80-25.80L392.20-25.80L396.20-2Q393.60-0.40 388.60 0.60Q383.60 1.60 378.40 2.10Q373.20 2.60 369.60 2.60L369.60 2.60Q354.80 2.60 346.40-4.60Q338-11.80 338-24.80L338-24.80L338-140ZM476.20-99.40L515-99.40L481.60-1Q479.00 6.80 474.40 15Q469.80 23.20 462.50 29.70Q455.20 36.20 444.80 39.20Q434.40 42.20 420.40 39.80L420.40 39.80L417.80 19.80Q430.00 17 437.20 12.20L437.20 12.20Q443.60 7.80 447.40 0L447.40 0L441.20 0Q437.00 0 433.90-2.40Q430.80-4.80 429.60-8.60L429.60-8.60L398.80-99.40L437.40-99.40L452.40-40.20Q453.20-36 453.90-31.60Q454.60-27.20 455.20-23L455.20-23L457.40-23Q458.00-25.40 458.80-28.20L458.80-28.20Q460.40-35.20 461.40-40.20L461.40-40.20L476.20-99.40Z"></path><path fill="url(#wmg)" d="M589.80-140.40L589.80-140.40Q600.20-140.40 607.50-139.80Q614.80-139.20 620.90-138.20Q627.00-137.20 633.40-135.40L633.40-135.40L630.60-107.80Q623.80-108.20 618.00-108.30Q612.20-108.40 605.60-108.50Q599.00-108.60 589.80-108.60L589.80-108.60Q581.60-108.60 576.90-105.20Q572.20-101.80 570.40-93.20Q568.60-84.60 568.60-69L568.60-69Q568.60-53.40 570.40-44.80Q572.20-36.20 576.90-32.80Q581.60-29.40 589.80-29.40L589.80-29.40Q604.40-29.40 614.10-29.80Q623.80-30.20 633.60-31.20L633.60-31.20L636.40-3.80Q626.40-0.40 615.90 1Q605.40 2.40 589.80 2.40L589.80 2.40Q567.60 2.40 554.30-4.50Q541.00-11.40 535.10-27Q529.20-42.60 529.20-69L529.20-69Q529.20-95.40 535.10-111Q541.00-126.60 554.30-133.50Q567.60-140.40 589.80-140.40ZM726.80-102.20L726.80-102.20Q755.60-102.20 755.60-74.40L755.60-74.40L755.60 0L719.20 0L719.20-63Q719.20-67.80 717.30-69.60Q715.40-71.40 710.60-71.40L710.60-71.40Q705.60-71.40 700.00-70L700.00-70Q695.60-69 689.40-66.40L689.40-66.40L689.40 0L653.00 0L653.00-140L689.40-140L689.60-108.20Q689.60-99.80 688.40-92L688.40-92Q688.00-89 687.40-86.40L687.40-86.40Q695.60-93 704.40-97L704.40-97Q715.80-102.20 726.80-102.20ZM832.60-102.20L832.60-102.20Q846-102.20 855.30-98.60Q864.60-95 869.40-86.60Q874.20-78.20 874.20-63.40L874.20-63.40L874.20 0L845.20 0L841.80-15Q839.20-11.80 835.80-8.80L835.80-8.80Q830.60-3.80 823.20-0.60Q815.80 2.60 806 2.60L806 2.60Q797 2.60 789.40-0.60Q781.80-3.80 777.30-10Q772.80-16.20 772.80-25.60L772.80-25.60L772.80-35.60Q772.80-47.60 781.30-54.30Q789.80-61 804.40-61L804.40-61L837.80-61L837.80-63.60Q837.60-69.80 834.70-72.50Q831.80-75.20 824.20-75.20L824.20-75.20Q816.40-75.20 805-74.90Q793.60-74.60 781.20-73.80L781.20-73.80L778-97.20Q785.40-98.60 795.30-99.70Q805.20-100.80 815.20-101.50Q825.20-102.20 832.60-102.20ZM837.80-29.60L837.80-42.60L817-42.60Q812.40-42.40 810.30-40.30Q808.20-38.20 808.20-34.60L808.20-34.60L808.20-30.80Q808.20-27 810.70-24.90Q813.20-22.80 818.20-22.80Q823.20-22.80 828.80-25L828.80-25Q833.40-26.80 837.80-29.60L837.80-29.60ZM896.40-99.40L932.60-99.40L932.60 0L896.40 0L896.40-99.40ZM906.60-144.20L922.20-144.20Q932.80-144.20 932.80-133.40L932.80-133.40L932.80-123Q932.80-112.20 922.20-112.20L922.20-112.20L906.60-112.20Q896.00-112.20 896.00-123L896.00-123L896.00-133.40Q896.00-144.20 906.60-144.20L906.60-144.20ZM1029.60-102.20L1029.60-102.20Q1058.40-102.20 1058.40-74.40L1058.40-74.40L1058.40 0L1022.00 0L1022.00-63Q1022.00-67.80 1020.10-69.60Q1018.20-71.40 1013.40-71.40L1013.40-71.40Q1008.40-71.40 1002.80-70L1002.80-70Q998.40-69 992.20-66.40L992.20-66.40L992.20 0L955.80 0L955.80-99.40L984.60-99.40L987.80-84.60Q997.60-93 1008.00-97.60L1008.00-97.60Q1019.00-102.20 1029.60-102.20Z"></path></g></svg>';
  var GRID = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="5" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/></svg>';
  var CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  var line = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; };

  var CSS = [
    ':host{--n:#05080D;--k:#0A1018;--c:#00B2FA;--g:#46FB04;--w:#F2F5F7;--m:#8A97A8;--grad:linear-gradient(90deg,#00B2FA,#46FB04);',
    'display:inline-flex;align-items:center;gap:10px;min-width:0;font-family:"Exo 2",system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--w);line-height:1.2;-webkit-tap-highlight-color:transparent}',
    '*,*::before,*::after{box-sizing:border-box}',
    'a{color:inherit;text-decoration:none}',
    '.logo{display:inline-flex;align-items:center;gap:8px;min-height:40px;border-radius:10px;outline-offset:3px;flex:none}',
    '.logo img{width:26px;height:26px;display:block}',
    '.logo svg{height:15px;width:auto;display:block}',
    '.trig{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 10px 0 12px;border-radius:999px;border:1px solid rgba(242,245,247,.14);background:rgba(10,16,24,.6);color:var(--w);font:600 13px/1 "Exo 2",system-ui,sans-serif;letter-spacing:.02em;white-space:nowrap;transition:border-color .15s,background .15s}',
    '.trig:hover{border-color:rgba(0,178,250,.6);background:rgba(0,178,250,.08)}',
    '.trig:focus-visible,.logo:focus-visible,.it:focus-visible,.x:focus-visible,.ft a:focus-visible{outline:2px solid var(--c);outline-offset:2px}',
    '.trig svg{width:14px;height:14px;color:var(--c)}',
    '.trig[aria-expanded="true"]{border-color:var(--c);background:rgba(0,178,250,.12)}',
    'dialog{position:fixed;margin:0;padding:0;border:0;background:transparent;color:var(--w);max-width:none;max-height:none;overflow:visible}',
    'dialog::backdrop{background:rgba(5,8,13,.35)}',
    '.p{width:440px;max-width:calc(100vw - 24px);background:var(--k);border:1px solid rgba(242,245,247,.12);border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.55),0 0 0 1px rgba(0,178,250,.06);padding:14px;font-family:"Exo 2",system-ui,-apple-system,"Segoe UI",sans-serif;animation:pop .14s ease-out}',
    '@keyframes pop{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}',
    '.hd{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 4px 10px}',
    '.hd b{font:800 12px/1 "Exo 2",system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}',
    '.x{all:unset;cursor:pointer;display:none;place-items:center;width:40px;height:40px;border-radius:10px;color:var(--m)}',
    '.x svg{width:20px;height:20px}',
    'ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:6px}',
    '.it{position:relative;display:flex;align-items:center;gap:10px;min-height:56px;padding:9px 10px;border-radius:12px;border:1px solid transparent;transition:background .12s,border-color .12s}',
    'a.it:hover{background:rgba(242,245,247,.05);border-color:rgba(242,245,247,.1)}',
    '.ic{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:rgba(0,178,250,.1);color:var(--c)}',
    '.ic svg{width:19px;height:19px}',
    '.t{display:flex;flex-direction:column;gap:3px;min-width:0}',
    '.l{font-weight:600;font-size:14px;color:var(--w)}',
    '.d{font-size:12px;color:var(--m);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.it[aria-current="page"]{background:rgba(0,178,250,.08);border-color:transparent;background-image:linear-gradient(var(--k),var(--k)),var(--grad);background-origin:border-box;background-clip:padding-box,border-box}',
    '.it[aria-current="page"] .ic{background:var(--grad);color:var(--n)}',
    '.it[aria-current="page"] .l::after{content:"You are here";margin-left:6px;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--g)}',
    '.it.soon{opacity:.62;cursor:default}',
    '.it.soon .ic{background:rgba(138,151,168,.12);color:var(--m)}',
    '.tag{margin-left:6px;padding:2px 6px;border-radius:999px;border:1px solid rgba(138,151,168,.35);font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--m)}',
    '.ft{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px;padding:10px 4px 2px;border-top:1px solid rgba(242,245,247,.08);font-size:12px;color:var(--m)}',
    '.ft a{color:var(--c);font-weight:600;min-height:32px;display:inline-flex;align-items:center}',
    '.ft a:hover{color:var(--g)}',
    '@media (max-width:640px){',
    'dialog{inset:auto 0 0 0!important;width:100%}',
    'dialog::backdrop{background:rgba(5,8,13,.72)}',
    '.p{width:100%;max-width:none;max-height:86vh;overflow:auto;border-radius:20px 20px 0 0;border-bottom:0;padding:8px 14px calc(14px + env(safe-area-inset-bottom));animation:up .2s ease-out}',
    '.p::before{content:"";display:block;width:40px;height:4px;border-radius:2px;background:rgba(242,245,247,.2);margin:2px auto 8px}',
    '@keyframes up{from{transform:translateY(24px);opacity:.4}to{transform:none;opacity:1}}',
    '.x{display:grid}',
    '.d{white-space:normal}',
    '.it[aria-current="page"] .l::after{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--g);margin-left:7px;vertical-align:middle;box-shadow:0 0 8px var(--g)}',
    '.it[aria-current="page"] .l::after{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--g);margin-left:7px;vertical-align:middle;box-shadow:0 0 8px var(--g)}',
    '}',
    '@media (max-width:440px){.logo svg{display:none}}',
    '@media (max-width:340px){.trig .cl{display:none}.trig{padding:0 10px}}',
    '@media (prefers-reduced-motion:reduce){.p{animation:none}}'
  ].join('');

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function GcSwitcher() { return Reflect.construct(HTMLElement, [], GcSwitcher); }
  GcSwitcher.prototype = Object.create(HTMLElement.prototype);
  GcSwitcher.prototype.constructor = GcSwitcher;
  Object.setPrototypeOf(GcSwitcher, HTMLElement);
  GcSwitcher.observedAttributes = ['current', 'safe-live'];

  GcSwitcher.prototype.connectedCallback = function () {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.render();
    var self = this;
    if (!this._onResize) {
      this._onResize = function () { if (self._dlg && self._dlg.open) self.place(); };
      window.addEventListener('resize', this._onResize);
    }
  };
  GcSwitcher.prototype.disconnectedCallback = function () {
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    this._onResize = null;
  };
  GcSwitcher.prototype.attributeChangedCallback = function () { if (this.shadowRoot) this.render(); };

  GcSwitcher.prototype.render = function () {
    var cur = (this.getAttribute('current') || '').toLowerCase();
    var safeLive = this.hasAttribute('safe-live');
    var curP = PRODUCTS.filter(function (p) { return p.id === cur; })[0];
    var items = PRODUCTS.map(function (p) {
      var soon = p.soon && !safeLive;
      var inner = '<span class="ic">' + line(p.icon) + '</span><span class="t"><span class="l">' + esc(p.label) +
        (soon ? '<span class="tag">Coming</span>' : '') + '</span><span class="d">' + esc(p.desc) + '</span></span>';
      if (soon) return '<li><div class="it soon" aria-disabled="true">' + inner + '</div></li>';
      return '<li><a class="it" href="' + p.href + '"' + (p.id === cur ? ' aria-current="page"' : '') + '>' + inner + '</a></li>';
    }).join('');
    this.shadowRoot.innerHTML = '<style>' + CSS + '</style>' +
      '<a class="logo" href="' + HOME + '" aria-label="GullyChain home"><img src="' + ICON + '" width="32" height="32" alt="">' + WORDMARK + '</a>' +
      '<button class="trig" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="GullyChain products' + (curP ? ', current: ' + esc(curP.label) : '') + '">' +
      '<span class="cl">' + esc(curP ? curP.label : 'Apps') + '</span>' + GRID + '</button>' +
      '<dialog aria-label="GullyChain products"><div class="p"><div class="hd"><b>GullyChain</b><button class="x" type="button" aria-label="Close">' + CLOSE + '</button></div>' +
      '<ul>' + items + '</ul>' +
      '<div class="ft"><span>Testnet &middot; chain 485590</span><a href="' + HOME + '">gullychain.xyz</a></div></div></dialog>';
    var self = this, root = this.shadowRoot;
    var trig = root.querySelector('.trig'), dlg = root.querySelector('dialog');
    this._dlg = dlg; this._trig = trig;
    trig.addEventListener('click', function () { if (dlg.open) self.close(); else self.open(); });
    root.querySelector('.x').addEventListener('click', function () { self.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) self.close(); });
    dlg.addEventListener('close', function () { trig.setAttribute('aria-expanded', 'false'); });
  };

  GcSwitcher.prototype.place = function () {
    var dlg = this._dlg, r = this._trig.getBoundingClientRect();
    if (window.matchMedia('(max-width:640px)').matches) { dlg.style.left = ''; dlg.style.top = ''; return; }
    var w = Math.min(440, window.innerWidth - 24);
    var left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
    dlg.style.left = left + 'px';
    dlg.style.top = (r.bottom + 8) + 'px';
  };
  GcSwitcher.prototype.open = function () {
    var dlg = this._dlg;
    if (!dlg || dlg.open) return;
    this.place();
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    this._trig.setAttribute('aria-expanded', 'true');
    var focus = dlg.querySelector('[aria-current="page"]') || dlg.querySelector('a.it');
    if (focus) focus.focus();
  };
  GcSwitcher.prototype.close = function () {
    var dlg = this._dlg;
    if (!dlg) return;
    if (typeof dlg.close === 'function' && dlg.open) dlg.close(); else dlg.removeAttribute('open');
    this._trig.setAttribute('aria-expanded', 'false');
    this._trig.focus();
  };

  window.customElements.define('gc-switcher', GcSwitcher);
  window.GC_SWITCHER_VERSION = GC_SWITCHER_VERSION;
})();
