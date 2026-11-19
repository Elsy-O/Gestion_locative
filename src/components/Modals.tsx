import React, { useEffect, useState } from 'react';
import { Download, FileText, Printer, Upload, X } from 'lucide-react';
import {
  Apartment,
  DocumentCategory,
  DocumentStatus,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  PaymentMethod,
  PaymentStatus,
  RentPayment,
  TenantDocument,
} from '../types';
import {
  downloadQuittanceHTML,
  formatCFA,
  formatDateFR,
  formatFileSize,
  formatMonthLabel,
} from '../utils/formatters';
import { getDocumentBlob } from '../utils/fileStorage';

interface ModalShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidthClass?: string;
  children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({
  title,
  subtitle,
  onClose,
  maxWidthClass = 'max-w-lg',
  children,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45"
    role="dialog"
    aria-modal="true"
  >
    <div
      className={`bg-white border border-slate-200 rounded-xl w-full ${maxWidthClass} max-h-[90vh] flex flex-col overflow-hidden`}
    >
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto">{children}</div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* 1. Rent Payment Modal                                                      */
/* -------------------------------------------------------------------------- */

interface RentPaymentModalProps {
  apartments: Apartment[];
  defaultApartmentId?: string;
  onSave: (payment: Omit<RentPayment, 'id'>) => void;
  onClose: () => void;
}

export const RentPaymentModal: React.FC<RentPaymentModalProps> = ({
  apartments,
  defaultApartmentId,
  onSave,
  onClose,
}) => {
  const initialApt =
    apartments.find((a) => a.id === defaultApartmentId) ?? apartments[0];

  const [apartmentId, setApartmentId] = useState(initialApt?.id ?? '');
  const [period, setPeriod] = useState('2026-12');
  const [rentHC, setRentHC] = useState(String(initialApt?.rentHC ?? 320000));
  const [chargesProvision, setChargesProvision] = useState(
    String(initialApt?.chargesProvision ?? 35000),
  );
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [dueDate, setDueDate] = useState('2026-12-05');
  const [paidDate, setPaidDate] = useState('2026-11-19');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('Virement');

  const handleAptChange = (nextId: string) => {
    setApartmentId(nextId);
    const found = apartments.find((a) => a.id === nextId);
    if (found) {
      setRentHC(String(found.rentHC));
      setChargesProvision(String(found.chargesProvision));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hc = Math.round(Number(rentHC) || 0);
    const ch = Math.round(Number(chargesProvision) || 0);
    const total = hc + ch;
    const prefix = apartmentId === 'apt-plateau' ? 'COC' : 'ALI';
    onSave({
      apartmentId,
      period,
      periodLabel: formatMonthLabel(period),
      dueDate,
      paidDate: status === 'paid' ? paidDate || dueDate : undefined,
      rentHC: hc,
      chargesProvision: ch,
      totalAmount: total,
      status,
      paymentMethod,
      receiptNumber:
        status === 'paid'
          ? `Q-${prefix}-${period.replace('-', '')}`
          : undefined,
    });
  };

  return (
    <ModalShell
      title="Enregistrer un loyer"
      subtitle="Échéance mensuelle ou encaissement locatif en FCFA"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Appartement
          </label>
          <select
            value={apartmentId}
            onChange={(e) => handleAptChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            required
          >
            {apartments.map((apt) => (
              <option key={apt.id} value={apt.id}>
                {apt.shortName} — {apt.tenant.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mois concerné
            </label>
            <input
              type="month"
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setDueDate(`${e.target.value}-05`);
              }}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Statut
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="paid">Encaissé</option>
              <option value="pending">En attente</option>
              <option value="late">En retard</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Loyer hors charges (FCFA)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={rentHC}
              onChange={(e) => setRentHC(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Provision charges (FCFA)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={chargesProvision}
              onChange={(e) => setChargesProvision(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mode de règlement
            </label>
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="Virement">Virement</option>
              <option value="Prélèvement">Prélèvement</option>
              <option value="Mobile Money">Mobile Money</option>
              <option value="Chèque">Chèque</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {status === 'paid' ? 'Date d’encaissement' : 'Date d’échéance'}
            </label>
            <input
              type="date"
              value={status === 'paid' ? paidDate : dueDate}
              onChange={(e) =>
                status === 'paid'
                  ? setPaidDate(e.target.value)
                  : setDueDate(e.target.value)
              }
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              required
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Total CC :{' '}
            <strong className="font-mono text-slate-900">
              {formatCFA(
                (Number(rentHC) || 0) + (Number(chargesProvision) || 0),
              )}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. Expense Modal                                                           */
/* -------------------------------------------------------------------------- */

interface ExpenseModalProps {
  apartments: Apartment[];
  initialExpense?: Expense | null;
  defaultApartmentId?: string;
  onSave: (data: Omit<Expense, 'id'>, existingId?: string) => void;
  onClose: () => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Copropriété',
  'Taxe foncière',
  'Assurance PNO',
  'Travaux & Entretien',
  'Frais & Diagnostics',
  'Autre',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  apartments,
  initialExpense,
  defaultApartmentId,
  onSave,
  onClose,
}) => {
  const [apartmentId, setApartmentId] = useState(
    initialExpense?.apartmentId ?? defaultApartmentId ?? apartments[0]?.id ?? '',
  );
  const [date, setDate] = useState(initialExpense?.date ?? '2026-11-19');
  const [title, setTitle] = useState(initialExpense?.title ?? '');
  const [category, setCategory] = useState<ExpenseCategory>(
    initialExpense?.category ?? 'Travaux & Entretien',
  );
  const [amount, setAmount] = useState(
    initialExpense ? String(initialExpense.amount) : '',
  );
  const [vendor, setVendor] = useState(initialExpense?.vendor ?? '');
  const [recoverable, setRecoverable] = useState(
    initialExpense?.recoverable ?? false,
  );
  const [status, setStatus] = useState<ExpenseStatus>(
    initialExpense?.status ?? 'paid',
  );
  const [notes, setNotes] = useState(initialExpense?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        apartmentId,
        date,
        title: title.trim(),
        category,
        amount: Math.round(Number(amount) || 0),
        recoverable,
        status,
        vendor: vendor.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      initialExpense?.id,
    );
  };

  return (
    <ModalShell
      title={initialExpense ? 'Modifier la charge' : 'Ajouter une charge'}
      subtitle="Dépense de copropriété, taxe, assurance ou entretien en FCFA"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Appartement
            </label>
            <select
              value={apartmentId}
              onChange={(e) => setApartmentId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              required
            >
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.id}>
                  {apt.shortName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Libellé de la dépense
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Entretien climatisation, Appel de fonds T4..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Montant TTC (FCFA)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="45000"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Fournisseur / Syndic
            </label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Optionnel"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Statut
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="paid">Payée</option>
              <option value="scheduled">Prévue</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={recoverable}
            onChange={(e) => setRecoverable(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900"
          />
          Charge récupérable sur le locataire (régularisation annuelle)
        </label>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Note fiscale / commentaire
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Référence facture ou commentaire..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            {initialExpense ? 'Mettre à jour' : 'Enregistrer la charge'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. Document Upload Modal                                                   */
/* -------------------------------------------------------------------------- */

interface DocumentUploadModalProps {
  apartments: Apartment[];
  preselectedApartmentId?: string;
  initialFile?: File | null;
  onSave: (
    doc: Omit<TenantDocument, 'id' | 'hasStoredFile'>,
    file?: File | null,
  ) => void;
  onClose: () => void;
}

const DOC_CATEGORIES: DocumentCategory[] = [
  'Bail',
  'État des lieux',
  'Assurance habitation',
  'Identité & Revenus',
  'Diagnostics',
  'Quittance',
];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  apartments,
  preselectedApartmentId,
  initialFile,
  onSave,
  onClose,
}) => {
  const [apartmentId, setApartmentId] = useState(
    preselectedApartmentId ?? apartments[0]?.id ?? '',
  );
  const [category, setCategory] = useState<DocumentCategory>(
    'Assurance habitation',
  );
  const [file, setFile] = useState<File | null>(initialFile ?? null);
  const [title, setTitle] = useState(
    initialFile ? initialFile.name.replace(/\.[^/.]+$/, '') : '',
  );
  const [expiresAt, setExpiresAt] = useState('');
  const [status, setStatus] = useState<DocumentStatus>('valid');
  const [notes, setNotes] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title.trim()) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        apartmentId,
        title: title.trim() || file?.name || 'Document locataire',
        category,
        fileName:
          file?.name ??
          `${title.trim().replace(/\s+/g, '_') || 'document'}.pdf`,
        fileType: file?.type || 'application/pdf',
        fileSizeBytes: file?.size ?? 125000,
        uploadedAt: new Date().toISOString().slice(0, 10),
        expiresAt: expiresAt || undefined,
        status,
        summaryText: notes.trim() || undefined,
      },
      file,
    );
  };

  return (
    <ModalShell
      title="Importer un document locataire"
      subtitle="Le fichier est conservé localement dans votre navigateur"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
          <label className="flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
            <Upload className="h-5 w-5 text-slate-500" />
            <span className="text-xs font-medium text-slate-800">
              {file
                ? `${file.name} (${formatFileSize(file.size)})`
                : 'Sélectionner un fichier PDF, PNG ou JPG'}
            </span>
            <input
              type="file"
              accept=".pdf,image/*,.doc,.docx"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Appartement
            </label>
            <select
              value={apartmentId}
              onChange={(e) => setApartmentId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              required
            >
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.id}>
                  {apt.shortName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              {DOC_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Intitulé du document
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Attestation d'assurance habitation 2027"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date d’expiration (optionnel)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Statut de validité
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DocumentStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="valid">Valide</option>
              <option value="expiring">À renouveler</option>
              <option value="expired">Expiré</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Résumé / Observations
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Numéro de contrat, remarques sur l'état des lieux..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Archiver le document
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. Apartment & Tenant Edit Modal                                           */
/* -------------------------------------------------------------------------- */

interface ApartmentEditModalProps {
  apartment: Apartment;
  onSave: (updated: Apartment) => void;
  onClose: () => void;
}

export const ApartmentEditModal: React.FC<ApartmentEditModalProps> = ({
  apartment,
  onSave,
  onClose,
}) => {
  const [address, setAddress] = useState(apartment.address);
  const [postalCity, setPostalCity] = useState(apartment.postalCity);
  const [rentHC, setRentHC] = useState(String(apartment.rentHC));
  const [chargesProvision, setChargesProvision] = useState(
    String(apartment.chargesProvision),
  );
  const [deposit, setDeposit] = useState(String(apartment.deposit));
  const [leaseType, setLeaseType] = useState<'Meublé' | 'Vide'>(
    apartment.leaseType,
  );
  const [leaseStart, setLeaseStart] = useState(apartment.leaseStart);
  const [leaseEnd, setLeaseEnd] = useState(apartment.leaseEnd);
  const [tenantName, setTenantName] = useState(apartment.tenant.fullName);
  const [tenantEmail, setTenantEmail] = useState(apartment.tenant.email);
  const [tenantPhone, setTenantPhone] = useState(apartment.tenant.phone);
  const [guarantorName, setGuarantorName] = useState(
    apartment.tenant.guarantorName ?? '',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...apartment,
      address: address.trim(),
      postalCity: postalCity.trim(),
      rentHC: Math.round(Number(rentHC) || 0),
      chargesProvision: Math.round(Number(chargesProvision) || 0),
      deposit: Math.round(Number(deposit) || 0),
      leaseType,
      leaseStart,
      leaseEnd,
      tenant: {
        ...apartment.tenant,
        fullName: tenantName.trim(),
        email: tenantEmail.trim(),
        phone: tenantPhone.trim(),
        guarantorName: guarantorName.trim() || undefined,
      },
    });
  };

  return (
    <ModalShell
      title={`Modifier — ${apartment.shortName}`}
      subtitle="Paramètres du bien, du bail et du locataire (montants en FCFA)"
      onClose={onClose}
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ville / Commune
            </label>
            <input
              type="text"
              value={postalCity}
              onChange={(e) => setPostalCity(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Loyer HC (FCFA)
            </label>
            <input
              type="number"
              value={rentHC}
              onChange={(e) => setRentHC(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Charges (FCFA)
            </label>
            <input
              type="number"
              value={chargesProvision}
              onChange={(e) => setChargesProvision(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Dépôt garantie (FCFA)
            </label>
            <input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Type de bail
            </label>
            <select
              value={leaseType}
              onChange={(e) =>
                setLeaseType(e.target.value as 'Meublé' | 'Vide')
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="Meublé">Meublé</option>
              <option value="Vide">Vide</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Début bail
            </label>
            <input
              type="date"
              value={leaseStart}
              onChange={(e) => setLeaseStart(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Fin bail
            </label>
            <input
              type="date"
              value={leaseEnd}
              onChange={(e) => setLeaseEnd(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
              required
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nom du locataire
              </label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Téléphone
              </label>
              <input
                type="text"
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email locataire
              </label>
              <input
                type="email"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Garant / Caution
              </label>
              <input
                type="text"
                value={guarantorName}
                onChange={(e) => setGuarantorName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. Quittance de loyer Modal                                                */
/* -------------------------------------------------------------------------- */

interface QuittanceModalProps {
  payment: RentPayment;
  apartment: Apartment;
  ownerName: string;
  onClose: () => void;
}

export const QuittanceModal: React.FC<QuittanceModalProps> = ({
  payment,
  apartment,
  ownerName,
  onClose,
}) => {
  return (
    <ModalShell
      title={`Quittance de loyer — ${payment.periodLabel}`}
      subtitle={`Référence ${payment.receiptNumber ?? payment.id}`}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
    >
      <div id="quittance-printable" className="space-y-6 text-sm text-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-base font-bold text-slate-900">
              QUITTANCE DE LOYER
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Période du terme : {payment.periodLabel} · Réf.{' '}
              {payment.receiptNumber ?? payment.period}
            </div>
          </div>
          <div className="text-xs text-slate-500 sm:text-right font-mono tabular-nums">
            Émise le {formatDateFR(new Date().toISOString().slice(0, 10))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs">
          <div>
            <div className="text-slate-500 font-medium mb-1">Bailleur</div>
            <div className="font-semibold text-slate-900">{ownerName}</div>
            <div className="text-slate-600">Propriétaire bailleur</div>
          </div>
          <div>
            <div className="text-slate-500 font-medium mb-1">Locataire</div>
            <div className="font-semibold text-slate-900">
              {apartment.tenant.fullName}
            </div>
            <div className="text-slate-600">
              {apartment.address}, {apartment.postalCity}
            </div>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-700">
          Je soussigné(e) <strong>{ownerName}</strong>, propriétaire du logement
          désigné ci-dessus ({apartment.typology} · {apartment.surfaceM2} m²),
          déclare avoir reçu de <strong>{apartment.tenant.fullName}</strong> la
          somme de{' '}
          <strong className="font-mono">
            {formatCFA(payment.totalAmount)}
          </strong>{' '}
          au titre du paiement du loyer et des charges pour la période de{' '}
          <strong>{payment.periodLabel}</strong>, et lui en donne quittance,
          sous réserve de tous mes droits.
        </p>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 text-left font-medium">Désignation</th>
              <th className="py-2 text-right font-medium">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2.5 text-slate-700">
                Loyer principal (hors charges)
              </td>
              <td className="py-2.5 text-right font-mono tabular-nums">
                {formatCFA(payment.rentHC)}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 text-slate-700">
                Provision pour charges récupérables
              </td>
              <td className="py-2.5 text-right font-mono tabular-nums">
                {formatCFA(payment.chargesProvision)}
              </td>
            </tr>
            <tr className="bg-slate-50 font-semibold text-slate-900">
              <td className="py-2.5 px-2">
                Total encaissé ({payment.paymentMethod} le{' '}
                {formatDateFR(payment.paidDate || payment.dueDate)})
              </td>
              <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                {formatCFA(payment.totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-3">
          Quittance délivrée pour servir et valoir ce que de droit. Ce reçu
          annule tous les reçus qui auraient pu être établis précédemment en cas
          de paiement partiel du terme.
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
        >
          <Printer className="h-3.5 w-3.5" />
          Imprimer / PDF
        </button>
        <button
          type="button"
          onClick={() => downloadQuittanceHTML(payment, apartment, ownerName)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          <Download className="h-3.5 w-3.5" />
          Télécharger la quittance
        </button>
      </div>
    </ModalShell>
  );
};

/* -------------------------------------------------------------------------- */
/* 6. Document Preview Modal                                                  */
/* -------------------------------------------------------------------------- */

interface DocumentPreviewModalProps {
  doc: TenantDocument;
  apartment?: Apartment;
  onDownload: (doc: TenantDocument) => void;
  onUpdateStatus: (docId: string, nextStatus: DocumentStatus) => void;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  doc,
  apartment,
  onDownload,
  onUpdateStatus,
  onClose,
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loadingBlob, setLoadingBlob] = useState(doc.hasStoredFile);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    if (doc.hasStoredFile) {
      setLoadingBlob(true);
      getDocumentBlob(doc.id)
        .then((blob) => {
          if (!active) return;
          if (blob) {
            createdUrl = URL.createObjectURL(blob);
            setObjectUrl(createdUrl);
          }
          setLoadingBlob(false);
        })
        .catch(() => {
          if (active) setLoadingBlob(false);
        });
    }
    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [doc.id, doc.hasStoredFile]);

  const isImage = doc.fileType.startsWith('image/');
  const isPdf = doc.fileType === 'application/pdf';

  return (
    <ModalShell
      title={doc.title}
      subtitle={`${apartment?.shortName ?? ''} · ${doc.category} · ${doc.fileName}`}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div>
            <div className="text-slate-500">Locataire</div>
            <div className="font-medium text-slate-900 mt-0.5 truncate">
              {apartment?.tenant.fullName ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Ajouté le</div>
            <div className="font-mono text-slate-900 mt-0.5 tabular-nums">
              {formatDateFR(doc.uploadedAt)}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Expiration</div>
            <div className="font-mono text-slate-900 mt-0.5 tabular-nums">
              {doc.expiresAt ? formatDateFR(doc.expiresAt) : 'Aucune'}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Statut</div>
            <select
              value={doc.status}
              onChange={(e) =>
                onUpdateStatus(doc.id, e.target.value as DocumentStatus)
              }
              aria-label="Statut du document"
              className="mt-0.5 w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-medium text-slate-900"
            >
              <option value="valid">Valide</option>
              <option value="expiring">À renouveler</option>
              <option value="expired">Expiré</option>
            </select>
          </div>
        </div>

        {loadingBlob ? (
          <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
        ) : objectUrl && isImage ? (
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-100 max-h-[420px] flex items-center justify-center">
            <img
              src={objectUrl}
              alt={doc.title}
              className="max-h-[420px] w-auto object-contain"
            />
          </div>
        ) : objectUrl && isPdf ? (
          <iframe
            src={objectUrl}
            title={doc.title}
            className="w-full h-[420px] border border-slate-200 rounded-lg"
          />
        ) : (
          <div className="border border-slate-200 rounded-lg p-6 bg-white space-y-3">
            <div className="flex items-center gap-3 text-slate-800">
              <FileText className="h-5 w-5 text-slate-500 shrink-0" />
              <div>
                <div className="text-sm font-medium">{doc.fileName}</div>
                <div className="text-xs text-slate-500 font-mono">
                  {formatFileSize(doc.fileSizeBytes)} · {doc.fileType}
                </div>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 pt-2 border-t border-slate-100">
              {doc.summaryText ||
                'Pièce justificative archivée au dossier locatif. Cliquez sur Télécharger pour exporter le récapitulatif ou remplacez-la par un fichier numérisé.'}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={() => onDownload(doc)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            Télécharger
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
