namespace sigfox {
    // From aggregate.h: Aggregate sensor data and decide whether to send to network now.

    // Uncomment to disable downlink.
    const ENABLE_DOWNLINK = false
    // Uncomment to enable downlink.
    // const ENABLE_DOWNLINK = true

    // Send a message to network every 20,000 milliseconds
    // = 20 seconds.
    export const SEND_INTERVAL: number = 20 * 1000

    let sequenceNumber = 0  //  Message sequence number
    let sendSensors: string[] = []  //  Sensors to be sent.
    let sensorData: SensorMsg[] = []
    let payload: string = null

    // Buffer for constructing the message payload to be
    // sent, in hex digits, plus terminating null.
    const PAYLOAD_SIZE: number = 1 + MAX_MESSAGE_SIZE * 2
    // const testPayload = "0102030405060708090a0b0c";

    export function aggregate_sensor_data(
        context: NetworkContext,  //  Context storage for the Network Task.
        msg: SensorMsg,           //  Sensor Data Message just received. Contains sensor name and sensor values.
        cmdList: NetworkCmd[],    //  Upon return, will be populated by the list of AT Commands to be executed.
        cmdListSize: number): boolean {        //  How many commands may be stored in cmdList.
        //  Aggregate the received sensor data.  Check whether we should send the data, based on 
        //  the throttle settings.  Return true if we should send the message.  The message commands are
        //  populated in cmdList, up to cmdListSize elements (including the terminating command).
        led_toggle();  //  Blink the LED so we know we are aggregating continuously.
        if (msg.name === BEGIN_SENSOR_NAME) {
            //  If sensor name is "000", this is the Begin Step.
            const beginArgs: StepArgs = {
                list: cmdList,
                listSize: cmdListSize,
                payload: "",
                enableDownlink: ENABLE_DOWNLINK,
            };
            context.stepBeginFunc(context, beginArgs);  //  Fetch list of startup commands for the transceiver.
            return true;  //  Send the startup commands.
        }
        debug_print(msg.name); debug_print(F(" << Recv data "));
        if (msg.count > 0) { debug_println(msg.data[0] + ""); }
        else { debug_println("(empty)"); }
        //  debug_flush();

        //  Plot the sensor value on the console graph.
        if (msg.count > 0) { debug_println("   " + msg.name + ": " + msg.data[0]); }

        //  Aggregate the sensor data.  Here we just save the last value for each sensor.
        let savedSensor: SensorMsg = recallSensor(msg.name);
        if (!savedSensor) return false;  //  Return error.
        copySensorData(savedSensor, msg);  //  Copy the data from the received message into the saved data.

        //  Throttle the sending.  TODO: Show warning if messages are sent faster than SEND_DELAY.
        let now = millis();
        if ((context.lastSend + SEND_INTERVAL) > now) {
            //  Not ready to send.
            ////debug(msg.name, " || throttled"); ////
            return false;
        }
        context.lastSend = now + MAX_TIMEOUT;  //  Prevent other requests from trying to send.

        //  Create a new Sigfox message. Add a running sequence number to the message.
        payload = "";  //  Empty the message payload.
        payload = addPayloadInt(payload, PAYLOAD_SIZE, "seq", sequenceNumber++, 4);

        //  Encode the sensor data into a Sigfox message, 4 digits each.
        sendSensors.forEach((sensorName: string) => {
            //  Get each sensor data and add to the message payload.
            let data = 0.0;
            savedSensor = recallSensor(sensorName);  //  Find the sensor.
            if (savedSensor && savedSensor.count > 0) { data = savedSensor.data[0]; }  //  Fetch the sensor data (first float only).
            const scaledData = data * 10.0;  //  Scale up by 10 to send 1 decimal place. So 27.1 becomes 271
            payload = addPayloadInt(payload, PAYLOAD_SIZE, sensorName, scaledData, 4);  //  Add to payload.        
        });

        //  If the payload has odd number of digits, pad with '0'.
        const length = payload.length;
        if (length % 2 != 0 && length < PAYLOAD_SIZE - 1) {
            payload = payload + '0';
        }
        debug_print(F("agg >> Send ")); debug_println(payload);

        //  Compose the list of Wisol AT Commands for sending the message payload.
        const sendArgs: StepArgs = {
            list: cmdList,
            listSize: cmdListSize,
            payload: payload,
            enableDownlink: ENABLE_DOWNLINK,
        };
        context.stepSendFunc(context, sendArgs);
        return true;  //  Will be sent by the caller.
    }

    function addPayloadInt(
        payloadBuffer: string,
        payloadSize: number,
        name: string,
        data: number,
        numDigits: number): string {
        //  Add the integer data to the message payload as numDigits digits in hexadecimal.
        //  So data=1234 and numDigits=4, it will be added as "1234".  Not efficient, but easy to read.
        const length2 = payloadBuffer.length;
        if (length2 + numDigits >= payloadSize) {  //  No space for numDigits hex digits.
            debug(F("***** Error: No payload space for "), name);
            return payloadBuffer;
        }
        if (data < 0 || data >= Math.pow(10, numDigits)) {  //  Show a warning if out of range.
            debug_print(F("***** Warning: Only last ")); debug_print(numDigits + "");
            debug_print(F(" digits of ")); debug_print(name); debug_print(F(" value ")); debug_print(data + "");
            debug_println(" will be sent"); // debug_flush();
        }
        let digits = "";
        for (let o = numDigits - 1; o >= 0; o--) {  //  Add the digits in reverse order (right to left).
            const d = data % 10;  //  Take the last digit.
            data = data / 10;  //  Shift to the next digit.
            digits = String.fromCharCode(
                '0'.charCodeAt(0) + d) +  //  Write the digit to payload: 1 becomes '1'.
                digits;
        }
        payloadBuffer = payloadBuffer + digits;
        return payloadBuffer;
    }

    function copySensorData(dest: SensorMsg, src: SensorMsg): void {
        //  Copy sensor data from src to dest.
        dest.data = [];
        for (let p = 0; p < src.count; p++) {
            dest.data.push(src.data[p]);
        }
        dest.count = src.count;
    }

    function recallSensor(name: string): SensorMsg {
        //  Return the sensor data for the sensor name.  If not found, allocate
        //  a new SensorMsg and return it.  If no more space, return NULL.
        let emptyIndex = -1;
        for (let q = 0; q < sensorData.length; q++) {
            //  Search for the sensor name in our data.
            if (name === sensorData[q].name) {
                return sensorData[q];  //  Found it.
            }
            //  Find the first empty element.
            if (emptyIndex == -1 && sensorData[q].name === "") {
                emptyIndex = q;
            }
        }
        //  Allocate a new element.
        if (emptyIndex == -1) {  //  No more space.
            debug(F("***** Error: No aggregate space for "), name);
            return null;
        }
        sensorData[emptyIndex].name = name;
        sensorData[emptyIndex].count = 0;  //  Clear the values.
        sensorData[emptyIndex].data = [];  //  Reset to empty in case we need to send.
        return sensorData[emptyIndex];
    }

    //% block
    export function setup_aggregate(sendSensors0: string[]): void {
        // Init the list of aggregated sensor data.
        sendSensors = sendSensors0
        sensorData = []
        for (let i = 0; i < MAX_SENSOR_COUNT; i++) {
            let sensor: SensorMsg = {
                name: "",
                count: 0,
                data: [],
            };
            sensorData.push(sensor)
        }
    }
}