// objects.util.ts
export const isEmpty = (value: any): boolean => {
  return (
    value == null || (typeof value === 'string' && value.trim().length === 0)
  );
};

export const isNotEmpty = (value: any): boolean => {
  return !isEmpty(value);
};

export const isObjectEmpty = (objectName: object): boolean => {
  return JSON.stringify(objectName) === '{}';
};

export const isObjectNotEmpty = (objectName: object): boolean => {
  return !isObjectEmpty(objectName);
};
