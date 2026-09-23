exports.handler = async function(event, context) {
    // Sirf POST request allow karne ke liye
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        
        // Yahan aap apna OMR scanning ya AI processing logic likh sakte hain
        // Abhi ke liye ek sample response bhej rahe hain taaki connection check ho jaye
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: 'OMR successfully scanned via Netlify Function!',
                results: data
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
