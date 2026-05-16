const missionHighlights = [
  {
    title: "Trusted stays, simplified",
    description:
      "BookYourStay helps travelers discover comfortable places to stay without digging through noisy, inconsistent listings.",
  },
  {
    title: "Built for clear booking flows",
    description:
      "The platform is designed to make hotel browsing, room selection, and booking feel straightforward from first search to confirmation.",
  },
  {
    title: "Designed for guests and partners",
    description:
      "Guests can plan trips with confidence while hotel partners get a clean, manageable way to present their properties.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf3fb_45%,#e6eef9_100%)] text-slate-900">
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
            About BookYourStay
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-blue-950 sm:text-5xl">
            A booking experience focused on clarity, comfort, and trust.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            BookYourStay is a hotel booking platform MVP built to help travelers
            find the right stay faster and give property partners a simple way
            to showcase their rooms, pricing, and availability.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {missionHighlights.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur"
            >
              <h2 className="text-lg font-semibold text-blue-950">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
