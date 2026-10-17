export default function BlockPreview({ section }) {
  const p = section.props;

  switch (section.type) {

    case 'navbar':
      return (
        <div style={{ display:'flex', alignItems:'center',
          padding:'8px 14px', gap:16, background:'#121118' }}>
          <strong style={{ fontSize:13 }}>{p.logo || 'My Site'}</strong>
          <div style={{ display:'flex', gap:12, marginLeft:'auto' }}>
            {(p.links || []).map((l, i) => (
              <span key={i} style={{ fontSize:11, color:'#8886a0' }}>{l}</span>
            ))}
          </div>
        </div>
      );

    case 'hero':
      return (
        <div style={{ padding:'18px 14px', textAlign:'center',
          background: p.bg || 'transparent' }}>
          <div style={{ fontSize:15, fontWeight:500, marginBottom:4 }}>
            {p.title || 'Your headline'}
          </div>
          <div style={{ fontSize:11, color:'#8886a0' }}>
            {p.subtitle || ''}
          </div>
          {p.btnText && (
            <div style={{ marginTop:8, display:'inline-block',
              padding:'5px 14px', background:'#b5285a',
              borderRadius:6, fontSize:11, color:'#fff' }}>
              {p.btnText}
            </div>
          )}
        </div>
      );

    case 'text':
      return (
        <div style={{ padding:'10px 14px', fontSize:12,
          color:'#8886a0', fontStyle:'italic', lineHeight:1.6 }}>
          {p.content?.slice(0, 120) || 'Text block'}
          {p.content?.length > 120 ? '…' : ''}
        </div>
      );

    case 'image':
      return (
        <div style={{ padding:'10px 14px' }}>
          {p.url
            ? <img src={p.url} alt={p.alt}
                style={{ width:'100%', height:60, objectFit:'cover',
                  borderRadius:6 }} />
            : <div style={{ height:40, background:'#222228',
                borderRadius:6, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:11, color:'#3f3b55' }}>
                Image — paste URL in the panel →
              </div>
          }
        </div>
      );

    case 'footer':
      return (
        <div style={{ padding:'8px 14px', fontSize:11,
          color:'#8886a0', textAlign:'center' }}>
          {p.text || '© 2025'}
        </div>
      );

    default:
      return (
        <div style={{ padding:'10px 14px', fontSize:11, color:'#3f3b55' }}>
          {section.type} block
        </div>
      );
  }
}