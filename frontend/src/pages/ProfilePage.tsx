import { useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, Edit3, Mail, Phone, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { UserProfile as UserProfileType } from '../api/types';

export function ProfilePage() {
  const { session } = useAuth();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<'profile' | 'verification'>('profile');
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.profileMe().then((data) => {
      setProfile(data);
      setError('');
    }).catch(() => {
      setError('Profile could not be loaded. Restart the custom backend and sign in again.');
    });
  }, []);
  const initials = useMemo(() => (profile?.name || session?.name || '').split(' ').map((part) => part[0]).slice(0, 2).join(''), [profile?.name, session?.name]);
  async function save() { if (!profile) return; const next = await api.saveProfileMe(profile); setProfile(next); setEditing(false); }
  if (error) return <section className="pageSection"><div className="errorBanner">{error}</div></section>;
  if (!profile) return <section className="pageSection"><div className="surfaceCard">Loading profile...</div></section>;
  return (
    <section className="pageSection profilePage">
      <div className="profileBanner" />
      <div className="profileHeaderCard">
        <div className="profileIdentity">
          <div className="profileAvatar">{initials}</div>
          <div>
            <h1>{profile.name}</h1>
            <p>{session?.role === 'ADMIN' ? 'Admin' : 'Mobi Agent'}</p>
            <div className="profileMetaPill"><Mail size={14} />{profile.email}</div>
          </div>
        </div>
        <div className="profileHeaderActions">
          {editing ? (
            <>
              <button type="button" className="secondaryButton" onClick={() => setEditing(false)}>Cancel</button>
              <button type="button" className="primaryButton" onClick={save}>Save Changes</button>
            </>
          ) : (
            <button
              type="button"
              className="secondaryButton profileEditIconButton"
              onClick={() => setEditing(true)}
              aria-label="Edit profile"
              title="Edit profile"
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="tabRow profileTabRow" role="tablist" aria-label="Profile sections">
        <button type="button" role="tab" aria-selected={tab === 'profile'} className={`tabButton ${tab === 'profile' ? 'tabButton-active' : ''}`} onClick={() => setTab('profile')}>Profile</button>
        <button type="button" role="tab" aria-selected={tab === 'verification'} className={`tabButton ${tab === 'verification' ? 'tabButton-active' : ''}`} onClick={() => setTab('verification')}>Verification</button>
      </div>
      {tab === 'profile' ? (
        <div className="profileGrid">
          <section className="surfaceCard"><div className="surfaceHead"><h2>About</h2></div>{editing ? <textarea value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={5} /> : <p className="pageLead">{profile.bio || 'No biography provided.'}</p>}</section>
          <section className="surfaceCard"><div className="surfaceHead"><h2><Phone size={18} />Contact Information</h2></div><div className="detailGrid"><div className="detailCard"><span>Primary Phone</span>{editing ? <input value={profile.phonePrimary || ''} onChange={(e) => setProfile({ ...profile, phonePrimary: e.target.value })} /> : <strong>{profile.phonePrimary || '--'}</strong>}</div><div className="detailCard"><span>WhatsApp</span>{editing ? <input value={profile.phoneWhatsapp || ''} onChange={(e) => setProfile({ ...profile, phoneWhatsapp: e.target.value })} /> : <strong>{profile.phoneWhatsapp || '--'}</strong>}</div></div></section>
          <section className="surfaceCard"><div className="surfaceHead"><h2>Personal Details</h2></div><div className="formGrid formGrid-two"><label>Full Name<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} disabled={!editing} /></label><label>Gender<select value={profile.gender || ''} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} disabled={!editing}><option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option></select></label><label>Date of Birth<input type="date" value={profile.dateOfBirth || ''} onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })} disabled={!editing} /></label><label>Email<input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} disabled={!editing} /></label></div></section>
        </div>
      ) : (
        <section className="surfaceCard profileVerificationCard">
          <div className="surfaceHead"><h2><ShieldCheck size={18} />Identity Verification</h2><span className="statusPill statusPositive"><CheckCircle2 size={14} />Verified</span></div>
          <div className="formGrid formGrid-two"><label>ID Type<select value={profile.idType || ''} onChange={(e) => setProfile({ ...profile, idType: e.target.value })} disabled={!editing}><option>National ID</option><option>Passport</option><option>Driver License</option></select></label><label>ID Number<input value={profile.idNumber || ''} onChange={(e) => setProfile({ ...profile, idNumber: e.target.value })} disabled={!editing} /></label></div>
          <div className="verificationMediaGrid"><div className="verificationSlot"><Camera size={18} /><span>ID Front</span><small>{profile.idFrontUrl ? 'Uploaded' : 'Not uploaded'}</small></div><div className="verificationSlot"><Camera size={18} /><span>ID Back</span><small>{profile.idBackUrl ? 'Uploaded' : 'Not uploaded'}</small></div><div className="verificationSlot"><Camera size={18} /><span>Selfie</span><small>{profile.selfieUrl ? 'Verified' : 'Not uploaded'}</small></div></div>
        </section>
      )}
    </section>
  );
}
