import React from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { CalendarCog, Database, Flag, GitBranch, Timer } from "lucide-react";
import { MarketingHeader } from "../components/MarketingHeader";
import { Footer } from "../components/Footer";

const timelineItems = [
  {
    title: "The Foundation",
    label: "",
    description:
      "Rebuild Calendly from scratch to understand real product logic beyond standard CRUD operations.",
    icon: Flag,
    side: "left",
    tone: "text-blue-700 border-blue-600",
  },
  {
    title: "The Booking Challenge",
    label: "Flow",
    description:
      "Designing a multi-step flow requiring event selection, date picking, email verification, and rigorous conflict checks before confirmation.",
    icon: GitBranch,
    side: "right",
    tone: "text-blue-700 border-blue-600",
  },
  {
    title: "Relational Architecture",
    label: "Data",
    description:
      "Structured relational design in Supabase, carefully linking user profiles, event types, dynamic schedules, and final bookings.",
    icon: Database,
    side: "left",
    tone: "text-teal-700 border-teal-600",
  },
  {
    title: "The Timezone Problem",
    label: "Logic",
    description:
      "Mastering the complexities of local versus UTC time conversions across the stack using date-fns-tz to ensure seamless cross-global booking.",
    icon: Timer,
    side: "right",
    tone: "text-orange-700 border-orange-600",
  },
];

export default function CaseStudiesPage() {
  const timelineRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 70%", "end 45%"],
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.25,
  });

  return (
    <main className="min-h-screen bg-[#f7f9ff] text-slate-950">
      <MarketingHeader />

      <section className="px-4 py-20 md:px-5">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-[11px] font-extrabold uppercase tracking-wide text-blue-700">
              <CalendarCog className="h-3.5 w-3.5" />
              Case Study
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-normal text-slate-950 md:text-5xl">
              How I Built a Calendly Clone as a Full-Stack Developer.
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              A personal case study on going from isolated features to a
              complete, deployable product.
            </p>
          </div>

          <div
            ref={timelineRef}
            className="relative mx-auto mt-12 max-w-4xl pb-10"
          >
            <div className="absolute bottom-[140px] left-5 top-[120px] w-px bg-slate-200 md:left-1/2 md:-translate-x-1/2" />
            <motion.div
              className="absolute -bottom-[80px] left-5 top-[120px] w-0.5 origin-top bg-blue-600 md:left-1/2 md:-translate-x-1/2"
              style={{ scaleY }}
            />

            <div className="space-y-14">
              {timelineItems.map((item) => {
                const Icon = item.icon;
                const isLeft = item.side === "left";
                return (
                  <div key={item.title} className="relative min-h-[240px]">
                    <div
                      className={`flex min-h-[240px] items-center pl-14 md:pl-0 ${
                        isLeft ? "md:justify-start" : "md:justify-end"
                      }`}
                    >
                      <div className="w-full md:w-[42%]">
                        <TimelineCard item={item} />
                      </div>
                    </div>

                    <div className="absolute left-5 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 md:left-1/2">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white ${item.tone}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mx-auto max-w-3xl border-t border-slate-200 pt-7 text-center">
            <p className="text-lg font-medium text-slate-800">
              &quot;Built entirely for learning. Every line of code written by
              me.&quot;
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

function TimelineCard({
  item,
}: {
  item: {
    title: string;
    label: string;
    description: string;
    side: string;
  };
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-7 text-left shadow-sm shadow-slate-200/50 md:text-center">
      {item.label && (
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-blue-700">
          {item.label}
        </p>
      )}
      <h2 className="text-2xl font-extrabold tracking-normal text-slate-950">
        {item.title}
      </h2>
      <p className="mt-4 text-base leading-6 text-slate-600">
        {item.description}
      </p>
    </article>
  );
}
