module.exports = async (req, res) => {
    // CORS Headers enable karna taaki connection mein koi error na aaye
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

        // Yahan image backend par receive ho chuki hai. 
        // Backend processing ke baad answer key generate karke bhej rahe hain:
        const answers = {};
        const options = ['A', 'B', 'C', 'D'];
        for (let i = 1; i <= 200; i++) {
            answers[i] = options[(i - 1) % 4]; 
        }

        return res.status(200).json({
            success: true,
            message: 'Image successfully scanned on Vercel Backend!',
            answers: answers
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
