class DOMSelection extends Leaf.EventEmitter
    constructor:(@editor)->
        super()
        @ranges = []

    detect:()->
        selection = window.getSelection()
        if selection.isCollapsed
            #@setSelection(null)
            return false
        else
            #@setSelection(selection)
            return true
    use:(who,range)->
        if not range
            throw new Error "DOMSelection.use should provide a valid range"
        # I don't save range object
        # because the offset get zeroed when reference anchor(element)
        # changes. And DOMRegion can't get rect of a \n so I need to replace \n
        # to another char to meansure it's space, which means I have to change
        # do dom.
        @ranges.push {who,range:{
            startContainer:range.startContainer
            startOffset:range.startOffset
            endContainer:range.endContainer
            endOffset:range.endOffset
        }}
    clear:(who)->
        length = @ranges.length
        if length is 0
            return false
        @ranges = @ranges.filter (item)->item.who isnt who
        if @ranges.length is length
            return false
        if not who
            @ranges = []
    disable:()->
        @disabled = true
    enable:()->
        @disabled = false
    render:()->
        if @disabled
            return
        if @ranges.length is 0 or (@ranges.length is 1 and @ranges[0].range.isCollapsed)
            if @hasFocus
                @hasFocus = false
                @editor.focus.inputFocus.release(this)
            return
        @hasFocus = true
        @editor.focus.inputFocus.obtain(this)
        selection = window.getSelection()
        selection.removeAllRanges()
        return
        for item in @ranges
            range = document.createRange()
            range.setStart item.range.startContainer,item.range.startOffset
            range.setEnd item.range.endContainer,item.range.endOffset
            selection.addRange range
module.exports = DOMSelection
