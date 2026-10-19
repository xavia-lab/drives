import { WarrantyClaimStatus } from './entities/warranty-claim.entity';
import { WarrantyClaimEventType } from './entities/warranty-claim-event.entity';

// Events that only annotate the tracking log without changing the claim status.
export const INFORMATIONAL_EVENT_TYPES: readonly WarrantyClaimEventType[] = [
  WarrantyClaimEventType.NOTE,
];

const INFORMATIONAL_SET = new Set<WarrantyClaimEventType>(
  INFORMATIONAL_EVENT_TYPES,
);

// A brand new claim (header created, no events yet) is at least SUBMITTED.
const INITIAL_STATUS = WarrantyClaimStatus.SUBMITTED;

// The status an event moves a claim into. Informational events keep the current
// status (handled by the caller).
const STATUS_BY_EVENT: Partial<
  Record<WarrantyClaimEventType, WarrantyClaimStatus>
> = {
  [WarrantyClaimEventType.SHIPPED_TO_VENDOR]:
    WarrantyClaimStatus.SHIPPED_TO_VENDOR,
  [WarrantyClaimEventType.APPROVED]: WarrantyClaimStatus.APPROVED,
  [WarrantyClaimEventType.REJECTED]: WarrantyClaimStatus.REJECTED,
  [WarrantyClaimEventType.REPLACEMENT_RECEIVED]:
    WarrantyClaimStatus.REPLACEMENT_RECEIVED,
  [WarrantyClaimEventType.CLOSED]: WarrantyClaimStatus.CLOSED,
};

const ALLOWED_TRANSITIONS: Record<
  WarrantyClaimStatus,
  WarrantyClaimEventType[]
> = {
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
};

const TERMINAL_STATUSES = new Set<WarrantyClaimStatus>([
  WarrantyClaimStatus.CLOSED,
]);

export function isInformationalEvent(
  eventType: WarrantyClaimEventType,
): boolean {
  return INFORMATIONAL_SET.has(eventType);
}

export function isStateChangingEvent(
  eventType: WarrantyClaimEventType,
): boolean {
  return !isInformationalEvent(eventType);
}

export function isTerminalStatus(status: WarrantyClaimStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

// Maps an event to the resulting status. Informational events keep the current
// status.
export function statusForEvent(
  eventType: WarrantyClaimEventType,
  currentStatus: WarrantyClaimStatus = INITIAL_STATUS,
): WarrantyClaimStatus {
  if (isInformationalEvent(eventType)) {
    return currentStatus;
  }

  return STATUS_BY_EVENT[eventType] ?? currentStatus;
}

// Derives the status from an ordered (oldest first) list of events.
export function deriveStatusFromEvents(
  events: { eventType: WarrantyClaimEventType }[],
): WarrantyClaimStatus {
  return events.reduce(
    (status, event) => statusForEvent(event.eventType, status),
    INITIAL_STATUS,
  );
}

export function allowedEventsFor(
  status: WarrantyClaimStatus,
): WarrantyClaimEventType[] {
  return ALLOWED_TRANSITIONS[status] ?? [];
}

// Informational events are always allowed (even on closed claims) so audit
// notes can still be appended. State-changing events must be a legal transition.
export function canTransition(
  currentStatus: WarrantyClaimStatus,
  eventType: WarrantyClaimEventType,
): boolean {
  if (isInformationalEvent(eventType)) {
    return true;
  }

  return allowedEventsFor(currentStatus).includes(eventType);
}
