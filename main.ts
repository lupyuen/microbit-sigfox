let sendSensors = ["tmp", "lig", "cmp"]
sigfox.setup(sendSensors)
control.inBackground(function () {
    while (true) {
        const tmp = input.temperature()
        sigfox.process_sensor_data("tmp", tmp)
basic.pause(20000)
    }
})
control.inBackground(function () {
    while (true) {
        const lig = input.lightLevel()
        sigfox.process_sensor_data("lig", lig)
basic.pause(20000)
    }
})
control.inBackground(function () {
    while (true) {
        const cmp = input.compassHeading()
        sigfox.process_sensor_data("cmp", cmp)
basic.pause(20000)
    }
})
basic.forever(function () {
	
})
