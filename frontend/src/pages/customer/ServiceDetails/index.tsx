import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { OfflineState, ErrorState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useService } from "@/hooks/useService";
import { customerPath } from "@/routes/customerPath";
import { Icon3D, serviceVisual } from "@/pages/customer/Shared/visuals";
import type { ServiceDetail } from "@/types/catalog";
import AddOnList from "./components/AddOnList";
import FaqAccordion from "./components/FaqAccordion";
import Gallery from "./components/Gallery";
import InclusionList from "./components/InclusionList";
import ReviewPreview from "./components/ReviewPreview";
import SectionNav, { type SectionLink } from "./components/SectionNav";
import ServiceDetailsSkeleton from "./components/ServiceDetailsSkeleton";
import MobileInfo from "./components/MobileInfo";
import ServiceInfo from "./components/ServiceInfo";
import StickyCTA, { StickyCTASpacer } from "./components/StickyCTA";
import ServiceNotFound from "./components/ServiceNotFound";

const COLLAPSED_CHARS = 240;

function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!text.trim()) return null;
  const long = text.length > COLLAPSED_CHARS;
  return (
    <section id="overview" aria-labelledby="overview-title" className="scroll-mt-40">
      <h2 id="overview-title" className="text-xl font-bold tracking-tight text-ink md:text-2xl">
        About this service
      </h2>
      <p className={clsx("mt-3 max-w-[68ch] text-[15px] leading-7 text-ink/80", long && !expanded && "line-clamp-4")}>{text}</p>
      {long && (
        <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className={clsx("mt-2 rounded text-sm font-semibold text-brand underline-offset-4 hover:underline", FOCUS_RING)}>
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </section>
  );
}

function Details({ service: s }: { service: ServiceDetail }) {
  const visual = serviceVisual(s.slug, s.category.slug);
  const photos = s.media.length > 0 ? s.media : visual.image ? [{ url: visual.image, alt: s.name }] : [];

  const sections = useMemo<SectionLink[]>(() => {
    const list: SectionLink[] = [];
    if (s.description.trim()) list.push({ id: "overview", label: "Overview" });
    if (s.inclusions.length > 0 || s.exclusions.length > 0) list.push({ id: "included", label: "Included" });
    if (s.addOns.length > 0) list.push({ id: "add-ons", label: "Add-ons" });
    if (s.faqs.length > 0) list.push({ id: "faqs", label: "FAQs" });
    list.push({ id: "reviews", label: "Reviews" });
    return list;
  }, [s.description, s.inclusions.length, s.exclusions.length, s.addOns.length, s.faqs.length]);

  return (
    <div className="mx-auto max-w-[1280px]">
      <Link
        to={customerPath("/services")}
        className={clsx("inline-flex min-h-[40px] items-center gap-2 rounded-full text-sm font-semibold text-muted transition-colors hover:text-brand", FOCUS_RING)}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to services
      </Link>

      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px] xl:gap-8">
        <div className="min-w-0 xl:col-start-1 xl:row-start-1">
          <Gallery
            name={s.name}
            items={photos}
            placeholder={
              <div className={clsx("flex h-full w-full items-center justify-center", visual.tint)}>
                <Icon3D asset={visual.asset} emoji={s.icon} className="h-32 w-32" />
              </div>
            }
          />
          {/* Phones: info sits straight under the gallery (no card); the sticky bar below holds the only Book now. */}
          <div className="mt-4">
            <MobileInfo service={s} />
          </div>
        </div>

        <aside aria-label="Pricing and booking" className="hidden min-w-0 xl:sticky xl:top-[92px] xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:block xl:self-start">
          <ServiceInfo service={s} />
        </aside>

        <div className="min-w-0 space-y-10 xl:col-start-1 xl:row-start-2">
          <SectionNav sections={sections} />
          <Description text={s.description} />
          <InclusionList inclusions={s.inclusions} exclusions={s.exclusions} />
          <AddOnList addOns={s.addOns} />
          {/* Tablet: the booking card sits just above the FAQs. Phones use MobileInfo + the sticky bar; xl uses the side column. */}
          <div className="hidden md:block xl:hidden">
            <ServiceInfo service={s} />
          </div>
          <FaqAccordion faqs={s.faqs} />
          <ReviewPreview serviceId={s.id} />
        </div>
      </div>

      <StickyCTASpacer />
      <StickyCTA slug={s.slug} name={s.name} price={s.basePrice} />
    </div>
  );
}

/** /customer/services/:slug. One call loads everything; reviews load separately so a slow or failed reviews call never blanks the page. */
export default function ServiceDetails() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isPending, isError, error, refetch } = useService(slug);
  const online = useOnlineStatus();
  const name = data?.name;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  useEffect(() => {
    if (!name) return;
    const previous = document.title;
    document.title = `${name} | HomeCareX`;
    return () => {
      document.title = previous;
    };
  }, [name]);

  if (!slug) return <ServiceNotFound />;
  if (isPending) return <ServiceDetailsSkeleton />;
  if (isError || !data) {
    if (error?.status === 404) return <ServiceNotFound />;
    return !online || error?.code === "NETWORK_ERROR" ? (
      <OfflineState onRetry={() => void refetch()} />
    ) : (
      <ErrorState title="We couldn't load this service" message={error?.message} onRetry={() => void refetch()} />
    );
  }
  return <Details service={data} key={data.id} />;
}
