import React, { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Download,
  Edit3,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Apartment, Expense, ExpenseCategory } from '../types';
import { exportToCSV, formatCFA, formatDateFR } from '../utils/formatters';

interface ExpensesViewProps {
  expenses: Expense[];
  apartments: Apartment[];
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Copropriété',
  'Taxe foncière',
  'Assurance PNO',
  'Travaux & Entretien',
  'Frais & Diagnostics',
  'Autre',
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  apartments,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>(
    'all',
  );
  const [recoverFilter, setRecoverFilter] = useState<
    'all' | 'recoverable' | 'owner'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((e) => {
        if (categoryFilter !== 'all' && e.category !== categoryFilter)
          return false;
        if (recoverFilter === 'recoverable' && !e.recoverable) return false;
        if (recoverFilter === 'owner' && e.recoverable) return false;
        if (!searchQuery.trim()) return true;
        const apt = apartments.find((a) => a.id === e.apartmentId);
        const hay = `${e.title} ${e.category} ${e.vendor ?? ''} ${
          apt?.shortName ?? ''
        }`.toLowerCase();
        return hay.includes(searchQuery.trim().toLowerCase());
      });
  }, [expenses, apartments, categoryFilter, recoverFilter, searchQuery]);

  const summary = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const recoverable = expenses
      .filter((e) => e.recoverable)
      .reduce((s, e) => s + e.amount, 0);
    const owner = total - recoverable;

    const byCategory = CATEGORIES.map((cat) => {
      const amount = expenses
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + e.amount, 0);
      return { category: cat, amount };
    }).filter((c) => c.amount > 0);

    return { total, recoverable, owner, byCategory };
  }, [expenses]);

  const handleExportCSV = () => {
    exportToCSV(
      'charges_cle_gestion_2026.csv',
      [
        'Date',
        'Appartement',
        'Libellé',
        'Catégorie',
        'Fournisseur / Syndic',
        'Montant (FCFA)',
        'Imputation',
        'Statut',
      ],
      filteredExpenses.map((e) => {
        const apt = apartments.find((a) => a.id === e.apartmentId);
        return [
          e.date,
          apt?.shortName ?? e.apartmentId,
          e.title,
          e.category,
          e.vendor ?? '',
          Math.round(e.amount),
          e.recoverable ? 'Récupérable locataire' : 'Charge propriétaire',
          e.status === 'paid' ? 'Payée' : 'Prévue',
        ];
      }),
    );
  };

  return (
    <div className="space-y-6">
      {/* Top KPI + Category distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Total des charges enregistrées
            </div>
            <div className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {formatCFA(summary.total)}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <dt className="text-xs text-slate-500">Charge propriétaire</dt>
              <dd className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {formatCFA(summary.owner)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Récupérable locataire</dt>
              <dd className="mt-1 font-mono text-sm font-semibold text-emerald-700 tabular-nums">
                {formatCFA(summary.recoverable)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">
              Répartition par poste de dépense
            </h2>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              Exporter CSV
            </button>
          </div>

          {summary.byCategory.length === 0 ? (
            <p className="py-6 text-xs text-slate-500">
              Aucune dépense enregistrée sur cette sélection.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {summary.byCategory.map((item) => {
                const pct =
                  summary.total > 0
                    ? Math.round((item.amount / summary.total) * 100)
                    : 0;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">
                        {item.category}
                      </span>
                      <span className="font-mono text-slate-900 tabular-nums">
                        {formatCFA(item.amount)} · {pct} %
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-800 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filters & Action */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            {(
              [
                { id: 'all', label: 'Toutes' },
                { id: 'owner', label: 'Propriétaire' },
                { id: 'recoverable', label: 'Récupérables' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRecoverFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  recoverFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'all' | ExpenseCategory)
            }
            aria-label="Filtrer par catégorie"
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">Toutes les catégories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 lg:w-64">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher syndic, libellé..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <button
            type="button"
            onClick={onAddExpense}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter une charge
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <p className="text-sm font-medium text-slate-900">
              Aucune charge correspondante
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Ajoutez une facture de travaux, un appel de fonds ou modifiez les filtres.
            </p>
            <button
              type="button"
              onClick={onAddExpense}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter une charge
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Libellé &amp; Tiers</th>
                  <th className="py-3 px-4">Bien</th>
                  <th className="py-3 px-4">Catégorie &amp; Imputation</th>
                  <th className="py-3 px-4 text-right">Montant</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredExpenses.map((expense) => {
                  const apt = apartments.find(
                    (a) => a.id === expense.apartmentId,
                  );
                  const isConfirmingDelete = confirmDeleteId === expense.id;
                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateFR(expense.date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {expense.title}
                        </div>
                        {expense.vendor && (
                          <div className="text-xs text-slate-500">
                            {expense.vendor}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                        {apt?.shortName ?? expense.apartmentId}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <span className="font-medium text-slate-800">
                          {expense.category}
                        </span>
                        <span aria-hidden="true" className="mx-1.5 text-slate-300">
                          ·
                        </span>
                        <span>
                          {expense.recoverable
                            ? 'Récupérable locataire'
                            : 'Charge propriétaire'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCFA(expense.amount)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {expense.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <Check className="h-3.5 w-3.5" />
                            Payée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                            <Clock className="h-3.5 w-3.5" />
                            Prévue
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isConfirmingDelete ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteExpense(expense.id);
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
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditExpense(expense)}
                              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md transition-colors"
                              aria-label="Modifier cette charge"
                              title="Modifier"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(expense.id)}
                              className="p-1.5 text-slate-400 hover:text-red-700 rounded-md transition-colors"
                              aria-label="Supprimer cette charge"
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
