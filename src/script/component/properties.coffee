class Properties extends Leaf.EventEmitter
    constructor:(target)->
        super()
        @props = {}
        if target
            @mixin(target)
    define:(property,args...)->
        # Do nothing. But programmer should better define what
        # is going to provide and document it.
    debug:(fn)->
        @isDebug = true
        @log ?= fn or Logger.debug.bind console
        return this
    _log:(args...)->
        if @isDebug
            @log args...
    mixin:(@target)->
        if not @target.listenBy
            Leaf.EventEmitter.mixin @target
        @target.get = @get.bind(this)
        @target.set = @set.bind(this)
        @target.define = @define.bind(this)
        @target.getWhenAvailable = @getWhenAvailable.bind(this)
        @target.getAndListenBy = @getAndListenBy.bind(this)
        @target.forProperties = @forProperties.bind(this)
    toJSON:()->
        return JSON.parse JSON.stringify @props
    fromJSON:(props)->
        for prop,value of props
            @set prop,value
    forProperties:(callback = ()->)->
        for k,v of @props
            callback(k,v)
    set:(key,value)->
        oldValue = @props[key]
        @props[key] = value
        @emit "change",key,value,oldValue
        @fire "property",key,value,oldValue
        @emit "change/#{key}",value,oldValue
        @fire "property/#{key}",value,oldValue
        @_log "set prop",key,"from",oldValue,"to",value
        return value
    fire:(args...)->
        @target.emit args...
    get:(key)->
        return @props[key]
    getWhenAvailable:(key,callback)->
        if typeof @props[key] isnt "undefined"
            callback @props[key]
            return
        @target.once "property/#{key}",(args...)->
            callback args...
    getAndListenBy:(who,key,callback)->
        @target.listenBy who,"property/#{key}",callback
        if typeof @props[key] isnt "undefined"
            callback.call who,@props[key]
    clear:()->
        for prop of @props
            @set(prop)
        for prop of @props
            delete @props[prop]
module.exports = Properties
