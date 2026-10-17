import { useSortable } from '@dnd-kit/sortable';
import { CSS }         from '@dnd-kit/utilities';
import useEditorStore  from '../../store/editorStore';
import BlockPreview    from '../blocks/BlockPreview';

export default function SortableSection({ section }) {
  const { selectedId, setSelected, removeSection } = useEditorStore();
  const isSelected = section.id === selectedId;

  // 1. Connect this element to @dnd-kit
  const {
    attributes,   // aria roles for accessibility
    listeners,    // pointer/keyboard events that START the drag
    setNodeRef,   // attach to the outer wrapper div
    transform,    // current x/y offset while dragging
    transition,   // smooth animation on drop
    isDragging,   // true while this item is being dragged
  } = useSortable({ id: section.id });

  // 2. CSS transform applied while dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,  // fade the original while dragging
    zIndex:  isDragging ? 999 : 'auto',
  };

  return (
    // 3. setNodeRef goes on the outer wrapper
    <div
      ref={setNodeRef}
   
      onClick={() => setSelected(section.id)}
      
      style={{
        ...style,
        border: `1px solid ${isSelected ? '#b5285a' : '#2e2e38'}`,
        borderRadius: 10,
        overflow: 'hidden',
        background: '#18181c',
        cursor: 'pointer',
        position: 'relative',
        marginBottom: 8,
        transition: 'border-color .15s',
      }}
    >
      // 4. Top bar: handle + type badge + delete
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px',
        background: '#121118',
        borderBottom: '1px solid #2e2e38',
      }}>

        // 5. Drag handle — listeners go HERE, not on the card
        <div
          {...listeners}
          {...attributes}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', display:'flex',
                   flexDirection:'column', gap:2, padding:'4px 3px' }}
          title="Drag to reorder"
        >
          {[0,1,2].map(i => (
            <span key={i} style={{ display:'block', width:12,
              height:1.5, background:'#8886a0', borderRadius:1 }} />
          ))}
        </div>

        // 6. Block type badge
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 4,
          background: '#0d0d0f', border: '1px solid #2e2e38',
          color: '#8886a0', fontFamily: 'monospace',
        }}>
          {section.type}
        </span>

        {isSelected && (
          <span style={{ fontSize:10, padding:'2px 6px', borderRadius:4,
            background:'rgba(181,40,90,0.1)', color:'#d4537e' }}>
            selected
          </span>
        )}

        <div style={{ flex: 1 }} />

        // 7. Delete — stopPropagation so select doesn't fire
        <button
          onClick={e => { e.stopPropagation(); removeSection(section.id); }}
          style={{
            width:24, height:24, borderRadius:6, background:'transparent',
            border:'1px solid transparent', cursor:'pointer',
            color:'#8886a0', fontSize:13, display:'flex',
            alignItems:'center', justifyContent:'center',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#f87171';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.color = '#8886a0';
          }}
          title="Delete section"
        >✕</button>

      </div>

      // 8. Block preview — renders section content
      <BlockPreview section={section} />

    </div>
  );
}