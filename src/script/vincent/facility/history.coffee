#class History
#    constructor:(@editor)->
#        @maxLength = 1000
#        @stack = []
#        @index = -1
#        # always keep one history in stack
#        @watch()
#    watch:()->
##        @timer = setInterval ()=>
##            @save()
##        ,1000
#    isIdentical:(json)->
#        last = @stack[@index]
#        if not last
#            return false
#        return (JSON.stringify json.content) is (JSON.stringify last.content)
#    # add index by 1
#    # get the history and add index by 1 if history not match
#    # and clear the history after that
#    save:()->
#        history = @editor.context.toJSON()
#        # No history will be the same with previous one
#        if @isIdentical history
#            return false
#        @index += 1
#        @stack.splice(@index > 0 and @index or 0,0,history)
#        @stack = @stack.slice(0,@index+1)
#        if @stack.length > @maxLength
#            @stack.shift()
#            @index -= 1
#        return true
#    undo:()->
#        if @index is @stack.length - 1
#            # We are in the end history (not during redo session)
#            # save the current editor state a enter a redo session
#            # current index should point to the current state after this action
#        @save()
#
#        history = @stack[@index]
#        @index -= 1
#        if @index < 0
#            @index = 0
#        if not history
#            return false
#        @editor.context.fromJSON history
#        return true
#    redo:()->
#        if @isIdentical @editor.context.toJSON()
#            if @index < @stack.length - 1
#                @index  += 1
#                return @redo()
#        if @index >= @stack.length - 1
#            return false
#        @index += 1
#        history = @stack[@index]
#        @editor.context.fromJSON history
#        return true
#
#module.exports = History
