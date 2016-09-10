module.exports = {
    vibrate:(value)->
        window.navigator?.vibrate? value
    feedback:(value)->
        @vibrate(15)
}
