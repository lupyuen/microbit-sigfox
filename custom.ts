namespace sigfox {
    //% block
    export function network_setup(): uint8 {
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
            Country.COUNTRY_SG,  //  Change this to your country code. Affects the Sigfox frequency used.
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

    let uartContext = <UARTContext> {
        status: false,
        sendIndex: 0,
        sentTime: 0,
        response: null,
        actualMarkerCount: 0,
        testTimer: 0,
        msg: null,
    }
    let wisolContext = <NetworkContext> {
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