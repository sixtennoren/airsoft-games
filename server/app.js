const path = require('path');
process.loadEnvFile(path.join(__dirname, '.env'));

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.WS_PORT ?? 443 });

const clients = [];

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.HTTP_PORT ?? 443
app.use(cors());
app.use(bodyParser.json());

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

app.get('/bomb/time', (req, res) => {
    const timestamp = String(Date.now())
    console.log(`Sync: ${timestamp}`);
    res.type('text/plain').send(timestamp);
});

app.post('/bomb/plant', (req, res) => {
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

app.post('/bomb/defuse', (req, res) => {
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

app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})