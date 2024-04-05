exports.binaryUnits = () => {
  return ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
};

exports.metricUnits = () => {
  return ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
};

exports.isMetricUnit = (unit) => {
  return this.metricUnits().indexOf(unit);
};

exports.isBinaryUnit = (unit) => {
  return this.binaryUnits().indexOf(unit);
};

exports.fromBytes = (bytes, options = {}) => {
  const { useBinaryUnits = false, decimals = 2 } = options;

  if (decimals < 0) {
    throw new Error(`Invalid decimals ${decimals}`);
  }

  const base = useBinaryUnits ? 1024 : 1000;
  const units = useBinaryUnits ? this.binaryUnits() : this.metricUnits();

  const i = Math.floor(Math.log(bytes) / Math.log(base));

  return `${(bytes / Math.pow(base, i)).toFixed(decimals)} ${units[i]}`;
};

exports.toBytes = (value, unit) => {
  if (this.isMetricUnit(unit) >= 0) {
    const index = this.isMetricUnit(unit);

    const bytes = Math.pow(10, index * 3) * value;

    return bytes;
  } else if (this.isBinaryUnit(unit) >= 0) {
    const index = this.isBinaryUnit(unit);

    const bytes = Math.pow(2, index * 10) * value;

    return bytes;
  } else {
    throw new Error(`Invalid unit ${unit}`);
  }
};
