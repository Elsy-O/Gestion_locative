import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCheck, Paperclip, Send } from 'lucide-react';
import {
  Apartment,
  InternalMessage,
  MessageSender,
  MessageTopic,
  TenantDocument,
} from '../types';
import { formatCFA, formatDateTimeFR } from '../utils/formatters';

interface MessagesViewProps {
  apartments: Apartment[];
  messages: InternalMessage[];
  documents: TenantDocument[];
  selectedApartmentId: string;
  onSelectApartmentId: (id: string) => void;
  onSendMessage: (payload: {
    apartmentId: string;
    sender: MessageSender;
    topic: MessageTopic;
    body: string;
    attachmentLabel?: string;
  }) => void;
  onMarkThreadRead: (apartmentId: string) => void;
}

const TOPICS: MessageTopic[] = [
  'Général',
  'Loyer & Quittance',
  'Documents',
  'Travaux & Entretien',
];

export const MessagesView: React.FC<MessagesViewProps> = ({
  apartments,
  messages,
  documents,
  selectedApartmentId,
  onSelectApartmentId,
  onSendMessage,
  onMarkThreadRead,
}) => {
  const activeApt =
    apartments.find((a) => a.id === selectedApartmentId) ?? apartments[0];

  const [topic, setTopic] = useState<MessageTopic>('Général');
  const [body, setBody] = useState('');
  const [attachmentLabel, setAttachmentLabel] = useState('');
  const [senderMode, setSenderMode] = useState<MessageSender>('manager');
  const endOfListRef = useRef<HTMLDivElement | null>(null);

  const threadMessages = useMemo(() => {
    if (!activeApt) return [];
    return messages
      .filter((m) => m.apartmentId === activeApt.id)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  }, [messages, activeApt]);

  const aptDocs = useMemo(() => {
    if (!activeApt) return [];
    return documents.filter((d) => d.apartmentId === activeApt.id);
  }, [documents, activeApt]);

  useEffect(() => {
    if (activeApt) {
      const hasUnread = messages.some(
        (m) => m.apartmentId === activeApt.id && m.sender === 'tenant' && !m.read,
      );
      if (hasUnread) {
        onMarkThreadRead(activeApt.id);
      }
    }
  }, [activeApt, messages, onMarkThreadRead]);

  useEffect(() => {
    endOfListRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages.length, activeApt?.id]);

  if (!activeApt) return null;

  const quickTemplates: { label: string; topic: MessageTopic; text: string }[] = [
    {
      label: 'Relance loyer',
      topic: 'Loyer & Quittance',
      text: `Bonjour ${activeApt.tenant.fullName}, sauf erreur de notre part, le règlement du loyer de ${formatCFA(
        activeApt.rentHC + activeApt.chargesProvision,
      )} est toujours en attente. Merci de nous confirmer la date de virement.`,
    },
    {
      label: 'Rappel assurance',
      topic: 'Documents',
      text: `Bonjour ${activeApt.tenant.fullName}, pourriez-vous nous transmettre votre nouvelle attestation d’assurance habitation pour ${activeApt.shortName} afin de maintenir votre dossier locatif à jour ?`,
    },
    {
      label: 'Confirmation quittance',
      topic: 'Loyer & Quittance',
      text: `Bonjour ${activeApt.tenant.fullName}, nous confirmons la bonne réception de votre loyer de ${formatCFA(
        activeApt.rentHC + activeApt.chargesProvision,
      )}. Votre quittance est disponible.`,
    },
    {
      label: 'Intervention technique',
      topic: 'Travaux & Entretien',
      text: `Bonjour ${activeApt.tenant.fullName}, un technicien doit intervenir prochainement pour l’entretien courant du logement (${activeApt.shortName}). Quelles sont vos disponibilités cette semaine ?`,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    onSendMessage({
      apartmentId: activeApt.id,
      sender: senderMode,
      topic,
      body: body.trim(),
      attachmentLabel: attachmentLabel || undefined,
    });
    setBody('');
    setAttachmentLabel('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
      {/* Left Conversation List */}
      <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">
            Conversations locataires
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Échanges archivés par appartement
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {apartments.map((apt) => {
            const aptMsgs = messages
              .filter((m) => m.apartmentId === apt.id)
              .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
            const lastMsg = aptMsgs[0];
            const unreadCount = aptMsgs.filter(
              (m) => m.sender === 'tenant' && !m.read,
            ).length;
            const isSelected = apt.id === activeApt.id;

            return (
              <button
                key={apt.id}
                type="button"
                onClick={() => onSelectApartmentId(apt.id)}
                className={`w-full text-left p-4 transition-colors flex items-start justify-between gap-3 ${
                  isSelected ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {apt.tenant.fullName}
                    </span>
                    {lastMsg && (
                      <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
                        {formatDateTimeFR(lastMsg.sentAt)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    {apt.shortName} · {apt.typology}
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                    {lastMsg
                      ? `${lastMsg.sender === 'manager' ? 'Vous : ' : ''}${lastMsg.body}`
                      : 'Aucun message échangé pour le moment.'}
                  </p>
                </div>

                {unreadCount > 0 && (
                  <span className="font-mono text-xs font-semibold text-emerald-800 shrink-0">
                    {unreadCount} non lu
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Active Thread */}
      <section className="lg:col-span-8 flex flex-col justify-between bg-slate-50/40">
        {/* Thread Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {activeApt.tenant.fullName}
            </h3>
            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
              <span>{activeApt.address}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {activeApt.tenant.phone}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeApt.tenant.email}</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setSenderMode('manager')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                senderMode === 'manager'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Écrire (Gestionnaire)
            </button>
            <button
              type="button"
              onClick={() => setSenderMode('tenant')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                senderMode === 'tenant'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Simuler réponse locataire
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[420px]">
          {threadMessages.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Aucun échange enregistré avec {activeApt.tenant.fullName}. Utilisez un modèle ci-dessous ou rédigez un message.
            </div>
          ) : (
            threadMessages.map((msg) => {
              const isManager = msg.sender === 'manager';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isManager ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                    <span className="font-medium text-slate-700">
                      {msg.senderName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{msg.topic}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatDateTimeFR(msg.sentAt)}
                    </span>
                  </div>

                  <div
                    className={`max-w-xl rounded-xl px-4 py-3 text-sm leading-relaxed border ${
                      isManager
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-800 border-slate-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                    {msg.attachmentLabel && (
                      <div
                        className={`mt-2.5 pt-2 border-t text-xs flex items-center gap-1.5 font-mono ${
                          isManager
                            ? 'border-slate-700 text-emerald-300'
                            : 'border-slate-100 text-emerald-800'
                        }`}
                      >
                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                        <span>{msg.attachmentLabel}</span>
                      </div>
                    )}
                  </div>

                  {isManager && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <CheckCheck className="h-3 w-3" />
                      Transmis dans l’espace locataire
                    </span>
                  )}
                </div>
              );
            })
          )}
          <div ref={endOfListRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 bg-white border-t border-slate-200 space-y-3"
        >
          {/* Quick templates */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500">Modèles :</span>
            {quickTemplates.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => {
                  setTopic(tpl.topic);
                  setBody(tpl.text);
                  setSenderMode('manager');
                }}
                className="px-2.5 py-1 text-xs border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                {tpl.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value as MessageTopic)}
              aria-label="Sujet du message"
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  Sujet : {t}
                </option>
              ))}
            </select>

            <select
              value={attachmentLabel}
              onChange={(e) => setAttachmentLabel(e.target.value)}
              aria-label="Joindre un document du dossier"
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="">Sans pièce jointe</option>
              {aptDocs.map((d) => (
                <option key={d.id} value={d.fileName}>
                  Joindre : {d.fileName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <textarea
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                senderMode === 'manager'
                  ? `Écrire un message à ${activeApt.tenant.fullName}...`
                  : `Saisir une réponse simulée de ${activeApt.tenant.fullName}...`
              }
              className="flex-1 px-3.5 py-2 text-sm border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 resize-none"
              required
            />
            <button
              type="submit"
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap self-end sm:self-stretch"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{senderMode === 'manager' ? 'Envoyer' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
