import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Ensure db.json exists
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

app.post('/api/save', (req, res) => {
    const data = req.body;
    fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error saving data');
        }
        res.status(200).send('Data saved successfully');
    });
});

app.get('/api/load', (req, res) => {
    fs.readFile(DB_FILE, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error loading data');
        }
        res.status(200).json(JSON.parse(data));
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).send('Server is healthy');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
