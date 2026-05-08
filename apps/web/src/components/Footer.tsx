export function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white/50 py-8">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <p className="text-sm text-slate-600">© {new Date().getFullYear()} BookYourStay. All rights reserved.</p>
                    <nav className="flex gap-4">
                        <a href="/about" className="text-sm text-slate-600 hover:text-slate-900">About</a>
                        <a href="/terms" className="text-sm text-slate-600 hover:text-slate-900">Terms</a>
                        <a href="/privacy" className="text-sm text-slate-600 hover:text-slate-900">Privacy</a>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
