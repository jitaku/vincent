COMCursor = require "./cursor"
WalkerRootFirst = (require "./helper/walker").WalkerRootFirst
Errors = require "./errors"
# Selection is decide by 2 Cursor. Base and Extent.
# Base means start of the selection.
# Extent means end of the selection.
# Caret go from start and point at end.
class COMSelection
    constructor:(@context,cursor)->
        @baseCursor = @context.createCursor({isShadow:true,name:"baseCursor"})
        @extentCursor = cursor
        @__defineGetter__ "baseAnchor",()->
            return @baseCursor.anchor
        @__defineGetter__ "extentAnchor",()->
            return @extentCursor.anchor
    fromAnchor:(baseAnchor,extentAnchor)->
        @baseCursor.pointAtAnchor baseAnchor
        @extentCursor.pointAtAnchor extentAnchor
        if not @isActive
            @collapseToCursor()
        return true
    fromDOMRegion:(base,extent)->
        if not @baseCursor.setCursorByDOMRegion(base)
            return false
        if not @extentCursor.setCursorByDOMRegion(extent)
            return false
        if not @isActive
            @collapseToCursor()
        return true
    activate:()->
        if @isActive
            return
        @isActive = true
        @collapseToCursor()
    deactivate:()->
        if not @isActive
            return
        @isActive = false

    cancel:()->
        @collapseToCursor()
        @deactivate()
    collapseToBegin:()->
        position = (@baseAnchor?.compare @extentAnchor)
        if not position
            return false
        if position is "after"
            swap = true
        if swap
            @collapseToCursor(@extentCursor)
        else
            @collapseToCursor(@baseCursor)
    collapseToEnd:()->
        position = (@baseAnchor?.compare @extentAnchor)
        if not position
            return false
        if position is "after"
            swap = true
        if swap
            @collapseToCursor(@baseCursor)
        else
            @collapseToCursor(@extentCursor)
    collapseToCursor:(cursor = @extentCursor)->
        if not cursor or not cursor.anchor
            return false
        @baseCursor.pointAtAnchor cursor.anchor
        if cursor isnt @extentCursor
            @extentCursor.pointAtAnchor cursor.anchor
        return true

    baseAction:(args...)->
        @baseCursor.conduct args...
    extentAction:(args...)->
        @extentCursor.conduct args...
    clear:()->
        @baseAnchor = null
        @extentAnchor = null
    isValid:()->
        return @baseAnchor?.node.root? and @extentAnchor?.node.root?
    isCollapsed:()->
        if not @baseAnchor or not @extentAnchor
            return true
        return (@baseAnchor.node is @extentAnchor.node and @baseAnchor.index is @extentAnchor.index and @baseAnchor.inside? is @extentAnchor.inside?)
    debug:()->
        return "#{@baseAnchor.node.type}:#{@baseAnchor.index}~#{@extentAnchor.node.type}:#{@extentAnchor.index}"
    selectAll:()->
        @activate()
        walker = new WalkerRootFirst(@context)
        if not walker.first((item)->item.anchor)
            return false
        first = walker.node
        if not walker.last((item)->item.anchor)
            return false
        last = walker.node
        @fromAnchor first.anchor,last.anchor
        @baseCursor.conduct "head"
        @extentCursor.conduct "tail"
    getSelectedCollection:()->
        if not @isValid()
            return null
        position = (@baseAnchor.compare @extentAnchor)
        # If anchor compares return under/contains
        # This indicates that one anchor is really inside another.
        # We have no way to know who is before/after.
        # And in really this will just never happend, since trap
        # into a rune will always deactive a selection so just feel safe
        # at least for now....
        if position is "after"
            swap = true
        if not swap
            beginNode = @baseAnchor.node
            endNode = @extentAnchor.node
            beginAnchor = @baseAnchor.clone()
            endAnchor = @extentAnchor.clone()
            beginAnchorOrigin = @baseAnchor
            endAnchorOrigin = @extentAnchor
        else
            beginNode = @extentAnchor.node
            endNode = @baseAnchor.node
            beginAnchor = @extentAnchor.clone()
            endAnchor = @baseAnchor.clone()
            beginAnchorOrigin= @extentAnchor
            endAnchorOrigin= @baseAnchor
        walker = new WalkerRootFirst(@context)
        walker.setNode beginNode
        results = []
        while true
            if not walker.node
                break
            anchor = walker.node.anchor.clone()
            anchor.head()
            beginPosition = anchor.compare endAnchor
            anchor.tail()
            endPosition = anchor.compare endAnchor
            position = walker.node.compareNodePosition endNode
            if beginPosition in ["identical","after"]
                if beginPosition is "identical"
                    results.push walker.node
                break
            if endPosition is "before"
                results.push walker.node
                walker.skipChildOnce = true
                if not walker.next ((item)->item.anchor)
                    break
                continue
            if endPosition is "identical"
                results.push walker.node
                break
            if endPosition is "after" # and beginPosition is "before" of course
                results.push walker.node
                break
            # Just consider under/contains as completely include
            # because under/contain only happens when parent anchor
            # has property inside, which is very much like identical
            # but we still remain the anchor information for future
            # clipping.
            if endPosition in ["under","contain"]
                results.push walker.node
                break
            throw new Errors.LogicError "anchor compare returns unexpected value #{beginPosition} #{endPosition}"
        result = {
            beginNode:beginNode
            endNode:endNode
            beginAnchor:beginAnchor
            endAnchor:endAnchor
            nodes:results
            beginAnchorOrigin
            endAnchorOrigin
        }
        return result
    copySelectedNodes:()->
        collection = @getSelectedCollection()
        #result = @context.root.toJSON({left:collection.beginAnchor.getPath(),right:collection.endAnchor.getPath()})
        result = @context.root.slice({left:collection.beginAnchor,right:collection.endAnchor,selection:true})
        return result
    cutSelectedNodes:()->
        result = @copySelectedNodes()
        @removeSelectedNodes()
        return result
    removeSelectedNodes:()->
        collection = @getSelectedCollection()
        if collection.beginNode is collection.endNode
            collection.beginAnchor.deleteBetween collection.endAnchor
        else
            for node in collection.nodes
                if node is collection.beginNode
                    tail = collection.beginAnchor.clone()
                    tail.tail()
                    collection.beginAnchor.deleteBetween tail
                else if node is collection.endNode
                    head = collection.endAnchor.clone()
                    head.head()
                    head.deleteBetween collection.endAnchor
                else
                    node.remove()
        collection.beginNode.anchor.fromJSON collection.beginAnchor.toJSON()
        @extentCursor.pointAtAnchor collection.beginAnchor
        @collapseToCursor()
        @cancel()
        return collection
module.exports = COMSelection
