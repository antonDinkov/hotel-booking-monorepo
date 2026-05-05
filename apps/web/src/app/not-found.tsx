import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-24 px-6 text-center">
      <h1 className="text-6xl font-extrabold text-slate-900">404</h1>
      <p className="mt-4 text-xl text-slate-600">Page not found</p>
      <p className="mt-6 max-w-xl text-slate-500">Sorry, we couldn’t find the page you’re looking for.</p>
      <div className="mt-8">
        <Link href="/" className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">
          Go home
        </Link>
      </div>
    </main>
  );
}
