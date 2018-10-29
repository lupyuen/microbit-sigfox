let tmp = 0
let sensorMsg: sigfox.SensorMsg = null
let beginMsg: sigfox.SensorMsg = null
beginMsg = sigfox.createSensorMsg(sigfox.BEGIN_SENSOR_NAME, 0)
sensorMsg = sigfox.createSensorMsg("tmp", 23.4)
// Erase the aggregated sensor data.
sigfox.setup_aggregate()
sigfox.network_setup()
sigfox.network_task(beginMsg)
basic.pause(20 * 1000)
sigfox.network_task(sensorMsg)
basic.forever(function () {
	
})
control.inBackground(function () {
    while (true) {
        tmp = input.temperature()
        basic.pause(20000)
    }
})
