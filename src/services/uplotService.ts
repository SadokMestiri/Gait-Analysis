import uPlot from 'uplot';

export interface UplotSeriesConfig {
  label: string;
  stroke: string;
  width?: number;
}

// Tooltip element management
let tooltipEl: HTMLDivElement | null = null;

function getTooltip(): HTMLDivElement {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'uplot-tooltip';
    tooltipEl.style.display = 'none';
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

export class UplotService {
  /**
   * Create tooltip plugin for uPlot
   */
  static createTooltipPlugin(): uPlot.Plugin {
    return {
      hooks: {
        setCursor: (u: uPlot) => {
          const tooltip = getTooltip();
          const { left, top, idx } = u.cursor;
          
          if (idx == null || left == null || top == null || left < 0 || top < 0) {
            tooltip.style.display = 'none';
            return;
          }

          const xVal = u.data[0][idx];
          if (xVal == null) {
            tooltip.style.display = 'none';
            return;
          }

          let html = `<div class="tooltip-title">Time: ${xVal.toFixed(3)}s</div>`;
          
          for (let i = 1; i < u.series.length; i++) {
            const series = u.series[i];
            if (!series.show) continue;
            
            const yVal = u.data[i]?.[idx];
            if (yVal == null) continue;
            
            const color = typeof series.stroke === 'function' 
              ? series.stroke(u, i) 
              : series.stroke;
            
            html += `
              <div class="tooltip-row">
                <span>
                  <span class="tooltip-marker" style="background: ${color}"></span>
                  <span class="tooltip-label">${series.label || `Series ${i}`}</span>
                </span>
                <span class="tooltip-value">${yVal.toFixed(4)}</span>
              </div>
            `;
          }

          tooltip.innerHTML = html;
          tooltip.style.display = 'block';

          // Position tooltip
          const rect = u.root.getBoundingClientRect();
          const tooltipRect = tooltip.getBoundingClientRect();
          
          let tooltipLeft = rect.left + left + 15;
          let tooltipTop = rect.top + top - tooltipRect.height / 2;
          
          // Keep tooltip within viewport
          if (tooltipLeft + tooltipRect.width > window.innerWidth - 10) {
            tooltipLeft = rect.left + left - tooltipRect.width - 15;
          }
          if (tooltipTop < 10) {
            tooltipTop = 10;
          }
          if (tooltipTop + tooltipRect.height > window.innerHeight - 10) {
            tooltipTop = window.innerHeight - tooltipRect.height - 10;
          }

          tooltip.style.left = tooltipLeft + 'px';
          tooltip.style.top = tooltipTop + 'px';
        },
      },
    };
  }

  /**
   * Add double-click to reset zoom functionality
   */
  static addResetZoom(chart: uPlot, originalData: uPlot.AlignedData): void {
    chart.root.addEventListener('dblclick', () => {
      const xMin = originalData[0][0];
      const xMax = originalData[0][originalData[0].length - 1];
      chart.setScale('x', { min: xMin, max: xMax });
    });
  }

  /**
   * Create uplot options for IMU acceleration/gyroscope charts
   */
  static createIMUChartOptions(
    width: number = 800,
    height: number = 300,
    title?: string
  ): uPlot.Options {
    return {
      title: title,
      class: 'uplot-imu-chart',
      width,
      height,
      plugins: [UplotService.createTooltipPlugin()],
      cursor: {
        lock: true,
        drag: {
          setScale: true,
          x: true,
          y: true,
        },
        sync: {
          key: null,
          setSeries: true,
        },
        points: {
          show: true,
          size: (u, seriesIdx) => {
            return seriesIdx === 0 ? 0 : 8;
          },
          fill: (u, seriesIdx) => {
            return u.series[seriesIdx].stroke as string || '#fff';
          },
        },
      },
      scales: {
        x: {
          time: false, // Disable time-based formatting
          range: (u, dataMin, dataMax) => {
            return [dataMin, dataMax];
          },
        },
        y: {
          range: (u, dataMin, dataMax) => {
            let padding = (dataMax - dataMin) * 0.1;
            return [dataMin - padding, dataMax + padding];
          },
        },
      },
      axes: [
        {
          stroke: '#6b7280',
          grid: { stroke: '#e5e7eb', width: 1 },
          ticks: { stroke: '#d1d5db', width: 1 },
          label: 'Time (s)',
          labelSize: 30,
          size: 50,
          values: (u: uPlot, vals: number[]) => vals.map(v => v.toFixed(2)),
        },
        {
          stroke: '#6b7280',
          grid: { stroke: '#e5e7eb', width: 1 },
          ticks: { stroke: '#d1d5db', width: 1 },
          label: 'Value (g / °/s)',
          labelSize: 60,
          size: 60,
        },
      ],
      series: [
        {
          label: 'Time',
        },
      ],
      legend: {
        show: true,
        live: true,
        isolate: true,
      },
    };
  }

  /**
   * Create options for bar-style charts (using paths instead of lines)
   */
  static createBarChartOptions(
    width: number = 800,
    height: number = 300,
    title?: string,
    xAxisLabel: string = 'Category',
    yAxisLabel: string = 'Value'
  ): uPlot.Options {
    return {
      title: title,
      class: 'uplot-bar-chart',
      width,
      height,
      plugins: [UplotService.createTooltipPlugin()],
      cursor: {
        lock: true,
        drag: {
          setScale: true,
          x: true,
          y: true,
        },
        points: {
          show: true,
          size: 8,
        },
      },
      scales: {
        x: {
          time: false,
          range: (u, dataMin, dataMax) => [dataMin - 0.5, dataMax + 0.5],
        },
        y: {
          range: (u, dataMin, dataMax) => {
            let padding = Math.max((dataMax - dataMin) * 0.1, 1);
            return [Math.min(0, dataMin - padding), dataMax + padding];
          },
        },
      },
      axes: [
        {
          stroke: '#6b7280',
          grid: { stroke: '#e5e7eb', width: 1 },
          ticks: { stroke: '#d1d5db', width: 1 },
          label: xAxisLabel,
          labelSize: 30,
          size: 50,
          values: (u: uPlot, vals: number[]) => vals.map(v => v.toFixed(0)),
        },
        {
          stroke: '#6b7280',
          grid: { stroke: '#e5e7eb', width: 1 },
          ticks: { stroke: '#d1d5db', width: 1 },
          label: yAxisLabel,
          labelSize: 60,
          size: 60,
        },
      ],
      series: [
        {
          label: 'Index',
        },
      ],
      legend: {
        show: true,
        live: true,
      },
    };
  }

  /**
   * Create options for area/fill charts
   */
  static createAreaChartOptions(
    width: number = 800,
    height: number = 300,
    title?: string,
    xAxisLabel: string = 'X',
    yAxisLabel: string = 'Value'
  ): uPlot.Options {
    return {
      title: title,
      class: 'uplot-area-chart',
      width,
      height,
      plugins: [UplotService.createTooltipPlugin()],
      cursor: {
        lock: true,
        drag: {
          setScale: true,
          x: true,
          y: true,
        },
        points: {
          show: true,
          size: 8,
        },
      },
      scales: {
        x: {
          time: false,
          range: (u, dataMin, dataMax) => [dataMin, dataMax],
        },
        y: {
          range: (u, dataMin, dataMax) => {
            let padding = (dataMax - dataMin) * 0.1;
            return [Math.min(0, dataMin - padding), dataMax + padding];
          },
        },
      },
      axes: [
        {
          stroke: '#6b7280',
          grid: { stroke: '#e5e7eb', width: 1 },
          ticks: { stroke: '#d1d5db', width: 1 },
          label: xAxisLabel,
          labelSize: 30,
          size: 50,
          values: (u: uPlot, vals: number[]) => vals.map(v => v.toFixed(0)),
        },
        {
          stroke: '#6b7280',
          grid: { stroke: '#e5e7eb', width: 1 },
          ticks: { stroke: '#d1d5db', width: 1 },
          label: yAxisLabel,
          labelSize: 60,
          size: 60,
        },
      ],
      series: [
        {
          label: 'X',
        },
      ],
      legend: {
        show: true,
        live: true,
      },
    };
  }

  /**
   * Create options for results/gait phase charts
   */
  static createResultsChartOptions(
    width: number = 800,
    height: number = 500,
    title?: string,
    yAxisLabel: string = 'Value'
  ): uPlot.Options {
    return {
      title: title,
      class: 'uplot-results-chart',
      width,
      height,
      plugins: [UplotService.createTooltipPlugin()],
      cursor: {
        lock: true,
        drag: {
          setScale: true,
          x: true,
          y: true,
        },
        points: {
          show: true,
          size: 8,
        },
      },
      scales: {
        x: {
          time: false,
          range: (u, dataMin, dataMax) => [dataMin, dataMax],
        },
        y: {
          range: (u, dataMin, dataMax) => {
            let padding = (dataMax - dataMin) * 0.1;
            return [dataMin - padding, dataMax + padding];
          },
        },
      },
      axes: [
        {
          stroke: '#6b7280',
          grid: { stroke: '#e5e7eb', width: 1 },
          ticks: { stroke: '#d1d5db', width: 1 },
          label: 'Normalized Gait Cycle Phase (0-1)',
          labelSize: 30,
          size: 50,
          values: (u: uPlot, vals: number[]) => vals.map(v => v.toFixed(2)),
        },
        {
          stroke: '#6b7280',
          grid: { stroke: '#e5e7eb', width: 1 },
          ticks: { stroke: '#d1d5db', width: 1 },
          label: yAxisLabel,
          labelSize: 60,
          size: 60,
        },
      ],
      series: [
        {
          label: 'Phase',
        },
      ],
      legend: {
        show: true,
        live: true,
        isolate: true,
      },
    };
  }

  /**
   * Create a bar-style series (uses filled paths)
   */
  static createBarSeries(label: string, color: string): uPlot.Series {
    return {
      label,
      stroke: color,
      width: 0,
      fill: color + '80', // Add transparency
      paths: (u: uPlot, seriesIdx: number, idx0: number, idx1: number) => {
        const { ctx } = u;
        const data = u.data[seriesIdx];
        const xData = u.data[0];
        const barWidth = 0.4;
        
        ctx.beginPath();
        
        for (let i = idx0; i <= idx1; i++) {
          const xVal = xData[i];
          const yVal = data[i];
          
          if (xVal != null && yVal != null) {
            const xPos = u.valToPos(xVal - barWidth / 2, 'x', true);
            const xPosEnd = u.valToPos(xVal + barWidth / 2, 'x', true);
            const yPos = u.valToPos(yVal, 'y', true);
            const yPosBase = u.valToPos(0, 'y', true);
            
            ctx.rect(xPos, yPos, xPosEnd - xPos, yPosBase - yPos);
          }
        }
        
        return null;
      },
      value: (u, v) => (v == null ? '-' : v.toFixed(2)),
    };
  }

  /**
   * Create an area/filled series
   */
  static createAreaSeries(label: string, strokeColor: string, fillColor?: string): uPlot.Series {
    return {
      label,
      stroke: strokeColor,
      width: 2,
      fill: fillColor || strokeColor + '40',
      value: (u, v) => (v == null ? '-' : v.toFixed(3)),
    };
  }

  /**
   * Create a line series with custom styling
   */
  static createLineSeries(
    label: string,
    color: string,
    width: number = 2,
    opacity: number = 1
  ): uPlot.Series {
    const strokeColor = opacity < 1 
      ? color + Math.round(opacity * 255).toString(16).padStart(2, '0')
      : color;
    
    return {
      label,
      stroke: strokeColor,
      width,
      value: (u, v) => (v == null ? '-' : v.toFixed(4)),
    };
  }

  /**
   * Create series configuration for acceleration/gyroscope axes
   */
  static createAxisSeries(axis: 'x' | 'y' | 'z', isAcceleration: boolean = true): uPlot.Series {
    const colors: Record<string, string> = {
      x: '#EF4444', // Red
      y: '#10B981', // Green
      z: '#3B82F6', // Blue
    };

    const axisLabel = isAcceleration
      ? `${axis.toUpperCase()} Acceleration (g)`
      : `${axis.toUpperCase()} Gyroscope (°/s)`;

    return {
      label: axisLabel,
      stroke: colors[axis],
      width: 2,
      value: (u, v) => (v == null ? '-' : v.toFixed(4)),
    };
  }

  /**
   * Create multi-IMU chart options
   */
  static createMultiIMUChartOptions(
    width: number = 800,
    height: number = 400,
    title: string = 'Multi-IMU Sensor Data'
  ): uPlot.Options {
    return {
      title,
      class: 'uplot-multi-imu-chart',
      width,
      height,
      cursor: {
        lock: true,
        drag: {
          setScale: true,
          x: true,
          y: false,
        },
        sync: {
          key: null,
          setSeries: true,
        },
        points: {
          show: true,
        },
      },
      scales: {
        x: {
          range: (u, dataMin, dataMax) => [dataMin, dataMax],
        },
        y: {
          range: (u, dataMin, dataMax) => {
            let padding = (dataMax - dataMin) * 0.1;
            return [dataMin - padding, dataMax + padding];
          },
        },
      },
      axes: [
        {
          label: 'Time (s)',
          labelSize: 30,
          size: 50,
        },
        {
          label: 'Sensor Value',
          labelSize: 60,
          size: 60,
        },
      ],
      series: [
        {
          label: 'Time',
        },
      ],
      legend: {
        show: true,
        live: true,
        isolate: true,
      },
    };
  }

  /**
   * Create IMU series with custom colors
   */
  static createIMUSeries(
    imuKey: string,
    axis: 'x' | 'y' | 'z',
    type: 'acc' | 'gyro'
  ): uPlot.Series {
    const imuColorMap: Record<string, Record<string, string>> = {
      IMU0: {
        acc: '#EF4444',
        gyro: '#F59E0B',
      },
      IMU1: {
        acc: '#10B981',
        gyro: '#3B82F6',
      },
      IMU2: {
        acc: '#8B5CF6',
        gyro: '#EC4899',
      },
    };

    const axisColors: Record<string, string> = {
      x: '#FF6B6B',
      y: '#4ECDC4',
      z: '#45B7D1',
    };

    const baseColor = imuColorMap[imuKey]?.[type] || '#9CA3AF';
    const typeLabel = type === 'acc' ? 'Acc' : 'Gyro';
    const axisLabel = axis.toUpperCase();

    return {
      label: `${imuKey} ${typeLabel} ${axisLabel}`,
      stroke: baseColor,
      width: 1.5,
      value: (u, v) => (v == null ? '-' : v.toFixed(3)),
    };
  }

  /**
   * Prepare data for uplot format (array of arrays)
   */
  static prepareChartData(
    timestamps: number[],
    dataSeries: Record<string, number[]>
  ): uPlot.AlignedData {
    const numPoints = timestamps.length;
    const series: any[] = [timestamps];

    // Add each data series
    const seriesKeys = Object.keys(dataSeries);
    for (const key of seriesKeys) {
      const data = dataSeries[key];
      const paddedData = new Array(numPoints);
      for (let i = 0; i < numPoints; i++) {
        paddedData[i] = i < data.length ? data[i] : null;
      }
      series.push(paddedData);
    }

    return series;
  }

  /**
   * Update chart with new data while maintaining scroll position
   */
  static updateChartData(
    u: uPlot,
    newData: any[]
  ): void {
    u.setData(newData);
  }
}
