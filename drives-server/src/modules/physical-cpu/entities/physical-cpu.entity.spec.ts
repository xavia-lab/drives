import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhysicalCpu } from './physical-cpu.entity';
import { CpuModel } from '../../cpu-model/entities/cpu-model.entity';

const buildCpu = () =>
  ({
    cpuModelId: 'model-1',
    purchaseDate: '2024-03-15',
  }) as PhysicalCpu;

describe('PhysicalCpu.generateAssetLabel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockModel = () => {
    vi.spyOn(CpuModel, 'findByPk').mockResolvedValue({
      name: 'EPYC 7763',
      vendor: { name: 'AMD' },
    } as unknown as CpuModel);
  };

  it('increments the sequence from the highest matching label', async () => {
    mockModel();
    vi.spyOn(PhysicalCpu, 'findAll').mockResolvedValue([
      { label: 'AM-EP-20240315-001' },
      { label: 'AM-EP-20240315-002' },
    ] as PhysicalCpu[]);

    const cpu = buildCpu();
    await PhysicalCpu.generateAssetLabel(cpu, {});

    expect(cpu.label).toBe('AM-EP-20240315-003');
  });

  it('starts at 001 when no matching label exists', async () => {
    mockModel();
    vi.spyOn(PhysicalCpu, 'findAll').mockResolvedValue([]);

    const cpu = buildCpu();
    await PhysicalCpu.generateAssetLabel(cpu, {});

    expect(cpu.label).toBe('AM-EP-20240315-001');
  });
});
