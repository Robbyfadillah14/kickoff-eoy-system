"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BRAND, THEMES, themeVars } from "../../lib/presentation/theme.js";

export const STAGE_W = 1360;
export const STAGE_H = 720;

const Svg = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const ICON = {
  prev: "M15 18l-6-6 6-6",
  next: "M9 18l6-6-6-6",
  play: "M6 4l14 8-14 8z",
  pause: "M8 5v14M16 5v14",
  full: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  down: "M12 3v12M7 10l5 5 5-5M5 21h14",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
};

/**
 * Cangkang presentasi tunggal untuk semua deck.
 * - Panggung tetap 1360x720 lalu di-scale (min(w/h)) -> tampilan sama di layar manapun, tidak ada scroll.
 * - SATU-satunya pemilik keyboard (←/→/Space/PgUp/PgDn/Home/End, F fullscreen, P autoplay).
 *   Hanya aktif saat `active` true, jadi banyak deck di satu halaman tidak saling rebut tombol.
 *
 * slides: [{ id, label, node }]
 */
const stageBg = (accent, theme = "light") => `radial-gradient(circle at 1px 1px, var(--dk-dot) 1px, transparent 0) 0 0/28px 28px, radial-gradient(1000px 560px at 88% -15%, ${accent}${theme === "dark" ? "33" : "26"}, transparent 62%), radial-gradient(800px 480px at -8% 112%, ${BRAND.emerald}${theme === "dark" ? "22" : "1c"}, transparent 62%), var(--dk-bg)`;

/** Footer panggung (sama untuk layar & cetak) */
const StageFooter = ({ index, total, accent = BRAND.cyan, bare = false }) => bare ? null : (
  <>
    <div aria-hidden style={{ position: "absolute", left: 0, top: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${BRAND.cyan}, ${BRAND.emerald} 40%, #a78bfa 70%, ${BRAND.warn})` }} />
    {index != null && total > 1 && <div aria-hidden style={{ position: "absolute", left: 0, top: 4, height: 2, width: `${((index + 1) / total) * 100}%`, background: accent, opacity: 0.9, transition: "width .4s" }} />}
    <div style={{ position: "absolute", left: 56, right: 56, bottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, letterSpacing: 3, color: BRAND.muted }}>
      <span style={{ fontWeight: 700 }}>{BRAND.name.toUpperCase()}</span>
      <span>{index != null ? <b style={{ color: BRAND.text, fontSize: 14, letterSpacing: 1 }}>{String(index + 1).padStart(2, "0")}<span style={{ color: BRAND.muted, fontWeight: 400 }}> / {String(total).padStart(2, "0")}</span></b> : BRAND.tagline}</span>
    </div>
  </>
);

/**
 * Unduh PDF: semua slide dirender berurutan di luar layar (portal ke <body>), 1 slide = 1 halaman 1360x720,
 * lalu window.print() -> pilih "Simpan sebagai PDF". Tampilan sama persis dengan layar (bukan tangkapan layar).
 * fileName dipakai sebagai nama file (browser memakai document.title).
 */
export default function DeckShell({ title, subtitle, slides, accent = BRAND.cyan, active = true, autoplayMs = 9000, onClose, fileName, printable = true, lockTheme = null, bare = false, stageBgOverride = null, defaultTheme = "light" }) {
  const [printing, setPrinting] = useState(false);
  // tema deck: terang (default, nyaman dibaca di ruang rapat & saat dicetak) atau gelap; pilihan diingat per browser
  const [theme0, setTheme] = useState(defaultTheme);
  const theme = lockTheme || theme0;
  useEffect(() => { if (lockTheme) return; try { const t = localStorage.getItem("dk-theme"); if (t === "dark" || t === "light") setTheme(t); } catch {} }, []);
  const toggleTheme = useCallback(() => setTheme((t) => { const n = t === "dark" ? "light" : "dark"; try { localStorage.setItem("dk-theme", n); } catch {} return n; }), []);
  const vars = themeVars(theme);
  const printDeck = useCallback(() => {
    const prev = document.title;
    const done = () => { document.title = prev; setPrinting(false); window.removeEventListener("afterprint", done); };
    document.title = fileName || title || prev;
    setPrinting(true);
    window.addEventListener("afterprint", done);
    // beri waktu React merender semua halaman cetak sebelum dialog cetak dibuka
    setTimeout(() => { try { window.print(); } catch { done(); } }, 350);
  }, [fileName, title]);

  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [scale, setScale] = useState(1);
  const boxRef = useRef(null);
  const wrapRef = useRef(null);
  const n = slides.length;

  const go = useCallback((to) => setI((p) => Math.max(0, Math.min(n - 1, typeof to === "function" ? to(p) : to))), [n]);
  const toggleFull = useCallback(() => {
    const el = wrapRef.current; if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.(); else el.requestFullscreen?.();
  }, []);

  useEffect(() => { if (i > n - 1) setI(Math.max(0, n - 1)); }, [n, i]);

  useEffect(() => {
    const el = boxRef.current; if (!el) return;
    const fit = () => { const r = el.getBoundingClientRect(); if (r.width && r.height) setScale(Math.min(r.width / STAGE_W, r.height / STAGE_H)); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      const t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === "ArrowRight" || k === "PageDown" || k === " ") { e.preventDefault(); go((p) => p + 1); }
      else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); go((p) => p - 1); }
      else if (k === "Home") go(0);
      else if (k === "End") go(n - 1);
      else if (k === "f" || k === "F") toggleFull();
      else if (k === "p" || k === "P") setPlaying((v) => !v);
      else if (k === "Escape" && onClose && !document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go, n, toggleFull, onClose]);

  useEffect(() => {
    if (!playing || !active) return;
    const t = setInterval(() => setI((p) => { if (p >= n - 1) { setPlaying(false); return p; } return p + 1; }), autoplayMs);
    return () => clearInterval(t);
  }, [playing, active, n, autoplayMs]);

  const cur = slides[i];
  const btn = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 10, border: `1px solid ${BRAND.line}`, background: BRAND.panel, color: BRAND.text, cursor: "pointer" };

  return (
    <div ref={wrapRef} style={{ ...vars, background: BRAND.bg, color: BRAND.text, display: "flex", flexDirection: "column", width: "100%", height: "100%", minHeight: 360, fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes dk-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes dk-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .dk-slide{animation:dk-rise .45s cubic-bezier(.2,.7,.2,1) both}
        .dk-rise{animation:dk-rise .5s cubic-bezier(.2,.7,.2,1) both}
        .dk-glass:not([style*="grid"]){display:flex;flex-direction:column;justify-content:center}
        .dk-body>div:not(.dk-cover){height:100%;display:flex;flex-direction:column}
        .dk-body>div:not(.dk-cover)>:last-child:not(:first-child){flex:1 1 0;min-height:0}
        @media (prefers-reduced-motion:reduce){.dk-slide,.dk-rise{animation:none}}
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: `1px solid ${BRAND.line}` }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: accent }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: BRAND.muted }}>{subtitle}</div>}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11, color: BRAND.muted, fontVariantNumeric: "tabular-nums" }}>{cur?.label} · {i + 1}/{n}</div>
        <button aria-label={playing ? "Jeda" : "Putar otomatis"} onClick={() => setPlaying((v) => !v)} style={btn}><Svg d={playing ? ICON.pause : ICON.play} /></button>
        {printable && <button aria-label="Unduh PDF" title="Unduh PDF (simpan sebagai PDF di dialog cetak)" onClick={printDeck} disabled={printing} style={{ ...btn, width: "auto", padding: "0 12px", gap: 6, fontSize: 12, fontWeight: 700, opacity: printing ? 0.5 : 1 }}><Svg d={ICON.down} size={14} />PDF</button>}
        {!lockTheme && <button aria-label={theme === "dark" ? "Tema terang" : "Tema gelap"} title={theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap"} onClick={toggleTheme} style={btn}><Svg d={theme === "dark" ? ICON.sun : ICON.moon} /></button>}
        <button aria-label="Layar penuh" onClick={toggleFull} style={btn}><Svg d={ICON.full} /></button>
      </div>

      <div ref={boxRef} style={{ position: "relative", flex: 1, minHeight: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: STAGE_W, height: STAGE_H, flex: "none", transform: `scale(${scale})`, transformOrigin: "center center", position: "relative",
          background: stageBgOverride || stageBg(accent, theme) }}>
          <div key={cur?.id ?? i} className="dk-slide dk-body" style={{ position: "absolute", inset: 0, padding: bare ? "20px 20px 20px" : "48px 56px 52px" }}>{cur?.node}</div>
          <StageFooter index={i} total={n} accent={accent} bare={bare} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", borderTop: `1px solid ${BRAND.line}` }}>
        <button aria-label="Sebelumnya" disabled={i === 0} onClick={() => go(i - 1)} style={{ ...btn, opacity: i === 0 ? 0.35 : 1 }}><Svg d={ICON.prev} /></button>
        <div style={{ flex: 1, display: "flex", gap: 6, justifyContent: "center" }}>
          {slides.map((s, k) => (
            <button key={s.id} title={s.label} aria-label={s.label} onClick={() => go(k)}
              style={{ height: 6, width: k === i ? 28 : 12, borderRadius: 99, border: 0, cursor: "pointer", background: k === i ? accent : k < i ? `${accent}66` : BRAND.track, transition: "all .25s" }} />
          ))}
        </div>
        <button aria-label="Berikutnya" disabled={i === n - 1} onClick={() => go(i + 1)} style={{ ...btn, background: accent, color: "var(--dk-on-accent, #04141a)", border: 0, opacity: i === n - 1 ? 0.35 : 1 }}><Svg d={ICON.next} /></button>
      </div>

      {printing && typeof document !== "undefined" && createPortal(
        <div className="dk-print-root" style={vars}>
          <style>{`
            .dk-print-root{position:fixed;left:-99999px;top:0}
            @page{size:${STAGE_W}px ${STAGE_H}px;margin:0}
            @media print{
              html,body{margin:0!important;padding:0!important;background:${THEMES[theme].bg}!important}
              body>*:not(.dk-print-root){display:none!important}
              .dk-print-root{position:static!important;left:auto!important}
              .dk-print-page{width:${STAGE_W}px;height:${STAGE_H}px;position:relative;overflow:hidden;break-after:page;page-break-after:always;-webkit-print-color-adjust:exact;print-color-adjust:exact}
              .dk-print-page:last-child{break-after:auto;page-break-after:auto}
              .dk-print-page *{animation:none!important}
              .dk-glass:not([style*="grid"]){display:flex;flex-direction:column;justify-content:center}
              .dk-body>div:not(.dk-cover){height:100%;display:flex;flex-direction:column}
              .dk-body>div:not(.dk-cover)>:last-child:not(:first-child){flex:1 1 0;min-height:0}
            }
          `}</style>
          {slides.map((sl, k) => (
            <div key={sl.id} className="dk-print-page" style={{ background: stageBgOverride || stageBg(accent, theme), color: BRAND.text, fontFamily: "ui-sans-serif, system-ui, 'Segoe UI', sans-serif" }}>
              <div className="dk-body" style={{ position: "absolute", inset: 0, padding: bare ? "20px 20px 20px" : "48px 56px 52px" }}>{sl.node}</div>
              <StageFooter index={k} total={slides.length} accent={accent} bare={bare} />
            </div>
          ))}
        </div>, document.body)}
    </div>
  );
}