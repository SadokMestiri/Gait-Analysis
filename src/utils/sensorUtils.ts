export const normalizeSensorData = (data: number[]): number[] => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  return data.map(value => (value - min) / (max - min || 1));
};

export const filterNoise = (data: number[], threshold = 0.1): number[] => {
  return data.map(value => Math.abs(value) < threshold ? 0 : value);
};

export {};