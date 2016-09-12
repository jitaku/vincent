DOMRegion = require "../common/region"
States = require "../common/states"
KeyEvent = require "../common/keyEvent"
Vibration = require "/component/vibration"
class ViewPort extends Leaf.EventEmitter
    constructor:(@buffer,@el)->
        super()
        @editor = @buffer.editor
        @selectSession = @buffer.selectSession
        @el.viewPort = this
        @el.buffer = @buffer
        @comfortableMargin = window.innerHeight /8 or 30
        @__defineGetter__ "isActive",()=>
            return @buffer.isActive
        @__defineGetter__ "height",()=>
            return @el?.offsetHeight or 0
        @el.addEventListener "scroll",()=>
            @emit "scroll"
    setRoot:(rootElement)->
        if @rootElement is rootElement
            return
        if @rootElement?.parentElement is @el
            @rootElement?.parentElement?.removeChild @rootElement
        if rootElement.parentElement isnt @el
            @el.appendChild rootElement
        @rootElement = rootElement
        @rootElement.classList.add "no-select"
        @emit "rootElement",@rootElement
    init:()->
        @scrollable = @el
        if not @editor.platform.isMobile()
            @controller = new ViewPortPointerController(@buffer,this)
        else
            @controller = new ViewPortTouchController(@buffer,this)
    scrollToRectComfortableZone:(rect,option = {})->
        if not rect
            return false
        top = @scrollable.scrollTop
        bottom = top + @height
        center = (rect.top + rect.bottom)/2
        setScroll = (v)=>
            if @scrollable.scrollTop isnt v
                @scrollable.scrollTop = v
        if option.forceCenter
            @scrollable.scrollTop = center - @height/2
            return true
        if rect.top - @comfortableMargin < top and top > 0
            if option.center
                setScroll center - @height/2
            else
                setScroll rect.top - @comfortableMargin
        if rect.bottom + @comfortableMargin > bottom
            if option.center
                setScroll center - @height/2
            else
                setScroll rect.bottom + @comfortableMargin - @height

        return true
    nextPage:()->
        @scrollable.scrollTop += @height *3/4
        return true
    previousPage:()->
        @scrollable.scrollTop -= @height *3/4
        return true
    goTop:()->
        @scrollable.scrollTop = 0
    goBottom:()->
        @scrollable.scrollTop = @scrollable.scrollHeight
    DOMRegionFromPoint:(x,y)->
        clientX = x
        clientY = y
        if @editor.platform.isSafari()
            @rootElement.classList.add "has-select"
            r = DOMRegion.fromClientPoint(x,y)
            @rootElement.classList.remove "has-select"
        else
            r = DOMRegion.fromClientPoint(x,y)
        return r
    setCursorByClientPoint:(x,y,cursor)->
        @selectSession ?= @buffer.selectSession
        if @selectSession.passive and @selectSession.selection?.detect?() and not cursor
            return
        region = @DOMRegionFromPoint(x,y)
        if not region
            return false
        el = region.getContainerElement()
        while el and el isnt @el
            if el.getAttribute("comless")
                return false
            el = el.parentElement
        cursor ?= @buffer.cursor
        cursor.setCursorByDOMRegion region
        return true
    resolveRectWithTop:(rect)->
        scrollTop = @el.scrollTop
        if not @baseRect
            @baseRect = @el.getBoundingClientRect()
        rect = {
            top:rect.top
            left:rect.left
            bottom:rect.bottom
            right:rect.right
            height:rect.height
            width:rect.width
        }
        rect.top += scrollTop
        rect.bottom += scrollTop
        rect.top -= @baseRect.top
        rect.bottom -= @baseRect.top
        rect.left -= @baseRect.left
        rect.right -= @baseRect.left
        return rect
    resolveRect:(rect)->
        scrollTop = @el.scrollTop
        if not @baseRect
            @baseRect = @el.getBoundingClientRect()
        rect = {
            top:rect.top
            left:rect.left
            bottom:rect.bottom
            right:rect.right
            height:rect.height
            width:rect.width
        }
        #rect.top += scrollTop
        #rect.bottom += scrollTop
        rect.top -= @baseRect.top
        rect.bottom -= @baseRect.top
        rect.left -= @baseRect.left
        rect.right -= @baseRect.left
        return rect
class PointerEvent
    constructor:(e,@delta)->
        PointerEvent.winHeight ?= window.innerHeight
        PointerEvent.winWidth ?= window.innerWidth
        PointerEvent.maxDimension = Math.max(PointerEvent.winHeight,PointerEvent.winWidth)
        @raw = e
        @type = e.type
        @src = e.target or e.srcElement
        @fingerCloseDistance = 140
        @twoHandDistance = Math.min(PointerEvent.maxDimension/2,440)
        @date = new Date()
        @shiftKey = e.shiftKey
        if typeof e.clientX is "number"
            @x = e.clientX
            @y = e.clientY
            @distance = 0
            @sampling = 1
            if e.type is "mouseup"
                @done = true
        else if typeof e.touches isnt "undefined"
            @touches = e.touches
            x = 0
            y = 0
            for touch in @touches
                x += touch.clientX
                y += touch.clientY
            @x = x / @touches.length
            @y = y / @touches.length
            @indexX = @touches[0]?.clientX
            @indexY = @touches[0]?.clientY
            @indexId = @touches[0]?.identifier or -1
            dD = 0
            for touch in @touches
                dX = touch.clientX - @x
                dY = touch.clientY - @y
                dD += Math.sqrt(dX * dX + dY * dY)
            @distance = (dD / @touches.length) * 2
            @sampling = @touches.length
            if @sampling is 2
                @computePointAt()
            if @type is "touchend" and @touches.length is 0
                @done = true
            # increase means the touch start is caused by a
            # extra finger
            if @type is "touchstart" and @touches.length is 1
                @increase = false
            else if @type is "touchstart"
                @increase = true
        else if e.type is "hold" and e.via
            for name,value of e.via
                if typeof value isnt "function" and name not in ["delta","type"]
                    @[name] = value
            return
    noTrigger:()->
        el = @src
        while el
            if el.classList.contains "com-no-trigger"
                return true
            el = el.parentElement
        return false
    canDrag:()->
        el = @src
        while el
            if el.dragSupport is "support" or el.getAttribute("drag-support") is "support"
                return true
            el = el.parentElement
        return false
    computePointAt:()->
        f1 = @touches[0]
        f2 = @touches[1]
        p1 = {x:f1.clientX,y:f1.clientY}
        p2 = {x:f2.clientX,y:f2.clientY}
        # p1 is left,p2 is right
        if p2.x < p1.x
            [p1,p2] = [p2,p1]
        vector = {
            x:p1.x - p2.x
            y:p1.y - p2.y
        }
        # https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/2drota.htm
        # rotate vector clockwise 90deg
        # x' = x cos f - y sin f
        # y' = y cos f + x sin f
        deg = Math.PI/2
        v = {
            x:vector.x * Math.cos(deg) - vector.y * Math.sin(deg)
            y:vector.y * Math.cos(deg) + vector.x * Math.sin(deg)
        }
        length = Math.sqrt(v.x * v.x + v.y * v.y)
        unit = {
            x:v.x/length
            y:v.y/length
        }
        forwardLength = @fingerCloseDistance /2
        @pointAtX = unit.x * forwardLength + @x
        @pointAtY = unit.y * forwardLength + @y
    isFingerClose:()->
        isClose = @distance < @fingerCloseDistance
        return isClose
    isTwoHand:()->
        isTwoHand = @distance > @twoHandDistance
        return isTwoHand
    debugString:()->
        return "x:#{@x},y:#{@y},sample:#{@sampling},done:#{@done},increase:#{@increase}"
    deltaTo:(p)->
        return {
            x:@x - p.x
            y:@y - p.y
        }
    distanceTo:(p,option = {})->
        if option.index
            dX = p.indexY - @indexY
            dY = p.indexY - @indexY
        else
            dX = p.x - @x
            dY = p.y - @y
        return Math.sqrt dX * dX + dY * dY
    capture:()->
        @raw.preventDefault?()
        @raw.stopImmediatePropagation?()
class TriggerStack
    constructor:()->
        @actions = []
        @continuousFloor = 300
    clear:(left)->
        if left > 0
            @actions = @actions.slice(-left)
        else
            @actions.length = 0
    feed:(p)->
        date = new Date
        date.p = p
        if @actions.length > 0 and not @near(p,@actions[@actions.length - 1].p)
            @clear()
        @actions.push date
    near:(p1,p2)->
        return p1.distanceTo(p2) < 20
    consume:()->
        if @actions.length > 3
            @actions = @actions.slice(-3)
        while @actions.length < 3
            @actions.unshift 0
        current = @actions[2]
        previous = @actions[1]
        old = @actions[0]
        if current - previous > @continuousFloor
            return 1
        else if previous - old > @continuousFloor
            return 2
        else
            return 3

class ViewPortPointerController extends Leaf.States
    constructor:(@buffer,@viewPort)->
        super()
        #@debug()
        @triggerStack = new TriggerStack()
        @selectSession = @buffer.selectSession
        @editor = @buffer.editor
        lastPointDate = null
        pt = (e)=>
            # ignore button other then left mouse
            if e.which isnt 1
                return
            if @buffer.lockUserInput
                return
            if not @buffer.interactive
                return
            lastPointDate ?= new Date()
            delta = new Date() - lastPointDate
            lastPointDate = new Date()
            e = new PointerEvent(e,delta)
            @data.currentX = e.x
            @data.currentY = e.y
            @viewPort.emit "hasInteraction",e
            @give "pointer",e
        @viewPort.scrollable.addEventListener "mousedown",pt
        @viewPort.scrollable.addEventListener "mouseup",pt
        @viewPort.scrollable.addEventListener "mousemove",pt
        @setState "idle"
    reset:()->
        super()
        @resetSelection()
    resetSelection:()->
        @selectSession.clear()
    reform:()->
        @reset()
        @setState "idle"
    atPanic:()->
        Logger.error @panicError,@panicState
        @reset()
        @setState "idle"
    atIdle:()->
        #@pathTracer.clear()
        @data.rev ?= 0
        @data.dragging = false
        @waitFor "pointer",(p)->
            @data.p = p
            if p.type is "mousedown"
                @data.rev += 1
                @setState "initMousedown"
            else if p.type is "mousemove"
                if @editor.platform.isMouseDown
                    @selectSession.selection.deactivate()
                    @setState "initMousemove"
                else
                    @setState "idle"
            else
                @resetSelection()
                # Any unexpected action will just do nothing
                # Such as mouse down on a no trigger area
                @setState "idle"
    atInitMousedown:()->
        p = @data.p
        # Detect if any COM el that can trigger
        el = p.src
        if p.noTrigger()
            @setState "idle"
            return
        if p.canDrag()
            @data.dragging = true
        if not @data.dragging
            while el
                if el.com?.trigger and el.com.transactTrigger({via:"mouse"})
                    p.capture()
                    @resetSelection()
                    @selectSession.clearDomSelection()
                    @viewPort.setCursorByClientPoint(p.x,p.y)
                    @selectSession.selection.collapseToCursor()
                    @selectSession.selection.activate()
                    @setState "idle"
                    return
                el = el.parentElement
        # Detect select word/line
        @triggerStack.feed(p)
        trigger = @triggerStack.consume()
        p.capture()
        if trigger is 2
            @setState "handleDoubleDown"
            return
        else if trigger is 3
            @setState "handleTrippleDown"
            return
        # Nop, then we are moving the caret
        # Then set selection start if not shiftKey
        # or make it selectio with shiftKey
        #
        if not p.shiftKey
            @selectSession.clearDomSelection()
        else
            @selectSession.selection.activate()
        @viewPort.setCursorByClientPoint(p.x,p.y)
        if not p.shiftKey
            @selectSession.selection.collapseToCursor()
        @selectSession.selection.activate()
        @setState "waitInitMouseup"
    atWaitInitMouseup:()->
        @waitFor "pointer",(p)=>
            @data.p = p
            if p.type is "mousemove"
                @setState "initMousemove"
            else if p.type is "mouseup"
                @setState "initMouseup"
            else
                @resetSelection()
                @setState "idle"
    atInitMousemove:()->
        p = @data.p
        @viewPort.setCursorByClientPoint(p.x,p.y)
        if @data.dragging
            @selectSession.selection.collapseToCursor()
            @selectSession.selection.deactivate()
            @selectSession.clearDomSelection()
        @setState "waitInitMouseup"
    atInitMouseup:()->
        p = @data.p
        if p.noTrigger()
            @setState "idle"
        if not @buffer.isFocusing
            @buffer.editor.bufferManager.focusAt @buffer
        #@viewPort.setCursorByClientPoint(p.x,p.y)
        if @data.dragging
            @selectSession.selection.collapseToCursor()
        if @selectSession.selection.isCollapsed()
            @selectSession.selection.deactivate()
        # Check if we are triggering double click or tripple click
        p.capture()
        @setState "idle"
    atHandleDoubleDown:()->
        if @selectSession.selection.isCollapsed() or not @selectSession.isActive
            @viewPort.setCursorByClientPoint(@data.p.x,@data.p.y)
            @selectSession.selectCurrentWord()
            @setState "consumeVoidMouseup"
        else
            @setState "consumeVoidMouseup"
        @previousDoubleRev = @data.rev
    atHandleTrippleDown:()->
        pt = @data.previousTrippleRev
        @data.previousTrippleRev = @data.rev
        if @data.rev - 1 is pt and not @data.multiTripple
            @viewPort.setCursorByClientPoint(@data.p.x,@data.p.y)
            @selectSession.selectCurrentWord()
            @data.multiTripple = true
        else
            @viewPort.setCursorByClientPoint(@data.p.x,@data.p.y)
            @selectSession.selectCurrentLine()
            @data.multiTripple = false
        @setState "consumeVoidMouseup"
    atConsumeVoidMouseup:()->
        @waitFor "pointer",(p)=>
            if p.type is "mouseup"
                @setState "idle"
            else if p.type is "mousemove"
                @setState "consumeVoidMouseup"
            else
                @resetSelection()
                @setState "idle"
class TimeFeed
    constructor:(@controller)->
        @feedInterval = 100
    start:(template)->
        if @isStart
            return
        @template = template
        @isStart = true
        @lastDate = new Date()
        @rev ?= 0
        @timer = setInterval ()=>
            if not @isStart
                @stop()
                return
            delta = new Date() - @lastDate
            hp = new PointerEvent {
                type:"hold"
                via:@template
            },delta
            hp.rev = @rev
            @controller.give "pointer",hp
            @lastDate = new Date()
            @rev += 1
        ,@feedInterval
    stop:()->
        @isStart = false
        clearTimeout @timer
class PathTracer
    constructor:()->
        @path = []
        @__defineGetter__ "length",()=>@path.length
        @__defineGetter__ "duration",()=>
            return @last.date.getTime() - @first.date.getTime()
        @__defineGetter__ "maxFinger",()=>
            sampling = 0
            for item in @path
                if item.sampling > sampling
                    sampling = item.sampling
            return sampling
        @__defineGetter__ "finalVector",()=>
            x = @last.indexX - @first.indexX
            y = @last.indexY - @first.indexY
            return {x,y}
        @__defineGetter__ "monotonicX",()=>
            diff = 0
            for item,index in @path
                prev = @path[index - 1]
                if not prev
                    continue
                _diff = item.indexX - diff.indexX
                if diff is 0
                    diff = _diff
                else if diff * _diff < 0
                    return false
            return true
        @__defineGetter__ "monotonicY",()=>
            diff = 0
            for item,index in @path
                prev = @path[index - 1]
                if not prev
                    continue
                _diff = item.indexY - diff.indexY
                if diff is 0
                    diff = _diff
                else if diff * _diff < 0
                    return false
            return true
        @__defineGetter__ "monotonic",()=>
            return @monoticX and @monoticY
        @__defineGetter__ "first",()=>
            return @path[0]
        @__defineGetter__ "last",()=>
            return @path[@path.length - 1]
    push:(p)->
        @path.push(p)
    clear:()->
        @path.length = 0
class ViewPortTouchController extends Leaf.States
    constructor:(@buffer,@viewPort)->
        super()
        @editor = @buffer.editor
        @pathTracer = new PathTracer()
        @triggerStack = new TriggerStack()
        @selectSession = @buffer.selectSession
        @timeFeed = new TimeFeed(this)
        @antiShakeDistance = 5
        @holdLimit = 800
        @maxSwipeDuration =  500
        lastPointDate = null
        pt = (e)=>
            if @buffer.lockUserInput
                return
            if not @buffer.interactive
                return
            lastPointDate ?= new Date()
            delta = new Date() - lastPointDate
            lastPointDate = new Date()
            e = new PointerEvent(e,delta)
            @data.currentX = e.x
            @data.currentY = e.y
            if @data.touchSession
                if @data.touchSession.maxSampling < e.sampling  or not @data.touchSession.maxSampling
                    @data.touchSession.maxSampling = e.sampling
                @data.touchSession.currentSampling = e.sampling
            @viewPort.emit "hasInteraction",e
            @give "pointer",e
        @thumbControlSession = new ThumbControlSession(@viewPort)
        @viewPort.scrollable.addEventListener "touchstart",pt
        @viewPort.scrollable.addEventListener "touchend",pt
        @viewPort.scrollable.addEventListener "touchmove",pt
        @viewPort.scrollable.addEventListener "touchcancel",pt
        @setState "idle"
    reform:()->
        @reset()
        @setState "idle"
    atPanic:()->
        @reset()
        @setState "idle"
        Logger.error "ERROR #{@panicState} #{@panicError.toString()}"
    reset:()->
        super()
        @thumbControlSession.reset()
        @resetSelection()
    resetSelection:()->
        @selectSession.clear()
    handleTouchmove:()->
        p = @data.movePoint
        sp = p.touches?.length or 0
        if @data.touchSession.maxSampling > 1
            p.capture()
        if @data.touchSession.maxSampling > 2
            return
        if not sp or sp < 2
            return
        if sp is 2 or true
            p.capture()
            deltaLimitTop = 1500
            deltaLimitLeft = 220
            antiShakeX = 20
            antiShakeY = 40
            if p.isFingerClose()
                @data.baseTwoHandPoint = null
                @viewPort.setCursorByClientPoint(p.pointAtX,p.pointAtY)
            else if p.isTwoHand() or true
                @thumbControlSession.feed "point",p
                return
            else
                @data.baseTwoHandPoint = null
                @viewPort.setCursorByClientPoint(p.x,p.y)

            @thumbControlSession.reset()
            return
        else if sp is 3
            return
    log:(name,message,time = 3000)->
        #return
        if typeof message is "undefined"
            message = name
            name = "Default"
        if typeof message is "undefined"
            return
        require("/app").site.editor.plugin("HintManager").hint name,message,{persist:false,type:"warning",time:time}
    atIdle:()->
        @timeFeed.stop()
        @data.rev ?= 0
        @pathTracer.clear()
        @thumbControlSession.reset()
        @waitFor "pointer",(p)=>
            @data.p = p
            @data.baseTwoHandPoint = null
            if p.type is "touchstart" and @handleSideTap p
                @setState "idle"
                return
            if p.type is "touchstart"
                @data.rev += 1
                @data.holdTime = 0
                @data.touchSession = {}
                @setState "initTouchstart"
            else
                # prevent all unexpected event
                # Usually due to a halfway done state.
                # Such as a touchstart is used without consuming the following
                # event and return to idle.
                p.capture()
                @setState "idle"
    atInitTouchstart:()->
        @timeFeed.stop()
        @timeFeed.start @data.p
        @waitFor "pointer",(p)=>
            if p.type is "hold"
                @data.holdTime += p.delta
                #@log "delta #{p.delta} #{p.rev} #{@data.holdTime}"
                if @data.holdTime > @holdLimit
                    @data.holdTime = 0
                    @setState "longPress"
                else
                    # Continue hold
                    @setState "initTouchstart"
            else if p.type is "touchmove"
                if (p.distanceTo @data.p) < @antiShakeDistance
                    # not moving so much
                    # continue hold
                    @setState "initTouchstart"
                else
                    # First move
                    @data.movePoint = p
                    @data.startPoint = @data.p
                    @pathTracer.clear()
                    @setState "initTouchmove"
            else if p.type is "touchend"
                if p.done
                    @data.startPoint = @data.p
                    @data.endPoint = p
                    @setState "tap"
                else
                    @setState "initTouchstart"
            else if p.type is "touchcancel"
                if p.done
                    #@log "C","cancle??"
                    @setState "idle"
                else
                    @setState "initTouchstart"
            else if p.type is "touchstart"
                # unlikely to be, but maybe continues second/third finger
                # is attached. Just consider it as a new init touch start.
                if not p.increase
                    @data.p = p
                    @setState "initTouchstart"
                else
                    @data.startPoint = @data.p
                    @data.movePoint = p
                    @setState "initTouchmove"
            else
                @setState "idle"
    atInitTouchmove:()->
        if @data.movePoint
            @pathTracer.push @data.movePoint
        @timeFeed.stop()
        if @data.movePoint
            @timeFeed.start(@data.movePoint)
        @handleTouchmove()
        @waitFor "pointer",(p)=>
            if p.type is "touchmove" or (p.type is "touchstart" and p.increase)
                # try prevent default gesture events
                # this is another move, keep catching moves
                if @data.touchSession.maxSampling > 1
                    p.capture()
                @data.movePoint = p
                @setState "initTouchmove"
            else if p.type is "touchcancel"
                if p.done
                    @setState "idle"
                else
                    # Likely touchcancel may not has done sometimes
                    # Done indicates the touches.length is just go from 1 to 0
                    @setState "idle"
                    #@setState "initTouchmove"
            else if p.type is "touchend"
                if p.done and @data.movePoint.distanceTo(@data.startPoint,{index:true}) < @antiShakeDistance
                    @data.endPoint = p
                    @setState "tap"
                else if p.done and @pathTracer.maxFinger is 1 and @pathTracer.length > 2 and @pathTracer.duration < @maxSwipeDuration #and @pathTracer.monotic
                    #@log "duration #{@pathTracer.duration}"
                    @data.endPoint = p
                    @setState "swipe"
                else if p.done
                    @setState "idle"
                else
                    @data.movePoint = p
                    @setState "initTouchmove"
            else if p.type is "hold"
                @data.movePoint = p
                @setState "initTouchmove"
            else if p.type is "touchstart"
                # Unexpected start event... with no trait of increasing finger
                # Just consider it as a touchstart
                @data.p = p
                @setState "initTouchstart"
            else
                @setState "idle"
    # Final Actions:
    # Tap
    # Double Tap
    # Tripple Tap
    # LongPress
    atTap:()->
        el = @data.startPoint.src
        if @data.touchSession.maxSampling not in [1,3] and @data.touchSession.maxSampling
            @setState "idle"
            return
        @data.endPoint?.capture()
        if @data.touchSession.maxSampling is 3
            @resetSelection()
            #@log "#{Math.random()}","trigger 3 finger #{Math.random()}"
            @setState "idle"
            return
        @triggerStack.feed(@data.startPoint)
        trigger = @triggerStack.consume()
        #require("/app").mobileLog "trigger? #{trigger}"
        if trigger is 1 and @handleSideTap(@data.startPoint)
            @triggerStack.clear(0)
            @setState "idle"
            return
        if trigger is 1
            @selectSession.selection.deactivate()
            @viewPort.setCursorByClientPoint @data.startPoint.x,@data.startPoint.y
            @setState "idle"
        else if trigger is 2
            try
                if not @data.startPoint.noTrigger()
                    while el and not (@data.touchSession.maxSampling > 1)
                        if el.com?.trigger
                            Vibration.feedback()
                            if el.com.transactTrigger({via:"tap"})
                                @data.endPoint?.capture()
                                @resetSelection()
                                @setState "idle"
                                return
                        el = el.parentElement
            catch e
                @log "ERROR #{e.toString()}"
            #@log "Double tap #{Math.random().toString().slice(8,10)}"
            @setState "idle"
        else if trigger is 3
            @triggerStack.clear(0)
            #@log "#{document.body.scrollTop}"
            #@log "Tripple tap #{Math.random().toString().slice(1,4)}"
            @setState "idle"
    atSwipe:()->
        @minSwipeX = 100
        @minSwipeY = 100
        #@log Math.random(),"#{JSON.stringify @pathTracer.finalVector}",1000
        try
            if @pathTracer.finalVector.x > @minSwipeX
                @editor.inputMethod.emit "key",new KeyEvent {simulateName:"swipeRight"}
            else if @pathTracer.finalVector.x < -@minSwipeX
                @editor.inputMethod.emit "key",new KeyEvent {simulateName:"swipeLeft"}
            if @pathTracer.finalVector.y > @minSwipeY
                @editor.inputMethod.emit "key",new KeyEvent {simulateName:"swipeDown"}
            else if @pathTracer.finalVector.y < -@minSwipeY
                @editor.inputMethod.emit "key",new KeyEvent {simulateName:"swipeUp"}
        catch e
            @log Math.random(),"error #{JSON.stringify e.message}",1000
        @pathTracer.clear()
        @setState "idle"
    atLongPress:()->
        #@log "long press"
        #
        if not @selectSession.selection.isActive
            @viewPort.setCursorByClientPoint(@data.p.x,@data.p.y)
            @selectSession.selectCurrentWord()
        else
            @selectSession.selection.deactivate()
        Vibration.feedback()
        @setState "idle"
    handleSideTap:(p)->
        @clientWidth ?= window.innerWidth
        @sideTapLimit ?= 30
        try
            if p.x < @sideTapLimit
                @editor.conduct "backward-char"
                return true
            if p.x > @clientWidth - @sideTapLimit
                @editor.conduct "forward-char"
                return true
        catch e
            Logger.error "error #{e.message} #{e.name}"
        return false
class ThumbControlSession extends Leaf.States
    constructor:(@viewPort)->
        super()
        @editor = @viewPort.editor
        @stepX = 5
        @stepY = 10
        @xFloor = 4
        @yFloor = 12
        @offsetXScale = 1.7
        @offsetYScale = 2.2
        @offsetXAtiShake = 0
        @offsetYAtiShake = 0
    reset:()->
        super()
        @setState "waitFirstPoint"
    atWaitFirstPoint:()->
        @consumeWhenAvailable "point",(p)=>
            @data.startPoint = p
            @viewPort.setCursorByClientPoint p.x,p.y
            @lastPointDate = new Date()
            @setState "waitMovePoint"
    atWaitMovePoint:()->
        @consumeWhenAvailable "point",(p)=>
            #require("/app").mobileLog "ACC"
            @distributeCommandByPoint(p)
            @setState "waitMovePoint"
    distributeCommandByPoint:(p)->
        dx = p.x - @data.startPoint.x
        dy = p.y - @data.startPoint.y
        if dx >= 0
            fx = 1
        else
            fx = -1
        if dy >= 0
            fy = 1
        else
            fy = -1

        fdx = (dx - @offsetXAtiShake * fx)*@offsetXScale
        fdy = (dy - @offsetYAtiShake * fy)*@offsetYScale

        if fdx * fx > 0
            px = fdx + @data.startPoint.x
        else
            px = @data.startPoint.x

        if fdy * fy > 0
            py = fdy + @data.startPoint.y
        else
            py = @data.startPoint.y
        if px isnt @data.startPoint.x or py isnt @data.startPoint.y
            @viewPort.setCursorByClientPoint(px,py)

    distributeCommandByPointVelocity:(p)->
        if not @data.lastPoint
            @data.lastPoint = @data.startPoint
            @data.lastDate = @data.lastPoint.date
        if p.type is "hold"
            p = @data.lastPoint
        dT = Date.now() - @data.lastDate.getTime()
        if dT is 0
            return
        dx = (p.x + @data.lastPoint.x)/2  - @data.startPoint.x
        dy = (p.y + @data.lastPoint.y)/2 - @data.startPoint.y
        dvx = dx*dT / 1000
        dvy = dy*dT / 1000
        #require("/app").mobileLog "ACC #{dvx} #{dvy} #{dT}"
        @accumulateX dvx
        @accumulateY dvy
        @data.lastPoint = p
        @data.lastDate = new Date
    distributeCommandByPointAboluste:()->
        dx = p.x - @data.startPoint.x
        dy = p.y - @data.startPoint.y
        countX = Math.round dx/@stepX
        countY = Math.round dy/@stepY
        @applyVerticle(countY)
        @applyHorizental(countX)
    accumulateX:(value)->
        @data.xValue ?= 0
        @data.xValue += value
        while @data.xValue > @xFloor
            @data.xValue -= @xFloor
            @right()
        while @data.xValue < -@xFloor
            @data.xValue += @xFloor
            @left()
    accumulateY:(value)->
        @data.yValue ?= 0
        @data.yValue += value
        while @data.yValue > @yFloor
            @data.yValue -= @yFloor
            @down()
        while @data.yValue < -@yFloor
            @data.yValue += @yFloor
            @up()
    applyVerticle:(count)->
        @data.currentVertical ?= 0
        down = count - @data.currentVertical
        while down > @data.currentVertical
            @down()
            @data.currentVertical += 1
        while down < @data.currentVertical
            @up()
            @data.currentVertical -= 1
    applyHorizental:(count)->
        @data.currentHorizental ?= 0
        right = count - @data.currentHorizental
        while right > @data.currentHorizental
            @right()
            @data.currentHorizental += 1
        while right < @data.currentHorizental
            @left()
            @data.currentHorizental -= 1
    down:()->
        @editor.conduct "downward-char"
    up:()->
        @editor.conduct "upward-char"
    right:()->
        @editor.conduct "forward-char"
    left:()->
        @editor.conduct "backward-char"

module.exports = ViewPort
