namespace sigfox {
    export const SIGFOX_SOURCE = 22569
    let msg_queue: SensorMsg[] = []
    let next_task_id: uint8 = 1

    export function msg_post(task_id: number, msg: SensorMsg): void {
        if (task_id === 0) {
            debug("***** ERROR: msg_post / missing task ID")
            return
        }
        if (!msg) {
            debug("***** ERROR: msg_post / missing msg")
            return
        }
        msg_queue.push(msg)
        //  Signal to the receiving task that a message is available.
        control.raiseEvent(
            SIGFOX_SOURCE,
            task_id
        )    
    }

    export function msg_receive(task_id: number): SensorMsg {
        //  Returns "undefined" if queue is empty.
        return msg_queue.shift()
    }    

    export function task_create(
        task_func: (task_id0: number, task_context0: NetworkContext) => void,
        context: NetworkContext
    ): number {
        if (!context) {
            debug("***** ERROR: task_create / missing context")
            return 0
        }
        const task_context = context
        const task_id = next_task_id
        next_task_id++
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