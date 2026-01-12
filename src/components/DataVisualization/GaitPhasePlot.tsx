import React from 'react';
import { GaitAnalysis } from '../../types/gait.types';

interface GaitPhasePlotProps {
  analysis: GaitAnalysis;
  title?: string;
}

export const GaitPhasePlot: React.FC<GaitPhasePlotProps> = ({
  analysis,
  title = 'Gait Phase Analysis',
}) => {
  // Create simple donut chart data
  const gaitPhases = [
    { name: 'Stance', value: analysis.gaitPhases.stancePhase, color: '#3B82F6' },
    { name: 'Swing', value: analysis.gaitPhases.swingPhase, color: '#10B981' },
    { name: 'Double Support', value: analysis.gaitPhases.doubleSupport, color: '#F59E0B' },
  ];

  const metrics = [
    { name: 'Symmetry', value: analysis.symmetryIndex, unit: '%', optimal: '>85%' },
    { name: 'Deviation', value: analysis.gaitDeviationIndex, unit: '', optimal: '<15' },
    { name: 'Cadence', value: analysis.stepMetrics.cadence, unit: 'steps/min', optimal: '90-120' },
    { name: 'Velocity', value: analysis.stepMetrics.velocity, unit: 'm/s', optimal: '1.0-1.5' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow space-y-8">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">{title}</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gait Phase Visualization */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Gait Phase Distribution
          </h4>
          
          {/* Custom Donut Chart */}
          <div className="relative h-64">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                  {analysis.gaitPhases.stancePhase + analysis.gaitPhases.swingPhase}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Gait Cycle</div>
              </div>
            </div>
            
            <div className="h-full w-full rounded-full"
              style={{
                background: `conic-gradient(
                  ${gaitPhases[0].color} 0% ${gaitPhases[0].value}%,
                  ${gaitPhases[1].color} ${gaitPhases[0].value}% ${gaitPhases[0].value + gaitPhases[1].value}%,
                  ${gaitPhases[2].color} ${gaitPhases[0].value + gaitPhases[1].value}% 100%
                )`
              }}
            />
          </div>
          
          {/* Legend */}
          <div className="space-y-2">
            {gaitPhases.map((phase, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: phase.color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{phase.name}</span>
                </div>
                <span className="font-medium">{phase.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Performance Metrics
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric, index) => {
              const isHealthy = 
                (metric.name === 'Symmetry' && metric.value > 85) ||
                (metric.name === 'Deviation' && metric.value < 15) ||
                (metric.name === 'Cadence' && metric.value >= 90 && metric.value <= 120) ||
                (metric.name === 'Velocity' && metric.value >= 1.0 && metric.value <= 1.5);
              
              return (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isHealthy 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {metric.name}
                  </div>
                  <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                    {metric.value.toFixed(metric.name === 'Velocity' ? 2 : 0)}{metric.unit}
                  </div>
                  <div className="text-xs text-gray-500">
                    Optimal: {metric.optimal}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step Metrics */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Step Analysis</h5>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Step Length</span>
                  <span className="font-medium">{analysis.stepMetrics.stepLength.toFixed(2)} m</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(analysis.stepMetrics.stepLength / 0.8) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Step Time</span>
                  <span className="font-medium">{analysis.stepMetrics.stepTime.toFixed(2)} s</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(analysis.stepMetrics.stepTime / 0.7) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};