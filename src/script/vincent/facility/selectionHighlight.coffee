# Selection Highlight is specially designed to replace the browsers's default selection.
# We don't have to make something exactly like browser selection. Here is the abstraction.
#
# Assumption:
# 1. Selection are within a COMRoot.
# 2. Text flows always from left to right and top to bottom.
#
# Abstraction:
# 1. Only have 3 rect, Head/Body/Foot
# 2. Body's left is the left most of Head/Body/Foot rect
# 3. Body's right is the right most of the Head/Body/Foot rect
# 4. Head's left is the region rect of the heading DOM. Right is the same as body right
# 5. Foot;s right is the region rect of the bottoming DOM. left is the same as body left.
#
# NOTE:
# When head and body point to the same line of element then we just use the select react of it.
#
# This abstraction grant us a most performant implementation that requires minimal getBoundingRect call and
# fewer rect to paint.
Caret = require "./caret"

class SelectionHighlight extends Leaf.EventEmitter
    constructor:(@buffer)->
        @editor = @buffer.editor
        @buffer.listenBy this,"resize",()=>
            @render()
        @caretBase = new Caret(@editor,{name:"base"})
        @caretExtent = new Caret(@editor,{name:"extent"})
        @caretBase.init()
        @caretExtent.init()
        @head = new Rect()
        @body = new Rect()
        @foot = new Rect()
        @buffer.viewPort.el.appendChild @head.node
        @buffer.viewPort.el.appendChild @body.node
        @buffer.viewPort.el.appendChild @foot.node
    destroy:()->
        @caretBase.destroy()
        @caretExtent.destroy()
        @buffer.stopListenBy this
    setRange:(@range)->
        @render()
    render:()->
        if @buffer.selection.isCollapsed() or not @buffer.selection.isActive
            @caretBase.hide()
            @caretExtent.hide()
            @head.setDimension()
            @body.setDimension()
            @foot.setDimension()
            return
        if not @caretBase.isShow
            @caretBase.show()
            @caretExtent.show()
            if @caretBase.currentBuffer isnt @buffer
                @caretBase.attachTo @buffer,@buffer.selection.baseCursor
                @caretExtent.attachTo @buffer,@buffer.selection.extentCursor
        @caretBase.update()
        @caretExtent.update()
        # 1. Get root width as the min value for
        @updateRects()
    updateRects:()->
        rootRect = @buffer.viewPort.el.getBoundingClientRect()
        topRect = @caretBase.lastRenderDetail
        bottomRect = @caretExtent.lastRenderDetail
        if not topRect or not bottomRect
            return
        if topRect.bottom < bottomRect.top
            @updateMultiLine(rootRect,topRect,bottomRect)
        else if bottomRect.bottom < topRect.top
            @updateMultiLine(rootRect,bottomRect,topRect)
        else
            if topRect.left < bottomRect.left
                @updateSingleLine(rootRect,topRect,bottomRect)
            else
                @updateSingleLine(rootRect,bottomRect,topRect)
            return
    updateSingleLine:(rootRect,leftRect,rightRect)->
        @head.setDimension()
        @foot.setDimension()
        top = Math.min(leftRect.top,rightRect.top)
        bottom = Math.max(leftRect.bottom,rightRect.bottom)
        height = bottom - top
        left = leftRect.left
        width = rightRect.right - leftRect.left
        @body.setDimension {
            top,left
            height,width
        }
    updateMultiLine:(rootRect,topRect,bottomRect)->
        scrollWidthFix = 6
        headRect = {
            left:topRect.left
            top:topRect.top
            width:rootRect.right - topRect.left - rootRect.left - scrollWidthFix
            height:topRect.height
        }
        bodyRect = {
            left:0
            top:topRect.bottom
            width:rootRect.width - scrollWidthFix
            height:bottomRect.top - topRect.top - topRect.height
        }
        footRect = {
            left:0
            top:bottomRect.top
            width:bottomRect.right
            height:bottomRect.height
        }
        @head.setDimension(headRect)
        @body.setDimension(bodyRect)
        @foot.setDimension(footRect)
class Rect extends Leaf.Widget
    constructor:()->
        super()
        @node.classList.add "selection-rect"
    setDimension:(rect)->
        if not rect or rect.height <= 6
            @node.style.display = "none"
            return
        else
            @node.style.display = "block"
        if @lastRect?.left is rect.left and @lastRect?.top is rect.top and @lastRect.width is rect.width and @lastRect.height is rect.height
            return
        @lastRect = rect
        @node$.css rect
        @node$.css {
            position:"absolute"
        }

module.exports = SelectionHighlight
