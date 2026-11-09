/*
 * Actions.
 *   toast('Swap sent', { kind: 'good|warning|critical|info', href, ms })  one stack, bottom centre, aria-live; or
 *   <gl-toast></gl-toast> placed once (created on first toast() call when absent).
 *   <gl-stepper steps="Network,Details,Review,Deploy" current="1"></gl-stepper>  numbered steps, current marked.
 *   <gl-sign-button label="Hold to sign" hold="900"></gl-sign-button>  hold-to-sign with a progress ring; states via
 *     .state = 'idle'|'signing'|'sent'|'confirmed'|'failed' (with .message). Fires `gl-sign` when the hold completes; the
 *     host does the wallet call and sets the state. Keyboard: Enter/Space held, or a second press confirms.
 */
import { define, esc, reducedMotion } from './gl-core.js';

const KIND = { good: '--gl-up', warning: '--gl-warn', critical: '--gl-down', info: '--gl-accent' };
export class GlToast extends HTMLElement {
  constructor() { super(); this._r = this.attachShadow({ mode: 'open' }); this._r.innerHTML = `<style>:host{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483000;display:grid;gap:8px;justify-items:center;pointer-events:none;width:min(440px,calc(100vw - 24px))}
.t{pointer-events:auto;display:flex;align-items:center;gap:10px;max-width:100%;padding:10px 14px 10px 12px;border-radius:14px;background:var(--gl-ink);color:var(--gl-surface);font:var(--gl-font);box-shadow:var(--gl-shadow);animation:in .22s ease-out}
.t i{width:8px;height:8px;border-radius:50%;flex:none}.t a{color:inherit;font-weight:600}.t button{margin-left:auto;background:none;border:0;color:inherit;opacity:.7;cursor:pointer;font:inherit;min-width:28px;min-height:28px}
.t.out{animation:out .2s ease-in forwards}@keyframes in{from{opacity:0;transform:translateY(8px)}}@keyframes out{to{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion:reduce){.t,.t.out{animation:none}}</style><div role="status" aria-live="polite" style="display:contents"></div>`; }
  show(msg, { kind = 'info', href = '', ms = 4500 } = {}) {
    const box = this._r.querySelector('[role=status]'), t = document.createElement('div'); t.className = 't'; t.setAttribute('part', 'toast');
    t.innerHTML = `<i style="background:var(${KIND[kind] || KIND.info})" aria-hidden="true"></i><span>${esc(msg)}</span>${href ? ` <a href="${esc(href)}">View</a>` : ''}<button type="button" aria-label="Dismiss">✕</button>`;
    const kill = () => { t.classList.add('out'); setTimeout(() => t.remove(), reducedMotion() ? 0 : 200); };
    t.querySelector('button').onclick = kill; box.prepend(t); while (box.children.length > 3) box.lastChild.remove();
    if (ms > 0) setTimeout(kill, ms); return kill;
  }
}
define('gl-toast', GlToast);
export function toast(msg, opts) {
  let el = document.querySelector('gl-toast'); if (!el) { el = document.createElement('gl-toast'); document.body.append(el); }
  return el.show(msg, opts);
}

export class GlStepper extends HTMLElement {
  static observedAttributes = ['steps', 'current'];
  constructor() { super(); this._r = this.attachShadow({ mode: 'open' }); }
  connectedCallback() { this.render(); } attributeChangedCallback() { if (this.isConnected) this.render(); }
  render() {
    const steps = (this.getAttribute('steps') || '').split(',').map((s) => s.trim()).filter(Boolean), cur = Number(this.getAttribute('current') || 0);
    this._r.innerHTML = `<style>:host{display:block;font:var(--gl-font);color:var(--gl-ink)}ol{display:flex;gap:6px;list-style:none;margin:0;padding:0;counter-reset:s;flex-wrap:wrap}
li{display:flex;align-items:center;gap:8px;color:var(--gl-muted);font-size:.9em}li:not(:last-child)::after{content:"";width:24px;height:1px;background:var(--gl-line);margin-left:2px}
b{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;border:1px solid var(--gl-line);font-size:.85em;flex:none}
li.done b{background:var(--gl-ink);color:var(--gl-surface);border-color:var(--gl-ink)}li.on{color:var(--gl-ink);font-weight:600}li.on b{border:2px solid var(--gl-accent)}</style>
<ol part="steps">${steps.map((s, i) => `<li class="${i < cur ? 'done' : i === cur ? 'on' : ''}"${i === cur ? ' aria-current="step"' : ''}><b>${i < cur ? '✓' : i + 1}</b><span>${esc(s)}</span></li>`).join('')}</ol>`;
  }
}
define('gl-stepper', GlStepper);

const LBL = { signing: 'Check your wallet…', sent: 'Sent, waiting for the block…', confirmed: 'Confirmed', failed: 'Failed' };
export class GlSignButton extends HTMLElement {
  static observedAttributes = ['label', 'hold', 'disabled'];
  constructor() { super(); this._r = this.attachShadow({ mode: 'open' }); this._state = 'idle'; this.message = ''; }
  connectedCallback() { this.render(); } attributeChangedCallback() { if (this.isConnected) this.render(); }
  get state() { return this._state; }
  set state(s) { this._state = s; this.render(); }
  render() {
    const st = this._state, idle = st === 'idle' || st === 'failed', label = idle ? (st === 'failed' ? 'Try again' : this.getAttribute('label') || 'Hold to sign') : LBL[st];
    this._r.innerHTML = `<style>:host{display:inline-block}button{position:relative;display:inline-flex;align-items:center;gap:10px;min-height:48px;padding:0 20px 0 14px;border-radius:var(--gl-pill);border:2px solid var(--gl-ink);background:var(--gl-accent);color:var(--gl-ink);font:700 1rem/1 system-ui,sans-serif;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none}
button:disabled{opacity:.55;cursor:default}button:focus-visible{outline:2px solid var(--gl-ink);outline-offset:3px}
svg{width:26px;height:26px;transform:rotate(-90deg);flex:none}circle{fill:none;stroke-width:3}.bg{stroke:color-mix(in srgb,var(--gl-ink) 20%,transparent)}.fg{stroke:var(--gl-ink);stroke-linecap:round;stroke-dasharray:62.8;stroke-dashoffset:62.8}
.spin .fg{stroke-dashoffset:44;animation:r 1s linear infinite;transform-origin:50% 50%}@keyframes r{to{transform:rotate(360deg)}}
.ok{background:var(--gl-up);color:#fff;border-color:var(--gl-up)}.bad{background:var(--gl-surface);color:var(--gl-down);border-color:var(--gl-down)}
.msg{display:block;margin-top:6px;font:var(--gl-font);font-size:.82em;color:var(--gl-down)}@media (prefers-reduced-motion:reduce){.spin .fg{animation:none}}</style>
<button type="button" part="button" class="${st === 'confirmed' ? 'ok' : st === 'failed' ? 'bad' : ''} ${st === 'signing' || st === 'sent' ? 'spin' : ''}" ${this.hasAttribute('disabled') || !idle ? 'disabled' : ''} aria-live="polite"><svg viewBox="0 0 24 24" aria-hidden="true"><circle class="bg" cx="12" cy="12" r="10"/><circle class="fg" cx="12" cy="12" r="10"/></svg><span>${esc(label)}</span></button>${st === 'failed' && this.message ? `<span class="msg" role="alert">${esc(this.message)}</span>` : ''}`;
    if (idle) this.wire();
  }
  wire() {
    const b = this._r.querySelector('button'), fg = this._r.querySelector('.fg'), ms = reducedMotion() ? 1 : Number(this.getAttribute('hold') || 900);
    let t0 = 0, raf = 0, armed = false;
    const reset = () => { cancelAnimationFrame(raf); t0 = 0; fg.style.strokeDashoffset = '62.8'; };
    const done = () => { reset(); this.dispatchEvent(new CustomEvent('gl-sign', { bubbles: true })); };
    const step = (t) => { const k = Math.min(1, (t - t0) / ms); fg.style.strokeDashoffset = String(62.8 * (1 - k)); if (k >= 1) return done(); raf = requestAnimationFrame(step); };
    const down = (e) => { if (b.disabled || (e.type === 'keydown' && !['Enter', ' '].includes(e.key)) || e.repeat) return; e.preventDefault();
      if (e.type === 'keydown' && armed) { armed = false; return done(); } t0 = performance.now(); raf = requestAnimationFrame(step); };
    const up = (e) => { if (e.type === 'keyup' && t0 && performance.now() - t0 < ms) { armed = true; setTimeout(() => (armed = false), 3000); } reset(); };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    b.addEventListener('keydown', down); b.addEventListener('keyup', up);
  }
}
define('gl-sign-button', GlSignButton);
