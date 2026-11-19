export type NavSection =
  | 'overview'
  | 'apartments'
  | 'revenues'
  | 'expenses'
  | 'documents'
  | 'messages';

export type ApartmentFilter = 'all' | string;

export interface TenantInfo {
  fullName: string;
  email: string;
  phone: string;
  moveInDate: string;
  guarantorName?: string;
}

export interface Apartment {
  id: string;
  name: string;
  shortName: string;
  address: string;
  postalCity: string;
  typology: string;
  surfaceM2: number;
  floorLabel: string;
  leaseType: 'Meublé' | 'Vide';
  leaseStart: string;
  leaseEnd: string;
  rentHC: number;
  chargesProvision: number;
  deposit: number;
  purchasePrice: number;
  photoUrl: string;
  tenant: TenantInfo;
}

export type PaymentStatus = 'paid' | 'pending' | 'late';
export type PaymentMethod = 'Virement' | 'Prélèvement' | 'Chèque' | 'Mobile Money';

export interface RentPayment {
  id: string;
  apartmentId: string;
  period: string; // YYYY-MM
  periodLabel: string; // ex. Novembre 2026
  dueDate: string; // YYYY-MM-DD
  paidDate?: string; // YYYY-MM-DD
  rentHC: number;
  chargesProvision: number;
  totalAmount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
}

export type ExpenseCategory =
  | 'Copropriété'
  | 'Taxe foncière'
  | 'Assurance PNO'
  | 'Travaux & Entretien'
  | 'Frais & Diagnostics'
  | 'Autre';

export type ExpenseStatus = 'paid' | 'scheduled';

export interface Expense {
  id: string;
  apartmentId: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: ExpenseCategory;
  amount: number;
  recoverable: boolean;
  status: ExpenseStatus;
  vendor?: string;
  notes?: string;
}

export type DocumentCategory =
  | 'Bail'
  | 'État des lieux'
  | 'Assurance habitation'
  | 'Identité & Revenus'
  | 'Diagnostics'
  | 'Quittance';

export type DocumentStatus = 'valid' | 'expiring' | 'expired';

export interface TenantDocument {
  id: string;
  apartmentId: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedAt: string; // YYYY-MM-DD
  expiresAt?: string; // YYYY-MM-DD
  status: DocumentStatus;
  hasStoredFile: boolean;
  summaryText?: string;
  notes?: string;
}

export type MessageSender = 'manager' | 'tenant';

export type MessageTopic =
  | 'Général'
  | 'Loyer & Quittance'
  | 'Documents'
  | 'Travaux & Entretien';

export interface InternalMessage {
  id: string;
  apartmentId: string;
  sender: MessageSender;
  senderName: string;
  topic: MessageTopic;
  body: string;
  sentAt: string; // ISO string YYYY-MM-DDTHH:mm
  read: boolean;
  attachmentLabel?: string;
}
