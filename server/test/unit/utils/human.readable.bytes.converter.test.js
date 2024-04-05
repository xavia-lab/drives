const collect = require("collect.js");

const BytesConverter = require("../../../src/utils/human.readable.bytes.converter");

describe("Human Readable Bytes Converter Tests", () => {
  describe("isMetricUnit", () => {
    test("given unit, check if it is of type metric", () => {
      const metricUnits = BytesConverter.metricUnits();

      metricUnits.forEach(function (value, i) {
        expect(BytesConverter.isMetricUnit(value)).toBe(i);
      });
    });

    test("given unit, return -1 if it is not of type metric", () => {
      const collection = collect(BytesConverter.binaryUnits());
      collection.shift();
      const binaryUnits = collection.all();

      binaryUnits.forEach(function (value, i) {
        expect(BytesConverter.isMetricUnit(value)).toBe(-1);
      });
    });
  });

  describe("isBinaryUnit", () => {
    test("given unit, check if it is of type binay", () => {
      const binarayUnits = BytesConverter.binaryUnits();

      binarayUnits.forEach(function (value, i) {
        expect(BytesConverter.isBinaryUnit(value)).toBe(i);
      });
    });

    test("given unit, return -1 if it is not of type binary", () => {
      const collection = collect(BytesConverter.metricUnits());
      collection.shift();
      const metricUnits = collection.all();

      metricUnits.forEach(function (value, i) {
        expect(BytesConverter.isBinaryUnit(value)).toBe(-1);
      });
    });
  });

  describe("fromBytes", () => {
    describe("default conversion", () => {
      test("given value in bytes, convert to appropriate human readable value in metric units", () => {
        const base = 10;
        const expectedResults = [
          "1.00 Bytes",
          "10.00 Bytes",
          "100.00 Bytes",
          "1.00 KB",
          "10.00 KB",
          "100.00 KB",
          "1.00 MB",
          "10.00 MB",
          "100.00 MB",
          "1.00 GB",
          "10.00 GB",
          "100.00 GB",
          "1.00 TB",
          "10.00 TB",
          "100.00 TB",
          "1.00 PB",
          "10.00 PB",
          "100.00 PB",
        ];

        expectedResults.forEach(function (value, i) {
          expect(BytesConverter.fromBytes(Math.pow(base, i))).toBe(value);
        });
      });
    });

    describe("conversion to binary units", () => {
      test("given value in bytes, convert to appropriate human readable value in binaray units", () => {
        const base = 2;
        const expectedResults = [
          "1 Bytes",
          "1 KiB",
          "1 MiB",
          "1 GiB",
          "1 TiB",
          "1 PiB",
          "1 EiB",
          "1 ZiB",
          "1 YiB",
        ];

        expectedResults.forEach(function (value, i) {
          expect(
            BytesConverter.fromBytes(Math.pow(base, i * 10), {
              useBinaryUnits: true,
              decimals: 0,
            }),
          ).toBe(value);
        });
      });
    });

    describe("toBytes", () => {
      test("given value and unit, convert metric to bytes", () => {
        expect(BytesConverter.toBytes(100, "Bytes")).toBe(
          100 * Math.pow(10, 0),
        );
        expect(BytesConverter.toBytes(100, "Bytes")).toBe(
          100 * Math.pow(10, 0),
        );
        expect(BytesConverter.toBytes(100, "KB")).toBe(100 * Math.pow(10, 3));
        expect(BytesConverter.toBytes(100, "MB")).toBe(100 * Math.pow(10, 6));
        expect(BytesConverter.toBytes(100, "GB")).toBe(100 * Math.pow(10, 9));
        expect(BytesConverter.toBytes(100, "TB")).toBe(100 * Math.pow(10, 12));
        expect(BytesConverter.toBytes(100, "PB")).toBe(100 * Math.pow(10, 15));
      });

      test("given value and unit, convert binary to bytes", () => {
        expect(BytesConverter.toBytes(100, "Bytes")).toBe(
          100 * Math.pow(10, 0),
        );
        expect(BytesConverter.toBytes(100, "Bytes")).toBe(100 * Math.pow(2, 0));
        expect(BytesConverter.toBytes(100, "KiB")).toBe(100 * Math.pow(2, 10));
        expect(BytesConverter.toBytes(100, "MiB")).toBe(100 * Math.pow(2, 20));
        expect(BytesConverter.toBytes(100, "GiB")).toBe(100 * Math.pow(2, 30));
        expect(BytesConverter.toBytes(100, "TiB")).toBe(100 * Math.pow(2, 40));
        expect(BytesConverter.toBytes(100, "PiB")).toBe(100 * Math.pow(2, 50));
      });
    });
  });
});
