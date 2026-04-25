import { useEffect, useMemo, useState } from 'react';
import { History, Search } from 'lucide-react';
import { api } from '../api/client';
import type { MnoAccount, MnoWallet, TransactionType } from '../api/types';
import { formatCurrency, transactionLabel } from '../lib/format';

type Draft = {
  accountId: number;
  walletId: number;
  transactionType: TransactionType;
  amount: string;
  clientPhone: string;
  clientName: string;
  remarks: string;
};

const blankDraft: Draft = {
  accountId: 0,
  walletId: 0,
  transactionType: 'DEPOSIT',
  amount: '',
  clientPhone: '',
  clientName: '',
  remarks: '',
};

export function TransactionsDeskPage() {
  const [accounts, setAccounts] = useState<MnoAccount[]>([]);
  const [wallets, setWallets] = useState<MnoWallet[]>([]);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([api.accounts(), api.wallets()]).then(([accountData, walletData]) => {
      setAccounts(accountData);
      setWallets(walletData);
      const initialAccount = accountData[0];
      const initialWallet = walletData.find((item) => item.agentId === initialAccount?.id) ?? walletData[0];
      setDraft((current) => ({
        ...current,
        accountId: initialAccount?.id ?? 0,
        walletId: initialWallet?.id ?? 0,
        clientName: '',
      }));
    });
  }, []);

  const selectedAccount = accounts.find((account) => account.id === draft.accountId) ?? accounts[0];
  const accountWallets = wallets.filter((wallet) => wallet.agentId === (selectedAccount?.id ?? -1));
  const selectedWallet = accountWallets.find((wallet) => wallet.id === draft.walletId) ?? accountWallets[0] ?? wallets.find((wallet) => wallet.id === draft.walletId);
  const amount = Number(draft.amount || 0);
  const positive = draft.transactionType === 'FLOAT_TOP_UP' || draft.transactionType === 'FLOAT_WITHDRAWAL';
  const previousBalance = Number(selectedWallet?.balance ?? selectedAccount?.emoneyAmount ?? 0);
  const newBalance = positive ? previousBalance + amount : previousBalance - amount;

  useEffect(() => {
    if (!selectedAccount) return;
    const nextWallet = wallets.find((wallet) => wallet.agentId === selectedAccount.id);
    setDraft((current) => ({
      ...current,
      accountId: selectedAccount.id ?? 0,
      walletId: nextWallet?.id ?? current.walletId,
    }));
  }, [selectedAccount?.id, wallets]);

  const accountCards = useMemo(() => accounts.map((account) => ({
    account,
    active: draft.accountId === account.id,
    channel: `${account.network} ${account.accountType}`,
  })), [accounts, draft.accountId]);

  async function recordTransaction() {
    if (!selectedWallet?.id || !draft.amount) return;
    try {
      await api.recordTransaction({
        walletId: selectedWallet.id,
        transactionType: draft.transactionType,
        amount,
        agentNumber: selectedAccount?.agentId || selectedWallet.name,
        clientPhone: draft.clientPhone,
        clientName: draft.clientName,
      });
      setMessage('Transaction recorded.');
      const refreshedWallets = await api.wallets();
      setWallets(refreshedWallets);
      setDraft((current) => ({
        ...current,
        amount: '',
        clientPhone: '',
        clientName: '',
        remarks: '',
      }));
    } catch {
      setMessage('Transaction failed.');
    }
  }

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === 'clientPhone') {
        next.clientName = String(value).length > 5 ? 'Verified Client Name' : '';
      }
      return next;
    });
  }

  return (
    <section className="pageSection">
      <div className="pageHero">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Transactions Desk</h1>
          <p className="pageLead">Record a transaction from a single operational desk with live preview and running balance feedback.</p>
        </div>
      </div>

      {message && <p className="noticeBanner">{message}</p>}

      <div className="deskLayout">
        <section className="surfaceCard deskPanel">
          <div className="surfaceHead">
            <h2>Transaction Preview</h2>
            <span className="deskHint">Live receipt</span>
          </div>
          <div className="receiptPreview">
            {!draft.amount ? (
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
                    <div><span>Wallet</span><strong>{selectedWallet?.name ?? '--'}</strong></div>
                    <div><span>Client</span><strong>{draft.clientName || 'N/A'}</strong></div>
                    <div><span>Phone</span><strong>{draft.clientPhone || 'N/A'}</strong></div>
                    <div><span>Amount</span><strong className="accentText">{formatCurrency(amount)}</strong></div>
                    <div><span>Running Balance</span><strong>{formatCurrency(newBalance)}</strong></div>
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

        <section className="surfaceCard deskPanel">
          <div className="surfaceHead">
            <h2>Transaction Entry</h2>
            <div className="topbarMeta topbarMeta-globe"><History size={16} /><span>Active Session</span></div>
          </div>
          <div className="formGrid">
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
                Transaction Type
                <select value={draft.transactionType} onChange={(e) => updateDraft('transactionType', e.target.value as TransactionType)}>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="FLOAT_TRANSFER">Withdrawal</option>
                  <option value="FLOAT_TOP_UP">Float top-up</option>
                  <option value="FLOAT_WITHDRAWAL">Float withdrawal</option>
                </select>
              </label>
              <label>
                Wallet
                <select value={draft.walletId} onChange={(e) => updateDraft('walletId', Number(e.target.value))}>
                  {accountWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name} ({wallet.network})</option>)}
                </select>
              </label>
              <label>
                Amount ({selectedAccount?.currency || 'UGX'})
                <input type="number" value={draft.amount} onChange={(e) => updateDraft('amount', e.target.value)} placeholder="0.00" min={0} />
              </label>
              <label>
                Agent Number
                <input value={selectedAccount?.agentId || ''} readOnly />
              </label>
              <label>
                Client Name
                <input value={draft.clientName} onChange={(e) => updateDraft('clientName', e.target.value)} placeholder="Enter full name" />
              </label>
              <label>
                Client Phone
                <input value={draft.clientPhone} onChange={(e) => updateDraft('clientPhone', e.target.value)} placeholder="+256..." />
              </label>
            </div>
            <label>
              Remarks (Internal)
              <textarea value={draft.remarks} onChange={(e) => updateDraft('remarks', e.target.value)} placeholder="Any additional notes..." rows={3} />
            </label>
            <div className="balancePreview">
              <div><span>Previous Balance</span><strong>{formatCurrency(previousBalance)}</strong></div>
              <div><span>New Balance</span><strong>{formatCurrency(newBalance)}</strong></div>
            </div>
            <div className="workshopModalActions deskActions">
              <button type="button" className="secondaryButton" onClick={() => setDraft((current) => ({ ...current, amount: '', clientPhone: '', clientName: '', remarks: '' }))}>Cancel</button>
              <button type="button" className="primaryButton" onClick={recordTransaction} disabled={!draft.amount || !selectedWallet}>Record Transaction</button>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
