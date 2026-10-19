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

describe('warranty claim state machine', () => {
  describe('informational events', () => {
    it('classifies NOTE as informational', () => {
      expect(isInformationalEvent(WarrantyClaimEventType.NOTE)).toBe(true);
      expect(isStateChangingEvent(WarrantyClaimEventType.APPROVED)).toBe(true);
    });

    it('never changes status and is always allowed, even when closed', () => {
      expect(
        statusForEvent(WarrantyClaimEventType.NOTE, WarrantyClaimStatus.CLOSED),
      ).toBe(WarrantyClaimStatus.CLOSED);
      expect(
        canTransition(WarrantyClaimStatus.CLOSED, WarrantyClaimEventType.NOTE),
      ).toBe(true);
    });
  });

  describe('statusForEvent', () => {
    it('maps each state-changing event to its resulting status', () => {
      expect(statusForEvent(WarrantyClaimEventType.SHIPPED_TO_VENDOR)).toBe(
        WarrantyClaimStatus.SHIPPED_TO_VENDOR,
      );
      expect(statusForEvent(WarrantyClaimEventType.APPROVED)).toBe(
        WarrantyClaimStatus.APPROVED,
      );
      expect(statusForEvent(WarrantyClaimEventType.REJECTED)).toBe(
        WarrantyClaimStatus.REJECTED,
      );
      expect(statusForEvent(WarrantyClaimEventType.REPLACEMENT_RECEIVED)).toBe(
        WarrantyClaimStatus.REPLACEMENT_RECEIVED,
      );
      expect(statusForEvent(WarrantyClaimEventType.CLOSED)).toBe(
        WarrantyClaimStatus.CLOSED,
      );
    });
  });

  describe('deriveStatusFromEvents', () => {
    it('folds an ordered event list into the final status', () => {
      expect(
        deriveStatusFromEvents([
          { eventType: WarrantyClaimEventType.SHIPPED_TO_VENDOR },
          { eventType: WarrantyClaimEventType.APPROVED },
          { eventType: WarrantyClaimEventType.REPLACEMENT_RECEIVED },
          { eventType: WarrantyClaimEventType.CLOSED },
        ]),
      ).toBe(WarrantyClaimStatus.CLOSED);
    });

    it('defaults to SUBMITTED for an empty history', () => {
      expect(deriveStatusFromEvents([])).toBe(WarrantyClaimStatus.SUBMITTED);
    });

    it('ignores informational events when folding', () => {
      expect(
        deriveStatusFromEvents([
          { eventType: WarrantyClaimEventType.SHIPPED_TO_VENDOR },
          { eventType: WarrantyClaimEventType.NOTE },
        ]),
      ).toBe(WarrantyClaimStatus.SHIPPED_TO_VENDOR);
    });
  });

  describe('canTransition', () => {
    it('allows shipping from SUBMITTED but not receiving a replacement directly', () => {
      expect(
        canTransition(
          WarrantyClaimStatus.SUBMITTED,
          WarrantyClaimEventType.SHIPPED_TO_VENDOR,
        ),
      ).toBe(true);
      expect(
        canTransition(
          WarrantyClaimStatus.SUBMITTED,
          WarrantyClaimEventType.REPLACEMENT_RECEIVED,
        ),
      ).toBe(false);
    });

    it('requires approval before a replacement can be received', () => {
      expect(
        canTransition(
          WarrantyClaimStatus.APPROVED,
          WarrantyClaimEventType.REPLACEMENT_RECEIVED,
        ),
      ).toBe(true);
      expect(
        canTransition(
          WarrantyClaimStatus.SHIPPED_TO_VENDOR,
          WarrantyClaimEventType.REPLACEMENT_RECEIVED,
        ),
      ).toBe(false);
    });

    it('treats CLOSED as terminal', () => {
      expect(isTerminalStatus(WarrantyClaimStatus.CLOSED)).toBe(true);
      expect(allowedEventsFor(WarrantyClaimStatus.CLOSED)).toHaveLength(0);
      expect(
        canTransition(
          WarrantyClaimStatus.CLOSED,
          WarrantyClaimEventType.APPROVED,
        ),
      ).toBe(false);
    });
  });
});
