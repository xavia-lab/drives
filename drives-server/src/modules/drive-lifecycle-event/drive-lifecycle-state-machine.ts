import {
  DriveLifecycleEventType,
  DriveLifecycleState,
} from './entities/drive-lifecycle-event.entity';

// Events that only annotate the log without changing the drive's derived state.
export const INFORMATIONAL_EVENT_TYPES: readonly DriveLifecycleEventType[] = [
  DriveLifecycleEventType.INSPECT,
  DriveLifecycleEventType.NOTE,
];

const INFORMATIONAL_SET = new Set<DriveLifecycleEventType>(
  INFORMATIONAL_EVENT_TYPES,
);

// The state an event moves a drive into. Informational events are handled by
// the caller (they keep the current state).
const STATE_BY_EVENT: Partial<
  Record<DriveLifecycleEventType, DriveLifecycleState>
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

const ALLOWED_TRANSITIONS: Record<
  DriveLifecycleState,
  DriveLifecycleEventType[]
> = {
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
};

const TERMINAL_STATES = new Set<DriveLifecycleState>([
  DriveLifecycleState.SCRAPPED,
  DriveLifecycleState.REPLACED,
  DriveLifecycleState.LOST,
]);

export function isInformationalEvent(
  eventType: DriveLifecycleEventType,
): boolean {
  return INFORMATIONAL_SET.has(eventType);
}

export function isStateChangingEvent(
  eventType: DriveLifecycleEventType,
): boolean {
  return !isInformationalEvent(eventType);
}

export function isTerminalState(state: DriveLifecycleState): boolean {
  return TERMINAL_STATES.has(state);
}

// Maps an event to the resulting state. Informational events keep the current
// state.
export function stateForEvent(
  eventType: DriveLifecycleEventType,
  currentState: DriveLifecycleState = DriveLifecycleState.UNRECEIVED,
): DriveLifecycleState {
  if (isInformationalEvent(eventType)) {
    return currentState;
  }

  return STATE_BY_EVENT[eventType] ?? currentState;
}

// Derives the state from an ordered (oldest first) list of events.
export function deriveStateFromEvents(
  events: { eventType: DriveLifecycleEventType }[],
): DriveLifecycleState {
  return events.reduce(
    (state, event) => stateForEvent(event.eventType, state),
    DriveLifecycleState.UNRECEIVED,
  );
}

export function allowedEventsFor(
  state: DriveLifecycleState,
): DriveLifecycleEventType[] {
  return ALLOWED_TRANSITIONS[state] ?? [];
}

// Informational events are always allowed (even on terminal drives) so audits
// can still be appended. State-changing events must be a legal transition.
export function canTransition(
  currentState: DriveLifecycleState,
  eventType: DriveLifecycleEventType,
): boolean {
  if (isInformationalEvent(eventType)) {
    return true;
  }

  return allowedEventsFor(currentState).includes(eventType);
}
