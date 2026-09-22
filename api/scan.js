export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'Image data is missing' });
        }

        // 🔑 YAHAN APNI GEMINI API KEY RAKHEIN (Yeh server par secure rahegi)
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YAHAN_APNI_REAL_API_KEY_DAAL_DENA";

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Analyze this image containing question numbers and corresponding answer options (A, B, C, or D). Extract every question number and its exact answer. Return ONLY a valid JSON object where keys are question numbers (as strings, e.g. \"1\", \"2\") and values are the answer letters (uppercase 'A', 'B', 'C', or 'D'). Do not include any extra text or markdown formatting outside the JSON." },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: image
                            }
                        }
                    ]
                }]
            })
        });

        const result = await response.json();

        if (result.error) {
            return res.status(500).json({ error: result.error.message });
        }

        const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
            return res.status(500).json({ error: 'Could not read response from AI.' });
        }

        let cleanJsonStr = candidateText.trim();
        if (cleanJsonStr.startsWith("```json")) {
            cleanJsonStr = cleanJsonStr.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (cleanJsonStr.startsWith("```")) {
            cleanJsonStr = cleanJsonStr.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const parsedAnswers = JSON.parse(cleanJsonStr);
        return res.status(200).json({ answers: parsedAnswers });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
