const { GoogleGenAI } = require('@google/genai');

exports.handler = async function(event, context) {
    // CORS headers for smooth connection
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Request body is empty' })
            };
        }

        const body = JSON.parse(event.body);
        const base64Image = body.image;

        if (!base64Image) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No image provided in payload' })
            };
        }

        // APNI GEMINI API KEY YAHAN DIRECT PASTE KAREIN:
        const apiKey = "AQ.Ab8RN6I0sNVSNmnapJVvNYp_NSpWXHJ74rlNcILh8HxioqtGPw";

        if (!apiKey || apiKey === "YAHAN_APNI_GEMINI_API_KEY_DAALEIN") {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key is not configured in scan.js file.' })
            };
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });

        const promptText = `Analyze this OMR answer sheet image. Extract the correct options for each question number. 
Return ONLY a valid JSON object where keys are question numbers (as strings "1", "2", etc.) and values are the chosen option letters ("A", "B", "C", or "D"). 
Example format: {"1": "A", "2": "C", "3": "B"}
Do not include any extra text or markdown formatting blocks in the response except pure JSON if possible, or parseable standard format.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Image
                    }
                },
                promptText
            ]
        });

        const textResult = response.text ? response.text() : '';

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ answers: textResult })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Internal Server Error' })
        };
    }
};
