import { EventEmitter } from 'events';

export const EVENTS = {
  JOB_COMPLETED: 'job.completed',
} as const;

/** Emitted once a booking reaches `completed`. `gross` is what the customer paid for the job (INR). */
export interface JobCompletedPayload {
  bookingId: string;
  /** Partner._id (not the User id). */
  partnerId: string;
  gross: number;
  completedAt: Date;
}

interface EventMap {
  [EVENTS.JOB_COMPLETED]: [JobCompletedPayload];
}

class TypedBus {
  private readonly emitter = new EventEmitter();

  on<K extends keyof EventMap>(event: K, handler: (...args: EventMap[K]) => void | Promise<void>): void {
    this.emitter.on(event, (...args: EventMap[K]) => {
      // A failing listener must never crash the process or the request that emitted the event.
      Promise.resolve()
        .then(() => handler(...args))
        .catch((err) => console.error(`[events] listener for "${event}" failed`, err));
    });
  }

  emit<K extends keyof EventMap>(event: K, ...args: EventMap[K]): void {
    this.emitter.emit(event, ...args);
  }

  removeAll(): void {
    this.emitter.removeAllListeners();
  }
}

export const eventBus = new TypedBus();

/** Call this from the code path that moves a booking to `completed`. */
export const emitJobCompleted = (payload: JobCompletedPayload): void => eventBus.emit(EVENTS.JOB_COMPLETED, payload);