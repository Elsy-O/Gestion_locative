import { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import {
  Apartment,
  ApartmentFilter,
  DocumentStatus,
  Expense,
  InternalMessage,
  MessageSender,
  MessageTopic,
  NavSection,
  RentPayment,
  TenantDocument,
} from './types';
import {
  INITIAL_APARTMENTS,
  INITIAL_DOCUMENTS,
  INITIAL_EXPENSES,
  INITIAL_MESSAGES,
  INITIAL_PAYMENTS,
  OWNER_NAME,
} from './data/seedData';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './components/OverviewView';
import { ApartmentsView } from './components/ApartmentsView';
import { RevenuesView } from './components/RevenuesView';
import { ExpensesView } from './components/ExpensesView';
import { DocumentsView } from './components/DocumentsView';
import { MessagesView } from './components/MessagesView';
import {
  ApartmentEditModal,
  DocumentPreviewModal,
  DocumentUploadModal,
  ExpenseModal,
  QuittanceModal,
  RentPaymentModal,
} from './components/Modals';
import {
  deleteDocumentBlob,
  getDocumentBlob,
  putDocumentBlob,
} from './utils/fileStorage';

const STORAGE_KEY = 'cle_gestion_state_v2';

interface PersistedState {
  apartments: Apartment[];
  payments: RentPayment[];
  expenses: Expense[];
  documents: TenantDocument[];
  messages: InternalMessage[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (
        Array.isArray(parsed.apartments) &&
        Array.isArray(parsed.payments) &&
        Array.isArray(parsed.expenses) &&
        Array.isArray(parsed.documents)
      ) {
        return {
          apartments: parsed.apartments,
          payments: parsed.payments,
          expenses: parsed.expenses,
          documents: parsed.documents,
          messages: Array.isArray(parsed.messages)
            ? parsed.messages
            : INITIAL_MESSAGES,
        };
      }
    }
  } catch {
    // Fallback to initial seed data if localStorage is unavailable or corrupt
  }
  return {
    apartments: INITIAL_APARTMENTS,
    payments: INITIAL_PAYMENTS,
    expenses: INITIAL_EXPENSES,
    documents: INITIAL_DOCUMENTS,
    messages: INITIAL_MESSAGES,
  };
}

const SECTION_TITLES: Record<NavSection, string> = {
  overview: "Vue d'ensemble",
  apartments: 'Mes appartements',
  revenues: 'Revenus & Loyers',
  expenses: 'Charges & Dépenses',
  documents: 'Documents locataires',
  messages: 'Messagerie interne',
};

export default function App() {
  const [initial] = useState<PersistedState>(() => loadInitialState());
  const [apartments, setApartments] = useState<Apartment[]>(initial.apartments);
  const [payments, setPayments] = useState<RentPayment[]>(initial.payments);
  const [expenses, setExpenses] = useState<Expense[]>(initial.expenses);
  const [documents, setDocuments] = useState<TenantDocument[]>(
    initial.documents,
  );
  const [messages, setMessages] = useState<InternalMessage[]>(initial.messages);

  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [apartmentFilter, setApartmentFilter] = useState<ApartmentFilter>('all');
  const [activeThreadAptId, setActiveThreadAptId] = useState<string>(
    initial.apartments[0]?.id ?? 'apt-plateau',
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [showRentModal, setShowRentModal] = useState(false);
  const [expenseModalState, setExpenseModalState] = useState<{
    open: boolean;
    editing: Expense | null;
  }>({ open: false, editing: null });
  const [uploadModalState, setUploadModalState] = useState<{
    open: boolean;
    apartmentId?: string;
    file?: File | null;
  }>({ open: false });
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(
    null,
  );
  const [quittancePayment, setQuittancePayment] = useState<RentPayment | null>(
    null,
  );
  const [previewDoc, setPreviewDoc] = useState<TenantDocument | null>(null);

  useEffect(() => {
    try {
      const payload: PersistedState = {
        apartments,
        payments,
        expenses,
        documents,
        messages,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [apartments, payments, expenses, documents, messages]);

  const scopedApartments = useMemo(
    () =>
      apartmentFilter === 'all'
        ? apartments
        : apartments.filter((a) => a.id === apartmentFilter),
    [apartments, apartmentFilter],
  );

  const scopedPayments = useMemo(
    () =>
      apartmentFilter === 'all'
        ? payments
        : payments.filter((p) => p.apartmentId === apartmentFilter),
    [payments, apartmentFilter],
  );

  const scopedExpenses = useMemo(
    () =>
      apartmentFilter === 'all'
        ? expenses
        : expenses.filter((e) => e.apartmentId === apartmentFilter),
    [expenses, apartmentFilter],
  );

  const scopedDocuments = useMemo(
    () =>
      apartmentFilter === 'all'
        ? documents
        : documents.filter((d) => d.apartmentId === apartmentFilter),
    [documents, apartmentFilter],
  );

  const scopedMessages = useMemo(
    () =>
      apartmentFilter === 'all'
        ? messages
        : messages.filter((m) => m.apartmentId === apartmentFilter),
    [messages, apartmentFilter],
  );

  const pendingPaymentsCount = payments.filter(
    (p) => p.status !== 'paid',
  ).length;
  const expiringDocsCount = documents.filter((d) => d.status !== 'valid').length;
  const unreadMessagesCount = messages.filter(
    (m) => m.sender === 'tenant' && !m.read,
  ).length;

  const handleMarkPaid = (paymentId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id !== paymentId) return p;
        const prefix = p.apartmentId === 'apt-plateau' ? 'COC' : 'ALI';
        return {
          ...p,
          status: 'paid',
          paidDate: today,
          receiptNumber:
            p.receiptNumber ?? `Q-${prefix}-${p.period.replace('-', '')}`,
        };
      }),
    );
  };

  const handleSavePayment = (data: Omit<RentPayment, 'id'>) => {
    const next: RentPayment = {
      ...data,
      id: `pay-${Date.now()}`,
    };
    setPayments((prev) => [next, ...prev]);
    setShowRentModal(false);
  };

  const handleDeletePayment = (paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  const handleSaveExpense = (
    data: Omit<Expense, 'id'>,
    existingId?: string,
  ) => {
    if (existingId) {
      setExpenses((prev) =>
        prev.map((e) => (e.id === existingId ? { ...data, id: existingId } : e)),
      );
    } else {
      setExpenses((prev) => [{ ...data, id: `exp-${Date.now()}` }, ...prev]);
    }
    setExpenseModalState({ open: false, editing: null });
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  const handleSaveDocument = async (
    docData: Omit<TenantDocument, 'id' | 'hasStoredFile'>,
    file?: File | null,
  ) => {
    const id = `doc-${Date.now()}`;
    let hasStoredFile = false;
    if (file) {
      try {
        await putDocumentBlob(id, file);
        hasStoredFile = true;
      } catch {
        hasStoredFile = false;
      }
    }
    const created: TenantDocument = {
      ...docData,
      id,
      hasStoredFile,
    };
    setDocuments((prev) => [created, ...prev]);
    setUploadModalState({ open: false });
  };

  const handleDownloadDocument = async (doc: TenantDocument) => {
    if (doc.hasStoredFile) {
      try {
        const blob = await getDocumentBlob(doc.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = doc.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          return;
        }
      } catch {
        // Fallback below if IndexedDB unavailable
      }
    }

    const apt = apartments.find((a) => a.id === doc.apartmentId);
    const content = [
      `DOCUMENT LOCATIF — ${doc.title}`,
      `Bien : ${apt?.name ?? doc.apartmentId} (${apt?.address ?? ''})`,
      `Locataire : ${apt?.tenant.fullName ?? ''}`,
      `Catégorie : ${doc.category}`,
      `Ajouté le : ${doc.uploadedAt}`,
      doc.expiresAt ? `Date d'expiration : ${doc.expiresAt}` : '',
      '',
      doc.summaryText ?? 'Pièce archivée dans Clé & Gestion.',
    ]
      .filter(Boolean)
      .join('\n');

    const fallbackBlob = new Blob([content], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(fallbackBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.fileName.replace(/\.[^/.]+$/, '')}_fiche.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteDocument = async (docId: string) => {
    const target = documents.find((d) => d.id === docId);
    if (target?.hasStoredFile) {
      try {
        await deleteDocumentBlob(docId);
      } catch {
        // Ignore IndexedDB deletion errors
      }
    }
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (previewDoc?.id === docId) setPreviewDoc(null);
  };

  const handleUpdateDocStatus = (docId: string, nextStatus: DocumentStatus) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: nextStatus } : d)),
    );
    setPreviewDoc((prev) =>
      prev && prev.id === docId ? { ...prev, status: nextStatus } : prev,
    );
  };

  const handleSaveApartment = (updated: Apartment) => {
    setApartments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a)),
    );
    setEditingApartment(null);
  };

  const handleSendMessage = ({
    apartmentId,
    sender,
    topic,
    body,
    attachmentLabel,
  }: {
    apartmentId: string;
    sender: MessageSender;
    topic: MessageTopic;
    body: string;
    attachmentLabel?: string;
  }) => {
    const apt = apartments.find((a) => a.id === apartmentId);
    const now = new Date();
    const sentAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(now.getDate()).padStart(2, '0')}T${String(
      now.getHours(),
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMsg: InternalMessage = {
      id: `msg-${Date.now()}`,
      apartmentId,
      sender,
      senderName:
        sender === 'manager'
          ? OWNER_NAME
          : apt?.tenant.fullName ?? 'Locataire',
      topic,
      body,
      sentAt,
      read: true,
      attachmentLabel,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleMarkThreadRead = useCallback((apartmentId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.apartmentId === apartmentId && m.sender === 'tenant' && !m.read
          ? { ...m, read: true }
          : m,
      ),
    );
  }, []);

  const handleContactTenant = (apartmentId: string) => {
    setActiveThreadAptId(apartmentId);
    setActiveSection('messages');
  };

  const handleResetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApartments(INITIAL_APARTMENTS);
    setPayments(INITIAL_PAYMENTS);
    setExpenses(INITIAL_EXPENSES);
    setDocuments(INITIAL_DOCUMENTS);
    setMessages(INITIAL_MESSAGES);
    setApartmentFilter('all');
  };

  const primaryAction = () => {
    if (activeSection === 'expenses') {
      setExpenseModalState({ open: true, editing: null });
    } else if (activeSection === 'documents') {
      setUploadModalState({
        open: true,
        apartmentId: apartmentFilter === 'all' ? undefined : apartmentFilter,
      });
    } else if (activeSection === 'messages') {
      setActiveSection('messages');
      const targetApt =
        apartmentFilter === 'all'
          ? activeThreadAptId
          : apartmentFilter;
      setActiveThreadAptId(targetApt);
    } else {
      setShowRentModal(true);
    }
  };

  const primaryActionLabel =
    activeSection === 'expenses'
      ? 'Ajouter une charge'
      : activeSection === 'documents'
        ? 'Importer un document'
        : activeSection === 'messages'
          ? 'Contacter un locataire'
          : 'Enregistrer un loyer';

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        pendingPaymentsCount={pendingPaymentsCount}
        expiringDocsCount={expiringDocsCount}
        unreadMessagesCount={unreadMessagesCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onResetDemoData={handleResetDemoData}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-400 hidden sm:inline">Patrimoine</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h1 className="font-display font-semibold text-slate-900 truncate">
                {SECTION_TITLES[activeSection]}
              </h1>
            </div>
          </div>

          {activeSection !== 'messages' && (
            <button
              type="button"
              onClick={primaryAction}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{primaryActionLabel}</span>
            </button>
          )}
        </header>

        {/* Workspace Toolbar: Apartment Scope Switcher */}
        <div className="px-4 sm:px-8 pt-6 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-7xl w-full mx-auto">
          <div
            className="inline-flex items-center gap-1 p-1 bg-slate-200/75 rounded-lg self-start overflow-x-auto max-w-full"
            role="group"
            aria-label="Filtrer par appartement"
          >
            <button
              type="button"
              onClick={() => setApartmentFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                apartmentFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous les biens ({apartments.length})
            </button>
            {apartments.map((apt) => (
              <button
                key={apt.id}
                type="button"
                onClick={() => {
                  setApartmentFilter(apt.id);
                  setActiveThreadAptId(apt.id);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  apartmentFilter === apt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {apt.shortName}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500">
            Exercice 2026 · Devise : Franc CFA (FCFA)
          </div>
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
          {activeSection === 'overview' && (
            <OverviewView
              apartments={scopedApartments}
              allApartments={apartments}
              payments={scopedPayments}
              expenses={scopedExpenses}
              documents={scopedDocuments}
              messages={scopedMessages}
              onMarkPaid={handleMarkPaid}
              onNavigate={setActiveSection}
              onSelectApartmentFilter={setApartmentFilter}
              onPreviewDocument={setPreviewDoc}
              onContactTenant={handleContactTenant}
            />
          )}

          {activeSection === 'apartments' && (
            <ApartmentsView
              apartments={scopedApartments}
              payments={payments}
              expenses={expenses}
              documents={documents}
              onEditApartment={setEditingApartment}
              onContactTenant={handleContactTenant}
            />
          )}

          {activeSection === 'revenues' && (
            <RevenuesView
              payments={scopedPayments}
              apartments={apartments}
              onMarkPaid={handleMarkPaid}
              onAddPayment={() => setShowRentModal(true)}
              onDeletePayment={handleDeletePayment}
              onOpenQuittance={setQuittancePayment}
            />
          )}

          {activeSection === 'expenses' && (
            <ExpensesView
              expenses={scopedExpenses}
              apartments={apartments}
              onAddExpense={() =>
                setExpenseModalState({ open: true, editing: null })
              }
              onEditExpense={(exp) =>
                setExpenseModalState({ open: true, editing: exp })
              }
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeSection === 'documents' && (
            <DocumentsView
              documents={scopedDocuments}
              apartments={scopedApartments}
              allApartments={apartments}
              onUploadModalOpen={(aptId) =>
                setUploadModalState({
                  open: true,
                  apartmentId:
                    aptId ??
                    (apartmentFilter === 'all' ? undefined : apartmentFilter),
                })
              }
              onQuickFileDrop={(file, aptId) =>
                setUploadModalState({
                  open: true,
                  apartmentId: aptId,
                  file,
                })
              }
              onPreviewDocument={setPreviewDoc}
              onDownloadDocument={handleDownloadDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {activeSection === 'messages' && (
            <MessagesView
              apartments={scopedApartments}
              messages={messages}
              documents={documents}
              selectedApartmentId={activeThreadAptId}
              onSelectApartmentId={setActiveThreadAptId}
              onSendMessage={handleSendMessage}
              onMarkThreadRead={handleMarkThreadRead}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {showRentModal && (
        <RentPaymentModal
          apartments={apartments}
          defaultApartmentId={
            apartmentFilter === 'all' ? undefined : apartmentFilter
          }
          onSave={handleSavePayment}
          onClose={() => setShowRentModal(false)}
        />
      )}

      {expenseModalState.open && (
        <ExpenseModal
          apartments={apartments}
          initialExpense={expenseModalState.editing}
          defaultApartmentId={
            apartmentFilter === 'all' ? undefined : apartmentFilter
          }
          onSave={handleSaveExpense}
          onClose={() => setExpenseModalState({ open: false, editing: null })}
        />
      )}

      {uploadModalState.open && (
        <DocumentUploadModal
          apartments={apartments}
          preselectedApartmentId={uploadModalState.apartmentId}
          initialFile={uploadModalState.file}
          onSave={handleSaveDocument}
          onClose={() => setUploadModalState({ open: false })}
        />
      )}

      {editingApartment && (
        <ApartmentEditModal
          apartment={editingApartment}
          onSave={handleSaveApartment}
          onClose={() => setEditingApartment(null)}
        />
      )}

      {quittancePayment && (
        <QuittanceModal
          payment={quittancePayment}
          apartment={
            apartments.find((a) => a.id === quittancePayment.apartmentId) ??
            apartments[0]
          }
          ownerName={OWNER_NAME}
          onClose={() => setQuittancePayment(null)}
        />
      )}

      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          apartment={apartments.find((a) => a.id === previewDoc.apartmentId)}
          onDownload={handleDownloadDocument}
          onUpdateStatus={handleUpdateDocStatus}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
