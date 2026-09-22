import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // CORS headers taaki frontend se connection mein koi dikkat na aaye
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // === YAHAN APNI GEMINI API KEY SEEDHA LIKH DO ===
    const GEMINI_API_KEY = "AQ.Ab8RN6I0sNVSNmnapJVvNYp_NSpWXHJ74rlNcILh8HxioqtGPw"; 

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Base64 image data ko clean karna agar prefix ho
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        },
        {
          text: "Analyze this OMR sheet image and extract the answers accurately."
        }
      ]
    });

    return res.status(200).json({ result: response.text });

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
