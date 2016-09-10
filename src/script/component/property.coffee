class Property
    @define = (args...)->
        return new Property args...
    constructor:(@target,name)->
        # init value should be equal the original value
        @value = @target[name]
        @target.__defineGetter__ name,()=>
            if @handleGet?
                return @handleGet()
            @value
        @target.__defineSetter__ name,(value)=>
            oldValue = @value
            if @handleBeforeSet
                value = @handleBeforeSet value,oldValue
            @value = value
            if @handleAfterSet
                @handleAfterSet value,oldValue
            return value
    get:(handler)->
        @handleGet = handler
    atGet:(handler)->
        @handleGet = handler
        return this
    beforeSet:(handler)->
        @handleBeforeSet = handler
        return this
    afterSet:(handler)->
        @handleAfterSet = handler
        return this
    define:(args...)->
        return Property.define args...
module.exports = Property
