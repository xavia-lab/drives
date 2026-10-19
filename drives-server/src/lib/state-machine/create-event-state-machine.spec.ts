import { describe, it, expect } from 'vitest';
import { createEventStateMachine } from './create-event-state-machine';

// --- A tiny toy machine used to exercise the generic factory ------------------

type ToyState = 'IDLE' | 'RUNNING' | 'DONE' | 'FAILED';
type ToyEvent = 'START' | 'FINISH' | 'FAIL' | 'RESET' | 'NOTE' | 'INSPECT';
type ToyInformational = 'NOTE' | 'INSPECT';

const createToyMachine = () =>
  createEventStateMachine<ToyState, ToyEvent, ToyInformational>({
    initialState: 'IDLE',
    informationalEvents: ['NOTE', 'INSPECT'],
    stateByEvent: {
      START: 'RUNNING',
      FINISH: 'DONE',
      FAIL: 'FAILED',
      RESET: 'IDLE',
    },
    transitions: {
      IDLE: ['START'],
      RUNNING: ['FINISH', 'FAIL', 'RESET'],
      DONE: [],
      FAILED: ['RESET'],
    },
    terminalStates: ['DONE'],
  });

const ALL_STATES: ToyState[] = ['IDLE', 'RUNNING', 'DONE', 'FAILED'];
const ALL_EVENTS: ToyEvent[] = [
  'START',
  'FINISH',
  'FAIL',
  'RESET',
  'NOTE',
  'INSPECT',
];

describe('createEventStateMachine', () => {
  describe('exposed configuration', () => {
    it('exposes the initial state, states, events, informational events and terminals', () => {
      const machine = createToyMachine();

      expect(machine.initialState).toBe('IDLE');
      expect([...machine.states].sort()).toEqual([...ALL_STATES].sort());
      expect([...machine.events].sort()).toEqual([...ALL_EVENTS].sort());
      expect(new Set(machine.events).size).toBe(machine.events.length);
      expect(machine.informationalEvents).toEqual(['NOTE', 'INSPECT']);
      expect(machine.terminalStates).toEqual(['DONE']);
    });

    it('deduplicates an event that appears in both the informational list and a transitions row', () => {
      const machine = createEventStateMachine<
        ToyState,
        ToyEvent,
        ToyInformational
      >({
        initialState: 'IDLE',
        informationalEvents: ['NOTE', 'INSPECT'],
        stateByEvent: {
          START: 'RUNNING',
          FINISH: 'DONE',
          FAIL: 'FAILED',
          RESET: 'IDLE',
        },
        transitions: {
          IDLE: ['START', 'NOTE'],
          RUNNING: ['FINISH', 'FAIL', 'RESET'],
          DONE: [],
          FAILED: ['RESET'],
        },
        terminalStates: ['DONE'],
      });

      expect(machine.events.filter((event) => event === 'NOTE')).toHaveLength(
        1,
      );
      // allowedEventsFor returns the configured row verbatim.
      expect(machine.allowedEventsFor('IDLE')).toEqual(['START', 'NOTE']);
    });

    it('supports a machine with no informational events and no terminal states', () => {
      type State = 'A' | 'B';
      type Event = 'GO' | 'BACK';

      const machine = createEventStateMachine<State, Event>({
        initialState: 'A',
        informationalEvents: [],
        stateByEvent: { GO: 'B', BACK: 'A' },
        transitions: { A: ['GO'], B: ['BACK'] },
        terminalStates: [],
      });

      expect(machine.informationalEvents).toEqual([]);
      expect(machine.terminalStates).toEqual([]);
      expect([...machine.events].sort()).toEqual(['BACK', 'GO']);
      expect(machine.isTerminalState('A')).toBe(false);
      expect(machine.canTransition('A', 'BACK')).toBe(false);
      expect(machine.canTransition('A', 'GO')).toBe(true);
    });
  });

  describe('isInformationalEvent / isStateChangingEvent', () => {
    it('classifies every event', () => {
      const machine = createToyMachine();

      for (const event of ALL_EVENTS) {
        const informational = event === 'NOTE' || event === 'INSPECT';
        expect(machine.isInformationalEvent(event), event).toBe(informational);
        expect(machine.isStateChangingEvent(event), event).toBe(!informational);
      }
    });
  });

  describe('isTerminalState', () => {
    it('flags only configured terminal states', () => {
      const machine = createToyMachine();

      for (const state of ALL_STATES) {
        expect(machine.isTerminalState(state), state).toBe(state === 'DONE');
      }
    });
  });

  describe('stateForEvent', () => {
    it('maps state-changing events to their resulting state', () => {
      const machine = createToyMachine();

      expect(machine.stateForEvent('START')).toBe('RUNNING');
      expect(machine.stateForEvent('FINISH')).toBe('DONE');
      expect(machine.stateForEvent('FAIL')).toBe('FAILED');
      expect(machine.stateForEvent('RESET')).toBe('IDLE');
    });

    it('keeps the current state for informational events', () => {
      const machine = createToyMachine();

      expect(machine.stateForEvent('NOTE', 'RUNNING')).toBe('RUNNING');
      expect(machine.stateForEvent('INSPECT', 'DONE')).toBe('DONE');
    });

    it('defaults the current state to the initial state', () => {
      const machine = createToyMachine();

      expect(machine.stateForEvent('NOTE')).toBe('IDLE');
      expect(machine.stateForEvent('INSPECT')).toBe('IDLE');
    });
  });

  describe('deriveStateFromEvents', () => {
    it('returns the initial state for an empty history', () => {
      expect(createToyMachine().deriveStateFromEvents([])).toBe('IDLE');
    });

    it('folds events in order', () => {
      const machine = createToyMachine();

      expect(
        machine.deriveStateFromEvents([
          { eventType: 'START' },
          { eventType: 'FINISH' },
        ]),
      ).toBe('DONE');

      expect(
        machine.deriveStateFromEvents([
          { eventType: 'START' },
          { eventType: 'FAIL' },
          { eventType: 'RESET' },
          { eventType: 'START' },
        ]),
      ).toBe('RUNNING');
    });

    it('ignores informational events wherever they appear', () => {
      const machine = createToyMachine();

      expect(
        machine.deriveStateFromEvents([
          { eventType: 'NOTE' },
          { eventType: 'START' },
          { eventType: 'INSPECT' },
          { eventType: 'FINISH' },
          { eventType: 'NOTE' },
        ]),
      ).toBe('DONE');

      expect(machine.deriveStateFromEvents([{ eventType: 'INSPECT' }])).toBe(
        'IDLE',
      );
    });

    it('does not mutate the input history', () => {
      const machine = createToyMachine();
      const events = [{ eventType: 'START' as const }];
      const copy = [...events];

      machine.deriveStateFromEvents(events);

      expect(events).toEqual(copy);
    });
  });

  describe('allowedEventsFor', () => {
    it('returns the configured state-changing row for every state', () => {
      const machine = createToyMachine();

      expect(machine.allowedEventsFor('IDLE')).toEqual(['START']);
      expect([...machine.allowedEventsFor('RUNNING')].sort()).toEqual(
        ['FAIL', 'FINISH', 'RESET'].sort(),
      );
      expect(machine.allowedEventsFor('DONE')).toEqual([]);
      expect(machine.allowedEventsFor('FAILED')).toEqual(['RESET']);
    });

    it('returns an empty list for an unknown state', () => {
      const machine = createToyMachine();

      expect(machine.allowedEventsFor('UNKNOWN' as ToyState)).toEqual([]);
    });
  });

  describe('canTransition', () => {
    it('allows legal and rejects illegal state-changing transitions', () => {
      const machine = createToyMachine();

      expect(machine.canTransition('IDLE', 'START')).toBe(true);
      expect(machine.canTransition('RUNNING', 'FINISH')).toBe(true);
      expect(machine.canTransition('FAILED', 'RESET')).toBe(true);

      expect(machine.canTransition('IDLE', 'FINISH')).toBe(false);
      expect(machine.canTransition('DONE', 'START')).toBe(false);
      expect(machine.canTransition('FAILED', 'START')).toBe(false);
    });

    it('always allows informational events, even from terminal states', () => {
      const machine = createToyMachine();

      for (const state of ALL_STATES) {
        expect(machine.canTransition(state, 'NOTE'), state).toBe(true);
        expect(machine.canTransition(state, 'INSPECT'), state).toBe(true);
      }
    });

    it('agrees with the full state × event matrix', () => {
      const machine = createToyMachine();

      const expected: Record<ToyState, ToyEvent[]> = {
        IDLE: ['START'],
        RUNNING: ['FINISH', 'FAIL', 'RESET'],
        DONE: [],
        FAILED: ['RESET'],
      };
      const informational = new Set<ToyEvent>(['NOTE', 'INSPECT']);

      for (const state of ALL_STATES) {
        for (const event of ALL_EVENTS) {
          expect(
            machine.canTransition(state, event),
            `${state} + ${event}`,
          ).toBe(informational.has(event) || expected[state].includes(event));
        }
      }
    });
  });

  describe('machine isolation', () => {
    it('creates independent machines with no shared mutable state', () => {
      const first = createToyMachine();
      const second = createToyMachine();

      expect(first).not.toBe(second);
      expect(first.states).not.toBe(second.states);
      expect(first.canTransition('IDLE', 'START')).toBe(true);
      expect(second.canTransition('DONE', 'START')).toBe(false);
    });
  });
});
