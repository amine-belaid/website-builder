import { useRef } from 'react';
import useEditorStore from '../../store/editorStore';


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
};

/* ── reusable field styles ── */
const inputStyle = {
  width: '100%',
  background: T.s2,
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  padding: '8px 10px',
  fontFamily: T.font,
  fontSize: 12,
  color: T.text,
  outline: 'none',
};
const labelStyle = {
  fontSize: 11,
  color: T.muted,
  display: 'block',
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};
const fieldStyle = { marginBottom: 14 };

export default function PropPanel() {
  const { sections, selectedId, updateSection, setSaveStatus } = useEditorStore();
  const section  = sections.find(s => s.id === selectedId);
  const fileRef  = useRef(null);

  /* ── empty state ── */
  if (!section) return (
    <div style={{
      width: 220, borderLeft: `1px solid ${T.border}`,
      background: T.s1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: 20, flexShrink: 0,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: T.s2, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={T.faint} strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
        </svg>
      </div>
      <p style={{ fontSize: 12, color: T.faint, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
        Select a block<br/>to edit its properties
      </p>
    </div>
  );

  /* ── update helper ── */
  const update = (key, value) => {
    updateSection(section.id, { [key]: value });
    setSaveStatus('unsaved');
  };

  /* ── focus / blur handlers ── */
  const onFocus = e => e.target.style.borderColor = T.pink2;
  const onBlur  = e => e.target.style.borderColor = T.border;

  /* ── image upload handler ── */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // show uploading state immediately
    update('url', '__loading__');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/assets/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            // ✅ do NOT set Content-Type — browser sets it automatically with boundary
          },
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();

      // store Cloudinary CDN URL in section props
      update('url', data.url);

    } catch (err) {
      alert(err.message || 'Upload failed. Try again.');
      update('url', '');
    } finally {
      // reset file input so same file can be re-uploaded
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  /* ── render fields per block type ── */
  const renderFields = () => {
    const p = section.props;

    switch (section.type) {

      /* ── NAVBAR ── */
      case 'navbar':
        return <>
          <div style={fieldStyle}>
            <label style={labelStyle}>Logo text</label>
            <input style={inputStyle} value={p.logo || ''}
              onChange={e => update('logo', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}/>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Links (comma separated)</label>
            <input style={inputStyle}
              value={(p.links || []).join(', ')}
              onChange={e => update('links', e.target.value.split(',').map(s => s.trim()))}
              onFocus={onFocus} onBlur={onBlur}
              placeholder="Home, About, Contact"/>
          </div>
        </>;

      /* ── HERO ── */
      case 'hero':
        return <>
          <div style={fieldStyle}>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} value={p.title || ''}
              onChange={e => update('title', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}/>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Subtitle</label>
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }}
              value={p.subtitle || ''}
              onChange={e => update('subtitle', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}/>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Button text</label>
            <input style={inputStyle} value={p.btnText || ''}
              onChange={e => update('btnText', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}
              placeholder="Get started"/>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Background color</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color"
                value={p.bg || '#0a090f'}
                onChange={e => update('bg', e.target.value)}
                style={{
                  width: 32, height: 32,
                  border: `1px solid ${T.border}`,
                  borderRadius: 7, background: 'none',
                  cursor: 'pointer', padding: 2,
                }}/>
              <input style={{ ...inputStyle, flex: 1 }}
                value={p.bg || '#0a090f'}
                onChange={e => update('bg', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
                placeholder="#0a090f"/>
            </div>
          </div>
        </>;

      /* ── TEXT ── */
      case 'text':
        return <>
          <div style={fieldStyle}>
            <label style={labelStyle}>Content</label>
            <textarea
              rows={6}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
              value={p.content || ''}
              onChange={e => update('content', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}/>
          </div>
        </>;

      /* ── IMAGE ── */
      case 'image':
        return <>

          {/* upload button */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Upload image</label>

            {/* hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />

            {/* visible upload button */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={p.url === '__loading__'}
              style={{
                width: '100%', padding: '9px 12px',
                background: T.s2,
                border: `1px solid ${T.border2}`,
                borderRadius: 8, fontFamily: T.font,
                fontSize: 12, color: T.text,
                cursor: p.url === '__loading__' ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 7,
                opacity: p.url === '__loading__' ? 0.6 : 1,
                transition: 'border-color .15s',
              }}
              onMouseEnter={e => { if (p.url !== '__loading__') e.currentTarget.style.borderColor = T.pink2; }}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border2}>
              {p.url === '__loading__'
                ? <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2"
                      style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Uploading…
                  </>
                : <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Choose image
                  </>
              }
            </button>

            <p style={{ fontSize: 10, color: T.faint, marginTop: 5 }}>
              JPEG, PNG, WebP or GIF — max 5 MB
            </p>
          </div>

          {/* image preview */}
          {p.url && p.url !== '__loading__' && (
            <div style={{ ...fieldStyle, position: 'relative' }}>
              <label style={labelStyle}>Preview</label>
              <img
                src={p.url}
                alt={p.alt || 'preview'}
                style={{
                  width: '100%', borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  objectFit: 'cover', maxHeight: 120,
                }}/>
              {/* remove button */}
              <button
                onClick={() => update('url', '')}
                style={{
                  position: 'absolute', top: 22, right: 6,
                  width: 22, height: 22, borderRadius: 6,
                  background: 'rgba(10,9,15,0.8)',
                  border: `1px solid ${T.border}`,
                  color: '#f87171', fontSize: 12,
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
                title="Remove image">
                ✕
              </button>
            </div>
          )}

          {/* manual URL input */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Or paste URL</label>
            <input
              style={inputStyle}
              placeholder="https://example.com/image.jpg"
              value={p.url === '__loading__' ? '' : p.url || ''}
              onChange={e => update('url', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}/>
          </div>

          {/* alt text */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Alt text</label>
            <input
              style={inputStyle}
              value={p.alt || ''}
              placeholder="Describe the image"
              onChange={e => update('alt', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}/>
          </div>
        </>;

      /* ── FEATURES ── */
      case 'features':
        return <>
          <div style={fieldStyle}>
            <label style={labelStyle}>Section title</label>
            <input style={inputStyle} value={p.title || ''}
              onChange={e => update('title', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}/>
          </div>
          {(p.items || []).map((item, i) => (
            <div key={i} style={fieldStyle}>
              <label style={labelStyle}>Feature {i + 1}</label>
              <input style={inputStyle} value={item}
                onChange={e => {
                  const items = [...(p.items || [])];
                  items[i] = e.target.value;
                  update('items', items);
                }}
                onFocus={onFocus} onBlur={onBlur}/>
            </div>
          ))}
        </>;

      /* ── FOOTER ── */
      case 'footer':
        return <>
          <div style={fieldStyle}>
            <label style={labelStyle}>Footer text</label>
            <input style={inputStyle} value={p.text || ''}
              onChange={e => update('text', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}
              placeholder="© 2025 My Site"/>
          </div>
        </>;

      default:
        return <p style={{ fontSize: 12, color: T.faint }}>No properties.</p>;
    }
  };

  return (
    <>
      {/* spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{
        width: 220, borderLeft: `1px solid ${T.border}`,
        background: T.s1, overflowY: 'auto', flexShrink: 0,
      }}>
        {/* header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 4,
            background: T.bg, border: `1px solid ${T.border}`,
            color: T.muted, fontFamily: 'monospace',
          }}>
            {section.type}
          </span>
          <span style={{ fontSize: 11, color: T.faint }}>properties</span>
        </div>

        {/* fields */}
        <div style={{ padding: 14 }}>
          {renderFields()}
        </div>
      </div>
    </>
  );
}