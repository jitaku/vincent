#DOMRange = require "./range"
class DOMChar
    @fromClientPoint = (x,y)->
        range = document.caretRangeFromPoint x,y
        if not range
            return null
        if range.startContainer not instanceof Text
            startOffset = 0
        else
            startOffset = range.startOffset
        return new DOMChar range.startContainer,startOffset
    constructor:(@textNode,@index)->
        if (@textNode not instanceof Text) and (@textNode instanceof HTMLElement) and typeof index is "number"
            target = @textNode
            while target not instanceof Text
                for child in target.childNodes
                    target = child
                    continue
                if child.nextSibling
                    target = child.nextSibling
                    continue


                while child.parentElement isnt @textNode
                    child = child.parentElement
                    if child.nextSibling
                        target = child.nextSibling
                        break
            if target instanceof Text
                @textNode = target
                @index = 0
            else
                @invalid = true
        return
    isVisible:()->
        char = @textNode.textContent[@index]
        return (char not in ["\n"," ","\r","\t"]) and not @isTailing()
    isTailing:()->
        return @textNode.length <= @index
    isChar:()->
        return @textNode instanceof Text
    getClientRect:()->
        if not @isChar()
            return @textNode.getBoundingClientRect()
        content = @textNode.textContent
        if not @isVisible()
            holder = "p"
            @textNode.textContent = content.slice(0,@index) + holder + content.slice(@index)
        range = document.createRange()
        if not @textNode or @textNode.textContent.length < @index
            Logger.error "invalid DOM char",@textNode,@index
            return null
        try
            range.setStart @textNode,@index
            range.setEnd @textNode,@index + 1
        catch e
            Logger.error "invalid DOM char",@textNode,@index,@describe()
            return null
        rect = range.getBoundingClientRect()
        if holder
            @textNode.textContent = content
        return rect
    getRect:(option = {})->
        rect = @getClientRect()
        rect = {
            top:rect.top
            left:rect.left
            bottom:rect.bottom
            right:rect.right
            height:rect.height
            width:rect.width
        }
        resolveScrollTopFix = (el)->
            fix = 0
            while el
                fix += el.scrollTop or 0
                if el is option.top
                    break
                el = el.parentElement
            return fix

        fix = resolveScrollTopFix(@textNode)
        rect.top += fix
        rect.bottom += fix
        return rect
    describe:()->
        if @textNode instanceof Text
            contentString = @textNode.textContent
            extending = 20
            if contentString.length is @index
                return "Char: #{contentString}[ ]"
            return "Char: #{contentString.slice(@index - extending,@index)}[#{contentString[@index]}]#{contentString.slice(@index+1,@index+extending)}"
        return "Char: Element #{@textNode},#{@index}"
module.exports = DOMChar
