States = require "../common/states"
DOMRegion =require "../common/region"
DOMBoundary = require "../common/boundary"
DOMSelection = require "../facility/selection"

class SelectSession extends States
    constructor:(@buffer)->
        super()
        @selection = @buffer.selection
        @domSelection = @buffer.editor.domSelection
        @onSelectionChange = @onSelectionChange.bind(this)
        if @buffer.editor.platform.hasKeyboard() or true
            @passive = false
        else
            @passive = true
        @mode = ""
    clear:()->
        if not @passive
            @clearDomSelection()
            @selection.deactivate()
            @selection.collapseToEnd()
    syncSelection:()->
        if @passive
            return
        return @syncFromCOM()
    selectCurrentWord:()->
        selection = @selection
        selection.activate()
        selection.collapseToCursor()
        selection.baseCursor.conduct "backwardWord"
        selection.extentCursor.conduct "forwardWord"
    selectCurrentLine:()->
        if @buffer.editor.platform.isMobile()
            return false
        selection = @selection
        selection.activate()
        selection.collapseToCursor()
        selection.baseCursor.conduct "startOfLine"
        selection.extentCursor.conduct "endOfLine"
    syncToCOM:()->
        selection = window.getSelection()
        if selection.isCollapsed
            return false
        base = new DOMRegion(selection.baseNode,selection.baseOffset)
        extent = new DOMRegion(selection.extentNode,selection.extentOffset)
        @selection.activate()
        @selection.baseCursor.setCursorByDOMRegion(base)
        @selection.extentCursor.setCursorByDOMRegion(extent)
        return true
    onSelectionChange:()->
        if @passive
            @syncToCOM()

    deactivate:()->
        @clearDomSelection()
        if not @isActive
            return
        @isActive = false
        document.removeEventListener "selectionchange",@onSelectionChange
    activate:()->
        if @isActive
            return
        @isActive = true
        #if @passive
        document.addEventListener "selectionchange",@onSelectionChange

    syncFromCOM:()->
        if not @isActive
            @clearDomSelection()
            return false
        if not @selection.isActive
            @clearDomSelection()
            return false
        if @passive
            return false
        if @selection.isCollapsed()
            @clearDomSelection()
        else
            @selectionFromCOM()
        return true
    clearDomSelection:()->
        @domSelection.clear(this)
    updateExtentCursor:(action)->
        if action.source is "mouse"
            @updateExtentCursorByMouse(action.e)
        else
            @updateExtentCursorByTouch(action.e)

    updateExtentCursorByTouch:(e)->
        if e?.touches?.length < 2
            return
        touches = e.touches
        e.preventDefault()
        x = (touches[0].clientX + touches[1].clientX)/2
        y = (touches[0].clientY + touches[1].clientY)/2
        @buffer.viewPort.setCursorByClientPoint(x,y)
        @selection.collapseToCursor()
    updateExtentCursorByMouse:(e)->
        @buffer.viewPort.setCursorByClientPoint(e.clientX,e.clientY)
    selectionFromCOM:()->
        selection = @buffer.selection
        if not base = selection.baseAnchor
            return false
        if not extent = selection.extentAnchor
            return false
        base = base.getCorrespondingBoundary()
        extent = extent.getCorrespondingBoundary()
        range = DOMBoundary.createRangeBetween base,extent
        backup = document.createRange()
        backup = range.cloneRange()
        backup.endOffset = 20
        @clearDomSelection()
        @domSelection.use this,range
        return

module.exports = SelectSession
