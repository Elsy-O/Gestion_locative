import React, { useState } from 'react';
import { formatCFA, formatCompactCFA } from '../utils/formatters';

export interface MonthlyPoint {
  period: string;
  shortLabel: string;
  fullLabel: string;
  revenues: number;
  expenses: number;
  net: number;
}

interface CashflowChartProps {
  data: MonthlyPoint[];
}

export const CashflowChart: React.FC<CashflowChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(
    100000,
    ...data.map((d) => Math.max(d.revenues, d.expenses)),
  );
  const step = maxVal > 500000 ? 250000 : maxVal > 100000 ? 50000 : 25000;
  const yCeiling = Math.ceil(maxVal / step) * step;

  const width = 760;
  const height = 270;
  const padLeft = 86;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(yCeiling * t));

  const slotW = plotW / Math.max(1, data.length);
  const barW = Math.min(18, Math.max(8, slotW * 0.28));

  const yForValue = (val: number) => {
    const clamped = Math.max(0, Math.min(yCeiling, val));
    return padTop + plotH - (clamped / yCeiling) * plotH;
  };

  const netLinePoints = data
    .map((d, i) => {
      const cx = padLeft + i * slotW + slotW / 2;
      const cy = yForValue(Math.max(0, d.net));
      return `${cx},${cy}`;
    })
    .join(' ');

  const activePoint =
    hoveredIdx !== null ? data[hoveredIdx] : data[data.length - 1];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Flux de trésorerie mensuels (2026)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparatif des loyers encaissés, des charges payées et du solde net en FCFA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-xs bg-slate-900 inline-block" />
            Loyers encaissés
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-xs bg-amber-600 inline-block" />
            Charges décaissées
          </span>
          <span className="flex items-center gap-2">
            <span className="h-0.5 w-4 bg-emerald-700 inline-block" />
            Revenu net
          </span>
        </div>
      </div>

      {activePoint && (
        <div className="mt-4 mb-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-4 py-2.5">
          <span className="font-medium text-slate-900">
            {activePoint.fullLabel}
          </span>
          <div className="flex flex-wrap items-center gap-5 font-mono tabular-nums">
            <span>
              Revenus :{' '}
              <strong className="text-slate-900">
                {formatCFA(activePoint.revenues)}
              </strong>
            </span>
            <span>
              Charges :{' '}
              <strong className="text-amber-800">
                {formatCFA(activePoint.expenses)}
              </strong>
            </span>
            <span>
              Net :{' '}
              <strong
                className={
                  activePoint.net >= 0 ? 'text-emerald-700' : 'text-red-700'
                }
              >
                {formatCFA(activePoint.net)}
              </strong>
            </span>
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[540px]"
          role="img"
          aria-label="Graphique des revenus et charges mensuels 2026 en FCFA"
        >
          {ticks.map((tick) => {
            const y = yForValue(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[10.5px] font-mono tabular-nums"
                >
                  {formatCompactCFA(tick)}
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const slotX = padLeft + i * slotW;
            const centerX = slotX + slotW / 2;
            const revY = yForValue(d.revenues);
            const revH = padTop + plotH - revY;
            const expY = yForValue(d.expenses);
            const expH = padTop + plotH - expY;
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={d.period}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={slotX + 2}
                  y={padTop}
                  width={Math.max(1, slotW - 4)}
                  height={plotH}
                  fill={isHovered ? '#F1F5F9' : 'transparent'}
                  rx={4}
                />
                <rect
                  x={centerX - barW - 2}
                  y={revY}
                  width={barW}
                  height={Math.max(0, revH)}
                  rx={2}
                  fill="#0F172A"
                />
                <rect
                  x={centerX + 2}
                  y={expY}
                  width={barW}
                  height={Math.max(0, expH)}
                  rx={2}
                  fill="#D97706"
                />
                <text
                  x={centerX}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[11px] ${
                    isHovered
                      ? 'fill-slate-900 font-semibold'
                      : 'fill-slate-500'
                  }`}
                >
                  {d.shortLabel}
                </text>
              </g>
            );
          })}

          {data.length > 1 && (
            <polyline
              fill="none"
              stroke="#15803D"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={netLinePoints}
            />
          )}

          {data.map((d, i) => {
            const cx = padLeft + i * slotW + slotW / 2;
            const cy = yForValue(Math.max(0, d.net));
            const isHovered = hoveredIdx === i;
            return (
              <circle
                key={`pt-${d.period}`}
                cx={cx}
                cy={cy}
                r={isHovered ? 4.5 : 3}
                fill="#FFFFFF"
                stroke="#15803D"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};
