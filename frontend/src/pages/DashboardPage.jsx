// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import useAuthStore from '../store/authStore';

const S = {
  page: { minHeight:'100vh', background:'#0a090f', fontFamily:"'Inter',sans-serif", color:'#edeaf5' },
  nav: { height:52, borderBottom:'1px solid #2a273a', display:'flex', alignItems:'center', padding:'0 28px', gap:16, position:'sticky', top:0, background:'rgba(10,9,15,0.9)', backdropFilter:'blur(12px)', zIndex:50 },
  logo: { fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:'#edeaf5', letterSpacing:'-0.3px' },
  logoSpan: { color:'#b5285a' },
  navSpacer: { flex:1 },
  navUser: { width:32, height:32, borderRadius:'50%', background:'#b5285a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer' },
  logoutBtn: { background:'transparent', border:'1px solid #2a273a', borderRadius:8, padding:'6px 14px', fontFamily:"'Inter',sans-serif", fontSize:13, color:'#7e7a96', cursor:'pointer' },
  body: { maxWidth:960, margin:'0 auto', padding:'48px 28px' },
  topRow: { display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:40 },
  heading: { fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:700, letterSpacing:'-0.5px', marginBottom:4 },
  subheading: { fontSize:14, color:'#7e7a96' },
  newBtn: { background:'#b5285a', border:'none', borderRadius:10, padding:'10px 20px', fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'background .15s' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:16 },
  card: { background:'#121118', border:'1px solid #2a273a', borderRadius:14, overflow:'hidden', cursor:'pointer', transition:'border-color .15s,transform .15s' },
  cardThumb: { height:140, background:'#1a1824', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' },
  thumbMini: { width:'82%', height:'76%', background:'#0d0c12', border:'1px solid #2a273a', borderRadius:6, overflow:'hidden', display:'flex', flexDirection:'column' },
  thumbNav: { height:13, background:'#1a1824', borderBottom:'1px solid #2a273a', display:'flex', alignItems:'center', padding:'0 6px', gap:3 },
  thumbDot: (c) => ({ width:4, height:4, borderRadius:'50%', background:c }),
  thumbBody: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:6 },
  thumbLine: (w,h,c) => ({ width:w, height:h, background:c, borderRadius:2 }),
  cardBody: { padding:'14px 16px' },
  cardStatus: (live) => ({ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, padding:'2px 8px', borderRadius:4, background: live?'rgba(34,197,94,0.08)':'#1a1824', border:`1px solid ${live?'rgba(34,197,94,0.2)':'#2a273a'}`, color: live?'#22c55e':'#7e7a96', marginBottom:8 }),
  cardName: { fontSize:15, fontWeight:500, marginBottom:3 },
  cardUrl: { fontSize:11, color:'#3f3b55', fontFamily:'monospace', marginBottom:14 },
  cardActions: { display:'flex', gap:8 },
  editBtn: { flex:1, padding:'7px 12px', background:'#1a1824', border:'1px solid #2a273a', borderRadius:8, fontFamily:"'Inter',sans-serif", fontSize:12, color:'#edeaf5', cursor:'pointer', transition:'border-color .15s' },
  delBtn: { padding:'7px 12px', background:'transparent', border:'1px solid #2a273a', borderRadius:8, fontFamily:"'Inter',sans-serif", fontSize:12, color:'#7e7a96', cursor:'pointer', transition:'all .15s' },
  emptyWrap: { textAlign:'center', padding:'100px 0' },
  emptyTitle: { fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, marginBottom:8, color:'#3f3b55' },
  emptySub: { fontSize:14, color:'#2a273a', marginBottom:28 },
  emptyBtn: { background:'#b5285a', border:'none', borderRadius:10, padding:'11px 24px', fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color:'#fff', cursor:'pointer' },
  newCard: { background:'transparent', border:'1px dashed #2a273a', borderRadius:14, height:260, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, cursor:'pointer', transition:'border-color .15s,background .15s' },
  newCardPlus: { width:42, height:42, borderRadius:'50%', background:'#1a1824', border:'1px solid #2a273a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#3f3b55' },
  newCardLabel: { fontSize:13, color:'#3f3b55' },
  modal: { position:'fixed', inset:0, background:'rgba(10,9,15,0.85)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' },
  modalCard: { background:'#121118', border:'1px solid #2a273a', borderRadius:16, padding:28, width:'100%', maxWidth:380 },
  modalTitle: { fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, marginBottom:6 },
  modalSub: { fontSize:13, color:'#7e7a96', marginBottom:20 },
  modalInput: { width:'100%', background:'#1a1824', border:'1px solid #2a273a', borderRadius:9, padding:'10px 14px', fontFamily:"'Inter',sans-serif", fontSize:14, color:'#edeaf5', outline:'none', marginBottom:16 },
  modalRow: { display:'flex', gap:8 },
  modalCancel: { flex:1, background:'transparent', border:'1px solid #2a273a', borderRadius:9, padding:'10px', fontFamily:"'Inter',sans-serif", fontSize:13, color:'#7e7a96', cursor:'pointer' },
  modalConfirm: { flex:1, background:'#b5285a', border:'none', borderRadius:9, padding:'10px', fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer' },
};

function SiteCard({ site, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{...S.card, borderColor: hov?'#3a3650':'#2a273a', transform: hov?'translateY(-2px)':'none'}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={S.cardThumb}>
        <div style={S.thumbMini}>
          <div style={S.thumbNav}>
            <div style={S.thumbDot('#f87171')}/>
            <div style={S.thumbDot('#facc15')}/>
            <div style={S.thumbDot('#22c55e')}/>
          </div>
          <div style={S.thumbBody}>
            <div style={S.thumbLine('58%',5,'#2a273a')}/>
            <div style={S.thumbLine('40%',3,'#1a1824')}/>
            <div style={S.thumbLine('26%',6,'rgba(181,40,90,0.4)')}/>
          </div>
        </div>
      </div>
      <div style={S.cardBody}>
        <div style={S.cardStatus(site.published_at)}>
          <span style={{width:5,height:5,borderRadius:'50%',background:site.published_at?'#22c55e':'#3f3b55',display:'inline-block'}}/>
          {site.published_at ? 'Live' : 'Draft'}
        </div>
        <div style={S.cardName}>{site.name}</div>
        <div style={S.cardUrl}>{site.subdomain}.builder.app</div>
        <div style={S.cardActions}>
          <button style={S.editBtn} onClick={onEdit}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#7e7a96'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='#2a273a'}>
            Edit
          </button>
          <button style={S.delBtn} onClick={onDelete}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(248,113,113,0.4)';e.currentTarget.style.color='#f87171'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#2a273a';e.currentTarget.style.color='#7e7a96'}}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [sites, setSites]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [siteName, setSiteName]   = useState('');
  const [creating, setCreating]   = useState(false);
  const navigate  = useNavigate();
  const { logout } = useAuthStore();

  useEffect(() => {
    client.get('/sites')
      .then(r => setSites(r.data))
      .finally(() => setLoading(false));
  }, []);

 const createSite = async () => {
  // ✅ use siteName from the modal input, not prompt()
  if (!siteName.trim()) return;

  setCreating(true);   // ✅ disable the button while calling API
  try {
    const { data } = await client.post('/sites', { name: siteName.trim() });

    // close modal and reset input
    setShowModal(false);
    setSiteName('');

    // ✅ Sequelize returns Pages (capital P) with include
    const pageId = data.Pages?.[0]?.id;
    navigate('/templates', { state: { siteId: data.id, pageId } });

  } catch (err) {
    alert(err.response?.data?.error || 'Failed to create site');
  } finally {
    setCreating(false);  // ✅ re-enable button whether success or fail
  }
};
  if (loading) return (
    <div style={{...S.page, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{fontSize:14, color:'#3f3b55'}}>Loading your sites…</div>
    </div>
  );

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Syne:wght@700&display=swap" rel="stylesheet"/>

      <nav style={S.nav}>
        <span style={S.logo}>Build<span style={S.logoSpan}>er</span></span>
        <div style={S.navSpacer}/>
        <button style={S.logoutBtn} onClick={logout}>Sign out</button>
        <div style={S.navUser}>T</div>
      </nav>

      <div style={S.body}>
        <div style={S.topRow}>
          <div>
            <h1 style={S.heading}>Your sites</h1>
            <p style={S.subheading}>{sites.length} site{sites.length!==1?'s':''} total</p>
          </div>
          <button style={S.newBtn} onClick={()=>setShowModal(true)}
            onMouseEnter={e=>e.currentTarget.style.background='#d4537e'}
            onMouseLeave={e=>e.currentTarget.style.background='#b5285a'}>
            + New site
          </button>
        </div>

        {sites.length === 0 ? (
          <div style={S.emptyWrap}>
            <div style={{fontSize:40, marginBottom:16}}>🏗️</div>
            <p style={S.emptyTitle}>No sites yet</p>
            <p style={S.emptySub}>Create your first site and start building.</p>
            <button style={S.emptyBtn} onClick={()=>setShowModal(true)}>Create your first site</button>
          </div>
        ) : (
          <div style={S.grid}>
            {sites.map(site => (
              <SiteCard key={site.id} site={site}
                onEdit={() => {
                const pageId = site.Pages?.[0]?.id;
                if (!pageId) {
                  alert('No page found. Delete this site and create a new one.');
                  return;
                }
                navigate(`/editor/${pageId}`);
              }}
                onDelete={()=>{
                  client.delete(`/sites/${site.id}`);
                  setSites(prev=>prev.filter(s=>s.id!==site.id));
                }}
              />
            ))}
            <div style={S.newCard} onClick={()=>setShowModal(true)}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#b5285a';e.currentTarget.style.background='rgba(181,40,90,0.04)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#2a273a';e.currentTarget.style.background='transparent'}}>
              <div style={S.newCardPlus}>+</div>
              <span style={S.newCardLabel}>New site</span>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div style={S.modal} onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div style={S.modalCard}>
            <p style={S.modalTitle}>Name your site</p>
            <p style={S.modalSub}>You can change this later from the dashboard.</p>
            <input style={S.modalInput} placeholder="e.g. My Portfolio"
              value={siteName} 
              onChange={e=>setSiteName(e.target.value)}
              onFocus={e=>e.target.style.borderColor='#b5285a'}
              onBlur={e=>e.target.style.borderColor='#2a273a'}
              onKeyDown={e=>e.key==='Enter'&&createSite()}
              autoFocus/>
            <div style={S.modalRow}>
              <button style={S.modalCancel} onClick={()=>{setShowModal(false);setSiteName('');}}>Cancel</button>
              <button style={{...S.modalConfirm, opacity: creating ? 0.6 : 1}}
                onClick={createSite}
                disabled={creating || !siteName.trim()}>
                {creating ? 'Creating…' : 'Continue →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
