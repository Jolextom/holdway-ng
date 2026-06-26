'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/sidebar';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { theme } from '@/lib/theme';
import copy from '@/lib/content/copy.json';

// ─── Types ──────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'PAID'
  | 'DISPATCHED'
  | 'REQUIRES_ATTENTION'
  | 'AWAITING_PAYMENT'
  | 'DELIVERED';

interface Order {
  id: string;
  buyer: string;
  items: number;
  amount: number;
  status: OrderStatus;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MOCK_USER = {
  hasPayoutSetup: false,
};

const MOCK_ORDERS: Order[] = [
  {
    id: 'NF-8842-XKQP',
    buyer: 'Amaka Obi',
    items: 2,
    amount: 15500,
    status: 'PAID',
  },
  {
    id: 'NF-7731-BPLM',
    buyer: 'Tunde Fashola',
    items: 1,
    amount: 8200,
    status: 'DISPATCHED',
  },
  {
    id: 'NF-6620-RQTZ',
    buyer: 'Ngozi Eze',
    items: 3,
    amount: 27000,
    status: 'REQUIRES_ATTENTION',
  },
  {
    id: 'NF-5519-YVWK',
    buyer: 'Emeka Osei',
    items: 1,
    amount: 4750,
    status: 'AWAITING_PAYMENT',
  },
  {
    id: 'NF-4408-JCND',
    buyer: 'Fatima Bello',
    items: 2,
    amount: 12000,
    status: 'DELIVERED',
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const badgeClass = theme.colors.badge[status] || '';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function PayoutBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="bg-warning-light border border-warning-mid/20 rounded-lg p-4 flex items-center justify-between mb-6 font-sans">
      <div className="flex items-center gap-3">
        <AlertTriangle className="text-warning-mid w-5 h-5 flex-shrink-0" />
        <p className="text-sm text-warning-mid">
          {copy.dashboard.payoutBanner.message}
        </p>
        <Link
          href="/settings#payout"
          className="text-sm font-medium text-warning-mid hover:text-warning transition-colors underline underline-offset-4"
        >
          {copy.dashboard.payoutBanner.action}
        </Link>
      </div>
      <button
        onClick={onDismiss}
        className="text-warning hover:text-warning-mid transition-colors focus:outline-none"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

function AttentionBanner({ count }: { count: number }) {
  if (count === 0) return null;
  const message = count === 1 
    ? `${count} ${copy.dashboard.attentionBanner.messageSingle}`
    : `${count} ${copy.dashboard.attentionBanner.messagePlural}`;

  return (
    <div className="bg-error-light border border-error-mid/20 rounded-lg p-4 flex items-center gap-3 mb-6 font-sans">
      <AlertTriangle className="text-error-mid w-5 h-5 flex-shrink-0" />
      <p className="text-sm text-error-mid">{message}</p>
      <Link
        href="/orders?filter=attention"
        className="text-sm font-medium text-error-mid hover:text-error transition-colors ml-auto underline underline-offset-4"
      >
        {copy.dashboard.attentionBanner.action}
      </Link>
    </div>
  );
}

function StatsRow() {
  const stats = [
    { label: copy.dashboard.stats.escrowBalance, value: '₦47,500.00' },
    { label: copy.dashboard.stats.pendingOrders, value: '3' },
    { label: copy.dashboard.stats.totalPaidOut, value: '₦182,000.00' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 font-sans">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface border border-border rounded-lg p-6 shadow-card"
        >
          <p className="text-xs font-semibold text-ink-muted tracking-wider uppercase mb-3">
            {stat.label}
          </p>
          <p className="font-mono text-2xl font-bold text-ink">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

function RecentOrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="font-sans">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-ink">{copy.dashboard.recentOrders.title}</h2>
        <Link
          href="/orders"
          className="text-sm font-medium text-trust hover:text-trust-mid transition-colors"
        >
          {copy.dashboard.recentOrders.actionViewAll}
        </Link>
      </div>

      <div className="overflow-x-auto bg-surface border border-border rounded-lg shadow-card">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-raised">
              <th scope="col" className="px-6 py-4">
                {copy.dashboard.recentOrders.table.orderId}
              </th>
              <th scope="col" className="px-6 py-4">
                {copy.dashboard.recentOrders.table.buyer}
              </th>
              <th scope="col" className="px-6 py-4">
                {copy.dashboard.recentOrders.table.items}
              </th>
              <th scope="col" className="px-6 py-4">
                {copy.dashboard.recentOrders.table.amount}
              </th>
              <th scope="col" className="px-6 py-4">
                {copy.dashboard.recentOrders.table.status}
              </th>
              <th scope="col" className="px-6 py-4 text-right">
                {copy.dashboard.recentOrders.table.action}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {orders.map((order) => {
              const action = (() => {
                if (order.status === 'PAID') return copy.dashboard.recentOrders.actions.markDispatched;
                if (order.status === 'DISPATCHED') return copy.dashboard.recentOrders.actions.confirmDelivery;
                return null;
              })();

              return (
                <tr
                  key={order.id}
                  className="hover:bg-surface-raised/50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-sm text-ink-muted tracking-wide">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-ink">{order.buyer}</td>
                  <td className="px-6 py-4 text-sm text-ink-muted">
                    {order.items}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-ink">
                    ₦{order.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {action && (
                      <button
                        className={
                          action === copy.dashboard.recentOrders.actions.confirmDelivery
                            ? theme.colors.button.actionPrimary
                            : theme.colors.button.actionSecondary
                        }
                      >
                        {action}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [isPayoutSetup, setIsPayoutSetup] = useState(MOCK_USER.hasPayoutSetup);
  const [showPayoutBanner, setShowPayoutBanner] = useState(true);
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const now = new Date();
    setDateStr(
      now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      .toUpperCase()
      .replace(/,/g, '')
    );
  }, []);

  const orders = MOCK_ORDERS;
  const attentionCount = orders.filter(
    (o) => o.status === 'REQUIRES_ATTENTION'
  ).length;

  const dismissPayoutBanner = () => setShowPayoutBanner(false);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-8 font-sans">
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            {copy.dashboard.title}
          </h1>
          {dateStr && (
            <p className="font-mono text-xs font-semibold text-ink-muted mt-1">{dateStr}</p>
          )}
        </div>

        {/* Conditional Banners */}
        {!isPayoutSetup && showPayoutBanner && (
          <PayoutBanner onDismiss={dismissPayoutBanner} />
        )}
        <AttentionBanner count={attentionCount} />

        {/* Stats */}
        <StatsRow />

        {/* Orders Table */}
        <RecentOrdersTable orders={orders} />
      </main>
    </div>
  );
}
