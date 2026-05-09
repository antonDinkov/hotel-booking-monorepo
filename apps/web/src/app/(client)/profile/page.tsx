export default function ProfilePage() {
    // Placeholder data structure for user profile
    const userProfile = {
        name: "Placeholder User Name",
        email: "placeholder@example.com",
        phone: "+1 (555) 123-4567",
        preferences: {
            smoking: false,
            pets: true,
            notifications: true
        },
        address: {
            street: "123 Placeholder St",
            city: "Placeholder City",
            state: "PC",
            zip: "12345"
        }
    };

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <header className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My Profile</h1>
            </header>

            <div className="grid gap-8 md:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Name</label>
                            <p className="mt-1 text-sm text-slate-900">{userProfile.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Email</label>
                            <p className="mt-1 text-sm text-slate-900">{userProfile.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Phone</label>
                            <p className="mt-1 text-sm text-slate-900">{userProfile.phone}</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Address</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Street</label>
                            <p className="mt-1 text-sm text-slate-900">{userProfile.address.street}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">City</label>
                            <p className="mt-1 text-sm text-slate-900">{userProfile.address.city}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">State</label>
                            <p className="mt-1 text-sm text-slate-900">{userProfile.address.state}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">ZIP Code</label>
                            <p className="mt-1 text-sm text-slate-900">{userProfile.address.zip}</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Preferences</h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={userProfile.preferences.smoking}
                                readOnly
                                className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                            />
                            <label className="ml-2 text-sm text-slate-700">Smoking Room</label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={userProfile.preferences.pets}
                                readOnly
                                className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                            />
                            <label className="ml-2 text-sm text-slate-700">Pet Friendly</label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={userProfile.preferences.notifications}
                                readOnly
                                className="h-4 w-4 text-blue-600 border-slate-300 rounded"
                            />
                            <label className="ml-2 text-sm text-slate-700">Email Notifications</label>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
