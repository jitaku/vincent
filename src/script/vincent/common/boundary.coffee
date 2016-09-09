class DOMBoundary
    @createRangeBetween = (b1,b2)->
        b1 = new DOMBoundary(b1)
        b2 = new DOMBoundary(b2)
        range = document.createRange()
        position = b1.compare b2
        if position is "identical"
            if b1.include or b2.include
                range.setStart b1.getTargetParent(),b1.getTargetIndex()
                range.setEnd b1.getTargetParent(),b1.getTargetIndex() + 1
            else
                range.setStart b1.getTargetParent(),b1.getTargetIndex()
                range.setEnd b1.getTargetParent(),b1.getTargetIndex()
            return range
        if position is "after"
            b = b2
            b2 = b1
            b1 = b
        startTarget = b1.getTargetParent()
        if not startTarget
            Logger.error "no start target",b1
            return null
        startIndex = Math.min(startTarget.length or startTarget.children?.length or 0,b1.getTargetIndex())
        range.setStart startTarget,startIndex
        if b2.include
            fix = 1
        else
            fix = 0
        range.setEnd b2.getTargetParent(),b2.getTargetIndex() + fix
        return range


    constructor:(option = {})->
        @node = option.node
        @offset = option.offset or 0
        @type = option.type or "left"
        @include = @type is "include"
    getAdjacentElement:()->
        # If current region is start of text(index = 0)
        # adjacent element will be the left element
        # or current region is end of the text(index = length)
        # adjacent element will be the right element
        # If current region is point at a element
        # the adjacent element left element and right element
        result = {}
        if not @include
            if @offset is 0 and @type is "left"
                result.left = @getPreviousElement @node.parentElement
            if @offset is @node.length or (@offset is @node.length - 1 and @type is "right")
                result.right = @getNextElement @node.parentElement
        else
            target = @node.childNodes[@offset]
            result.left = @getPreviousElement target
            result.right = @getNextElement target
        return result
    getNextElement:(el)->
        while el
            if el.nextElementSibling
                return el.nextElementSibling
            else
                el = el.parentElement
        return null
    getPreviousElement:(el)->
        while el
            if el.previousElementSibling
                return el.previousElementSibling
            else
                el = el.parentElement
        return null
    getTargetElement:()->
        if @type is "include"
            return @node
        return @node.childNodes and @node.childNodes[@offset or 0] or null
    getTargetParent:()->
        if @type is "include"
            return @node.parentElement
        else
            return @node
    getTargetIndex:()->
        if @type is "right"
            fix = 1
        else
            fix = 0
        if @type is "include"
            for child,index in @node.parentElement.childNodes
                if child is @node
                    return index + fix
        else
            return @offset + fix
        return null
    compare:(boundary)->
        result = @getTargetParent()?.compareDocumentPosition boundary.getTargetParent()
        o1 = @getTargetIndex() or 0
        o2 = boundary.getTargetIndex() or 0
        if result is 0
            if o1 > o2
                return "after"
            else if o1 < o2
                return "before"
            else
                return "identical"
        else if (result & 8) is 8
            # boundary contains me
            # so try compare to the boundarys child
            # bounday must have targetElement since it contains me means
            # it's not a TextNode.
            subResult = @getTargetParent()?.compareDocumentPosition(boundary.getTargetElement())
            if (subResult & 8) is 8
                # boundary still contains
                # considered as before, since parent are pointed at 0
                # parent are always considered index at 0
                return "after"
            else if (subResult & 2) is 2
                return "after"
            else
                return "before"
        else if (result & 16) is 16
            # I contain boundary
            subResult = @getTargetElement()?.compareDocumentPosition(boundary.getTargetParent())
            if (subResult & 16) is 16
                # still contains
                # considered as before, since parent are pointed at 0
                return "before"
            else if (subResult & 2) is 2
                return "after"
            else
                return "before"
        else if (result & 2) is 2
            return "after"
        else
            return "before"
module.exports = DOMBoundary
