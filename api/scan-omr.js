export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'Image data missing in request body' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel Environment Variables.' });
        }

        // Clean base64 string
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

        // Call Gemini API from backend server
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            model: 'gemini-1.5-flash',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: "You are an expert OMR sheet scanner AI. Analyze this image of an OMR sheet carefully. Detect all the questions visible in this specific image and determine the option selected (A, B, C, or D) for each question. Return ONLY a valid JSON object where keys are the question numbers as strings (e.g. \"1\", \"2\", \"3\"...) and values are the selected option letters (e.g. \"A\", \"B\", \"C\", \"D\"). Do not include markdown code blocks or any extra text, just the raw JSON object."
                            },
                            {
                                inline_data: {
                                    mime_type: "image/jpeg",
                                    data: base64Data
                                }
                            }
                        ]
                    }
                ]
            })
        });

        const data = await geminiResponse.json();
        
        if (!geminiResponse.ok) {
            return res.status(500).json({ error: data.error?.message || 'Gemini API rejected the request' });
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
            return res.status(500).json({ error: 'Empty response received from Gemini AI model.' });
        }

        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const answers = JSON.parse(cleanedText);

        return res.status(200).json({
            success: true,
            message: 'OMR successfully scanned via backend Gemini AI!',
            answers: answers
        });

    } catch (error) {
        return res.status(500).json({ error: 'Backend Server Exception: ' + error.message });
    }
}
