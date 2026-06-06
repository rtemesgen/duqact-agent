import { useEffect, useState } from 'react';
import { Eye, Pencil, Plus, Trash2, UserPlus, UserX } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { MobiAgentShop, ShopWorkerAssignment, User } from '../api/types';
import { Modal } from '../components/Modal';

export function MobiAgentShopPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<MobiAgentShop[]>([]);
  const [workers, setWorkers] = useState<Record<number, ShopWorkerAssignment[]>>({});
  const [edit, setEdit] = useState<MobiAgentShop | null>(null);
  const [view, setView] = useState<MobiAgentShop | null>(null);
  const [assignTarget, setAssignTarget] = useState<MobiAgentShop | null>(null);
  const [assignForm, setAssignForm] = useState({ userId: 0, jobTitle: '', phone: '' });

  const load = async () => {
    const [shopData, userData] = await Promise.all([api.shops(), api.users().catch(() => [])]);
    setShops(shopData);
    setUsers(userData);
    const workerEntries = await Promise.all(shopData.map(async (shop) => [shop.id!, await api.shopWorkers(shop.id!)] as const));
    setWorkers(Object.fromEntries(workerEntries));
  };

  useEffect(() => { void load(); }, []);

  async function save() {
    if (!edit) return;
    await api.saveShop(edit);
    setEdit(null);
    await load();
  }
  async function destroy(id: number) { await api.deleteShop(id); await load(); }
  async function assignWorker() {
    if (!assignTarget?.id) return;
    await api.assignShopWorker(assignTarget.id, assignForm);
    setAssignTarget(null);
    setAssignForm({ userId: 0, jobTitle: '', phone: '' });
    await load();
  }
  async function removeWorker(shopId: number, assignmentId: number) { await api.removeShopWorker(shopId, assignmentId); await load(); }

  return (
    <section className="pageSection">
      {session?.role === 'ADMIN' && <div className="toolbarRow toolbarRow-start"><button className="primaryButton" onClick={() => setEdit({ businessName: '', location: '', country: 'Uganda', ownerUserId: users[0]?.id ?? 0, agentId: '', remarks: '' })}><Plus size={18} />Add Agent Shop</button></div>}
      <section className="surfaceCard">
        <div className="tableWrap desktopOnly"><table className="workshopTable"><thead><tr><th>Agent Name</th><th>Agent ID</th><th>Location</th><th>Owner</th><th>Workers</th><th>Actions</th></tr></thead><tbody>{shops.map((shop) => <tr key={shop.id}><td className="tableStrong">{shop.businessName}</td><td className="accentText tableStrong">{shop.agentId}</td><td>{shop.location}, {shop.country}</td><td>{shop.ownerName}</td><td><span className="statusPill statusNeutral">{workers[shop.id!]?.length ?? shop.workerCount ?? 0} Workers</span></td><td><div className="actionRow"><button className="iconButton" onClick={() => setView(shop)}><Eye size={16} /></button>{session?.role === 'ADMIN' && <button className="iconButton" onClick={() => setEdit(shop)}><Pencil size={16} /></button>}{session?.role === 'ADMIN' && <button className="iconButton" onClick={() => setAssignTarget(shop)}><UserPlus size={16} /></button>}{session?.role === 'ADMIN' && shop.id && <button className="iconButton dangerIcon" onClick={() => destroy(shop.id!)}><Trash2 size={16} /></button>}</div></td></tr>)}{shops.length === 0 && <tr><td colSpan={6} className="emptyCell">No assigned shops found.</td></tr>}</tbody></table></div>
        <div className="mobileOnly">
          {shops.length === 0 ? (
            <div className="surfaceCard surfaceCard-muted"><p className="pageLead">No assigned shops found.</p></div>
          ) : (
            <div className="mobileDataList">
              {shops.map((shop) => (
                <article key={shop.id} className="mobileDataCard">
                  <div className="mobileDataCardHeader">
                    <div>
                      <strong>{shop.businessName}</strong>
                      <span>{shop.agentId}</span>
                    </div>
                    <div className="mobileDataBadgeColumn">
                      <span className="statusPill statusNeutral">{workers[shop.id!]?.length ?? shop.workerCount ?? 0} Workers</span>
                    </div>
                  </div>
                  <div className="mobileDataRows">
                    <div className="mobileDataRow"><span className="mobileDataRowLabel">Location</span><span className="mobileDataRowValue">{shop.location}, {shop.country}</span></div>
                    <div className="mobileDataRow"><span className="mobileDataRowLabel">Owner</span><span className="mobileDataRowValue">{shop.ownerName}</span></div>
                  </div>
                  <div className="mobileDataActions">
                    <button className="iconButton" onClick={() => setView(shop)}><Eye size={16} /></button>
                    {session?.role === 'ADMIN' && <button className="iconButton" onClick={() => setEdit(shop)}><Pencil size={16} /></button>}
                    {session?.role === 'ADMIN' && <button className="iconButton" onClick={() => setAssignTarget(shop)}><UserPlus size={16} /></button>}
                    {session?.role === 'ADMIN' && shop.id && <button className="iconButton dangerIcon" onClick={() => destroy(shop.id!)}><Trash2 size={16} /></button>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      {edit && <Modal title={edit.id ? 'Edit Agent Shop' : 'Add New Agent Shop'} onClose={() => setEdit(null)} onSubmit={(e) => { e.preventDefault(); save(); }} submitLabel={edit.id ? 'Save Changes' : 'Create Shop'} headerTone="accent"><div className="formGrid"><label>Business Name<input value={edit.businessName} onChange={(e) => setEdit({ ...edit, businessName: e.target.value })} /></label><div className="formGrid formGrid-two"><label>Country<select value={edit.country} onChange={(e) => setEdit({ ...edit, country: e.target.value })}><option>Uganda</option><option>Kenya</option><option>Tanzania</option></select></label><label>Location<input value={edit.location} onChange={(e) => setEdit({ ...edit, location: e.target.value })} /></label></div><label>Assign Owner<select value={edit.ownerUserId} onChange={(e) => setEdit({ ...edit, ownerUserId: Number(e.target.value) })}>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label><label>Agent ID<input value={edit.agentId} onChange={(e) => setEdit({ ...edit, agentId: e.target.value })} placeholder="AGT-001" /></label><label>Remarks<textarea value={edit.remarks} onChange={(e) => setEdit({ ...edit, remarks: e.target.value })} rows={3} /></label></div></Modal>}
      {assignTarget && <Modal title="Assign Worker" onClose={() => setAssignTarget(null)} onSubmit={(e) => { e.preventDefault(); assignWorker(); }} submitLabel="Assign Worker" headerTone="accent"><div className="formGrid"><label>User<select value={assignForm.userId} onChange={(e) => setAssignForm({ ...assignForm, userId: Number(e.target.value) })}>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label><label>Job Title<input value={assignForm.jobTitle} onChange={(e) => setAssignForm({ ...assignForm, jobTitle: e.target.value })} /></label><label>Phone<input value={assignForm.phone} onChange={(e) => setAssignForm({ ...assignForm, phone: e.target.value })} /></label></div></Modal>}
      {view && <Modal title="Shop Details" onClose={() => setView(null)} onSubmit={(e) => { e.preventDefault(); setView(null); }} submitLabel="Close" size="lg"><div className="detailGrid"><div className="detailCard detailCard-inline"><span>Business Name</span><strong>{view.businessName}</strong></div><div className="detailCard detailCard-inline"><span>Agent ID</span><strong>{view.agentId}</strong></div><div className="detailCard detailCard-inline"><span>Location</span><strong>{view.location}, {view.country}</strong></div><div className="detailCard detailCard-inline"><span>Owner</span><strong>{view.ownerName}</strong></div><div className="detailCard detailCard-inline detailCard-wide"><span>Remarks</span><strong>{view.remarks || '--'}</strong></div><div className="detailCard detailCard-inline detailCard-wide"><span>Workers</span><strong>{(workers[view.id!] ?? []).length ? (workers[view.id!] ?? []).map((worker) => `${worker.userName} (${worker.jobTitle})`).join(', ') : 'No workers assigned.'}</strong></div>{session?.role === 'ADMIN' && view.id && (workers[view.id!] ?? []).length > 0 && <div className="detailCard detailCard-wide"><span>Manage Workers</span><div className="actionRow">{(workers[view.id!] ?? []).map((worker) => <button key={worker.id} className="iconButton dangerIcon" onClick={() => removeWorker(view.id!, worker.id!)} title={`Remove ${worker.userName}`}><UserX size={16} /></button>)}</div></div>}</div></Modal>}
    </section>
  );
}
