Walker = (require "./helper/walker")
WalkerRootFirst = Walker.WalkerRootFirst
COMPath = require "./path"
Errors = require "./errors"
EventEmitter = (require "./events").EventEmitter
COMTravelPolicy = require "./travelPolicy"
Trait = require "./helper/trait"

class COMCursor extends EventEmitter
    @index = 1000
    constructor:(@context,@option = {})->
        super()
        new WalkableTrait(this)
        new ConductableTrait(this)
        new CaretUISuggesterTrait(this)
        new InputSuggesterTrait(this)
        new TrapableTrait(this)
        new PointableTrait(this)
        new Teleportable(this)
        new IdenticalCursorTrasportable(this)
        @id = (COMCursor.index++).toString()
        @name = @option.name or null
        @isShadow = @option.isShadow or false
        return
    destroy:()->
        @isDestroyed = true
        @anchor?.deactivate?()
        @target = null
        @emit "destroyed"
        return true
    getPath:()->
        if not @anchor
            return null
        path = @anchor.node.getPath()
        path.anchor = @anchor.toJSON()
        return path
    getCurrentPath:()->
        if not @target
            return null
        path = new COMPath(@target)
        return path
    toJSON:()->
        if not @target
            return null
        json = {
            path:@getCurrentPath().toJSON() or null
            anchor:@anchor.toJSON()
        }
        return json
    setByJSON:(json = {})->
        return @setByPath new COMPath(json.path) or [],json.anchor or null
    setByPath:(path,anchor)->
        if not path
            return false
        child = @context.root.getChildByPath(path)
        return @pointAt child,{anchor}
    setCursorByDOMRegion:(region)->
        node = region.node
        offset = region.index
        if node instanceof Text
            target = node.parentElement
        else
            target = node
        while target and target isnt @context.root.el
            if not target.com
                target = target.parentElement
                continue
            com = target.com
            break
        if not com
            return false
        lastPointable = null
        while com.parent
            if com.anchor
                lastPointable = com
                break
            com = com.parent
        if not lastPointable
            return false
        @setByPath lastPointable.getPath()
        @anchor.setByDOM(node,offset)
        return true
    clone:()->
        cursor = @context.createCursor()
        cursor.pointAtAnchor(@anchor)
        return cursor
    getData:()->
        return {
            @context,anchor:@anchor.clone()
        }
    fromData:(data)->
        @pointAtAnchor data.anchor
        return this
    equal:(cursor)->
        return cursor.context is @context and cursor.anchor?.equal(@anchor)

# Trap means insert cursor into a rune.(For example editing @tag's content)
class TrapableTrait extends Trait
    getTrapTop:(target)->
        node = target or @target
        while node and not node.trapPolicy
            node = node.parent
        if node and node.trapPolicy
            return node
        return null
    trapIn:(node,option)->
        if not node.trapPolicy or node.trapPolicy.trap is "ignore"
            return false
        current = @getTrapTop()
        if current and not current.contains node
            Logger.error "invalid trap inhirency"
            return false
        @walkerRootFirst.setTop node
        if node.anchor
            if option.direction is "left"
                action = "head"
            else
                action = "tail"
            @pointAt node,{actions:[action]}
            return true
        @walkerRootFirst.setNode node
        if option.direction is "left"
            method = "next"
            action = "head"
        else
            method = "previous"
            action = "tail"
        if @walkerRootFirst[method]((item)->item.anchor)
            @pointAt @walkerRootFirst.node,{actions:[action]}
            return true
        @pointAt node.parent,{trapTarget:node,trapOutDirection:option.direction}
        return false
class Teleportable extends Trait
    teleportStartAnchor:null
    startTeleport:()->
        if not @anchor
            return
        @isTeleporting = true
        @teleportStartAnchor = @anchor.clone()
    endTeleport:()->
        if not @teleportStartAnchor
            return
        @isTeleporting = false
        if not @teleportStartAnchor.equal @anchor
            @emit "move"
        @teleportStartAnchor = null
# Set cursor's position by giving part of the document.
class PointableTrait extends Trait
    rev:0
    initialize:()->
        @__defineGetter__ "version",()=>
            return "#{@rev}:#{@anchor?.rev or ""}"
    pointAtRune:(rune)->
        if not rune
            return false
        parent = rune.parent
        anchor = parent.anchor?.clone()
        if not anchor
            return false
        anchor.pointAt rune
        @pointAtAnchor anchor
    pointAtAnchor:(anchor)->
        @pointAt anchor.node,{anchor:anchor.toJSON()}
    pointAt:(node,option = {})->
        if node.context isnt @context
            throw new Error "can't point at node not belongs to cursor.context"
        if @isDestroyed
            throw new Error "the cursor is already destroyed"
        if not node.anchor
            if option.trapTarget
                Logger.error "trap out to a non pointable node",node
                return false
            walker = new WalkerRootFirst(@context)
            walker.setTop node
            walker.setNode node
            result = walker.next (item)->item.anchor
            if not result
                Logger.error "can't point to target",node,"without anchor"
                return false
            node = walker.node
            if option.anchor
                Logger.error "indirect point at, ignore anchor option"
                option.anchor = null
        @walkerRootFirst.setTop @getTrapTop(node)
        # Specify the replacement cursor So deactivate don't change class name.
        # And we save some ticks.
        @anchor?.deactivate({replacementCursor:this,replacementAnchor:node.anchor})
        if @anchor
            @anchor.stopListenBy this
        @target = node
        @anchor = @target.anchor.clone()
        if option.index
            @anchor.index = option.index
        @anchor?.listenBy this,"move",()=>
            if @isTeleporting
                return
            @emit "move"
        @anchor?.activate(this)
        if option.anchor
            @anchor.fromJSON option.anchor
        if option.trapTarget
            @anchor.trapRecover option.trapTarget,option.trapOutDirection
        if option.actions
            for action in option.actions
                if typeof action is "string"
                    actionResult = @conduct action
                else
                    actionResult = @conduct action.name,action.value
        if not @isTeleporting
            @emit "move"
        @rev += 1
        if typeof actionResult is "boolean"
            return actionResult
        return true

# Give cursor ability to traverse or move around the context tree
class WalkableTrait extends Trait
    initialize:()->
        @walkerRootFirst = new WalkerRootFirst(@context)
        @walker = new Walker(@context)
    begin:()->
        @walkerRootFirst.setNode @context.root
        has = @walkerRootFirst.next (node)->
            node.anchor
        if not has
            return false
        @pointAt @walkerRootFirst.node,{actions:["head"]}
    end:()->
        @walkerRootFirst.setNode @context.root
        has = @walkerRootFirst.previous (node)->
            node.anchor
        if not has
            return false
        @pointAt @walkerRootFirst.node,{actions:["tail"]}
    next:(option)->
        @walkerRootFirst.setNode(@target)
        @walkerRootFirst.skipChildOnce = true
        if @walkerRootFirst.next((node)->node.anchor)
            @walkerRootFirst.skipChildOnce = false
            return @pointAt @walkerRootFirst.node,option
        top = @getTrapTop(@target)
        if top
            @walkerRootFirst.setTop @getTrapTop(top.parent) or null
            option ?= {}
            option.actions = []
            option.trapOutDirection = "right"
            option.trapTarget = top
            return @pointAt top.parent,option
        return false
    previous:(option)->
        @walkerRootFirst.setNode(@target)
        @walkerRootFirst.skipChildOnce = true
        if @walkerRootFirst.previous((node)->node.anchor)
            @walkerRootFirst.skipChildOnce = false
            return @pointAt @walkerRootFirst.node,option
        top = @getTrapTop()
        if top
            @walkerRootFirst.setTop @getTrapTop(top.parent) or null
            option ?= {}
            option.actions = []
            option.trapOutDirection = "left"
            option.trapTarget = top
            return @pointAt top.parent,option
        return false

# Get information for rendering caret
class CaretUISuggesterTrait extends Trait
    getBoundary:()->
        boundary = @anchor?.getCorrespondingBoundary() or null
        return boundary
    getVisualPosition:()->
        return @anchor?.getVisualPosition() or null
    getStyle:()->
        return @anchor?.getCaretStyle() or null

# Get texts around the cursor, so input method has better suggestion
class InputSuggesterTrait extends Trait
    getSurroundingText:(count)->
        return @anchor?.getSurroundingText?(count) or {before:"",after:""}
    getSurroundingWord:(count)->
        return @anchor?.getSurroundingWord(count) or {before:"",after:""}
    matchingBeforeText:(string)->
        return @anchor?.matchingBeforeText(string)
    IMEReplace:(before,after)->
        if @context.isReadonly
            @context.emit "editAttempt"
            return false
        value = false
        @context.transact ()=>
            value = @anchor?.IMEReplace before,after
        return value
# Add some cursor specific command such as moving, writing.
class ConductableTrait extends Trait
    initialize:()->
        @state = new COMCursorState(this)
        @actions = new CursorActions(this)
        @commands = new CursorCommands(this)
    conduct:(args...)->
        result = @actions.conduct args...
        if result
            #@emit "move"
            return true
        return @commands.exec args...

class CursorActions
    constructor:(@cursor)->
        @defaultPolicy = new COMTravelPolicy()
    conduct:(name,value)->
        if name.toLowerCase().indexOf("delete") >= 0
            isEditAction = true
        if isEditAction
            @cursor.captureIdenticalCursors()
            # editing action, should using capture the identical
            # cursor with it
        target = @cursor.target
        anchor = @cursor.anchor
        if not name
            return false
        if not target
            return false
        if typeof @[name] isnt "function"
            return false
        if not anchor
            return false
        policy = target.travelPolicy or @defaultPolicy
        if (not anchor[name] and not @[name]) or policy[name] is "ignore"
            return false
        result = @[name](target,anchor,policy,value)
        if isEditAction
            @cursor.transportIdenticalCursors()
        return result
    previous:(args...)->
        @cursor.previous args...
    next:(args...)->
        @cursor.next args...
    nextRune:(target,anchor,policy,option = {})->
        result = anchor.nextRune(option)
        if result
            return true
        @cursor.state.save()
        if @next {actions:["head",{name:"nextRune",value:{fresh:true}}]}
            @cursor.state.discard()
            return true
        else
            @cursor.state.restore()
            return false
    previousRune:(target,anchor,policy,option)->
        result = anchor.previousRune(option)
        if result
            return true
        @cursor.state.save()
        if @previous {actions:["tail",{name:"previousRune",value:{fresh:true}}]}
            @cursor.state.discard()
            return true
        else
            @cursor.state.restore()
            return false
    forwardChar:(target,anchor,policy)->
        result = anchor.forwardChar()
        if result
            if anchor.isTail() and policy.tailBoundary is "pass"
                @next {actions:["head"]}
            return true

        if anchor.isTail() and policy.tailBoundary is "pass"
            return @next {actions:["head"]}
        if policy.forwardBypassed is "handover"
            return @next {actions:["head","forwardChar"]}
        else if policy.forwardBypassed is "bypass"
            return @next {actions:["head"]}
        else
            return false
    applyTailBoundary:(target,anchor,policy)->
        if anchor.isTail() and policy.tailBoundary is "pass"
            @next {actions:["head","applyTailBoundary"]}
            return true
        return false
    backwardChar:(target,anchor,policy)->
        result = anchor.backwardChar()
        if result
            return true
        if policy.backwardBypassed is "handover"
            return @previous {actions:["tail","backwardChar"]}
        else if policy.backwardBypassed is "bypass"
            return @previous {actions:["tail"]}
        else
            return false
    upwardChar:(target,anchor,policy)->
        return anchor.upwardChar()
    downwardChar:(target,anchor,policy)->
        return anchor.downwardChar()
    forwardWord:(target,anchor,policy)->

        result = anchor.forwardWord()
        if result
            if anchor.isTail() and policy.tailBoundary is "pass"
                @next {actions:["head"]}
            return true
        if policy.forwardBypassed is "handover"
            return @next {actions:["head","forwardWord"]}
        else if policy.forwardBypassed is "bypass"
            return @next {actions:["head"]}
    backwardWord:(target,anchor,policy)->
        result = anchor.backwardWord()
        if result
            return true
        if policy.backwardBypassed is "handover"
            return @previous {actions:["tail","backwardWord"]}
        else if policy.backwardBypassed is "bypass"
            return @previous {actions:["tail"]}
    deleteWord:(target,anchor,policy)->
        result = anchor.backwardWord()
        if result
            return true
        if policy.backwardBypassed is "handover"
            return @previous {actions:["tail","backwardWord"]}
        else if policy.backwardBypassed is "bypass"
            return @previous {actions:["tail"]}
    head:(target,anchor,policy)->
        return anchor.head()
    tail:(target,anchor,policy)->
        return anchor.tail()
    deleteLineBeforeCursor:(target,anchor,policy,option)->
        result = anchor.deleteLineBeforeAnchor?()
        if result
            return true
        if policy.deleteBypassed is "handover"
            return @previous {actions:["tail","deleteLineBeforeCursor"]}
        else if policy.deleteBypassed is "bypass"
            return @previous {actions:["tail","deleteLineBeforeCursor"]}
        else if policy.deleteBypassed is "merge"
            if not @previous {actions:["tail"]}
                return false
            if @cursor.target.mergeContentString and target.toContentString
                @cursor.target.mergeContentString target.toContentString(),target
                target.remove()
            return false
        return false
    deleteChar:(target,anchor,policy)->
        result = anchor.deleteChar()
        if result
            return true
        if policy.deleteBypassed is "handover"
            return @previous {actions:["tail","deleteChar"]}
        else if policy.deleteBypassed is "bypass"
            return @previous {actions:["tail","deleteChar"]}
        else if policy.deleteBypassed is "merge"
            if not @previous {actions:["tail"]}
                return false
            if @cursor.target.mergeContentString and target.toContentString
                @cursor.target.mergeContentString target.toContentString(),target
                target.remove()
            return false
        return false
    startOfLine:(target,anchor,policy)->
        result = anchor.startOfLine?()
        if result
            return true
        if policy.startOfLine is "boundary"
            anchor.index = 0
            return true
        if policy.startOfLine is "handover"
            if @previous {actions:["tail","startOfLine"]}
                #@applyTailBoundary()
                return true
            else
                return @cursor.begin()
        return false
    endOfLine:(target,anchor,policy)->
        result = anchor.endOfLine?()
        if result
            return true
        if policy.endOfLine is "boundary"
            anchor.index = target.length
            return true
        if policy.endOfLine is "handover"
            if @next {actions:["endOfLine"]}
                #@applyTailBoundary()
                return true
            else
                return @cursor.end()
        return false
    deleteWord:(target,anchor,policy)->
        result = anchor.deleteWord()
        if result
            return true
        if policy.deleteBypassed is "handover"
            return @previous {actions:["tail","deleteWord"]}
        else if policy.deleteBypassed is "bypass"
            return @previous {actions:["tail","deleteWord"]}
        else if policy.deleteBypassed is "merge"
            if not @previous {actions:["tail"]}
                return false
            if @cursor.target.mergeContentString and target.toContentString
                @cursor.target.mergeContentString target.toContentString(),target
                target.remove()
            return false
        return false

    trigger:(target,anchor,policy,args...)->
        result = anchor.trigger(args...)
        if result
            @cursor.emit "trigger"
        return result
    write:(target,anchor,policy,value)->
        return anchor.write value
class CursorCommands
    constructor:(@cursor)->
    exec:(name,params...)->
        if not @cursor.target
            return false
        node = @cursor.target
        while node
            if node.exec? name,params...
                return true
            node = node.parent
        return false
class COMCursorState
    constructor:(@cursor)->
        @states = []
    save:()->
        @states.push @cursor.clone()
    discard:()->
        cursor = @states.pop()
        cursor.destroy()
    restore:()->
        cursor = @states.pop()
        if cursor and cursor.anchor
            @cursor.pointAtAnchor cursor.anchor
        cursor.destroy()
# Some cursor may point at identicle place.
# And in some editing case such as delete-char all cursor in that
# place should move along with the cursor that act delete char.
# This trait help this behavior
class IdenticalCursorTrasportable extends Trait
    friendCursors:null
    initialize:()->
        @friendCursors = []
    captureIdenticalCursors:()->
        @friendCursors.length = 0
        for id,cursor of @context.cursors
            if cursor isnt this and cursor.equal(this)
                @friendCursors.push cursor
        return true
    transportIdenticalCursors:()->
        for cursor in @friendCursors
            cursor.pointAtAnchor @anchor
        @friendCursors.length = 0

module.exports = COMCursor
