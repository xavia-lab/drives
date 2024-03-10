exports.isEmpty = (value) => {
  return (
    value == null || (typeof value === "string" && value.trim().length === 0)
  );
};

exports.isNotEmpty = (value) => {
  return !this.isEmpty(value);
};
