const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { createWorker } = require('tesseract.js');

const app = express();
app.use(cors());
app.use(express.json());

// Frontend files ke liye folder set karna
app.use(express.static(path.join(__dirname)));

// Root URL par index.html bhejne ke liye
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Image upload ke liye multer config
const upload = multer({ storage: multer.memoryStorage() });

// OMR / OCR scan karne ka API route
app.post('/api/scan-omr', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Koi image upload nahi ki gayi hai.' });
        }

        // Tesseract worker initialize karna
        const worker = await createWorker('eng');
        const ret = await worker.recognize(req.file.buffer);
        await worker.terminate();

        res.json({ text: ret.data.text });
    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).json({ error: 'OCR processing mein error aa gaya hai.' });
    }
});

// Server port setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
