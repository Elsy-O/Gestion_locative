import React from 'react';
import {
  Building2,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  TrendingUp,
  X,
} from 'lucide-react';
import { NavSection } from '../types';
import { OWNER_AVATAR_URL, OWNER_NAME } from '../data/seedData';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  pendingPaymentsCount: number;
  expiringDocsCount: number;
  unreadMessagesCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onResetDemoData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  pendingPaymentsCount,
  expiringDocsCount,
  unreadMessagesCount,
  mobileOpen,
  onCloseMobile,
  onResetDemoData,
}) => {
  const navItems: {
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    counter?: number;
  }[] = [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
    { id: 'apartments', label: 'Mes appartements', icon: Building2 },
    {
      id: 'revenues',
      label: 'Revenus & Loyers',
      icon: TrendingUp,
      counter: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
    },
    { id: 'expenses', label: 'Charges & Dépenses', icon: Receipt },
    {
      id: 'documents',
      label: 'Documents locataires',
      icon: FileText,
      counter: expiringDocsCount > 0 ? expiringDocsCount : undefined,
    },
    {
      id: 'messages',
      label: 'Messagerie',
      icon: MessageSquare,
      counter: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
  ];

  const content = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-slate-200">
      <div>
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              onSelectSection('overview');
              onCloseMobile();
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 text-left"
          >
            Clé &amp; Gestion
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1" aria-label="Navigation principale">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-emerald-300' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.counter !== undefined && (
                  <span
                    className={`font-mono text-xs tabular-nums shrink-0 ${
                      isActive ? 'text-amber-300' : 'text-amber-700 font-semibold'
                    }`}
                  >
                    {item.counter}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
            <img
              src={OWNER_AVATAR_URL}
              alt={OWNER_NAME}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900 truncate">
              {OWNER_NAME}
            </div>
            <div className="text-xs text-slate-500 truncate">
              Gestionnaire · 2 biens
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onResetDemoData}
          className="w-full text-left px-2 py-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          Réinitialiser les données initiales
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{content}</div>
        </div>
      )}
    </>
  );
};
