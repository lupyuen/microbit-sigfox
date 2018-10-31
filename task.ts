namespace sigfox {
    //  Don't use debug() in this module since it's called by platform.ts.
    export const SIGFOX_SOURCE = 22569
    export interface Msg_t {
        sensorMsg?: SensorMsg
        uartMsg?: UARTMsg
    }
    export interface Context_t {
        networkContext?: NetworkContext
        uartContext?: UARTContext
    }

    //  msg_queues[task_id] is the message queue for the task.  msg_queues[0] is not used because task_id starts at 1.
    let msg_queues: Msg_t[][] = [[]]
    let next_task_id: uint8 = 1

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
            SIGFOX_SOURCE,
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
        control.onEvent(SIGFOX_SOURCE, task_id, function () {
            task_func(task_id, task_context)
        })
        return task_id
    }

    export interface Evt_t { }
    export interface Sem_t { }
    export function task_open() { }
    export function task_close() { }
    export function sem_wait(sem: Sem_t): void { }
    export function sem_signal(sem: Sem_t): void { }
    export function event_create(): Evt_t { return {}; }
    export function event_wait_multiple(mode: number, event1: Evt_t, event2: Evt_t): void { }
}