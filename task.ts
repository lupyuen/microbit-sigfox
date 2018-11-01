//% color="purple" block="Sigfox"
namespace sigfox {
    //  Don't use debug() in this module since it's called by platform.ts.
    export const second = 1000
    export enum SIGFOX_SOURCE {
        SIGFOX_MESSAGE = 22569,
        SIGFOX_EVENT,  //  22570
    }
    export interface Msg_t {
        sensorMsg?: SensorMsg
        uartMsg?: UARTMsg
    }
    export interface Context_t {
        networkContext?: NetworkContext
        uartContext?: UARTContext
    }
    export interface Evt_t { 
        event_id: number
        signalled: number
    }

    //  msg_queues[task_id] is the message queue for the task.  msg_queues[0] is not used because task_id starts at 1.
    let msg_queues: Msg_t[][] = [[]]
    let next_task_id = 1
    let next_event_id = 1

    export function msg_post(task_id: number, msg: Msg_t): void {
        if (task_id === 0 || !msg_queues[task_id]) {
            serial.writeLine("***** ERROR: msg_post / missing task ID")
            return
        }
        if (!msg) {
            serial.writeLine("***** ERROR: msg_post / missing msg")
            return
        }
        msg_queues[task_id].push(msg)
        //  Signal to the receiving task that a message is available.
        control.raiseEvent(
            SIGFOX_SOURCE.SIGFOX_MESSAGE,
            task_id
        )    
    }

    export function msg_receive(task_id: number): Msg_t {
        //  Returns "undefined" if queue is empty.
        if (task_id === 0 || !msg_queues[task_id]) {
            serial.writeLine("***** ERROR: msg_receive / missing task ID")
            return null
        }
        return msg_queues[task_id].shift()
    }    

    export function task_create(
        task_func: (task_id0: number, task_context0: Context_t) => void,
        context: Context_t
    ): number {
        if (!context) {
            serial.writeLine("***** ERROR: task_create / missing context")
            return 0
        }
        const task_context = context
        const task_id = next_task_id
        next_task_id++
        msg_queues.push([])  //  Allocate a new message queue for the new task.
        control.onEvent(
            SIGFOX_SOURCE.SIGFOX_MESSAGE,
            task_id,
            function () {
                task_func(task_id, task_context)
            }
        )
        return task_id
    }

    export function event_create(): Evt_t {
        const event_id = next_event_id
        next_event_id++
        const event = <Evt_t>{
            event_id: event_id,
            signalled: 0
        }
        return event;
    }
    export function event_reset(event: Evt_t): void {
        event.signalled = 0
    }
    export function event_signal(event: Evt_t): void {
        event.signalled++
    }
    export function event_wait_multiple(mode: number, event1: Evt_t, event2: Evt_t): void {
        //  TODO: Use blocking wait instead of polling every second.  For now this is OK, because sending via UART to the Wisol module is quite slow.
        for (; ;) {
            if (event1 && event1.signalled > 0) { break; }
            if (event2 && event2.signalled > 0) { break; }
            basic.pause(1 * second)
        }
    }

    export interface Sem_t { }
    export function task_open() { }
    export function task_close() { }
    export function sem_wait(sem: Sem_t): void { }
    export function sem_signal(sem: Sem_t): void { }
}