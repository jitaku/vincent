commands = []
addCommand = (command)->
    commands.push command

addCommand {
    name:"cancel-selection"
    description:"cancel the current selection"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        return editor.buffer?.selection.cancel()
}
addCommand {
    name:"active-selection"
    description:"active the selection so you can expand it"
    handler:(editor)->
        editor.buffer?.selection.activate()
        return false
}
addCommand {
    name:"toggle-selection-active"
    description:"toggle the activation of the selection so you can expand it"
    handler:(editor)->
        if editor.buffer?.selection.isActive
            editor.buffer?.selection.deactivate()
        else
            editor.buffer?.selection.activate()
        return false
}
addCommand {
    name:"deactive-selection"
    description:"deactive the selection so you can easily cancel it"
    handler:(editor)->
        editor.buffer?.selection.deactivate()
        return false
}

addCommand {
    name:"forward-char"
    description:"forward the cursor to next char"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        return editor.caret.forwardChar()
}
addCommand {
    name:"backward-char"
    description:"backward the cursor to next char"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        return editor.caret.backwardChar()
}
addCommand {
    name:"backward-word"
    description:"backward the cursor to next char"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        return editor.buffer.cursor.conduct "backwardWord"
}
addCommand {
    name:"forward-word"
    description:"forward the cursor to next char"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        return editor.buffer.cursor.conduct "forwardWord"
}

addCommand {
    name:"upward-char"
    description:"move the cursor upward"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        return editor.caret.upwardChar()
}
addCommand {
    name:"downward-char"
    description:"move the cursor downward"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        return editor.caret.downwardChar()
}

addCommand {
    name:"write"
    description:"write a string <value> at the current cursor"
    handler:(editor,value)->
        editor.buffer?.selection.cancel()
        return editor.caret.write(value)
}
addCommand {
    name:"delete-char"
    description:"delete char at the current cursor"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        return editor.buffer.cursor.conduct "deleteChar"
}
addCommand {
    name:"delete-line-before-cursor"
    description:"delete line at the current charactor"
    handler:(editor,value)->
        editor.buffer?.selection.cancel()
        return editor.buffer.cursor.conduct "deleteLineBeforeCursor"
}
addCommand {
    name:"delete-word"
    description:"delete word at the current cursor"
    handler:(editor,value)->
        editor.buffer?.selection.cancel()
        return editor.buffer.cursor.conduct "deleteWord"
}
addCommand {
    name:"delete-current-word"
    description:"delete next word after the current cursor"
    handler:(editor,value)->
        editor.buffer?.selection.cancel()
        if not editor.buffer.cursor.conduct "forwardWord"
            return false
        return editor.buffer.cursor.conduct "deleteWord"
}
addCommand {
    name:"previous-page"
    description:"scroll the view port to previous page and set cursor if needed"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        editor.buffer.viewPort.previousPage()
        editor.caret.moveToViewPortCenter()
        return true
}
addCommand {
    name:"go-top"
    description:"scroll the view port to previous page and set cursor if needed"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        editor.caret.begin()
        #editor.buffer.viewPort.goTop()
        #editor.buffer.viewPort.moveCaretToComfortableZoneLazy()
        return true
}
addCommand {
    name:"go-bottom"
    description:"scroll the view port to previous page and set cursor if needed"
    handler:(editor)->
        editor.buffer?.selection?.cancel()
        editor.caret.end()
        #editor.buffer.viewPort.goBottom()
        #editor.buffer.viewPort.moveCaretToComfortableZoneLazy()
        return true
}
addCommand {
    name:"next-page"
    description:"scroll the view port to next page and set cursor if needed"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        editor.buffer.viewPort.nextPage()
        editor.caret.moveToViewPortCenter()
        return true
}
# start selective
addCommand {
    name:"selective-forward-char"
    description:"forward the cursor to next char"
    handler:(editor)->
        editor.buffer?.selection.activate()
        return editor.caret.forwardChar()
}
addCommand {
    name:"selective-backward-char"
    description:"backward the cursor to next char"
    handler:(editor)->
        editor.buffer?.selection.activate()
        return editor.caret.backwardChar()
}
addCommand {
    name:"selective-backward-word"
    description:"backward the cursor to next char"
    handler:(editor)->
        editor.buffer?.selection.activate()
        return editor.buffer.cursor.conduct "backwardWord"
}
addCommand {
    name:"selective-forward-word"
    description:"forward the cursor to next char"
    handler:(editor)->
        editor.buffer?.selection.activate()
        return editor.buffer.cursor.conduct "forwardWord"
}

addCommand {
    name:"selective-upward-char"
    description:"move the cursor upward"
    handler:(editor)->
        editor.buffer?.selection.activate()
        return editor.caret.upwardChar()
}
addCommand {
    name:"selective-downward-char"
    description:"move the cursor downward"
    handler:(editor)->
        editor.buffer?.selection.activate()
        return editor.caret.downwardChar()
}

addCommand {
    name:"selective-write"
    description:"write a string <value> at the current cursor"
    handler:(editor,value)->
        editor.buffer?.selection.activate()
        return editor.caret.write(value)
}
addCommand {
    name:"selective-delete-char"
    description:"write a string <value> at the current cursor"
    handler:(editor)->
        editor.buffer?.selection.activate()
        return editor.buffer.cursor.conduct "deleteChar"
}
addCommand {
    name:"selective-delete-word"
    description:"write a string <value> at the current cursor"
    handler:(editor,value)->
        editor.buffer?.selection.activate()
        return editor.buffer.cursor.conduct "deleteWord"
}
addCommand {
    name:"selective-previous-page"
    description:"scroll the view port to previous page and set cursor if needed"
    handler:(editor)->
        editor.buffer?.selection.activate()
        editor.buffer.viewPort.previousPage()
        editor.caret.moveToViewPortCenter()
        return true
}
addCommand {
    name:"selective-go-top"
    description:"scroll the view port to previous page and set cursor if needed"
    handler:(editor)->
        editor.buffer?.selection.activate()
        editor.caret.begin()
        #editor.buffer.viewPort.goTop()
        #editor.buffer.viewPort.moveCaretToComfortableZoneLazy()
        return true
}
addCommand {
    name:"selective-go-bottom"
    description:"scroll the view port to previous page and set cursor if needed"
    handler:(editor)->
        editor.buffer?.selection.activate()
        editor.caret.end()
        #editor.buffer.viewPort.goBottom()
        #editor.buffer.viewPort.moveCaretToComfortableZoneLazy()
        return true
}
addCommand {
    name:"selective-next-page"
    description:"scroll the view port to next page and set cursor if needed"
    handler:(editor)->
        editor.buffer?.selection.activate()
        editor.buffer.viewPort.nextPage()
        editor.caret.moveToViewPortCenter()
        return true
}
# send selective

addCommand {
    name:"force-trigger"
    description:"active a component if it can be"
    handler:(editor,value = {},args...)->
        value.force = true
        return editor.buffer.cursor.conduct "trigger",value
}
addCommand {
    name:"trigger"
    description:"active a component if it can be"
    handler:(editor,value,args...)->
        return editor.buffer.cursor.conduct "trigger",value
}
addCommand {
    name:"undo"
    description:"undo the change"
    handler:(editor,value)->
        editor.buffer?.selection.cancel()
        editor.context.history.backward()
        return true
}
addCommand {
    name:"redo"
    description:"redo the change"
    handler:(editor,value)->
        editor.buffer?.selection.cancel()
        editor.context.history.forward()
        return true
}
addCommand {
    name:"push-history"
    description:"push history to history stack (will clear the redo buffer)"
    handler:(editor)->
        editor.context.history.debug()
        return true
}
addCommand {
    name:"select-all"
    description:"select everything"
    handler:(editor)->
        editor.buffer?.selection.selectAll()
}
addCommand {
    name:"void"
    description:"do nothing but return true"
    handler:()->
        return true
}
addCommand {
    name:"trigger-rune"
    description:"trigger current target if it's a rune"
    handler:(editor)->
        target = editor.buffer.cursor.target
        if target.sortOf "Rune"
            return editor.buffer.cursor.conduct "trigger"
        return false
}
addCommand {
    name:"delete-selection"
    description:"delete selected contents"
    handler:(editor)->
        if editor.buffer?.selection.isCollapsed() or not editor.buffer?.selection.isActive
            return false
        editor.buffer?.selection.removeSelectedNodes();
        return true

}
addCommand {
    name:"next-rune"
    description:"move cursor to next rune if possible"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        return editor.buffer.cursor.conduct "nextRune"
}
addCommand {
    name:"previous-rune"
    description:"move cursor to previous rune if possible"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        return editor.buffer.cursor.conduct "previousRune"
}
addCommand {
    name:"start-of-line"
    description:"move cursor to start of the line"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        return editor.buffer.cursor.conduct "startOfLine"
}
addCommand {
    name:"end-of-line"
    description:"move cursor to end of the line"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        return editor.buffer.cursor.conduct "endOfLine"
}
addCommand {
    name:"start-of-spell"
    description:"move cursor to start of the current spell"
    handler:(editor)->
        cursor = editor.buffer.cursor
        cursor.target.reflow()
        text = cursor.target?.getChildTextByOffset(cursor.anchor.index)
        # If at spell and not start of spell
        if text.isSpell and cursor.anchor.index > text.startOffset
            editor.buffer?.selection.cancel()
            cursor.anchor.index = text.startOffset
            return true
        else if cursor.anchor.index is text.startOffset and cursor.anchor.index > 1
            prev = cursor.target.getChildTextByOffset(cursor.anchor.index - 1)
            if prev and prev.isSpell
                editor.buffer?.selection.cancel()
                cursor.anchor.index = prev.startOffset
                return true
        return false
}
addCommand {
    name:"end-of-spell"
    description:"move cursor to start of the current spell"
    handler:(editor)->
        cursor = editor.buffer.cursor
        cursor.target.reflow()
        text = cursor.target?.getChildTextByOffset(cursor.anchor.index)
        if text?.noEyeCatching
            return
        # If at spell and not start of spell
        if text.isSpell and cursor.anchor.index < text.endOffset
            editor.buffer?.selection.cancel()
            cursor.anchor.index = text.endOffset
            if text.contentString[text.contentString.length - 1] is "\n"
                cursor.anchor.index -= 1
            return true
        return false
}
addCommand {
    name:"selective-start-of-spell"
    description:"move cursor to start of the current spell"
    handler:(editor)->
        cursor = editor.buffer.cursor
        cursor.target.reflow()
        text = cursor.target?.getChildTextByOffset(cursor.anchor.index)
        # If at spell and not start of spell
        if text.isSpell and cursor.anchor.index > text.startOffset
            editor.buffer?.selection.activate()
            cursor.anchor.index = text.startOffset
            return true
        else if cursor.anchor.index is text.startOffset and cursor.anchor.index > 1
            prev = cursor.target.getChildTextByOffset(cursor.anchor.index - 1)
            if prev and prev.isSpell
                editor.buffer?.selection.activate()
                cursor.anchor.index = prev.startOffset
                return true
        return false
}
addCommand {
    name:"selective-end-of-spell"
    description:"move cursor to start of the current spell"
    handler:(editor)->
        cursor = editor.buffer.cursor
        cursor.target.reflow()
        text = cursor.target?.getChildTextByOffset(cursor.anchor.index)
        if text?.noEyeCatching
            return
        # If at spell and not start of spell
        if text?.isSpell and cursor.anchor.index < text.endOffset
            editor.buffer?.selection.activate()
            cursor.anchor.index = text.endOffset
            if text.contentString[text.contentString.length - 1] is "\n"
                cursor.anchor.index -= 1
            return true
        return false
}
addCommand {
    name:"selective-start-of-line"
    description:"move cursor to start of the line"
    handler:(editor)->
        editor.buffer?.selection.activate()
        return editor.buffer.cursor.conduct "startOfLine"
}
addCommand {
    name:"selective-end-of-line"
    description:"move cursor to end of the line"
    handler:(editor)->
        editor.buffer?.selection.activate()
        return editor.buffer.cursor.conduct "endOfLine"
}
addCommand {
    name:"delete-current-char"
    description:"delete the current char not the previous"
    handler:(editor)->
        editor.buffer?.selection.cancel()
        if not editor.buffer.cursor.conduct "forwardChar"
            return false
        return editor.buffer.cursor.conduct "deleteChar"
}
addCommand {
    name:"wrap-selection"
    description:"wrap the selection with certain char and move caret to end"
    handler:(editor,left = "",right="")->
        if not left and not right
            return false
        selection = editor.buffer?.selection
        if not selection.isActive or selection.isCollapsed()
            return false
        col = selection.getSelectedCollection()
        if col.beginNode isnt col.endNode
            return false
        if not col.beginNode.sortOf "RichText"
            return false
        leftIndex = col.beginAnchor.index
        rightIndex = col.endAnchor.index + left.length
        col.beginNode.insertText leftIndex,left
        col.beginNode.insertText rightIndex,right
        index = col.endAnchor.index

        cursor = editor.buffer.cursor
        cursor.pointAtAnchor col.endAnchor
        cursor.anchor.index += left.length + right.length
        #col.beginNode.anchor.index += left.length + right.length
        selection.collapseToCursor()
        return true
}
addCommand {
    name:"selection-collapse-to-begin"
    descrioption:"collapse the selection to begin of it"
    handler:(editor)->
        selection = editor.buffer?.selection
        if not selection.isActive or editor.buffer?.selection.isCollapsed()
            return false
        return selection.collapseToBegin()
}
addCommand {
    name:"selection-collapse-to-end"
    descrioption:"collapse the selection to end of it"
    handler:(editor)->
        selection = editor.buffer?.selection
        if not selection.isActive or editor.buffer?.selection.isCollapsed()
            return false
        return selection.collapseToEnd()
}
addCommand {
    name:"next-focus-frame"
    description:"focus to next focusable editor frame"
    handler:(editor)->
        return editor.layout.nextFocus()
}
addCommand {
    name:"previous-focus-frame"
    description:"focus to previous focusable editor frame"
    handler:(editor)->
        return editor.layout.previousFocus()
}
addCommand {
    name:"indent-normal-line"
    description:"indent the current line forward if possible"
    handler:(editor)->
        cursor = editor.buffer.cursor
        cursor.state.save()

        if not cursor.anchor.startOfLine({begin:true}) and cursor.anchor.index > 0
            cursor.state.restore()
            return false
        indent = "    "
        cursor.target.insertText? cursor.anchor.index,indent
        cursor.state.restore()
        return true

}
addCommand {
    name:"backindent-normal-line"
    description:"indent the current line backward if possible"
    handler:(editor)->
        cursor = editor.buffer.cursor
        cursor.state.save()
        if not cursor.anchor.startOfLine({begin:true}) and cursor.anchor.index > 0
            cursor.state.restore()
            return false
        cs = cursor.target.contentString
        if not cs
            cursor.state.restore()
            return false
        indent = "    "
        if cs.slice(cursor.anchor.index,cursor.anchor.index + 4) isnt indent
            cursor.state.restore()
            return false
        cursor.target.removeText? cursor.anchor.index,4
        cursor.state.restore()
        return true
}
addCommand {
    name:"write-newline"
    description:"insert a new line at the current position"
    handler:(editor)->
        return editor.conduct "write","\n"
}
#    addCommand {
#        name:"copy-selection"
#        description:"copy the selected contents"
#        handler:(editor)->
#            return editor.buffer?.selection.copySelectedNodes()
#    }
#    addCommand {
#        name:"cut-selection"
#        description:"cut the selected contents"
#        handler:(editor)->
#            return editor.buffer?.selection.cutSelectedNodes()
#    }
module.exports = commands
