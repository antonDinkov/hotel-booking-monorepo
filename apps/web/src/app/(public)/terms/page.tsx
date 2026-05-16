const termsSections = [
  {
    title: "Bookings and payments",
    points: [
      "Bookings are confirmed based on the information shown during checkout.",
      "Payment terms, cancellation rules, and booking status updates may vary by property.",
      "Users are responsible for reviewing all reservation details before completing payment.",
    ],
  },
  {
    title: "Platform usage",
    points: [
      "BookYourStay is intended for legitimate travel and lodging use only.",
      "Users should provide accurate account, guest, and booking information.",
      "Misuse, abusive behavior, or fraudulent activity may lead to account restrictions.",
    ],
  },
  {
    title: "Content and availability",
    points: [
      "Hotel descriptions, photos, and availability are provided for convenience and may change.",
      "We aim to keep listings current, but final booking details should always be verified in the reservation flow.",
      "Partners are responsible for maintaining the accuracy of their property information.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf3fb_45%,#e6eef9_100%)] text-slate-900">
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
            Terms of Use
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-blue-950 sm:text-5xl">
            Terms that keep the booking experience clear for everyone.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            These sample terms outline how BookYourStay is meant to be used and
            set expectations around reservations, property content, and user
            responsibility.
          </p>
        </div>

        <div className="mt-12 grid gap-6">
          {termsSections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur"
            >
              <h2 className="text-xl font-semibold text-blue-950">
                {section.title}
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-blue-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
