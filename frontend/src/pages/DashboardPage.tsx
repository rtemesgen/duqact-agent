import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Banknote, BriefcaseBusiness, Wallet } from 'lucide-react';
import { api } from '../api/client';
import type { DashboardStats } from '../api/types';
import { DashboardKPICard } from '../components/DashboardKPICard';
import { formatCurrency } from '../lib/format';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.dashboard().then(setStats);
  }, []);

  return (
    <section className="pageSection">
      <div className="heroGrid">
        <div className="pageHero">
          <div>
            <p className="eyebrow">Workshop Overview</p>
            <h1>Mobi Dashboard</h1>
            <p className="pageLead">Monitor deposit and withdrawal movement, cash channels, and account coverage from one control surface.</p>
          </div>
        </div>
        <aside className="summaryPanel">
          <div className="summaryPanelHeader">
            <div>
              <strong>Operational Snapshot</strong>
              <span>Live figures from the backend aggregates</span>
            </div>
            <BriefcaseBusiness size={18} />
          </div>
          <div className="summaryPanelList">
            <div className="summaryPanelItem">
              <div>
                <strong>Accounts in operation</strong>
                <span>Current ledger footprint</span>
              </div>
              <div className="summaryPanelValue">{stats?.accountCount ?? 0}</div>
            </div>
            <div className="summaryPanelItem">
              <div>
                <strong>Service channels</strong>
                <span>Persisted channel endpoints</span>
              </div>
              <div className="summaryPanelValue">{stats?.serviceChannelCount ?? 0}</div>
            </div>
            <div className="summaryPanelItem">
              <div>
                <strong>Total liquidity</strong>
                <span>E-money plus cash at hand</span>
              </div>
              <div className="summaryPanelValue">{formatCurrency((stats?.totalEmoney ?? 0) + (stats?.totalCashAtHand ?? 0))}</div>
            </div>
          </div>
        </aside>
      </div>

      <div className="metricsGrid metricsGrid-four">
        <DashboardKPICard label="Total Deposits" value={formatCurrency(stats?.totalDeposits)} icon={<ArrowDown size={18} />} accent="green" />
        <DashboardKPICard label="Total Withdrawals" value={formatCurrency(stats?.totalWithdrawals)} icon={<ArrowUp size={18} />} />
        <DashboardKPICard label="Net E-cash Change" value={formatCurrency(stats?.netFloatChange)} icon={<Banknote size={18} />} accent="gold" />
        <DashboardKPICard label="Transaction Count" value={stats?.transactionCount ?? 0} icon={<Wallet size={18} />} />
      </div>

      <div className="panelGrid panelGrid-two">
        <section className="surfaceCard">
          <div className="surfaceHead"><h2>Operations Footprint</h2></div>
          <div className="miniStats">
            <div><span>Accounts</span><strong>{stats?.accountCount ?? 0}</strong></div>
            <div><span>Linked Wallet Records</span><strong>{stats?.walletCount ?? 0}</strong></div>
            <div><span>Channel Types</span><strong>{stats?.channelTypeCount ?? 0}</strong></div>
            <div><span>Service Channels</span><strong>{stats?.serviceChannelCount ?? 0}</strong></div>
          </div>
        </section>
        <section className="surfaceCard">
          <div className="surfaceHead"><h2>Balances</h2></div>
          <div className="miniStats">
            <div><span>Total E-money</span><strong>{formatCurrency(stats?.totalEmoney)}</strong></div>
            <div><span>Cash At Hand</span><strong>{formatCurrency(stats?.totalCashAtHand)}</strong></div>
            <div><span>Ledger Mirror</span><strong>{formatCurrency(stats?.totalWalletBalance)}</strong></div>
            <div><span>Net E-cash Change</span><strong>{formatCurrency(stats?.netFloatChange)}</strong></div>
          </div>
        </section>
      </div>

      <section className="surfaceCard">
        <div className="surfaceHead"><h2>Operational Summary</h2></div>
        <div className="summaryStrip">
          <div><BriefcaseBusiness size={18} /><span>Transaction totals now follow account-ledger balances for e-cash and cash at hand.</span></div>
          <div><Wallet size={18} /><span>Deposit reduces e-cash and increases cash at hand, while withdraw does the reverse.</span></div>
          <div><Banknote size={18} /><span>Channel Management includes Cash as a channel type with Cash at Hand as a service channel.</span></div>
        </div>
      </section>
    </section>
  );
}
