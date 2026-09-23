const express = require('express');
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serves your frontend from the same folder

// Endpoint to handle image upload, server-side OCR, and intelligent text parsing
app.post('/api/scan-omr', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image provided.' });
        }

        // Initialize Tesseract worker on the server for maximum accuracy
        const worker = await createWorker('eng');
        const ret = await worker.recognize(req.file.buffer);
        await worker.terminate();

        const text = ret.data.text || '';
        const lines = text.split('\n');

        let extractedAnswerKey = {};
        let questionStatusMap = {};

        // Robust regex parser for question numbers and option choices (A, B, C, D, ?, X)
        lines.forEach(line => {
            const matches = [...line.matchAll(/(\d{1,3})[\.\-:\)]*\s*([A-Da-d\?xX])/g)];
            matches.forEach(m => {
                const q = parseInt(m[1], 10);
                const rawAns = m[2].toUpperCase();
                if (q > 0 && q <= 300) {
                    if (rawAns === '?' || rawAns === 'X') {
                        questionStatusMap[q] = 'confusion';
                        extractedAnswerKey[q] = '';
                    } else {
                        questionStatusMap[q] = 'detected';
                        extractedAnswerKey[q] = rawAns;
                    }
                }
            });
        });

        // Ensure default count (at least 10 or up to max found question)
        const maxQ = Math.max(10, ...Object.keys(extractedAnswerKey).map(Number));
        for (let i = 1; i <= maxQ; i++) {
            if (!extractedAnswerKey[i]) {
                if (!questionStatusMap[i]) questionStatusMap[i] = 'missing';
                extractedAnswerKey[i] = '';
            }
        }

        res.json({
            success: true,
            extractedAnswerKey,
            questionStatusMap,
            rawText: text
        });

    } catch (err) {
        console.error('Server OCR Error:', err);
        res.status(500).json({ success: false, error: 'Failed to process image on server.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
