import { WarrantyClaimStatus } from './entities/warranty-claim.entity';
import { WarrantyClaimEventType } from './entities/warranty-claim-event.entity';
import { createEventStateMachine } from '../../lib/state-machine/create-event-state-machine';

// Events that only annotate the tracking log without changing the status.
export type WarrantyClaimInformationalEvent = WarrantyClaimEventType.NOTE;

// The status an event moves a claim into. Informational events are handled by
// the machine (they keep the current status).
const STATUS_BY_EVENT: Record<
  Exclude<WarrantyClaimEventType, WarrantyClaimInformationalEvent>,
  WarrantyClaimStatus
> = {
  [WarrantyClaimEventType.SHIPPED_TO_VENDOR]:
    WarrantyClaimStatus.SHIPPED_TO_VENDOR,
  [WarrantyClaimEventType.APPROVED]: WarrantyClaimStatus.APPROVED,
  [WarrantyClaimEventType.REJECTED]: WarrantyClaimStatus.REJECTED,
  [WarrantyClaimEventType.REPLACEMENT_RECEIVED]:
    WarrantyClaimStatus.REPLACEMENT_RECEIVED,
  [WarrantyClaimEventType.CLOSED]: WarrantyClaimStatus.CLOSED,
};

const machine = createEventStateMachine<
  WarrantyClaimStatus,
  WarrantyClaimEventType,
  WarrantyClaimInformationalEvent
>({
  // A brand new claim (header created, no events yet) is at least SUBMITTED.
  initialState: WarrantyClaimStatus.SUBMITTED,
  informationalEvents: [WarrantyClaimEventType.NOTE],
  stateByEvent: STATUS_BY_EVENT,
  transitions: {
    [WarrantyClaimStatus.SUBMITTED]: [
      WarrantyClaimEventType.SHIPPED_TO_VENDOR,
      WarrantyClaimEventType.REJECTED,
      WarrantyClaimEventType.CLOSED,
    ],
    [WarrantyClaimStatus.SHIPPED_TO_VENDOR]: [
      WarrantyClaimEventType.APPROVED,
      WarrantyClaimEventType.REJECTED,
      WarrantyClaimEventType.CLOSED,
    ],
    [WarrantyClaimStatus.APPROVED]: [
      WarrantyClaimEventType.REPLACEMENT_RECEIVED,
      WarrantyClaimEventType.CLOSED,
    ],
    [WarrantyClaimStatus.REJECTED]: [WarrantyClaimEventType.CLOSED],
    [WarrantyClaimStatus.REPLACEMENT_RECEIVED]: [WarrantyClaimEventType.CLOSED],
    [WarrantyClaimStatus.CLOSED]: [],
  },
  terminalStates: [WarrantyClaimStatus.CLOSED],
});

export const INFORMATIONAL_EVENT_TYPES = machine.informationalEvents;

export const {
  isInformationalEvent,
  isStateChangingEvent,
  allowedEventsFor,
  canTransition,
} = machine;

// Domain-named aliases for the generic factory helpers.
export const isTerminalStatus = machine.isTerminalState;
export const statusForEvent = machine.stateForEvent;
export const deriveStatusFromEvents = machine.deriveStateFromEvents;
