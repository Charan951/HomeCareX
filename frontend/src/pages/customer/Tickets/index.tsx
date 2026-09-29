import { EmptyState } from "@/components/customer";
import PageShell from "@/components/layout/PageShell";

/** Placeholder — My Tickets is built in a later customer module. */
export default function Tickets() {
  return (
    <PageShell title="My Tickets" description="Track the support tickets you've raised.">
      <EmptyState title="No tickets yet" description="When you raise a support request it will show up here." />
    </PageShell>
  );
}
