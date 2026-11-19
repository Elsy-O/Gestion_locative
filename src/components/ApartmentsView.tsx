import React from 'react';
import { Edit3, Mail, MessageSquare, Phone } from 'lucide-react';
import { Apartment, Expense, RentPayment, TenantDocument } from '../types';
import { formatCFA, formatDateFR } from '../utils/formatters';

interface ApartmentsViewProps {
  apartments: Apartment[];
  payments: RentPayment[];
  expenses: Expense[];
  documents: TenantDocument[];
  onEditApartment: (apartment: Apartment) => void;
  onContactTenant: (apartmentId: string) => void;
}

export const ApartmentsView: React.FC<ApartmentsViewProps> = ({
  apartments,
  payments,
  expenses,
  documents,
  onEditApartment,
  onContactTenant,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Patrimoine &amp; Baux en cours
          </h2>
          <p className="text-sm text-slate-500">
            Caractéristiques des logements, conditions financières du bail et coordonnées des locataires.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {apartments.map((apt) => {
          const aptPayments = payments.filter((p) => p.apartmentId === apt.id);
          const aptExpenses = expenses.filter((e) => e.apartmentId === apt.id);
          const aptDocs = documents.filter((d) => d.apartmentId === apt.id);
          const totalCollected = aptPayments
            .filter((p) => p.status === 'paid')
            .reduce((s, p) => s + p.totalAmount, 0);
          const totalSpent = aptExpenses.reduce((s, e) => s + e.amount, 0);
          const totalMonthly = apt.rentHC + apt.chargesProvision;

          return (
            <section
              key={apt.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
            >
              <div className="relative h-56 bg-slate-100">
                <img
                  src={apt.photoUrl}
                  alt={apt.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4 text-white">
                  <div>
                    <div className="text-xs text-slate-200">
                      {apt.typology} · {apt.surfaceM2} m² · {apt.floorLabel}
                    </div>
                    <h3 className="mt-0.5 text-lg font-semibold">
                      {apt.address}, {apt.postalCity}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onContactTenant(apt.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-800 text-white rounded-lg hover:bg-emerald-900 transition-colors whitespace-nowrap"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Contacter
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditApartment(apt)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Modifier
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Financial breakdown */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 tracking-wide">
                    Conditions financières
                  </h4>
                  <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <dt className="text-xs text-slate-500">Loyer hors charges</dt>
                      <dd className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                        {formatCFA(apt.rentHC)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Provision charges</dt>
                      <dd className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                        {formatCFA(apt.chargesProvision)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Total mensuel CC</dt>
                      <dd className="mt-1 font-mono text-sm font-semibold text-emerald-700 tabular-nums">
                        {formatCFA(totalMonthly)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Dépôt de garantie</dt>
                      <dd className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                        {formatCFA(apt.deposit)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Lease & Tenant details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500">
                      Locataire en place
                    </h4>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {apt.tenant.fullName}
                    </div>
                    <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{apt.tenant.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono tabular-nums">
                          {apt.tenant.phone}
                        </span>
                      </div>
                      {apt.tenant.guarantorName && (
                        <div className="text-slate-500 pt-1">
                          Garant : {apt.tenant.guarantorName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-500">
                      Contrat de bail ({apt.leaseType})
                    </h4>
                    <dl className="mt-2 space-y-1.5 text-xs">
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Date d’effet</dt>
                        <dd className="font-mono text-slate-900 tabular-nums">
                          {formatDateFR(apt.leaseStart)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Échéance du bail</dt>
                        <dd className="font-mono text-slate-900 tabular-nums">
                          {formatDateFR(apt.leaseEnd)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Entrée dans les lieux</dt>
                        <dd className="font-mono text-slate-900 tabular-nums">
                          {formatDateFR(apt.tenant.moveInDate)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Pièces au dossier</dt>
                        <dd className="font-mono text-slate-900 tabular-nums">
                          {aptDocs.length} documents
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* YTD Totals strip */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <span className="text-slate-500">
                    Bilan 2026 encaissé :{' '}
                    <strong className="font-mono text-slate-900 tabular-nums">
                      {formatCFA(totalCollected)}
                    </strong>
                  </span>
                  <span className="text-slate-500">
                    Charges 2026 :{' '}
                    <strong className="font-mono text-amber-800 tabular-nums">
                      {formatCFA(totalSpent)}
                    </strong>
                  </span>
                  <span className="text-slate-500">
                    Net :{' '}
                    <strong className="font-mono text-emerald-700 tabular-nums">
                      {formatCFA(totalCollected - totalSpent)}
                    </strong>
                  </span>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
