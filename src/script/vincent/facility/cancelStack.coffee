class CancelStack extends Leaf.EventEmitter
    constructor:(@editor)->
        super()
        @stack = []
        @emptyHandlers = []
        @editor.commands.register {
            name:"cancel-stack-cancel-top"
            handler:()=>
                return @cancelTop()
        }
        #window.addEventListener "keydown",(e)=>
        #    if e.which is Leaf.Key.escape and @stack.length > 0
        #        e.preventDefault()
        #        e.stopImmediatePropagation()
        #        @cancelTop()
        #        return true
        #    return false
        @editor.hotkeys.registerCommandHotkey "editor:escape","cancel-stack-cancel-top"
        @historyHandler = @historyHandler.bind(this)
    handleEmpty:()->
        for callback in @emptyHandlers
            callback(e = new CancelEvent)
            if e.isCaptured
                return true
        return false
    registerEmptyHandler:(handlers)->
        @emptyHandlers.push handlers
    bindHistory:(@history)->
        @registerHistory()
    registerHistory:()->
        if not @history
            return
        @history.remove this
        @history.unshift this,@historyHandler
    historyHandler:()->
        @cancelTop()
        @registerHistory()
    cancelTop:()->
        if @stack.length > 0
            item = @stack.pop()
            item.callback()
            if @stack.length is 0
                @emit "empty"
            return true
        else if @handleEmpty()
            return true
        else
            @history.remove this
        return false
    push:(id,callback)->
        @registerHistory()
        @stack.push {
            id:id
            callback:callback
        }
        if @stack.length is 1
            @emit "occupied"
    isEmpty:()->
        return @stack.length is 0
    remove:(id)->
        change = false
        @stack = @stack.filter (item)->
            if item.id is id
                change = true
                return false
            return true
        if @stack.length is 0 and change
            @emit "empty"
class CancelEvent
    constructor:()->
    capture:()->
        @isCaptured = true
module.exports = CancelStack
