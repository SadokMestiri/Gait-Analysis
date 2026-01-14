import React, { useState, useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { UplotService } from '../../services/uplotService';
import { GaitAnalysis } from '../../types/gait.types';
import { useGaitAnalysis } from '../../hooks/useGaitAnalysis';

interface ComparisonChartProps {
  currentAnalysis: GaitAnalysis;
  patientId: string;
  title?: string;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  currentAnalysis,
  patientId,
  title = 'Comparative Analysis',
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);
  const { getPatientAnalyses } = useGaitAnalysis();
  const [patientAnalyses, setPatientAnalyses] = useState<GaitAnalysis[]>([]);

  useEffect(() => {
    const analyses = getPatientAnalyses(patientId);
    setPatientAnalyses(analyses);
  }, [patientId, getPatientAnalyses]);

  // Comparison data - simple format
  const comparisonData = [
    {
      metric: 'Symmetry',
      patient: currentAnalysis.symmetryIndex,
      average: 90,
      healthyMin: 85,
      healthyMax: 100,
      unit: '%',
    },
    {
      metric: 'Deviation',
      patient: currentAnalysis.gaitDeviationIndex,
      average: 15,
      healthyMin: 0,
      healthyMax: 20,
      unit: '',
    },
    {
      metric: 'Cadence',
      patient: currentAnalysis.stepMetrics.cadence,
      average: 105,
      healthyMin: 90,
      healthyMax: 120,
      unit: 'steps/min',
    },
    {
      metric: 'Velocity',
      patient: currentAnalysis.stepMetrics.velocity,
      average: 1.2,
      healthyMin: 1.0,
      healthyMax: 1.5,
      unit: 'm/s',
    },
    {
      metric: 'Step Length',
      patient: currentAnalysis.stepMetrics.stepLength,
      average: 0.7,
      healthyMin: 0.6,
      healthyMax: 0.8,
      unit: 'm',
    },
  ];

  useEffect(() => {
    if (!chartRef.current) return;

    // Prepare data
    const indices = comparisonData.map((_, i) => i);
    const patientValues = comparisonData.map(d => d.patient);
    const averageValues = comparisonData.map(d => d.average);

    const data: uPlot.AlignedData = [indices, patientValues, averageValues];

    // Create options
    const opts = UplotService.createBarChartOptions(
      chartRef.current.clientWidth || 600,
      320,
      undefined,
      'Metric',
      'Value'
    );

    // Patient series (bars)
    opts.series!.push({
      label: 'Patient',
      stroke: '#3B82F6',
      width: 0,
      fill: '#3B82F680',
      paths: (u: uPlot, seriesIdx: number, idx0: number, idx1: number) => {
        const { ctx } = u;
        const yData = u.data[seriesIdx];
        const xData = u.data[0];
        const barWidth = 0.2;
        const offset = -0.15;
        
        ctx.fillStyle = '#3B82F680';
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        
        for (let i = idx0; i <= idx1; i++) {
          const xVal = xData[i];
          const yVal = yData[i];
          
          if (xVal != null && yVal != null) {
            const xPos = u.valToPos(xVal + offset - barWidth / 2, 'x', true);
            const xPosEnd = u.valToPos(xVal + offset + barWidth / 2, 'x', true);
            const yPos = u.valToPos(yVal, 'y', true);
            const yPosBase = u.valToPos(0, 'y', true);
            
            ctx.beginPath();
            ctx.roundRect(xPos, yPos, xPosEnd - xPos, yPosBase - yPos, 4);
            ctx.fill();
            ctx.stroke();
          }
        }
        
        return null;
      },
    });

    // Average series (bars)
    opts.series!.push({
      label: 'Population Average',
      stroke: '#6B7280',
      width: 0,
      fill: '#6B728080',
      paths: (u: uPlot, seriesIdx: number, idx0: number, idx1: number) => {
        const { ctx } = u;
        const yData = u.data[seriesIdx];
        const xData = u.data[0];
        const barWidth = 0.2;
        const offset = 0.15;
        
        ctx.fillStyle = '#6B728080';
        ctx.strokeStyle = '#6B7280';
        ctx.lineWidth = 2;
        
        for (let i = idx0; i <= idx1; i++) {
          const xVal = xData[i];
          const yVal = yData[i];
          
          if (xVal != null && yVal != null) {
            const xPos = u.valToPos(xVal + offset - barWidth / 2, 'x', true);
            const xPosEnd = u.valToPos(xVal + offset + barWidth / 2, 'x', true);
            const yPos = u.valToPos(yVal, 'y', true);
            const yPosBase = u.valToPos(0, 'y', true);
            
            ctx.beginPath();
            ctx.roundRect(xPos, yPos, xPosEnd - xPos, yPosBase - yPos, 4);
            ctx.fill();
            ctx.stroke();
          }
        }
        
        return null;
      },
    });

    // Custom X axis labels
    opts.axes![0].values = (u, vals) => vals.map(v => comparisonData[v]?.metric || '');

    // Destroy previous chart
    if (uplotRef.current) {
      uplotRef.current.destroy();
    }

    // Create chart
    const u = new uPlot(opts, data, chartRef.current);
    uplotRef.current = u;

    return () => {
      if (uplotRef.current) {
        uplotRef.current.destroy();
        uplotRef.current = null;
      }
    };
  }, [currentAnalysis]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow space-y-8">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">{title}</h3>

      {/* Bar Chart */}
      <div
        ref={chartRef}
        className="w-full rounded-lg overflow-hidden"
        style={{ height: '320px' }}
      />

      {/* Health Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {comparisonData.map((item, index) => {
          const isHealthy = item.patient >= item.healthyMin && item.patient <= item.healthyMax;
          
          return (
            <div 
              key={index}
              className={`p-4 rounded-lg ${
                isHealthy 
                  ? 'bg-green-50 dark:bg-green-900/20' 
                  : 'bg-red-50 dark:bg-red-900/20'
              }`}
            >
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {item.metric}
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 my-2">
                {item.patient.toFixed(item.metric === 'Velocity' || item.metric === 'Step Length' ? 2 : 0)}
                {item.unit}
              </div>
              <div className={`text-xs font-medium ${
                isHealthy ? 'text-green-600' : 'text-red-600'
              }`}>
                {isHealthy ? '✓ Within Normal Range' : '✗ Outside Normal Range'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Normal: {item.healthyMin}-{item.healthyMax}{item.unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Session Comparison (if available) */}
      {patientAnalyses.length > 1 && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Progress Across Sessions
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Symmetry</th>
                  <th className="px-4 py-3">Deviation</th>
                  <th className="px-4 py-3">Cadence</th>
                  <th className="px-4 py-3">Velocity</th>
                </tr>
              </thead>
              <tbody>
                {patientAnalyses.map((analysis, idx) => (
                  <tr key={idx} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      Session {idx + 1}
                    </td>
                    <td className="px-4 py-3">{analysis.symmetryIndex.toFixed(0)}%</td>
                    <td className="px-4 py-3">{analysis.gaitDeviationIndex.toFixed(1)}</td>
                    <td className="px-4 py-3">{analysis.stepMetrics.cadence.toFixed(0)}</td>
                    <td className="px-4 py-3">{analysis.stepMetrics.velocity.toFixed(2)} m/s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};