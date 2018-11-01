sigfox.setupSigfox(["tmp", "lig", "cmp"])
control.inBackground(function () {
    while (true) {
        const tmp = input.temperature()
        sigfox.sendToSigfox("tmp", tmp)
        basic.pause(20000)
    }
})
control.inBackground(function () {
    while (true) {
        const lig = input.lightLevel()
        sigfox.sendToSigfox("lig", lig)
        basic.pause(20000)
    }
})
control.inBackground(function () {
    while (true) {
        const cmp = input.compassHeading()
        sigfox.sendToSigfox("cmp", cmp)
        basic.pause(20000)
    }
})
basic.forever(function () {
	
})
