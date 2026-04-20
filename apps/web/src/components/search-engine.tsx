import type { SearchField } from "../types/hotel-panel";
import { AppButton } from "./app-button";

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-slate-500" fill="none">
      <path
        d="M12 21s6-5.4 6-12a6 6 0 1 0-12 0c0 6.6 6 12 6 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="9" r="2.2" fill="currentColor" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-slate-500" fill="none">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 9.5h17" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.5v4M16 3.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 13h3M8 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GuestsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-slate-500" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 19c.8-3 3.1-4.8 4.5-4.8S12.7 16 13.5 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14.5 12.4a2.8 2.8 0 1 0 0-5.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 19c.6-1.9 1.7-3.2 3-3.8 1-.4 2.2-.3 3 .2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
      <circle cx="11" cy="11" r="6.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16.4 16.4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchFieldCard({ field }: { field: SearchField }) {
  const icon =
    field.icon === "pin" ? <PinIcon /> : field.icon === "calendar" ? <CalendarIcon /> : <GuestsIcon />;

  return (
    <div className="flex min-h-18 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-[0_10px_25px_rgba(15,23,42,0.08)] ring-1 ring-white/70">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{field.label}</p>
        <p className="truncate text-sm font-semibold text-slate-950">{field.placeholder}</p>
      </div>
    </div>
  );
}

export function SearchEngine({
  searchFields,
  ctaLabel,
}: {
  searchFields: SearchField[];
  ctaLabel: string;
}) {
  return (
    <div className="relative z-20 mt-12 rounded-[1.35rem] border border-white/80 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl lg:absolute lg:left-1/2 lg:bottom-0 lg:mt-0 lg:w-[calc(100%-2rem)] lg:max-w-6xl lg:-translate-x-1/2 lg:translate-y-1/2">
      <div className="grid gap-2 lg:grid-cols-[1fr_1fr_0.8fr_auto]">
        {searchFields.map((field) => (
          <SearchFieldCard key={field.label} field={field} />
        ))}
        <AppButton
          variant="primary"
          size="lg"
          leftIcon={<SearchIcon />}
          className="rounded-xl shadow-blue-700/25 lg:min-w-40"
        >
          {ctaLabel}
        </AppButton>
      </div>
    </div>
  );
}