import { useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import type { ChannelType, ChannelTypeWrite, ServiceChannel, ServiceChannelWrite } from '../api/types';
import { Modal } from '../components/Modal';
import { formatDateTime } from '../lib/format';

const blankType: ChannelTypeWrite = { name: '', description: '', active: true };
const blankService: ServiceChannelWrite = { channelTypeId: 0, channelName: '', country: 'Uganda', active: true };

type Tab = 'types' | 'services';
type DeleteTarget = { kind: 'type'; item: ChannelType } | { kind: 'service'; item: ServiceChannel };

function toTypeWrite(item: ChannelType): ChannelTypeWrite {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    active: item.active,
  };
}

function toServiceWrite(item: ServiceChannel): ServiceChannelWrite {
  return {
    id: item.id,
    channelTypeId: item.channelTypeId,
    channelName: item.channelName,
    country: item.country,
    active: item.active,
  };
}

export function ChannelManagementPage() {
  const [tab, setTab] = useState<Tab>('types');
  const [types, setTypes] = useState<ChannelType[]>([]);
  const [services, setServices] = useState<ServiceChannel[]>([]);
  const [typeEdit, setTypeEdit] = useState<ChannelTypeWrite | null>(null);
  const [serviceEdit, setServiceEdit] = useState<ServiceChannelWrite | null>(null);
  const [viewType, setViewType] = useState<ChannelType | null>(null);
  const [viewService, setViewService] = useState<ServiceChannel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteRemarks, setDeleteRemarks] = useState('');
  const [country, setCountry] = useState('ALL');

  const load = () => {
    api.channelTypes().then(setTypes);
    api.serviceChannels().then(setServices);
  };

  useEffect(load, []);

  async function saveType() {
    if (!typeEdit) return;
    await api.saveChannelType(typeEdit);
    setTypeEdit(null);
    load();
  }

  async function saveService() {
    if (!serviceEdit) return;
    await api.saveServiceChannel(serviceEdit);
    setServiceEdit(null);
    load();
  }

  async function confirmDelete() {
    if (!deleteTarget || !deletePassword.trim() || !deleteRemarks.trim()) return;
    if (deleteTarget.kind === 'type') await api.deleteChannelType(deleteTarget.item.id!);
    else await api.deleteServiceChannel(deleteTarget.item.id!);
    setDeleteTarget(null);
    setDeletePassword('');
    setDeleteRemarks('');
    load();
  }

  const countries = useMemo(() => ['ALL', ...Array.from(new Set(services.map(service => service.country))).sort()], [services]);
  const filteredServices = useMemo(() => country === 'ALL' ? services : services.filter(service => service.country === country), [services, country]);

  return (
    <section className="pageSection">
      <div className="pageHero pageHero-row">
        <div><p className="eyebrow">Agent Operations</p><h1>Channel Management</h1><p className="pageLead">Manage service channels and their types across different countries.</p></div>
        <button className="primaryButton" onClick={() => tab === 'types' ? setTypeEdit(blankType) : setServiceEdit({ ...blankService, channelTypeId: types[0]?.id ?? 0 })}><Plus size={18} />{tab === 'types' ? 'Add Channel Type' : 'Add Service Channel'}</button>
      </div>

      <section className="surfaceCard">
        <div className="tabRow"><button type="button" className={tab === 'types' ? 'tabButton activeTab' : 'tabButton'} onClick={() => setTab('types')}>Channel Types</button><button type="button" className={tab === 'services' ? 'tabButton activeTab' : 'tabButton'} onClick={() => setTab('services')}>Service Channels</button></div>
        {tab === 'services' && <div className="toolbarRow toolbarRow-start"><label className="compactFilter">Filter by Country:<select value={country} onChange={e => setCountry(e.target.value)}>{countries.map(item => <option key={item} value={item}>{item === 'ALL' ? 'All Countries' : item}</option>)}</select></label></div>}

        {tab === 'types' ? (
          <>
            <div className="tableWrap desktopOnly">
              <table className="workshopTable">
                <thead><tr><th>ID</th><th>Type Name</th><th>Description</th><th>Status</th><th>Created At</th><th>Actions</th></tr></thead>
                <tbody>
                  {types.map((item, index) => (
                    <tr key={item.id}>
                      <td>#{index + 1}</td>
                      <td className="tableStrong accentText">{item.name}</td>
                      <td>{item.description || '--'}</td>
                      <td><span className={`statusPill ${item.active ? 'statusPositive' : 'statusDanger'}`}>{item.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                      <td>{formatDateTime(item.createdAt ?? null)}</td>
                      <td><div className="actionRow"><button type="button" className="iconButton" onClick={() => setViewType(item)}><Eye size={16} /></button><button type="button" className="iconButton" onClick={() => setTypeEdit(toTypeWrite(item))}><Pencil size={16} /></button><button type="button" className="iconButton dangerIcon" onClick={() => setDeleteTarget({ kind: 'type', item })}><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                  {types.length === 0 && <tr><td colSpan={6} className="emptyCell">No channel types created yet.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="mobileOnly">
              {types.length === 0 ? (
                <div className="surfaceCard surfaceCard-muted"><p className="pageLead">No channel types created yet.</p></div>
              ) : (
                <div className="mobileDataList">
                  {types.map((item, index) => (
                    <article key={item.id} className="mobileDataCard">
                      <div className="mobileDataCardHeader">
                        <div>
                          <strong>{item.name}</strong>
                          <span>#{index + 1}</span>
                        </div>
                        <div className="mobileDataBadgeColumn">
                          <span className={`statusPill ${item.active ? 'statusPositive' : 'statusDanger'}`}>{item.active ? 'ACTIVE' : 'INACTIVE'}</span>
                        </div>
                      </div>
                      <div className="mobileDataRows">
                        <div className="mobileDataRow"><span className="mobileDataRowLabel">Description</span><span className="mobileDataRowValue">{item.description || '--'}</span></div>
                        <div className="mobileDataRow"><span className="mobileDataRowLabel">Created</span><span className="mobileDataRowValue">{formatDateTime(item.createdAt ?? null)}</span></div>
                      </div>
                      <div className="mobileDataActions">
                        <button type="button" className="iconButton" onClick={() => setViewType(item)}><Eye size={16} /></button>
                        <button type="button" className="iconButton" onClick={() => setTypeEdit(toTypeWrite(item))}><Pencil size={16} /></button>
                        <button type="button" className="iconButton dangerIcon" onClick={() => setDeleteTarget({ kind: 'type', item })}><Trash2 size={16} /></button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="tableWrap desktopOnly">
              <table className="workshopTable">
                <thead><tr><th>ID</th><th>Channel Name</th><th>Type</th><th>Country</th><th>Status</th><th>Created By</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredServices.map((item, index) => (
                    <tr key={item.id}>
                      <td>#{index + 1}</td>
                      <td className="tableStrong">{item.channelName}</td>
                      <td><span className="typeBadge">{item.channelTypeName}</span></td>
                      <td>{item.country}</td>
                      <td><span className={`statusPill ${item.active ? 'statusPositive' : 'statusDanger'}`}>{item.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                      <td>{item.createdByName ?? '--'}</td>
                      <td><div className="actionRow"><button type="button" className="iconButton" onClick={() => setViewService(item)}><Eye size={16} /></button><button type="button" className="iconButton" onClick={() => setServiceEdit(toServiceWrite(item))}><Pencil size={16} /></button><button type="button" className="iconButton dangerIcon" onClick={() => setDeleteTarget({ kind: 'service', item })}><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                  {filteredServices.length === 0 && <tr><td colSpan={7} className="emptyCell">No service channels created yet.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="mobileOnly">
              {filteredServices.length === 0 ? (
                <div className="surfaceCard surfaceCard-muted"><p className="pageLead">No service channels created yet.</p></div>
              ) : (
                <div className="mobileDataList">
                  {filteredServices.map((item, index) => (
                    <article key={item.id} className="mobileDataCard">
                      <div className="mobileDataCardHeader">
                        <div>
                          <strong>{item.channelName}</strong>
                          <span>#{index + 1} • {item.country}</span>
                        </div>
                        <div className="mobileDataBadgeColumn">
                          <span className="typeBadge">{item.channelTypeName}</span>
                          <span className={`statusPill ${item.active ? 'statusPositive' : 'statusDanger'}`}>{item.active ? 'ACTIVE' : 'INACTIVE'}</span>
                        </div>
                      </div>
                      <div className="mobileDataRows">
                        <div className="mobileDataRow"><span className="mobileDataRowLabel">Created By</span><span className="mobileDataRowValue">{item.createdByName ?? '--'}</span></div>
                      </div>
                      <div className="mobileDataActions">
                        <button type="button" className="iconButton" onClick={() => setViewService(item)}><Eye size={16} /></button>
                        <button type="button" className="iconButton" onClick={() => setServiceEdit(toServiceWrite(item))}><Pencil size={16} /></button>
                        <button type="button" className="iconButton dangerIcon" onClick={() => setDeleteTarget({ kind: 'service', item })}><Trash2 size={16} /></button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {typeEdit && <Modal title={typeEdit.id ? 'Edit Channel Type' : 'Add New Type'} onClose={() => setTypeEdit(null)} onSubmit={e => { e.preventDefault(); saveType(); }} submitLabel={typeEdit.id ? 'Save Changes' : 'Create Type'} headerTone="accent"><div className="formGrid"><label>Type Name<input value={typeEdit.name} onChange={e => setTypeEdit({ ...typeEdit, name: e.target.value })} placeholder="e.g. MNO, Bank, Wallet" /></label><label>Description<textarea value={typeEdit.description} onChange={e => setTypeEdit({ ...typeEdit, description: e.target.value })} placeholder="Describe the channel type..." rows={4} /></label><label className="switchRow"><input type="checkbox" checked={typeEdit.active} onChange={e => setTypeEdit({ ...typeEdit, active: e.target.checked })} />Active</label></div></Modal>}
      {serviceEdit && <Modal title={serviceEdit.id ? 'Edit Service Channel' : 'Add New Channel'} onClose={() => setServiceEdit(null)} onSubmit={e => { e.preventDefault(); saveService(); }} submitLabel={serviceEdit.id ? 'Save Changes' : 'Create Channel'} headerTone="accent"><div className="formGrid"><label>Channel Type<select value={serviceEdit.channelTypeId} onChange={e => setServiceEdit({ ...serviceEdit, channelTypeId: Number(e.target.value) })}>{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label><label>Channel Name<input value={serviceEdit.channelName} onChange={e => setServiceEdit({ ...serviceEdit, channelName: e.target.value })} placeholder="Enter channel name" /></label><label>Country<input value={serviceEdit.country} onChange={e => setServiceEdit({ ...serviceEdit, country: e.target.value })} /></label><label className="switchRow"><input type="checkbox" checked={serviceEdit.active} onChange={e => setServiceEdit({ ...serviceEdit, active: e.target.checked })} />Active</label></div></Modal>}
      {viewType && <Modal title="Channel Type Details" onClose={() => setViewType(null)} onSubmit={e => { e.preventDefault(); setViewType(null); }} submitLabel="Close"><div className="detailGrid"><div className="detailCard detailCard-inline"><span>Type Name</span><strong>{viewType.name}</strong></div><div className="detailCard detailCard-inline"><span>Status</span><strong>{viewType.active ? 'ACTIVE' : 'INACTIVE'}</strong></div><div className="detailCard detailCard-inline detailCard-wide"><span>Description</span><strong>{viewType.description || '--'}</strong></div><div className="detailCard detailCard-inline"><span>Created At</span><strong>{formatDateTime(viewType.createdAt ?? null)}</strong></div></div></Modal>}
      {viewService && <Modal title="Service Channel Details" onClose={() => setViewService(null)} onSubmit={e => { e.preventDefault(); setViewService(null); }} submitLabel="Close"><div className="detailGrid"><div className="detailCard detailCard-inline"><span>Channel Name</span><strong>{viewService.channelName}</strong></div><div className="detailCard detailCard-inline"><span>Type</span><strong>{viewService.channelTypeName || '--'}</strong></div><div className="detailCard detailCard-inline"><span>Country</span><strong>{viewService.country}</strong></div><div className="detailCard detailCard-inline"><span>Status</span><strong>{viewService.active ? 'ACTIVE' : 'INACTIVE'}</strong></div><div className="detailCard detailCard-inline"><span>Created By</span><strong>{viewService.createdByName || '--'}</strong></div><div className="detailCard detailCard-inline"><span>Created At</span><strong>{formatDateTime(viewService.createdAt ?? null)}</strong></div></div></Modal>}
      {deleteTarget && <Modal title="Confirm Deletion" onClose={() => setDeleteTarget(null)} onSubmit={e => { e.preventDefault(); confirmDelete(); }} submitLabel="Final Delete"><div className="deleteWarning"><ShieldAlert size={20} /><p>Delete <strong>{deleteTarget.kind === 'type' ? deleteTarget.item.name : deleteTarget.item.channelName}</strong>. This action cannot be undone.</p></div><div className="formGrid"><label>Purpose of Deletion<textarea value={deleteRemarks} onChange={e => setDeleteRemarks(e.target.value)} placeholder="Enter remarks explaining why this item is being removed..." rows={3} /></label><label>Admin Password<input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Enter your security password" /></label></div></Modal>}
    </section>
  );
}
