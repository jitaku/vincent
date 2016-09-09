Errors = require "./errors"
COMNode = require "./node"
# editing mark-in is a sort for operation applied.
#
# suppose we start with content:  `Hello, world.|`
# After when append `well...` at the cursor. We get `Hello, world. well...`
# We just transfromed from one state to another with a factor `{input -> "well..."}`
#
# But our case are more complicated. The seed "well..."
# maybe recognized by a certain plugin and transformed into a COM structure.
# say `Heelo, world. < WELL... >`
#
# The complete process may be
# State -> Add Seed -> Unstable state 1 -> Unstable state 2....-> NewState
# This process is called a ComposeSession
#
# That is
# State -> ComposeSession -> NewState
#
# During a `ComposeSession` the COM structure are completely standalone, and
# do not accept any input or action from outside.
#

# Basic actions

# There are 2 basic node type in COM
# 1. Node
# 2. Container
#
# Container is sort of Node.
#
# Every `Node` can be performed with a EditOperation
# Every `Container` can be performed with a TreeOperation
# Since `Container` is a `Node`, Container can also be
# performed with a EditOperation.
#
# EditOperation on a `Container` may equal or include some TreeOperation as
# a result, but shouldn't use TreeOperation.
#
# Operation has been invoked at least once to be saved as a `Record`.
# Because some information may only be gained at invoke.
# Say we want to remove a peace of text and then revoke it.
# We only known the removed part after we actually remove it.
OpIndex = 0
class EditOperation
    name:"VoidEditOperation"
    constructor:(@context,@target,@option = {})->
        @_index = OpIndex++
        if @target instanceof COMNode
            @path = @target.getPath()
        else if @target.type is "COMPath"
            @path = @target
            @target = null
    error:(message,meta)->
        error = new Errors.OperationError("Edit->#{@name} Error: #{message}",meta)
        Logger.error error,this
        return error
    invoke:()->
    revoke:()->
    toJSON:()->
        return {
            @path
            @option
        }
    describe:()->
        return @name

class ChangePropertyOperation extends EditOperation
    name:"ChangePropertyOperation"
    describe:()->
        return "change prop:"+JSON.stringify @option,null,4
    constructor:(@context,@target,@option = {})->
        super(@context,@target,@option)
        @option.property ?= {}
    invoke:()->
        @option.oldProperty ?= {}
        for prop of @option.property
            @option.oldProperty[prop] = @target[prop]
            @target[prop] = @option.property[prop]
        @target.pend()
    revoke:()->
        if @option.immutable
            return false
        for prop of @option.oldProperty
            @target[prop] = @option.oldProperty[prop]
        @target.pend()
class TreeOperation
    name:"TreeOperation"
    constructor:(@context,@target,@option = {})->
        @path = @target.getPath()
        @_index = OpIndex++
    error:(message,meta)->
        error = new Errors.OperationError("Tree->#{@name} Error: #{message}",meta)
        Logger.error error,this,this.describe()
        return error
    toJSON:()->
        return {
            @path
            @option
        }
    describe:()->
        return @name

exports.EditOperation = EditOperation
exports.TreeOperation = TreeOperation
exports.ChangePropertyOperation = ChangePropertyOperation
