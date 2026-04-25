import { useAuth } from '../auth/AuthContext';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck, UserRound, WalletCards } from 'lucide-react';

type Mode = 'login' | 'register';
type QuickRole = 'Admin' | 'Mobi Agent';

const quickProfiles: Record<QuickRole, { email: string; password: string; icon: typeof ShieldCheck; description: string }> = {
  Admin: {
    email: 'admin@mobi.local',
    password: 'admin123',
    icon: ShieldCheck,
    description: 'Role management and full workshop access',
  },
  'Mobi Agent': {
    email: 'agent@mobi.local',
    password: 'agent123',
    icon: UserRound,
    description: 'Transactions, channels, accounts, wallets',
  },
};

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

  async function quick(role: QuickRole) {
    const profile = quickProfiles[role];
    setEmail(profile.email);
    setPassword(profile.password);
    setMode('login');
    setBusy(true);
    setError('');
    try {
      await login(profile.email, profile.password);
    } catch {
      setError('Seeded login failed. Make sure the backend is running with an empty or seeded database.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="authShell">
      <section className="authShowcase">
        <div className="brandPill">mobi Agent</div>
        <div>
          <p className="eyebrow">Reference Adoption</p>
          <h1>Use the reference Mobi shell and workflows on top of the stronger backend.</h1>
          <p className="pageLead">Users can now sign in directly with email and password after registration, while seeded demo access remains available for admin and agent flows.</p>
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
            <strong>Seed access</strong>
            <span>Admin and Mobi Agent quick access for demo flow parity</span>
          </div>
        </div>
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

        <div className="quickAccess">
          <button type="button" className="secondaryButton quickButton" onClick={() => quick('Mobi Agent')} disabled={busy}>
            <UserRound size={16} />
            Seed Agent
          </button>
          <button type="button" className="secondaryButton quickButton" onClick={() => quick('Admin')} disabled={busy}>
            <ShieldCheck size={16} />
            Seed Admin
          </button>
        </div>
        <div className="authNote">
          <LockKeyhole size={16} />
          Seeded users are created only when the database is empty.
        </div>
      </section>
    </main>
  );
}
