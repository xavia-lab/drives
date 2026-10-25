import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhysicalDrive } from './physical-drive.entity';
import { DriveModel } from '../../drive-model/entities/drive-model.entity';

const buildDrive = () =>
  ({
    driveModelId: 'model-1',
    purchaseDate: '2021-12-06',
  }) as PhysicalDrive;

describe('PhysicalDrive.generateAssetLabel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockModel = () => {
    vi.spyOn(DriveModel, 'findByPk').mockResolvedValue({
      name: 'Exos',
      manufacturer: { name: 'Seagate' },
      capacity: { value: 16, unit: 'TB' },
    } as unknown as DriveModel);
  };

  it('increments the sequence from the highest matching label', async () => {
    mockModel();
    vi.spyOn(PhysicalDrive, 'findAll').mockResolvedValue([
      { label: 'SE-EX-20211206-16T-001' },
      { label: 'SE-EX-20211206-16T-003' },
    ] as PhysicalDrive[]);

    const drive = buildDrive();
    await PhysicalDrive.generateAssetLabel(drive, {});

    expect(drive.label).toBe('SE-EX-20211206-16T-004');
  });

  it('starts at 001 when no matching label exists', async () => {
    mockModel();
    vi.spyOn(PhysicalDrive, 'findAll').mockResolvedValue([]);

    const drive = buildDrive();
    await PhysicalDrive.generateAssetLabel(drive, {});

    expect(drive.label).toBe('SE-EX-20211206-16T-001');
  });
});
