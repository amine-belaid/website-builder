import useEditorStore from '../../store/editorStore';

const BLOCK_TYPES = [
  { type: 'navbar', label: 'Navbar',    icon: 'ti-layout-navbar' },
  { type: 'hero',   label: 'Hero',      icon: 'ti-layout-rows' },
  { type: 'text',   label: 'Text',      icon: 'ti-align-left' },
  { type: 'image',  label: 'Image',     icon: 'ti-photo' },
  { type: 'form',   label: 'Form',      icon: 'ti-forms' },
];

export default function BlockPalette() {
  const { addSection } = useEditorStore();

  return (
    <div style={{
      width: 220, borderRight: '1px solid #e5e5e5',
      background: '#fff', overflowY: 'auto', padding: 16
    }}>
      <p style={{ fontSize:12, color:'#999', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.5px' }}>
        Blocks
      </p>
      {BLOCK_TYPES.map(b => (
        <div key={b.type}
          onClick={() => addSection(b.type)}
          style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'10px 12px', borderRadius:8, cursor:'pointer',
            marginBottom:4, border:'1px solid #f0f0f0'
          }}
          onMouseEnter={e => e.currentTarget.style.background='#fbeaf0'}
          onMouseLeave={e => e.currentTarget.style.background='#fff'}
        >
          <i className={`ti ${b.icon}`} style={{ fontSize:18, color:'#b5285a' }} aria-hidden="true" />
          <span style={{ fontSize:13 }}>{b.label}</span>
        </div>
      ))}
    </div>
  );
}