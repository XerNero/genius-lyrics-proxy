// Tidak perlu import node-fetch; Node 18+ sudah ada fetch global.

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

    // 1) Cari lagu di Genius
    const q = `${title} ${artist}`;
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(q)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const searchJson = await searchRes.json().catch(() => ({}));
    const hits = searchJson?.response?.hits || [];
    if (!hits.length) {
      res.status(404).send("Lyrics not found");
      return;
    }

    const songUrl = hits[0].result.url;

    // 2) Ambil HTML halaman lirik & ekstrak teks
    const html = await fetch(songUrl).then(r => r.text());
    const containers = [...html.matchAll(/<div class="Lyrics__Container[^>]*>([\s\S]*?)<\/div>/g)];
    let text = containers
      .map(m =>
        m[1]
          .replace(/<br\/?>/g, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
      )
      .join("\n")
      .trim();

    if (!text) {
      const m = html.match(/<div class="lyrics">[\s\S]*?<p>([\s\S]*?)<\/p>/);
      if (m) {
        text = m[1].replace(/<br\/?>/g, "\n").replace(/<[^>]+>/g, "").trim();
      }
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(text || "Lyrics not found");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal error");
  }
}
