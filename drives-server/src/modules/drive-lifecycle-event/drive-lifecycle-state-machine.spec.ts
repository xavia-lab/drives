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

describe('drive lifecycle state machine', () => {
  describe('informational events', () => {
    it('classifies INSPECT and NOTE as informational', () => {
      expect(isInformationalEvent(DriveLifecycleEventType.INSPECT)).toBe(true);
      expect(isInformationalEvent(DriveLifecycleEventType.NOTE)).toBe(true);
      expect(isStateChangingEvent(DriveLifecycleEventType.FAIL)).toBe(true);
    });

    it('never changes state and is always allowed, even from terminal states', () => {
      expect(
        stateForEvent(
          DriveLifecycleEventType.NOTE,
          DriveLifecycleState.SCRAPPED,
        ),
      ).toBe(DriveLifecycleState.SCRAPPED);
      expect(
        canTransition(DriveLifecycleState.LOST, DriveLifecycleEventType.NOTE),
      ).toBe(true);
    });
  });

  describe('stateForEvent', () => {
    it('maps each state-changing event to its resulting state', () => {
      expect(stateForEvent(DriveLifecycleEventType.ACQUIRE)).toBe(
        DriveLifecycleState.RECEIVED,
      );
      expect(stateForEvent(DriveLifecycleEventType.PROVISION)).toBe(
        DriveLifecycleState.IN_SERVICE,
      );
      expect(stateForEvent(DriveLifecycleEventType.DEPROVISION)).toBe(
        DriveLifecycleState.IN_INVENTORY,
      );
      expect(stateForEvent(DriveLifecycleEventType.FAIL)).toBe(
        DriveLifecycleState.FAILED,
      );
      expect(stateForEvent(DriveLifecycleEventType.RMA_REJECT)).toBe(
        DriveLifecycleState.FAILED,
      );
      expect(stateForEvent(DriveLifecycleEventType.RMA_REPLACE)).toBe(
        DriveLifecycleState.REPLACED,
      );
      expect(stateForEvent(DriveLifecycleEventType.RMA_CLOSE)).toBe(
        DriveLifecycleState.RETIRED,
      );
      expect(stateForEvent(DriveLifecycleEventType.SCRAP_SHRED)).toBe(
        DriveLifecycleState.SCRAPPED,
      );
      expect(stateForEvent(DriveLifecycleEventType.LOST)).toBe(
        DriveLifecycleState.LOST,
      );
    });
  });

  describe('deriveStateFromEvents', () => {
    it('folds an ordered event list into the final state', () => {
      expect(
        deriveStateFromEvents([
          { eventType: DriveLifecycleEventType.ACQUIRE },
          { eventType: DriveLifecycleEventType.PROVISION },
          { eventType: DriveLifecycleEventType.DEGRADE },
          { eventType: DriveLifecycleEventType.RECOVER },
        ]),
      ).toBe(DriveLifecycleState.IN_INVENTORY);
    });

    it('defaults to UNRECEIVED for an empty history', () => {
      expect(deriveStateFromEvents([])).toBe(DriveLifecycleState.UNRECEIVED);
    });

    it('ignores informational events when folding', () => {
      expect(
        deriveStateFromEvents([
          { eventType: DriveLifecycleEventType.ACQUIRE },
          { eventType: DriveLifecycleEventType.NOTE },
        ]),
      ).toBe(DriveLifecycleState.RECEIVED);
    });
  });

  describe('canTransition', () => {
    it('allows only ACQUIRE from UNRECEIVED', () => {
      expect(
        canTransition(
          DriveLifecycleState.UNRECEIVED,
          DriveLifecycleEventType.ACQUIRE,
        ),
      ).toBe(true);
      expect(
        canTransition(
          DriveLifecycleState.UNRECEIVED,
          DriveLifecycleEventType.PROVISION,
        ),
      ).toBe(false);
    });

    it('allows the full RMA cycle from IN_RMA', () => {
      for (const event of [
        DriveLifecycleEventType.RMA_SHIP,
        DriveLifecycleEventType.RMA_APPROVE,
        DriveLifecycleEventType.RMA_REJECT,
        DriveLifecycleEventType.RMA_REPLACE,
        DriveLifecycleEventType.RMA_CLOSE,
      ]) {
        expect(canTransition(DriveLifecycleState.IN_RMA, event)).toBe(true);
      }
    });

    it('rejects every state-changing event from terminal states', () => {
      for (const state of [
        DriveLifecycleState.SCRAPPED,
        DriveLifecycleState.REPLACED,
        DriveLifecycleState.LOST,
      ]) {
        expect(isTerminalState(state)).toBe(true);
        expect(allowedEventsFor(state)).toHaveLength(0);
        expect(canTransition(state, DriveLifecycleEventType.PROVISION)).toBe(
          false,
        );
      }
    });
  });
});
