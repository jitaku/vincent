DOMRegion = require "../common/region"
DOMBoundary = require "../common/boundary"
EventEmitter = (require "../common/events").EventEmitter
class Caret extends Leaf.Widget
    constructor:(@editor,option = {})->
        @template = """<div class="caret" data-class="caretName,visibleState"><div data-id="shape" class="shape"></div></div>"""
        super()
        @name = option.name or "master"
        @VM.caretName = "caret-#{@name}"
        @shape = @UI.shape
        @shape$ = @UI.shape$
        @__defineGetter__ "dirty",()=>
            return @_dirty
        @__defineSetter__ "dirty",(value)=>
            @_dirty = value
        @boundaryEffectTracer = new BoundaryEffectTracer(this)
    init:()->
        window.addEventListener "resize",()=>
            @dirty = true
        @node.addEventListener "mousedown",(e)=>
            @onClick(e)
        if @editor.platform.isMobile()
            # some simulate name triggered action don't cause dom change I don't know why.
            @editor.inputMethod.listenBy this,"key",(e)=>
                if e.simulateName
                    setTimeout ()=>
                        @isScrolling = false
                        @dirty = true
                    ,0
        @keyHandlers = {}
        new CaretViewPortPoserTrait(this)
        #new CaretWritableTrait(this)
        new CaretActionTrait(this)
        new CaretBlinkableTrait(this)
    destroy:()->
        @editor.inputMethod.stopListenBy this
        @cursor?.stopListenBy this
        @context?.stopListenBy this
        @currentBuffer?.stopListenBy this
        @node.parentElement?.removeChild @node
    dirtyConfirm:()->
        # Sometimes chrome just don't get correct render detail when I
        # only replace a rune. Retriger a dirty confirm will force it to
        # caculate at the right position
        clearTimeout @dirtyConfirmTimer
        @dirtyConfirmTimer = setTimeout ()=>
            @dirty = true
        ,10
    attachTo:(buffer,cursor)->
        if not buffer.interactive
            return false
        if @cursor
            @cursor.stopListenBy this
        if @context
            @context.stopListenBy this
        if @currentBuffer
            @currentBuffer.stopListenBy this
        @dirty = true
        @viewPort = buffer.viewPort
        @currentBuffer = buffer
        buffer.ensureRenderContext()
        @cursor = cursor or buffer.cursor
        @cursor.listenBy this,"move",()=>
            @currentBuffer.disableSaveBestPosition = false
            @isScrolling = false
            if @name is "master"
                @requestScroll = true
            @dirty = true
        @cursor.listenBy this,"trigger",()=>
            @forceBump = true
        @context = buffer.context
        @context.listenBy this,"change",()=>
            @dirty = true
            if @name is "master"
                @requestScroll = true
            if @node.parentElement isnt @currentBuffer.viewPort.el
                @currentBuffer.viewPort.el.appendChild @node
            # Make sure it will even render after a few milisec
            #
            @dirtyConfirm()

        @currentBuffer.listenBy this,"interactiveChange",(change)->
            @update()
        @currentBuffer.listenBy this,"resize",()=>
            @dirty = true
        @currentBuffer.listenBy this,"reflow",()=>
            @emit "bufferReflow"
            if not @editor.platform.isMobile()
                return
            @isScrolling = true
            clearTimeout @_scrollTimer
            @_scrollTimer = setTimeout ()=>
                @isScrolling = false
            ,350
        @switchingBuffer = true
        if @isShow
            @isShow = false
            @show()
            @update()
    onClick:(e)->
        if e.which isnt 1
            return
        if @editor.conduct "trigger"
            e.preventDefault()
            e.stopImmediatePropagation()
            return
        return false
    compareRect:(a,b)->
        props = ["left","right","top","bottom"]
        for prop in props
            if parseInt(a[prop]) isnt parseInt(b[prop])
                return false
        return true
    bump:()->
        @forceBump = true
        @update()
    update:(option = {})->
        if @isScrolling
            return
        @_update()
        @applyBlink()
        return
        try
            @_update()
        catch e
            Logger.error "fail to update caret"
            Logger.error e
    _update:(option = {})->
        if not @cursor
            return
        if not @currentBuffer.isActive
            @lastActive = false
            return
        if not @currentBuffer.interactive
            @hide()
            return
        else
            @show()
        if not @currentBuffer?.selection.isCollapsed() and @currentBuffer?.selection.isActive
            @node.classList.add "selecting"
        else
            @node.classList.remove "selecting"
        if @currentBuffer.lockUserInput
            @shape.classList.add "lock"
        else
            @shape.classList.remove "lock"
        if @lastBuffer isnt @currentBuffer or not @lastActive or @forceBump
            clearTimeout @bumpTimer
            clearTimeout @clearTimer
            @shape.classList.remove "bump"
            @shape.classList.remove "bump-minor"
            @bumpTimer = setTimeout ()=>
                if @lastRenderDetail and @lastRenderDetail?.height > 48
                    @shape.classList.add "bump-minor"
                else
                    @shape.classList.add "bump"
                @clearTimer = setTimeout ()=>
                    @shape.classList.remove "bump"
                    @shape.classList.remove "bump-minor"
                ,100
            ,10
        @forceBump = false
        @lastBuffer = @currentBuffer
        @lastActive = true
        if @animating
            @animateFrame()
        # force should be used on buffer resize
        if not option.force and not @dirty
            return false
        @currentBuffer.ensureRenderContext()
        boundary = @cursor.getBoundary()
        visualPosition = @cursor.getVisualPosition()
        if visualPosition
            while @dirty
                caretLayout = new CaretLayout this,visualPosition

                boudnary = caretLayout.toBoundary()
                if boundary
                    @boundaryEffectTracer.updateEffect(boundary)

                @updatePosition(caretLayout)
                @dirty = false
        style = @cursor.getStyle()
        @applyStyle(style)
        if @animating
            @animateFrame()
    updatePosition:(layout)->
        if not @isActive
            return false
        if not layout
            @hide()
            return
        else
            @show()
        #if @lastLayout and @lastLayout.equalTo layout
        #    return
        visualPosition = layout.visualPosition
        renderDetail = layout.getRenderDetail()
        #if @name is "extent"
        #    Logger.error "renderD",renderDetail,@name
        if not renderDetail
            return
        @lastRenderDetail = renderDetail
        @currentBuffer.lastCaretRenderDetail = @lastRenderDetail
        if renderDetail.type is "cover"
            @shape.classList.add "cover"
        else
            @shape.classList.remove "cover"

        @showType = renderDetail.type
        @setAnimateTo renderDetail
        @emit "move",renderDetail
        @saveBestPosition(layout)
        #@lastLayout = layout
        # force blink on when rerender
        if @requestScroll and not @editor.platform.isMobile()
            @scrollViewPortToComfortable()
            @requestScroll = false
        @switchingBuffer = false
    applyNodePosition:()->
        ps = @nodePosition
        @shape$.css {
            width:ps.width
            height:ps.height
        }
        @node$.css {
            transform:"translateX(#{Math.round ps.left}px) translateY(#{Math.round ps.top}px)"
        }
    setAnimateTo:(targetPosition)->
        type = targetPosition.type
        if type is "cover@disable"
            @node.classList.remove "jump"
        else
            if not @nodePosition
                @node.classList.add "jump"
            else
                x = Math.abs targetPosition.left - @nodePosition.left
                y = Math.abs targetPosition.top - @nodePosition.top
                distance = Math.sqrt x*x + y*y
                if distance > 100 or @switchingBuffer
                    @node.classList.add "jump"
                else
                    @node.classList.remove "jump"
        @nodePosition = targetPosition
        @applyNodePosition()
        return
    saveBestPosition:(layout)->
        if @currentBuffer.disableSaveBestPosition
            return
        bestX = layout.getCenterX()
        if @lastBestX isnt bestX
            @currentBuffer.bestCaretOffset = bestX
            @lastBestX = bestX
    show:()->
        if @isShow
            return
        @isShow = true
        if @currentBuffer?.viewPort and @node.parentElement isnt @currentBuffer.viewPort.el
            @currentBuffer.viewPort.el.appendChild @node
        @VM.visibleState = "shown"
        @activate()
    cloak:()->
        @show()
        @VM.visibleState = "cloaked"
    hide:()->
        if not @isShow
            return
        @isShow = false
        @deactivate()
        @VM.visibleState = "hidden"
    activate:()->
        if @isActive
            return
        @isActive = true
        @applyBlink()
    deactivate:()->
        if not @isActive
            return
        @isActive = false
        clearTimeout @blinkTimer
    applyStyle:(style = {})->
        className = style.className
        if className is @currentClassName
            return false
        @shape.classList.remove @currentClassName
        @shape.classList.add className
        @currentClassName = className
        return true

class CaretBlinkableTrait extends Leaf.Trait
    initialize:()->
        @blinkStart = Date.now()
        @listenBy CaretBlinkableTrait,"move",()=>
            @resetBlink()
    resetBlink:()->
        @blinkStart = Date.now()
    shouldBlinkShow:()->
        showTime = 800
        hideTime = 500
        left = (Date.now() - @blinkStart) % (showTime + hideTime)
        if left > showTime
            return false
        return true
    applyBlink:()->
        if not @shouldBlinkShow()
            @shape.classList.add "blink-off"
        else
            @shape.classList.remove "blink-off"
class CaretWritableTrait extends Leaf.Trait
    initialize:()->
        @applyWritableListener()
    markAsWritable:()->
        @unwritable = false
        @shape.classList.remove "unwritable"
    unmarkAsWritable:()->
        @unwritable = true
        @shape.classList.add "unwritable"
    applyWritableListener:()->
        @editor.bufferManager.listenBy this,"focus",(buffer)=>
            Buffer = require "./buffer"
            if buffer instanceof Buffer.RichBuffer
                @markAsWritable()
            else
                @unmarkAsWritable()
        #@editor.inputMethod.listenBy this,"workingStateChange",()=>
        #    if not @editor.inputMethod.hasFocus or not @editor.inputMethod.isActive or not @editor.inputMethod.currentInputMethod?.canWrite
        #        @unmarkAsWritable()
        #    else
        #        @markAsWritable()
class CaretActionTrait extends Leaf.Trait
    forwardChar:()->
        if not @isActive
            return false
        return @cursor?.conduct "forwardChar"
    backwardChar:()->
        if not @isActive
            return false
        return @cursor?.conduct "backwardChar"
    vertical:(step)->
        if not @isActive
            return false
        @currentBuffer.render()
        if step > 0
            next = @forwardChar.bind(this)
            previous = @backwardChar.bind(this)
        else
            previous = @forwardChar.bind(this)
            next = @backwardChar.bind(this)
        #Logger.time "trial"xbs
        cursor = @cursor
        bestRegion = null
        bestX = @currentBuffer.bestCaretOffset
        vp = @cursor.getVisualPosition()
        if not vp
            return false
        rd = CaretLayout.getRenderDetail(this,vp)
        topStart = rd.top
        startPoint = rd.center
        if typeof bestX is "number"
            startPoint.x = bestX
        lastDx = null
        counter = 0
        MAX = 1000
        @cursor.startTeleport()
        while true
            if counter > MAX
                Logger.error "Unlimited caret move"
                return true
            result = next()
            if not result
                break
            counter += 1
            moveOnce = true
            vp = @cursor.getVisualPosition()
            if not vp
                continue
            rd = CaretLayout.getRenderDetail this,vp
            if not rd
                continue
            if (rd.top - topStart) * step <= 0
                #actually shrinked
                continue
            currentPoint = rd.center
            dy = (currentPoint.y - startPoint.y)
            if dy * step > 0 and Math.abs(dy) - Math.abs(step) > 0
                # position changed as I expected and bigger than step
                if not canBreak
                    # one line jumped
                    breakDy = dy
                    canBreak = true
                else
                    # to line jumped
                    if Math.abs(dy - breakDy) > Math.abs(step) and bestCursorData
                        break
            if canBreak
                dx = Math.abs(currentPoint.x - startPoint.x)
                if typeof lastDx isnt "number"
                    bestCursorData = @cursor.getData()
                    lastDx = dx
                else if dx <= lastDx
                    bestCursorData = @cursor.getData()
                    lastDx = dx
                else if dx > lastDx
                    break
        #Logger.debug "counter",counter
        if not bestCursorData
            @cursor.endTeleport()
            return moveOnce
        @cursor.pointAtAnchor bestCursorData.anchor
        @cursor.endTeleport()
        #bestRegion.index += fix
        return true
    verticalJump:(step)->
        if not @isActive
            return false
        if step > 0
            method = "forwardChar"
        else
            method = "backwardChar"
        cursor = @cursor
        boundary = cursor.getBoundary()
        region = DOMRegion.fromBoundary boundary
        rect = region.getClientRect()
        topStart = rect.top
        bestRegion = null
        greedy = true
        greedyLimit = 10
        minVerticalChange = 12
        lastEstimation = 9999999

        bestX = @currentBuffer.bestCaretOffset
        if boundary.type is "include"
            startPoint = {
                x:(typeof bestX is "number" and bestX or (rect.left + rect.right)/2)
                y:(rect.top + rect.bottom)/2
            }
        else
            startPoint = {
                x:(typeof bestX is "number" and bestX or rect.left)
                y:(rect.top + rect.bottom)/2
            }
        counter = 0
        estimate = (base,current)->
            dx = current.x - base.x
            dy = current.y - base.y

            if Math.abs(dy) < minVerticalChange
                return 999999999
            return dx * dx + dy * dy
        charCount = 0
        while @[method]()
            moveOnce = true
            boundary = @cursor.getBoundary()
            if not boundary
                break
            region = DOMRegion.fromBoundary boundary
            rect = region.getRect({top:@viewPort?.el})
            if not rect
                break
            if (rect.top - topStart) * step <= 0
                #actually shrinked
                continue
            getDist = (x,y)->
                return x * x + y * y
            if boundary.type is "include"
                currentPoint = {
                    x:(rect.left + rect.right)/2
                    y:(rect.top + rect.bottom)/2
                }
            else
                currentPoint = {
                    x:rect.left
                    y:(rect.top + rect.bottom)/2
                }
            estimation = estimate(startPoint,currentPoint)
            if estimation < lastEstimation
                bestRegion = region
                lastEstimation = estimation
                # as long as we are coming closer
                # dont trigger greedy check
                continue
            dy = currentPoint.y - startPoint.y
            if typeof lastDy is "number"
                charCount += 1
                if charCount > 80 and bestRegion
                    break
            if typeof lastDy isnt "number"
                if (dy - lastDy) * step > 0
                    counter += 1
                    lastDy = dy
            if counter > greedyLimit
                greedy = false
            if not greedy and bestRegion
                break
        if not bestRegion
            return moveOnce
        cursor.setCursorByDOMRegion bestRegion
        return true
    downwardChar:()->
        if not @isActive
            return false
        if @cursor?.conduct "downwardChar"
            return true
        result = @vertical(12)
        @currentBuffer.disableSaveBestPosition = true
        return result
    upwardChar:()->
        if not @isActive
            return false
        if @cursor?.conduct "upwardChar"
            return true
        result = @vertical(-12)
        @currentBuffer.disableSaveBestPosition = true
    write:(value)->
        if not @isActive
            return false
        if not @lastWrite
            @lastWrite = Date.now()
        @historyInterval ?= 1000 * 5
        @lastWrite = Date.now()
        result = @cursor?.conduct "write",value
        return result
    begin:()->
        @cursor.begin()
    end:()->
        @cursor.end()
class CaretViewPortPoserTrait extends Leaf.Trait
    getViewPortComfortableRelation:()->
        rd = @currentBuffer.lastCaretRenderDetail
        if not rd
            return 0
        top = @viewPort.scrollable.scrollTop
        bottom = top + @viewPort.height
        if rd.top - @viewPort.comfortableMargin < top and top > 0
            return rd.top - @viewPort.comfortableMargin - @viewPort.scrollable.scrollTop

        if rd.bottom + @viewPort.comfortableMargin > bottom
            return rd.bottom + @viewPort.comfortableMargin - @viewPort.height - @viewPort.scrollable.scrollTop
        return 0
    inViewPortComfortableZone:()->
        rd = @currentBuffer.lastCaretRenderDetail
        if not rd
            return false
        top = @viewPort.scrollable.scrollTop
        bottom = top + @viewPort.height
        return rd.top - @viewPort.comfortableMargin < top and rd.bottom + @viewPort.comfortableMargin > bottom
    moveToViewPortCenter:(option = {})->
        rect = @viewPort.el.getBoundingClientRect()
        if not rect
            return
        left = (@viewPort.buffer.bestCaretOffset or 0) + rect.left
        top = @viewPort.height/2
        change = false
        notIncludeCenter = false
        scrollTop = @viewPort.scrollable.scrollTop
        if not @viewPort.buffer.lastCaretRenderDetail
            change = true
            notIncludeCenter = true
        else
            lr = @viewPort.buffer.lastCaretRenderDetail
            center = scrollTop + rect.height/2
            if lr.bottom < center or lr.top > center
                notIncludeCenter = true
            else
                notIncludeCenter = false
            if Math.abs(@viewPort.buffer.lastCaretRenderDetail.top - (top + scrollTop)) > 30
                change = true
        if (notIncludeCenter and change) or option.force
            @viewPort.setCursorByClientPoint(left,top)
        @viewPort.buffer.disableSaveBestPosition = true
    moveToViewPortComfortableZoneLazy:()->
        move = @getViewPortComfortableRelation()
        if move is 0
            return false
        left = @currentBuffer.bestCaretOffset or 0
        if move > 0
            # below
            top = @viewPort.height - @viewPort.comfortableMargin
        else
            top = @viewPort.comfortableMargin
        @viewPort.setCursorByClientPoint left,top + 10
        return true
    scrollViewPortToComfortable:({center} = {})->
        rd = @currentBuffer?.lastCaretRenderDetail
        if not rd
            return
        rect = {
            width:rd.width
            height:rd.height
            left:rd.left
            top:rd.top
            right:rd.left + rd.width
            bottom:rd.top + rd.height
        }
        @viewPort.scrollToRectComfortableZone rect,{forceCenter:rd.height > @viewPort.height/2 or center}
class BoundaryEffectTracer
    constructor:(@caret)->
        @name = @caret.name or "master"
        @affected = []
        @__defineSetter__ "dirty",(value)->
            if @caret.dirty isnt value
                @caret.dirty = value
            if value
                @sessionDirty = true
        @__defineGetter__ "dirty",()->
            return @caret.dirty
    getAffectedNode:(boundary)->
        if boundary.type is "include"
            # The hold element is wrapped by caret
            oldAffected = [boundary.node]
        else if boundary.node.nodeType is boundary.node.TEXT_NODE
            # The COMText's DOMNode that contains this TEXT_NODE
            cDecPart = boundary.node.parentElement
            cDecs = [cDecPart]
            if boundary.offset is 0 and (boundary.type is "left" or not boundary.type)
                prev = cDecPart.previousElementSibling
                if prev
                    cDecs.unshift prev
            else if (boundary.offset is boundary.node.length and boundary.type is "left") or (boundary.offset is boundary.node.length - 1 and boundary.type is "right")
                next = cDecPart.nextElementSibling
                if next
                    cDecs.push next
            # First make sure the parent.parent of me is com-text
            cText = cDecPart?.parentElement
            if cDecPart?.classList.contains "com-holder"
                return []
            if not cText or not cText.classList.contains "com-text"
                #Logger.error "unexpected boudnary nearby a TEXT_NODE not inside COMText",boundary,cText,cDecPart
                return []
            result = [cDecPart]
            previous = cDecPart
            left = cDecs[0]
            right = cDecs[cDecs.length - 1]
            while previous = previous.previousElementSibling
                match = false
                for className in previous.classList
                    if className.indexOf("com-inline") isnt 0 and className.indexOf("com-group") isnt 0
                        continue
                    if left.classList.contains className
                        match = true
                        break
                    if match
                        break
                if not match
                    break
                result.unshift previous
            next = cDecPart
            while next = next.nextElementSibling
                match = false
                for className in next.classList
                    if className.indexOf("com-inline") isnt 0
                        continue
                    if right.classList.contains className
                        # do we share some inline class
                        match = true
                        break
                    if match
                        break
                if not match
                    break
                result.push next
            return result
        else
            #Logger.error "affected nont el type",boundary.node,boundary
            return []
    updateEffect:(boundary)->
        # which richtext am I in
        @sessionDirty = false
        @updateOverEffect(boundary)
        d1 = @dirty
        # which rune is before/after the caret
        # {name}-caret-left/right
        @updateAdjacentEffect(boundary)
        d2 = @dirty
        # Which com-text-part group am I in(spell/text)
        @updateNearbyEffect(boundary)
        d3 = @dirty
        # from the caret position to buffer.viewPort.el
        # along this path is the key path
        @updateKeyPathEffect(boundary)
        d4 = @dirty
        if @sessionDirty
            @caret.currentBuffer?.emit "resize"
    updateKeyPathEffect:(b)->
        @keyPathElements ?= []
        kps = []
        b = new DOMBoundary b
        el = b.getTargetParent()
        while el and el.parentElement and el.parentElement isnt @caret.currentBuffer.viewPort.el
            if el.classList
                kps.unshift el
            el = el.parentElement
        index = -1
        for item,offset in @keyPathElements
            if kps[offset] isnt item
                break
            index = offset
        index += 1
        drop = @keyPathElements.splice(index)
        for item in drop
            item.classList.remove "#{@name}-caret-key-path"
            @dirty = true
        kps = kps.slice(index)
        for item in kps
            @dirty = true
            item.classList.add "#{@name}-caret-key-path"
        @keyPathElements.push kps...
        return true
    updateAdjacentEffect:(b)->
        b = new DOMBoundary(b)
        adjacent = b.getAdjacentElement()

        if adjacent.left isnt @leftAdjacent
            @leftAdjacent?.classList.remove "#{@name}-caret-right"
            adjacent.left?.classList.add "#{@name}-caret-right"
            @leftAdjacent = adjacent.left
            @dirty = true
        if adjacent.right isnt @rightAdjacent
            @rightAdjacent?.classList.remove "#{@name}-caret-left"
            adjacent.right?.classList.add "#{@name}-caret-left"
            @rightAdjacent = adjacent.right
            @dirty = true

    updateOverEffect:(b)->
        maxParent = 5
        node = b.node
        while (node = node.parentElement) and maxParent > 0
            maxParent -= 1
            if node.classList?.contains?("com-text") or node.classList?.contains?("com-holder")
                break
        if node.classList.contains? "com-holder"
            node = node.previousElementSibling or null
        if not node or not node.classList.contains? "com-text"
            if @overText
                @overText?.classList.remove "#{@name}-caret-over"
                @overText = null
                @dirty = true
            return
        if node is @overText and @overText
            return
        @dirty = true
        @overText?.classList.remove "#{@name}-caret-over"
        @overText = node
        @overText.classList.add "#{@name}-caret-over"

    updateNearbyEffect:(boundary)->
        oldAffected = @affected.slice(0)
        newAffected = @getAffectedNode(boundary)

        # Find
        # compare diff
        modified = true
        if oldAffected.length is newAffected.length
            modified = false
            for item,index in newAffected
                if item isnt oldAffected[index]
                    modified = true
                    break

        @affected = newAffected
        if not modified
            return false
        @dirty = true
        for item in oldAffected
            item.classList.remove "#{@name}-caret-nearby"
        for item in newAffected
            item.classList.add "#{@name}-caret-nearby"
class CaretPosition
    constructor:(@caret,boundary)->
        @editor = @caret.editor
        @node = boundary?.node
        @index = boundary?.index or boundary?.offset
        @char = boundary?.char
        @boundary = boundary
        @type = @boundary.type
        @viewPort = @caret.viewPort or null
    getRect:(right)->
        # Caret position is relative to view port
        @region ?= DOMRegion.fromBoundary(@boundary)
        rect = @region.getRect {top:@viewPort?.el}
        @caret.viewPort.resolveRect rect
        return rect
class CaretLayout
    @getRenderDetail = (caret,vp)->
        layout = new CaretLayout(caret,vp)
        return layout.getRenderDetail()
    constructor:(@caret,@visualPosition)->
        widthExpand = 0
        heightExpand = 0
    getRenderDetail:()->
        vp = @visualPosition
        widthExpand = 0
        heightExpand = 0
        topFix = 0
        leftFix = 0
        width = 2
        if vp.center
            orders = ["center"]
        else if vp.right and vp.priority is "right"
            orders = ["right","left"]
        else
            orders = ["left","right"]
        #Logger.error orders,vp
        valid = false
        for item in orders
            if item is "center"
                if not vp.center
                    continue
                rect = @getCenterRect()
                if not rect
                    continue
                width = rect.width
                height = rect.height
                top = rect.top
                left = rect.left
                heightExpand = 4
                widthExpand = 4
                type = "cover"
                valid = true
                break
            else if item is "right"
                if not vp.right
                    continue
                rect = @getRightRect()
                if not rect
                    continue
                height = rect.height
                heightExpand = Math.min height * 0.3,4
                if vp.right.position is "right"
                    left = rect.right
                else
                    left = rect.left
                top = rect.top
                type = "caret"
                valid = true
                break
            else if item is "left"
                if not vp.left
                    continue
                rect = @getLeftRect()
                if not rect
                    continue
                height = rect.height
                heightExpand = Math.min height * 0.3,4

                if vp.left.position is "right"
                    left = rect.right
                else
                    left = rect.left
                top = rect.top
                type = "caret"
                valid = true
                break
        if not valid
            return null
        leftFix = - widthExpand / 2
        topFix = - heightExpand / 2
        rd =  {
            height: height + heightExpand
            width: width + widthExpand
            top:top + topFix
            left:left + leftFix
            type:type
        }
        rd.bottom = rd.top + rd.height
        rd.right = rd.left + rd.width
        rd.__defineGetter__ "center",()=>
            rd.center = {
                y:(rd.top + rd.bottom)/2
                x:(rd.left + rd.right)/2
            }
        return rd
    getCenterX:()->
        return @getRenderDetail()?.center?.x
    equalTo:(target)->
        return @rectIdentical(@getCenterRect(),target.getCenterRect()) and @rectIdentical(@getLeftRect(),target.getLeftRect()) and @rectIdentical(@getRightRect(),target.getRightRect())
    rectIdentical:(a,b)->
        if not a and not b
            return true
        if a and b
            props = ["left","right","top","bottom"]
            for prop in props
                if parseInt(a[prop]) isnt parseInt(b[prop])
                    return false
            return true
        return false
    getCenterRect:()->
        vp = @visualPosition
        if not vp.center
            return null
        return @centerRect or @centerRect = @_getBorderRect(vp.center)
    getLeftRect:()->
        vp = @visualPosition
        if not vp.left
            return null
        return @leftRect or @leftRect = @_getBorderRect(vp.left)
    getRightRect:()->
        vp = @visualPosition
        if not vp.right
            return null
        return @rightRect or @rightRect = @_getBorderRect(vp.right)
    _getBorderRect:(border)->
        region = new DOMRegion(border.node,border.offset)
        rect = region.getRect({top:@caret.viewPort?.el})
        if not rect
            return null
        #rect = @caret.viewPort.resolveRect rect
        return rect
    toBoundary:()->
        vp = @visualPosition
        if vp.center
            return new DOMBoundary({
                node:vp.center.node
                offset:vp.center.offset
                type:"include"
            })
        else if vp.left
            return new DOMBoundary({
                node:vp.left.node
                offset:vp.left.offset
                type:"right"
            })
        else if vp.right
            return new DOMBoundary({
                node:vp.right.node
                offset:vp.right.offset
                type:"left"
            })
        return
Caret.CaretPosition = CaretPosition
module.exports = Caret
