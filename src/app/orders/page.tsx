'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import Sidebar from '@/components/sidebar';
import { theme } from '@/lib/theme';
import copy from '@/lib/content/copy.json';

// ─── Types ──────────────────────────────────────────────────────────────────

type OrderStatus =
  | 'PAID'
  | 'DISPATCHED'
  | 'REQUIRES_ATTENTION'
  | 'AWAITING_PAYMENT'
  | 'DELIVERED'
  | 'CANCELLED';

interface Order {
  id: string;
  date: string;
  buyerPhone: string;
  items: number;
  amount: number;
  status: OrderStatus;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MOCK_ORDERS: Order[] = [
  { id: 'NF-8842-XKQP', date: '17 Jun 2025', buyerPhone: '+234 802 341 5678', items: 2, amount: 15500, status: 'PAID' },
  { id: 'NF-7731-BPLM', date: '17 Jun 2025', buyerPhone: '+234 803 412 9901', items: 1, amount: 8200, status: 'DISPATCHED' },
  { id: 'NF-6620-RQTZ', date: '16 Jun 2025', buyerPhone: '+234 706 229 4412', items: 3, amount: 27000, status: 'REQUIRES_ATTENTION' },
  { id: 'NF-5519-YVWK', date: '16 Jun 2025', buyerPhone: '+234 814 778 3302', items: 1, amount: 4750, status: 'AWAITING_PAYMENT' },
  { id: 'NF-4408-JCND', date: '15 Jun 2025', buyerPhone: '+234 901 553 8871', items: 2, amount: 12000, status: 'DELIVERED' },
  { id: 'NF-3397-MNPX', date: '15 Jun 2025', buyerPhone: '+234 805 119 6643', items: 4, amount: 33400, status: 'PAID' },
  { id: 'NF-2286-KQSW', date: '14 Jun 2025', buyerPhone: '+234 703 884 2210', items: 1, amount: 6500, status: 'CANCELLED' },
  { id: 'NF-1175-ZTHV', date: '14 Jun 2025', buyerPhone: '+234 811 337 5509', items: 2, amount: 19000, status: 'DELIVERED' },
  { id: 'NF-0064-RLCF', date: '13 Jun 2025', buyerPhone: '+234 802 991 4478', items: 1, amount: 5000, status: 'AWAITING_PAYMENT' },
  { id: 'NF-9953-YPBD', date: '13 Jun 2025', buyerPhone: '+234 906 445 7723', items: 3, amount: 41200, status: 'DISPATCHED' },
];

// Tab config — Cancelled only appears under "All"
const FILTER_TABS: { key: string; label: string }[] = [
  { key: 'all',                  label: copy.orders.tabs.all },
  { key: 'AWAITING_PAYMENT',     label: copy.orders.tabs.AWAITING_PAYMENT },
  { key: 'PAID',                 label: copy.orders.tabs.PAID },
  { key: 'DISPATCHED',           label: copy.orders.tabs.DISPATCHED },
  { key: 'REQUIRES_ATTENTION',   label: copy.orders.tabs.REQUIRES_ATTENTION },
  { key: 'DELIVERED',            label: copy.orders.tabs.DELIVERED },
];

// ─── Sub‑components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const badgeClass = theme.colors.badge[status] ?? 'bg-surface-raised text-ink-faint border-border';
  const label = status.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>
      {label}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filteredOrders = MOCK_ORDERS.filter((order) =>
    activeFilter === 'all' ? true : order.status === activeFilter
  );

  return (
    <div className="flex min-h-screen bg-canvas font-sans">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Page Header */}
        <h1 className="text-2xl font-bold text-ink tracking-tight mb-4">
          {copy.orders.title}
        </h1>

        {/* Filter Tabs */}
        <div className="flex gap-6 border-b border-border mb-6 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`pb-3 text-sm whitespace-nowrap transition-colors focus:outline-none ${
                activeFilter === tab.key
                  ? 'text-trust border-b-2 border-trust font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Table or Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="w-12 h-12 text-ink-faint mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-ink">{copy.orders.emptyTitle}</h3>
            <p className="text-sm text-ink-muted mt-1">{copy.orders.emptyBody}</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-surface border border-border rounded-lg shadow-card">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider bg-surface-raised">
                  <th scope="col" className="px-6 py-4">{copy.orders.table.orderId}</th>
                  <th scope="col" className="px-6 py-4">{copy.orders.table.date}</th>
                  <th scope="col" className="px-6 py-4">{copy.orders.table.buyerPhone}</th>
                  <th scope="col" className="px-6 py-4">{copy.orders.table.items}</th>
                  <th scope="col" className="px-6 py-4">{copy.orders.table.amount}</th>
                  <th scope="col" className="px-6 py-4">{copy.orders.table.status}</th>
                  <th scope="col" className="px-6 py-4 text-right">{copy.orders.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {filteredOrders.map((order) => {
                  const itemLabel = order.items === 1
                    ? `${order.items} ${copy.orders.actions.itemSingular}`
                    : `${order.items} ${copy.orders.actions.itemPlural}`;

                  const actionButton = (() => {
                    if (order.status === 'PAID') {
                      return (
                        <button className={theme.colors.button.actionSecondary}>
                          {copy.orders.actions.markDispatched}
                        </button>
                      );
                    }
                    if (order.status === 'DISPATCHED') {
                      return (
                        <button className={theme.colors.button.actionPrimary}>
                          {copy.orders.actions.confirmDelivery}
                        </button>
                      );
                    }
                    return null;
                  })();

                  return (
                    <tr key={order.id} className="hover:bg-surface-raised/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-ink-muted tracking-wide">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-ink-muted">
                        {order.date}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-ink">
                        {order.buyerPhone}
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-muted">
                        {itemLabel}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-ink">
                        ₦{order.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {actionButton}
                          <Link
                            href={`/orders/${order.id}`}
                            className="text-sm font-medium text-trust hover:text-trust-mid transition-colors"
                          >
                            {copy.orders.actions.view}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
