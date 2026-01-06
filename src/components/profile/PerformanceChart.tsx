'use client';

import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { UserGameResult } from '@/types';

interface PerformanceChartProps {
  gameResults: UserGameResult[];
}

type ChartView = 'session' | 'cumulative';

export function PerformanceChart({ gameResults }: PerformanceChartProps) {
  const [view, setView] = useState<ChartView>('session');

  // Sort by date ascending for proper cumulative calculation
  const sortedResults = [...gameResults].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  // Calculate cumulative earnings
  let cumulative = 0;
  const dataWithCumulative = sortedResults.map((result) => {
    cumulative += result.net_profit_loss;
    return {
      ...result,
      cumulative,
    };
  });

  // Take last 12 sessions for display
  const displayData = dataWithCumulative.slice(-12);

  if (displayData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="text-center">
          <span className="text-4xl">📊</span>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            No game data yet. Play some games to see your performance!
          </p>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions
  const sessionValues = displayData.map((d) => d.net_profit_loss);
  const cumulativeValues = displayData.map((d) => d.cumulative);
  
  const maxSession = Math.max(...sessionValues, 0);
  const minSession = Math.min(...sessionValues, 0);
  const sessionRange = maxSession - minSession || 1;
  
  const maxCumulative = Math.max(...cumulativeValues, 0);
  const minCumulative = Math.min(...cumulativeValues, 0);
  const cumulativeRange = maxCumulative - minCumulative || 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      {/* Header with toggle */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Performance
        </h3>
        
        <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setView('session')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'session'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Per Session
          </button>
          <button
            onClick={() => setView('cumulative')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'cumulative'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Cumulative
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48 sm:h-64">
        {view === 'session' ? (
          <SessionBarChart 
            data={displayData} 
            maxValue={maxSession}
            minValue={minSession}
            range={sessionRange}
          />
        ) : (
          <CumulativeLineChart 
            data={displayData}
            maxValue={maxCumulative}
            minValue={minCumulative}
            range={cumulativeRange}
          />
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-emerald-500" />
          Profit
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-red-500" />
          Loss
        </span>
      </div>
    </div>
  );
}

interface ChartData {
  event_date: string;
  event_title: string;
  net_profit_loss: number;
  cumulative: number;
}

interface SessionBarChartProps {
  data: ChartData[];
  maxValue: number;
  minValue: number;
  range: number;
}

function SessionBarChart({ data, maxValue, minValue, range }: SessionBarChartProps) {
  const chartHeight = 200;
  const zeroLine = maxValue / range;

  return (
    <div className="flex h-full items-end gap-1 sm:gap-2">
      {data.map((item, index) => {
        const isPositive = item.net_profit_loss >= 0;
        const absValue = Math.abs(item.net_profit_loss);
        const heightPercent = (absValue / range) * 100;
        
        return (
          <div
            key={`${item.event_date}-${index}`}
            className="group relative flex flex-1 flex-col"
            style={{ height: '100%' }}
          >
            {/* Bar container */}
            <div 
              className="relative flex-1"
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: isPositive ? 'flex-end' : 'flex-start',
                paddingTop: isPositive ? `${(1 - zeroLine) * 100}%` : 0,
                paddingBottom: !isPositive ? `${zeroLine * 100}%` : 0,
              }}
            >
              {/* Zero line reference */}
              <div 
                className="absolute left-0 right-0 border-t border-slate-300 dark:border-slate-600"
                style={{ top: `${(1 - zeroLine) * 100}%` }}
              />
              
              {/* Bar */}
              <div
                className={`relative w-full rounded-t-sm transition-all duration-300 ${
                  isPositive 
                    ? 'bg-emerald-500 hover:bg-emerald-400' 
                    : 'rounded-b-sm rounded-t-none bg-red-500 hover:bg-red-400'
                }`}
                style={{ 
                  height: `${heightPercent}%`,
                  minHeight: absValue > 0 ? '4px' : '0',
                }}
              />
            </div>

            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity group-hover:opacity-100">
              <div className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-slate-700">
                <p className="font-medium">{item.event_title}</p>
                <p className="text-slate-300">
                  {formatDate(item.event_date, { month: 'short', day: 'numeric' })}
                </p>
                <p className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                  {isPositive ? '+' : ''}{formatCurrency(item.net_profit_loss)}
                </p>
              </div>
            </div>

            {/* Date label */}
            <div className="mt-2 text-center text-[10px] text-slate-400 sm:text-xs">
              {formatDate(item.event_date, { month: 'short', day: 'numeric' }).split(' ')[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface CumulativeLineChartProps {
  data: ChartData[];
  maxValue: number;
  minValue: number;
  range: number;
}

function CumulativeLineChart({ data, maxValue, minValue, range }: CumulativeLineChartProps) {
  const width = 100;
  const height = 100;
  const padding = 5;
  
  // Calculate points
  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (width - padding * 2);
    const y = padding + ((maxValue - item.cumulative) / range) * (height - padding * 2);
    return { x, y, ...item };
  });

  // Create path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Area path (for gradient fill)
  const zeroY = padding + ((maxValue - 0) / range) * (height - padding * 2);
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${zeroY} L ${points[0]?.x ?? 0} ${zeroY} Z`;

  // Determine if overall positive or negative
  const finalValue = points[points.length - 1]?.cumulative ?? 0;
  const isPositive = finalValue >= 0;

  return (
    <div className="relative h-full w-full">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop 
              offset="0%" 
              stopColor={isPositive ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'} 
              stopOpacity="0.3" 
            />
            <stop 
              offset="100%" 
              stopColor={isPositive ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'} 
              stopOpacity="0" 
            />
          </linearGradient>
        </defs>

        {/* Zero line */}
        <line
          x1={padding}
          y1={zeroY}
          x2={width - padding}
          y2={zeroY}
          stroke="currentColor"
          strokeWidth="0.3"
          className="text-slate-300 dark:text-slate-600"
          strokeDasharray="2 2"
        />

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={isPositive ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <g key={index} className="group">
            <circle
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill={point.cumulative >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
              className="transition-all hover:r-[2.5]"
            />
          </g>
        ))}
      </svg>

      {/* Hover tooltips (positioned absolutely) */}
      <div className="absolute inset-0">
        {points.map((point, index) => (
          <div
            key={index}
            className="group absolute"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="h-6 w-6 cursor-pointer" />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity group-hover:opacity-100">
              <div className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-slate-700">
                <p className="font-medium">{point.event_title}</p>
                <p className="text-slate-300">
                  {formatDate(point.event_date, { month: 'short', day: 'numeric' })}
                </p>
                <p className={point.cumulative >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  Total: {point.cumulative >= 0 ? '+' : ''}{formatCurrency(point.cumulative)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 flex h-full flex-col justify-between py-1 text-[10px] text-slate-400">
        <span>{formatCurrency(maxValue)}</span>
        <span>{formatCurrency(minValue)}</span>
      </div>
    </div>
  );
}

