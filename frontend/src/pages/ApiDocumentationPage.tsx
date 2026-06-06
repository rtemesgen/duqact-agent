import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import type { ApiConnection } from '../api/types';
import { Modal } from '../components/Modal';

export function ApiDocumentationPage() {
  const [items, setItems] = useState<ApiConnection[]>([]);
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<ApiConnection | null>(null);
  const [view, setView] = useState<ApiConnection | null>(null);
  const [remove, setRemove] = useState<ApiConnection | null>(null);
  const load = () => api.apiConnections().then(setItems);
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => items.filter((item) => `${item.name} ${item.endpoint} ${item.description}`.toLowerCase().includes(search.toLowerCase())), [items, search]);
  async function save() { if (!edit) return; await api.saveApiConnection(edit); setEdit(null); load(); }
  async function destroy() { if (!remove?.id) return; await api.deleteApiConnection(remove.id); setRemove(null); load(); }
  return (
    <section className="pageSection">
      <section className="surfaceCard">
        <div className="toolbarRow"><label className="searchField"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search APIs..." /></label><button className="primaryButton" onClick={() => setEdit({ name: '', endpoint: '', status: 'ACTIVE', description: '' })}><Plus size={18} />Add API</button></div>
        <div className="tableWrap desktopOnly"><table className="workshopTable"><thead><tr><th>Name</th><th>Endpoint</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td className="tableStrong">{item.name}</td><td>{item.endpoint}</td><td><span className={`statusPill ${item.status === 'ACTIVE' ? 'statusPositive' : 'statusDanger'}`}>{item.status}</span></td><td><div className="actionRow"><button className="iconButton" onClick={() => setView(item)}><Eye size={16} /></button><button className="iconButton" onClick={() => setEdit(item)}><Pencil size={16} /></button><button className="iconButton dangerIcon" onClick={() => setRemove(item)}><Trash2 size={16} /></button></div></td></tr>)}{filtered.length === 0 && <tr><td colSpan={4} className="emptyCell">No API connections found.</td></tr>}</tbody></table></div>
        <div className="mobileOnly">
          {filtered.length === 0 ? (
            <div className="surfaceCard surfaceCard-muted"><p className="pageLead">No API connections found.</p></div>
          ) : (
            <div className="mobileDataList">
              {filtered.map((item) => (
                <article key={item.id} className="mobileDataCard">
                  <div className="mobileDataCardHeader">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.endpoint}</span>
                    </div>
                    <div className="mobileDataBadgeColumn">
                      <span className={`statusPill ${item.status === 'ACTIVE' ? 'statusPositive' : 'statusDanger'}`}>{item.status}</span>
                    </div>
                  </div>
                  <div className="mobileDataActions">
                    <button className="iconButton" onClick={() => setView(item)}><Eye size={16} /></button>
                    <button className="iconButton" onClick={() => setEdit(item)}><Pencil size={16} /></button>
                    <button className="iconButton dangerIcon" onClick={() => setRemove(item)}><Trash2 size={16} /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      {edit && <Modal title={edit.id ? 'Edit API' : 'Add API'} onClose={() => setEdit(null)} onSubmit={(e) => { e.preventDefault(); save(); }} submitLabel={edit.id ? 'Save Changes' : 'Create API'} headerTone="accent"><div className="formGrid"><label>Name<input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label><label>Endpoint<input value={edit.endpoint} onChange={(e) => setEdit({ ...edit, endpoint: e.target.value })} /></label><label>Status<select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as ApiConnection['status'] })}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select></label><label>Description<textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} rows={4} /></label></div></Modal>}
      {view && <Modal title="API Details" onClose={() => setView(null)} onSubmit={(e) => { e.preventDefault(); setView(null); }} submitLabel="Close"><div className="detailGrid"><div className="detailCard detailCard-inline"><span>Name</span><strong>{view.name}</strong></div><div className="detailCard detailCard-inline"><span>Status</span><strong>{view.status}</strong></div><div className="detailCard detailCard-inline detailCard-wide"><span>Endpoint</span><strong>{view.endpoint}</strong></div><div className="detailCard detailCard-inline detailCard-wide"><span>Description</span><strong>{view.description}</strong></div></div></Modal>}
      {remove && <Modal title="Delete API" onClose={() => setRemove(null)} onSubmit={(e) => { e.preventDefault(); destroy(); }} submitLabel="Delete"><div className="deleteWarning"><Trash2 size={20} /><p>Delete <strong>{remove.name}</strong>.</p></div></Modal>}
    </section>
  );
}
