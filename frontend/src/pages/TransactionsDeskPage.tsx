import { useEffect, useMemo, useRef, useState } from 'react';
import { History } from 'lucide-react';
import { api } from '../api/client';
import type { MnoAccount, TransactionType } from '../api/types';
import { Modal } from '../components/Modal';
import { formatCurrency, generateTransactionId, transactionLabel } from '../lib/format';

type Draft = {
  accountId: number;
  transactionType: TransactionType;
  amount: string;
  clientPhone: string;
  transactionId: string;
  clientId: string;
};

function createBlankDraft(accountId = 0): Draft {
  return {
    accountId,
    transactionType: 'DEPOSIT',
    amount: '',
    clientPhone: '',
    transactionId: generateTransactionId(),
    clientId: '',
  };
}

function isCashAccount(account: MnoAccount) {
  return (account.accountType || '').trim().toLowerCase() === 'cash';
}

export function TransactionsDeskPage() {
  const [accounts, setAccounts] = useState<MnoAccount[]>([]);
  const [draft, setDraft] = useState<Draft>(() => createBlankDraft());
  const [balancesHidden, setBalancesHidden] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.accounts().then((accountData) => {
      setAccounts(accountData);
      const initialAccount = accountData.find((account) => !isCashAccount(account));
      setDraft(createBlankDraft(initialAccount?.id ?? 0));
    }).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Accounts could not be loaded.');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const availableAccounts = useMemo(() => accounts.filter((account) => !isCashAccount(account)), [accounts]);
  const selectedAccount = availableAccounts.find((account) => account.id === draft.accountId) ?? availableAccounts[0];
  const amount = Number(draft.amount || 0);
  const previousEmoney = Number(selectedAccount?.emoneyAmount ?? 0);
  const previousCash = Number(selectedAccount?.cashAtHand ?? 0);
  const isWithdrawal = draft.transactionType === 'WITHDRAW' || draft.transactionType === 'FLOAT_WITHDRAWAL';
  const emoneyDirection = draft.transactionType === 'DEPOSIT' || draft.transactionType === 'FLOAT_TRANSFER' ? -1 : 1;
  const nextEmoney = previousEmoney + (amount * emoneyDirection);
  const nextCash =
    draft.transactionType === 'DEPOSIT'
      ? previousCash + amount
      : isWithdrawal
        ? previousCash - amount
        : previousCash;
  const positive = isWithdrawal || draft.transactionType === 'FLOAT_TOP_UP';
  const invalidEmoney = nextEmoney < 0;
  const invalidCash = nextCash < 0;
  const invalidBalanceMessage = invalidEmoney ? 'Insufficient e-cash balance.' : invalidCash ? 'Insufficient cash at hand.' : '';
  const accountMissing = !draft.accountId;
  const accountUnavailable = Boolean(draft.accountId) && !selectedAccount;
  const amountMissing = !draft.amount;
  const submitBlockReason =
    accountMissing ? 'Select an account before continuing.' :
    accountUnavailable ? 'The selected account is not available right now. Re-select the account and try again.' :
    amountMissing ? 'Enter a transaction amount before continuing.' :
    invalidBalanceMessage;

  async function recordTransaction() {
    if (!draft.accountId || !draft.amount || !selectedAccount || saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.recordTransaction({
        accountId: draft.accountId,
        transactionType: draft.transactionType,
        amount,
        clientPhone: draft.clientPhone,
        clientId: draft.clientId,
        transactionId: draft.transactionId,
      });
      setMessage('Transaction recorded.');
      const refreshedAccounts = await api.accounts();
      setAccounts(refreshedAccounts);
      const refreshedAvailableAccounts = refreshedAccounts.filter((account) => !isCashAccount(account));
      setDraft(createBlankDraft(draft.accountId || (refreshedAvailableAccounts[0]?.id ?? 0)));
      setBalancesHidden(false);
      setConfirmOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Transaction failed.');
    } finally {
      setSaving(false);
      saveLock.current = false;
    }
  }

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function resetDraft() {
    setDraft((current) => createBlankDraft(current.accountId));
    setBalancesHidden(false);
    setConfirmOpen(false);
  }

  return (
    <section className="pageSection">
      <div className="pageHero">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Transactions Desk</h1>
          <p className="pageLead">Record account-based deposits and withdrawals with a receipt confirmation before saving.</p>
        </div>
      </div>

      {message && <p className="noticeBanner">{message}</p>}
      {error && <p className="errorBanner">{error}</p>}

      {loading ? (
        <section className="surfaceCard">
          <p className="pageLead">Loading transaction desk...</p>
        </section>
      ) : accounts.length === 0 ? (
        <section className="surfaceCard">
          <p className="pageLead">No accounts are available yet. Create or seed an account before recording transactions.</p>
        </section>
      ) : availableAccounts.length === 0 ? (
        <section className="surfaceCard">
          <p className="pageLead">No non-cash accounts are available for transactions. Add or select an MNO or non-cash account first.</p>
        </section>
      ) : (
        <div className="deskLayout">
          <section className="surfaceCard deskPanel">
            <div className="surfaceHead">
              <h2>Transaction Entry</h2>
              <div className="deskHeaderActions">
                <div className="topbarMeta topbarMeta-globe"><History size={16} /><span>Active Session</span></div>
              </div>
            </div>
            <div className="formGrid formGrid-two">
              <label>
                Phone Number
                <input value={draft.clientPhone} onChange={(e) => updateDraft('clientPhone', e.target.value)} placeholder="+256..." />
              </label>
              <label>
                Account
                <select value={draft.accountId} onChange={(e) => updateDraft('accountId', Number(e.target.value))}>
                  {availableAccounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.name} ({account.network})</option>
                  ))}
                </select>
              </label>
              <label>
                Transaction Type
                <select value={draft.transactionType} onChange={(e) => updateDraft('transactionType', e.target.value as TransactionType)}>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="FLOAT_WITHDRAWAL">Withdrawal</option>
                  <option value="FLOAT_TOP_UP">Float Top-up</option>
                </select>
              </label>
              <label>
                Amount ({selectedAccount?.currency || 'UGX'})
                <input type="number" value={draft.amount} onChange={(e) => updateDraft('amount', e.target.value)} placeholder="0.00" min={0} />
              </label>
              <label>
                Transaction ID
                <input value={draft.transactionId} onChange={(e) => updateDraft('transactionId', e.target.value)} placeholder="Transaction ID" />
              </label>
              <label>
                Client ID
                <input value={draft.clientId} onChange={(e) => updateDraft('clientId', e.target.value)} placeholder="Client ID" />
              </label>
            </div>
            {submitBlockReason && <p className="errorBanner">{submitBlockReason}</p>}
            <div className="workshopModalActions deskActions">
              <button type="button" className="secondaryButton" onClick={resetDraft} disabled={saving}>Cancel</button>
              <button type="button" className="primaryButton" onClick={() => { setBalancesHidden(false); setConfirmOpen(true); }} disabled={saving || Boolean(submitBlockReason)}>
                Confirm
              </button>
            </div>
          </section>
        </div>
      )}

      {confirmOpen && (
        <Modal
          title="Confirm Transaction Entry"
          onClose={() => {
            if (saving) return;
            setConfirmOpen(false);
          }}
          onSubmit={(e) => {
            e.preventDefault();
            void recordTransaction();
          }}
          submitLabel="Save"
          busy={saving}
          busyLabel="Saving..."
          submitDisabled={Boolean(submitBlockReason)}
          errorMessage={error || submitBlockReason}
          size="lg"
        >
          <div className="receiptPreview receiptPreview-modal">
            <div className="receiptCard">
              <div className="receiptHead">
                <span>Receipt Preview</span>
                <strong>MOBI RECEIPT</strong>
              </div>
              <div className="receiptBody">
                <div className="receiptRows">
                  <div className="receiptRow">
                    <span className="receiptRowLabel">Phone Number</span>
                    <div className="receiptRowValue">
                      <strong>{draft.clientPhone || 'N/A'}</strong>
                    </div>
                  </div>
                  <div className="receiptRow">
                    <span className="receiptRowLabel">Account</span>
                    <div className="receiptRowValue">
                      <strong>{selectedAccount?.name ?? '--'}</strong>
                      <small>{selectedAccount?.network || '--'}</small>
                    </div>
                  </div>
                  <div className="receiptRow">
                    <span className="receiptRowLabel">Transaction Type</span>
                    <div className="receiptRowValue">
                      <strong className={positive ? 'tablePositive' : 'tableNegative'}>{transactionLabel(draft.transactionType)}</strong>
                    </div>
                  </div>
                  <div className="receiptRow">
                    <span className="receiptRowLabel">Transaction ID</span>
                    <div className="receiptRowValue">
                      <strong>{draft.transactionId || 'N/A'}</strong>
                    </div>
                  </div>
                  <div className="receiptRow">
                    <span className="receiptRowLabel">Amount</span>
                    <div className="receiptRowValue">
                      <strong className="accentText">{formatCurrency(amount)}</strong>
                    </div>
                  </div>
                  <div className="receiptRow">
                    <span className="receiptRowLabel">Client ID</span>
                    <div className="receiptRowValue">
                      <strong>{draft.clientId || 'N/A'}</strong>
                    </div>
                  </div>
                </div>
                <div className="receiptDivider" />
                <div className="receiptSection">
                  <div className="receiptSectionHeader">
                    <span>Balance Information</span>
                    <button type="button" className="receiptSectionToggle" onClick={() => setBalancesHidden((current) => !current)}>
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
    </section>
  );
}
