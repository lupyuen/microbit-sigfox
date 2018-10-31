namespace sigfox {
    // From uart.h
    // UART Task accepts messages of this format for
    // sending data.
    export interface UARTMsg {
        //  Msg_t super;  //  Required for all cocoOS messages.
        sendData: string;  //  Pointer to the string to be sent.
        timeout: number;  //  Send timeout in milliseconds.
        markerChar: uint8;  //  End-of-command marker character that we should count e.g. '\r'
        expectedMarkerCount: uint8;  //  Wait for this number of markers until timeout.
        successEvent: Evt_t;  //  Event to be triggered upon success.
        failureEvent: Evt_t;  //  Event to be triggered upon failure.
        responseMsg: SensorMsg;  //  If not NULL, then send this response message when the response is completed.
        responseTaskID: uint8;  //  Send to this task ID.
    }
    // UART Task maintains this context in the task data.
    export interface UARTContext {
        status: boolean;  //  Return status.  True if successfully sent.
        sendIndex: number;  //  Index of next char to be sent.
        sentTime: number;  //  Timestamp at which we completed sending.
        response: string;  //  Pointer to the buffer for writing received response.
        actualMarkerCount: uint8;  //  Actual number of markers received.
        testTimer: number;  //  For testing timer.
        msg: UARTMsg;  //  Message being sent. Set by uart_task() upon receiving a message.
    }
    // From uart.cpp
    let uartContext: UARTContext = null;
    export function setup_uart(
        context: UARTContext,  //  Will be used to store the context of the UART Task.
        response: string): void {      //  Buffer that will be used to store the UART response.
        //  Init the UART context with the response buffer.
        context.response = response;
        uartContext = context;
    }
    export function msg_post_uart(task_id: number, msg: UARTMsg): void {
        //  TODO
        if (!uartContext) {
            debug("***** ERROR: msg_post_uart / missing UART context")
            return;
        }
        debug(">> msg_post_uart ", msg.sendData)
        serial.redirect(SerialPin.P0, SerialPin.P1, 9600)
        serial.writeString(msg.sendData)
        uartContext.response = "OK"; ////
        //// uartContext.response = serial.readUntil(String.fromCharCode(msg.markerChar))
        serial.redirectToUSB()
        uartContext.status = true;
    }
}