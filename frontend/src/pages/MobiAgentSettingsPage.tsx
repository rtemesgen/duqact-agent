import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import { api } from '../api/client';
import type { DashboardStats, MnoAccount, MnoAccountWrite, ServiceChannel } from '../api/types';
import { DashboardKPICard } from '../components/DashboardKPICard';
import { Modal } from '../components/Modal';
import { formatCurrency } from '../lib/format';

const blank: MnoAccount = {
  serviceChannelId: undefined,
  name: '',
  country: '',
  mobileNumber: '',
  agentId: '',
  emoneyAmount: 0,
  network: '',
  cashAtHand: 0,
  accountType: '',
  currency: 'UGX',
  openingBalance: 0,
  remarks: '',
};

const PAGE_SIZE = 5;

function resolveServiceChannelId(item: MnoAccount, serviceChannels: ServiceChannel[]) {
  if (item.serviceChannelId) return item.serviceChannelId;
  const match = serviceChannels.find((service) =>
    service.channelName.toLowerCase() === (item.network || '').toLowerCase()
    && service.country.toLowerCase() === (item.country || '').toLowerCase(),
  );
  return match?.id;
}

function buildBlankAccount(serviceChannels: ServiceChannel[]): MnoAccount {
  return {
    ...blank,
    serviceChannelId: serviceChannels[0]?.id,
  };
}

function selectedServiceChannel(item: MnoAccount | null, serviceChannels: ServiceChannel[]) {
  if (!item?.serviceChannelId) return null;
  return serviceChannels.find((service) => service.id === item.serviceChannelId) ?? null;
}

export function MobiAgentSettingsPage() {
  const [items, setItems] = useState<MnoAccount[]>([]);
  const [serviceChannels, setServiceChannels] = useState<ServiceChannel[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [edit, setEdit] = useState<MnoAccount | null>(null);
  const [selected, setSelected] = useState<MnoAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MnoAccount | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteRemarks, setDeleteRemarks] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const saveLock = useRef(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [accountData, dashboardData, channelData] = await Promise.all([api.accounts(), api.dashboard(), api.serviceChannels()]);
      setItems(accountData);
      setStats(dashboardData);
      setServiceChannels(channelData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Accounts could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  function openCreateModal() {
    setModalSuccess('');
    setModalError('');
    setEdit(buildBlankAccount(serviceChannels));
  }

  function openEditModal(item: MnoAccount) {
    setModalSuccess('');
    setModalError('');
    setEdit({
      ...item,
      serviceChannelId: resolveServiceChannelId(item, serviceChannels),
    });
  }

  async function save() {
    if (!edit || saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setError('');
    setNotice('');
    setModalError('');
    setModalSuccess('');
    try {
      const service = selectedServiceChannel(edit, serviceChannels);
      if (!service) throw new Error('Please select a service channel.');
      const payload: MnoAccountWrite = {
        id: edit.id,
        serviceChannelId: edit.serviceChannelId,
        name: edit.name,
        mobileNumber: edit.mobileNumber,
        agentId: edit.agentId,
        country: service.country,
        network: service.channelName,
        accountType: service.channelTypeName || edit.accountType || '',
        emoneyAmount: Math.max(0, Number(edit.emoneyAmount || 0)),
        cashAtHand: edit.id ? Math.max(0, Number(edit.cashAtHand || 0)) : 0,
        currency: edit.currency ?? 'UGX',
        openingBalance: edit.id ? Math.max(0, Number(edit.openingBalance ?? edit.emoneyAmount ?? 0)) : Math.max(0, Number(edit.emoneyAmount || 0)),
        remarks: edit.remarks,
      };
      await api.saveAccount(payload);
      await load();
      const successText = edit.id ? 'Account updated successfully.' : 'Account created successfully.';
      setModalSuccess(successText);
      setNotice(successText);
      window.setTimeout(() => {
        setEdit(null);
        setModalSuccess('');
        setModalError('');
      }, 1000);
    } catch (saveError) {
      setModalError(saveError instanceof Error ? saveError.message : 'Account could not be saved.');
    } finally {
      setSaving(false);
      saveLock.current = false;
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setError('');
    setNotice('');
    try {
      await api.deleteAccount(deleteTarget.id!);
      setDeletePassword('');
      setDeleteRemarks('');
      setDeleteTarget(null);
      setNotice('Account deleted.');
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Account could not be deleted.');
    }
  }

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const haystack = `${item.name} ${item.country} ${item.mobileNumber} ${item.network} ${item.accountType} ${item.agentId} ${item.remarks}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [items, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const totalNetworks = useMemo(() => new Set(items.map((item) => item.network).filter(Boolean)).size, [items]);
  const totalInvestment = (stats?.totalCashAtHand ?? 0) + (stats?.totalEmoney ?? 0);
  const accountFormInvalid = !edit?.name.trim() || !edit?.mobileNumber.trim() || !edit?.serviceChannelId || Number(edit.emoneyAmount) < 0;

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <section className="pageSection accountSettingsPage">
      <div className="accountSettingsMobileSummary">
        <div className="metricsGrid metricsGrid-four">
          <DashboardKPICard label="Number of Networks" value={totalNetworks} />
          <DashboardKPICard label="Cash At Hand" value={formatCurrency(stats?.totalCashAtHand)} accent="green" />
          <DashboardKPICard label="E-Cash Balance" value={formatCurrency(stats?.totalEmoney)} accent="gold" />
          <DashboardKPICard label="Total Investment" value={formatCurrency(totalInvestment)} />
        </div>
      </div>
      {serviceChannels.length === 0 && !loading && <p className="errorBanner">Create a service channel first before adding an account.</p>}
      {notice && <p className="noticeBanner">{notice}</p>}
      {error && <p className="errorBanner">{error}</p>}

      <section className="surfaceCard accountSettingsContent">
        <div className="toolbarRow">
          <label className="searchField">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts..." />
          </label>
        </div>
        <div className="toolbarRow toolbarRow-start accountSettingsContentActions"><button className="primaryButton" onClick={openCreateModal} disabled={serviceChannels.length === 0}>
          <Plus size={18} />
          Add Account
        </button></div>

        {loading ? (
          <div className="surfaceCard surfaceCard-muted"><p className="pageLead">Loading accounts...</p></div>
        ) : (
          <>
            <div className="tableWrap desktopOnly">
              <table className="workshopTable">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Account</th>
                    <th>Service Channel</th>
                    <th>Agent ID</th>
                    <th>Account No.</th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((item, index) => (
                    <tr key={item.id}>
                      <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                      <td>
                        <div className="tablePrimaryBlock">
                          <strong>{item.name}</strong>
                          <span>{item.currency || 'UGX'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="tablePrimaryBlock">
                          <strong>{item.network || '--'}</strong>
                          <span>{item.accountType || 'Channel'}</span>
                        </div>
                      </td>
                      <td>{item.agentId || '--'}</td>
                      <td>{item.mobileNumber || '--'}</td>
                      <td className={(item.emoneyAmount ?? 0) < 100000 ? 'tableNegative' : 'tablePositive'}>{formatCurrency(item.emoneyAmount)}</td>
                      <td>
                        <div className="actionRow">
                          <button type="button" className="iconButton" aria-label="View account" onClick={() => setSelected(item)}>
                            <Eye size={16} />
                          </button>
                          <button type="button" className="iconButton" aria-label="Edit account" onClick={() => openEditModal(item)}>
                            <Pencil size={16} />
                          </button>
                          <button type="button" className="iconButton dangerIcon" aria-label="Delete account" onClick={() => setDeleteTarget(item)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="emptyCell">
                        No MNO accounts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobileOnly">
              {paged.length === 0 ? (
                <div className="surfaceCard surfaceCard-muted"><p className="pageLead">No MNO accounts found.</p></div>
              ) : (
                <div className="mobileDataList">
                  {paged.map((item, index) => (
                    <article key={item.id} className="mobileDataCard">
                      <div className="mobileDataCardHeader">
                        <div>
                          <strong>{item.name}</strong>
                          <span>#{(page - 1) * PAGE_SIZE + index + 1} • {item.currency || 'UGX'}</span>
                        </div>
                        <div className="mobileDataBadgeColumn">
                          <span className={item.emoneyAmount < 100000 ? 'statusPill statusDanger' : 'statusPill statusPositive'}>
                            {formatCurrency(item.emoneyAmount)}
                          </span>
                        </div>
                      </div>
                      <div className="mobileDataRows">
                        <div className="mobileDataRow"><span className="mobileDataRowLabel">Service Channel</span><span className="mobileDataRowValue">{item.network || '--'}</span></div>
                        <div className="mobileDataRow"><span className="mobileDataRowLabel">Channel Type</span><span className="mobileDataRowValue">{item.accountType || '--'}</span></div>
                        <div className="mobileDataRow"><span className="mobileDataRowLabel">Agent ID</span><span className="mobileDataRowValue">{item.agentId || '--'}</span></div>
                        <div className="mobileDataRow"><span className="mobileDataRowLabel">Account No.</span><span className="mobileDataRowValue">{item.mobileNumber || '--'}</span></div>
                      </div>
                      <div className="mobileDataActions">
                        <button type="button" className="iconButton" aria-label="View account" onClick={() => setSelected(item)}>
                          <Eye size={16} />
                        </button>
                        <button type="button" className="iconButton" aria-label="Edit account" onClick={() => openEditModal(item)}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="iconButton dangerIcon" aria-label="Delete account" onClick={() => setDeleteTarget(item)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="tableFooter">
          <p>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(filtered.length, page * PAGE_SIZE)} of {filtered.length} accounts
          </p>
          <div className="paginationControls">
            <button type="button" className="iconButton" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              <ChevronLeft size={16} />
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button type="button" className="iconButton" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {edit && (
        <Modal
          title={edit.id ? 'Edit Account' : 'Add New Account'}
          onClose={() => {
            if (saving) return;
            setEdit(null);
            setModalSuccess('');
            setModalError('');
          }}
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          submitLabel="Save"
          busy={saving}
          busyLabel="Saving..."
          submitDisabled={accountFormInvalid}
          successMessage={modalSuccess}
          errorMessage={modalError}
          headerTone="accent"
          size="lg"
        >
          <div className="formGrid formGrid-two">
            <label>
              Service Channel
              <select value={edit.serviceChannelId ?? ''} onChange={(e) => setEdit({ ...edit, serviceChannelId: Number(e.target.value) || undefined })}>
                <option value="">Select service channel</option>
                {serviceChannels.map((service) => (
                  <option key={service.id} value={service.id}>{service.channelName} ({service.channelTypeName || 'Channel'})</option>
                ))}
              </select>
            </label>
            <label>
              Account Name
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="MTN Agent Wallet 1" />
            </label>
            <label>
              Account Number
              <input value={edit.mobileNumber} onChange={(e) => setEdit({ ...edit, mobileNumber: e.target.value })} placeholder="Enter account number" />
            </label>
            <label>
              Agent ID
              <input value={edit.agentId ?? ''} onChange={(e) => setEdit({ ...edit, agentId: e.target.value })} placeholder="AGT-123" />
            </label>
            <label>
              Currency
              <select value={edit.currency ?? 'UGX'} onChange={(e) => setEdit({ ...edit, currency: e.target.value })}>
                {['UGX', 'KES', 'TZS', 'RWF', 'USD', 'EUR', 'GBP'].map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </label>
            <label>
              Balance
              <input type="number" value={edit.emoneyAmount ?? 0} onChange={(e) => setEdit({ ...edit, emoneyAmount: Math.max(0, Number(e.target.value)) })} min={0} />
            </label>
            <label className="detailCard-wide">
              Remarks
              <textarea value={edit.remarks ?? ''} onChange={(e) => setEdit({ ...edit, remarks: e.target.value })} placeholder="Additional notes..." />
            </label>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal title="Account Details" onClose={() => setSelected(null)} onSubmit={(e) => { e.preventDefault(); setSelected(null); }} submitLabel="Close" size="lg">
          <div className="detailGrid">
            <div className="detailCard detailCard-inline"><span>Account</span><strong>{selected.name}</strong></div>
            <div className="detailCard detailCard-inline"><span>Service Channel</span><strong>{selected.network || '--'}</strong></div>
            <div className="detailCard detailCard-inline"><span>Channel Type</span><strong>{selected.accountType || '--'}</strong></div>
            <div className="detailCard detailCard-inline"><span>Country</span><strong>{selected.country || '--'}</strong></div>
            <div className="detailCard detailCard-inline"><span>Agent ID</span><strong>{selected.agentId || '--'}</strong></div>
            <div className="detailCard detailCard-inline"><span>Account No.</span><strong>{selected.mobileNumber || '--'}</strong></div>
            <div className="detailCard detailCard-inline"><span>Currency</span><strong>{selected.currency || 'UGX'}</strong></div>
            <div className="detailCard detailCard-inline"><span>Balance</span><strong>{formatCurrency(selected.emoneyAmount)}</strong></div>
            <div className="detailCard detailCard-inline"><span>Cash At Hand</span><strong>{formatCurrency(selected.cashAtHand)}</strong></div>
            <div className="detailCard detailCard-inline detailCard-wide"><span>Remarks</span><strong>{selected.remarks || '--'}</strong></div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title="Delete Account"
          onClose={() => {
            setDeleteTarget(null);
            setDeletePassword('');
            setDeleteRemarks('');
          }}
          onSubmit={(e) => {
            e.preventDefault();
            void confirmDelete();
          }}
          submitLabel="Delete Account"
          size="lg"
        >
          <div className="formGrid">
            <div className="deleteWarning">
              <TriangleAlert size={18} />
              <p>
                You are deleting <strong>{deleteTarget.name}</strong>. This confirmation flow is kept to match the reference product interaction model.
              </p>
            </div>
            <label>
              Remarks
              <textarea value={deleteRemarks} onChange={(e) => setDeleteRemarks(e.target.value)} placeholder="Explain why this account is being removed" />
            </label>
            <label>
              Password
              <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Confirm with password" />
            </label>
          </div>
        </Modal>
      )}
    </section>
  );
}
