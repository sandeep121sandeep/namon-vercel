const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // Allow CORS (Optional - Needed if you call this API from frontend)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  // Content-Type validation
  if (req.headers['content-type'] !== 'application/json') {
    return res.status(400).json({ error: "Expected application/json Content-Type" });
  }

  const { dob, gender } = req.body;

  if (!dob || !gender) {
    return res.status(400).json({ error: "Missing dob or gender in request body" });
  }

  const prompt = `
You are an expert in Vedic astrology and mythology.
Based on the Date of Birth: ${dob} and Gender: ${gender},
1. Identify the Nakshatra.
2. Assign a warrior character from the NAMON universe.
3. Give: warrior's name, clan, title, weapon, animal.
4. Write a 3-line mythical story of the day.
Return only plain text in this format:
Nakshatra: [Nakshatra]
Character: [Name], [Clan], [Title], [Weapon], [Animal]
Story: [line1] [line2] [line3]
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });

    let text = completion.choices.at(0)?.message?.content || "";

    // Normalize text - remove newlines and extra spaces
    const cleanText = text.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();

    // Extract fields using RegEx
    const nak = cleanText.match(/Nakshatra:\s*(.+?)(Character:|$)/i)?.[1]?.trim() || "Unknown";
    const charLine = cleanText.match(/Character:\s*(.+?)(Story:|$)/i)?.[1]?.trim() || "Mystic, Unknown, Seeker, Light, Owl";
    const storyRaw = cleanText.match(/Story:\s*(.+)/i)?.[1]?.trim() || "A silent path unfolds. She hears the stars. Destiny awakens.";

    const [name, clan, title, weapon, animal] = charLine.split(",").map(s => s.trim());

    res.status(200).json({
      nakshatra: nak,
      name,
      clan,
      title,
      weapon,
      animal,
      story: storyRaw
    });

  } catch (err) {
    console.error("Error in OpenAI Completion:", err);
    res.status(500).json({ error: "OpenAI request failed" });
  }
}
