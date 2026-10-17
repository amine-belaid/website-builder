// src/pages/TemplatePage.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TEMPLATES } from '../data/templates';
import useEditorStore from '../store/editorStore';
import client from '../api/client';
import { v4 as uuidv4 } from 'uuid';

const S = {
  page: { minHeight:'100vh', background:'#0a090f', fontFamily:"'Inter',sans-serif", color:'#edeaf5' },
  nav: { height:52, borderBottom:'1px solid #2a273a', display:'flex', alignItems:'center', padding:'0 28px', gap:16, position:'sticky', top:0, background:'rgba(10,9,15,0.9)', backdropFilter:'blur(12px)', zIndex:50 },
  logo: { fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:'#edeaf5', letterSpacing:'-0.3px' },
  logoSpan: { color:'#b5285a' },
  backBtn: { background:'transparent', border:'1px solid #2a273a', borderRadius:8, padding:'6px 14px', fontFamily:"'Inter',sans-serif", fontSize:13, color:'#7e7a96', cursor:'pointer' },
  navSpacer: { flex:1 },
  body: { maxWidth:960, margin:'0 auto', padding:'48px 28px' },
  heading: { fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:700, letterSpacing:'-0.5px', marginBottom:6 },
  sub: { fontSize:14, color:'#7e7a96', marginBottom:40 },
  grid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 },
  card: (sel,hov) => ({
    background:'#121118',
    border: sel ? '2px solid #b5285a' : hov ? '2px solid #3a3650' : '2px solid transparent',
    borderRadius:14, overflow:'hidden', cursor:'pointer',
    transition:'border-color .15s, transform .15s',
    transform: hov ? 'translateY(-3px)' : 'none',
  }),
  preview: (bg) => ({ height:150, background:bg||'#1a1824', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }),
  miniWrap: { width:'78%', height:'78%', background:'#0d0c12', border:'1px solid #2a273a', borderRadius:6, overflow:'hidden', display:'flex', flexDirection:'column' },
  miniNav: { height:12, background:'#1a1824', borderBottom:'1px solid #2a273a', display:'flex', alignItems:'center', padding:'0 5px', gap:2 },
  miniDot: (c) => ({ width:3, height:3, borderRadius:'50%', background:c }),
  miniBody: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:6 },
  miniLine: (w,h,c) => ({ width:w, height:h, background:c, borderRadius:2 }),
  cardInfo: { padding:'12px 14px', background:'#0d0c12', borderTop:'1px solid #2a273a', display:'flex', alignItems:'center', justifyContent:'space-between' },
  cardName: { fontSize:13, fontWeight:500, color:'#edeaf5' },
  cardBadge: (pop) => ({ fontSize:10, padding:'2px 7px', borderRadius:4, background: pop?'rgba(181,40,90,0.12)':'#1a1824', border:`1px solid ${pop?'rgba(181,40,90,0.3)':'#2a273a'}`, color: pop?'#d4537e':'#3f3b55' }),
  selectedBadge: { position:'absolute', top:8, right:8, background:'#b5285a', borderRadius:6, padding:'3px 8px', fontSize:10, fontWeight:600, color:'#fff' },
  continueWrap: { marginTop:36, display:'flex', justifyContent:'flex-end', alignItems:'center', gap:14 },
  continueHint: { fontSize:13, color:'#3f3b55' },
  continueBtn: (active) => ({ background: active?'#b5285a':'#1a1824', border:`1px solid ${active?'#b5285a':'#2a273a'}`, borderRadius:10, padding:'11px 28px', fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color: active?'#fff':'#3f3b55', cursor: active?'pointer':'not-allowed', transition:'all .15s' }),
};

const TPL_PREVIEWS = {
  blank:     () => <div style={{...S.miniBody, gap:6}}><div style={S.miniLine('40%',4,'#2a273a')}/><div style={S.miniLine('28%',3,'#1a1824')}/></div>,
  landing:   () => <><div style={S.miniLine('60%',5,'#2a273a')}/><div style={S.miniLine('42%',3,'#1a1824')}/><div style={{...S.miniLine('24%',6,'rgba(181,40,90,0.5)'), marginTop:4}}/></>,
  portfolio: () => <><div style={{width:'72%',height:24,background:'#1a1824',borderRadius:3,marginBottom:5,border:'1px solid #2a273a'}}/><div style={S.miniLine('48%',4,'#2a273a')}/><div style={S.miniLine('34%',3,'#1a1824')}/></>,
};

export default function TemplatePage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  // Récupère l'objet state passé lors de la redirection
  // depuis le Dashboard (navigate('/templates', { state: { siteId: data.id } })).
  // Il permet à cette page de savoir pour quel site nous choisissons un template.
  const { setSections } = useEditorStore();
  const [selected, setSelected] = useState(null);
  const [hovId, setHovId]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const pick = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const template = TEMPLATES.find(t => t.id === selected);
          // Give each section a unique ID
      const sections = template.sections.map(s => ({ ...s, id: uuidv4() }));
          // Load template into editor store

      setSections(sections);
          // Get the home page ID for this site

      const { data: pages } = await client.get(`/sites/${state.siteId}/pages`);
      let pageId;
    if (pages.length > 0) {
      pageId = pages[0].id;
    } else {
      // 2. Si aucune page n'existe, on la crée à la volée
      const { data: newPage } = await client.post(`/sites/${state.siteId}/pages`, { title: 'Home' });
      pageId = newPage.id;
    }
          // Save template sections to the backend

      await client.put(`/pages/${pageId}/sections`, { sections });
      navigate(`/editor/${pageId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Syne:wght@700&display=swap" rel="stylesheet"/>
      <nav style={S.nav}>
        <button style={S.backBtn} onClick={()=>navigate('/')}>← Back</button>
        <div style={S.navSpacer}/>
        <span style={S.logo}>Build<span style={S.logoSpan}>er</span></span>
      </nav>
      <div style={S.body}>
        <h1 style={S.heading}>Choose a template</h1>
        <p style={S.sub}>Pick a starting point — you can customise every block after.</p>
        <div style={S.grid}>
          {TEMPLATES.map(t => {
            const isSel = selected === t.id;
            const isHov = hovId === t.id;
            const Preview = TPL_PREVIEWS[t.id];
            return (
              <div key={t.id} style={S.card(isSel, isHov)}
                onClick={()=>setSelected(t.id)}
                onMouseEnter={()=>setHovId(t.id)}
                onMouseLeave={()=>setHovId(null)}>
                <div style={S.preview('#0d0c12')}>
                  <div style={S.miniWrap}>
                    <div style={S.miniNav}>
                      <div style={S.miniDot('#f87171')}/>
                      <div style={S.miniDot('#facc15')}/>
                      <div style={S.miniDot('#22c55e')}/>
                    </div>
                    <div style={S.miniBody}>
                      {Preview ? <Preview/> : <div style={S.miniLine('50%',4,'#2a273a')}/>}
                    </div>
                  </div>
                  {isSel && <div style={S.selectedBadge}>✓ Selected</div>}
                </div>
                <div style={S.cardInfo}>
                  <span style={S.cardName}>{t.name}</span>
                  <span style={S.cardBadge(t.id==='landing')}>{t.id==='landing'?'Popular':t.id==='blank'?'Empty':'Template'}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={S.continueWrap}>
          {!selected && <span style={S.continueHint}>Select a template to continue</span>}
          <button style={S.continueBtn(!!selected)} onClick={pick} disabled={!selected||loading}>
            {loading ? 'Setting up…' : 'Start building →'}
          </button>
        </div>
      </div>
    </div>
  );
}
