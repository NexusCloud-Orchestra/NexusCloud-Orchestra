import React, { useState, useEffect } from 'react';
import { CloudProviderConnection } from '../../services/dashboard.service';
import { PieChart } from 'lucide-react';

interface StorageDistributionDonutProps {
  connections: CloudProviderConnection[];
}

export const StorageDistributionDonut: React.FC<StorageDistributionDonutProps> = ({
  connections,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const totalBytes =
    connections.reduce((acc, c) => acc + c.quotaUsedBytes, 0) || 1;

  // Executive cohesive palette
  const sliceColors = [
    '#0F172A', // Slate 900
    '#2563EB', // Blue 600
    '#0284C7', // Sky 600
    '#0D9488', // Teal 600
    '#64748B', // Slate 500
  ];

  let cumulativeAngle = 0;
  const radius = 68;
  const strokeWidth = 14;
  const center = 85;
  const circumference = 2 * Math.PI * radius;

  const slices = connections.map((c, i) => {
    const fraction = c.quotaUsedBytes / totalBytes;
    const percentage = Math.round(fraction * 100);
    const strokeDasharray = `${
      animated ? fraction * circumference : 0
    } ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;

    return {
      ...c,
      percentage,
      color: sliceColors[i % sliceColors.length],
      strokeDasharray,
      strokeDashoffset,
      gbUsed: (c.quotaUsedBytes / (1024 * 1024 * 1024)).toFixed(1),
    };
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Storage Distribution</h3>
            <p className="text-[11px] text-slate-500">Capacity share across active clouds</p>
          </div>
        </div>
        <span className="text-xs font-mono font-medium text-slate-900">
          {(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB Total
        </span>
      </div>

      {/* Thin-Ring Donut Visualization & Clean Legend */}
      <div className="my-3 flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* SVG Donut */}
        <div className="relative w-44 h-44 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 170 170">
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />
            {slices.map((slice, idx) => (
              <circle
                key={slice.id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={hoveredIdx === idx ? strokeWidth + 2 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>

          {/* Center Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
            {hoveredIdx !== null ? (
              <>
                <span className="text-[10px] font-medium text-slate-500 truncate max-w-[90px]">
                  {slices[hoveredIdx].name.split(' ')[0]}
                </span>
                <span className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                  {slices[hoveredIdx].percentage}%
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {slices[hoveredIdx].gbUsed} GB
                </span>
              </>
            ) : (
              <>
                <span className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                  {(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  Total Allocated
                </span>
              </>
            )}
          </div>
        </div>

        {/* Clean Provider Legend */}
        <div className="flex-1 w-full space-y-1.5">
          {slices.map((slice, idx) => (
            <div
              key={slice.id}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                hoveredIdx === idx ? 'bg-slate-100' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="font-medium text-slate-900">
                  {slice.name.split(' ')[0]}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 font-mono">
                  {slice.gbUsed} GB
                </span>
                <span className="font-mono font-semibold text-slate-900 w-8 text-right">
                  {slice.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
