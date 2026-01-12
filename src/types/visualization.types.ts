export interface ChartConfig {
  type: 'line' | 'bar' | 'radar' | 'scatter';
  data: any[];
  options: any;
}

export interface VisualizationOptions {
  colors: string[];
  height: number;
  width: number;
}

export {};