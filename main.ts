let network_task_id = 0
let tmp = 0
let beginMsg: sigfox.SensorMsg = null
let sensorMsg: sigfox.SensorMsg = null
beginMsg = sigfox.createSensorMsg(sigfox.BEGIN_SENSOR_NAME, 0)
sensorMsg = sigfox.createSensorMsg("tmp", 23.4)
// Erase the aggregated sensor data.
sigfox.setup_aggregate()
network_task_id = sigfox.network_setup()
sigfox.msg_post(network_task_id, beginMsg)
basic.pause(20 * 1000)
sigfox.msg_post(network_task_id, sensorMsg)
basic.forever(function () {
	
})
control.inBackground(function () {
    while (true) {
        tmp = input.temperature()
        sensorMsg = sigfox.createSensorMsg("tmp", tmp)
        sigfox.msg_post(network_task_id, sensorMsg)
basic.pause(20 * 1000)
    }
})
