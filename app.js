import path from 'path';
import fs from "fs";
import http from 'http';
import { WebSocketServer } from 'ws';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const envPath = path.join(import.meta.dirname, ".env");
if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
}

const app = express();
const port = process.env.PORT ?? 443
app.use(cors());
app.use(bodyParser.json());
const frontendDist = path.join(import.meta.dirname, 'frontend', 'dist');
app.use(express.static(frontendDist));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = [];

wss.on('connection', (ws) => {
    clients.push(ws);
    console.log(`Connected!`);
    ws.on('message', async (message) => {
        const json = JSON.parse(message);
        if (json.event == "ping") {
            ws.send(JSON.stringify({
                event: "pong", timestamp: Date.now()
            }));
        }
    });
    ws.on('close', () => {
        const index = clients.indexOf(ws);
        if (index !== -1) {
            clients.splice(index, 1);
        }
        console.log(`Disconnected!`);
    })
});

app.get('/api/bomb/time', (req, res) => {
    const timestamp = String(Date.now())
    console.log(`Sync: ${timestamp}`);
    res.type('text/plain').send(timestamp);
});

app.post('/api/bomb/plant', (req, res) => {
    console.log(`Bomb planted for ${clients.length} players.`)
    console.log(`Timestamp: ${req.body.plantedAt}`);
    const timerLength = req.body.timerLength;
    clients.forEach(client => {
        client.send(JSON.stringify({
            event: "bombPlanted",
            timestamp: req.body.plantedAt,
            data: {
                timerLength
            }
        }));
    });
    res.json({
        event: "bombPlanted",
        timerLength,
        players: clients.length
    });
})

app.post('/api/bomb/defuse', (req, res) => {
    console.log(`Bomb defused for ${clients.length} players.`)
    clients.forEach(client => {
        client.send(JSON.stringify({
            event: "bombDefused"
        }));
    });
    res.json({
        event: "bombDefused",
        players: clients.length
    });
})

// SPA fallback so client-side routes (react-router-dom) resolve on refresh/deep link.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})