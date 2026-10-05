import { EVENTS ,eventBus} from '../events/eventBus';
import { earningsService } from './earnings.service';

let registered = false;

/** Subscribes the earnings module to job.completed. Safe to call more than once. */
export function registerEarningsListeners(): void {
  if (registered) return;
  registered = true;
  eventBus.on(EVENTS.JOB_COMPLETED, async (payload) => {
    await earningsService.recordJobCompleted(payload);
  });
}