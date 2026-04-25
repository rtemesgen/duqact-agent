import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import { api } from '../api/client';
import type { DashboardStats, MnoAccount } from '../api/types';
import { DashboardKPICard } from '../components/DashboardKPICard';
import { Modal } from '../components/Modal';
import { formatCurrency } from '../lib/format';

const blank: MnoAccount = {
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

export function MobiAgentSettingsPage() {
  const [items, setItems] = useState<MnoAccount[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [edit, setEdit] = useState<MnoAccount | null>(null);
  const [selected, setSelected] = useState<MnoAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MnoAccount | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteRemarks, setDeleteRemarks] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    api.accounts().then(setItems);
    api.dashboard().then(setStats);
  };

  useEffect(load, []);

  async function save() {
    if (!edit) return;
    await api.saveAccount(edit);
    setEdit(null);
    load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await api.deleteAccount(deleteTarget.id!);
    setDeletePassword('');
    setDeleteRemarks('');
    setDeleteTarget(null);
    load();
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

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <section className="pageSection">
      <div className="pageHero pageHero-row">
        <div>
          <p className="eyebrow">Agent Operations</p>
          <h1>Mobi Account Setting</h1>
          <p className="pageLead">Manage MNO accounts, cash positions, and e-money balances in the same workshop flow as the reference product.</p>
        </div>
        <button className="primaryButton" onClick={() => setEdit(blank)}>
          <Plus size={18} />
          Add Account
        </button>
      </div>

      <div className="metricsGrid metricsGrid-four">
        <DashboardKPICard label="Number of Networks" value={totalNetworks} />
        <DashboardKPICard label="Cash At Hand" value={formatCurrency(stats?.totalCashAtHand)} accent="green" />
        <DashboardKPICard label="E-Money" value={formatCurrency(stats?.totalEmoney)} accent="gold" />
        <DashboardKPICard label="Total Investment" value={formatCurrency(totalInvestment)} />
      </div>

      <section className="surfaceCard">
        <div className="toolbarRow">
          <label className="searchField">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts..." />
          </label>
        </div>

        <div className="tableWrap">
          <table className="workshopTable">
            <thead>
              <tr>
                <th>#</th>
                <th>Account</th>
                <th>Channel Type</th>
                <th>Channel Name</th>
                <th>Agent ID</th>
                <th>Account No.</th>
                <th>Balance (UGX)</th>
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
                      <span>{item.country || 'No country set'}</span>
                    </div>
                  </td>
                  <td>{item.accountType || 'MNO'}</td>
                  <td>{item.network || '--'}</td>
                  <td>{item.agentId || '--'}</td>
                  <td>{item.mobileNumber || '--'}</td>
                  <td className={(item.emoneyAmount ?? 0) < 100000 ? 'tableNegative' : 'tablePositive'}>{formatCurrency(item.emoneyAmount)}</td>
                  <td>
                    <div className="actionRow">
                      <button type="button" className="iconButton" aria-label="View account" onClick={() => setSelected(item)}>
                        <Eye size={16} />
                      </button>
                      <button type="button" className="iconButton" aria-label="Edit account" onClick={() => setEdit(item)}>
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
                  <td colSpan={8} className="emptyCell">
                    No MNO accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
          onClose={() => setEdit(null)}
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          submitLabel={edit.id ? 'Save Changes' : 'Create Account'}
          headerTone="accent"
          size="lg"
        >
          <div className="formGrid formGrid-two">
            <label>
              Account Name
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="MTN Agent Wallet 1" />
            </label>
            <label>
              Country
              <input value={edit.country} onChange={(e) => setEdit({ ...edit, country: e.target.value })} placeholder="Uganda" />
            </label>
            <label>
              Agent ID
              <input value={edit.agentId ?? ''} onChange={(e) => setEdit({ ...edit, agentId: e.target.value })} placeholder="AGT-123" />
            </label>
            <label>
              Channel Name
              <input value={edit.network} onChange={(e) => setEdit({ ...edit, network: e.target.value })} placeholder="MTN Mobile Money" />
            </label>
            <label>
              Account Number
              <input value={edit.mobileNumber} onChange={(e) => setEdit({ ...edit, mobileNumber: e.target.value })} placeholder="Mobile or Bank No." />
            </label>
            <label>
              Channel Type
              <input value={edit.accountType} onChange={(e) => setEdit({ ...edit, accountType: e.target.value })} placeholder="MNO" />
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
              Opening Balance
              <input type="number" value={edit.openingBalance ?? 0} onChange={(e) => setEdit({ ...edit, openingBalance: Number(e.target.value) })} min={0} />
            </label>
            <label>
              E-Money
              <input type="number" value={edit.emoneyAmount} onChange={(e) => setEdit({ ...edit, emoneyAmount: Number(e.target.value) })} min={0} />
            </label>
            <label>
              Cash At Hand
              <input type="number" value={edit.cashAtHand} onChange={(e) => setEdit({ ...edit, cashAtHand: Number(e.target.value) })} min={0} />
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
            <div className="detailCard"><span>Account</span><strong>{selected.name}</strong></div>
            <div className="detailCard"><span>Country</span><strong>{selected.country || '--'}</strong></div>
            <div className="detailCard"><span>Channel Type</span><strong>{selected.accountType || 'MNO'}</strong></div>
            <div className="detailCard"><span>Channel Name</span><strong>{selected.network || '--'}</strong></div>
            <div className="detailCard"><span>Agent ID</span><strong>{selected.agentId || '--'}</strong></div>
            <div className="detailCard"><span>Account No.</span><strong>{selected.mobileNumber || '--'}</strong></div>
            <div className="detailCard"><span>Currency</span><strong>{selected.currency || 'UGX'}</strong></div>
            <div className="detailCard"><span>Opening Balance</span><strong>{formatCurrency(selected.openingBalance)}</strong></div>
            <div className="detailCard"><span>E-Money</span><strong>{formatCurrency(selected.emoneyAmount)}</strong></div>
            <div className="detailCard"><span>Cash At Hand</span><strong>{formatCurrency(selected.cashAtHand)}</strong></div>
            <div className="detailCard detailCard-wide"><span>Remarks</span><strong>{selected.remarks || '--'}</strong></div>
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
            confirmDelete();
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
