import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Plus, Search } from 'lucide-react';
import { api } from '../api/client';
import type { DashboardStats, MnoTransaction, MnoWallet, TransactionType } from '../api/types';
import { DashboardKPICard } from '../components/DashboardKPICard';
import { Modal } from '../components/Modal';
import { formatCurrency, formatDateTime, transactionLabel } from '../lib/format';

const blank = { walletId: 0, transactionType: 'FLOAT_TOP_UP' as TransactionType, amount: 0, agentNumber: '', clientPhone: '', clientName: '' };
const PAGE_SIZE = 8;

export function MNOWalletTransactionsPage() {
  const [wallets, setWallets] = useState<MnoWallet[]>([]);
  const [items, setItems] = useState<MnoTransaction[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [edit, setEdit] = useState<typeof blank | null>(null);
  const [selected, setSelected] = useState<MnoTransaction | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    api.wallets().then(setWallets);
    api.transactions().then(setItems);
    api.dashboard().then(setStats);
  };

  useEffect(load, []);

  async function save() {
    if (!edit) return;
    setMessage('');
    try {
      await api.recordTransaction(edit);
      setMessage('Transaction recorded');
      setEdit(null);
      load();
    } catch {
      setMessage('Transaction failed');
    }
  }

  const filtered = useMemo(() => items.filter(item => {
    const haystack = `${item.mnoWalletName} ${item.agentNumber} ${item.clientPhone} ${item.clientName} ${item.transactionType}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  }), [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const currentWallet = wallets.find(wallet => wallet.id === edit?.walletId);
  const previousBalance = Number(currentWallet?.balance ?? 0);
  const amount = Number(edit?.amount ?? 0);
  const nextBalance = (edit?.transactionType === 'FLOAT_TOP_UP' || edit?.transactionType === 'FLOAT_WITHDRAWAL') ? previousBalance + amount : previousBalance - amount;

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <section className="pageSection">
      <div className="pageHero"><div><p className="eyebrow">Agent Operations</p><h1>Mobi Transactions</h1></div></div>

      <div className="metricsGrid metricsGrid-four">
        <DashboardKPICard label="Total Top-ups" value={formatCurrency(stats?.totalDeposits)} hint="Completed deposits" accent="green" />
        <DashboardKPICard label="Total Withdrawals" value={formatCurrency(stats?.totalWithdrawals)} hint="Completed withdrawals" />
        <DashboardKPICard label="Net Float Change" value={formatCurrency(stats?.netFloatChange)} hint="Deposits minus withdrawals" accent="gold" />
        <DashboardKPICard label="Transaction Count" value={stats?.transactionCount ?? 0} hint="Recorded transactions" />
      </div>

      {message && <p className="noticeBanner">{message}</p>}

      <section className="surfaceCard">
        <div className="toolbarRow">
          <label className="searchField"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." /></label>
          <button className="primaryButton" onClick={() => setEdit({ ...blank, walletId: wallets[0]?.id ?? 0 })}><Plus size={18} />Record Transaction</button>
        </div>

        <div className="tableWrap">
          <table className="workshopTable">
            <thead><tr><th>Date</th><th>Wallet</th><th>Agent ID</th><th>Client Phone</th><th>Type</th><th>Amount</th><th>Prev. Balance</th><th>New Balance</th><th>Actions</th></tr></thead>
            <tbody>
              {paged.map(item => (
                <tr key={item.id}>
                  <td>{formatDateTime(item.date)}</td>
                  <td>{item.mnoWalletName}</td>
                  <td>{item.agentNumber || '--'}</td>
                  <td>{item.clientPhone || '--'}</td>
                  <td><span className={`statusPill ${item.transactionType === 'FLOAT_TOP_UP' || item.transactionType === 'FLOAT_WITHDRAWAL' ? 'statusPositive' : 'statusNeutral'}`}>{transactionLabel(item.transactionType)}</span></td>
                  <td className={item.transactionType === 'FLOAT_TOP_UP' || item.transactionType === 'FLOAT_WITHDRAWAL' ? 'tablePositive' : 'tableNegative'}>{item.transactionType === 'FLOAT_TOP_UP' || item.transactionType === 'FLOAT_WITHDRAWAL' ? '+' : '-'}{formatCurrency(item.amount)}</td>
                  <td>{formatCurrency(item.previousBalance)}</td>
                  <td className="tableStrong">{formatCurrency(item.balance)}</td>
                  <td><button type="button" className="iconButton" aria-label="View transaction" onClick={() => setSelected(item)}><Eye size={16} /></button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="emptyCell">No transactions found.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="tableFooter">
          <p>Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(filtered.length, page * PAGE_SIZE)} of {filtered.length} transactions</p>
          <div className="paginationControls">
            <button type="button" className="iconButton" disabled={page === 1} onClick={() => setPage(current => Math.max(1, current - 1))}><ChevronLeft size={16} /></button>
            <span>{page} / {totalPages}</span>
            <button type="button" className="iconButton" disabled={page === totalPages} onClick={() => setPage(current => Math.min(totalPages, current + 1))}><ChevronRight size={16} /></button>
          </div>
        </div>
      </section>

      {edit && (
        <Modal title="Record Transaction" onClose={() => setEdit(null)} onSubmit={e => { e.preventDefault(); save(); }} submitLabel="Record Transaction" size="lg">
          <div className="formGrid formGrid-two">
            <label>Phone Number<input value={edit.clientPhone} onChange={e => setEdit({ ...edit, clientPhone: e.target.value, clientName: e.target.value.length > 5 ? 'Verified Client Name' : '' })} placeholder="+256..." /></label>
            <label>Channel Name<select value={edit.walletId} onChange={e => setEdit({ ...edit, walletId: Number(e.target.value) })}>{wallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.name} ({wallet.network})</option>)}</select></label>
            <label>Transaction Type<select value={edit.transactionType} onChange={e => setEdit({ ...edit, transactionType: e.target.value as TransactionType })}><option value="FLOAT_TOP_UP">Float Top-up</option><option value="FLOAT_WITHDRAWAL">Float Withdrawal</option><option value="DEPOSIT">Deposit</option><option value="FLOAT_TRANSFER">Float Transfer</option></select></label>
            <label>Agent Number<input value={edit.agentNumber} onChange={e => setEdit({ ...edit, agentNumber: e.target.value })} placeholder="AGT-001" /></label>
            <label>Amount (UGX)<input type="number" value={edit.amount} onChange={e => setEdit({ ...edit, amount: Number(e.target.value) })} min={0} /></label>
            <label>Client Name<input value={edit.clientName} onChange={e => setEdit({ ...edit, clientName: e.target.value })} placeholder="Client name" /></label>
          </div>
          <div className="balancePreview"><div><span>Previous Balance</span><strong>{formatCurrency(previousBalance)}</strong></div><div><span>New Balance</span><strong>{formatCurrency(nextBalance)}</strong></div></div>
        </Modal>
      )}

      {selected && (
        <Modal title="Transaction Details" onClose={() => setSelected(null)} onSubmit={e => { e.preventDefault(); setSelected(null); }} submitLabel="Close" size="lg">
          <div className="detailGrid">
            <div className="detailCard"><span>Date</span><strong>{formatDateTime(selected.date)}</strong></div>
            <div className="detailCard"><span>Wallet</span><strong>{selected.mnoWalletName}</strong></div>
            <div className="detailCard"><span>Agent ID</span><strong>{selected.agentNumber || '--'}</strong></div>
            <div className="detailCard"><span>Client Phone</span><strong>{selected.clientPhone || '--'}</strong></div>
            <div className="detailCard"><span>Client Name</span><strong>{selected.clientName || '--'}</strong></div>
            <div className="detailCard"><span>Status</span><strong>{selected.status}</strong></div>
            <div className="detailCard"><span>Transaction Type</span><strong>{transactionLabel(selected.transactionType)}</strong></div>
            <div className="detailCard"><span>Amount</span><strong className={selected.transactionType === 'FLOAT_TOP_UP' || selected.transactionType === 'FLOAT_WITHDRAWAL' ? 'tablePositive' : 'tableNegative'}>{formatCurrency(selected.amount)}</strong></div>
            <div className="detailCard"><span>Previous Balance</span><strong>{formatCurrency(selected.previousBalance)}</strong></div>
            <div className="detailCard"><span>New Balance</span><strong>{formatCurrency(selected.balance)}</strong></div>
          </div>
        </Modal>
      )}
    </section>
  );
}
