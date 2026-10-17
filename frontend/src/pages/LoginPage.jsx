import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
 
/* ─── Inline styles (same tokens as the preview) ─────────────── */
const S = {
  page: {
    minHeight: '100vh',
    background: '#0d0d0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', sans-serif",
    color: '#f0eff4',
    position: 'relative',
  },
  grid: {
    position: 'fixed', inset: 0, pointerEvents: 'none',
    backgroundImage:
      'linear-gradient(#2e2e38 1px,transparent 1px),linear-gradient(90deg,#2e2e38 1px,transparent 1px)',
    backgroundSize: '48px 48px', opacity: 0.3,
  },
  shell:   { width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 },
  brand:   { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 },
  brandMark: {
    width: 36, height: 36, background: '#b5285a', borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  brandName: { fontFamily: "'Syne', sans-serif", fontSize: 17, letterSpacing: '-0.3px' },
  card: {
    background: '#18181c', border: '1px solid #2e2e38',
    borderRadius: 14, padding: 36,
  },
  title:   { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 6 },
  sub:     { fontSize: 14, color: '#8886a0', marginBottom: 28, lineHeight: 1.5 },
  label:   { display: 'block', fontSize: 13, fontWeight: 500, color: '#8886a0', marginBottom: 7 },
  fieldWrap: { position: 'relative' },
  input:   (hasErr) => ({
    width: '100%', background: '#222228',
    border: `1px solid ${hasErr ? '#f87171' : '#2e2e38'}`,
    borderRadius: 9, padding: '11px 14px 11px 40px',
    fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#f0eff4',
    outline: 'none',
    boxShadow: hasErr ? '0 0 0 3px rgba(248,113,113,0.12)' : 'none',
  }),
  fieldIcon: {
    position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
    width: 16, height: 16, color: '#8886a0', pointerEvents: 'none',
  },
  errText: { fontSize: 12, color: '#f87171', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 },
  globalErr: {
    background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
    borderRadius: 9, padding: '11px 14px', fontSize: 13, color: '#f87171',
    marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
  },
  btn: (loading) => ({
    width: '100%', padding: 12, background: '#b5285a', border: 'none',
    borderRadius: 9, fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
    color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 6,
    opacity: loading ? 0.7 : 1,
  }),
  switchRow: { fontSize: 13, color: '#8886a0', textAlign: 'center', marginTop: 20 },
  switchLink: { color: '#d4537e', textDecoration: 'none', marginLeft: 4 },
};
//Field component used for dispalying the input fields for email and password in the login form. It takes in props such as id, label, type, placeholder, value, onChange, error, and icon to customize the field's appearance and behavior. The component also displays an error message if there is an error associated with the field.
/* ─── Reusable field component ────────────────────────────────── */
function Field({ id, label, type = 'text', placeholder, value, onChange, error, icon }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={S.label}>{label}</label>
      <div style={S.fieldWrap}>
        {/* Icon slot */}
        <svg style={S.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {icon}
        </svg>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={S.input(!!error)}
          autoComplete={type === 'password' ? 'current-password' : 'email'}
        />
      </div>
      {error && (
        <div style={S.errText}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
 
/* ─── LoginPage ───────────────────────────────────────────────── */
export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState({});
  const [globalErr, setGlobalErr] = useState('');
  const [loading, setLoading]   = useState(false);
 
  const { login }  = useAuthStore();
  const navigate   = useNavigate();
 
  /* Validate all fields, return true if clean */
  const validate = () => {
    const e = {};
    if (!email.trim())                          e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email))      e.email = 'Enter a valid email address';
    if (!password)                              e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;// Returns true if there are no errors, false otherwise
  };
 //: Objet contenant les erreurs de validation locales
  const handleSubmit = async (ev) => {
    ev.preventDefault();// Prevent default form submission behavior
    setGlobalErr('');// Clear any previous global error
    if (!validate()) return;
 
    setLoading(true);// Set loading state to true while processing the login request
    try {
      await login(email, password);   // ← calls POST /auth/login via authStore
      navigate('/');                  // ← redirect to dashboard on success
    } catch (err) {
      // Backend returns { error: "Invalid credentials" }
      setGlobalErr(err.response?.data?.error || 'Sign in failed. Try again.');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div style={S.page}>
      <div style={S.grid} aria-hidden="true" />
      <div style={S.shell}>
 
        {/* Brand : Branding : Affiche le logo et le nom Builder en haut de la carte. */}
        <div style={S.brand}>
          <div style={S.brandMark}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="#fff">
              <path d="M10 2L3 7v11h5v-5h4v5h5V7L10 2z"/>
            </svg>
          </div>
          <span style={S.brandName}>Builder</span>
        </div>
 
        <div style={S.card}>
          <p style={S.title}>Welcome back</p>
          <p style={S.sub}>Sign in to continue building.</p>
 
          {/* Global error — shown when backend returns an error */}
          {globalErr && (
            <div style={S.globalErr}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {globalErr}
            </div>
          )}
 
          <form onSubmit={handleSubmit} noValidate>
            <Field
              id="login-email" label="Email" type="email"
              placeholder="you@example.com"
              value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email: ''})); }}
              error={errors.email}
              icon={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></>}
            />
            <Field
              id="login-password" label="Password" type="password"
              placeholder="Your password"
              value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({...p, password: ''})); }}
              error={errors.password}
              icon={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}
            />
 
            <button type="submit" style={S.btn(loading)} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
 
          <p style={S.switchRow}>
            No account?
            <Link to="/register" style={S.switchLink}>Create one</Link>
          </p>
        </div>
 
      </div>
    </div>
  );
}