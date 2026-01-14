import React, { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { UplotService } from '../../services/uplotService';
import { GaitAnalysis } from '../../types/gait.types';

interface RangeOfMotionProps {
  analysis: GaitAnalysis;
  title?: string;
  height?: number;
}

export const RangeOfMotion: React.FC<RangeOfMotionProps> = ({
  analysis,
  title = 'Range of Motion Analysis',
  height = 400,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);

  const romData = [
    { joint: 'Hip Flexion', value: analysis.rangeOfMotion.hipFlexion, normalRange: [40, 120] },
    { joint: 'Hip Extension', value: Math.abs(analysis.rangeOfMotion.hipExtension), normalRange: [0, 30] },
    { joint: 'Knee Flexion', value: analysis.rangeOfMotion.kneeFlexion, normalRange: [0, 135] },
    { joint: 'Knee Extension', value: Math.abs(analysis.rangeOfMotion.kneeExtension), normalRange: [0, 10] },
    { joint: 'Ankle DF', value: analysis.rangeOfMotion.ankleDorsiflexion, normalRange: [10, 30] },
    { joint: 'Ankle PF', value: Math.abs(analysis.rangeOfMotion.anklePlantarflexion), normalRange: [20, 50] },
  ];

  const getColor = (value: number, normalRange: number[]) => {
    const [min, max] = normalRange;
    if (value >= min && value <= max) return '#10B981'; // Green - normal
    if (value < min * 0.8 || value > max * 1.2) return '#EF4444'; // Red - abnormal
    return '#F59E0B'; // Yellow - borderline
  };

  const getRomStatus = (value: number, normalRange: number[]) => {
    const [min, max] = normalRange;
    if (value >= min && value <= max) return 'Normal';
    if (value < min) return 'Limited';
    return 'Excessive';
  };

  useEffect(() => {
    if (!chartRef.current) return;

    // Prepare data for uplot
    const indices = romData.map((_, i) => i);
    const values = romData.map(d => d.value);

    const data: uPlot.AlignedData = [indices, values];

    // Create options
    const opts = UplotService.createBarChartOptions(
      chartRef.current.clientWidth || 600,
      300,
      undefined,
      'Joint Movement',
      'Degrees (°)'
    );

    // Custom bar renderer
    opts.series!.push({
      label: 'ROM',
      stroke: '#3B82F6',
      width: 0,
      fill: '#3B82F680',
      paths: (u: uPlot, seriesIdx: number, idx0: number, idx1: number) => {
        const { ctx } = u;
        const yData = u.data[seriesIdx];
        const xData = u.data[0];
        const barWidth = 0.35;
        
        for (let i = idx0; i <= idx1; i++) {
          const xVal = xData[i];
          const yVal = yData[i];
          
          if (xVal != null && yVal != null) {
            const color = getColor(yVal as number, romData[i].normalRange);
            const xPos = u.valToPos(xVal - barWidth, 'x', true);
            const xPosEnd = u.valToPos(xVal + barWidth, 'x', true);
            const yPos = u.valToPos(yVal, 'y', true);
            const yPosBase = u.valToPos(0, 'y', true);
            
            ctx.fillStyle = color + '80';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(xPos, yPos, xPosEnd - xPos, yPosBase - yPos);
            ctx.fill();
            ctx.stroke();
          }
        }
        
        return null;
      },
    });

    // Custom X axis labels
    opts.axes![0].values = (u, vals) => vals.map(v => romData[v]?.joint || '');

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
  }, [analysis]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6">{title}</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div>
          <div
            ref={chartRef}
            className="w-full rounded-lg overflow-hidden"
            style={{ height: '300px' }}
          />
        </div>

        {/* ROM Table */}
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Joint Movement</th>
                  <th className="px-4 py-3">Measured</th>
                  <th className="px-4 py-3">Normal Range</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {romData.map((item, index) => (
                  <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {item.joint}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {item.value.toFixed(1)}°
                    </td>
                    <td className="px-4 py-3">
                      {item.normalRange[0]}° - {item.normalRange[1]}°
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getRomStatus(item.value, item.normalRange) === 'Normal'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : getRomStatus(item.value, item.normalRange) === 'Limited'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {getRomStatus(item.value, item.normalRange)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              ROM Summary
            </h4>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Normal</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Limited</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Excessive</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};