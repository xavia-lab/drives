export interface BoardOccupant {
  allocationId: string;
  physicalDriveId: string;
  driveLabel: string;
  serialNumber: string;
  driveModelId: string;
  driveModelName: string | null;
  assignedAt: string;
}

export interface BoardSlot {
  id: string;
  slotLabel: string;
  pcieBusAddress: string | null;
  supportedInterfaceId: string;
  occupancy: BoardOccupant | null;
}

export interface BoardDrive {
  id: string;
  label: string;
  serialNumber: string;
  driveModelId: string;
  driveModelName: string | null;
}

export interface SlotAssignmentBoard {
  server: {
    id: string;
    hostname: string;
    rackId: string;
    rackName: string | null;
    datacenterId: string;
    datacenterCode: string;
    datacenterName: string;
  };
  slots: BoardSlot[];
  freeDrives: BoardDrive[];
  summary: {
    totalSlots: number;
    occupiedSlots: number;
    emptySlots: number;
    freeDrives: number;
  };
}

// Payload carried by every draggable drive. `fromSlotId` is null when the chip
// is dragged out of the pool of free drives.
export interface DragData {
  driveId: string;
  fromSlotId: string | null;
  label: string;
  serialNumber: string;
  driveModelName: string | null;
}

export const UNASSIGNED_DROPZONE_ID = "unassigned-dropzone";
