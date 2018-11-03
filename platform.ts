namespace sigfox {
    // From platform.h
    export const MAX_SENSOR_COUNT: number = 3
    export const MAX_PORT_COUNT: number = 4
    export const MAX_UART_SEND_MSG_SIZE: number = 35
    export const MAX_UART_RESPONSE_MSG_SIZE: number = 36

    let uartTaskID = 0
    let debugBuffer: string[] = []
    const MAX_DEBUG_BUFFER_SIZE = 10
    
    //  TODO
    export function led_toggle() { }
    export function millis(): int32 {
        //  Number of seconds elapsed since power on.
        return input.runningTime()
    }
    export function F(s: string): string { return s; }

    export function debug(p1: string, p2: string = null): void {
        debug_println(p1, p2);
        debug_flush();
    }

    export function debug_flush(): void {
        if (debugBuffer.length == 0) { return; }
        const s = debugBuffer.join("");
        debugBuffer = [];
        uart_write(s);
    }

    export function debug_print(p1: string, p2: string = null): void {
        const s = p1 + ((p2 === null) ? "" : p2);
        debugBuffer.push(s);
        if (debugBuffer.length >= MAX_DEBUG_BUFFER_SIZE) {
            debug_flush();
        }
    }

    export function debug_println(p1: string, p2: string = null): void {
        const s = p1 + ((p2 === null) ? "" : p2);
        debug_print(s + "\n");
    }

    export function set_uart_task_id(task_id: number): void {
        uartTaskID = task_id;
    }

    function uart_write(s: string): void {
        if (uartTaskID === 0) {
            serial.writeLine("***** ERROR: uart_write / missing UART task ID");
            return;
        }
        const uartMsg = <UARTMsg>{
            debugMsg: true,
            sendData: s,
            //  Set to default values below, not used.
            timeout: 0,
            markerChar: 0,
            expectedMarkerCount: 0,
            successEvent: null,
            failureEvent: null,
            responseMsg: null,
            responseTaskID: 0,
        };
        const msg = <Msg_t>{ uartMsg: uartMsg };
        msg_post(uartTaskID, msg);
    }
}