import { describe, it, expect } from 'vitest';
import { WarrantyClaimStatus } from './entities/warranty-claim.entity';
import { WarrantyClaimEventType } from './entities/warranty-claim-event.entity';
import {
  allowedEventsFor,
  canTransition,
  deriveStatusFromEvents,
  isInformationalEvent,
  isStateChangingEvent,
  isTerminalStatus,
  statusForEvent,
} from './warranty-claim-state-machine';

const ALL_STATES = Object.values(WarrantyClaimStatus);
const ALL_EVENTS = Object.values(WarrantyClaimEventType);

const INFORMATIONAL = new Set<WarrantyClaimEventType>([
  WarrantyClaimEventType.NOTE,
]);

const TERMINAL = new Set<WarrantyClaimStatus>([WarrantyClaimStatus.CLOSED]);

// --- Explicit expectations, written independently of the implementation -------

const EXPECTED_ALLOWED: Record<WarrantyClaimStatus, WarrantyClaimEventType[]> =
  {
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

const EXPECTED_STATUS_BY_EVENT: Partial<
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

const REPRESENTATIVE_HISTORY: Record<
  WarrantyClaimStatus,
  WarrantyClaimEventType[]
> = {
  [WarrantyClaimStatus.SUBMITTED]: [],
  [WarrantyClaimStatus.SHIPPED_TO_VENDOR]: [
    WarrantyClaimEventType.SHIPPED_TO_VENDOR,
  ],
  [WarrantyClaimStatus.APPROVED]: [
    WarrantyClaimEventType.SHIPPED_TO_VENDOR,
    WarrantyClaimEventType.APPROVED,
  ],
  [WarrantyClaimStatus.REJECTED]: [
    WarrantyClaimEventType.SHIPPED_TO_VENDOR,
    WarrantyClaimEventType.REJECTED,
  ],
  [WarrantyClaimStatus.REPLACEMENT_RECEIVED]: [
    WarrantyClaimEventType.SHIPPED_TO_VENDOR,
    WarrantyClaimEventType.APPROVED,
    WarrantyClaimEventType.REPLACEMENT_RECEIVED,
  ],
  [WarrantyClaimStatus.CLOSED]: [
    WarrantyClaimEventType.SHIPPED_TO_VENDOR,
    WarrantyClaimEventType.APPROVED,
    WarrantyClaimEventType.CLOSED,
  ],
};

const history = (events: WarrantyClaimEventType[]) =>
  events.map((eventType) => ({ eventType }));

describe('warranty claim state machine', () => {
  describe('coverage guards', () => {
    it('has an expectation row for every status', () => {
      expect(Object.keys(EXPECTED_ALLOWED).sort()).toEqual(
        [...ALL_STATES].sort(),
      );
      expect(Object.keys(REPRESENTATIVE_HISTORY).sort()).toEqual(
        [...ALL_STATES].sort(),
      );
    });

    it('classifies every event as informational or state-changing', () => {
      const mapped = Object.keys(EXPECTED_STATUS_BY_EVENT);
      const classified = [...mapped, ...INFORMATIONAL].sort();
      expect(classified).toEqual([...ALL_EVENTS].sort());
      expect(
        mapped.some((event) =>
          INFORMATIONAL.has(event as WarrantyClaimEventType),
        ),
      ).toBe(false);
    });
  });

  describe('isInformationalEvent / isStateChangingEvent', () => {
    it('matches the expectation for every event', () => {
      for (const event of ALL_EVENTS) {
        expect(isInformationalEvent(event), event).toBe(
          INFORMATIONAL.has(event),
        );
        expect(isStateChangingEvent(event), event).toBe(
          !INFORMATIONAL.has(event),
        );
      }
    });
  });

  describe('canTransition — full status × event matrix', () => {
    for (const status of ALL_STATES) {
      it(`allows exactly the expected events from ${status}`, () => {
        for (const event of ALL_EVENTS) {
          const expected =
            INFORMATIONAL.has(event) ||
            EXPECTED_ALLOWED[status].includes(event);
          expect(canTransition(status, event), `${status} + ${event}`).toBe(
            expected,
          );
        }
      });
    }
  });

  describe('allowedEventsFor', () => {
    for (const status of ALL_STATES) {
      it(`returns the expected state-changing row for ${status}`, () => {
        expect([...allowedEventsFor(status)].sort()).toEqual(
          [...EXPECTED_ALLOWED[status]].sort(),
        );
      });
    }
  });

  describe('statusForEvent', () => {
    it('defaults to SUBMITTED', () => {
      expect(statusForEvent(WarrantyClaimEventType.APPROVED)).toBe(
        WarrantyClaimStatus.APPROVED,
      );
      expect(statusForEvent(WarrantyClaimEventType.NOTE)).toBe(
        WarrantyClaimStatus.SUBMITTED,
      );
    });

    it('maps every state-changing event to its expected status', () => {
      for (const event of ALL_EVENTS) {
        if (INFORMATIONAL.has(event)) continue;
        expect(statusForEvent(event), event).toBe(
          EXPECTED_STATUS_BY_EVENT[event],
        );
      }
    });

    it('keeps the current status for informational events', () => {
      for (const status of ALL_STATES) {
        for (const event of INFORMATIONAL) {
          expect(statusForEvent(event, status), `${event} from ${status}`).toBe(
            status,
          );
        }
      }
    });
  });

  describe('deriveStatusFromEvents', () => {
    it('returns SUBMITTED for an empty history', () => {
      expect(deriveStatusFromEvents([])).toBe(WarrantyClaimStatus.SUBMITTED);
    });

    it('handles a single event of every type', () => {
      for (const event of ALL_EVENTS) {
        expect(deriveStatusFromEvents([{ eventType: event }]), event).toBe(
          INFORMATIONAL.has(event)
            ? WarrantyClaimStatus.SUBMITTED
            : EXPECTED_STATUS_BY_EVENT[event],
        );
      }
    });

    it('derives each representative history to its status', () => {
      for (const status of ALL_STATES) {
        expect(
          deriveStatusFromEvents(history(REPRESENTATIVE_HISTORY[status])),
          status,
        ).toBe(status);
      }
    });

    it('derives the replacement happy path', () => {
      expect(
        deriveStatusFromEvents(
          history([
            WarrantyClaimEventType.SHIPPED_TO_VENDOR,
            WarrantyClaimEventType.APPROVED,
            WarrantyClaimEventType.REPLACEMENT_RECEIVED,
            WarrantyClaimEventType.CLOSED,
          ]),
        ),
      ).toBe(WarrantyClaimStatus.CLOSED);
    });

    it('derives the rejected path', () => {
      expect(
        deriveStatusFromEvents(
          history([
            WarrantyClaimEventType.SHIPPED_TO_VENDOR,
            WarrantyClaimEventType.REJECTED,
            WarrantyClaimEventType.CLOSED,
          ]),
        ),
      ).toBe(WarrantyClaimStatus.CLOSED);

      expect(
        deriveStatusFromEvents(
          history([
            WarrantyClaimEventType.SHIPPED_TO_VENDOR,
            WarrantyClaimEventType.REJECTED,
          ]),
        ),
      ).toBe(WarrantyClaimStatus.REJECTED);
    });

    it('ignores informational events anywhere in the history', () => {
      expect(
        deriveStatusFromEvents(
          history([
            WarrantyClaimEventType.NOTE,
            WarrantyClaimEventType.SHIPPED_TO_VENDOR,
            WarrantyClaimEventType.NOTE,
            WarrantyClaimEventType.APPROVED,
          ]),
        ),
      ).toBe(WarrantyClaimStatus.APPROVED);
    });
  });

  describe('transition / derivation consistency', () => {
    for (const status of ALL_STATES) {
      it(`appending a legal event to a ${status} history derives the mapped status`, () => {
        const base = REPRESENTATIVE_HISTORY[status];
        for (const event of ALL_EVENTS) {
          if (!canTransition(status, event)) continue;
          expect(
            deriveStatusFromEvents([...history(base), { eventType: event }]),
            `${status} + ${event}`,
          ).toBe(statusForEvent(event, status));
        }
      });
    }
  });

  describe('terminal statuses', () => {
    it('flags exactly the expected terminal statuses', () => {
      for (const status of ALL_STATES) {
        expect(isTerminalStatus(status), status).toBe(TERMINAL.has(status));
      }
    });

    it('allows only informational events from terminal statuses', () => {
      for (const status of TERMINAL) {
        expect(allowedEventsFor(status), status).toHaveLength(0);
        for (const event of ALL_EVENTS) {
          expect(canTransition(status, event), `${status} + ${event}`).toBe(
            INFORMATIONAL.has(event),
          );
        }
      }
    });
  });
});
