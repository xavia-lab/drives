exports.isEmpty = (value) => {
  return (
    value == null || (typeof value === "string" && value.trim().length === 0)
  );
};

exports.isNotEmpty = (value) => {
  return !this.isEmpty(value);
};

exports.isObjectEmpty = (objectName) => {
  return JSON.stringify(objectName) === "{}";
};

exports.isObjectNotEmpty = (objectName) => {
  return !this.isObjectEmpty(objectName);
};
