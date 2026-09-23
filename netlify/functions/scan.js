const fetch = require('node-fetch');

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
        const body = JSON.parse(event.body);
        const base64Image = body.image;

        if (!base64Image) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No image provided' })
            };
        }

        const apiKey = "AQ.Ab8RN6I0sNVSNmnapJVvNYp_NSpWXHJ74rlNcILh8HxioqtGPw";

        if (!apiKey || apiKey === "YAHAN_APNI_GEMINI_API_KEY_DAALEIN") {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key is missing in scan.js' })
            };
        }

        const url = `[https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$](https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$){apiKey}`;

        const promptText = `Analyze this OMR answer sheet image. Extract the correct options for each question number. Return ONLY a valid JSON object where keys are question numbers (as strings "1", "2", etc.) and values are the chosen option letters ("A", "B", "C", or "D"). Example format: {"1": "A", "2": "C", "3": "B"}. Do not include any extra text or markdown formatting blocks.`;

        const geminiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
                           data.candidates[0].content.parts[0].text || "{}";

        // Markdown blocks ko yhin se clean kar dete hain
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
