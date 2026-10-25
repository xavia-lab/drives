import { describe, expect, it, beforeEach, vi } from 'vitest';
import { StorageTopologyVisualizationService } from './storage-topology-visualization.service';
import { TopologyHostType } from './dto/query-storage-topology.dto';

describe('StorageTopologyVisualizationService', () => {
  let service: StorageTopologyVisualizationService;
  let datacenterModel: { findByPk: ReturnType<typeof vi.fn> };
  let virtualServerModel: {
    findByPk: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
  };
  let passthroughSlotModel: { findAll: ReturnType<typeof vi.fn> };
  let interfaceModel: { findAll: ReturnType<typeof vi.fn> };
  let poolTypeModel: { findAll: ReturnType<typeof vi.fn> };
  let allocationService: { getBoard: ReturnType<typeof vi.fn> };
  let storagePoolService: { findAttached: ReturnType<typeof vi.fn> };
  let logicalVdevService: { findByPool: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    datacenterModel = {
      findByPk: vi.fn().mockResolvedValue({
        id: 'dc-1',
        code: 'VA-ASH-1',
        name: 'Ashburn',
      }),
    };
    virtualServerModel = {
      findByPk: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
    };
    passthroughSlotModel = { findAll: vi.fn().mockResolvedValue([]) };
    interfaceModel = {
      findAll: vi.fn().mockResolvedValue([{ id: 'if-1', name: 'NVMe' }]),
    };
    poolTypeModel = {
      findAll: vi.fn().mockResolvedValue([{ id: 'pt-1', name: 'ZFS' }]),
    };
    allocationService = {
      getBoard: vi.fn().mockResolvedValue({
        server: {
          id: 'server-1',
          hostname: 'ash-storage-01',
          rackId: 'rack-1',
          rackName: 'RACK-A02',
          datacenterId: 'dc-1',
          datacenterCode: 'VA-ASH-1',
          datacenterName: 'Ashburn',
        },
        slots: [
          {
            id: 'slot-1',
            slotLabel: 'Bay 0',
            pcieBusAddress: '0000:41:00.0',
            supportedInterfaceId: 'if-1',
            occupancy: {
              allocationId: 'alloc-1',
              physicalDriveId: 'drive-1',
              driveLabel: 'SE-EX-20211206-16T-001',
              serialNumber: 'SN-1',
              driveModelId: 'model-1',
              driveModelName: 'Exos',
              assignedAt: new Date(),
            },
          },
          {
            id: 'slot-2',
            slotLabel: 'Bay 1',
            pcieBusAddress: null,
            supportedInterfaceId: 'if-1',
            occupancy: null,
          },
        ],
        freeDrives: [],
        summary: {
          totalSlots: 2,
          occupiedSlots: 1,
          emptySlots: 1,
          freeDrives: 0,
        },
      }),
    };
    storagePoolService = {
      findAttached: vi.fn().mockResolvedValue([
        {
          id: 'pool-1',
          poolName: 'pool',
          poolTypeId: 'pt-1',
        },
      ]),
    };
    logicalVdevService = {
      findByPool: vi.fn().mockResolvedValue([
        {
          id: 'vdev-1',
          vdevName: 'raidz1-0',
          vdevClass: 'DATA',
          get: (key: string) =>
            key === 'members'
              ? [
                  {
                    physicalDriveId: 'drive-1',
                    memberRole: 'DATA',
                    memberIndex: 0,
                    groupIndex: null,
                    physicalDrive: {
                      label: 'SE-EX-20211206-16T-001',
                      serialNumber: 'SN-1',
                    },
                  },
                ]
              : key === 'capacity'
                ? { health: 'ONLINE' }
                : null,
        },
      ]),
    };

    service = new StorageTopologyVisualizationService(
      datacenterModel as never,
      virtualServerModel as never,
      passthroughSlotModel as never,
      interfaceModel as never,
      poolTypeModel as never,
      allocationService as never,
      storagePoolService as never,
      logicalVdevService as never,
    );
  });

  it('maps physical host slots to their pool and vdev', async () => {
    const result = await service.getTopology({
      datacenterId: 'dc-1',
      hostType: TopologyHostType.PHYSICAL,
      hostId: 'server-1',
    });

    expect(result.summary.mappedDrives).toBe(1);
    expect(result.summary.emptySlots).toBe(1);
    expect(result.slots[0].occupancy?.mapping).toMatchObject({
      poolName: 'pool',
      vdevName: 'raidz1-0',
      vdevHealth: 'ONLINE',
    });
    expect(result.pools[0]).toMatchObject({
      poolName: 'pool',
      ownerType: 'PHYSICAL',
    });
  });
});
