namespace sigfox {
    //  Simple multitasking functions inspired by cocoOS: http://www.cocoos.net/
    //  The original Arduino / STM32 Blue Pill C++ code is based on cocoOS,
    //  so these functions are used in the porting to JavaScript.
    //  Don't use debug() in this module since it's called by platform.ts.
    export const second = 1000
    export enum SIGFOX_SOURCE {
        //  Identify the event source.
        SIGFOX_MESSAGE = 22569,   //  Event that will be triggered to a task when it has an incoming message.
        SIGFOX_EVENT,  //  22570  //  General event.
    }
    export interface Msg_t {
        //  We allow sending of Sensor Messages and UART Messages only.
        sensorMsg?: SensorMsg
        uartMsg?: UARTMsg
    }
    export interface Context_t {
        //  We support Network Context and UART Context only.
        networkContext?: NetworkContext
        uartContext?: UARTContext
    }
    export interface Evt_t {
        //  General event that may be signalled.
        event_id: number   //  Unique event ID.
        signalled: number  //  0 if not signalled, >0 if signalled.
    }

    //  msg_queues[task_id] is the message queue for the task.  msg_queues[0] is not used because task_id starts at 1.
    let msg_queues: Msg_t[][] = [[]]
    let next_task_id = 1
    let next_event_id = 1

    export function msg_post(task_id0: number, msg: Msg_t): void {
        //  Post a message to the task ID.  Messages are stored in the message queue arrays.
        //  We send an event to trigger the task.
        let task_id = task_id0
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
        //  Receive a message for the task ID.  Returns "undefined" if queue is empty.
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
        //  Run the task function repeatedly when triggered by the task event.  Return the task ID.
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
        //  Create a new event.
        const event_id = next_event_id
        next_event_id++
        const event = <Evt_t>{
            event_id: event_id,
            signalled: 0
        }
        return event;
    }
    export function event_reset(event: Evt_t): void {
        //  Reset the event to the unsignalled state.
        event.signalled = 0
    }
    export function event_signal(event: Evt_t): void {
        //  Mark the event as signalled.  Should be atomic.
        event.signalled++
    }
    export function event_wait_multiple(mode: number, event1: Evt_t, event2: Evt_t): void {
        //  Wait and return only when event1 or event2 has been signalled.
        //  TODO: Use blocking wait instead of polling every second.  For now this is OK, because sending via UART to the Wisol module is quite slow.
        for (; ;) {
            if (event1 && event1.signalled > 0) { break; }
            if (event2 && event2.signalled > 0) { break; }
            basic.pause(1 * second)
        }
    }

    //  Task open/close are not implemented for now. The semantics are different from cocoOS.  Here we run tasks when triggered by the task event.
    export function task_open() { }
    export function task_close() { }

    //  Semaphores are not implemented for now.
    export interface Sem_t { }
    export function sem_wait(sem: Sem_t): void { }
    export function sem_signal(sem: Sem_t): void { }
}