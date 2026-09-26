import {useEffect, useState} from 'react';
import './index.css'

function ShowPrinter({p}) {
    let nozzle_temp_class = '';
    if (p.nozzle_temper > 60) {
        nozzle_temp_class = 'temp_on'
    }

    let bed_temp_class = '';
    if (p.bed_temper > 40) {
        bed_temp_class = 'temp_on'
    }

    let percent = p.mc_percent || 0;

    let isPrinting = false;
    if (p.gcode_state.toUpperCase() === "RUNNING") {
        isPrinting = true;
    } else if ((p.nozzle_temper > 60) && (p.bed_temper > 40) &&
               (percent > 0) && (percent < 100)) {
        isPrinting = true;
    }

    let hr_remaining = Math.floor(p.mc_remaining_time / 60);
    let min_remaining = p.mc_remaining_time % 60;

    let time_remaining = '';
    if (hr_remaining > 0) {
        time_remaining = hr_remaining + " hr "
    }
    time_remaining = time_remaining + min_remaining + " min"

    let status_class = '';
    if (p.print_error != 0) {
        status_class = 'error';
    }

    return (
        <div className={"card " + (isPrinting ? "on" : "")}>
            <h2>{p.name}</h2>
            {/* <h2>{p.name} &nbsp;&nbsp; ({p.connected ? "online" : "offline"})</h2> */}
            <small>{p.ip}</small>

            <br/>
            <br/>

            <div>
                <span className={nozzle_temp_class}>Nozzle: {p.nozzle_temper || '-'} °C</span>
            </div>
            <div>
                <span className={bed_temp_class}>Bed: {p.bed_temper || '-'} °C</span>
            </div>

            <br/>
            
            <div>
                Project file: {p.gcode_file || '-'}
            </div>

            <div className="progress">
                <div className="bar" style={{width:`${percent}%`}}></div>
                <div className="text">{percent}%</div>
            </div>
            <div>
                Layer: {p.layer_num || '-'} / {p.total_layer_num || '-'}
            </div>

            <div>
                {time_remaining} remaining
            </div>
            <div>
                <span className={status_class}>Gcode state: {p.gcode_state} {status_class ? 'ERROR' : ''}</span>
            </div>
        </div>
    );
}

function Card({printers}) {
    return (
        <>
            {Object.values(printers).map((printer) => (
                <ShowPrinter key={printer.name} p={printer} />
            ))}
        </>
    )
}

export default function App() {
    const [printers, setPrinters] = useState(null);

    useEffect(() => {
        const websocketURL = `ws://${window.location.host}/ws`
        const ws = new WebSocket(websocketURL);

        ws.onopen = () => {
            console.log('websocket open on ', websocketURL);
        }
        ws.onerror = (error) => {
            console.log('websocket ERROR: ', error);
        }

        ws.onmessage = (event) => {
            let message = JSON.parse(event.data);
            setPrinters(message)
        }

        return () => {
            ws.close();
        };

    }, []);

    if (printers == null) {
        return <div>Printers not ready</div>
    }

    return (
        <div>
            <Card printers={printers}/>
        </div>
    );

}
