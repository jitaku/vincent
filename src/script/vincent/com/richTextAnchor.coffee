# Anchor describe a position in the content.s
# Anchor should have a @index
# Compare between anchor position of the same node
# Should appears just like compare with it's index
# If you want to fake a anchor and master the cursor behavior
# , just remembers it.
COMNode = require "./node"
COMRichText = require "./richText"
StringHelper = require "./helper/string"
COMAnchor = require "./anchor"
Errors = require "./errors"
COMVisualPosition = require "./visualPosition"

class COMRichTextAnchor extends COMAnchor
    constructor:(@node)->
        super()
        @index = 0
        @rev = 0
        @__defineGetter__ "index",()=>
            return @_index
        @__defineSetter__ "index",(value)=>
            if value isnt @_index
                change = true
            if value < 0
                value = 0
            length = @node.contentString.length
            if value > length
                value = length
            @rev += 1
            @_index = value
            @_inside = false
            if change
                @emit "move"
            return @_index
        @__defineGetter__ "inside",()=>
            return @_inside
        @__defineSetter__ "inside",(value)=>
            if value isnt @_inside
                move = true
            @_inside = value
            if move
                @emit "move"
            return @_inside
        @index = 0
        # inside *hints* that wheather we are point at the current Rune
        # *hints* means that we should still check the rune at index if it is a rune
        @inside = false
        return
    getPath:()->
        path = @node.getPath()
        path.anchor = @toJSON()
        return path

    activate:(@cursor)->
        if this not in @node.anchors
            @node.anchors.push this
        if @cursor.name
            target = "cursor-over-#{@cursor.name}"
            if target not in @node.appearance.classList
                @node.appearance.classList.push target
            @node.el?.classList.add target
    deactivate:({replacementCursor,replacementAnchor} = {})->
        if @cursor and @cursor.name and (replacementCursor isnt @cursor or not @equal(replacementAnchor))
            target = "cursor-over-#{@cursor.name}"
            if target in @node.appearance.classList
                @node.appearance.classList = @node.appearance.classList.filter (item)->item isnt target
            @node.el?.classList.remove target
        @cursor = null
        @node.anchors = @node.anchors.filter (item)=>item isnt this
    toJSON:()->
        return {
            @index
            @inside
        }
    fromJSON:(json)->
        @index = json.index
        @inside = json.inside
    forwardChar:()->
        if @index < @node.length
            rune = @node.runeAtIndex @index

            if rune and @cursor.trapIn(rune,{direction:"left"})
                return true
            if rune
                # Index should never step into the rune
                # for robust. Buuut, we may mark it as enter
                # so we may
                if rune.trigger and not @inside
                    @inside = true
                else
                    @index += rune.length
            else
                @index += 1
            return true
        return false

    backwardChar:()->
        if @inside
            @inside = false
            return true
        if @index > 0
            rune = @node.runeAtIndex @index - 1
            if rune and @cursor.trapIn(rune,{direction:"right"})
                return true
            if rune
                @index -= rune.length
                if rune.trigger
                    @inside = true
            else
                @index -= 1
            return true
        return false
    trapRecover:(rune,direction = "left")->
        @node.reflow()
        for text in @node.children
            if text is rune
                if direction is "left"
                    @index = rune.startOffset
                else
                    @index = rune.endOffset
                return true
        return false
    backwardWord:()->
        if @index is 0
            return false
        @node.reflow()
        if @node.isRuneAt(@index)
            rune = @node.runeAtIndex @index
            if rune.startOffset is @index
                rune = null
        else if @node.isRuneAt(@index - 1)
            rune = @node.runeAtIndex @index - 1
        if rune
            @index = rune.startOffset
            if @index isnt 0
                return true
        contentString = @node.contentString
        find = StringHelper.findJumpBreakBackward contentString,@index
        if find.index is @index
            return false
        if rune = @node.runeAtIndex find
            if rune.index isnt find
                find = rune.endOffset
        @index = find
        return true
        contentString = @node.contentString
        maybe = contentString.slice(0,@index)
        results = maybe.split(/\b/)
        last = results.pop() or ""
        if /^\s+$/.test last
            last = (results.pop() or "") + last
        length = last.length
        start = maybe.length - length
        @index = start
        return true
    forwardWord:()->
        if @index > @node.length
            return false
        @node.reflow()
        if @node.isRuneAt(@index)
            rune = @node.runeAtIndex @index
        if rune
            @index = rune.endOffset
            return true
        contentString = @node.contentString
        find = StringHelper.findJumpBreakForward contentString,@index
        if find.index is @index
            return false
        if rune = @node.runeAtIndex find
            if rune.index isnt find
                find = rune.endOffset
        @index = find
        return true
        MAX = null
        contentString = @node.contentString
        maybe = contentString.slice(@index)
        if maybe.length is 0
            return false
        results = maybe.split /\b/
        first = results.shift() or ""
        while /^\s+$/.test first
            first = (results.shift() or "") + first
            if results.length is 0
                break
        start = first.length
        if start is 0
            start = maybe.length
        @index += start
        return true
    deleteLineBeforeAnchor:()->
        cs = @node.contentString
        index = @index
        if cs[@index] is "\n"
            @index -= 1
        while cs[@index] isnt "\n" and @index > 0
            @index -= 1
        hasNewLine = cs[@index] is "\n"
        if @index is 0
            @node.removeText 0,index
        else
            @node.removeText @index,index - @index
        if @index is 0 and not hasNewLine
            return false
        else
            return true
        return true
    deleteChar:()->
        if @inside and rune = @node.runeAtIndex @index
            rune.remove()
            @inside = false
            return true
        if @index is 0
            return false
        @node.removeText @index - 1,1
        return true
    deleteWord:()->
        if @inside and rune = @node.runeAtIndex @index
            rune.remove()
            @inside = false
            return true
        if @index is 0
            return false

        contentString = @node.contentString
        index = @index
        targetIndex = StringHelper.findJumpBreakBackward(@node.contentString,index)
        if targetIndex is index
            return false
        @node.removeText targetIndex,index - targetIndex
        return true
    startOfLine:(option = {})->
        index = @index
        contentString = @node.contentString
        if contentString[@index-1] is "\n"
            @inside = false
            return true
        while index > 0
            if contentString[index-1] is "\n" and not @node.isRuneAt index - 1
                @index = index
                return true
            index -= 1
        if option.begin
            @index = 0
            return true
        return false
    endOfLine:()->
        index = @index
        length = @node.length
        contentString = @node.contentString
        if contentString[@index] is "\n"
            return true
        while index < length
            if contentString[index+1] is "\n" and not @node.isRuneAt index + 1
                @index = index + 1
                return true
            index += 1
        return false
    isTail:()->
        return @index is @node.length
    isHead:()->
        return @index is 0
    head:()->
        @index = 0
        return true
    tail:()->
        @index = @node.length
        return true
    trigger:(option)->
        if @triggerChild(option)
            return true
        if @triggerSelf(option)
            return true
        return false
    triggerSelf:(option)->
        if @node.trigger?(option)
            return true
    triggerChild:(option = {})->
        item = @node.getChildTextByOffset @index
        if not item
            return false
        if item.sortOf "Rune"
            if @inside
                return item.trigger?()
            else
                return false
        if item.startOffset is @index and not option.force
            return false
        if item.endOffset is @index and not option.force
            return false
        if item.startOffset is @index and not item.trigger
            item = item.previous()
            if not item or not option.force
                return false
        #if item.endOffset is @index and not option.force
        #    return false
        result = item.trigger?() or false
    getVisualPosition:()->
        index = @index
        previous = null
        offset = 0
        cs = @node.contentString
        if index is 0 and cs.length is 0
            if (only = @node.children[0]) and only.getEmptyBorder
                return {
                    left:only.getEmptyBorder()
                    right:only.getEmptyBorder()
                    center:null
                }
            else
                offset = @node.el?.children?.length - 1
                return {
                    left:new COMVisualPosition.COMVisualBorder({node:@node.holder.parentElement,offset:offset,position:"left"})
                    right:new COMVisualPosition.COMVisualBorder({node:@node.holder.parentElement,offset:offset,position:"right"})
                    center:null
                }
        cs = @node.contentString
        lastChar = cs[cs.length - 1]
        for item,itemIndex in @node.children or []
            previous = @node.children[itemIndex - 1]
            next = @node.children[itemIndex + 1]
            start = offset
            end = offset + item.length
            if @inside and item.sortOf("Rune") and index >= start and index < end
                leftBorder = previous?.getVisualBorder(previous?.length,"left")
                centerBorder = item?.getVisualBorder(index - start,"inside")
                rightBorder = next?.getVisualBorder(0,"right")
                break
            if index is 0 and start is 0
                leftBorder = null
                centerBorder = null
                rightBorder = item.getVisualBorder(0,"right")
                break
            if index is start and index is end and item.getEmptyBorder
                return {
                    left:only.getEmptyBorder()
                    right:only.getEmptyBorder()
                    center:null
                }
            if index >= start and index < end
                leftBorder = item?.getVisualBorder(index - start,"left")
                centerBorder = null
                rightBorder = item?.getVisualBorder(index - start,"right")
                break
            if index is end and not @inside
                if next and next.isEmpty() and next.getEmptyBorder
                    leftBorder = next.getEmptyBorder()
                    rightBorder = next.getEmptyBorder()
                    centerBorder = null
                else
                    leftBorder = item.getVisualBorder(item.length,"left")
                    centerBorder = null
                    rightBorder = next?.getVisualBorder(0,"right")
                break
            offset += item.length
        return new COMVisualPosition({left:leftBorder,center:centerBorder,right:rightBorder})
    getCorrespondingBoundary:()->
        offset = @index
        for item,index in @node.children
            if offset > item.length
                offset -= item.length
            else if offset is item.length
                if item.sortOf("Rune") or @inside
                    offset -= item.length
                else if item.noTailingBoundary or @node.childNoTailingBoundary
                    # always use the left of the next item if no taling boundaray is specified
                    offset -= item.length
                else
                    result = item.getCorrespondingBoundaryByOffset(offset,{right:true})
                    if result
                        return result
                    else
                        offset -= item.length
            else
                if offset is 0 and item.sortOf("Rune") and @inside
                    return node:item.el,type:"include"
                return item.getCorrespondingBoundaryByOffset(offset,{right:true})
        if offset is 0
            return node:@node.holder.textNode,offset:0,type:"left"
        return null
    IMEReplace:(before,after)->
        if @inside and rune = @node.runeAtIndex @index
            @index += rune.contentString.length
        cs = @node.contentString
        shouldBe = cs.slice(@index - before.length,@index)
        if shouldBe isnt before
            return false
        offset = 0
        while before[offset] and before[offset] is after[offset]
            offset += 1
            continue
        before = before.slice(offset)
        after = after.slice(offset)
        index = @index
        if before
            @node.removeText index - before.length,before.length
        if after
            @node.insertText index - before.length,after
        return true
    getIMEAnchor:(string)->
        cs = @node.contentString
        if cs.slice(@index - string.length,@index) is string
            start = @clone()
            start.index = @index - string.length
            end = @clone()
            return {
                start
                end
            }
        return {}
    write:(value = null)->
        if not value
            return false
        @node.reflow()
        if @inside and rune = @node.runeAtIndex @index
            @index = rune.endOffset
        if value instanceof COMNode and value.sortOf("Rune")
            @node.insertRune @index,value
            return true
        if typeof value is "string"
            value = value.replace(/\t/g,"").replace(/\r\n/g,"\n").replace(/[\r\b\f\v\0]/g,"")
        @node.insertText @index,value
        return true
    setByDOM:(node,offset)->
        if typeof node not instanceof Text
            node = node.childNodes[offset] or node
        if not @node.el.contains node
            return null
        @node.reflow()
        if result = @node?.getOffsetByDOM(node,offset)
            if result
                @index = result.index
                @inside = result.inside
                return true
        if node is @node.holder.textNode
            last = @node.last()
            if last?.blockTail
                fix = -1
            else
                fix = 0
            @index = (@node.last()?.endOffset or 0) + fix
            return true
        for text in @node.children
            result = text.detectTextOffset node,offset
            if result
                if text.sortOf "Rune"
                    @index = text.startOffset
                    @inside = true
                    return true
                @index = text.startOffset + result.offset
                return true
        return false
    deleteBetween:(anchor)->
        if not anchor
            return false
        if anchor.node isnt @node
            return false
        position = @compare anchor
        if position is "after"
            return anchor.deleteBetween this
        if position is "identical"
            return false
        if position is "under"
            return false
        if position is "contain"
            return false
        if position isnt "before"
            throw new Errors.LogicError "position should be before"
        start = @index
        end = anchor.index
        startInside = @inside
        endInside = anchor.inside
        anchor.index = @index
        if endInside
            rune = @node.runeAtIndex end
            if rune
                @node.removeText end,1
        if end isnt start
            @node.removeText start,end - start
        if startInside
            rune = @node.runeAtIndex start
            if rune
                @node.removeText start,1
                @index -= rune.contentString.length
                anchor.index -= rune.contentString.length
        return true
    equal:(target)->
        if not target
            return false
        return target.node is @node and target.index is @index and target.inside is @inside
    clone:()->
        anchor = new COMRichTextAnchor(@node)
        anchor.index = @index
        anchor.inside = @inside
        return anchor
    split:()->
        if @index is @node.length or @index is 0
            return false
        after = @node.contentString.slice(@index)
        @node.removeText(@index,@node.length - @index)
        @node.after new COMRichText @node.context,{contentString:after}
        return true

    previousRune:()->
        @node.reflow()
        target = null
        for item in @node.children by -1
            if not item.sortOf("Rune")
                continue
            if item.startOffset < @index
                target = item
                @index = item.startOffset
                @inside = true
                return true
        return false
    nextRune:(option)->
        @node.reflow()
        for item in @node.children
            if not item.trigger or item.noTriggerFocus # or not item.sortOf("Rune")
                continue
            if item.startOffset > @index or (item.startOffset is @index and option.fresh)
                @index = item.startOffset
                if item.sortOf "Rune"
                    @inside = true
                return true
            else if item.startOffset is @index and not @inside and item.sortOf("Rune")

                @inside = true
                return true
        return false
    previousRune:()->
        @node.reflow()
        target = null
        for item in @node.children by -1
            if not item.trigger or item.noTriggerFocus# or not item.sortOf("Rune")
                continue
            if item.startOffset < @index
                target = item
                @index = item.startOffset
                if item.sortOf "Rune"
                    @inside = true
                return true
        return false
    afterRune:(rune)->
        if rune.parent isnt @node
            return false
        @node.reflow()
        @index = rune.startOffset + rune.length
        return true
    atRune:(rune)->
        if rune.parent isnt @node
            return false
        @node.reflow()
        @index = rune.startOffset
        @inside = true
    beforeRune:(rune)->
        if rune.parent isnt @node
            return false
        @node.reflow()
        @index = rune.startOffset
        return true
    compare:(anchor)->
        if anchor instanceof COMAnchor and anchor.node is @node
            if @index > anchor.index
                return "after"
            else if @index < anchor.index
                return "before"
            else if @index is anchor.index
                return "identical"
            return null
        else if anchor not instanceof COMAnchor
            if anchor.leftMost
                if @leftMost
                    return "identical"
                else
                    return "after"
            else if anchor.rightMost
                if @rightMost
                    return "identical"
                else
                    return "before"
            return null
        position = @node.compareNodePosition anchor.node
        if not position
            return null
        if position is "before"
            return "before"
        if position is "after"
            return "after"
        if position is "identical"
            throw new Errors.LogicError "can't have anchor has identical path but point to different node"
        if position is "under"
            # find same parent
            target = @node
            while target.parent isnt anchor.node and target
                target = target.parent
            if not target
                throw new Errors.Logic "node.compare returns under but find no common parent"
            parentAnchor = target.parent.anchor.clone()
            parentAnchor.pointAt(target)
            parentAnchor.inside = true
            if parentAnchor.index > anchor.index
                return "after"
            else if parentAnchor.index < anchor.index
                return "before"
            else if parentAnchor.inside and not anchor.index
                return "after"
            else if not parentAnchor.inside and anchor.inside
                return "before"
            else
                return "under"
        if position is "contain"
            target = anchor.node
            while target and target.parent isnt @node
                target = target.parent
            if not target
                throw new Errors.LogicError "node.compare returns contain but find no common parent"
            targetAnchor = target.parent.anchor.clone()
            targetAnchor.pointAt(target)
            targetAnchor.inside = true
            if @index > targetAnchor.index
                return "after"
            else if @index < targetAnchor.index
                return "before"
            else if @inside and not targetAnchor.index
                return "after"
            else if not @inside and targetAnchor.inside
                return "before"
            else
                return "contain"
        else throw new Errros.LogicError "unexpected node compare turn #{position}"
    pointAt:(target)->
        @node.reflow()
        for item in @node.children
            if target is item
                @index = target.startOffset
                if target.sortOf("Rune")
                    @inside = true
                return true
        return false
    getCaretStyle:()->
        return @node.caretStyle or null
    matchingBeforeText:(string)->
        cs = @node.contentString
        return cs.slice(@index - string.length,@index) is string
    getSurroundingWord:(count = 5)->
        if @inside
            return null
        cs = @node.contentString
        index = @index
        beforeCount = count
        afterCount = count
        charReg = /[a-z'"]/i
        while beforeCount > 0
            char = cs[index-1]
            # skip word space
            if char is " "
                while cs[index - 1] is " "
                    index -= 1
                beforeCount -= 1
                continue
            if not char or not charReg.test char
                break
            index -= 1
        if index < 0
            index = 0
        beforeContent = cs.slice(index,@index)
        index = @index
        while afterCount > 0
            char = cs[index]
            if char is " "
                while cs[index] is " "
                    index -= 1
                afterCount -= 1
                continue
            if not char or not charReg.test char
                break
            index += 1
        afterContent = cs.slice(@index,index)
        return {
            before:beforeContent
            after:afterContent
        }

    getSurroundingText:(count = 5)->
        if @inside
            return null
        cs = @node.contentString
        start = @index - count
        if start < 0
            start = 0
        before = cs.slice(start,@index)
        after = cs.slice(@index,@index + count)
        return {before,after}


module.exports = COMRichTextAnchor
