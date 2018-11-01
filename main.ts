let lig = 0
let cmp = 0
let tmp = 0
sigfox.setupSigfox(sigfox.Country.COUNTRY_SG, ["tmp", "lig", "cmp"])
basic.forever(function () {
	
})
control.inBackground(function () {
    while (true) {
        tmp = input.temperature()
        sigfox.sendToSigfox("tmp", tmp)
        basic.pause(20000)
    }
})
control.inBackground(function () {
    while (true) {
        cmp = input.compassHeading()
        sigfox.sendToSigfox("cmp", cmp)
        basic.pause(20000)
    }
})
control.inBackground(function () {
    while (true) {
        lig = input.lightLevel()
        sigfox.sendToSigfox("lig", lig)
        basic.pause(20000)
    }
})
