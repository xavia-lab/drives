import {
  DriveLifecycleEventType,
  DriveLifecycleState,
} from './entities/drive-lifecycle-event.entity';
import { createEventStateMachine } from '../../lib/state-machine/create-event-state-machine';

// Events that only annotate the log without changing the drive's derived state.
export type DriveLifecycleInformationalEvent =
  DriveLifecycleEventType.INSPECT | DriveLifecycleEventType.NOTE;

// The state an event moves a drive into. Informational events are handled by
// the machine (they keep the current state).
const STATE_BY_EVENT: Record<
  Exclude<DriveLifecycleEventType, DriveLifecycleInformationalEvent>,
  DriveLifecycleState
> = {
  [DriveLifecycleEventType.ACQUIRE]: DriveLifecycleState.RECEIVED,
  [DriveLifecycleEventType.PROVISION]: DriveLifecycleState.IN_SERVICE,
  [DriveLifecycleEventType.DEPROVISION]: DriveLifecycleState.IN_INVENTORY,
  [DriveLifecycleEventType.DEGRADE]: DriveLifecycleState.DEGRADED,
  [DriveLifecycleEventType.RECOVER]: DriveLifecycleState.IN_INVENTORY,
  [DriveLifecycleEventType.FAIL]: DriveLifecycleState.FAILED,
  [DriveLifecycleEventType.RMA_INITIATE]: DriveLifecycleState.IN_RMA,
  [DriveLifecycleEventType.RMA_SHIP]: DriveLifecycleState.IN_RMA,
  [DriveLifecycleEventType.RMA_APPROVE]: DriveLifecycleState.IN_RMA,
  [DriveLifecycleEventType.RMA_REJECT]: DriveLifecycleState.FAILED,
  [DriveLifecycleEventType.RMA_REPLACE]: DriveLifecycleState.REPLACED,
  [DriveLifecycleEventType.RMA_CLOSE]: DriveLifecycleState.RETIRED,
  [DriveLifecycleEventType.RETIRE]: DriveLifecycleState.RETIRED,
  [DriveLifecycleEventType.SCRAP_SHRED]: DriveLifecycleState.SCRAPPED,
  [DriveLifecycleEventType.LOST]: DriveLifecycleState.LOST,
};

const machine = createEventStateMachine<
  DriveLifecycleState,
  DriveLifecycleEventType,
  DriveLifecycleInformationalEvent
>({
  initialState: DriveLifecycleState.UNRECEIVED,
  informationalEvents: [
    DriveLifecycleEventType.INSPECT,
    DriveLifecycleEventType.NOTE,
  ],
  stateByEvent: STATE_BY_EVENT,
  transitions: {
    [DriveLifecycleState.UNRECEIVED]: [DriveLifecycleEventType.ACQUIRE],
    [DriveLifecycleState.RECEIVED]: [
      DriveLifecycleEventType.PROVISION,
      DriveLifecycleEventType.RMA_INITIATE,
      DriveLifecycleEventType.RETIRE,
      DriveLifecycleEventType.SCRAP_SHRED,
      DriveLifecycleEventType.LOST,
    ],
    [DriveLifecycleState.IN_INVENTORY]: [
      DriveLifecycleEventType.PROVISION,
      DriveLifecycleEventType.RMA_INITIATE,
      DriveLifecycleEventType.RETIRE,
      DriveLifecycleEventType.SCRAP_SHRED,
      DriveLifecycleEventType.LOST,
    ],
    [DriveLifecycleState.IN_SERVICE]: [
      DriveLifecycleEventType.DEPROVISION,
      DriveLifecycleEventType.DEGRADE,
      DriveLifecycleEventType.FAIL,
      DriveLifecycleEventType.RETIRE,
      DriveLifecycleEventType.LOST,
    ],
    [DriveLifecycleState.DEGRADED]: [
      DriveLifecycleEventType.RECOVER,
      DriveLifecycleEventType.FAIL,
      DriveLifecycleEventType.DEPROVISION,
      DriveLifecycleEventType.RMA_INITIATE,
      DriveLifecycleEventType.RETIRE,
      DriveLifecycleEventType.SCRAP_SHRED,
      DriveLifecycleEventType.LOST,
    ],
    [DriveLifecycleState.FAILED]: [
      DriveLifecycleEventType.RECOVER,
      DriveLifecycleEventType.RMA_INITIATE,
      DriveLifecycleEventType.DEPROVISION,
      DriveLifecycleEventType.RETIRE,
      DriveLifecycleEventType.SCRAP_SHRED,
      DriveLifecycleEventType.LOST,
    ],
    [DriveLifecycleState.IN_RMA]: [
      DriveLifecycleEventType.RMA_SHIP,
      DriveLifecycleEventType.RMA_APPROVE,
      DriveLifecycleEventType.RMA_REJECT,
      DriveLifecycleEventType.RMA_REPLACE,
      DriveLifecycleEventType.RMA_CLOSE,
    ],
    [DriveLifecycleState.RETIRED]: [
      DriveLifecycleEventType.SCRAP_SHRED,
      DriveLifecycleEventType.LOST,
    ],
    [DriveLifecycleState.SCRAPPED]: [],
    [DriveLifecycleState.REPLACED]: [],
    [DriveLifecycleState.LOST]: [],
  },
  terminalStates: [
    DriveLifecycleState.SCRAPPED,
    DriveLifecycleState.REPLACED,
    DriveLifecycleState.LOST,
  ],
});

export const INFORMATIONAL_EVENT_TYPES = machine.informationalEvents;

export const {
  isInformationalEvent,
  isStateChangingEvent,
  isTerminalState,
  stateForEvent,
  deriveStateFromEvents,
  allowedEventsFor,
  canTransition,
} = machine;
