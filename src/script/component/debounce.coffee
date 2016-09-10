class Debounce extends Leaf.EventEmitter
    @debounce = (time = 0,method)->
        if typeof time is "number"
            option = {time}
        else
            option = time
        db = new Debounce(option,method)
        return db.trigger.bind(db)
    constructor:(option = {},@handler = ()-> )->
        super()
        @time = option.time or 1000
        @max = option.max or null
        @reset()
    setHandler:(@handler)->
    trigger:(args...)->
        @triggerArgs = args
        if not @firstTriggerDate and @max
            @firstTriggerDate = Date.now()
            clearTimeout @maxTimer
            @maxTimer = setTimeout ()=>
                clearTimeout @timer
                @firstTriggerDate = null
                @handler(@triggerArgs...)
                @triggerArgs = []
            ,@max
        clearTimeout @timer
        @timer = setTimeout ()=>
            clearTimeout @maxTimer
            @maxTimer = null
            @firstTriggerDate = null
            @handler(@triggerArgs...)
            @triggerArgs = []
        ,@time
        return this
    cancel:()->
        @reset()
    reset:()->
        clearTimeout @timer
        clearTimeout @maxTimer
        @firstTriggerDate = null
        @triggerArgs = []

module.exports = Debounce
