'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
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

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface TimelineStep {
  label: string;
  timestamp: string | null;
  filled: boolean;
}

interface Order {
  id: string;
  date: string;
  time: string;
  buyerPhone: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  virtualAccount: string;
  virtualBank: string;
  status: OrderStatus;
  timeline: TimelineStep[];
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_ORDER: Order = {
  id: 'NF-7731-BPLM',
  date: '17 Jun 2025',
  time: '2:14 PM',
  buyerPhone: '+234 803 412 9901',
  deliveryAddress: '14B Adeleke Crescent, Surulere, Lagos',
  items: [
    { name: 'Ankara fabric', quantity: 6, price: 6000 },
    { name: 'Plain cotton', quantity: 2, price: 2200 },
  ],
  subtotal: 8200,
  deliveryFee: 0,
  total: 8200,
  virtualAccount: '9901234567',
  virtualBank: 'Wema Bank',
  status: 'DISPATCHED',
  timeline: [
    { label: 'Order Created',     timestamp: '17 Jun, 2:14 PM', filled: true  },
    { label: 'Payment Received',  timestamp: '17 Jun, 3:01 PM', filled: true  },
    { label: 'Dispatched',        timestamp: '17 Jun, 5:47 PM', filled: true  },
    { label: 'Delivered',         timestamp: null,              filled: false },
  ],
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const badgeClass = theme.colors.badge[status] ?? 'bg-surface-raised text-ink-faint border-border';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-ink-muted tracking-wider uppercase mb-1">
      {children}
    </p>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const order = MOCK_ORDER;

  const showConfirmAction =
    order.status === 'DISPATCHED' || order.status === 'PAID';

  return (
    <div className="flex min-h-screen bg-canvas font-sans">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">

          {/* Back Link */}
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            {copy.orderDetail.backLink}
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              {copy.orderDetail.orderPrefix}{' '}
              <span className="font-mono">{order.id}</span>
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="font-mono text-xs text-ink-muted mt-1">
            {copy.orderDetail.placedAt} {order.date} {copy.orderDetail.at} {order.time}
          </p>

          {/* Summary Card */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-card mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <SectionLabel>{copy.orderDetail.sections.buyer}</SectionLabel>
                  <p className="font-mono text-sm text-ink">{order.buyerPhone}</p>
                </div>

                <div>
                  <SectionLabel>{copy.orderDetail.sections.deliveryAddress}</SectionLabel>
                  <p className="text-sm text-ink">{order.deliveryAddress}</p>
                </div>

                <div>
                  <SectionLabel>{copy.orderDetail.sections.itemsOrdered}</SectionLabel>
                  <ul className="space-y-1 text-sm text-ink">
                    {order.items.map((item, idx) => {
                      const unitLabel = item.quantity === 1
                        ? copy.orderDetail.unit.yard
                        : copy.orderDetail.unit.yards;
                      return (
                        <li key={idx} className="flex justify-between">
                          <span>
                            · {item.name} ({item.quantity} {unitLabel})
                          </span>
                          <span className="font-mono">
                            ₦{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* Right Column */}
              <div className="sm:text-right space-y-2">
                <div className="flex justify-between sm:justify-end gap-8">
                  <span className="text-sm text-ink-muted">{copy.orderDetail.sections.itemsSubtotal}</span>
                  <span className="font-mono text-sm text-ink">
                    ₦{order.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between sm:justify-end gap-8">
                  <span className="text-sm text-ink-muted">{copy.orderDetail.sections.delivery}</span>
                  <span className="font-mono text-sm text-ink-muted">
                    ₦{order.deliveryFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-border my-3" />
                <div className="flex justify-between sm:justify-end gap-8">
                  <span className="text-base font-semibold text-ink">{copy.orderDetail.sections.total}</span>
                  <span className="font-mono text-xl font-bold text-ink">
                    ₦{order.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-4">
                  <SectionLabel>{copy.orderDetail.sections.virtualAccount}</SectionLabel>
                  <p className="font-mono text-sm text-ink-muted">
                    {order.virtualBank} · {order.virtualAccount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-card mt-6">
            <h2 className="text-sm font-semibold text-ink mb-5">
              {copy.orderDetail.timeline}
            </h2>
            <div>
              {order.timeline.map((step, index) => (
                <div key={step.label} className="flex items-start gap-4">
                  {/* Dot + connector line */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-3 h-3 rounded-full mt-0.5 transition-colors ${
                        step.filled ? 'bg-trust' : 'border-2 border-border bg-surface'
                      }`}
                    />
                    {index < order.timeline.length - 1 && (
                      <div className={`w-px flex-1 min-h-[2rem] ${step.filled ? 'bg-trust/30' : 'bg-border'}`} />
                    )}
                  </div>

                  {/* Label + timestamp */}
                  <div className="pb-6 pt-0">
                    <p className={`text-sm ${step.filled ? 'font-semibold text-ink' : 'text-ink-muted'}`}>
                      {step.label}
                    </p>
                    {step.timestamp && (
                      <p className="font-mono text-xs text-ink-muted mt-0.5">{step.timestamp}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Panel — only shown for actionable statuses */}
          {showConfirmAction && (
            <div className="mt-8 space-y-3">
              <button className={`${theme.colors.button.primary}`}>
                {copy.orderDetail.actions.confirmDelivery}
              </button>
              <p className="text-xs text-ink-muted text-center leading-relaxed">
                {copy.orderDetail.actions.autoConfirmNote}
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
