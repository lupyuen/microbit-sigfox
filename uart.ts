namespace sigfox {
    //  Don't use debug() in this module since it's called by platform.ts.
    //  From uart.h
    //  UART Task accepts messages of this format for
    //  sending data.
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
        debugMsg: boolean;  //  True if this is a message to be shown on debug console.
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
    /*
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
    */
    //% block
    export function uart_task(task_id: number, task_context: Context_t): void {
        //  Simplified UART Task.
        if (!task_context || !task_context.uartContext) {
            serial.writeLine("***** ERROR: uart_task / missing context");
            return;
        }
        const os_get_running_tid = () => task_id;
        const ctx = () => task_context.uartContext;
        task_open();  //  Start of the task. Must be matched with task_close().  
        for (;;) {  //  Receive the next UART message.
            let msg_t = msg_receive(os_get_running_tid());
            if (!msg_t) { break; }  //  If no message received, exit and try again later.
            let msg = msg_t.uartMsg;
            if (!msg) {
                serial.redirectToUSB();
                serial.writeLine("***** ERROR: uart_task / msg is empty");
                break;
            }
            if (msg.debugMsg) {
                //  If this is a debug message, show the message on console.
                ////serial.writeString(msg.sendData);
                serial.writeLine(msg.sendData);
            } else {
                //  If this is a Wisol message, send to the Wisol module.
                serial.writeLine(">> msg_post_uart " + msg.sendData);
                serial.redirect(SerialPin.P0, SerialPin.P1, 9600);
                serial.writeString(msg.sendData);
                ctx().response = "OK"; ////
                //// ctx().response = serial.readUntil(String.fromCharCode(msg.markerChar));
                serial.redirectToUSB();
                ctx().status = true;

            }
        }  //  Loop to next incoming UART message.
        task_close();  //  End of the task.
    }    
}