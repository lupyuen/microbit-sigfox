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
        responseMsg: Msg_t;  //  If not NULL, then send this response message when the response is completed.
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
        for (; ;) {  //  Receive the next UART message.
            let msg_t = msg_receive(os_get_running_tid());
            if (!msg_t) { break; }  //  If no message received, exit and try again later.
            ctx().msg = msg_t.uartMsg;
            if (!ctx().msg) {
                serial.redirectToUSB();
                serial.writeLine("***** ERROR: uart_task / msg is empty");
                break;
            }
            if (ctx().msg.debugMsg) {
                //  If this is a debug message, show the message on console.
                serial.writeString(ctx().msg.sendData);
                continue;
            }
            //  If this is a Wisol message, send to the Wisol module.
            const marker = String.fromCharCode(ctx().msg.markerChar);
            ctx().response = "";

            //  TODO: Call debug_flush() before sending data.
            ////serial.writeLine(">> " + ctx().msg.sendData);
            serial.writeLine(">> " + "[" + ctx().msg.markerChar + " / " +
                ctx().msg.expectedMarkerCount + "] " +
                ctx().msg.sendData);

            ////basic.pause(5 * 1000);  //  Must pause 2 seconds before writing to serial port or it gets garbled.
            serial.redirect(SerialPin.P0, SerialPin.P1, 9600);
            ////basic.pause(5 * 1000);  //  Must pause 2 seconds before writing to serial port or it gets garbled.

            //  First transmission is always corrupted. We send a dummy command as first transmission.
            basic.pause(0);  //  Must pause 0 seconds before writing to serial port or it gets garbled.
            serial.writeString("AT\r");
            serial.readUntil(marker);  //  Ignore the response.

            //  Send the actual command.
            serial.writeString(ctx().msg.sendData);

            ////ctx().response = "OK";
            for (let i = 0; i < ctx().msg.expectedMarkerCount; i++) {
                ////const line = "OK";
                const line = serial.readUntil(marker);
                ctx().response = ctx().response + line + marker;
            }
            ctx().status = true; ////TODO

            ////basic.pause(5 * 1000);  //  Must pause 2 seconds before writing to serial port or it gets garbled.
            serial.redirectToUSB();
            ////basic.pause(5 * 1000);  //  Must pause 2 seconds before writing to serial port or it gets garbled.

            serial.writeLine("<< " + ctx().response);

            if (ctx().msg.responseMsg) {
                //  If caller has requested for response message, then send it instead of event.
                serial.writeLine("uart_task: response msg"); ////
                msg_post(ctx().msg.responseTaskID, ctx().msg.responseMsg);
            } else if (ctx().status) {
                //  If no error, trigger the success event to caller.
                //  The caller can read the response from the context.response.
                ////serial.writeLine("uart_task: success"); ////
                event_signal(ctx().msg.successEvent);
            } else {
                //  If we hit an error, trigger the failure event to the caller.
                serial.writeLine("***** uart_task: failure"); ////
                event_signal(ctx().msg.failureEvent);  //  Trigger the failure event.
            }

        }  //  Loop to next incoming UART message.
        task_close();  //  End of the task.
    }
}