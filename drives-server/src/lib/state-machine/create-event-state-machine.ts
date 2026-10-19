// A tiny, dependency-free, table-driven state machine used by the append-only
// event ledgers (drive lifecycle, warranty claims, ...).
//
// It is intentionally NOT an actor/typestate runtime: the source of truth is
// the persisted event log, so the machine only maps events to states and
// validates transitions for a state that callers derive from that log.

export interface EventStateMachineConfig<
  S extends string,
  E extends string,
  I extends E,
> {
  /** State when no state-changing events have been recorded. */
  initialState: S;
  /** Events that annotate the log without changing state. */
  informationalEvents: readonly I[];
  /** Resulting state for every state-changing event (compile-time exhaustive). */
  stateByEvent: Record<Exclude<E, I>, S>;
  /** Allowed state-changing events per state (compile-time exhaustive). */
  transitions: Record<S, readonly E[]>;
  /** States with no outgoing state-changing transitions. */
  terminalStates: readonly S[];
}

export interface EventStateMachine<S extends string, E extends string> {
  readonly initialState: S;
  readonly states: readonly S[];
  readonly events: readonly E[];
  readonly informationalEvents: readonly E[];
  readonly terminalStates: readonly S[];
  isInformationalEvent(this: void, eventType: E): boolean;
  isStateChangingEvent(this: void, eventType: E): boolean;
  isTerminalState(this: void, state: S): boolean;
  /**
   * The state an event moves into. Informational events keep `currentState`.
   */
  stateForEvent(this: void, eventType: E, currentState?: S): S;
  /** Folds an ordered (oldest first) event list into the current state. */
  deriveStateFromEvents(this: void, events: readonly { eventType: E }[]): S;
  /**
   * The state-changing events allowed from `state`. Informational events are
   * always allowed and deliberately not included (see `canTransition`).
   */
  allowedEventsFor(this: void, state: S): readonly E[];
  canTransition(this: void, state: S, eventType: E): boolean;
}

export function createEventStateMachine<
  S extends string,
  E extends string,
  I extends E = never,
>(config: EventStateMachineConfig<S, E, I>): EventStateMachine<S, E> {
  const {
    initialState,
    informationalEvents,
    stateByEvent,
    transitions,
    terminalStates,
  } = config;

  const informationalSet = new Set<E>(informationalEvents);
  const terminalSet = new Set<S>(terminalStates);
  const states = Object.keys(transitions) as S[];
  const events = Array.from(
    new Set<E>([...informationalEvents, ...(Object.keys(stateByEvent) as E[])]),
  );
  // Informational events have no entry, but `stateForEvent` short-circuits
  // before reading them.
  const stateByEventLookup = stateByEvent as Partial<Record<E, S>>;

  const isInformationalEvent = (eventType: E): boolean =>
    informationalSet.has(eventType);

  const isStateChangingEvent = (eventType: E): boolean =>
    !informationalSet.has(eventType);

  const isTerminalState = (state: S): boolean => terminalSet.has(state);

  const stateForEvent = (eventType: E, currentState: S = initialState): S => {
    if (isInformationalEvent(eventType)) {
      return currentState;
    }
    return stateByEventLookup[eventType] ?? currentState;
  };

  const deriveStateFromEvents = (events: readonly { eventType: E }[]): S =>
    events.reduce(
      (state, event) => stateForEvent(event.eventType, state),
      initialState,
    );

  const allowedEventsFor = (state: S): readonly E[] => transitions[state] ?? [];

  const canTransition = (state: S, eventType: E): boolean => {
    if (isInformationalEvent(eventType)) {
      return true;
    }
    return allowedEventsFor(state).includes(eventType);
  };

  return {
    initialState,
    states,
    events,
    informationalEvents,
    terminalStates,
    isInformationalEvent,
    isStateChangingEvent,
    isTerminalState,
    stateForEvent,
    deriveStateFromEvents,
    allowedEventsFor,
    canTransition,
  };
}
