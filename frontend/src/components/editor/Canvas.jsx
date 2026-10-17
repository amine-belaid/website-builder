import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import useEditorStore from '../../store/editorStore';
import SortableSection from './SortableSection';

export default function Canvas() {
  const { sections, reorderSections } = useEditorStore();

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }  // require 8px drag before activating
  }));
//this
// handleDragEnd is called as soon as the user releases the mouse button 
//over : the section that the user is currently dragging over
//active : the section that the user is currently dragging
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = sections.findIndex(s => s.id === active.id);
    const newIdx = sections.findIndex(s => s.id === over.id);
    reorderSections(arrayMove(sections, oldIdx, newIdx));
    //reorderSections : send a reordered new table in a Zustand store
  };
//<DndContext> : Provides the global context for managing drag-and-drop events.
//verticalListSortingStrategy : indicates that movement occurs only along a vertical axis (from top to bottom).
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        
      <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
        <div style={{
          flex: 1, overflowY: 'auto', background: '#f8f8f8',
          padding: '24px', display:'flex', flexDirection:'column', gap: 12
        }}>
          {sections.length === 0 && (
            <div style={{ textAlign:'center', padding:'80px 0', color:'#aaa' }}>
              Drag a block from the left panel to get started
            </div>
          )}
          {sections.map(section => (
            <SortableSection key={section.id} section={section} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}