let port;
let writer, reader;
let slider;
let red, green, blue;
let sensorData = {};
const encoder = new TextEncoder();
const decoder = new TextDecoder();


function setup() {
    createCanvas(400, 400);

    if ("serial" in navigator) {
        let button = createButton("connect");
        button.position(0,0);
        button.mousePressed(connect);

        slider = createSlider(0, 255, 127);
        slider.position(10,50);
        slider.style('width', '100px');
    }
}

function mouseMoved() {
    red = round(map(mouseX,0,width,0,255));
    green = round(map(mouseY,0,height,0,255));
    blue = slider.value();
}

function draw() {
    background (220);

    if (reader) {
        serialRead();
    }

    if (writer && frameCount % 5 == 0) {
        writer.write(encoder.encode(red+","+green+","+blue+"\n"))
    }

    text("cm: " + sensorData.cm, 10, 100);
    text("inches: " + sensorData.inches, 10, 150);
}

async function serialRead() {
    while(true) {
        const { value, done } = await reader.read();
        if (done) {
            reader.releaseLock();
            break;
        }
        console.log(value);
        sensorData = JSON.parse(value);
    }
}
async function connect() {
    port = await navigator.serial.requestPort();

    await port.open({ baudRate: 9600 });

    writer = port.writable.getWriter();

    reader = port.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TransformStream(new LineBreakTransformer()))
    .getReader();

}

class LineBreakTransformer {
    constructor() {
        this.chunks = "";
    }

    transform(chunk, controller) {
        this.chunks += chunk;
        const lines = this.chunks.split("\n");
        this.chunks = lines.pop();
        lines.forEach((line) => controller.enqueue(line));
    }

    flush(controller) {
        controller.enqueue(this.chunks);
    }
}