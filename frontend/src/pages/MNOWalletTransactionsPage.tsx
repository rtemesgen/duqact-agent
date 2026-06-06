import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Plus, Search } from 'lucide-react';
import { api } from '../api/client';
import type { DashboardStats, MnoAccount, MnoTransaction, TransactionType } from '../api/types';
import { DashboardKPICard } from '../components/DashboardKPICard';
import { Modal } from '../components/Modal';
import { formatCurrency, formatDateTime, generateTransactionId, transactionLabel } from '../lib/format';

function createBlank(accountId = 0) {
  return { accountId, transactionType: 'DEPOSIT' as TransactionType, amount: 0, clientPhone: '', transactionId: generateTransactionId(), clientId: '' };
}
const PAGE_SIZE = 8;
type TransactionModalStep = 'closed' | 'form' | 'confirm';
type TransactionFormField = 'clientPhone' | 'accountId' | 'transactionType' | 'amount' | 'transactionId' | 'clientId';
type TransactionFormErrors = Partial<Record<TransactionFormField, string>>;

export function MNOWalletTransactionsPage() {
  const [accounts, setAccounts] = useState<MnoAccount[]>([]);
  const [items, setItems] = useState<MnoTransaction[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [edit, setEdit] = useState<ReturnType<typeof createBlank> | null>(null);
  const [modalStep, setModalStep] = useState<TransactionModalStep>('closed');
  const [balancesHidden, setBalancesHidden] = useState(true);
  const [confirmAttempted, setConfirmAttempted] = useState(false);
  const [selected, setSelected] = useState<MnoTransaction | null>(null);
  const [message, setMessage] = useState('');
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
    if (!edit || saveLock.current) return;
    if (hasRequiredFieldErrors || submitBlockReason) return;
    saveLock.current = true;
    setSaving(true);
    setMessage('');
    setError('');
    setModalSuccess('');
    setModalError('');
    try {
      await api.recordTransaction(edit);
      await load();
      const successText = 'Transaction recorded successfully.';
      setModalSuccess(successText);
      setMessage(successText);
      window.setTimeout(() => {
        setModalStep('closed');
        setEdit(null);
        setBalancesHidden(true);
        setConfirmAttempted(false);
        setModalSuccess('');
        setModalError('');
      }, 1000);
    } catch (saveError) {
      setModalError(saveError instanceof Error ? saveError.message : 'Transaction failed.');
    } finally {
      setSaving(false);
      saveLock.current = false;
    }
  }

  const filtered = useMemo(() => items.filter(item => {
    const haystack = `${item.accountName} ${item.agentNumber} ${item.clientPhone} ${item.transactionId ?? ''} ${item.clientId ?? item.clientName ?? ''} ${item.transactionType}`.toLowerCase();
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
  const requiredFieldErrors: TransactionFormErrors = {
    clientPhone: edit?.clientPhone.trim() ? undefined : 'Phone number is required.',
    accountId: edit?.accountId ? undefined : 'Account is required.',
    transactionType: edit?.transactionType ? undefined : 'Transaction type is required.',
    amount: amount > 0 ? undefined : 'Amount is required.',
    transactionId: edit?.transactionId.trim() ? undefined : 'Transaction ID is required.',
    clientId: edit?.clientId.trim() ? undefined : 'Client ID is required.',
  };
  const hasRequiredFieldErrors = Object.values(requiredFieldErrors).some(Boolean);
  const submitBlockReason =
    Boolean(edit?.accountId) && !currentAccount
      ? 'The selected account is not available right now. Re-select the account and try again.'
      : invalidEmoney
        ? 'Insufficient e-cash balance.'
        : invalidCash
          ? 'Insufficient cash at hand.'
          : '';
  const submitDisabled = Boolean(submitBlockReason);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <section className="pageSection mnoTransactionsPage">
      <div className="mnoTransactionsMobileSummary">
        <div className="metricsGrid metricsGrid-four">
        <DashboardKPICard label="Total Deposits" value={formatCurrency(stats?.totalDeposits)} accent="green" />
        <DashboardKPICard label="Total Withdrawals" value={formatCurrency(stats?.totalWithdrawals)}  />
        <DashboardKPICard label="Net E-cash Change" value={formatCurrency(Math.abs(Number(stats?.netFloatChange ?? 0)))}  accent="gold" />
        <DashboardKPICard label="Transaction Count" value={stats?.transactionCount ?? 0} />
        </div>
      </div>

      {message && <p className="noticeBanner">{message}</p>}
      {error && <p className="errorBanner">{error}</p>}

      <section className="surfaceCard mnoTransactionsContent">
        <div className="toolbarRow">
          <label className="searchField"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." /></label>
          <button className="primaryButton" onClick={() => { setBalancesHidden(true); setModalStep('form'); setModalError(''); setModalSuccess(''); setConfirmAttempted(false); setEdit(createBlank(accounts[0]?.id ?? 0)); }}><Plus size={18} />Record Transaction</button>
        </div>

        {loading ? (
          <div className="surfaceCard surfaceCard-muted"><p className="pageLead">Loading transactions...</p></div>
        ) : (
          <>
            <div className="tableWrap desktopOnly">
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
                      <td className={item.transactionType === 'WITHDRAW' || item.transactionType === 'FLOAT_WITHDRAWAL' ? 'tablePositive' : 'accentText'}>{formatCurrency(item.amount)}</td>
                      <td>{formatCurrency(item.previousEmoney ?? item.previousBalance)}</td>
                      <td className="tableStrong">{formatCurrency(item.newEmoney ?? item.balance)}</td>
                      <td><button type="button" className="iconButton" aria-label="View transaction" onClick={() => setSelected(item)}><Eye size={16} /></button></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={9} className="emptyCell">No transactions found.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="mobileOnly">
              {paged.length === 0 ? (
                <div className="surfaceCard surfaceCard-muted"><p className="pageLead">No transactions found.</p></div>
              ) : (
                <div className="mobileDataList">
                  {paged.map((item) => {
                    const positive = item.transactionType === 'WITHDRAW' || item.transactionType === 'FLOAT_WITHDRAWAL';
                    return (
                      <article key={item.id} className="mobileDataCard">
                        <div className="mobileDataCardHeader">
                          <div>
                            <strong>{item.accountName || item.mnoWalletName || '--'}</strong>
                            <span>{formatDateTime(item.date)}</span>
                          </div>
                          <div className="mobileDataBadgeColumn">
                            <span className={`statusPill ${positive ? 'statusPositive' : 'statusNeutral'}`}>{transactionLabel(item.transactionType)}</span>
                            <span className={`mobileDataAmount ${positive ? 'tablePositive' : 'accentText'}`}>{formatCurrency(item.amount)}</span>
                          </div>
                        </div>
                        <div className="mobileDataRows">
                          <div className="mobileDataRow"><span className="mobileDataRowLabel">Agent ID</span><span className="mobileDataRowValue">{item.agentNumber || '--'}</span></div>
                          <div className="mobileDataRow"><span className="mobileDataRowLabel">Client Phone</span><span className="mobileDataRowValue">{item.clientPhone || '--'}</span></div>
                          <div className="mobileDataRow"><span className="mobileDataRowLabel">Previous E-cash</span><span className="mobileDataRowValue">{formatCurrency(item.previousEmoney ?? item.previousBalance)}</span></div>
                          <div className="mobileDataRow"><span className="mobileDataRowLabel">New E-cash</span><span className="mobileDataRowValue">{formatCurrency(item.newEmoney ?? item.balance)}</span></div>
                        </div>
                        <div className="mobileDataActions">
                          <button type="button" className="iconButton" aria-label="View transaction" onClick={() => setSelected(item)}><Eye size={16} /></button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </>
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

      {edit && modalStep === 'form' && (
        <Modal
          title="Record Transaction"
          onClose={() => {
            if (saving) return;
            setModalStep('closed');
            setEdit(null);
            setBalancesHidden(true);
            setConfirmAttempted(false);
            setModalSuccess('');
            setModalError('');
          }}
          onSubmit={e => {
            e.preventDefault();
            setConfirmAttempted(true);
            setBalancesHidden(true);
            if (hasRequiredFieldErrors) return;
            setModalStep('confirm');
          }}
          submitLabel="Confirm"
          submitDisabled={false}
          size="lg"
        >
          <div className="formGrid formGrid-two">
            <label>Phone Number<input className={confirmAttempted && requiredFieldErrors.clientPhone ? 'fieldInvalid' : ''} value={edit.clientPhone} onChange={e => setEdit({ ...edit, clientPhone: e.target.value })} placeholder="+256..." />{confirmAttempted && requiredFieldErrors.clientPhone ? <span className="fieldErrorText">{requiredFieldErrors.clientPhone}</span> : null}</label>
            <label>Account<select className={confirmAttempted && requiredFieldErrors.accountId ? 'fieldInvalid' : ''} value={edit.accountId} onChange={e => setEdit({ ...edit, accountId: Number(e.target.value) })}>{accounts.map(account => <option key={account.id} value={account.id}>{account.name} ({account.network})</option>)}</select>{confirmAttempted && requiredFieldErrors.accountId ? <span className="fieldErrorText">{requiredFieldErrors.accountId}</span> : null}</label>
            <label>Transaction Type<select className={confirmAttempted && requiredFieldErrors.transactionType ? 'fieldInvalid' : ''} value={edit.transactionType} onChange={e => setEdit({ ...edit, transactionType: e.target.value as TransactionType })}><option value="DEPOSIT">Deposit</option><option value="FLOAT_WITHDRAWAL">Withdrawal</option><option value="FLOAT_TOP_UP">Float Top-up</option></select>{confirmAttempted && requiredFieldErrors.transactionType ? <span className="fieldErrorText">{requiredFieldErrors.transactionType}</span> : null}</label>
            <label>Amount (UGX)<input className={confirmAttempted && requiredFieldErrors.amount ? 'fieldInvalid' : ''} type="number" value={edit.amount} onChange={e => setEdit({ ...edit, amount: Math.max(0, Number(e.target.value)) })} min={0} />{confirmAttempted && requiredFieldErrors.amount ? <span className="fieldErrorText">{requiredFieldErrors.amount}</span> : null}</label>
            <label>Transaction ID<input className={confirmAttempted && requiredFieldErrors.transactionId ? 'fieldInvalid' : ''} value={edit.transactionId} onChange={e => setEdit({ ...edit, transactionId: e.target.value })} placeholder="Transaction ID" />{confirmAttempted && requiredFieldErrors.transactionId ? <span className="fieldErrorText">{requiredFieldErrors.transactionId}</span> : null}</label>
            <label>Client ID<input className={confirmAttempted && requiredFieldErrors.clientId ? 'fieldInvalid' : ''} value={edit.clientId} onChange={e => setEdit({ ...edit, clientId: e.target.value })} placeholder="Client ID" />{confirmAttempted && requiredFieldErrors.clientId ? <span className="fieldErrorText">{requiredFieldErrors.clientId}</span> : null}</label>
          </div>
        </Modal>
      )}

      {edit && modalStep === 'confirm' && (
        <Modal
          title="Confirm Transaction Entry"
          onClose={() => {
            if (saving) return;
            setModalStep('form');
            setModalSuccess('');
            setModalError('');
          }}
          onSubmit={e => {
            e.preventDefault();
            void save();
          }}
          submitLabel="Save"
          busy={saving}
          busyLabel="Saving..."
          submitDisabled={submitDisabled}
          successMessage={modalSuccess}
          errorMessage={modalError || submitBlockReason}
          size="lg"
        >
          <div className="receiptPreview receiptPreview-modal">
            <div className="receiptCard">
              <div className="receiptHead">
                <span>Receipt Preview</span>
                <strong>Mobi Receipt</strong>
              </div>
              <div className="receiptBody">
                <div className="receiptRows">
                  <div className="receiptRow">
                    <span className="receiptRowLabel">Phone Number</span>
                    <div className="receiptRowValue">
                      <strong>{edit.clientPhone}</strong>
                    </div>
                  </div>
                  <div className="receiptRow">
                    <span className="receiptRowLabel">Account</span>
                    <div className="receiptRowValue">
                      <strong>{currentAccount?.name ?? '--'}</strong>
                      <small>{currentAccount?.network || '--'}</small>
                    </div>
                  </div>
                  <div className="receiptRow">
                    <span className="receiptRowLabel">Transaction Type</span>
                    <div className="receiptRowValue">
                      <strong className={isWithdrawal ? 'tablePositive' : 'tableNegative'}>{transactionLabel(edit.transactionType)}</strong>
                    </div>
                  </div>
                  <div className="receiptRow">
                    <span className="receiptRowLabel">Transaction ID</span>
                    <div className="receiptRowValue">
                      <strong>{edit.transactionId}</strong>
                    </div>
                  </div>
                  <div className="receiptRow">
                    <span className="receiptRowLabel">Amount</span>
                    <div className="receiptRowValue">
                      <strong className="accentText receiptAmountValue">{formatCurrency(amount)}</strong>
                    </div>
                  </div>
                  <div className="receiptRow">
                    <span className="receiptRowLabel">Client ID</span>
                    <div className="receiptRowValue">
                      <strong>{edit.clientId}</strong>
                    </div>
                  </div>
                </div>
                <div className="receiptDivider" />
                <div className="receiptSection">
                  <div className="receiptSectionHeader">
                    <span>Balance Information</span>
                    <button type="button" className="receiptSectionToggle" onClick={() => setBalancesHidden(current => !current)}>
                      {balancesHidden ? 'Show' : 'Hide'}
                    </button>
                  </div>
                  {!balancesHidden && (
                    <div className="receiptRows receiptBalanceRows">
                      <div className="receiptRow">
                        <span className="receiptRowLabel">E-cash After</span>
                        <div className="receiptRowValue">
                          <strong>{invalidEmoney ? 'Unavailable' : formatCurrency(nextEmoney)}</strong>
                        </div>
                      </div>
                      <div className="receiptRow">
                        <span className="receiptRowLabel">Cash at Hand After</span>
                        <div className="receiptRowValue">
                          <strong>{invalidCash ? 'Unavailable' : formatCurrency(nextCash)}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="receiptSignature">
                  <div />
                  <p>Digital Signature Validated</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {selected && (
        <Modal title="Transaction Details" onClose={() => setSelected(null)} onSubmit={e => { e.preventDefault(); setSelected(null); }} submitLabel="Close" size="lg">
          <div className="detailGrid">
            <div className="detailCard detailCard-inline"><span>Date</span><strong>{formatDateTime(selected.date)}</strong></div>
            <div className="detailCard detailCard-inline"><span>Account</span><strong>{selected.accountName || selected.mnoWalletName || '--'}</strong></div>
            <div className="detailCard detailCard-inline"><span>Agent ID</span><strong>{selected.agentNumber || '--'}</strong></div>
            <div className="detailCard detailCard-inline"><span>Client Phone</span><strong>{selected.clientPhone || '--'}</strong></div>
            <div className="detailCard detailCard-inline"><span>Transaction ID</span><strong>{selected.transactionId || '--'}</strong></div>
            <div className="detailCard detailCard-inline"><span>Client ID</span><strong>{selected.clientId || selected.clientName || '--'}</strong></div>
            <div className="detailCard detailCard-inline"><span>Status</span><strong>{selected.status}</strong></div>
            <div className="detailCard detailCard-inline"><span>Transaction Type</span><strong>{transactionLabel(selected.transactionType)}</strong></div>
            <div className="detailCard detailCard-inline"><span>Amount</span><strong className={selected.transactionType === 'WITHDRAW' || selected.transactionType === 'FLOAT_WITHDRAWAL' ? 'tablePositive' : 'accentText'}>{formatCurrency(selected.amount)}</strong></div>
            <div className="detailCard detailCard-inline"><span>Previous E-cash</span><strong>{formatCurrency(selected.previousEmoney ?? selected.previousBalance)}</strong></div>
            <div className="detailCard detailCard-inline"><span>New E-cash</span><strong>{formatCurrency(selected.newEmoney ?? selected.balance)}</strong></div>
            <div className="detailCard detailCard-inline"><span>Previous Cash at Hand</span><strong>{formatCurrency(selected.previousCashAtHand)}</strong></div>
            <div className="detailCard detailCard-inline"><span>New Cash at Hand</span><strong>{formatCurrency(selected.newCashAtHand)}</strong></div>
          </div>
        </Modal>
      )}
    </section>
  );
}
