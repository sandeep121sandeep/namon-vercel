const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const { dob, gender } = req.body;

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

    const text = completion.choices[0].message.content;
    const nak = text.match(/Nakshatra: (.+)/i)?.[1]?.trim() || "Unknown";
    const charLine = text.match(/Character: (.+)/i)?.[1]?.trim() || "Mystic, Unknown, Seeker, Light, Owl";
    const story = text.match(/Story: (.+)/i)?.[1]?.trim() || "A silent path unfolds. She hears the stars. Destiny awakens.";
    const [name, clan, title, weapon, animal] = charLine.split(",").map(s => s.trim());

    res.status(200).json({ nakshatra: nak, name, clan, title, weapon, animal, story });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OpenAI request failed" });
  }
}
