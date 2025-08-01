import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DB_FILE = path.join('/tmp', 'db.json');

app.use(cors());
app.use(express.json());

// Ensure db.json exists in the /tmp directory
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

const readDb = () => {
    try {
        const data = fs.readFileSync(DB_FILE);
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading db.json:', error);
        return {};
    }
};

const writeDb = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing to db.json:', error);
    }
};

app.post('/api/save', (req, res) => {
    const { tag, data } = req.body;
    if (!tag || !data) {
        return res.status(400).send('Missing tag or data');
    }

    const db = readDb();
    db[tag] = data;
    writeDb(db);

    res.status(200).send('Data saved successfully');
});

app.get('/api/load/:tag', (req, res) => {
    const { tag } = req.params;
    if (!tag) {
        return res.status(400).send('Missing tag');
    }

    const db = readDb();
    const tagData = db[tag] || {};
    
    res.status(200).json(tagData);
});

app.get('/api/tags', (req, res) => {
    const db = readDb();
    res.status(200).json(Object.keys(db));
});

app.delete('/api/delete/:tag', (req, res) => {
    const { tag } = req.params;
    if (!tag) {
        return res.status(400).send('Missing tag');
    }

    const db = readDb();
    if (db[tag]) {
        delete db[tag];
        writeDb(db);
        res.status(200).send('Data deleted successfully');
    } else {
        res.status(404).send('Tag not found');
    }
});

export default app;
