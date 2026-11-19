import { Apartment, RentPayment } from '../types';

export const formatCFA = (value: number): string => {
  const rounded = Math.round(value);
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(rounded);
  return `${formatted} FCFA`;
};

export const formatCompactCFA = (value: number): string => {
  const rounded = Math.round(value);
  if (Math.abs(rounded) >= 1_000_000) {
    const millions = (rounded / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${millions} M FCFA`;
  }
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(rounded);
  return `${formatted} F`;
};

export const formatDateFR = (isoDate?: string): string => {
  if (!isoDate) return '—';
  const normalized = isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

export const formatDateTimeFR = (isoDateTime?: string): string => {
  if (!isoDateTime) return '—';
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) return isoDateTime;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

export const formatMonthLabel = (periodYYYYMM: string): string => {
  const [year, month] = periodYYYYMM.split('-').map(Number);
  if (!year || !month) return periodYYYYMM;
  const date = new Date(year, month - 1, 1);
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
};

export const exportToCSV = (
  filename: string,
  headers: string[],
  rows: (string | number | boolean | undefined)[][],
): void => {
  const escapeCell = (cell: string | number | boolean | undefined) => {
    const str = cell === undefined || cell === null ? '' : String(cell);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csvContent = [
    headers.map(escapeCell).join(';'),
    ...rows.map((row) => row.map(escapeCell).join(';')),
  ].join('\n');

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadQuittanceHTML = (
  payment: RentPayment,
  apartment: Apartment,
  ownerName: string,
): void => {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Quittance de loyer - ${payment.periodLabel}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; max-width: 720px; margin: 40px auto; padding: 32px; line-height: 1.5; }
    h1 { font-size: 22px; margin-bottom: 4px; letter-spacing: -0.02em; }
    .sub { color: #64748b; font-size: 13px; margin-bottom: 28px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .total { font-weight: 700; font-size: 15px; background: #f8fafc; }
    .legal { margin-top: 28px; font-size: 12px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    .sig { margin-top: 32px; text-align: right; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Quittance de loyer — ${payment.periodLabel}</h1>
  <div class="sub">Référence ${payment.receiptNumber || `Q-${payment.period}`} · Émise le ${formatDateFR(new Date().toISOString().slice(0, 10))}</div>
  <div class="grid">
    <div>
      <div class="label">Bailleur</div>
      <strong>${ownerName}</strong><br/>
      Propriétaire bailleur
    </div>
    <div>
      <div class="label">Locataire</div>
      <strong>${apartment.tenant.fullName}</strong><br/>
      ${apartment.address}<br/>
      ${apartment.postalCity}
    </div>
  </div>
  <p>Je soussigné(e) <strong>${ownerName}</strong>, propriétaire du logement désigné ci-dessus (${apartment.typology} · ${apartment.surfaceM2} m²), déclare avoir reçu de <strong>${apartment.tenant.fullName}</strong> la somme de <strong>${formatCFA(payment.totalAmount)}</strong> au titre du paiement du loyer et des charges pour la période de <strong>${payment.periodLabel}</strong>.</p>
  <table>
    <thead>
      <tr>
        <th>Désignation</th>
        <th class="num">Montant</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Loyer principal (hors charges)</td>
        <td class="num">${formatCFA(payment.rentHC)}</td>
      </tr>
      <tr>
        <td>Provision pour charges récupérables</td>
        <td class="num">${formatCFA(payment.chargesProvision)}</td>
      </tr>
      <tr class="total">
        <td>Total encaissé (${payment.paymentMethod})</td>
        <td class="num">${formatCFA(payment.totalAmount)}</td>
      </tr>
    </tbody>
  </table>
  <div class="legal">
    Quittance délivrée pour servir et valoir ce que de droit. Ce reçu annule tous les reçus qui auraient pu être établis précédemment en cas de paiement partiel du terme.
  </div>
  <div class="sig">
    Date de règlement : <strong>${formatDateFR(payment.paidDate || payment.dueDate)}</strong><br/><br/>
    Signature du bailleur : <em>${ownerName}</em>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Quittance_${apartment.shortName.replace(/\s+/g, '_')}_${payment.period}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
