class DOMRegion
    @rangeFromPoint = (x,y)->
        if document.caretRangeFromPoint
            range = document.caretRangeFromPoint x,y
            return range
        else if document.caretPositionFromPoint
            position = document.caretPositionFromPoint(x,y)
            if not position
                return null
            range = document.createRange()
            range.setStart position.offsetNode,position.offset
            range.setEnd position.offsetNode,position.offset
            return range
        return null
    @fromClientPoint = (x,y)->
        range = @rangeFromPoint x,y
        if not range
            return null
        return new DOMRegion range.startContainer,range.startOffset
    @fromBoundary = (b)->
        if b.type is "include"
            for node,index in b.node.parentElement.childNodes
                if b.node is node
                    return new DOMRegion b.node.parentElement,index
        else
            return new DOMRegion(b.node,b.offset)

    constructor:(@node,@index)->
    isChar:()->
        return @node instanceof Text
    isVisibleText:()->
        char = @node.textContent[@index]
        return char isnt "\n"
    isNewLine:()->
        char = @node.textContent[@index]
        return char is "\n"
    char:()->
        char = @node.textContent[@index]
    nextChar:()->
        return @node.textContent[@index + 1]
    previousChar:()->
        return @node.textContent[@index - 1]
    selectRectByChar:(rects)->
        if rects.length is 1
            return rects[0]
        if @previousChar() is "\n"
            return rects[1]
        if rects.length > 1 and rects[0].width is 0 and rects[1].top is rects[0].top and rects[1]
            return rects[1]
        return rects[0]
        #else
        #    if @previousChar() is "\n"
        #        rect = rects[1]
        #    else
        #        rect = rects[0]
        #    if not rect
        #        return
        #    rightPart = {
        #        right:rect.right
        #        left:rect.right
        #        width:0
        #        height:rect.height
        #        bottom:rect.bottom
        #        top:rect.top
        #    }
        #    return rightPart

    isTailing:()->
        return @node.length <= @index
    getContainerElement:()->
        if @node.type is @node.ELEMENT_NODE
            return @node
        else
            return @node.parentElement
    getIncludeElement:()->
        if @node.childNodes[@index]?.type is @node.ELEMENT_NODE
            return @node.childNodes[@index]
        return null
    getClientRect:()->
        if @isChar()
            rect = @getCharClientRect()
            return rect
        else
            el = @node.childNodes[@index]
            if not el
                return null
            # For special case the rune has a different display region then it's
            # most outlined container, it's innerDisplayElement may refer to the actuall display element
            if el.innerRegionElement
                return el.innerRegionElement.getBoundingClientRect()
            return el.getBoundingClientRect()
    getRect:(option)->
        rect = @getClientRect()
        if not rect
            return null
        rect = {
            top:rect.top
            left:rect.left
            bottom:rect.bottom
            right:rect.right
            height:rect.height
            width:rect.width
        }
        #br = document.body.getBoundingClientRect()
        #rect.top -= br.top
        #rect.bottom -= br.top
        #rect.left -= br.left
        #rect.right -= br.left
        resolveScrollTopFix = (el)->
            fix = 0
            while el
                fix += el.scrollTop or 0
                if el is option.top
                    break
                el = el.parentElement
            return fix
        if option.top
            fixRect = option.top.getBoundingClientRect()
        if @isChar()
            fix = resolveScrollTopFix(@node)
        else
            fix = resolveScrollTopFix @node.childNodes[@index]
        rect.top += fix
        rect.bottom += fix
        if fixRect
            rect.left -= fixRect.left
            rect.right -= fixRect.left
            rect.top -= fixRect.top
            rect.bottom -= fixRect.top
        return rect
#    getCharClientRect:()->
#        content = @node.textContent
#        if not @isVisibleText() or @isTailing()
#            holder = "p"
#            @node.textContent = content.slice(0,@index) + holder + content.slice(@index)
#        range = document.createRange()
#        if not @node or @node.textContent.length < @index
#            return null
#        try
#            range.setStart @node,@index
#            range.setEnd @node,@index + 1
#        catch e
#            return null
#        rect = range.getBoundingClientRect()
#        if not rect
#            debugger
#        if holder
#            @node.textContent = content
#        return rect
    tryGetLeftCharClientRect:()->
        if @index < 1
            return null
        leftOne = @node.textContent[@index - 1]
        if leftOne is "\n"
            return null
        range = document.createRange()
        range.setStart @node,@index - 1
        range.setEnd @node,@index
        rect = range.getBoundingClientRect()
        if not rect
            return null
        return Object.seal {
            left:rect.right
            right:rect.right
            width:0
            height:rect.height
            top:rect.top
            bottom:rect.bottom
        }
    getCharClientRect:()->
        content = @node.textContent
        range = document.createRange()
        if not @node or @node.textContent.length < @index
            return null
        if @node.textContent.length is 0 or @isTailing()
            useHolder = true
        if @node.textContent[@index] is "\n" and @node.textContent.length - 1 is @index and @previousChar() is "\n"
            useHolder = true
        if useHolder
            holder = " "
            @node.textContent = content.slice(0,@index) + holder + content.slice(@index)
        if not @node
            return null
        range.setStart @node,@index
        range.setEnd @node,@index + 1

        rects = range.getClientRects()
        rect = @selectRectByChar(rects)

        if useHolder
            @node.textContent = content
        return rect
    describe:()->
        if @isChar()
            return @describeChar()
        else
            return @describeElement()
    describeElement:()->
        return @node.childNodes[@index]
    describeChar:()->
        contentString = @node.textContent
        extending = 20
        if contentString.length is @index
            return "Char: #{contentString}[ ]"
        return "Char: #{contentString.slice(@index - extending,@index)}[#{contentString[@index]}]#{contentString.slice(@index+1,@index+extending)}"

module.exports = DOMRegion
