EventEmitter = (require "./events").EventEmitter
class COMIntent extends EventEmitter
    @register = (Intent,name)->
        name = name or Intent::name or Intent.name
        COMIntent.Intents[name] = Intent
    @Intents = {}
    name:"VoidIntent"
    isCaptured:false
    constructor:(@context,@name,detail = {})->
        for prop,value of detail
            @[prop] = value
    capture:()->
        @isCaptured = true

module.exports = COMIntent
