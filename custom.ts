namespace sigfox {
    //% block
    export let network_task_id = 0

    //% block
    export function setupSigfox(
        country: Country,
        sendSensors: string[]
    ): void {
        //  TODO: Validate sendSensors.
        //  TODO: Simulator mode

        //  Disable the LED because it may interfere with other sensors.
        led.enable(false)

        //  Set serial port to USB for console output.
        serial.redirectToUSB()

        //  Erase the aggregated sensor data.
        setup_aggregate(sendSensors)

        //  Start the Network Task to send and receive network messages.
        network_task_id = network_setup(country)
        ////debug_println("setupSigfox")  ////

        //  Initialise the Wisol module.  Must be done in background or the program will pause forever.
        control.inBackground(function () {
            const msg = createSensorMsg(sigfox.BEGIN_SENSOR_NAME, 0)
            ////debug_println("setupSigfox 1")  ////
            msg_post(network_task_id, msg)
            ////debug_println("setupSigfox 2")  ////
        })

        //  Wait 10 seconds for Wisol module to be initialised.
        basic.pause(10 * 1000)
        ////debug_println("setupSigfox: Done")  ////
    }

    //% block
    export function sendToSigfox(
        name: string,
        value: number
    ): void {
        ////debug_println("sendToSigfox: ", name)  ////
        const msg = createSensorMsg(name, value)
        msg_post(network_task_id, msg)
        ////debug_println("sendToSigfox: Done ", name)  ////
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
            uart_task,     //  Task will run this function.
            uartContextWrapped,  //  task_get_data() will be set to the display object.
            // 10,            //  Priority 10 = highest priority
            // (Msg_t *) uartMsgPool,  //  Pool to be used for storing the queue of UART messages.
            // UART_MSG_POOL_SIZE,     //  Size of queue pool.
            // sizeof(UARTMsg)         //  Size of queue message.
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
            network_task,   //  Task will run this function.
            wisolContextWrapped,  //  task_get_data() will be set to the display object.
            // 20,             //  Priority 20 = lower priority than UART task
            // (Msg_t *) networkMsgPool,  //  Pool to be used for storing the queue of UART messages.
            // NETWORK_MSG_POOL_SIZE,     //  Size of queue pool.
            // sizeof(SensorMsg)   //  Size of queue message.
        );

        set_uart_task_id(uartTaskID);  //  Remember the UART Task ID for sending debug messages.
        return networkTaskID;
    }

    let uartResponse: string = null

    let uartContext = <UARTContext>{
        status: false,
        sendIndex: 0,
        sentTime: 0,
        response: null,
        actualMarkerCount: 0,
        testTimer: 0,
        msg: null,
    }
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