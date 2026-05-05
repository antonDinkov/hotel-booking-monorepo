(async () => {
  const urls = ['/', '/profile', '/dashboard', '/does-not-exist'];
  for (const p of urls) {
    const u = 'http://localhost:3001' + p;
    try {
      const r = await fetch(u, { redirect: 'manual' });
      console.log(`\n== ${p} ==\nstatus: ${r.status}`);
      if (r.headers.get('location')) console.log(`location: ${r.headers.get('location')}`);
      const text = await r.text();
      console.log(text.slice(0, 300));
    } catch (e) {
      console.log(`error fetching ${p}:`, e.message);
    }
  }
})();
