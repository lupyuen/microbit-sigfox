namespace sigfox {
    //% block
    export function network_setup() {
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
        // Start the Network Task for receiving sensor data
        // and transmitting to UART Task.
        setup_wisol(
            wisolContext,  //  Init the context for the Network Task.
            uartContext,
            0,
            Country.COUNTRY_SG,  //  Change this to your country code. Affects the Sigfox frequency used.
            false);
    }
    export function task_open() {

    }
    export function task_close() {

    }
    /*
    let RESPONSE_SENSOR_NAME = ""
    let MAX_TIMEOUT = 0
    let ENABLE_DOWNLINK = false
    let MAX_SENSOR_COUNT = 0
    let msg: SensorMsg = null
    let MAX_UART_SEND_MSG_SIZE = 0
    let SEND_INTERVAL = 0
    let MAX_NETWORK_CMD_LIST_SIZE = 0
    let COMMAND_TIMEOUT = 0
    let UPLINK_TIMEOUT = 0
    let DOWNLINK_TIMEOUT = 0
    let PAYLOAD_SIZE = 0
    */

    let uartResponse: string = null

    export interface Evt_t { }
    export interface Sem_t { }
    export function sem_wait(sem: Sem_t): void { }
    export function sem_signal(sem: Sem_t): void { }
    export function event_create(): Evt_t { return {}; }
    export function event_wait_multiple(mode: number, event1: Evt_t, event2: Evt_t): void { }
    export function os_get_running_tid(): number { return 2205; }
    export function msg_receive(task_id: number, msg: SensorMsg): void {
        //  TODO
    }
    export function msg_post(task_id: number, msg: UARTMsg): void {
        //  TODO
        debug(">> msg_post ", msg.sendData)
        serial.redirect(SerialPin.P0, SerialPin.P1, 9600)
        serial.writeString(msg.sendData)
        uartContext.response = "OK"; ////
        //// uartContext.response = serial.readUntil(String.fromCharCode(msg.markerChar))
        serial.redirectToUSB()
        uartContext.status = true;
    }
    export function ctx(): NetworkContext { return wisolContext; }
    // TODO
    let uartContext: UARTContext = {
        status: false,
        sendIndex: 0,
        sentTime: 0,
        response: null,
        actualMarkerCount: 0,
        testTimer: 0,
        msg: null,
    }
    let wisolContext: NetworkContext = {
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