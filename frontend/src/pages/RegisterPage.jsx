import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
 
/* ─── Same design tokens ──────────────────────────────────────── */
const S = {
  page: {
    minHeight: '100vh', background: '#0d0d0f',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px', fontFamily: "'Inter', sans-serif", color: '#f0eff4', position: 'relative',
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
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontFamily: "'Syne', sans-serif", fontSize: 17, letterSpacing: '-0.3px' },
  card:    { background: '#18181c', border: '1px solid #2e2e38', borderRadius: 14, padding: 36 },
  title:   { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 6 },
  sub:     { fontSize: 14, color: '#8886a0', marginBottom: 28, lineHeight: 1.5 },
  label:   { display: 'block', fontSize: 13, fontWeight: 500, color: '#8886a0', marginBottom: 7 },
  fieldWrap: { position: 'relative' },
  input:   (hasErr) => ({
    width: '100%', background: '#222228',
    border: `1px solid ${hasErr ? '#f87171' : '#2e2e38'}`,
    borderRadius: 9, padding: '11px 14px 11px 40px',
    fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#f0eff4', outline: 'none',
    boxShadow: hasErr ? '0 0 0 3px rgba(248,113,113,0.12)' : 'none',
  }),
  fieldIcon: {
    position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
    width: 16, height: 16, color: '#8886a0', pointerEvents: 'none',
  },
  errText:  { fontSize: 12, color: '#f87171', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 },
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
  terms:     { fontSize: 12, color: '#8886a0', textAlign: 'center', marginTop: 20, lineHeight: 1.6 },
  switchRow: { fontSize: 13, color: '#8886a0', textAlign: 'center', marginTop: 20 },
  switchLink:{ color: '#d4537e', textDecoration: 'none', marginLeft: 4 },
  successBox:{
    textAlign: 'center', padding: '24px 0',
  },
  successIcon:{
    width: 52, height: 52, background: 'rgba(34,197,94,0.1)', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
  },
  successTitle:{ fontFamily: "'Syne', sans-serif", fontSize: 18, marginBottom: 6 },
  successSub:  { fontSize: 14, color: '#8886a0' },
};
 
/* ─── Password strength helper ────────────────────────────────── */
const STRENGTH_COLORS = ['#f87171','#fb923c','#facc15','#22c55e'];
const STRENGTH_LABELS = ['Too short','Weak','Good','Strong'];
function getStrength(pwd) {
  if (pwd.length < 6) return 1;
  let s = 1;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd) && pwd.length >= 10) s++;
  return Math.min(s, 4);
}
 
/* ─── Reusable Field ──────────────────────────────────────────── */
function Field({ id, label, type, placeholder, value, onChange, error, icon }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={S.label}>{label}</label>
      <div style={S.fieldWrap}>
        <svg style={S.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {icon}
        </svg>
        <input
          id={id} type={type} placeholder={placeholder}
          value={value} onChange={onChange}
          style={S.input(!!error)}
          autoComplete={type === 'password' ? 'new-password' : 'email'}
        />
      </div>
      {error && (
        <div style={S.errText}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
 
/* ─── RegisterPage ────────────────────────────────────────────── */
export default function RegisterPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [errors, setErrors]     = useState({});
  const [globalErr, setGlobalErr] = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
 
  const strength = password ? getStrength(password) : 0;
 
  const { register } = useAuthStore();
  const navigate     = useNavigate();
 
  /* Validate all fields, return true if clean */
  const validate = () => {
    const e = {};
    if (!email.trim())                     e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (!password)                         e.password = 'Password is required';
    else if (password.length < 8)         e.password = 'Use at least 8 characters';
    if (!confirm)                          e.confirm = 'Please confirm your password';
    else if (confirm !== password)         e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
 
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setGlobalErr('');
    if (!validate()) return;
 
    setLoading(true);
    try {
      await register(email, password);  // ← calls POST /auth/register via authStore
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);  // ← redirect after showing success
    } catch (err) {
      // Backend returns { error: "Email already in use" }
      setGlobalErr(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div style={S.page}>
      <div style={S.grid} aria-hidden="true" />
      <div style={S.shell}>
 
        {/* Brand */}
        <div style={S.brand}>
          <div style={S.brandMark}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="#fff">
              <path d="M10 2L3 7v11h5v-5h4v5h5V7L10 2z"/>
            </svg>
          </div>
          <span style={S.brandName}>Builder</span>
        </div>
 
        <div style={S.card}>
 
          {success ? (
            /* ── Success screen ── */
            <div style={S.successBox}>
              <div style={S.successIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="#22c55e" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p style={S.successTitle}>Account created</p>
              <p style={S.successSub}>Redirecting to your dashboard…</p>
            </div>
          ) : (
            /* ── Register form ── */
            <>
              <p style={S.title}>Create your account</p>
              <p style={S.sub}>Free to start. No credit card needed.</p>
 
              {/* Global error — e.g. email already in use */}
              {globalErr && (
                <div style={S.globalErr}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {globalErr}
                </div>
              )}
 
              <form onSubmit={handleSubmit} noValidate>
                <Field
                  id="reg-email" label="Email" type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email:''})); }}
                  error={errors.email}
                  icon={<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></>}
                />
 
                {/* Password with strength bar */}
                <div style={{ marginBottom: 18 }}>
                  <label htmlFor="reg-password" style={S.label}>Password</label>
                  <div style={S.fieldWrap}>
                    <svg style={S.fieldIcon} viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      id="reg-password" type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrors(p => ({...p, password:''})); }}
                      style={S.input(!!errors.password)}
                      autoComplete="new-password"
                    />
                  </div>
                  {/* Strength bar — only shows when user starts typing */}
                  {password && (
                    <>
                      <div style={{ display:'flex', gap:4, marginTop:8 }}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{
                            height: 3, flex: 1, borderRadius: 2,
                            background: i <= strength ? STRENGTH_COLORS[strength-1] : '#3e3e4e',
                            transition: 'background 0.25s',
                          }}/>
                        ))}
                      </div>
                      <div style={{ fontSize:11, marginTop:5, color: STRENGTH_COLORS[strength-1] }}>
                        {STRENGTH_LABELS[strength-1]}
                      </div>
                    </>
                  )}
                  {errors.password && (
                    <div style={S.errText}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      {errors.password}
                    </div>
                  )}
                </div>
 
                <Field
                  id="reg-confirm" label="Confirm password" type="password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setErrors(p => ({...p, confirm:''})); }}
                  error={errors.confirm}
                  icon={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
                />
 
                <button type="submit" style={S.btn(loading)} disabled={loading}>
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>
 
              <p style={S.terms}>
                By creating an account you agree to our{' '}
                <a href="#" style={{ color:'#d4537e' }}>Terms</a> and{' '}
                <a href="#" style={{ color:'#d4537e' }}>Privacy Policy</a>.
              </p>
 
              <p style={S.switchRow}>
                Already have an account?
                <Link to="/login" style={S.switchLink}>Sign in</Link>
              </p>
            </>
          )}
        </div>
 
      </div>
    </div>
  );
}