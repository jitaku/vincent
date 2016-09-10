module.exports.create = ()=>
    fn = (args...)->
        cbs = fn.callbacks.slice(0)
        fn.callbacks.length = 0
        # I don't catch it for easier debug.
        for callback in cbs
            callback(args...)
    fn.callbacks = []
    fn.__defineGetter__ "length",()->
        return fn.callbacks.length
    fn.__defineGetter__ "count",()->
        return fn.callbacks.length
    fn.push = (callback)->
        if typeof callback isnt "function"
            Logger.warn "SharedCallback.push with none function",callback
            return false
        @callbacks.push callback
    fn.clear = ()->
        fn.callbacks.length = 0
    return fn
