const privacyPrinciples = [
  {
    title: "Account and booking data",
    description:
      "We use account, booking, and reservation details to support platform features, confirmations, and customer support.",
  },
  {
    title: "Platform improvements",
    description:
      "Aggregated usage patterns help us improve search, availability browsing, and the overall booking experience.",
  },
  {
    title: "User control",
    description:
      "Users should always be able to review the data they provide and expect it to be handled with care and purpose.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fbff_0%,#edf3fb_45%,#e6eef9_100%)] text-slate-900">
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
            Privacy Policy
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-blue-950 sm:text-5xl">
            A simple explanation of how guest data is handled.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            This sample privacy page explains, at a high level, how BookYourStay
            treats the information used to run bookings and improve the app.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {privacyPrinciples.map((item) => (
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

        <div className="mt-10 rounded-3xl border border-blue-100 bg-blue-50/80 p-6 text-sm leading-7 text-slate-600 shadow-sm">
          <p>
            In a production release, this page would be expanded with the full
            privacy notice, contact details, retention guidance, and any
            region-specific compliance language required for the business.
          </p>
        </div>
      </section>
    </main>
  );
}
