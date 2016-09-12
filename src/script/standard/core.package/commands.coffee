ListItem = require "./element.listItem"
commands = []
commands.push {
    name:"indent-forward"
    description:"indent the region or line forward"
    handler:(editor)->
        editor.buffer.cursor.conduct "indentForward"
}
commands.push {
    name:"indent-backward"
    description:"indent the region or line backward"
    handler:(editor)->
        editor.buffer.cursor.conduct "indentBackward"
}
commands.push {
    name:"indent-region-forward"
    description:"indent the selected region"
    handler:(editor)->
        selection =  editor.buffer.selection
        cursor = editor.buffer.cursor
        if not selection.isActive or selection.isCollapsed()
            return false
        collection = selection.getSelectedCollection()
        beginIndex = collection.beginAnchorOrigin.index
        endIndex = collection.endAnchorOrigin.index
        beginLength = collection.beginNode.length
        endLength = collection.endNode.length
        for item in collection.nodes
            hasOne = true
            item.commands.indentForward?()
        beginFix = collection.beginNode.length - beginLength
        endFix = collection.endNode.length - endLength
        collection.beginAnchorOrigin.index = beginIndex + beginFix
        collection.endAnchorOrigin.index = endIndex + endFix
        return hasOne
}
commands.push {
    name:"indent-region-backward"
    description:"indent the selected region"
    handler:(editor)->
        selection =  editor.buffer.selection
        cursor = editor.buffer.cursor
        if not selection.isActive or selection.isCollapsed()
            return false
        collection = selection.getSelectedCollection()
        beginLength = collection.beginNode.length
        endLength = collection.endNode.length
        beginIndex = collection.beginAnchorOrigin.index
        endIndex = collection.endAnchorOrigin.index
        for item in collection.nodes
            hasOne = true
            item.commands.indentBackward?()
        beginFix = collection.beginNode.length - beginLength
        endFix = collection.endNode.length - endLength
        collection.beginAnchorOrigin.index = beginIndex + beginFix
        collection.endAnchorOrigin.index = endIndex + endFix
        return hasOne
}

commands.push {
    name:"list-item-swap-up"
    context:true
    description:"swap the current list item with the previous one if it is a way"
    handler:(editor)->
        context = editor.context
        cursor = editor.buffer.cursor
        target = cursor.target
        selection =  editor.buffer.selection
        if selection.isActive and not selection.isCollapsed()
            return false
        if not target or not target.sortOf("ListItem")
            return false
        previous = target.previous()
        if not previous or not previous.sortOf("ListItem")
            return false
        previous.remove()
        target.after(previous)
        return true

}
commands.push {
    name:"list-item-swap-down"
    context:true
    description:"swap the current list item with the previous one if it is a way"
    handler:(editor)->
        context = editor.context
        cursor = editor.buffer.cursor
        selection =  editor.buffer.selection
        if selection.isActive and not selection.isCollapsed()
            return false
        target = cursor.target
        if not target or not target.sortOf("ListItem")
            return false
        next = target.next()
        if not next or not next.sortOf("ListItem")
            return false
        next.remove()
        target.before(next)
        return true
}
commands.push {
    name:"list-block-swap-up"
    context:true
    description:"swap the current list item and it's children with the previsous one that has the same level or lower level then the current list"
    handler:(editor)->
        context = editor.context
        cursor = editor.buffer.cursor
        target = cursor.target
        selection =  editor.buffer.selection
        if selection.isActive and not selection.isCollapsed()
            return false
        if not target or not target.sortOf("ListItem")
            return false
        previous = target.previous()
        # find swap target
        if not previous or not previous.sortOf("ListItem")
            return false
        currentIndent = target.getIndentLevel()
        toSwap = null
        while previous
            if not previous.sortOf("ListItem")
                break
            if previous.getIndentLevel() > currentIndent
                previous = previous.previous()
                continue
            toSwap = previous
            break
        if not toSwap
            return false
        # find my block to be taken with me
        next = target.next()
        items = []
        while next
            if not next
                break
            if not next.sortOf("ListItem")
                break
            if next.getIndentLevel() <= currentIndent
                break
            items.push next
            next = next.next()
        for item in items
            item.remove()
        target.remove()
        toSwap.before(target)
        for item in items
            toSwap.before item
        return true

}
commands.push {
    name:"list-block-swap-down"
    context:true
    description:"swap the current list item and it's children with the previsous one that has the same level or lower level then the current list"
    handler:(editor)->
        context = editor.context
        cursor = editor.buffer.cursor
        target = cursor.target
        selection =  editor.buffer.selection
        if selection.isActive and not selection.isCollapsed()
            return false
        if not target or not target.sortOf("ListItem")
            return false
        next = target.next()
        # find swap target
        if not next or not next.sortOf("ListItem")
            return false
        currentIndent = target.getIndentLevel()
        toSwap = null
        while next
            if not next.sortOf("ListItem")
                break
            if next.getIndentLevel() > currentIndent
                next = next.next()
                continue
            toSwap = next
            break
        if not toSwap
            return false
        # find my block to be taken with me
        next = target.next()
        items = []
        while next
            if not next
                break
            if not next.sortOf("ListItem")
                break
            if next.getIndentLevel() <= currentIndent
                break
            items.push next
            next = next.next()
        for item in items
            item.remove()
        swapIndent = toSwap.getIndentLevel()
        if swapIndent >= currentIndent
            # will swap to tail of the the swap ListItem block
            # But if swap is lower then current we don't do so
            while next = toSwap.next()
                if not next.sortOf "ListItem"
                    break
                if next.getIndentLevel() > swapIndent
                    toSwap = next
                else
                    break
        target.remove()
        for item in items by -1
            toSwap.after item
        toSwap.after(target)
        return true
}

commands.push {
    name:"list-item-collapse-or-goto-parent"
    context:true
    description:"move caret to the parent of the current list item"
    handler:(editor)->
        context = editor.context
        cursor = editor.buffer.cursor
        target = cursor.target
        current = target
        if not target or not target.sortOf("ListItem")
            return false
        while true
            previous = target.previous()
            if not previous or not previous.sortOf("ListItem")
                break
            if previous.getIndentLevel() < current.getIndentLevel()
                target = previous
                break
            target = previous
        editor.buffer.selection.deactivate()
        parent = target
        if current.next()?.getIndentLevel?() > current.getIndentLevel()
            editor.conduct "collapse-list-item"
            return true
        context.pointIdenticalCursorsAnchor cursor,target.anchorAtBeginText()
        #cursor.pointAtAnchor target.anchorAtBeginText()
        return true
}
supportActionSelectionExpand = true
commands.push {
    name:"list-region-swap-up"
    context:true
    description:"swap the selected list region with the previous list if any"
    handler:(editor)->
        selection =  editor.buffer.selection
        cursor = editor.buffer.cursor
        if not selection.isActive or selection.isCollapsed()
            return false
        collection = selection.getSelectedCollection()
        previous = collection.beginNode.previous()
        if previous?.sortOf("ListItem") and collection?.endNode.sortOf("ListItem")
            if supportActionSelectionExpand
                collection.beginAnchorOrigin.head?()
                collection.endAnchorOrigin.tail?()
                collection.endAnchorOrigin.backwardChar?()
            previous.remove()
            collection.endNode.after previous
            return true
        return
}

commands.push {
    name:"list-region-swap-down"
    context:true
    description:"swap the selected list region with the previous list if any"
    handler:(editor)->
        selection =  editor.buffer.selection
        cursor = editor.buffer.cursor
        if not selection.isActive or selection.isCollapsed()
            return false
        collection = selection.getSelectedCollection()
        next = collection.endNode.next()
        if next?.sortOf("ListItem") and collection?.beginNode.sortOf("ListItem")
            if supportActionSelectionExpand
                collection.beginAnchorOrigin.head?()
                collection.endAnchorOrigin.tail?()
                collection.endAnchorOrigin.backwardChar?()
            next.remove()
            collection.beginNode.before next
            return true
        return true
}
commands.push {
    name:"make-list-item"
    context:true
    description:"make a new list item"
    handler:(editor)->
        cursor = editor.buffer.cursor
        target = cursor.target
        if target.mime isnt "text/com-rich-text"
            return false
        if target and target.sortOf "ListItem"
            content = target.getHead()
        else
            content = "- "
        if target.type is  "RichText"
            index = cursor.anchor.index
            char = null
            cs = cursor.target.contentString
            while index >= 0
                char = cs[index]
                if char is "\n"
                    newLine = true
                    break
                index -= 1
            sub = cs.slice(index,cursor.anchor.index)
            if /^\s*$/.test(sub) or (index is 0 and sub.length is 0)
                cursor.conduct "write",content
            else
                cursor.conduct "write","\n" + content
            return true
        else if target.sortOf "ListItem"
            after = target.contentString.slice(cursor.anchor.index)
            target.removeText(cursor.anchor.index)
            target.insertText(cursor.anchor.index,"\n")
            item = editor.context.createElement "ListItem",{contentString:content+after}
            target.after item
            cursor.context.pointIdenticalCursors cursor,item,{index:content.length}
            #editor.buffer.cursor.pointAt item
            #cursor.anchor.index = content.length
            return true
        else
            return false
}
commands.push {
    name:"make-next-list-item"
    description:"make a new list item"
    context:true
    handler:(editor)->
        cursor = editor.buffer.cursor
        result = false
        if cursor.target.type is "ListItem" and not cursor.anchor.inside
            if cursor.target?.getChildTextByOffset?(cursor.anchor.index)?.trigger
                return false
            target = cursor.target
            anchor = cursor.anchor.clone()
            if target.isEmpty()
                target.removeText(0)
                target.insertText 0,"\n"
                for anchor in target.anchors
                    anchor.index = 0
                return true
            currentIndent = target.getIndentLevel()
            if anchor.index <= currentIndent * target.spacePerIndent + 1
                return false
            if (next = target.next()) and next.sortOf("ListItem")
                nextIndent = next.getIndentLevel()
            else
                nextIndent = 0
            # If current list has a sub lists(more indent then current)
            # then we just make it a sublist
            if currentIndent > nextIndent or not next?.getHead?
                head = target.getHead()
            else
                head = next.getHead()
            if not head
                return false
            content = target.contentString.slice anchor.index
            ListItem = editor.context.getConstructor("ListItem")
            if ListItem.isContentMatchListItem content
                return false
            target.removeText anchor.index
            target.insertText anchor.index,"\n"
            item = editor.context.createElement "ListItem",{contentString:head+content}
            target.after item
            editor.buffer.context.pointIdenticalCursors cursor,item,{index:head.length}
            #cursor.pointAt item
            #cursor.anchor.index = head.length
            return true
        return false
}
commands.push {
    name:"collapse-list-item"
    context:true
    description:"collapse the below list item to target list item"
    handler:(editor)->
        cursor = editor.buffer.cursor
        target = cursor.target
        if not target.sortOf("ListItem")
            return false
        return target.collapse()
}
commands.push {
    name:"expand-list-item"
    context:true
    description:"expand the current list item if it's collapsed"
    handler:(editor)->
        cursor = editor.buffer.cursor
        target = cursor.target
        if not target.sortOf("ListItem")
            return false
        return target.expand()
}
commands.push {
    name:"expand-list-item-or-tail"
    context:true
    description:"expand the current list item if it's collapsed"
    handler:(editor)->
        cursor = editor.buffer.cursor
        target = cursor.target
        if not target.sortOf("ListItem")
            return false
        if target.isCollapsed
            return target.expand()
        next = target
        end = null
        indent = target.getIndentLevel()
        editor.buffer.selection.deactivate()
        while true
            next = next.next()
            if next and next.sortOf("ListItem") and next.getIndentLevel() > indent
                end = next
                continue
            break
        if end
            cursor.context.pointIdenticalCursors cursor,end,{index:end.length - 1}
            #cursor.pointAt end
            #cursor.anchor.index = end.length - 1
            editor.buffer.selection.deactivate()
            return true

        next = target
        while true
            next = next.next()
            if next and next.sortOf("ListItem") and next.getIndentLevel() is indent
                end = next
                continue
            break
        if end
            cursor.context.pointIdenticalCursors cursor,end,{index:end.length - 1}
            #cursor.pointAt end
            #cursor.anchor.index = end.length - 1
            editor.buffer.selection.deactivate()
            return true
        return false
}
commands.push {
    name:"toggle-list-item-type"
    context:true
    description:"toggle the current list item type to orderd or unordered"
    handler:(editor)->
        cursor = editor.buffer.cursor
        target = cursor.target
        if not target.sortOf("ListItem")
            return false
        return target.toggleOrderType()
}

commands.push {
    name:"toggle-list-item-type-in-region"
    context:true
    description:"toggle the current list item type to orderd or unordered in region"
    handler:(editor)->
        selection =  editor.buffer.selection
        cursor = editor.buffer.cursor
        if not selection.isActive or selection.isCollapsed()
            return false
        collection = selection.getSelectedCollection()
        changed = false
        for item in collection.nodes
            if item.sortOf("ListItem")
                changed = true
                item.toggleOrderType()
        return changed
}
commands.push {
    name:"start-of-list-item"
    description:"jump cursor to the start of list item if cursoring is pointing at one"
    handler:(editor)->
        cursor = editor.buffer.cursor
        target = cursor.target
        if not target.sortOf("ListItem")
            return false
        head = target.getHead()
        indexShouldBe = head.length
        item = cursor.target.getChildTextByOffset(indexShouldBe)

        if item.sortOf("Todo")
            indexShouldBe += item.length
        item = cursor.target.getChildTextByOffset indexShouldBe
        if item.sortOf("Text") and item.contentString?[indexShouldBe - item.startOffset] is " "
            indexShouldBe += 1
        if cursor.anchor.index isnt indexShouldBe
            cursor.anchor.index = indexShouldBe
            return true
        return false
}
commands.push {
    name:"start-of-headline"
    description:"jump cursor to the start of headline if cursoring is pointing at one"
    handler:(editor)->
        cursor = editor.buffer.cursor
        target = cursor.target
        if not target.sortOf("Headline")
            return false
        head = target.getPrefix()
        if cursor.anchor.index isnt head.length
            cursor.anchor.index = head.length
            return true
        return false
}
commands.push {
    name:"move-current-list-item-to-block-begin"
    context:true
    description:"move current list item to begin of the list block"
    handler:(editor)->
        cursor = editor.buffer.cursor
        target = cursor.target
        if editor.buffer.selection?.isActive
            return false
        if not target.sortOf("ListItem")
            return false
        level = target.getIndentLevel()
        left = null
        head = null
        previous = target
        while previous = previous.previous()
            if not previous or not previous.sortOf("ListItem")
                break
            if not left
                left = previous
            indent = previous.getIndentLevel()
            if indent < level
                break
            head = previous
        if not head
            return
        next = target.next()
        if next and next.sortOf("ListItem") and next.getIndentLevel() is level
            left = next
        target.remove()
        head.before target
        offset = cursor.anchor.index
        cursor.context.pointIdenticalCursors cursor,left,{index:Math.min offset,left.contentString.length - 1}
        #cursor.pointAt left
        #cursor.anchor.index = Math.min offset,left.contentString.length - 1
        return true
}
commands.push {
    name:"move-current-list-item-to-block-end"
    context:true
    description:"move current list item to end of the list block"
    handler:(editor)->
        cursor = editor.buffer.cursor
        target = cursor.target
        if editor.buffer.selection?.isActive
            return false
        if not target.sortOf("ListItem")
            return false
        level = target.getIndentLevel()
        left = null
        tail = null
        next = target
        while next = next.next()
            if not next or not next.sortOf("ListItem")
                break
            if not left
                left = next
            indent = next.getIndentLevel()
            if indent < level
                break
            tail = next
        if not tail
            return
        target.remove()
        tail.after target
        offset = cursor.anchor.index
        cursor.context.pointIdenticalCursors cursor,left,{index:Math.min offset,left.contentString.length - 1}
        #cursor.pointAt left
        #cursor.anchor.index = Math.min offset,left.contentString.length - 1
        return true
}

commands.push {
    name:"move-current-list-region-to-block-begin"
    context:true
    description:"move current list item to begin of the list block"
    handler:(editor)->
        selection =  editor.buffer.selection
        cursor = editor.buffer.selection.extentCursor
        if not selection.isActive or selection.isCollapsed()
            return false
        collection = selection.getSelectedCollection()
        for item in collection.nodes
            if not item?.sortOf("ListItem")
                return
        cursor = editor.buffer.cursor
        begin = collection.beginNode
        end = collection.endNode
        level = begin.getIndentLevel()
        left = null
        head = null
        previous = begin
        while previous = previous.previous()
            if not previous or not previous.sortOf("ListItem")
                break
            if not left
                left = previous
            indent = previous.getIndentLevel()
            if indent < level
                break
            head = previous
        if not head
            return
        for item in collection.nodes
            item.remove()
        for item in collection.nodes
            head.before item
        offset = cursor.anchor.index
        cursor.context.pointIdenticalCursors cursor,left,{index:Math.min offset,left.contentString.length - 1}
        #cursor.pointAt left
        #cursor.anchor.index = Math.min offset,left.contentString.length - 1
        selection.cancel()
        return true
}
commands.push {
    name:"move-current-list-region-to-block-end"
    context:true
    description:"move current list item to end of the list block"
    handler:(editor)->
        cursor = editor.buffer.cursor
        selection =  editor.buffer.selection
        cursor = editor.buffer.selection.extentCursor
        if not selection.isActive or selection.isCollapsed()
            return false
        collection = selection.getSelectedCollection()
        for item in collection.nodes
            if not item?.sortOf("ListItem")
                return
        begin = collection.beginNode
        end = collection.endNode

        level = end.getIndentLevel()
        left = null
        tail = null
        next = end
        while next = next.next()
            if not next or not next.sortOf("ListItem")
                break
            if not left
                left = next
            indent = next.getIndentLevel()
            if indent < level
                break
            tail = next
        if not tail
            return
        for item in collection.nodes
            item.remove()
        for item in collection.nodes by -1
            tail.after item
        offset = cursor.anchor.index
        cursor.context.pointIdenticalCursors cursor,left,{index:Math.min offset,left.contentString.length - 1}
        #cursor.pointAt left
        #cursor.anchor.index = Math.min offset,left.contentString.length - 1
        selection.cancel()
        return true
}
# Extra helper command
commands.push {
    name:"merge-current-line-with-previous"
    context:true
    description:"merge current list with previous line and join them with a space"
    handler:(editor)->
        cursor = editor.buffer.cursor
        target = cursor.target
        if not cursor.target.sortOf("RichText")
            return
        anchor = cursor.anchor.clone()
        cs = cursor.target.contentString
        while anchor.index > 0
            anchor.index -= 1
            if cs[anchor.index] is "\n"
                target.removeText(anchor.index,1)
                target.insertText(anchor.index," ")
                return true
        return false
}
commands.push {
    name:"swap-current-line-with-previous"
    context:true
    description:"merge current list with previous line and join them with a space"
    handler:(editor)->
        cursor = editor.buffer.cursor
        target = cursor.target
        if not cursor.target.sortOf("RichText")
            return

        originalIndex = cursor.anchor.index
        anchor = cursor.anchor.clone()
        cs = cursor.target.contentString
        firstStart = -1
        firstEnd = -1
        secondStart = -1
        secondEnd = -1
        while anchor.index < cs.length
            if cs[anchor.index] is "\n"
                break
            anchor.index += 1
        # be it \n or end of RichText, we consider it as a valid swap for second part
        secondEnd = anchor.index
        anchor = cursor.anchor.clone()
        while anchor.index > 0
            if cs[anchor.index - 1] is "\n"
                secondStart = anchor.index
                firstEnd = anchor.index - 1
                break
            anchor.index -= 1
        if firstEnd < 0 or secondStart < 0
            return false
        anchor.index = firstEnd
        while anchor.index > 0
            if cs[anchor.index - 1] is "\n"
                break
            anchor.index -= 1
        firstStart = anchor.index


        firstPart = cs.slice(firstStart,firstEnd) or ""
        secondPart = cs.slice(secondStart,secondEnd) or ""
        if secondEnd isnt secondStart
            target.removeText(secondStart,secondEnd - secondStart)
        if firstEnd isnt firstStart
            target.removeText(firstStart,firstEnd - firstStart)
        if secondPart
            target.insertText(firstStart,secondPart)
        if firstPart
            target.insertText(secondPart.length - firstPart.length + secondStart,firstPart)
        cursor.anchor.index = originalIndex - (firstPart.length + 1)
        return true
}
commands.push {
    name:"swap-current-line-with-next"
    context:true
    description:"merge current list with next line and join them with a space"
    handler:(editor)->
        cursor = editor.buffer.cursor
        target = cursor.target
        if not cursor.target.sortOf("RichText")
            return
        anchor = cursor.anchor.clone()
        cs = cursor.target.contentString
        firstStart = -1
        firstEnd = -1
        secondStart = -1
        secondEnd = -1
        originalIndex = cursor.anchor.index

        while anchor.index > 0
            if cs[anchor.index - 1] is "\n"
                break
            anchor.index -= 1
        firstStart = anchor.index

        anchor = cursor.anchor.clone()
        while anchor.index < cs.length
            if cs[anchor.index] is "\n"
                break
            anchor.index += 1
        # be it \n or end of RichText, we consider it as a valid swap for second part
        if anchor.index + 1 >= cs.length
            return false
        firstEnd = anchor.index
        secondStart = anchor.index + 1

        anchor.index = secondStart
        while anchor.index < cs.length
            if cs[anchor.index] is "\n"
                break
            anchor.index += 1
        secondEnd = anchor.index


        firstPart = cs.slice(firstStart,firstEnd) or ""
        secondPart = cs.slice(secondStart,secondEnd) or ""
        if secondEnd isnt secondStart
            target.removeText(secondStart,secondEnd - secondStart)
        if firstEnd isnt firstStart
            target.removeText(firstStart,firstEnd - firstStart)
        if secondPart
            target.insertText(firstStart,secondPart)
        if firstPart
            target.insertText(secondPart.length - firstPart.length + secondStart,firstPart)
        cursor.anchor.index = originalIndex + secondPart.length + 1
        return true
}
commands.push {
    name:"remove-current-list"
    context:true
    description:"remove current list item"
    handler:(editor)->
        selection =  editor.buffer.selection
        if selection.isActive and not selection.isCollapsed()
            return false
        cursor = editor.buffer.cursor
        target = cursor.target
        if not target.sortOf("ListItem")
            return false
        if (previous = target.previous()) and previous.sortOf("ListItem")
            cursor.pointAt(previous)
            cursor.conduct "endOfLine"
        else if (next = target.next()) and next.sortOf("ListItem")
            cursor.pointAt(next)
            cursor.conduct "endOfLine"
        else if (previous = target.previous())
            cursor.pointAt(previous)
            cursor.conduct "tail"
        else if (next = target.next())
            cursor.pointAt(next)
            cursor.conduct "tail"
        else
            target.removeText(0)
            return false
        target.remove()
        return true
}

commands.push {
    name:"remove-region-list"
    context:true
    description:"remove list item in the selected region"
    handler:(editor)->
        selection =  editor.buffer.selection
        if not selection.isActive or selection.isCollapsed()
            return false
        cursor = editor.buffer.cursor
        target = cursor.target

        collection = selection.getSelectedCollection()
        start = collection.nodes[0]
        end = collection.nodes[collection.nodes.length - 1]
        if (previous = start.previous()) and previous.sortOf("ListItem")
            cursor.pointAt(previous)
            cursor.conduct "endOfLine"
        else if (next = end.next()) and next.sortOf("ListItem")
            cursor.pointAt(next)
            cursor.conduct "endOfLine"
        else if (previous = start.previous())
            cursor.pointAt(previous)
            cursor.conduct "endOfLine"
        else if (next = end.next())
            cursor.pointAt(next)
            cursor.conduct "endOfLine"
        else if end and not end.sortOf("ListItem")
            cursor.pointAt(end)
            cursor.conduct "startOfLine"
        else
            start.removeText(0)
            editor.buffer.selection.collapseToCursor()
            return false
        for item in collection.nodes
            if item.sortOf("ListItem")
                item.remove()
        editor.buffer.selection.collapseToCursor()
        return true
}
module.exports = commands
