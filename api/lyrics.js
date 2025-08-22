// Vercel Serverless Function
// GET /api/lyrics?title=Judul&artist=Artis
// Kembalikan lirik plain text dari Genius.

export default async function handler(req, res) {
  try {
    const { title = "", artist = "" } = req.query;
    if (!title || !artist) {
      res.status(400).send("Missing title/artist");
      return;
    }

    const token = process.env.GENIUS_TOKEN;
    if (!token) {
      res.status(500).send("Missing GENIUS_TOKEN");
      return;
    }

    // 1) Cari lagu via Genius API
    const q = `${title} ${artist}`;
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(q)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!searchRes.ok) {
      const t = await searchRes.text().catch(() => "");
      res.status(502).send(`Genius search failed: ${searchRes.status} ${t}`);
      return;
    }

    const searchJson = await searchRes.json().catch(() => ({}));
    const hits = searchJson?.response?.hits || [];
    if (!hits.length) {
      res.status(404).send("Lyrics not found (no hits)");
      return;
    }

    // Ambil kandidat pertama (bisa ditingkatkan nanti)
    const songUrl = hits[0].result.url;

    // 2) Ambil halaman HTML lirik
    const htmlRes = await fetch(songUrl, {
      // Tambahkan header agar tidak diblok anti-bot
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://genius.com/"
      },
      redirect: "follow"
    });

    if (!htmlRes.ok) {
      const t = await htmlRes.text().catch(() => "");
      res.status(502).send(`Fetch song page failed: ${htmlRes.status} ${t}`);
      return;
    }

    const html = await htmlRes.text();

    // 3) Ekstrak teks lirik dari container modern
    const containers = [...html.matchAll(/<div class="Lyrics__Container[^>]*>([\s\S]*?)<\/div>/g)];
    let text = containers
      .map(m =>
        m[1]
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/?[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
      )
      .join("\n")
      .trim();

    // 4) Fallback ke struktur lama (kalau perlu)
    if (!text) {
      const m = html.match(/<div class="lyrics">[\s\S]*?<p>([\s\S]*?)<\/p>/i);
      if (m) {
        text = m[1]
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/?[^>]+>/g, "")
          .trim();
      }
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(text || "Lyrics not found (empty parse)");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal error");
  }
}
