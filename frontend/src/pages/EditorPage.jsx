// src/pages/EditorPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useEditorStore from '../store/editorStore';
import client from '../api/client';
import PropPanel from '../components/editor/PropPanel';
import {
  DndContext, closestCenter,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  arrayMove, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';

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
  green:  '#22c55e',
  amber:  '#facc15',
  font:   "'Inter',sans-serif",
  display:"'Syne',sans-serif",
};

/* ── block defaults ── */
const DEFAULTS = {
  navbar:   { logo:'My Site', links:['Home','About','Contact'] },
  hero:     { title:'Build something great', subtitle:'The easiest way to launch your site today.', btnText:'Get started', bg:'#0a090f' },
  text:     { content:'Write something here. This paragraph block supports any length of text content.' },
  image:    { url:'', alt:'My image' },
  features: { title:'Why choose us', items:['Lightning fast','Easy to use','Always available'] },
  footer:   { text:'© 2025 My Site. All rights reserved.' },
};

const BLOCK_TYPES = [
  { type:'navbar',   label:'Navbar',    desc:'Header + nav links',   icon:'M3 6h18M3 12h18M3 18h18' },
  { type:'hero',     label:'Hero',      desc:'Headline + CTA button', icon:'M2 3h20v10H2zM8 21h8M12 13v8' },
  { type:'text',     label:'Text',      desc:'Paragraph content',     icon:'M4 6h16M4 10h16M4 14h10' },
  { type:'image',    label:'Image',     desc:'Photo or graphic',      icon:'M21 15l-5-5L5 21M3 3h18v18H3zM8.5 8.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' },
  { type:'features', label:'Features',  desc:'3-column grid',         icon:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
  { type:'footer',   label:'Footer',    desc:'Bottom bar',            icon:'M3 18h18M3 6h18M9 12h6' },
];

/* ── block preview renderers ── */
function BlockPreview({ section }) {
  const p = section.props;
  switch (section.type) {
    case 'navbar': return (
      <div style={{ display:'flex', alignItems:'center', padding:'8px 14px', background:T.s1, gap:12 }}>
        <strong style={{ fontSize:12, color:T.text }}>{p.logo||'My Site'}</strong>
        <div style={{ display:'flex', gap:10, marginLeft:'auto' }}>
          {(p.links||[]).map((l,i)=>(
            <span key={i} style={{ fontSize:10, color:T.muted }}>{l}</span>
          ))}
        </div>
      </div>
    );
    case 'hero': return (
      <div style={{ padding:'20px 14px', textAlign:'center', background:p.bg||'transparent' }}>
        <div style={{ fontFamily:T.display, fontSize:16, fontWeight:700, marginBottom:5, color:T.text, letterSpacing:'-0.3px' }}>
          {p.title||'Your headline'}
        </div>
        <div style={{ fontSize:11, color:T.muted, marginBottom:10 }}>{p.subtitle||''}</div>
        {p.btnText && (
          <div style={{ display:'inline-block', padding:'5px 14px', background:T.pink, borderRadius:6, fontSize:11, color:'#fff' }}>
            {p.btnText}
          </div>
        )}
      </div>
    );
    case 'text': return (
      <div style={{ padding:'10px 14px' }}>
        <p style={{ fontSize:12, color:T.muted, lineHeight:1.6, margin:0 }}>
          {(p.content||'').slice(0,120)}{(p.content||'').length>120?'…':''}
        </p>
      </div>
    );
    case 'image': return (
      <div style={{ padding:'10px 14px' }}>
        {p.url
          ? <img src={p.url} alt={p.alt} style={{ width:'100%', height:56, objectFit:'cover', borderRadius:6 }}/>
          : <div style={{ height:44, background:T.s3, borderRadius:6, border:`1px dashed ${T.border2}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:T.faint }}>
              No image — paste URL in panel →
            </div>
        }
      </div>
    );
    case 'features': return (
      <div style={{ padding:'10px 14px' }}>
        <div style={{ fontSize:11, fontWeight:500, color:T.text, marginBottom:6 }}>{p.title||'Features'}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
          {(p.items||[]).map((item,i)=>(
            <div key={i} style={{ background:T.s3, borderRadius:6, padding:8, border:`1px solid ${T.border}` }}>
              <div style={{ width:16, height:16, background:'rgba(181,40,90,0.2)', borderRadius:4, marginBottom:4 }}/>
              <div style={{ fontSize:10, color:T.text, fontWeight:500 }}>{item}</div>
            </div>
          ))}
        </div>
      </div>
    );
    case 'footer': return (
      <div style={{ padding:'8px 14px', textAlign:'center', fontSize:11, color:T.faint }}>
        {p.text||'© 2025'}
      </div>
    );
    default: return (
      <div style={{ padding:'10px 14px', fontSize:11, color:T.faint }}>{section.type} block</div>
    );
  }
}

/* ── sortable section card ── */
function SortableSection({ section }) {
  const { selectedId, setSelected, removeSection, setSaveStatus } = useEditorStore();
  const isSelected = section.id === selectedId;
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex:  isDragging ? 999 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        onClick={() => setSelected(section.id)}
        style={{
          border: `1px solid ${isSelected ? T.pink : T.border}`,
          borderRadius: 10,
          background: T.s1,
          overflow: 'hidden',
          cursor: 'pointer',
          marginBottom: 8,
          transition: 'border-color .15s',
          position: 'relative',
          boxShadow: isSelected ? `0 0 0 1px ${T.pink}22` : 'none',
        }}
      >
        {/* top bar */}
        <div style={{
          display:'flex', alignItems:'center', gap:7,
          padding:'6px 10px', background:T.s2,
          borderBottom:`1px solid ${T.border}`,
        }}>
          {/* drag handle */}
          <div {...listeners} {...attributes}
            style={{ cursor: isDragging?'grabbing':'grab', display:'flex', flexDirection:'column', gap:2, padding:'3px 2px', flexShrink:0 }}
            title="Drag to reorder">
            {[0,1,2].map(i=>(
              <span key={i} style={{ display:'block', width:12, height:1.5, background:T.faint, borderRadius:1 }}/>
            ))}
          </div>

          {/* type badge */}
          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:T.bg, border:`1px solid ${T.border}`, color:T.muted, fontFamily:'monospace' }}>
            {section.type}
          </span>

          {isSelected && (
            <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'rgba(181,40,90,0.12)', color:T.pink2 }}>
              editing
            </span>
          )}

          <div style={{ flex:1 }}/>

          {/* delete */}
          <button
            onClick={e => { e.stopPropagation(); removeSection(section.id); setSaveStatus('unsaved'); }}
            style={{ width:22, height:22, borderRadius:5, background:'transparent', border:'none', cursor:'pointer', color:T.faint, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'color .12s' }}
            onMouseEnter={e=>e.currentTarget.style.color='#f87171'}
            onMouseLeave={e=>e.currentTarget.style.color=T.faint}
            title="Delete section">✕</button>
        </div>

        {/* preview */}
        <BlockPreview section={section}/>
      </div>
    </div>
  );
}

/* ── left panel ── */
function BlockPalette() {
  const { addSection } = useEditorStore();
  return (
    <div style={{ width:196, borderRight:`1px solid ${T.border}`, background:T.s1, display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
      <div style={{ padding:'12px 14px 8px', fontSize:10, fontWeight:500, color:T.faint, textTransform:'uppercase', letterSpacing:'.5px', borderBottom:`1px solid ${T.border}` }}>
        Blocks
      </div>
      {BLOCK_TYPES.map(b => (
        <div key={b.type}
          onClick={() => addSection(b.type)}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom:`1px solid ${T.border}`, transition:'background .12s' }}
          onMouseEnter={e=>e.currentTarget.style.background=T.s2}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <div style={{ width:30, height:30, borderRadius:7, background:T.s2, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={b.icon}/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:500, color:T.text }}>{b.label}</div>
            <div style={{ fontSize:10, color:T.faint }}>{b.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── center canvas ── */
function Canvas() {
  const { sections, reorderSections, setSaveStatus } = useEditorStore();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint:{ distance:8 } }));
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oi = sections.findIndex(s=>s.id===active.id);
    const ni = sections.findIndex(s=>s.id===over.id);
    reorderSections(arrayMove(sections, oi, ni));
    setSaveStatus('unsaved');
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map(s=>s.id)} strategy={verticalListSortingStrategy}>
        <div style={{ flex:1, overflowY:'auto', background:T.bg, padding:20, display:'flex', flexDirection:'column' }}>

          {/* canvas label */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <div style={{ flex:1, height:1, background:T.border }}/>
            <span style={{ fontSize:10, color:T.faint, letterSpacing:'.4px', textTransform:'uppercase' }}>Canvas</span>
            <div style={{ flex:1, height:1, background:T.border }}/>
          </div>

          {sections.length === 0 ? (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:`1px dashed ${T.border}`, borderRadius:12, gap:12, padding:40, minHeight:320 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:T.s2, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <p style={{ fontSize:13, color:T.faint, textAlign:'center', margin:0 }}>
                Click a block from the left panel<br/>to start building
              </p>
            </div>
          ) : (
            <>
              {sections.map(section => (
                <SortableSection key={section.id} section={section}/>
              ))}

              {/* drop hint at bottom */}
              <div style={{ border:`1px dashed ${T.border}`, borderRadius:8, padding:'12px', textAlign:'center', fontSize:11, color:T.faint, marginTop:4 }}>
                + Add more blocks from the left panel
              </div>
            </>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}



/* ── preview modal ── */
function buildHTML(sections) {
  const body = sections.map(s => {
    const p = s.props||{};
    switch(s.type) {
      case 'navbar': return `<nav style="display:flex;align-items:center;justify-content:space-between;padding:14px 40px;border-bottom:1px solid #eee;font-family:system-ui,sans-serif"><strong style="font-size:18px">${p.logo||'My Site'}</strong><div>${(p.links||[]).map(l=>`<a href="#" style="margin-left:20px;text-decoration:none;color:#333;font-size:14px">${l}</a>`).join('')}</div></nav>`;
      case 'hero':   return `<section style="background:${p.bg||'#fff'};padding:80px 40px;text-align:center;font-family:system-ui,sans-serif"><h1 style="font-size:42px;margin-bottom:14px">${p.title||''}</h1><p style="font-size:18px;color:#666;margin-bottom:24px">${p.subtitle||''}</p>${p.btnText?`<a href="#" style="display:inline-block;padding:12px 28px;background:#b5285a;color:#fff;border-radius:8px;text-decoration:none;font-size:15px">${p.btnText}</a>`:''}</section>`;
      case 'text':   return `<section style="max-width:720px;margin:0 auto;padding:60px 40px;font-family:system-ui,sans-serif"><p style="font-size:17px;line-height:1.8;color:#444">${p.content||''}</p></section>`;
      case 'image':  return p.url?`<section style="text-align:center;padding:40px;background:#f8f8f8"><img src="${p.url}" alt="${p.alt||''}" style="max-width:100%;border-radius:10px"></section>`:'';
      case 'features': return `<section style="padding:60px 40px;font-family:system-ui,sans-serif"><h2 style="text-align:center;font-size:28px;margin-bottom:32px">${p.title||'Features'}</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:900px;margin:0 auto">${(p.items||[]).map(item=>`<div style="background:#f8f8f8;border-radius:10px;padding:20px"><strong>${item}</strong></div>`).join('')}</div></section>`;
      case 'footer': return `<footer style="text-align:center;padding:24px;border-top:1px solid #eee;font-family:system-ui,sans-serif;font-size:13px;color:#999">${p.text||''}</footer>`;
      default: return '';
    }
  }).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif}</style></head><body>${body}</body></html>`;
}

const VIEWPORTS = [
  { id:'desktop', label:'Desktop', width:'100%' },
  { id:'tablet',  label:'Tablet',  width:768 },
  { id:'mobile',  label:'Mobile',  width:375 },
];

function PreviewModal({ onClose }) {
  const { sections } = useEditorStore();
  const [vp, setVp] = useState('desktop');
  const html    = buildHTML(sections);
  const blobUrl = URL.createObjectURL(new Blob([html], { type:'text/html' }));
  const width   = VIEWPORTS.find(v=>v.id===vp).width;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,9,15,0.94)', zIndex:200, display:'flex', flexDirection:'column' }}>
      <div style={{ height:50, borderBottom:`1px solid ${T.border}`, background:T.s1, display:'flex', alignItems:'center', padding:'0 16px', gap:10, flexShrink:0 }}>
        <span style={{ fontSize:13, fontWeight:500, color:T.text, flex:1 }}>Preview</span>
        <div style={{ display:'flex', gap:3, background:T.s2, border:`1px solid ${T.border}`, borderRadius:8, padding:3 }}>
          {VIEWPORTS.map(v=>(
            <button key={v.id} onClick={()=>setVp(v.id)}
              style={{ padding:'4px 12px', borderRadius:6, border:'none', fontFamily:T.font, fontSize:12, fontWeight:vp===v.id?500:400, background:vp===v.id?T.s1:'transparent', color:vp===v.id?T.text:T.muted, cursor:'pointer', boxShadow:vp===v.id?'0 1px 3px rgba(0,0,0,0.3)':'' }}>
              {v.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize:11, color:T.faint, fontFamily:'monospace', minWidth:50, textAlign:'right' }}>
          {vp==='desktop'?'1280px':vp==='tablet'?'768px':'375px'}
        </span>
        <button onClick={onClose}
          style={{ background:'transparent', border:`1px solid ${T.border}`, borderRadius:7, padding:'5px 12px', fontFamily:T.font, fontSize:13, color:T.muted, cursor:'pointer' }}>
          Close
        </button>
      </div>
      <div style={{ flex:1, overflow:'auto', background:T.bg, display:'flex', justifyContent:'center', padding:24 }}>
        <iframe key={vp} src={blobUrl} title="Preview"
          style={{ width, maxWidth:width, flex:'none', border:`1px solid ${T.border}`, borderRadius:10, background:'#fff', height:'100%', minHeight:500 }}
          sandbox="allow-same-origin allow-scripts"/>
      </div>
    </div>
  );
}

/* ── publish modal ── */
function PublishModal({ url, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,9,15,0.88)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:T.s1, border:`1px solid ${T.border}`, borderRadius:16, padding:32, maxWidth:380, width:'100%', textAlign:'center' }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p style={{ fontFamily:T.display, fontSize:18, fontWeight:700, marginBottom:6 }}>Published!</p>
        <p style={{ fontSize:13, color:T.muted, marginBottom:16 }}>Your site is live at:</p>
        <div style={{ background:T.s2, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 14px', fontSize:12, fontFamily:'monospace', color:T.pink2, wordBreak:'break-all', marginBottom:20 }}>
          {url}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href={url} target="_blank" rel="noreferrer"
            style={{ flex:1, padding:'9px', background:T.pink, border:'none', borderRadius:9, fontFamily:T.font, fontSize:13, fontWeight:600, color:'#fff', textDecoration:'none', display:'block', textAlign:'center' }}>
            Open site ↗
          </a>
          <button onClick={onClose}
            style={{ flex:1, padding:'9px', background:T.s2, border:`1px solid ${T.border}`, borderRadius:9, fontFamily:T.font, fontSize:13, color:T.text, cursor:'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── main toolbar ── */
function Toolbar({ pageId, onPreview }) {
  const navigate = useNavigate();
  const { saveStatus , sections } = useEditorStore();
  const [publishing, setPublishing] = useState(false);
  const [pubUrl, setPubUrl]         = useState(null);

  const statusColor = saveStatus==='saved'?T.green : saveStatus==='saving'?T.amber : T.muted;
  const statusLabel = { saved:'Saved', saving:'Saving…', unsaved:'Unsaved changes' }[saveStatus]||'Saved';

const handlePublish = async () => {
  setPublishing(true);
  try {
   

        console.log('pageId:', pageId);

    // get the site_id from the page
    const { data: page } = await client.get(`/pages/${pageId}`);
    console.log('page response:', page);
    console.log('site_id:', page.site_id);
    console.log('************************************************');



     await client.put(`/pages/${pageId}/sections`, { sections } );
    console.log('Sections saved before publish:', sections.length);

    // call publish endpoint
    const { data } = await client.post(`/sites/${page.site_id}/publish`);

    // show the live URL
    setPubUrl(data.url);

  } catch (err) {
    console.log('error status:', err.response?.status);
    console.log('error data:', err.response?.data);
    alert(err.response?.data?.error || err.message);
  } finally {
    setPublishing(false);
  }
};

  return (
    <>
      <div style={{ height:52, borderBottom:`1px solid ${T.border}`, background:'rgba(10,9,15,0.95)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', padding:'0 14px', gap:10, flexShrink:0, zIndex:40 }}>
        <button onClick={()=>navigate('/')}
          style={{ background:'transparent', border:`1px solid ${T.border}`, borderRadius:7, padding:'5px 10px', fontFamily:T.font, fontSize:12, color:T.muted, cursor:'pointer', display:'flex', alignItems:'center', gap:4, transition:'border-color .15s' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.border2}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
          ← Dashboard
        </button>
        <div style={{ width:1, height:24, background:T.border }}/>
        <span style={{ fontFamily:T.display, fontSize:14, fontWeight:700, color:T.text, letterSpacing:'-0.3px' }}>
          Build<span style={{ color:T.pink }}>er</span>
        </span>
        <div style={{ flex:1 }}/>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:statusColor }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:statusColor, display:'inline-block' }}/>
          {statusLabel}
        </div>
        <button onClick={onPreview}
          style={{ background:'transparent', border:`1px solid ${T.border}`, borderRadius:8, padding:'6px 14px', fontFamily:T.font, fontSize:13, color:T.text, cursor:'pointer', transition:'border-color .15s' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.border2}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
          Preview
        </button>
        <button onClick={handlePublish} disabled={publishing}
          style={{ background:T.pink, border:'none', borderRadius:8, padding:'7px 18px', fontFamily:T.font, fontSize:13, fontWeight:600, color:'#fff', cursor:publishing?'not-allowed':'pointer', opacity:publishing?0.7:1, transition:'background .15s' }}
          onMouseEnter={e=>{ if(!publishing) e.currentTarget.style.background=T.pink2; }}
          onMouseLeave={e=>e.currentTarget.style.background=T.pink}>
          {publishing ? 'Publishing…' : 'Publish'}
        </button>
      </div>

      {pubUrl && <PublishModal url={pubUrl} onClose={()=>setPubUrl(null)}/>}
    </>
  );
}

/* ── EditorPage ── */
export default function EditorPage() {
  const { pageId } = useParams();
  const { sections, setSections, saveStatus, setSaveStatus } = useEditorStore();
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    client.get(`/pages/${pageId}/sections`).then(r => setSections(r.data));
  }, [pageId]);

  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await client.put(`/pages/${pageId}/sections`, { sections });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('unsaved');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [sections, saveStatus]);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:T.bg, fontFamily:T.font, color:T.text, overflow:'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Syne:wght@700&display=swap" rel="stylesheet"/>
      <Toolbar pageId={pageId} onPreview={()=>setShowPreview(true)}/>
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <BlockPalette/>
        <Canvas/>
        <PropPanel/>
      </div>
      {showPreview && <PreviewModal onClose={()=>setShowPreview(false)}/>}
    </div>
  );
}
