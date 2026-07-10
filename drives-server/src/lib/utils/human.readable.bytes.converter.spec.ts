// src/utils/human.readable.bytes.converter.spec.ts
import collect from 'collect.js';
import {
  binaryUnits,
  metricUnits,
  isMetricUnit,
  isBinaryUnit,
  fromBytes,
  toBytes,
} from './human.readable.bytes.converter';

describe('Human Readable Bytes Converter Tests', () => {
  describe('isMetricUnit', () => {
    test('should return index for metric units', () => {
      const units = metricUnits();
      units.forEach((value, i) => {
        expect(isMetricUnit(value)).toBe(i);
      });
    });

    test('should return -1 for non-metric units', () => {
      const collection = collect(binaryUnits());
      collection.shift(); // Remove 'Bytes' as it's common
      const nonMetric = collection.all();
      nonMetric.forEach((value) => {
        expect(isMetricUnit(value)).toBe(-1);
      });
    });
  });

  describe('isBinaryUnit', () => {
    test('should return index for binary units', () => {
      const units = binaryUnits();
      units.forEach((value, i) => {
        expect(isBinaryUnit(value)).toBe(i);
      });
    });

    test('should return -1 for non-binary units', () => {
      const collection = collect(metricUnits());
      collection.shift(); // Remove 'Bytes' as it's common
      const nonBinary = collection.all();
      nonBinary.forEach((value) => {
        expect(isBinaryUnit(value)).toBe(-1);
      });
    });
  });

  describe('fromBytes', () => {
    describe('default (metric) conversion', () => {
      test('should convert bytes to human-readable metric units', () => {
        const base = 10;
        const expected = [
          '1.00 Bytes',
          '10.00 Bytes',
          '100.00 Bytes',
          '1.00 KB',
          '10.00 KB',
          '100.00 KB',
          '1.00 MB',
          '10.00 MB',
          '100.00 MB',
          '1.00 GB',
          '10.00 GB',
          '100.00 GB',
          '1.00 TB',
          '10.00 TB',
          '100.00 TB',
          '1.00 PB',
          '10.00 PB',
          '100.00 PB',
        ];
        expected.forEach((value, i) => {
          expect(fromBytes(Math.pow(base, i))).toBe(value);
        });
      });

      test('should throw error for negative decimals', () => {
        expect(() => fromBytes(1024, { decimals: -1 })).toThrow(
          'Invalid decimals -1',
        );
      });
    });

    describe('binary conversion', () => {
      test('should convert bytes to human-readable binary units', () => {
        const base = 2;
        const expected = [
          '1 Bytes',
          '1 KiB',
          '1 MiB',
          '1 GiB',
          '1 TiB',
          '1 PiB',
          '1 EiB',
          '1 ZiB',
          '1 YiB',
        ];
        expected.forEach((value, i) => {
          expect(
            fromBytes(Math.pow(base, i * 10), {
              useBinaryUnits: true,
              decimals: 0,
            }),
          ).toBe(value);
        });
      });
    });
  });

  describe('toBytes', () => {
    test('should convert metric units to bytes', () => {
      expect(toBytes(100, 'Bytes')).toBe(100 * Math.pow(10, 0));
      expect(toBytes(100, 'KB')).toBe(100 * Math.pow(10, 3));
      expect(toBytes(100, 'MB')).toBe(100 * Math.pow(10, 6));
      expect(toBytes(100, 'GB')).toBe(100 * Math.pow(10, 9));
      expect(toBytes(100, 'TB')).toBe(100 * Math.pow(10, 12));
      expect(toBytes(100, 'PB')).toBe(100 * Math.pow(10, 15));
    });

    test('should convert binary units to bytes', () => {
      expect(toBytes(100, 'Bytes')).toBe(100 * Math.pow(2, 0));
      expect(toBytes(100, 'KiB')).toBe(100 * Math.pow(2, 10));
      expect(toBytes(100, 'MiB')).toBe(100 * Math.pow(2, 20));
      expect(toBytes(100, 'GiB')).toBe(100 * Math.pow(2, 30));
      expect(toBytes(100, 'TiB')).toBe(100 * Math.pow(2, 40));
      expect(toBytes(100, 'PiB')).toBe(100 * Math.pow(2, 50));
    });

    test('should throw error for invalid unit', () => {
      expect(() => toBytes(100, 'Invalid')).toThrow('Invalid unit Invalid');
    });
  });
});
