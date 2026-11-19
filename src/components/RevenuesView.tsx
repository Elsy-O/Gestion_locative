import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock,
  Download,
  FileCheck2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Apartment, PaymentStatus, RentPayment } from '../types';
import { exportToCSV, formatCFA, formatDateFR } from '../utils/formatters';

interface RevenuesViewProps {
  payments: RentPayment[];
  apartments: Apartment[];
  onMarkPaid: (paymentId: string) => void;
  onAddPayment: () => void;
  onDeletePayment: (paymentId: string) => void;
  onOpenQuittance: (payment: RentPayment) => void;
}

export const RevenuesView: React.FC<RevenuesViewProps> = ({
  payments,
  apartments,
  onMarkPaid,
  onAddPayment,
  onDeletePayment,
  onOpenQuittance,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sortedPayments = useMemo(() => {
    return [...payments]
      .sort((a, b) => b.period.localeCompare(a.period))
      .filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (!searchQuery.trim()) return true;
        const apt = apartments.find((a) => a.id === p.apartmentId);
        const hay = `${p.periodLabel} ${apt?.shortName ?? ''} ${
          apt?.tenant.fullName ?? ''
        } ${p.receiptNumber ?? ''}`.toLowerCase();
        return hay.includes(searchQuery.trim().toLowerCase());
      });
  }, [payments, apartments, statusFilter, searchQuery]);

  const totals = useMemo(() => {
    const paid = payments
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + p.totalAmount, 0);
    const pending = payments
      .filter((p) => p.status !== 'paid')
      .reduce((s, p) => s + p.totalAmount, 0);
    const hc = payments
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + p.rentHC, 0);
    const charges = payments
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + p.chargesProvision, 0);
    return { paid, pending, hc, charges };
  }, [payments]);

  const handleExportCSV = () => {
    exportToCSV(
      'loyers_cle_gestion_2026.csv',
      [
        'Période',
        'Appartement',
        'Locataire',
        'Loyer HC (FCFA)',
        'Provision charges (FCFA)',
        'Total CC (FCFA)',
        'Statut',
        'Date échéance',
        'Date paiement',
        'Mode',
        'N° Quittance',
      ],
      sortedPayments.map((p) => {
        const apt = apartments.find((a) => a.id === p.apartmentId);
        const statusText =
          p.status === 'paid'
            ? 'Encaissé'
            : p.status === 'late'
              ? 'En retard'
              : 'En attente';
        return [
          p.periodLabel,
          apt?.shortName ?? p.apartmentId,
          apt?.tenant.fullName ?? '',
          Math.round(p.rentHC),
          Math.round(p.chargesProvision),
          Math.round(p.totalAmount),
          statusText,
          p.dueDate,
          p.paidDate ?? '',
          p.paymentMethod,
          p.receiptNumber ?? '',
        ];
      }),
    );
  };

  return (
    <div className="space-y-6">
      {/* Top KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">
            Total encaissé CC
          </div>
          <div className="mt-1.5 font-mono text-xl font-semibold text-emerald-700 tabular-nums">
            {formatCFA(totals.paid)}
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
            HC {formatCFA(totals.hc)} · Charges {formatCFA(totals.charges)}
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">
            Reste à encaisser
          </div>
          <div className="mt-1.5 font-mono text-xl font-semibold text-amber-700 tabular-nums">
            {formatCFA(totals.pending)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {payments.filter((p) => p.status !== 'paid').length} échéance(s) en
            cours
          </div>
        </div>
        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Quittances &amp; Export
            </div>
            <div className="mt-1 text-xs text-slate-600">
              Générez une quittance imprimable pour chaque loyer encaissé.
            </div>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
          {(
            [
              { id: 'all', label: 'Tous' },
              { id: 'paid', label: 'Encaissés' },
              { id: 'pending', label: 'En attente' },
              { id: 'late', label: 'En retard' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher mois, locataire..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <button
            type="button"
            onClick={onAddPayment}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Enregistrer un loyer
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {sortedPayments.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <p className="text-sm font-medium text-slate-900">
              Aucune écriture de loyer trouvée
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Modifiez vos filtres ou enregistrez une nouvelle échéance.
            </p>
            <button
              type="button"
              onClick={onAddPayment}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Enregistrer un loyer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Période</th>
                  <th className="py-3 px-4">Appartement &amp; Locataire</th>
                  <th className="py-3 px-4 text-right">Loyer HC</th>
                  <th className="py-3 px-4 text-right">Charges</th>
                  <th className="py-3 px-4 text-right">Total CC</th>
                  <th className="py-3 px-4">Statut &amp; Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedPayments.map((payment) => {
                  const apt = apartments.find(
                    (a) => a.id === payment.apartmentId,
                  );
                  const isConfirmingDelete = confirmDeleteId === payment.id;

                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        <div>{payment.periodLabel}</div>
                        <div className="text-xs font-normal text-slate-500">
                          {payment.paymentMethod}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {apt?.shortName ?? payment.apartmentId}
                        </div>
                        <div className="text-xs text-slate-500">
                          {apt?.tenant.fullName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {formatCFA(payment.rentHC)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {formatCFA(payment.chargesProvision)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCFA(payment.totalAmount)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {payment.status === 'paid' && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                              <Check className="h-3.5 w-3.5" />
                              Encaissé
                            </span>
                            <div className="text-xs text-slate-500 font-mono tabular-nums">
                              le {formatDateFR(payment.paidDate)}
                            </div>
                          </div>
                        )}
                        {payment.status === 'pending' && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                              <Clock className="h-3.5 w-3.5" />
                              En attente
                            </span>
                            <div className="text-xs text-slate-500 font-mono tabular-nums">
                              échéance {formatDateFR(payment.dueDate)}
                            </div>
                          </div>
                        )}
                        {payment.status === 'late' && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              En retard
                            </span>
                            <div className="text-xs text-slate-500 font-mono tabular-nums">
                              échéance {formatDateFR(payment.dueDate)}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isConfirmingDelete ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onDeletePayment(payment.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1 text-xs font-medium bg-red-700 text-white rounded-md hover:bg-red-800"
                            >
                              Confirmer
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-xs font-medium border border-slate-200 text-slate-600 rounded-md hover:bg-slate-100"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-2">
                            {payment.status !== 'paid' ? (
                              <button
                                type="button"
                                onClick={() => onMarkPaid(payment.id)}
                                className="px-2.5 py-1.5 text-xs font-medium bg-emerald-800 text-white rounded-md hover:bg-emerald-900 transition-colors"
                              >
                                Marquer encaissé
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenQuittance(payment)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                              >
                                <FileCheck2 className="h-3.5 w-3.5 text-emerald-700" />
                                Quittance
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(payment.id)}
                              className="p-1.5 text-slate-400 hover:text-red-700 rounded-md transition-colors"
                              aria-label="Supprimer cette écriture de loyer"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
