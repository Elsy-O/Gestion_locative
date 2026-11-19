import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  Eye,
  FileText,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  Apartment,
  DocumentCategory,
  DocumentStatus,
  TenantDocument,
} from '../types';
import { formatDateFR, formatFileSize } from '../utils/formatters';

interface DocumentsViewProps {
  documents: TenantDocument[];
  apartments: Apartment[];
  allApartments: Apartment[];
  onUploadModalOpen: (preselectedApartmentId?: string) => void;
  onQuickFileDrop: (file: File, apartmentId: string) => void;
  onPreviewDocument: (doc: TenantDocument) => void;
  onDownloadDocument: (doc: TenantDocument) => void;
  onDeleteDocument: (docId: string) => void;
}

const DOC_CATEGORIES: DocumentCategory[] = [
  'Bail',
  'État des lieux',
  'Assurance habitation',
  'Identité & Revenus',
  'Diagnostics',
  'Quittance',
];

const REQUIRED_DOSSIER_CATS: DocumentCategory[] = [
  'Bail',
  'État des lieux',
  'Assurance habitation',
  'Identité & Revenus',
  'Diagnostics',
];

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  apartments,
  allApartments,
  onUploadModalOpen,
  onQuickFileDrop,
  onPreviewDocument,
  onDownloadDocument,
  onDeleteDocument,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | DocumentCategory>(
    'all',
  );
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>(
    'all',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const filteredDocs = useMemo(() => {
    return [...documents]
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
      .filter((doc) => {
        if (categoryFilter !== 'all' && doc.category !== categoryFilter)
          return false;
        if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
        if (!searchQuery.trim()) return true;
        const apt = allApartments.find((a) => a.id === doc.apartmentId);
        const hay = `${doc.title} ${doc.fileName} ${doc.category} ${
          apt?.shortName ?? ''
        } ${apt?.tenant.fullName ?? ''}`.toLowerCase();
        return hay.includes(searchQuery.trim().toLowerCase());
      });
  }, [documents, allApartments, categoryFilter, statusFilter, searchQuery]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const targetAptId = apartments[0]?.id ?? allApartments[0]?.id;
      if (targetAptId) {
        onQuickFileDrop(file, targetAptId);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Completeness checklist across visible apartments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {apartments.map((apt) => {
          const aptDocs = [...documents]
            .filter((d) => d.apartmentId === apt.id)
            .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
          return (
            <section
              key={apt.id}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Dossier — {apt.shortName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Locataire : {apt.tenant.fullName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUploadModalOpen(apt.id)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter une pièce
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {REQUIRED_DOSSIER_CATS.map((cat) => {
                  const matching = aptDocs.filter((d) => d.category === cat);
                  const latest = matching[0];
                  const latestNeedsRenewal = latest && latest.status !== 'valid';

                  return (
                    <div
                      key={cat}
                      className="py-2.5 flex items-center justify-between gap-3"
                    >
                      <span className="text-slate-700 font-medium">{cat}</span>
                      {matching.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => onUploadModalOpen(apt.id)}
                          className="text-red-700 font-medium hover:underline"
                        >
                          Manquant — Importer
                        </button>
                      ) : latestNeedsRenewal ? (
                        <button
                          type="button"
                          onClick={() => onPreviewDocument(latest)}
                          className="inline-flex items-center gap-1 text-amber-700 font-medium hover:underline"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          À renouveler ({formatDateFR(latest.expiresAt)})
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => latest && onPreviewDocument(latest)}
                          className="inline-flex items-center gap-1 text-emerald-700 font-medium hover:underline"
                        >
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          Valide ({matching.length})
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Drag & drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border border-dashed rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors ${
          isDragging
            ? 'border-emerald-700 bg-emerald-50/50'
            : 'border-slate-300 bg-white'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900">
              Importer un document locataire (PDF, JPG, PNG)
            </div>
            <div className="text-xs text-slate-500">
              Glissez-déposez un fichier ici ou utilisez le bouton pour l’archiver dans le coffre local du navigateur.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onUploadModalOpen()}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          Importer un document
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            {(
              [
                { id: 'all', label: 'Tous' },
                { id: 'valid', label: 'Valides' },
                { id: 'expiring', label: 'À renouveler' },
                { id: 'expired', label: 'Expirés' },
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

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'all' | DocumentCategory)
            }
            aria-label="Filtrer par type de document"
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">Toutes les pièces</option>
            {DOC_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="relative lg:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un fichier, locataire..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Documents List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <FileText className="h-6 w-6 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900">
              Aucun document trouvé
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Importez une attestation d’assurance, un bail ou un justificatif.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Bien &amp; Locataire</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Ajouté / Échéance</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDocs.map((doc) => {
                  const apt = allApartments.find(
                    (a) => a.id === doc.apartmentId,
                  );
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onPreviewDocument(doc)}
                          className="text-left group"
                        >
                          <div className="font-medium text-slate-900 group-hover:text-emerald-800 transition-colors">
                            {doc.title}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {doc.fileName} · {formatFileSize(doc.fileSizeBytes)}
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 text-xs">
                          {apt?.shortName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {apt?.tenant.fullName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {doc.category}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600 tabular-nums whitespace-nowrap">
                        <div>{formatDateFR(doc.uploadedAt)}</div>
                        {doc.expiresAt && (
                          <div className="text-slate-500">
                            exp. {formatDateFR(doc.expiresAt)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {doc.status === 'valid' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <Check className="h-3.5 w-3.5" />
                            Valide
                          </span>
                        )}
                        {doc.status === 'expiring' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            À renouveler
                          </span>
                        )}
                        {doc.status === 'expired' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Expiré
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onPreviewDocument(doc)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md transition-colors"
                            aria-label="Aperçu du document"
                            title="Aperçu"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDownloadDocument(doc)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md transition-colors"
                            aria-label="Télécharger le document"
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDocument(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-700 rounded-md transition-colors"
                            aria-label="Supprimer le document"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
