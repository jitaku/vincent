class DragManager extends Leaf.States
    constructor:()->
        super()
        @mouseupListener = @mouseupListener.bind(this)
        @mousedownListener = @mousedownListener.bind(this)
        @mousemoveListener = @mousemoveListener.bind(this)
        new DragEventBehavior(this)
        new DragShadowManager(this)
        new MouseEventHelper(this)
        @init()
        #@debug()
        @minMovement = 6
    init:()->
        capture = true
        window.addEventListener("mousedown",@mouseupListener,capture)
        window.addEventListener("mouseup",@mouseupListener,capture)
        window.addEventListener("mousemove",@mousemoveListener,capture)
        @reset()
        @setState "waitMouseDown"
    destroy:()->
        @reset()
        window.removeEventListener "mouseup",@mouseupListener
        window.removeEventListener "mousedown",@mousedownListener
        window.removeEventListener "mousemove",@mousemoveListener
    reset:()->
        super()
        @clearDrag()
    mouseupListener:(e)->
        @lastMouseEvent = e
        @feed "mouse",e
    mousedownListener:(e)->
        @lastMouseEvent = e
        @feed "mouse",e
    mousemoveListener:(e)->
        @lastMouseEvent = e
        @feed "mouse",e
    atWaitMouseDown:()->
        @clearDrag()
        @consumeWhenAvailable "mouse",(e)=>
            if e.type is "mousedown"
                @data.initMouseDown = e
                @setState "waitInitMouseMove"
            else
                @setState "waitMouseDown"
    atWaitInitMouseMove:()->
        @consumeWhenAvailable "mouse",(e)=>
            if e.type is "mousemove"
                if @getMouseDistance(e,@data.initMouseDown) < @minMovement
                    @setState "waitInitMouseMove"
                else
                    @data.initMoveEvent = e
                    @setState "handleInitMove"
            else
                @setState "waitMouseDown"
    atHandleInitMove:()->
        if not @dragStart(@data.initMouseDown)
            @setState "waitMouseDown"
            return
        @setState "waitMouseContinue"
    atWaitMouseContinue:()->
        @consumeWhenAvailable "mouse",(e)=>
            if e.type is "mousemove"
                @dragMove(e)
                @setState "waitMouseContinue"
            else if e.type is "mouseup"
                @data.finalUpEvent = e
                @setState "handleMouseUp"
            else
                @setState "waitMouseDown"
    atHandleMouseUp:()->
        @drop(@data.finalUpEvent)
        @setState "waitMouseDown"

class MouseEventHelper extends Leaf.Trait
    computeRelativeMousePosition:(el,e)->
        src = @getMouseSrc(e)
        if not el.contains src
            return null
        rect = el.getBoundingClientRect()
        return {
            x:rect.left - e.clientX
            y:rect.top - e.clientY
        }
    getMousePosition:(e)->
        if not e
            return null
        return {
            x:e.clientX
            y:e.clientY
        }
    getMouseDistance:(e1,e2)->
        p1 = @getMousePosition(e1)
        p2 = @getMousePosition(e2)
        dx = p1.x - p2.x
        dy = p1.y - p2.y
        return Math.sqrt dx * dx + dy * dy
    getDefaultShadow:(el)->
        domCopy = require "/component/domCopy"
        copy = domCopy el
        for prop of copy.style
            if not prop
                delete copy.style
        copy.style.opacity = 0.5
        copy.style.backgroundColor = "white"
        copy.style.pointerEvents = "none"
        copy.style.transition = "opacity 200ms"
        copy.style.webkitTransfrom = "scale(0.7)"
        window.cpyy = copy
        return copy
    getMouseSrc:(e)->
        return e.srcElement or e.target
    isElementDraggable:(el)->
        return el and (el.dragSupport is "support" or el.getAttribute("drag-support") is "support")
    isElementDragless:(el)->
        return not el or el.dragSupport is "disable" or el.getAttribute("drag-support") is "disable"
    getDraggable:(e)->
        el = @getMouseSrc(e)
        while el
            if @isElementDragless(el)
                return null
            else if @isElementDraggable(el)
                return el
            el = el.parentElement
    createCustomEvent:(name,data)->
        return new CustomEvent(name,data)
class DragShadowManager extends Leaf.Trait
    dragFix:{x:0,y:0}
    shadowScale:0.7
    clearShadow:()->
        if @draggingShadow?.parentElement
            @draggingShadow?.parentElement.removeChild @draggingShadow
        @draggingShadow = null
    setShadowElement:(el,fix = {})->
        if @draggingShadow?.parentElement
            @draggingShadow?.parentElement.removeChild @draggingShadow
        @draggingShadow = el
        document.body.appendChild el
        el.style.position = "absolute"
        el.style.pointerEvents = "none"
        el.style.top = "0"
        el.style.left = "0"
        el.style.zIndex = 100000
        @dragFix = fix or {}
        @dragFix.x ?= 0
        @dragFix.y ?= 0
        @updateShadowPosition()
    updateShadowPosition:()->
        if not @draggingShadow
            return
        point = @getMousePosition @lastMouseEvent
        @shadowScale = 0.7
        scaleFix = @shadowScale
        #@dragFix = {x:0,y:0}
        transform = "translateX(#{point.x + @dragFix.x * scaleFix}px) translateY(#{point.y + @dragFix.y * scaleFix}px) scale(#{@shadowScale})"
        transformOrigin ="top left"
        @draggingShadow.style?.transform = transform
        @draggingShadow.style?.webkitTransform = transform
        @draggingShadow.style?.transformOrigin = transformOrigin
        @draggingShadow.style?.webkitTransformOrigin = transformOrigin

    setDraggingStyle:()->
        if @_setTarget
            @restoreDraggingstyle()
        @_setTarget = @draggingElement
        @_opacity = @_setTarget.style.opacity
        @_transition = @_setTarget.style.transition
        @_setTarget.style.opacity = 0.15
        @_setTarget.style.transition = "all 200ms"
    restoreDraggingstyle:()->
        @_setTarget?.style.opacity = @_opacity
        @_setTarget?.style.transition = @_transition
        @_setTarget = null
class DragEventBehavior extends Leaf.Trait
    initialize:()->
        preventDefault = (e)->
            e.preventDefault()
            e.stopImmediatePropagation()
        @__defineGetter__ "draggingElement",()=>
            return @_draggingElement
        @__defineSetter__ "draggingElement",(v)=>
            if v is @_draggingElement
                return
            if @_draggingElement
                _draggingElement = @_draggingElement
                setTimeout ()=>
                    _draggingElement.removeEventListener "click",preventDefault,true
                ,1
            @_draggingElement = v
            if not v
                return
            @_draggingElement.addEventListener "click",preventDefault,true
    clearDrag:()->
        @clearShadow()
        @draggingElement = null
        document.body.classList.remove "dragging"
    dragStart:(e)->
        src = @getDraggable(e)
        @clearDrag()
        if not src
            return false
        document.body.classList.add "dragging"
        @dragSession = new DragSession(this)
        @currentDraggable = src
        event = @createCustomEvent("user-draginit",{
            detail:@dragSession
            bubbles:true
        })
        src.dispatchEvent event
        @draggingElement = src
        if @draggingElement.dragBehavior is "auto" or @draggingElement.getAttribute("dragBehavior") is "auto"
            @shadowScale = 0.7
            @setDraggingStyle()
            @setShadowElement @getDefaultShadow(@draggingElement),@computeRelativeMousePosition(src,e)

        return true
    dragMove:(e)->
        event = @createCustomEvent("user-dragging",{
            detail:@dragSession
            bubbles:true
        })
        @draggingElement?.dispatchEvent event

        target = @getMouseSrc(e)
        event = @createCustomEvent("user-dropstand",{
            detail:@dragSession
            bubbles:true
        })
        target?.dispatchEvent event
        if not event.defaultPrevented
            for protocol in @dragSession.protocols
                event = @createCustomEvent "user-dropstand/#{protocol.type}",{
                    detail:protocol
                    bubbles:true
                }
                target.dispatchEvent event
        @updateShadowPosition()
    drop:(e)->
        @restoreDraggingstyle()
        target = @getMouseSrc(e)
        event = @createCustomEvent("user-drop",{
            detail:@dragSession
            bubbles:true
        })
        target.dispatchEvent event
        if not event.defaultPrevented
            for protocol in @dragSession.protocols
                event = @createCustomEvent "user-drop/#{protocol.type}",{
                    detail:protocol
                    bubbles:true
                }
                target.dispatchEvent event
        event = @createCustomEvent("user-dragfinish",{
            detail:@dragSession
            bubbles:true
        })
        if @draggingElement.contains target
            e.preventDefault()
            e.stopImmediatePropagation()
            # prevent click when already dragging

        @draggingElement?.dispatchEvent event
        @draggingElement = null
        @clearShadow()
class DragSession
    constructor:(@behavior)->
        @protocols = []
        @__defineGetter__ "protocol",()=>
            return @protocols[0]
    addProtocol:(type,data)->
        protocol = new DragManager.Protocol(type,data)
        @protocols.push protocol

class DragManager.Protocol
    type:"Void"
    data:null
    constructor:(@type,@data)->

module.exports = DragManager
