'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ClipboardList, Settings } from 'lucide-react';
import { theme } from '@/lib/theme';
import copy from '@/lib/content/copy.json';

interface SidebarProps {
  merchantName?: string;
  merchantEmail?: string;
}

export default function Sidebar({
  merchantName = "Adeola Store",
  merchantEmail = "adeola@example.com",
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: copy.dashboard.sidebar.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { label: copy.dashboard.sidebar.inventory, href: '/inventory', icon: Package },
    { label: copy.dashboard.sidebar.orders, href: '/orders', icon: ClipboardList },
    { label: copy.dashboard.sidebar.settings, href: '/settings', icon: Settings },
  ];

  const initials = merchantName.charAt(0).toUpperCase();

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen sticky top-0 flex flex-col font-sans">
      {/* Brand Header */}
      <div className="p-6">
        <span className="font-mono text-sm font-bold tracking-wider text-ink">
          {copy.brand.name}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? theme.colors.sidebar.active
                  : theme.colors.sidebar.inactive
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-trust-light flex items-center justify-center text-trust font-bold text-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink truncate">{merchantName}</p>
            <p className="text-xs text-ink-muted truncate">{merchantEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
