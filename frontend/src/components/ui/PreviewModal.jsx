// src/components/ui/PreviewModal.jsx
import { useState, useEffect } from 'react';

/* ── design tokens ── */
const T = {
  bg:     '#0a090f',
  s1:     '#121118',
  s2:     '#1a1824',
  s3:     '#221f2e',
  border: '#2a273a',
  border2:'#3a3650',
  text:   '#edeaf5',
  muted:  '#7e7a96',
  faint:  '#3f3b55',
  pink:   '#b5285a',
  pink2:  '#d4537e',
  font:   "'Inter',sans-serif",
  display:"'Syne',sans-serif",
};

/* ── viewport presets ── */
const VIEWPORTS = [
  {
    id: 'desktop',
    label: 'Desktop',
    shortcut: 'D',
    width: '100%',
    frameWidth: null,
    size: '1280px',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
  {
    id: 'tablet',
    label: 'Tablet',
    shortcut: 'T',
    width: 768,
    frameWidth: 768,
    size: '768px',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
  },
  {
    id: 'mobile',
    label: 'Mobile',
    shortcut: 'M',
    width: 375,
    frameWidth: 375,
    size: '375px',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="6" y="2" width="12" height="20" rx="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
  },
];

/* ── full HTML renderer ── */
const renderToHTML = (sections) => {
  const body = sections.map(s => {
    const p = s.props || {};
    switch (s.type) {
      case 'navbar':
        return `
<nav style="display:flex;align-items:center;justify-content:space-between;
  padding:14px 40px;border-bottom:1px solid #eee;
  font-family:system-ui,sans-serif;position:sticky;top:0;background:#fff;z-index:10">
  <strong style="font-size:18px;color:#111">${p.logo || 'My Site'}</strong>
  <div>
    ${(p.links || []).map(l =>
      `<a href="#" style="margin-left:24px;text-decoration:none;color:#555;
        font-size:14px;transition:color .15s">${l}</a>`
    ).join('')}
  </div>
</nav>`;

      case 'hero':
        return `
<section style="background:${p.bg || '#fff'};padding:100px 40px;text-align:center;
  font-family:system-ui,sans-serif">
  <h1 style="font-size:clamp(28px,5vw,52px);font-weight:700;
    letter-spacing:-1px;margin-bottom:18px;color:${p.bg&&p.bg!=='#fff'?'#fff':'#111'}">
    ${p.title || ''}
  </h1>
  <p style="font-size:clamp(15px,2vw,20px);color:${p.bg&&p.bg!=='#fff'?'rgba(255,255,255,0.7)':'#666'};
    margin-bottom:32px;max-width:560px;margin-left:auto;margin-right:auto;line-height:1.6">
    ${p.subtitle || ''}
  </p>
  ${p.btnText
    ? `<a href="#" style="display:inline-block;padding:14px 32px;
        background:#b5285a;color:#fff;border-radius:10px;text-decoration:none;
        font-size:16px;font-weight:600;transition:opacity .15s">
        ${p.btnText}
      </a>`
    : ''}
</section>`;

      case 'text':
        return `
<section style="max-width:720px;margin:0 auto;padding:72px 40px;
  font-family:system-ui,sans-serif">
  <p style="font-size:18px;line-height:1.8;color:#444">
    ${p.content || ''}
  </p>
</section>`;

      case 'image':
        return p.url
          ? `<section style="padding:48px 40px;background:#f8f8f8;text-align:center;
              font-family:system-ui,sans-serif">
              <img src="${p.url}" alt="${p.alt || ''}"
                style="max-width:100%;border-radius:12px;
                  box-shadow:0 20px 60px rgba(0,0,0,0.1)">
            </section>`
          : '';

      case 'features':
        return `
<section style="padding:80px 40px;font-family:system-ui,sans-serif;background:#fafafa">
  <h2 style="text-align:center;font-size:32px;font-weight:700;
    margin-bottom:48px;letter-spacing:-0.5px;color:#111">
    ${p.title || 'Features'}
  </h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
    gap:24px;max-width:900px;margin:0 auto">
    ${(p.items || []).map(item => `
      <div style="background:#fff;border:1px solid #eee;border-radius:12px;
        padding:24px;box-shadow:0 2px 12px rgba(0,0,0,0.04)">
        <div style="width:36px;height:36px;background:rgba(181,40,90,0.08);
          border-radius:9px;margin-bottom:14px"></div>
        <strong style="font-size:15px;color:#111;display:block;margin-bottom:6px">
          ${item}
        </strong>
        <p style="font-size:13px;color:#888;line-height:1.5;margin:0">
          A short description of this feature goes here.
        </p>
      </div>`).join('')}
  </div>
</section>`;

      case 'footer':
        return `
<footer style="text-align:center;padding:28px 40px;border-top:1px solid #eee;
  font-family:system-ui,sans-serif;font-size:13px;color:#aaa">
  ${p.text || '© 2025'}
</footer>`;

      default:
        return '';
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    a:hover { opacity: 0.75; }
    @media (max-width: 640px) {
      nav { flex-direction: column; gap: 12px; padding: 14px 20px !important; }
      section { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body>${body}</body>
</html>`;
};

/* ── browser chrome frame ── */
function BrowserChrome({ vp, url }) {
  const isMobile = vp.id === 'mobile';
  const isTablet = vp.id === 'tablet';

  return (
    <div style={{
      background: T.s2,
      borderRadius: isMobile ? '28px 28px 0 0' : isTablet ? '18px 18px 0 0' : '12px 12px 0 0',
      border: `1px solid ${T.border}`,
      borderBottom: 'none',
      padding: isMobile ? '14px 16px 10px' : '10px 14px',
      flexShrink: 0,
    }}>
      {/* mobile speaker grille */}
      {isMobile && (
        <div style={{ width: 44, height: 4, background: T.border2, borderRadius: 2, margin: '0 auto 10px' }}/>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* traffic lights — desktop and tablet */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {['#f87171','#facc15','#22c55e'].map((c,i) => (
              <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.8 }}/>
            ))}
          </div>
        )}

        {/* mobile back arrow */}
        {isMobile && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={T.faint} strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        )}

        {/* address bar */}
        <div style={{
          flex: 1, height: isMobile ? 30 : 26,
          background: T.s3, border: `1px solid ${T.border}`,
          borderRadius: 6, display: 'flex', alignItems: 'center',
          padding: '0 10px', gap: 6,
        }}>
          {/* lock icon */}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke={T.faint} strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span style={{ fontSize: 11, color: T.faint, fontFamily: 'monospace', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {url || 'my-site.builder.app'}
          </span>
        </div>

        {/* reload icon — desktop */}
        {!isMobile && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={T.faint} strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        )}

        {/* mobile home indicator */}
        {isMobile && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={T.faint} strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
        )}
      </div>
    </div>
  );
}

/* ── PreviewModal ── */
export default function PreviewModal({ sections, onClose }) {
  const [activeVp, setActiveVp] = useState('desktop');
  const [zoomed, setZoomed]     = useState(false);

  const vp      = VIEWPORTS.find(v => v.id === activeVp);
  const html    = renderToHTML(sections);
  const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'd' || e.key === 'D') setActiveVp('desktop');
      if (e.key === 't' || e.key === 'T') setActiveVp('tablet');
      if (e.key === 'm' || e.key === 'M') setActiveVp('mobile');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isMobile = activeVp === 'mobile';
  const isTablet = activeVp === 'tablet';
  const isNarrow = isMobile || isTablet;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,9,15,0.96)',
      zIndex: 100,
      display: 'flex', flexDirection: 'column',
      fontFamily: T.font,
    }}>

      {/* ── top bar ── */}
      <div style={{
        height: 52,
        borderBottom: `1px solid ${T.border}`,
        background: T.s1,
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 12,
        flexShrink: 0,
      }}>
        {/* title */}
        <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>Preview</span>

        <div style={{ width: 1, height: 20, background: T.border }}/>

        {/* viewport toggle */}
        <div style={{
          display: 'flex', gap: 3,
          background: T.s2, border: `1px solid ${T.border}`,
          borderRadius: 9, padding: 3,
        }} role="group" aria-label="Viewport">
          {VIEWPORTS.map(v => {
            const active = activeVp === v.id;
            return (
              <button key={v.id}
                onClick={() => setActiveVp(v.id)}
                title={`${v.label} (${v.shortcut})`}
                aria-pressed={active}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 6, border: 'none',
                  background: active ? T.s1 : 'transparent',
                  color: active ? T.text : T.muted,
                  fontSize: 12, fontWeight: active ? 500 : 400,
                  fontFamily: T.font, cursor: 'pointer',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.35)' : 'none',
                  transition: 'all .15s',
                }}>
                {v.icon}
                {v.label}
              </button>
            );
          })}
        </div>

        {/* size pill */}
        <div style={{
          background: T.s2, border: `1px solid ${T.border}`,
          borderRadius: 6, padding: '3px 9px',
          fontSize: 11, color: T.faint, fontFamily: 'monospace',
        }}>
          {vp.size}
        </div>

        <div style={{ flex: 1 }}/>

        {/* keyboard hints */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {['D','T','M'].map(k => (
            <span key={k} style={{
              fontSize: 10, padding: '2px 5px', borderRadius: 4,
              background: T.s2, border: `1px solid ${T.border}`,
              color: T.faint, fontFamily: 'monospace',
            }}>{k}</span>
          ))}
          <span style={{ fontSize: 11, color: T.faint }}>to switch</span>
          <div style={{ width: 1, height: 14, background: T.border }}/>
          <span style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, background: T.s2, border: `1px solid ${T.border}`, color: T.faint, fontFamily: 'monospace' }}>Esc</span>
          <span style={{ fontSize: 11, color: T.faint }}>to close</span>
        </div>

        <button onClick={onClose}
          style={{
            background: 'transparent', border: `1px solid ${T.border}`,
            borderRadius: 8, padding: '6px 14px', fontFamily: T.font,
            fontSize: 13, color: T.text, cursor: 'pointer',
            transition: 'border-color .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.border2}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
          Close
        </button>
      </div>

      {/* ── canvas area ── */}
      <div style={{
        flex: 1, overflow: 'auto',
        background: T.bg,
        display: 'flex', justifyContent: 'center',
        alignItems: isNarrow ? 'flex-start' : 'flex-start',
        padding: isNarrow ? '32px 24px' : '24px',
        gap: 0,
      }}>
        {/* device wrapper */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          width: isNarrow ? vp.frameWidth : '100%',
          maxWidth: isNarrow ? vp.frameWidth : '100%',
          height: isNarrow ? undefined : '100%',
          minHeight: isNarrow ? 640 : undefined,
          flexShrink: 0,
          transition: 'width .25s ease, max-width .25s ease',
        }}>
          {/* mobile outer shell */}
          {isMobile && (
            <div style={{
              position: 'relative',
              background: T.s3,
              border: `2px solid ${T.border2}`,
              borderRadius: 44,
              padding: '8px',
              boxShadow: `0 0 0 1px ${T.border}, 0 32px 80px rgba(0,0,0,0.5)`,
            }}>
              {/* side buttons */}
              <div style={{ position:'absolute', right:-3, top:88, width:3, height:32, background:T.border2, borderRadius:'0 2px 2px 0' }}/>
              <div style={{ position:'absolute', left:-3, top:70, width:3, height:22, background:T.border2, borderRadius:'2px 0 0 2px' }}/>
              <div style={{ position:'absolute', left:-3, top:102, width:3, height:22, background:T.border2, borderRadius:'2px 0 0 2px' }}/>
              <div style={{ borderRadius: 36, overflow: 'hidden' }}>
                <BrowserChrome vp={vp}/>
                <iframe key={activeVp} src={blobUrl} title="Mobile preview"
                  style={{ width:'100%', height:580, border:'none', background:'#fff', display:'block' }}
                  sandbox="allow-same-origin allow-scripts"/>
                {/* home bar */}
                <div style={{ height:24, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ width:36, height:4, background:'#e5e5e5', borderRadius:2 }}/>
                </div>
              </div>
            </div>
          )}

          {/* tablet frame */}
          {isTablet && (
            <div style={{
              background: T.s3,
              border: `2px solid ${T.border2}`,
              borderRadius: 20,
              padding: '10px',
              boxShadow: `0 0 0 1px ${T.border}, 0 24px 60px rgba(0,0,0,0.4)`,
            }}>
              <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                <BrowserChrome vp={vp}/>
                <iframe key={activeVp} src={blobUrl} title="Tablet preview"
                  style={{ width: '100%', height: 680, border: 'none', background: '#fff', display: 'block' }}
                  sandbox="allow-same-origin allow-scripts"/>
              </div>
              {/* home button */}
              <div style={{ display:'flex', justifyContent:'center', paddingTop:8 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', border:`1px solid ${T.border}`, background:T.s2 }}/>
              </div>
            </div>
          )}

          {/* desktop frame */}
          {!isNarrow && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              height: '100%',
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}>
              <BrowserChrome vp={vp}/>
              <iframe key={activeVp} src={blobUrl} title="Desktop preview"
                style={{ flex: 1, border: 'none', background: '#fff', display: 'block', minHeight: 500 }}
                sandbox="allow-same-origin allow-scripts"/>
            </div>
          )}
        </div>
      </div>

      {/* ── bottom status bar ── */}
      <div style={{
        height: 32, borderTop: `1px solid ${T.border}`,
        background: T.s1, display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 16, flexShrink: 0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }}/>
          <span style={{ fontSize:11, color:T.faint }}>Live preview</span>
        </div>
        <span style={{ fontSize:11, color:T.faint }}>·</span>
        <span style={{ fontSize:11, color:T.faint }}>{sections.length} block{sections.length!==1?'s':''}</span>
        <div style={{ flex:1 }}/>
        <span style={{ fontSize:11, color:T.faint }}>Changes reflect automatically</span>
      </div>

    </div>
  );
}
