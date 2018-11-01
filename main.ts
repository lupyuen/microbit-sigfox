let sendSensors: string[] = []
let tmp = 0
let cmpMsg: sigfox.Msg_t = null
let ligMsg: sigfox.Msg_t = null
let tmpMsg: sigfox.Msg_t = null
let network_task_id = 0
let beginMsg: sigfox.Msg_t = null
let sensorMsg: sigfox.Msg_t = null
tmp = 0
led.enable(false)
beginMsg = sigfox.createSensorMsg(sigfox.BEGIN_SENSOR_NAME, 0)
sensorMsg = sigfox.createSensorMsg("tmp", 23.4)
// Erase the aggregated sensor data.
sendSensors = ["tmp", "lig", "cmp"]
sigfox.setup_aggregate(sendSensors)
network_task_id = sigfox.network_setup()
sigfox.msg_post(network_task_id, beginMsg)
basic.pause(20 * 1000)
sigfox.msg_post(network_task_id, sensorMsg)
basic.forever(function () {
	
})
control.inBackground(function () {
    while (true) {
        tmpMsg = sigfox.createSensorMsg("tmp", input.temperature())
        sigfox.msg_post(network_task_id, tmpMsg)
basic.pause(20000)
    }
})
control.inBackground(function () {
    while (true) {
        ligMsg = sigfox.createSensorMsg("lig", input.lightLevel())
        sigfox.msg_post(network_task_id, ligMsg)
basic.pause(20000)
    }
})
control.inBackground(function () {
    while (true) {
        cmpMsg = sigfox.createSensorMsg("cmp", input.compassHeading())
        sigfox.msg_post(network_task_id, cmpMsg)
basic.pause(20000)
    }
})
