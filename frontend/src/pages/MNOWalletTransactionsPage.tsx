import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Plus, Search } from 'lucide-react';
import { api } from '../api/client';
import type { DashboardStats, MnoAccount, MnoTransaction, TransactionType } from '../api/types';
import { DashboardKPICard } from '../components/DashboardKPICard';
import { Modal } from '../components/Modal';
import { formatCurrency, formatDateTime, transactionLabel } from '../lib/format';

const blank = { accountId: 0, transactionType: 'DEPOSIT' as TransactionType, amount: 0, clientPhone: '', clientId: '' };
const PAGE_SIZE = 8;

export function MNOWalletTransactionsPage() {
  const [accounts, setAccounts] = useState<MnoAccount[]>([]);
  const [items, setItems] = useState<MnoTransaction[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [edit, setEdit] = useState<typeof blank | null>(null);
  const [selected, setSelected] = useState<MnoTransaction | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [accountData, transactionData, dashboardData] = await Promise.all([
        api.accounts(),
        api.transactions(),
        api.dashboard(),
      ]);
      setAccounts(accountData);
      setItems(transactionData);
      setStats(dashboardData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Transactions could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!edit) return;
    setMessage('');
    setError('');
    try {
      await api.recordTransaction(edit);
      setMessage('Transaction recorded');
      setEdit(null);
      load();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  const filtered = useMemo(() => items.filter(item => {
    const haystack = `${item.accountName} ${item.agentNumber} ${item.clientPhone} ${item.clientId ?? item.clientName ?? ''} ${item.transactionType}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  }), [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const currentAccount = accounts.find(account => account.id === edit?.accountId);
  const previousEmoney = Number(currentAccount?.emoneyAmount ?? 0);
  const previousCash = Number(currentAccount?.cashAtHand ?? 0);
  const amount = Number(edit?.amount ?? 0);
  const isWithdrawal = edit?.transactionType === 'WITHDRAW' || edit?.transactionType === 'FLOAT_WITHDRAWAL';
  const nextEmoney = edit?.transactionType === 'DEPOSIT' ? previousEmoney - amount : isWithdrawal || edit?.transactionType === 'FLOAT_TOP_UP' ? previousEmoney + amount : previousEmoney - amount;
  const nextCash = edit?.transactionType === 'DEPOSIT' ? previousCash + amount : isWithdrawal ? previousCash - amount : previousCash;
  const invalidEmoney = nextEmoney < 0;
  const invalidCash = nextCash < 0;
  const invalidBalanceMessage = invalidEmoney ? 'Insufficient e-cash balance.' : invalidCash ? 'Insufficient cash at hand.' : '';

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
        <DashboardKPICard label="Total Deposits" value={formatCurrency(stats?.totalDeposits)} hint="E-cash reduced, cash increased" accent="green" />
        <DashboardKPICard label="Total Withdrawals" value={formatCurrency(stats?.totalWithdrawals)} hint="Cash reduced, e-cash increased" />
        <DashboardKPICard label="Net E-cash Change" value={formatCurrency(stats?.netFloatChange)} hint="Withdrawals minus deposits" accent="gold" />
        <DashboardKPICard label="Transaction Count" value={stats?.transactionCount ?? 0} hint="Recorded transactions" />
      </div>

      {message && <p className="noticeBanner">{message}</p>}
      {error && <p className="errorBanner">{error}</p>}

      <section className="surfaceCard">
        <div className="toolbarRow">
          <label className="searchField"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." /></label>
          <button className="primaryButton" onClick={() => setEdit({ ...blank, accountId: accounts[0]?.id ?? 0 })}><Plus size={18} />Record Transaction</button>
        </div>

        {loading ? (
          <div className="surfaceCard surfaceCard-muted"><p className="pageLead">Loading transactions...</p></div>
        ) : (
        <div className="tableWrap">
          <table className="workshopTable">
            <thead><tr><th>Date</th><th>Account</th><th>Agent ID</th><th>Client Phone</th><th>Type</th><th>Amount</th><th>Prev. E-cash</th><th>New E-cash</th><th>Actions</th></tr></thead>
            <tbody>
              {paged.map(item => (
                <tr key={item.id}>
                  <td>{formatDateTime(item.date)}</td>
                  <td>{item.accountName || item.mnoWalletName || '--'}</td>
                  <td>{item.agentNumber || '--'}</td>
                  <td>{item.clientPhone || '--'}</td>
                  <td><span className={`statusPill ${item.transactionType === 'WITHDRAW' || item.transactionType === 'FLOAT_WITHDRAWAL' ? 'statusPositive' : 'statusNeutral'}`}>{transactionLabel(item.transactionType)}</span></td>
                  <td className={item.transactionType === 'WITHDRAW' || item.transactionType === 'FLOAT_WITHDRAWAL' ? 'tablePositive' : 'tableNegative'}>{item.transactionType === 'WITHDRAW' || item.transactionType === 'FLOAT_WITHDRAWAL' ? '+' : '-'}{formatCurrency(item.amount)}</td>
                  <td>{formatCurrency(item.previousEmoney ?? item.previousBalance)}</td>
                  <td className="tableStrong">{formatCurrency(item.newEmoney ?? item.balance)}</td>
                  <td><button type="button" className="iconButton" aria-label="View transaction" onClick={() => setSelected(item)}><Eye size={16} /></button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="emptyCell">No transactions found.</td></tr>}
            </tbody>
          </table>
        </div>
        )}

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
            <label>Phone Number<input value={edit.clientPhone} onChange={e => setEdit({ ...edit, clientPhone: e.target.value })} placeholder="+256..." /></label>
            <label>Account<select value={edit.accountId} onChange={e => setEdit({ ...edit, accountId: Number(e.target.value) })}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name} ({account.network})</option>)}</select></label>
            <label>Transaction Type<select value={edit.transactionType} onChange={e => setEdit({ ...edit, transactionType: e.target.value as TransactionType })}><option value="DEPOSIT">Deposit</option><option value="FLOAT_WITHDRAWAL">Withdrawal</option><option value="FLOAT_TOP_UP">Float Top-up</option></select></label>
            <label>Amount (UGX)<input type="number" value={edit.amount} onChange={e => setEdit({ ...edit, amount: Number(e.target.value) })} min={0} /></label>
            <label>Client ID<input value={edit.clientId} onChange={e => setEdit({ ...edit, clientId: e.target.value })} placeholder="Client ID" /></label>
          </div>
          <div className="balancePreview">
            <div><span>Previous E-cash</span><strong>{formatCurrency(previousEmoney)}</strong></div>
            <div><span>New E-cash</span><strong>{invalidEmoney ? 'Unavailable' : formatCurrency(nextEmoney)}</strong></div>
            <div><span>Previous Cash at Hand</span><strong>{formatCurrency(previousCash)}</strong></div>
            <div><span>New Cash at Hand</span><strong>{invalidCash ? 'Unavailable' : formatCurrency(nextCash)}</strong></div>
          </div>
          {invalidBalanceMessage && <p className="errorBanner">{invalidBalanceMessage}</p>}
        </Modal>
      )}

      {selected && (
        <Modal title="Transaction Details" onClose={() => setSelected(null)} onSubmit={e => { e.preventDefault(); setSelected(null); }} submitLabel="Close" size="lg">
          <div className="detailGrid">
            <div className="detailCard"><span>Date</span><strong>{formatDateTime(selected.date)}</strong></div>
            <div className="detailCard"><span>Account</span><strong>{selected.accountName || selected.mnoWalletName || '--'}</strong></div>
            <div className="detailCard"><span>Agent ID</span><strong>{selected.agentNumber || '--'}</strong></div>
            <div className="detailCard"><span>Client Phone</span><strong>{selected.clientPhone || '--'}</strong></div>
            <div className="detailCard"><span>Client ID</span><strong>{selected.clientId || selected.clientName || '--'}</strong></div>
            <div className="detailCard"><span>Status</span><strong>{selected.status}</strong></div>
            <div className="detailCard"><span>Transaction Type</span><strong>{transactionLabel(selected.transactionType)}</strong></div>
            <div className="detailCard"><span>Amount</span><strong className={selected.transactionType === 'WITHDRAW' || selected.transactionType === 'FLOAT_WITHDRAWAL' ? 'tablePositive' : 'tableNegative'}>{formatCurrency(selected.amount)}</strong></div>
            <div className="detailCard"><span>Previous E-cash</span><strong>{formatCurrency(selected.previousEmoney ?? selected.previousBalance)}</strong></div>
            <div className="detailCard"><span>New E-cash</span><strong>{formatCurrency(selected.newEmoney ?? selected.balance)}</strong></div>
            <div className="detailCard"><span>Previous Cash at Hand</span><strong>{formatCurrency(selected.previousCashAtHand)}</strong></div>
            <div className="detailCard"><span>New Cash at Hand</span><strong>{formatCurrency(selected.newCashAtHand)}</strong></div>
          </div>
        </Modal>
      )}
    </section>
  );
}
