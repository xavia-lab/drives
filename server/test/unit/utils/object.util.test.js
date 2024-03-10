const Objects = require("../../../src/utils/objects.util");

describe("Object Handler Tests", () => {
  describe("isEmpty", () => {
    test("given value, check if it is not empty", () => {
      expect(Objects.isEmpty("cat")).toBeFalsy; // false
      expect(Objects.isEmpty(1)).toBeFalsy; // false
      expect(Objects.isEmpty([])).toBeFalsy; // false
      expect(Objects.isEmpty({})).toBeFalsy; // false
      expect(Objects.isEmpty(false)).toBeFalsy; // false
      expect(Objects.isEmpty(0)).toBeFalsy; // false
      expect(Objects.isEmpty(-0)).toBeFalsy; // false
      expect(Objects.isEmpty(NaN)).toBeFalsy; // false
    });

    test("given value, check if it is empty", () => {
      expect(Objects.isEmpty("")).toBeTruthy; // true
      expect(Objects.isEmpty("    ")).toBeTruthy; // true
      expect(Objects.isEmpty(null)).toBeTruthy; // true
      expect(Objects.isEmpty(undefined)).toBeTruthy; // true
    });
  });

  describe("isNotEmpty", () => {
    test("given value, check if it is not empty", () => {
      expect(Objects.isNotEmpty("cat")).toBeTruthy;
      expect(Objects.isNotEmpty(1)).toBeTruthy;
      expect(Objects.isNotEmpty([])).toBeTruthy;
      expect(Objects.isNotEmpty({})).toBeTruthy;
      expect(Objects.isNotEmpty(false)).toBeTruthy;
      expect(Objects.isNotEmpty(0)).toBeTruthy;
      expect(Objects.isNotEmpty(-0)).toBeTruthy;
      expect(Objects.isNotEmpty(NaN)).toBeTruthy;
    });

    test("given value, check if it is empty", () => {
      expect(Objects.isNotEmpty("")).toBeFalsy;
      expect(Objects.isNotEmpty("    ")).toBeFalsy;
      expect(Objects.isNotEmpty(null)).toBeFalsy;
      expect(Objects.isNotEmpty(undefined)).toBeFalsy;
    });
  });
});
