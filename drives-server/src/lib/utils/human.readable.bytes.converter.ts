// human.readable.bytes.converter.ts
export const binaryUnits = (): string[] => {
  return ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
};

export const metricUnits = (): string[] => {
  return ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
};

export const isMetricUnit = (unit: string): number => {
  return metricUnits().indexOf(unit);
};

export const isBinaryUnit = (unit: string): number => {
  return binaryUnits().indexOf(unit);
};

export const fromBytes = (
  bytes: number,
  options: { useBinaryUnits?: boolean; decimals?: number } = {},
): string => {
  const { useBinaryUnits = false, decimals = 2 } = options;

  if (decimals < 0) {
    throw new Error(`Invalid decimals ${decimals}`);
  }

  const base = useBinaryUnits ? 1024 : 1000;
  const units = useBinaryUnits ? binaryUnits() : metricUnits();

  const i = Math.floor(Math.log(bytes) / Math.log(base));

  return `${(bytes / Math.pow(base, i)).toFixed(decimals)} ${units[i]}`;
};

export const toBytes = (value: number, unit: string): number => {
  if (isMetricUnit(unit) >= 0) {
    const index = isMetricUnit(unit);

    const bytes = Math.pow(10, index * 3) * value;

    return bytes;
  } else if (isBinaryUnit(unit) >= 0) {
    const index = isBinaryUnit(unit);

    const bytes = Math.pow(2, index * 10) * value;

    return bytes;
  } else {
    throw new Error(`Invalid unit ${unit}`);
  }
};
