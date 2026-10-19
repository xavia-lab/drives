import { describe, it, expect } from 'vitest';
import {
  DriveLifecycleEventType,
  DriveLifecycleState,
} from './entities/drive-lifecycle-event.entity';
import {
  allowedEventsFor,
  canTransition,
  deriveStateFromEvents,
  isInformationalEvent,
  isStateChangingEvent,
  isTerminalState,
  stateForEvent,
} from './drive-lifecycle-state-machine';

const ALL_STATES = Object.values(DriveLifecycleState);
const ALL_EVENTS = Object.values(DriveLifecycleEventType);

const INFORMATIONAL = new Set<DriveLifecycleEventType>([
  DriveLifecycleEventType.INSPECT,
  DriveLifecycleEventType.NOTE,
]);

const TERMINAL = new Set<DriveLifecycleState>([
  DriveLifecycleState.SCRAPPED,
  DriveLifecycleState.REPLACED,
  DriveLifecycleState.LOST,
]);

// --- Explicit expectations, written independently of the implementation -------
// Any transition change must be reflected here deliberately.

const EXPECTED_ALLOWED: Record<DriveLifecycleState, DriveLifecycleEventType[]> =
  {
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

const EXPECTED_STATE_BY_EVENT: Partial<
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

// A minimal ordered history that derives to each state.
const REPRESENTATIVE_HISTORY: Record<
  DriveLifecycleState,
  DriveLifecycleEventType[]
> = {
  [DriveLifecycleState.UNRECEIVED]: [],
  [DriveLifecycleState.RECEIVED]: [DriveLifecycleEventType.ACQUIRE],
  [DriveLifecycleState.IN_INVENTORY]: [
    DriveLifecycleEventType.ACQUIRE,
    DriveLifecycleEventType.PROVISION,
    DriveLifecycleEventType.DEPROVISION,
  ],
  [DriveLifecycleState.IN_SERVICE]: [
    DriveLifecycleEventType.ACQUIRE,
    DriveLifecycleEventType.PROVISION,
  ],
  [DriveLifecycleState.DEGRADED]: [
    DriveLifecycleEventType.ACQUIRE,
    DriveLifecycleEventType.PROVISION,
    DriveLifecycleEventType.DEGRADE,
  ],
  [DriveLifecycleState.FAILED]: [
    DriveLifecycleEventType.ACQUIRE,
    DriveLifecycleEventType.PROVISION,
    DriveLifecycleEventType.FAIL,
  ],
  [DriveLifecycleState.IN_RMA]: [
    DriveLifecycleEventType.ACQUIRE,
    DriveLifecycleEventType.PROVISION,
    DriveLifecycleEventType.FAIL,
    DriveLifecycleEventType.RMA_INITIATE,
  ],
  [DriveLifecycleState.RETIRED]: [
    DriveLifecycleEventType.ACQUIRE,
    DriveLifecycleEventType.PROVISION,
    DriveLifecycleEventType.RETIRE,
  ],
  [DriveLifecycleState.SCRAPPED]: [
    DriveLifecycleEventType.ACQUIRE,
    DriveLifecycleEventType.PROVISION,
    DriveLifecycleEventType.RETIRE,
    DriveLifecycleEventType.SCRAP_SHRED,
  ],
  [DriveLifecycleState.REPLACED]: [
    DriveLifecycleEventType.ACQUIRE,
    DriveLifecycleEventType.PROVISION,
    DriveLifecycleEventType.FAIL,
    DriveLifecycleEventType.RMA_INITIATE,
    DriveLifecycleEventType.RMA_REPLACE,
  ],
  [DriveLifecycleState.LOST]: [
    DriveLifecycleEventType.ACQUIRE,
    DriveLifecycleEventType.PROVISION,
    DriveLifecycleEventType.LOST,
  ],
};

const history = (events: DriveLifecycleEventType[]) =>
  events.map((eventType) => ({ eventType }));

describe('drive lifecycle state machine', () => {
  describe('coverage guards', () => {
    it('has an expectation row for every state', () => {
      expect(Object.keys(EXPECTED_ALLOWED).sort()).toEqual(
        [...ALL_STATES].sort(),
      );
      expect(Object.keys(REPRESENTATIVE_HISTORY).sort()).toEqual(
        [...ALL_STATES].sort(),
      );
    });

    it('classifies every event as informational or state-changing', () => {
      const mapped = Object.keys(EXPECTED_STATE_BY_EVENT);
      const classified = [...mapped, ...INFORMATIONAL].sort();
      expect(classified).toEqual([...ALL_EVENTS].sort());
      expect(
        mapped.some((event) =>
          INFORMATIONAL.has(event as DriveLifecycleEventType),
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

  describe('canTransition — full state × event matrix', () => {
    for (const state of ALL_STATES) {
      it(`allows exactly the expected events from ${state}`, () => {
        for (const event of ALL_EVENTS) {
          const expected =
            INFORMATIONAL.has(event) || EXPECTED_ALLOWED[state].includes(event);
          expect(canTransition(state, event), `${state} + ${event}`).toBe(
            expected,
          );
        }
      });
    }
  });

  describe('allowedEventsFor', () => {
    for (const state of ALL_STATES) {
      it(`returns the expected state-changing row for ${state}`, () => {
        expect([...allowedEventsFor(state)].sort()).toEqual(
          [...EXPECTED_ALLOWED[state]].sort(),
        );
      });
    }
  });

  describe('stateForEvent', () => {
    it('defaults to UNRECEIVED', () => {
      expect(stateForEvent(DriveLifecycleEventType.ACQUIRE)).toBe(
        DriveLifecycleState.RECEIVED,
      );
      expect(stateForEvent(DriveLifecycleEventType.INSPECT)).toBe(
        DriveLifecycleState.UNRECEIVED,
      );
    });

    it('maps every state-changing event to its expected state', () => {
      for (const event of ALL_EVENTS) {
        if (INFORMATIONAL.has(event)) continue;
        expect(stateForEvent(event), event).toBe(
          EXPECTED_STATE_BY_EVENT[event],
        );
      }
    });

    it('keeps the current state for informational events', () => {
      for (const state of ALL_STATES) {
        for (const event of INFORMATIONAL) {
          expect(stateForEvent(event, state), `${event} from ${state}`).toBe(
            state,
          );
        }
      }
    });
  });

  describe('deriveStateFromEvents', () => {
    it('returns UNRECEIVED for an empty history', () => {
      expect(deriveStateFromEvents([])).toBe(DriveLifecycleState.UNRECEIVED);
    });

    it('handles a single event of every type', () => {
      for (const event of ALL_EVENTS) {
        expect(deriveStateFromEvents([{ eventType: event }]), event).toBe(
          INFORMATIONAL.has(event)
            ? DriveLifecycleState.UNRECEIVED
            : EXPECTED_STATE_BY_EVENT[event],
        );
      }
    });

    it('derives each representative history to its state', () => {
      for (const state of ALL_STATES) {
        expect(
          deriveStateFromEvents(history(REPRESENTATIVE_HISTORY[state])),
          state,
        ).toBe(state);
      }
    });

    it('derives the happy path: acquisition → provisioning → failure → RMA replacement', () => {
      expect(
        deriveStateFromEvents(
          history([
            DriveLifecycleEventType.ACQUIRE,
            DriveLifecycleEventType.PROVISION,
            DriveLifecycleEventType.DEGRADE,
            DriveLifecycleEventType.FAIL,
            DriveLifecycleEventType.RMA_INITIATE,
            DriveLifecycleEventType.RMA_SHIP,
            DriveLifecycleEventType.RMA_APPROVE,
            DriveLifecycleEventType.RMA_REPLACE,
          ]),
        ),
      ).toBe(DriveLifecycleState.REPLACED);
    });

    it('derives the rejected-RMA path back to FAILED', () => {
      expect(
        deriveStateFromEvents(
          history([
            DriveLifecycleEventType.ACQUIRE,
            DriveLifecycleEventType.PROVISION,
            DriveLifecycleEventType.FAIL,
            DriveLifecycleEventType.RMA_INITIATE,
            DriveLifecycleEventType.RMA_REJECT,
          ]),
        ),
      ).toBe(DriveLifecycleState.FAILED);
    });

    it('derives retirement → scrap and the lost path', () => {
      expect(
        deriveStateFromEvents(
          history([
            DriveLifecycleEventType.ACQUIRE,
            DriveLifecycleEventType.PROVISION,
            DriveLifecycleEventType.RETIRE,
            DriveLifecycleEventType.SCRAP_SHRED,
          ]),
        ),
      ).toBe(DriveLifecycleState.SCRAPPED);

      expect(
        deriveStateFromEvents(
          history([
            DriveLifecycleEventType.ACQUIRE,
            DriveLifecycleEventType.LOST,
          ]),
        ),
      ).toBe(DriveLifecycleState.LOST);
    });

    it('ignores informational events anywhere in the history', () => {
      expect(
        deriveStateFromEvents(
          history([
            DriveLifecycleEventType.ACQUIRE,
            DriveLifecycleEventType.NOTE,
            DriveLifecycleEventType.PROVISION,
            DriveLifecycleEventType.INSPECT,
            DriveLifecycleEventType.FAIL,
            DriveLifecycleEventType.NOTE,
          ]),
        ),
      ).toBe(DriveLifecycleState.FAILED);
    });
  });

  describe('transition / derivation consistency', () => {
    for (const state of ALL_STATES) {
      it(`appending a legal event to a ${state} history derives the mapped state`, () => {
        const base = REPRESENTATIVE_HISTORY[state];
        for (const event of ALL_EVENTS) {
          if (!canTransition(state, event)) continue;
          expect(
            deriveStateFromEvents([...history(base), { eventType: event }]),
            `${state} + ${event}`,
          ).toBe(stateForEvent(event, state));
        }
      });
    }
  });

  describe('terminal states', () => {
    it('flags exactly the expected terminal states', () => {
      for (const state of ALL_STATES) {
        expect(isTerminalState(state), state).toBe(TERMINAL.has(state));
      }
    });

    it('allows only informational events from terminal states', () => {
      for (const state of TERMINAL) {
        expect(allowedEventsFor(state), state).toHaveLength(0);
        for (const event of ALL_EVENTS) {
          expect(canTransition(state, event), `${state} + ${event}`).toBe(
            INFORMATIONAL.has(event),
          );
        }
      }
    });
  });
});
