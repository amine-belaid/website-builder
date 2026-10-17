import { useState } from 'react';
import client from '../../api/client';
import PreviewModal from './PreviewModal';
import useEditorStore from '../../store/editorStore';

export default function Toolbar({ pageId, saveStatus }) {
  const [showPreview, setShowPreview] = useState(false);
  const [publishing, setPublishing]   = useState(false);
  const { sections } = useEditorStore();

  const publish = async () => {
    setPublishing(true);
    try {
      // Get siteId from page (you'd store this in state or route)
      const { data: page } = await client.get(`/pages/${pageId}`);
      const { data } = await client.post(`/sites/${page.site_id}/publish`);
      window.open(data.url, '_blank');
    } catch {
      alert('Publish failed. Try again.');
    } finally {
      setPublishing(false);
    }
  };

  const statusLabel = {
    saved: 'Saved',
    saving: 'Saving…',
    unsaved: 'Unsaved changes'
  }[saveStatus];

  return (
    <>
      <div style={{
        height:52, borderBottom:'1px solid #e5e5e5', background:'#fff',
        display:'flex', alignItems:'center', padding:'0 20px', gap:16
      }}>
        <span style={{ fontWeight:500, flex:1 }}>Editor</span>

        <span style={{ fontSize:12, color: saveStatus === 'saved' ? '#22c55e' : '#f59e0b' }}>
          {statusLabel}
        </span>

        <button onClick={() => setShowPreview(true)}>
          Preview
        </button>

        <button onClick={publish} disabled={publishing}
          style={{ background:'#b5285a', color:'#fff', border:'none', borderRadius:8, padding:'8px 18px' }}>
          {publishing ? 'Publishing…' : 'Publish'}
        </button>
      </div>

      {showPreview && (
        <PreviewModal sections={sections} onClose={() => setShowPreview(false)} />
      )}
    </>
  );
  //When showPreview becomes true (upon clicking the Preview button), React dispaly <PreviewModal/>,
  // injecting the current sections from the Zustand store.
}