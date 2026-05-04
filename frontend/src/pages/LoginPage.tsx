import { useAuth } from '../auth/AuthContext';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole, WalletCards } from 'lucide-react';

type Mode = 'login' | 'register';

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const modeTitle = useMemo(() => {
    if (mode === 'register') return 'Create Mobi Agent Account';
    return 'Login with Email and Password';
  }, [mode]);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      if (mode === 'register') {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch {
      setError(mode === 'register' ? 'Registration failed. Check the details or try another email.' : 'Login failed. Check your email and password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="authShell">
      <section className="authShowcase">
        <div className="brandPill">mobi Agent</div>
       {/* <div>
          <p className="eyebrow">Reference Adoption</p>
          <h1>Use the reference Mobi shell and workflows on top of the stronger backend.</h1>
          <p className="pageLead">Users sign in directly with email and password, while registration keeps the standard Mobi Agent onboarding flow.</p>
        </div>
        <div className="authStats">
          <div>
            <strong>Backend-first</strong>
            <span>JWT auth and persisted Spring Boot APIs remain authoritative</span>
          </div>
          <div>
            <strong>Direct login</strong>
            <span>Registered users return to a plain email and password form</span>
          </div>
          <div>
            <strong>Production-ready</strong>
            <span>Demo one-click login is hidden from the live sign-in experience</span>
          </div>
        </div>*/}
      </section>

      <section className="authCard">
        <div className="authForm">
          <div className="authHeaderRow">
            {mode === 'register' && (
              <button
                type="button"
                className="backButton"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            <div>
              <h2>{modeTitle}</h2>
              <p>{mode === 'register' ? 'New registrations start as Mobi Agent users.' : 'Enter your email and password to access the workshop.'}</p>
            </div>
          </div>

          <form className="authInnerForm" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            {mode === 'register' && (
              <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
              </label>
            )}
            <label>
              Email
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={mode === 'register' ? 6 : undefined} />
            </label>
            {error && <p className="errorBanner">{error}</p>}
            <button className="primaryButton authPrimary" disabled={busy}>
              {busy ? 'Working...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="authModeSwitch">
            {mode === 'login' ? (
              <button type="button" className="secondaryButton authPrimary" onClick={() => { setMode('register'); setError(''); setName(''); }}>
                <WalletCards size={16} />
                Register New Mobi Agent
              </button>
            ) : (
              <button type="button" className="secondaryButton authPrimary" onClick={() => { setMode('login'); setError(''); }}>
                <ArrowLeft size={16} />
                Back to Login
              </button>
            )}
          </div>
        </div>

        <div className="authNote">
          <LockKeyhole size={16} />
          Use your assigned account credentials to access the live workshop.
        </div>
      </section>
    </main>
  );
}

