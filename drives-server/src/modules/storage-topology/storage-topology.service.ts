import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import {
  StoragePoolHost,
  StoragePoolHostEventType,
} from '../storage-pool/entities/storage-pool-host.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { VirtualServer } from '../virtual-server/entities/virtual-server.entity';
import { PassthroughSlot } from '../virtual-server/entities/passthrough-slot.entity';
import { ServerSlotAllocationService } from '../server-slot-allocation/server-slot-allocation.service';

export type PoolHostType = 'PHYSICAL' | 'VIRTUAL';

export interface PoolHost {
  type: PoolHostType;
  serverId: string;
  hostname: string;
  /** For a virtual host, the physical server exposing the passthrough slots. */
  hostServerId: string;
}

export interface AccessibleDrive {
  driveId: string;
  slotId: string;
  slotLabel: string;
  serverId: string;
  serverHostname: string;
  datacenterId: string;
  label: string;
  serialNumber: string;
  driveModelId: string;
  driveModelName: string | null;
  devicePath?: string | null;
}

@Injectable()
export class StorageTopologyService {
  constructor(
    @InjectModel(StoragePoolHost)
    private readonly storagePoolHostModel: typeof StoragePoolHost,
    @InjectModel(PhysicalServer)
    private readonly physicalServerModel: typeof PhysicalServer,
    @InjectModel(VirtualServer)
    private readonly virtualServerModel: typeof VirtualServer,
    @InjectModel(PassthroughSlot)
    private readonly passthroughSlotModel: typeof PassthroughSlot,
    private readonly serverSlotAllocationService: ServerSlotAllocationService,
  ) {}

  async getCurrentHost(
    storagePoolId: string,
    transaction?: Transaction,
  ): Promise<PoolHost | null> {
    const event = await this.storagePoolHostModel.findOne({
      where: { storagePoolId },
      order: [
        ['eventTimestamp', 'DESC'],
        ['displayKey', 'DESC'],
      ],
      transaction,
    });

    if (!event || event.eventType !== StoragePoolHostEventType.IMPORT) {
      return null;
    }

    if (event.physicalServerId) {
      const server = await this.physicalServerModel.findByPk(
        event.physicalServerId,
        { transaction },
      );
      return {
        type: 'PHYSICAL',
        serverId: event.physicalServerId,
        hostname: server?.hostname ?? '',
        hostServerId: event.physicalServerId,
      };
    }

    if (event.virtualServerId) {
      const guest = await this.virtualServerModel.findByPk(
        event.virtualServerId,
        { transaction },
      );
      return {
        type: 'VIRTUAL',
        serverId: event.virtualServerId,
        hostname: guest?.hostname ?? '',
        hostServerId: guest?.hostServerId ?? '',
      };
    }

    return null;
  }

  /**
   * Drives visible to a pool:
   * - physical pool -> drives currently seated in that server's slots;
   * - virtual pool -> drives in host slots passed through to the guest.
   */
  async getAccessibleDrives(
    storagePoolId: string,
    transaction?: Transaction,
  ): Promise<AccessibleDrive[]> {
    const host = await this.getCurrentHost(storagePoolId, transaction);
    if (!host) {
      return [];
    }
    return this.getAccessibleDrivesForHost(
      host.type,
      host.serverId,
      transaction,
    );
  }

  async getAccessibleDrivesForHost(
    hostType: PoolHostType,
    hostServerId: string,
    transaction?: Transaction,
  ): Promise<AccessibleDrive[]> {
    let physicalServerId = hostServerId;
    if (hostType === 'VIRTUAL') {
      const guest = await this.virtualServerModel.findByPk(hostServerId, {
        transaction,
      });
      if (!guest) {
        return [];
      }
      physicalServerId = guest.hostServerId;
    }

    const board =
      await this.serverSlotAllocationService.getBoard(physicalServerId);

    let allowedSlotIds: Set<string> | null = null;
    if (hostType === 'VIRTUAL') {
      const passthrough = await this.passthroughSlotModel.findAll({
        where: { virtualServerId: hostServerId },
        attributes: ['serverSlotId'],
        transaction,
      });
      allowedSlotIds = new Set(passthrough.map((row) => row.serverSlotId));
    }

    return board.slots
      .filter((slot) => {
        if (!slot.occupancy) return false;
        return allowedSlotIds ? allowedSlotIds.has(slot.id) : true;
      })
      .map((slot) => ({
        driveId: slot.occupancy!.physicalDriveId,
        slotId: slot.id,
        slotLabel: slot.slotLabel,
        serverId: physicalServerId,
        serverHostname: board.server.hostname,
        datacenterId: board.server.datacenterId,
        label: slot.occupancy!.driveLabel,
        serialNumber: slot.occupancy!.serialNumber,
        driveModelId: slot.occupancy!.driveModelId,
        driveModelName: slot.occupancy!.driveModelName,
      }));
  }

  async getAccessibleDriveIds(
    storagePoolId: string,
    transaction?: Transaction,
  ): Promise<Set<string>> {
    return new Set(
      (await this.getAccessibleDrives(storagePoolId, transaction)).map(
        (drive) => drive.driveId,
      ),
    );
  }

  async getAccessibleDriveIdsForHost(
    hostType: PoolHostType,
    hostServerId: string,
    transaction?: Transaction,
  ): Promise<Set<string>> {
    return new Set(
      (
        await this.getAccessibleDrivesForHost(
          hostType,
          hostServerId,
          transaction,
        )
      ).map((drive) => drive.driveId),
    );
  }

  async assertDriveAccessible(
    storagePoolId: string,
    physicalDriveId: string,
    transaction?: Transaction,
  ): Promise<void> {
    const accessible = await this.getAccessibleDriveIds(
      storagePoolId,
      transaction,
    );
    if (!accessible.has(physicalDriveId)) {
      throw new ConflictException(
        `Physical drive ${physicalDriveId} is not accessible to the current host of storage pool ${storagePoolId}`,
      );
    }
  }

  async assertSameHost(
    sourceStoragePoolId: string,
    targetStoragePoolId: string,
    transaction?: Transaction,
  ): Promise<PoolHost> {
    const source = await this.getCurrentHost(sourceStoragePoolId, transaction);
    const target = await this.getCurrentHost(targetStoragePoolId, transaction);

    if (!source || !target) {
      throw new BadRequestException(
        'Both source and target storage pools must be attached to a host',
      );
    }
    if (source.type !== target.type || source.serverId !== target.serverId) {
      throw new ConflictException(
        'A vdev member can only be moved between pools on the same host',
      );
    }

    return target;
  }
}
