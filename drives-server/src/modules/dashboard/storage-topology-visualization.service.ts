import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { VirtualServer } from '../virtual-server/entities/virtual-server.entity';
import { PassthroughSlot } from '../virtual-server/entities/passthrough-slot.entity';
import { Interface } from '../interface/entities/interface.entity';
import { PoolType } from '../pool-type/entities/pool-type.entity';
import { ServerSlotAllocationService } from '../server-slot-allocation/server-slot-allocation.service';
import { StoragePoolService } from '../storage-pool/storage-pool.service';
import { LogicalVdevService } from '../logical-vdev/logical-vdev.service';
import {
  QueryStorageTopologyDto,
  TopologyHostType,
} from './dto/query-storage-topology.dto';

const unique = <T>(values: T[]): T[] => [...new Set(values)];

@Injectable()
export class StorageTopologyVisualizationService {
  constructor(
    @InjectModel(Datacenter)
    private readonly datacenterModel: typeof Datacenter,
    @InjectModel(VirtualServer)
    private readonly virtualServerModel: typeof VirtualServer,
    @InjectModel(PassthroughSlot)
    private readonly passthroughSlotModel: typeof PassthroughSlot,
    @InjectModel(Interface)
    private readonly interfaceModel: typeof Interface,
    @InjectModel(PoolType)
    private readonly poolTypeModel: typeof PoolType,
    private readonly allocationService: ServerSlotAllocationService,
    private readonly storagePoolService: StoragePoolService,
    private readonly logicalVdevService: LogicalVdevService,
  ) {}

  async getTopology(dto: QueryStorageTopologyDto) {
    const datacenter = await this.datacenterModel.findByPk(dto.datacenterId);
    if (!datacenter) {
      throw new NotFoundException(
        `Datacenter with ID ${dto.datacenterId} not found`,
      );
    }

    const guest =
      dto.hostType === TopologyHostType.VIRTUAL
        ? await this.virtualServerModel.findByPk(dto.hostId)
        : null;
    if (dto.hostType === TopologyHostType.VIRTUAL && !guest) {
      throw new NotFoundException(
        `VirtualServer with ID ${dto.hostId} not found`,
      );
    }

    const physicalServerId = guest?.hostServerId ?? dto.hostId;
    const board = await this.allocationService.getBoard(physicalServerId);
    if (board.server.datacenterId !== dto.datacenterId) {
      throw new BadRequestException(
        'The selected server is not in the selected datacenter',
      );
    }

    const slotIds = board.slots.map((slot) => slot.id);
    const interfaceIds = unique(
      board.slots.map((slot) => slot.supportedInterfaceId),
    );
    const [interfaces, passthroughs] = await Promise.all([
      this.interfaceModel.findAll({
        where: { id: { [Op.in]: interfaceIds } },
        attributes: ['id', 'name'],
      }),
      this.passthroughSlotModel.findAll({
        where: { serverSlotId: { [Op.in]: slotIds } },
        include: [{ model: VirtualServer }],
      }),
    ]);
    const interfaceById = new Map(
      interfaces.map((iface) => [iface.id, iface.name]),
    );
    const passthroughBySlot = new Map(
      passthroughs.map((row) => [
        row.serverSlotId,
        {
          virtualServerId: row.virtualServerId,
          hostname: row.virtualServer?.hostname ?? '',
          isSelectedHost: guest?.id === row.virtualServerId,
        },
      ]),
    );

    const hostGuests =
      dto.hostType === TopologyHostType.VIRTUAL
        ? guest
          ? [guest]
          : []
        : await this.virtualServerModel.findAll({
            where: { hostServerId: physicalServerId },
            attributes: ['id', 'hostname'],
          });
    const poolSources = [
      {
        ownerType: 'PHYSICAL',
        ownerName: board.server.hostname,
        filter: { physicalServerId },
      },
      ...(dto.hostType === TopologyHostType.VIRTUAL && guest
        ? [
            {
              ownerType: 'VIRTUAL',
              ownerName: guest.hostname,
              filter: { virtualServerId: guest.id },
            },
          ]
        : hostGuests.map((hostGuest) => ({
            ownerType: 'VIRTUAL',
            ownerName: hostGuest.hostname,
            filter: { virtualServerId: hostGuest.id },
          }))),
    ];
    const poolGroups = await Promise.all(
      poolSources.map(async (source) => ({
        ...source,
        pools: await this.storagePoolService.findAttached(source.filter),
      })),
    );
    const attachedPools = poolGroups.flatMap((group) =>
      group.pools.map((pool) => ({
        pool,
        ownerType: group.ownerType,
        ownerName: group.ownerName,
      })),
    );
    const poolTypes = await this.poolTypeModel.findAll({
      where: {
        id: {
          [Op.in]: unique(attachedPools.map(({ pool }) => pool.poolTypeId)),
        },
      },
      attributes: ['id', 'name'],
    });
    const poolTypeById = new Map(
      poolTypes.map((poolType) => [poolType.id, poolType.name]),
    );

    const poolsWithVdevs = await Promise.all(
      attachedPools.map(async ({ pool, ownerType, ownerName }) => ({
        pool,
        ownerType,
        ownerName,
        vdevs: await this.logicalVdevService.findByPool(pool.id),
      })),
    );

    const slotLabelByDriveId = new Map(
      board.slots
        .filter((slot) => slot.occupancy)
        .map((slot) => [slot.occupancy!.physicalDriveId, slot.slotLabel]),
    );
    const mappingByDriveId = new Map<string, Record<string, unknown>>();
    for (const { pool, ownerType, ownerName, vdevs } of poolsWithVdevs) {
      for (const vdev of vdevs) {
        const members =
          (vdev.get('members') as Array<Record<string, unknown>>) ?? [];
        const capacity = vdev.get('capacity') as
          { health?: string | null } | undefined;
        for (const member of members) {
          const physicalDrive = member.physicalDrive as
            { label?: string; serialNumber?: string } | undefined;
          mappingByDriveId.set(String(member.physicalDriveId), {
            poolId: pool.id,
            poolName: pool.poolName,
            poolTypeName: poolTypeById.get(pool.poolTypeId) ?? 'Unknown',
            poolOwnerType: ownerType,
            poolOwnerName: ownerName,
            vdevId: vdev.id,
            vdevName: vdev.vdevName,
            vdevClass: vdev.vdevClass,
            vdevHealth: capacity?.health ?? null,
            memberRole: member.memberRole,
            memberIndex: member.memberIndex,
            groupIndex: member.groupIndex ?? null,
            label: physicalDrive?.label ?? null,
            serialNumber: physicalDrive?.serialNumber ?? null,
          });
        }
      }
    }

    const slots = board.slots.map((slot) => {
      const occupancy = slot.occupancy;
      return {
        id: slot.id,
        slotLabel: slot.slotLabel,
        pcieBusAddress: slot.pcieBusAddress,
        interfaceId: slot.supportedInterfaceId,
        interfaceName:
          interfaceById.get(slot.supportedInterfaceId) ??
          slot.supportedInterfaceId,
        occupancy: occupancy
          ? {
              allocationId: occupancy.allocationId,
              physicalDriveId: occupancy.physicalDriveId,
              label: occupancy.driveLabel,
              serialNumber: occupancy.serialNumber,
              driveModelId: occupancy.driveModelId,
              driveModelName: occupancy.driveModelName,
              mapping: mappingByDriveId.get(occupancy.physicalDriveId) ?? null,
            }
          : null,
        passthrough: passthroughBySlot.get(slot.id) ?? null,
      };
    });

    const pools = poolsWithVdevs.map(
      ({ pool, ownerType, ownerName, vdevs }) => ({
        id: pool.id,
        poolName: pool.poolName,
        poolTypeName: poolTypeById.get(pool.poolTypeId) ?? 'Unknown',
        ownerType,
        ownerName,
        vdevs: vdevs.map((vdev) => {
          const members =
            (vdev.get('members') as Array<Record<string, unknown>>) ?? [];
          const capacity = vdev.get('capacity') as
            { health?: string | null } | undefined;
          return {
            id: vdev.id,
            vdevName: vdev.vdevName,
            vdevClass: vdev.vdevClass,
            health: capacity?.health ?? null,
            memberCount: members.length,
            members: members.map((member) => {
              const physicalDrive = member.physicalDrive as
                { label?: string; serialNumber?: string } | undefined;
              return {
                physicalDriveId: String(member.physicalDriveId),
                label: physicalDrive?.label ?? '',
                serialNumber: physicalDrive?.serialNumber ?? '',
                slotLabel:
                  slotLabelByDriveId.get(String(member.physicalDriveId)) ??
                  null,
              };
            }),
          };
        }),
      }),
    );

    const occupied = slots.filter((slot) => slot.occupancy);
    const mappedDrives = occupied.filter(
      (slot) => slot.occupancy?.mapping,
    ).length;

    return {
      datacenter: {
        id: datacenter.id,
        code: datacenter.code,
        name: datacenter.name,
      },
      host: {
        type: dto.hostType,
        id: dto.hostId,
        hostname: guest?.hostname ?? board.server.hostname,
        hostServerId: guest ? physicalServerId : null,
        hostServerHostname: guest ? board.server.hostname : null,
        rackName: board.server.rackName,
      },
      slots,
      pools,
      summary: {
        totalSlots: slots.length,
        occupiedSlots: occupied.length,
        emptySlots: slots.length - occupied.length,
        mappedDrives,
        unmappedDrives: occupied.length - mappedDrives,
        passthroughSlots: slots.filter((slot) => slot.passthrough).length,
        poolCount: pools.length,
        vdevCount: pools.reduce((sum, pool) => sum + pool.vdevs.length, 0),
      },
    };
  }
}
