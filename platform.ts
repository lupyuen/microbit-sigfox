namespace sigfox {
    // From platform.h
    export const MAX_SENSOR_COUNT: number = 3
    export const MAX_PORT_COUNT: number = 4
    export const MAX_UART_SEND_MSG_SIZE: number = 35
    export const MAX_UART_RESPONSE_MSG_SIZE: number = 36

    //  TODO
    export function led_toggle() {}
    export function debug_flush() {}
    
    export function debug_print(p1: string, p2?: string): void {
        serial.writeString(p1)
        if (p2 !== null) { serial.writeString(p2) }
    }
    export function debug_println(p1: string, p2?: string): void {
        debug_print(p1, p2);
        serial.writeLine("");
    }
    export function debug(p1: string, p2?: string): void {
        debug_println(p1, p2);
    }
    export function millis(): int32 {
        //  Number of seconds elapsed since power on.
        return input.runningTime()
    }
    export function F(s: string): string { return s; }

}