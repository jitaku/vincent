module.exports = [{
    name:"newline-and-indent"
    description:"enter a newline and indent to be aligned with previous line"
    handler:(editor)->
        cursor = editor.buffer.cursor
        if not cursor.target?.sortOf("Code")
            return false
        if child = cursor.target.getChildTextByOffset(cursor.anchor.index)
            if child.sortOf("Spell")
                return false
        indent = ""
        do ()->
            cursor.state.save()
            cursor.anchor.startOfLine({begin:true})
            cs = cursor.target.contentString
            if not cs
                return false
            while cs[cursor.anchor.index] is " "
                indent += " "
                cursor.anchor.index+=1
        cursor.state.restore()
        if indent.length > 0
            cursor.conduct "write","\n#{indent}"
            return true
        return false
}]
