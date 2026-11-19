import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  Clock,
  FileWarning,
  MessageSquare,
} from 'lucide-react';
import {
  Apartment,
  Expense,
  InternalMessage,
  NavSection,
  RentPayment,
  TenantDocument,
} from '../types';
import {
  formatCFA,
  formatCompactCFA,
  formatDateFR,
} from '../utils/formatters';
import { CashflowChart, MonthlyPoint } from './CashflowChart';

interface OverviewViewProps {
  apartments: Apartment[];
  allApartments: Apartment[];
  payments: RentPayment[];
  expenses: Expense[];
  documents: TenantDocument[];
  messages: InternalMessage[];
  onMarkPaid: (paymentId: string) => void;
  onNavigate: (section: NavSection) => void;
  onSelectApartmentFilter: (id: string) => void;
  onPreviewDocument: (doc: TenantDocument) => void;
  onContactTenant: (apartmentId: string) => void;
}

const MONTH_SHORT: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fév',
  '03': 'Mar',
  '04': 'Avr',
  '05': 'Mai',
  '06': 'Juin',
  '07': 'Juil',
  '08': 'Août',
  '09': 'Sept',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Déc',
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  apartments,
  allApartments,
  payments,
  expenses,
  documents,
  messages,
  onMarkPaid,
  onNavigate,
  onSelectApartmentFilter,
  onPreviewDocument,
  onContactTenant,
}) => {
  const paidRevenuesYTD = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const pendingOrLatePayments = payments.filter((p) => p.status !== 'paid');
  const pendingAmount = pendingOrLatePayments.reduce(
    (sum, p) => sum + p.totalAmount,
    0,
  );

  const totalExpensesYTD = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netCashflowYTD = paidRevenuesYTD - totalExpensesYTD;

  const totalPurchaseValue = apartments.reduce(
    (sum, a) => sum + a.purchasePrice,
    0,
  );
  const monthsCovered = Math.max(
    1,
    new Set(payments.map((p) => p.period)).size,
  );
  const annualizedGross =
    (payments.reduce((sum, p) => sum + p.rentHC, 0) / monthsCovered) * 12;
  const annualizedNet = (netCashflowYTD / monthsCovered) * 12;
  const grossYield =
    totalPurchaseValue > 0 ? (annualizedGross / totalPurchaseValue) * 100 : 0;
  const netYield =
    totalPurchaseValue > 0 ? (annualizedNet / totalPurchaseValue) * 100 : 0;

  const periods = Array.from(
    new Set([
      ...payments.map((p) => p.period),
      ...expenses.map((e) => e.date.slice(0, 7)),
    ]),
  ).sort();

  const monthlySeries: MonthlyPoint[] = periods.map((period) => {
    const [, mm] = period.split('-');
    const rev = payments
      .filter((p) => p.period === period && p.status === 'paid')
      .reduce((s, p) => s + p.totalAmount, 0);
    const exp = expenses
      .filter((e) => e.date.slice(0, 7) === period)
      .reduce((s, e) => s + e.amount, 0);
    const samplePay = payments.find((p) => p.period === period);
    return {
      period,
      shortLabel: MONTH_SHORT[mm] || mm,
      fullLabel: samplePay?.periodLabel || period,
      revenues: rev,
      expenses: exp,
      net: rev - exp,
    };
  });

  const attentionDocs = documents.filter((d) => d.status !== 'valid');
  const unreadMessages = messages.filter(
    (m) => m.sender === 'tenant' && !m.read,
  );

  return (
    <div className="space-y-8">
      {/* 4-column KPI strip */}
      <section
        aria-label="Indicateurs financiers clés"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200"
      >
        <div className="p-6">
          <div className="text-xs font-medium text-slate-500">
            Revenus encaissés (2026)
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {formatCFA(paidRevenuesYTD)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {pendingAmount > 0
              ? `+ ${formatCFA(pendingAmount)} en attente`
              : 'Tous les loyers échus encaissés'}
          </div>
        </div>

        <div className="p-6">
          <div className="text-xs font-medium text-slate-500">
            Charges &amp; Dépenses (2026)
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {formatCFA(totalExpensesYTD)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {expenses.length} écritures · Copropriété, taxes &amp; entretien
          </div>
        </div>

        <div className="p-6">
          <div className="text-xs font-medium text-slate-500">
            Revenu net encaissé
          </div>
          <div
            className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
              netCashflowYTD >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {formatCFA(netCashflowYTD)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500 tabular-nums">
            Marge nette :{' '}
            {paidRevenuesYTD > 0
              ? `${Math.round((netCashflowYTD / paidRevenuesYTD) * 100)} %`
              : '—'}
          </div>
        </div>

        <div className="p-6">
          <div className="text-xs font-medium text-slate-500">
            Rendement annualisé
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {netYield.toFixed(2).replace('.', ',')} % net
          </div>
          <div className="mt-1.5 text-xs text-slate-500 tabular-nums">
            Brut : {grossYield.toFixed(2).replace('.', ',')} % · Capital{' '}
            {formatCompactCFA(totalPurchaseValue)}
          </div>
        </div>
      </section>

      {/* Main Chart + Action Queue */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2">
          <CashflowChart data={monthlySeries} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Actions &amp; Échéances
            </h2>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {pendingOrLatePayments.length +
                attentionDocs.length +
                unreadMessages.length}{' '}
              à traiter
            </span>
          </div>

          {pendingOrLatePayments.length === 0 &&
          attentionDocs.length === 0 &&
          unreadMessages.length === 0 ? (
            <div className="py-8 text-center">
              <Check className="h-6 w-6 text-emerald-700 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-900">
                Situation locative à jour
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Aucun loyer en attente, document expirant ni message non lu.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingOrLatePayments.map((p) => {
                const apt = allApartments.find((a) => a.id === p.apartmentId);
                return (
                  <div
                    key={p.id}
                    className="py-3.5 first:pt-0 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        {p.status === 'late' ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>
                          {p.status === 'late'
                            ? 'Loyer en retard'
                            : 'Loyer en attente'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-900 truncate">
                        {apt?.shortName} · {p.periodLabel}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
                        {formatCFA(p.totalAmount)} · Échéance{' '}
                        {formatDateFR(p.dueDate)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onMarkPaid(p.id)}
                      className="shrink-0 px-3 py-1.5 text-xs font-medium bg-emerald-800 text-white rounded-lg hover:bg-emerald-900 transition-colors whitespace-nowrap"
                    >
                      Encaisser
                    </button>
                  </div>
                );
              })}

              {unreadMessages.map((msg) => {
                const apt = allApartments.find((a) => a.id === msg.apartmentId);
                return (
                  <div
                    key={msg.id}
                    className="py-3.5 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                        <span>Nouveau message locataire</span>
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-900 truncate">
                        {msg.senderName} · {apt?.shortName}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                        {msg.body}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onContactTenant(msg.apartmentId)}
                      className="shrink-0 px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      Répondre
                    </button>
                  </div>
                );
              })}

              {attentionDocs.map((doc) => {
                const apt = allApartments.find((a) => a.id === doc.apartmentId);
                return (
                  <div
                    key={doc.id}
                    className="py-3.5 last:pb-0 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <FileWarning className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {doc.status === 'expired'
                            ? 'Document expiré'
                            : 'Expiration proche'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-900 truncate">
                        {doc.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {apt?.shortName} · Échéance {formatDateFR(doc.expiresAt)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onPreviewDocument(doc)}
                      className="shrink-0 px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      Consulter
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => onNavigate('revenues')}
              className="font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
            >
              Registre des loyers <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('documents')}
              className="font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
            >
              Dossiers locataires <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Two Apartments Comparison Cards */}
      <section aria-label="Synthèse par appartement" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Synthèse par bien immobilier
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('apartments')}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
          >
            Gérer les fiches biens <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {apartments.map((apt) => {
            const aptPayments = payments.filter((p) => p.apartmentId === apt.id);
            const aptExpenses = expenses.filter((e) => e.apartmentId === apt.id);
            const aptDocs = documents.filter((d) => d.apartmentId === apt.id);
            const aptPaid = aptPayments
              .filter((p) => p.status === 'paid')
              .reduce((s, p) => s + p.totalAmount, 0);
            const aptExpTotal = aptExpenses.reduce((s, e) => s + e.amount, 0);
            const aptNet = aptPaid - aptExpTotal;
            const validDocsCount = aptDocs.filter(
              (d) => d.status === 'valid',
            ).length;
            const hasAlertDoc = aptDocs.some((d) => d.status !== 'valid');

            return (
              <article
                key={apt.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col sm:flex-row"
              >
                <div className="sm:w-52 shrink-0 bg-slate-100 relative min-h-[180px]">
                  <img
                    src={apt.photoUrl}
                    alt={apt.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="sr-only">{apt.name}</div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between gap-4 min-w-0">
                  <div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span>{apt.typology}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {apt.surfaceM2} m²
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Bail {apt.leaseType.toLowerCase()}</span>
                    </div>

                    <h3 className="mt-1 text-base font-semibold text-slate-900 truncate">
                      {apt.address}, {apt.postalCity}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Locataire :{' '}
                      <span className="font-medium text-slate-900">
                        {apt.tenant.fullName}
                      </span>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                    <div>
                      <div className="text-xs text-slate-500">Loyer CC / mois</div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                        {formatCFA(apt.rentHC + apt.chargesProvision)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Net 2026</div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-emerald-700 tabular-nums">
                        {formatCFA(aptNet)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Dossier</div>
                      <div
                        className={`mt-0.5 font-mono text-sm font-semibold tabular-nums ${
                          hasAlertDoc ? 'text-amber-700' : 'text-slate-900'
                        }`}
                      >
                        {validDocsCount}/{aptDocs.length} valides
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectApartmentFilter(apt.id);
                        onNavigate('documents');
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      Dossier
                    </button>
                    <button
                      type="button"
                      onClick={() => onContactTenant(apt.id)}
                      className="text-xs font-medium text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Contacter le locataire
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
