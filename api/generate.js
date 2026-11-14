
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method tidak diizinkan"
    });
  }

  try {
    const { image, mimeType } = req.body || {};

    if (!image || !mimeType) {
      return res.status(400).json({
        error: "Gambar belum dipilih"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "API Key Gemini belum terpasang"
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Analisis gambar ini secara detail dan buat satu prompt AI dalam bahasa Indonesia. Jelaskan subjek, wajah, pakaian, pose, ekspresi, latar belakang, pencahayaan, warna, sudut kamera, komposisi, dan gaya visual. Jangan menebak identitas orang. Berikan hanya prompt siap pakai."
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: image
                }
              }
            ]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: data.error?.message || "Gemini gagal memproses gambar"
      });
    }

    const result =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("\n")
        .trim();

    if (!result) {
      return res.status(502).json({
        error: "Gemini tidak menghasilkan prompt"
      });
    }

    return res.status(200).json({
      success: true,
      prompt: result
    });

  } catch (error) {
    return res.status(500).json({
      error: "Terjadi kesalahan pada server"
    });
  }
}
