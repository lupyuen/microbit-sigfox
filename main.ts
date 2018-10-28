// Erase the aggregated sensor data.
sigfox.setup_aggregate()
sigfox.network_setup()
let beginMsg = sigfox.createSensorMsg(sigfox.BEGIN_SENSOR_NAME)
sigfox.network_task(beginMsg)
basic.pause(20 * 1000)
let sensorMsg = sigfox.createSensorMsg("tmp", 23.4)
sigfox.network_task(sensorMsg)
basic.forever(function () {

})
