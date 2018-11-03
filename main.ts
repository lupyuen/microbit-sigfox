let tmp = 0
let lig = 0
let acl = 0
sigfox.setupSigfox(sigfox.Country.COUNTRY_SG, ["tmp", "lig", "acl"])

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
        lig = input.lightLevel()
        sigfox.sendToSigfox("lig", lig)
        basic.pause(20000)
    }
})

control.inBackground(function () {
    while (true) {
        acl = input.acceleration(Dimension.Strength)
        sigfox.sendToSigfox("acl", acl)
        basic.pause(20000)
    }
})

