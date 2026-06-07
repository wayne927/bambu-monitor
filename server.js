const mqtt = require("mqtt");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

const printers = [
    {
        id: "printer1",
        name: "<name>",
        ip: "<IP>",
        serial: "<serial>",
        accessCode: "<access code>"
    },

    {
        id: "printer2",
        name: "<name>",
        ip: "<IP>",
        serial: "<serial>",
        accessCode: "<access code>"
    }
];

const printerState = {};

function broadcast() {
    const payload = JSON.stringify(printerState);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

function connectPrinter(printer) {

    printerState[printer.id] = {
        name: printer.name,
        connected: false,
        nozzle_temper: 0,
        bed_temper: 0,
        gcode_file: "",
        layer_num: 0,
        total_layer_num: 0,
        mc_percent: 0,
        mc_remaining_time: 0,
        gcode_state: "",
        print_error: 0,
    };

    const client = mqtt.connect({
        host: printer.ip,
        port: 8883,
        protocol: "mqtts",

        username: "bblp",
        password: printer.accessCode,

        rejectUnauthorized: false,

        clientId:
            `${printer.id}_${Math.random().toString(16).slice(2)}`,

        reconnectPeriod: 5000
    });

    client.on("connect", () => {

        console.log(
            `[${printer.name}] connected`
        );

        printerState[printer.id].connected = true;

        const reportTopic =
            `device/${printer.serial}/report`;

        client.subscribe(reportTopic);

        client.publish(
            `device/${printer.serial}/request`,
            JSON.stringify({
                pushing: {
                    sequence_id: "0",
                    command: "pushall"
                }
            })
        );

        broadcast();
    });

    client.on("message", (topic, payload) => {

        try {

            const data =
                JSON.parse(payload.toString());
            
            if (!('print' in data)) {
                return;
            }
            
            updated = false
            for (const [key, val] of Object.entries(data.print)) {
                if (!(key in printerState[printer.id])) {
                    continue
                }

                new_val = val

                if (key == "nozzle_temper" || key == "bed_temper") {
                    new_val = Math.round(val * 10) / 10.0;

                    if (printerState[printer.id][key] == new_val) {
                        continue
                    }
                }
                
                printerState[printer.id][key] = new_val
                updated = true
            }

            if (updated) {
                broadcast();
            }

        } catch (err) {

            console.log(
                `[${printer.name}] parse error`,
                err
            );
        }
    });

    client.on("close", () => {

        printerState[printer.id].connected = false;

        broadcast();

        console.log(
            `[${printer.name}] disconnected`
        );
    });

    client.on("error", err => {

        console.log(
            `[${printer.name}]`,
            err.message
        );
    });
}

printers.forEach(connectPrinter);

wss.on("connection", ws => {

    ws.send(
        JSON.stringify(printerState)
    );
});

server.listen(3000, () => {

    console.log(
        "Dashboard: http://localhost:3000"
    );
});
