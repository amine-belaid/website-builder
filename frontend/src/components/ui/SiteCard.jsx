export default function SiteCard({ site, onEdit, onDelete }) {
  return (
    <div style={{
      border: '1px solid #e5e5e5',
      borderRadius: 12,
      overflow: 'hidden', background: '#fff'
    }}>
      {/* Thumbnail placeholder */}
      <div style={{
        height: 140, background: '#f5f5f5',
        display:'flex', alignItems:'center', justifyContent:'center',
        color:'#aaa', fontSize:13
      }}>
        {site.published_at ? 'Published' : 'Draft'}
      </div>

      <div style={{ padding: '14px 16px' }}>
        <p style={{ fontWeight:500, marginBottom:4 }}>{site.name}</p>
        <p style={{ fontSize:12, color:'#999', marginBottom:14 }}>
          {site.subdomain}.yourapp.com
        </p>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onEdit} style={{ flex:1 }}>Edit</button>
          <button onClick={onDelete}
            style={{ padding:'6px 12px', color:'#c00', border:'1px solid #fcc' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}