import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import { api } from '../api/client';
import type { DashboardStats, MnoAccount, MnoWallet } from '../api/types';
import { DashboardKPICard } from '../components/DashboardKPICard';
import { Modal } from '../components/Modal';
import { formatCurrency } from '../lib/format';

const blank: MnoWallet = { agentId: 0, name: '', network: '', balance: 0 };
const PAGE_SIZE = 6;

export function MNOWalletSettingsPage() {
  const [wallets, setWallets] = useState<MnoWallet[]>([]);
  const [accounts, setAccounts] = useState<MnoAccount[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [edit, setEdit] = useState<MnoWallet | null>(null);
  const [selected, setSelected] = useState<MnoWallet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MnoWallet | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteRemarks, setDeleteRemarks] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [walletData, accountData, dashboardData] = await Promise.all([api.wallets(), api.accounts(), api.dashboard()]);
      setWallets(walletData);
      setAccounts(accountData);
      setStats(dashboardData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Wallets could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!edit) return;
    setError('');
    setNotice('');
    try {
      await api.saveWallet(edit);
      setNotice(edit.id ? 'Wallet updated.' : 'Wallet created.');
      setEdit(null);
      load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Wallet could not be saved.');
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setError('');
    setNotice('');
    try {
      await api.deleteWallet(deleteTarget.id!);
      setDeletePassword('');
      setDeleteRemarks('');
      setDeleteTarget(null);
      setNotice('Wallet deleted.');
      load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Wallet could not be deleted.');
    }
  }

  const accountName = useMemo(() => new Map(accounts.map((account) => [account.id, account.name])), [accounts]);

  const filtered = useMemo(
    () =>
      wallets.filter((wallet) => {
        const haystack = `${wallet.name} ${wallet.network} ${accountName.get(wallet.agentId) ?? ''}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [wallets, accountName, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

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
          <h1>Wallets</h1>
          <p className="pageLead">Manage operational wallets using the same dense search, view, edit, and delete workflow pattern as the reference Mobi shell.</p>
        </div>
        <button className="primaryButton" onClick={() => setEdit({ ...blank, agentId: accounts[0]?.id ?? 0 })}>
          <Plus size={18} />
          New Wallet
        </button>
      </div>

      {notice && <p className="noticeBanner">{notice}</p>}
      {error && <p className="errorBanner">{error}</p>}

      <div className="metricsGrid metricsGrid-four">
        <DashboardKPICard label="Wallet Count" value={stats?.walletCount ?? 0} />
        <DashboardKPICard label="Total Wallet Balance" value={formatCurrency(stats?.totalWalletBalance)} accent="gold" />
        <DashboardKPICard label="Linked Accounts" value={new Set(wallets.map((wallet) => wallet.agentId)).size} accent="green" />
        <DashboardKPICard label="Networks" value={new Set(wallets.map((wallet) => wallet.network).filter(Boolean)).size} />
      </div>

      <section className="surfaceCard">
        <div className="toolbarRow">
          <label className="searchField">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search wallets..." />
          </label>
        </div>

        {loading ? (
          <div className="surfaceCard surfaceCard-muted"><p className="pageLead">Loading wallets...</p></div>
        ) : (
          <>
            <div className="tableWrap desktopOnly">
              <table className="workshopTable">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Wallet</th>
                    <th>Linked Account</th>
                    <th>Network</th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((wallet, index) => (
                    <tr key={wallet.id}>
                      <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                      <td>
                        <div className="tablePrimaryBlock">
                          <strong>{wallet.name}</strong>
                          <span>{wallet.network || 'No network set'}</span>
                        </div>
                      </td>
                      <td>{accountName.get(wallet.agentId) ?? '--'}</td>
                      <td>{wallet.network || '--'}</td>
                      <td className="tableStrong">{formatCurrency(wallet.balance)}</td>
                      <td>
                        <div className="actionRow">
                          <button type="button" className="iconButton" aria-label="View wallet" onClick={() => setSelected(wallet)}>
                            <Eye size={16} />
                          </button>
                          <button type="button" className="iconButton" aria-label="Edit wallet" onClick={() => setEdit(wallet)}>
                            <Pencil size={16} />
                          </button>
                          <button type="button" className="iconButton dangerIcon" aria-label="Delete wallet" onClick={() => setDeleteTarget(wallet)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="emptyCell">
                        No wallets found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobileOnly">
              {paged.length === 0 ? (
                <div className="surfaceCard surfaceCard-muted"><p className="pageLead">No wallets found.</p></div>
              ) : (
                <div className="mobileDataList">
                  {paged.map((wallet, index) => (
                    <article key={wallet.id} className="mobileDataCard">
                      <div className="mobileDataCardHeader">
                        <div>
                          <strong>{wallet.name}</strong>
                          <span>#{(page - 1) * PAGE_SIZE + index + 1} • {wallet.network || 'No network set'}</span>
                        </div>
                        <div className="mobileDataBadgeColumn">
                          <span className="statusPill statusNeutral">{formatCurrency(wallet.balance)}</span>
                        </div>
                      </div>
                      <div className="mobileDataRows">
                        <div className="mobileDataRow"><span className="mobileDataRowLabel">Linked Account</span><span className="mobileDataRowValue">{accountName.get(wallet.agentId) ?? '--'}</span></div>
                        <div className="mobileDataRow"><span className="mobileDataRowLabel">Network</span><span className="mobileDataRowValue">{wallet.network || '--'}</span></div>
                      </div>
                      <div className="mobileDataActions">
                        <button type="button" className="iconButton" aria-label="View wallet" onClick={() => setSelected(wallet)}>
                          <Eye size={16} />
                        </button>
                        <button type="button" className="iconButton" aria-label="Edit wallet" onClick={() => setEdit(wallet)}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="iconButton dangerIcon" aria-label="Delete wallet" onClick={() => setDeleteTarget(wallet)}>
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
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(filtered.length, page * PAGE_SIZE)} of {filtered.length} wallets
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
          title={edit.id ? 'Edit Wallet' : 'Create Wallet'}
          onClose={() => setEdit(null)}
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          submitLabel={edit.id ? 'Save Changes' : 'Create Wallet'}
          headerTone="accent"
          size="lg"
        >
          <div className="formGrid formGrid-two">
            <label>
              Linked Account
              <select value={edit.agentId} onChange={(e) => setEdit({ ...edit, agentId: Number(e.target.value) })}>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Wallet Name
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="MTN Agent Wallet 1" />
            </label>
            <label>
              Network
              <input value={edit.network} onChange={(e) => setEdit({ ...edit, network: e.target.value })} placeholder="MTN" />
            </label>
            <label>
              Balance
              <input type="number" value={edit.balance} onChange={(e) => setEdit({ ...edit, balance: Number(e.target.value) })} min={0} />
            </label>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal title="Wallet Details" onClose={() => setSelected(null)} onSubmit={(e) => { e.preventDefault(); setSelected(null); }} submitLabel="Close">
          <div className="detailGrid">
            <div className="detailCard"><span>Wallet</span><strong>{selected.name}</strong></div>
            <div className="detailCard"><span>Linked Account</span><strong>{accountName.get(selected.agentId) ?? '--'}</strong></div>
            <div className="detailCard"><span>Network</span><strong>{selected.network || '--'}</strong></div>
            <div className="detailCard"><span>Balance</span><strong>{formatCurrency(selected.balance)}</strong></div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title="Delete Wallet"
          onClose={() => {
            setDeleteTarget(null);
            setDeletePassword('');
            setDeleteRemarks('');
          }}
          onSubmit={(e) => {
            e.preventDefault();
            confirmDelete();
          }}
          submitLabel="Delete Wallet"
          size="lg"
        >
          <div className="formGrid">
            <div className="deleteWarning">
              <TriangleAlert size={18} />
              <p>
                You are deleting <strong>{deleteTarget.name}</strong>. The confirmation flow matches the reference interaction pattern while deletion remains backend-backed.
              </p>
            </div>
            <label>
              Remarks
              <textarea value={deleteRemarks} onChange={(e) => setDeleteRemarks(e.target.value)} placeholder="Explain why this wallet is being removed" />
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
