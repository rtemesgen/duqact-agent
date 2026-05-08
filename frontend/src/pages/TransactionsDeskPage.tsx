import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, History, Search } from 'lucide-react';
import { api } from '../api/client';
import type { MnoAccount, TransactionType } from '../api/types';
import { formatCurrency, transactionLabel } from '../lib/format';

type Draft = {
  accountId: number;
  transactionType: TransactionType;
  amount: string;
  clientPhone: string;
  clientId: string;
  remarks: string;
};

const blankDraft: Draft = {
  accountId: 0,
  transactionType: 'DEPOSIT',
  amount: '',
  clientPhone: '',
  clientId: '',
  remarks: '',
};

function maskedCurrency(value: number, visible: boolean) {
  return visible ? formatCurrency(value) : '••••••';
}

export function TransactionsDeskPage() {
  const [accounts, setAccounts] = useState<MnoAccount[]>([]);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [message, setMessage] = useState('');
  const [balancesVisible, setBalancesVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.accounts().then((accountData) => {
      setAccounts(accountData);
      const initialAccount = accountData[0];
      setDraft((current) => ({
        ...current,
        accountId: initialAccount?.id ?? 0,
      }));
    }).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Accounts could not be loaded.');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const selectedAccount = accounts.find((account) => account.id === draft.accountId) ?? accounts[0];
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

  const accountCards = useMemo(() => accounts.map((account) => ({
    account,
    active: draft.accountId === account.id,
    channel: `${account.network} ${account.accountType}`,
  })), [accounts, draft.accountId]);

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
        clientName: draft.clientId,
      });
      setMessage('Transaction recorded.');
      const refreshedAccounts = await api.accounts();
      setAccounts(refreshedAccounts);
      setDraft((current) => ({
        ...current,
        amount: '',
        clientPhone: '',
        clientId: '',
        remarks: '',
      }));
      setBalancesVisible(false);
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
    setDraft((current) => ({
      ...current,
      amount: '',
      clientPhone: '',
      clientId: '',
      remarks: '',
    }));
    setBalancesVisible(false);
  }

  return (
    <section className="pageSection">
      <div className="pageHero">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Transactions Desk</h1>
          <p className="pageLead">Record account-based deposits and withdrawals with live e-cash and cash-at-hand preview.</p>
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
      ) : (
      <div className="deskLayout">
        <section className="surfaceCard deskPanel">
          <div className="surfaceHead">
            <h2>Transaction Entry</h2>
            <div className="topbarMeta topbarMeta-globe"><History size={16} /><span>Active Session</span></div>
          </div>
          <div className="formGrid">
            <label>
              Account
              <select value={draft.accountId} onChange={(e) => updateDraft('accountId', Number(e.target.value))}>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name} ({account.network})</option>
                ))}
              </select>
            </label>
            <div className="accountCardGrid">
              {accountCards.map(({ account, active, channel }) => (
                <button key={account.id} type="button" className={active ? 'accountChoice accountChoiceActive' : 'accountChoice'} onClick={() => updateDraft('accountId', account.id ?? 0)}>
                  <strong>{account.name}</strong>
                  <span>{channel}</span>
                </button>
              ))}
            </div>
            <div className="formGrid formGrid-two">
              <label>
                Client Phone
                <input value={draft.clientPhone} onChange={(e) => updateDraft('clientPhone', e.target.value)} placeholder="+256..." />
              </label>
              <label>
                Client ID
                <input value={draft.clientId} onChange={(e) => updateDraft('clientId', e.target.value)} placeholder="Enter client ID" />
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
            </div>
            <label>
              Remarks (Internal)
              <textarea value={draft.remarks} onChange={(e) => updateDraft('remarks', e.target.value)} placeholder="Any additional notes..." rows={3} />
            </label>
            <div className="deskBalanceHead">
              <strong>Balance Visibility</strong>
              <button type="button" className="secondaryButton deskBalanceToggle" onClick={() => setBalancesVisible((current) => !current)}>
                {balancesVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                {balancesVisible ? 'Hide Balances' : 'Show Balances'}
              </button>
            </div>
            <div className="balancePreview">
              <div><span>Previous E-cash</span><strong>{maskedCurrency(previousEmoney, balancesVisible)}</strong></div>
              <div><span>New E-cash</span><strong>{invalidEmoney ? 'Unavailable' : maskedCurrency(nextEmoney, balancesVisible)}</strong></div>
              <div><span>Previous Cash at Hand</span><strong>{maskedCurrency(previousCash, balancesVisible)}</strong></div>
              <div><span>New Cash at Hand</span><strong>{invalidCash ? 'Unavailable' : maskedCurrency(nextCash, balancesVisible)}</strong></div>
            </div>
            {invalidBalanceMessage && <p className="errorBanner">{invalidBalanceMessage}</p>}
            <div className="workshopModalActions deskActions">
              <button type="button" className="secondaryButton" onClick={resetDraft} disabled={saving}>Cancel</button>
              <button type="button" className="primaryButton" onClick={recordTransaction} disabled={saving || !draft.amount || !selectedAccount || !draft.accountId || invalidEmoney || invalidCash}>
                {saving ? <span className="buttonBusy"><span className="buttonSpinner" aria-hidden="true" />Saving...</span> : 'Save'}
              </button>
            </div>
          </div>
        </section>

        <section className="surfaceCard deskPanel">
          <div className="surfaceHead">
            <h2>Transaction Preview</h2>
            <span className="deskHint">Live receipt</span>
          </div>
          <div className="receiptPreview">
            {!draft.amount && !draft.clientPhone && !draft.clientId ? (
              <div className="receiptEmpty">
                <Search size={28} />
                <p>Start entering details to see a preview.</p>
              </div>
            ) : (
              <div className="receiptCard">
                <div className="receiptHead">
                  <span>Receipt Preview</span>
                  <strong>MOBI RECEIPT</strong>
                </div>
                <div className="receiptBody">
                  <div className="receiptSplit">
                    <div>
                      <span>Account</span>
                      <strong>{selectedAccount?.name ?? '--'}</strong>
                      <small>ID: {selectedAccount?.agentId || '--'}</small>
                    </div>
                    <div className="receiptType">
                      <span>Type</span>
                      <strong className={positive ? 'tablePositive' : 'tableNegative'}>{transactionLabel(draft.transactionType)}</strong>
                    </div>
                  </div>
                  <div className="receiptRows">
                    <div><span>Client ID</span><strong>{draft.clientId || 'N/A'}</strong></div>
                    <div><span>Phone</span><strong>{draft.clientPhone || 'N/A'}</strong></div>
                    <div><span>Amount</span><strong className="accentText">{formatCurrency(amount)}</strong></div>
                    <div><span>E-cash After</span><strong>{invalidEmoney ? 'Unavailable' : maskedCurrency(nextEmoney, balancesVisible)}</strong></div>
                    <div><span>Cash at Hand After</span><strong>{invalidCash ? 'Unavailable' : maskedCurrency(nextCash, balancesVisible)}</strong></div>
                    </div>
                  <div className="receiptSignature">
                    <div />
                    <p>Digital Signature Validated</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      )}
    </section>
  );
}
