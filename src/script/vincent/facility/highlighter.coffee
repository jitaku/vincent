DOMBoundary = require "../common/boundary"
Debounce = require "/component/debounce"
COMCursor = require "../com/cursor"
DOMTraverse = require "../common/traverse"

class Highlighter
    constructor:(@buffer)->
    createSession:()->
        return new HighlightSession(@buffer)

class HighlightSession
    constructor:(@buffer)->
        @lights = []
        @reflowDebouncer = new Debounce {time:10},()=>
            @_reflow()
        @reflowProcedure = new ReflowProcedure(this)
    clear:()->
        for light in @lights
            light.clear()
            light.destroy()
        @lights.length = 0
        @buffer.stopListenBy this
    addHighlight:(start,end,option)->
        light = new Highlight @buffer,start,end,option
        @lights.push light
        return light
    applyAll:(option = {})->
        if not @buffer.isActive
            return
        for light in @lights
            light.apply()

        @buffer.stopListenBy this
        @buffer.listenBy this,"reflow",@reflow.bind(this)
        @buffer.listenBy this,"resize",@reflow.bind(this)
        if @buffer.isActive
            if option.force
                @forceReflow()
            else
                @reflow()
    reflow:()->
        if not @buffer.isActive
            return
        @reflowDebouncer.trigger()
    forceReflow:()->
        @_reflow()
    _reflow:()->
        if not @buffer.isActive
            return
        @reflowProcedure.reset()
        @reflowProcedure.start()
class Highlight
    constructor:(@buffer,@startAnchor,@endAnchor,@option = {})->
        @rects = []
        @startCursor = @buffer.context.createCursor()
        @endCursor = @buffer.context.createCursor()
        @startCursor.pointAtAnchor @startAnchor
        @endCursor.pointAtAnchor @endAnchor
        @startCursor.name = "STName"
        @endCursor.name = "ECName"
        @startCursor.listenBy this,"move",()=>
            @buffer.nextRender ()=>
                @delayReshow()
        @endCursor.listenBy this,"move",()=>
            @buffer.nextRender ()=>
                @delayReshow()
    delayReshow:(time)->
        return
        trigger = Debounce.debounce {time:0},()=>
            if @isDestroyed
                return
            if not @isShow
                return false
            @apply()
            @show()
        trigger()
        window.doTrigger = trigger
    setOption:(option = {})->
        for prop of option
            @option[prop] = option[prop]
        for rect in @rects
            rect.setOption(option)
    apply:()->
        @clear()
        start = @startCursor.getBoundary()
        end = @endCursor.getBoundary()
        try
            range = DOMBoundary.createRangeBetween(start,end)
        catch e
            Logger.error "fail to create highlight range",start,end
            return
        TextType = 3
        texts = []
        @rects.length = 0
        DOMTraverse.traverseRange range,(node)->
            if node.nodeType is TextType
                texts.push node
            return false
        rects = []
        for item in texts
            if item is range.startContainer
                start = range.startOffset
            else
                start = 0
            if item is range.endContainer
                end = range.endOffset
            else
                end = item.length
            if start >= end
                continue
            area = document.createRange()
            area.setStart(item,start)
            area.setEnd(item,end)
            clientRects = area.getClientRects()
            for rect in clientRects
                rects.push rect
        @clear()
        @buffer.viewPort.baseRect = null
        for item in rects
            if item.left is item.right
                continue
            item = @buffer.viewPort.resolveRectWithTop item
            rect = new HighlightRect @buffer,item,@option
            @rects.push rect
    show:()->
        @isShow = true
        for item in @rects or []
            item.show()
    hide:()->
        @isShow = false
        for item in @rects or []
            item.remove()
    clear:()->
        for rect in @rects
            rect.remove()
        @rects.length = 0
    destroy:()->
        @isDestroyed = true
        @startCursor.destroy()
        @endCursor.destroy()
    blink:()->
        for rect in @rects
            rect.blink()
class HighlightRect
    constructor:(@buffer,rect,@option = {})->
        @el = document.createElement "div"
        @el.style.zIndex = 10
        @rect = rect
        @top = rect.top
        @bottom = rect.bottom
    setOption:(option = {})->
        for prop of option
            @option[prop] = option[prop]
        @render()
    blink:()->
        @el.classList.add "blink"
        setTimeout ()=>
            @el.classList.remove "blink"
        ,200
    render:()->
        rect = @rect
        @el.style.left = rect.left + "px"
        @el.style.top = rect.top + "px"
        @el.style.width = rect.width + "px"
        @el.style.height = rect.height + "px"
        @el.style.position = "absolute"
        if @option.customClass
            @el.classList.add @option.customClass
            return
        if @option.useBorder
            @el.style.borderBottom = "2px solid #{@option.color}"
        else
            @el.style.backgroundColor = @option.color or "yellow"
        @el.classList.add "com-global-highlight"
    show:()->
        if @isShow
            return
        @isShow = true
        @buffer.viewPort.el.appendChild(@el)
        @render()
    remove:()->
        if not @isShow
            return
        @isShow = false
        if @el.parentElement
            @el.parentElement.removeChild(@el)
class ReflowProcedure extends Leaf.States
    constructor:(@session)->
        super()
        #@debug()
    start:()->
        @setState "init"
    atInit:()->
        top = @session.buffer.UI.viewPort.scrollTop
        height = @session.buffer.UI.viewPort.offsetHeight
        bottom = top + height
        @data.top = top
        @data.height = height
        @data.bottom = bottom
        @setState "traverse"
    atTraverse:(stale)->
        for light in @session.lights
            if stale()
                return
            light.apply()
            begin = light.rects[0]
            end = light.rects[light.rects.length - 1]
            if not begin or not end
                light.hide()
            else if begin.top >= @data.bottom
                light.hide()
            else if end.bottom <= @data.top
                light.hide()
            else
                light.show()
        @setState "done"
    atDone:()->
module.exports = Highlighter
Highlighter.HighlightSession = HighlightSession
Highlighter.Highlight = Highlight
