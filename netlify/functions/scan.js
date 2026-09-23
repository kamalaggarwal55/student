exports.handler = async function(event, context) {
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
        const body = JSON.parse(event.body || '{}');
        const base64Image = body.image;

        if (!base64Image) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No image provided' })
            };
        }

        // Yahan apni Gemini API key daalein (AIza... se shuru hoti hai)
        const apiKey = "AQ.Ab8RN6I0sNVSNmnapJVvNYp_NSpWXHJ74rlNcILh8HxioqtGPw";

        if (!apiKey || apiKey === "YAHAN_APNI_GEMINI_API_KEY_DAALEIN") {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key is missing in scan.js' })
            };
        }

        // URL mein key hata kar ab Header mein bhej rahe hain
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

        const promptText = `Analyze this OMR answer sheet image. Extract the correct options for each question number. Return ONLY a valid JSON object where keys are question numbers (as strings "1", "2", etc.) and values are the chosen option letters ("A", "B", "C", or "D"). Example format: {"1": "A", "2": "C", "3": "B"}. Do not include any extra text or markdown formatting blocks.`;

        const geminiResponse = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey // Header ke through authentication
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: promptText },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64Image
                            }
                        }
                    ]
                }]
            })
        });

        const data = await geminiResponse.json();

        if (data.error) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: data.error.message })
            };
        }

        let textResult = data.candidates && 
                           data.candidates[0] && 
                           data.candidates[0].content && 
                           data.candidates[0].content.parts && 
                           data.candidates[0].content.parts[0].text || "{}";

        // Markdown blocks ko clean karne ke liye
        textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ answers: textResult })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
