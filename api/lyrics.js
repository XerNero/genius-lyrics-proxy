// Vercel Serverless Function pakai LRCLIB (tanpa token).
// GET /api/lyrics?title=Judul&artist=Artis&format=text|lrc
// - format=lrc  -> kembalikan LRC jika tersedia, jika tidak fallback ke plain
// - format=text -> kembalikan plain jika ada, jika tidak fallback ke LRC yg di-strip

function lrcToPlain(lrc) {
  // hapus tag [mm:ss.xx] dan gabungkan baris
  return lrc
    .split(/\r?\n/)
    .map(line => line.replace(/\s*\[[^\]]+\]\s*/g, "").trim())
    .filter(Boolean)
    .join("\n");
}

export default async function handler(req, res) {
  try {
    const { title = "", artist = "", format = "text" } = req.query;
    if (!title || !artist) {
      res.status(400).send("Missing title/artist");
      return;
    }

    // 1) Cari lagu di LRCLIB
    const searchUrl =
      "https://lrclib.net/api/search?" +
      new URLSearchParams({
        track_name: title,
        artist_name: artist
      }).toString();

    const sRes = await fetch(searchUrl, { headers: { "User-Agent": "lyrics-proxy/1.0" }});
    if (!sRes.ok) {
      res.status(502).send(`LRCLIB search failed: ${sRes.status}`);
      return;
    }
    const items = await sRes.json();
    if (!Array.isArray(items) || items.length === 0) {
      res.status(404).send("Lyrics not found");
      return;
    }

    // Ambil kandidat pertama yang punya lirik
    const hit =
      items.find(x => x.syncedLyrics || x.plainLyrics) ||
      items[0];

    const synced = hit.syncedLyrics || "";
    const plain = hit.plainLyrics || "";

    let out = "";
    if (format === "lrc") {
      out = synced || (plain ? plain : "");
    } else {
      out = plain || (synced ? lrcToPlain(synced) : "");
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(out ? 200 : 404).send(out || "Lyrics not found");
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal error");
  }
}
