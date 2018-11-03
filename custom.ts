namespace sigfox {
    //% block
    export let network_task_id = 0  //  To transmit a Sigfox message, post the message to this task ID.

    //% block
    export function setupSigfox(
        country: Country,
        sendSensors: string[]
    ): void {
        //  Initialise the Sigfox Wisol module and start the Network Task and UART Task to
        //  send and receive Sigfox messages.

        //  TODO: Validate sendSensors.
        //  TODO: Simulator mode

        //  If using the light sensor, enable the LED.
        led.enable(true)

        //  If not using the light sensor, disable the LED because it may interfere with other sensors.
        //  led.enable(false)

        //  Set serial port to USB for console output.
        serial.redirectToUSB()

        //  Erase the aggregated sensor data.
        setup_aggregate(sendSensors)

        //  Start the Network Task and UART Task to send and receive Sigfox messages.
        network_task_id = network_setup(country)

        //  Initialise the Wisol module.  Must be done in background or the program will pause forever.
        control.inBackground(function () {
            //  Initialise the Wisol module. 
            const msg = createSensorMsg(sigfox.BEGIN_SENSOR_NAME, 0)
            msg_post(network_task_id, msg)
        })

        //  Wait 7 seconds for Wisol module to be initialised.
        basic.pause(7 * 1000)
    }

    //% block
    export function sendToSigfox(
        name: string,
        value: number
    ): void {
        //  Send the sensor name and value to Sigfox.  The value will be aggregated before sending.
        //  See aggregate.ts.
        const msg = createSensorMsg(name, value)
        msg_post(network_task_id, msg)
    }

    //% block
    export function network_setup(country: Country): number {
        // Start the Network Task to send and receive network
        // messages. Also starts the UART Task called by the
        // Network Task to send/receive data to the UART port.
        // UART Task must have the highest task priority
        // because it must respond to UART data immediately.
        // Start the UART Task for transmitting UART data to
        // the Wisol module.
        setup_uart(
            uartContext,  //  Init the context for UART Task.
            uartResponse);
        const uartContextWrapped = <Context_t>{ uartContext: uartContext };
        const uartTaskID = task_create(
            uart_task,          //  Task will run this function.
            uartContextWrapped  //  Context for the UART Task.
        );

        // Start the Network Task for receiving sensor data
        // and transmitting to UART Task.
        setup_wisol(
            wisolContext,  //  Init the context for the Network Task.
            uartContext,
            uartTaskID,
            country,
            false);
        const wisolContextWrapped = <Context_t>{ networkContext: wisolContext };
        const networkTaskID = task_create(
            network_task,        //  Task will run this function.
            wisolContextWrapped  //  Context for the Network Task.
        );

        set_uart_task_id(uartTaskID);  //  Remember the UART Task ID for sending debug messages.
        return networkTaskID;
    }

    let uartResponse: string = null

    //  Context for the UART Task.
    let uartContext = <UARTContext>{
        status: false,
        sendIndex: 0,
        sentTime: 0,
        response: null,
        actualMarkerCount: 0,
        testTimer: 0,
        msg: null,
    }

    //  Context for the Network Task.
    let wisolContext = <NetworkContext>{
        uartContext: null,
        uartTaskID: 0,
        zone: 0,
        country: Country.COUNTRY_SG,
        useEmulator: false,
        stepBeginFunc: null,
        stepSendFunc: null,

        device: null,
        pac: null,
        status: false,
        pendingResponse: false,
        pendingProcessFunc: null,
        lastSend: 0,
        msg: null,
        downlinkData: null,

        cmdList: null,
        cmdIndex: 0,
    };
}