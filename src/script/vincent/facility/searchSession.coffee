Walker = COM.COMWalker
Rune = COM.COMRune

class SearchSession
    constructor:(@buffer)->
        @editor = @buffer.editor
        @modifier = "gi"
        @lightColor = "yellow"
        @focusColor = "orange"
    setKeyword:(keyword)->
        @end()
        @keyword = keyword
    applyCurrent:(option = {})->
        item = @currentFocus
        selection = @buffer.selection
        if not item
            selection.deactivate()
            return
        else if option.begin
            selection.baseCursor.pointAtAnchor item.startAnchor
            selection.extentCursor.pointAtAnchor item.startAnchor
            selection.deactivate()
        else if option.select
            selection.activate()
            selection.baseCursor.pointAtAnchor item.startAnchor
            selection.extentCursor.pointAtAnchor item.endAnchor
        else
            selection.baseCursor.pointAtAnchor item.endAnchor
            selection.extentCursor.pointAtAnchor item.endAnchor
            selection.deactivate()
    buildReg:()->
        if @keyword.indexOf("reg:") is 0
            word = @keyword.slice(4).replace(/\\n/g,"\n")
            mod = "g"
        else
            # escape for normal use
            word = @keyword.replace /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, (match)->
                return "\\#{match}"


            mod = @modifier
        return new RegExp word,mod
    search:()->
        buffer = @buffer
        context = @buffer.context
        walker = new Walker.WalkerRootFirst context
        walker.setNode context.root
        results = []
        currentNode = false
        nextHit = null
        previousHit = null
        reg = @buildReg()
        previousHitTarget = null
        cursor = @cursorBackup
        while walker.next ((item)->item.sortOf("RichText"))
            reg.lastIndex = 0
            node = walker.node
            cs = Rune.purifyContentString node.contentString,{useHolder:true}
            if walker.node is cursor.target
                currentNodePass = true
            while match = reg.exec cs
                if match[0].length is 0
                    break
                startAnchor = walker.node.anchor.clone()
                endAnchor = walker.node.anchor.clone()
                start = match.index
                end = match.index + match[0].length
                startAnchor.index = start
                endAnchor.index = end

                result = {
                    target:walker.node
                    content:match[0]
                    length:match.length
                    start
                    end
                    startAnchor
                    endAnchor
                }
                if currentNodePass and not nextHit and not @isReverse
                    if result.target is cursor.target and result.start >= cursor.anchor.index
                        nextHit = true
                        result.current = true
                    else if result.target isnt cursor.target
                        nextHit = true
                        result.current = true
                if @isReverse and not currentNodePass
                    previousHit = true
                    previousHitTarget = result
                else if @isReverse and currentNodePass and result.target is cursor.target and result.end <= cursor.anchor.index
                    previousHit = true
                    previousHitTarget = result
                else if @isReverse and not previousHit
                    previousHit = true
                    previousHitTarget = result
                results.push result
        if previousHitTarget
            previousHitTarget.current = true
        if not nextHit and not @isReverse
            results[0]?.current = true
        if not previousHitTarget and @isReverse
            results[results.length - 1]?.current = true
        return results
    start:()->
        if @isStart
            return
        @isStart = true
        @cursorBackup = @buffer.cursor.clone()
        @lightSession = @buffer.highlighter.createSession()
        @hits = @search()
        @lights = []
        @lightSession.clear()
        for item in @hits
            light = @lightSession.addHighlight(item.startAnchor,item.endAnchor,{color:@lightColor})
            item.light = light
            if item.current
                current = item
        @lightSession.applyAll()
        if current
            @setCurrent(current)
    end:(option = {})->
        if not @isStart
            return
        @isStart = false
        if option.apply and @keyword
            @applyCurrent(option)
        else if @cursorBackup?.anchor
            @buffer.selection.deactivate()
            @buffer.cursor.pointAtAnchor @cursorBackup.anchor
            @buffer.selection.collapseToCursor()
        if @lightSession
            @lightSession.clear()
            @lightSession = null
    replaceAll:(content)->
        @buffer.context.transact ()=>
            for hit in @hits
                if not hit
                    continue
                text = hit.light.startCursor.target
                hit.light.startCursor.anchor.deleteBetween hit.light.endCursor.anchor
                text.insertText hit.light.startCursor.anchor.index,content
            @hits = []
        return true
    replaceCurrentContentAndNext:(content)->
        if not @currentFocus
            return false
        @buffer.context.transact ()=>
            text = @currentFocus.light.startCursor.target
            @currentFocus.light.startCursor.anchor.deleteBetween @currentFocus.light.endCursor.anchor
            text.insertText @currentFocus.light.startCursor.anchor.index,content
            matchIndex = -1
            @currentFocus.light.clear()
            @hits = @hits.filter (item,index)=>
                if item isnt @currentFocus
                    return true
                matchIndex = index
                return false
            if @hits[matchIndex]
                @setCurrent @hits[matchIndex]
            else if @hits[0]
                @setCurrent @hits[0]
            else
                @currentFocus = null
    setCurrent:(item)->
        if not item
            return false
        if @currentFocus
            @currentFocus.light.setOption({color: @lightColor})
        item.light.setOption {color: @focusColor}
        @currentFocus = item
        @buffer.cursor.pointAtAnchor item.light.startCursor.anchor
        item.light.blink()
        rect = item.light.rects[0]?.rect
        if not rect
            return
        @editor.buffer.viewPort.scrollToRectComfortableZone(rect,{forceCenter:true})
        return true
    next:()->
        if not @hits
            return false
        if not @currentFocus
            return @setCurrent @hits[0]
        for item,index in @hits
            next = @hits[index + 1]
            if item is @currentFocus
                if next
                    @setCurrent next
                    return true
                else
                    return @setCurrent @hits[0]
        return false

    previous:()->
        if not @hits
            return false
        if not @currentFocus
            return @setCurrent @hits[0]
        for item,index in @hits
            previous = @hits[index - 1]
            if item is @currentFocus
                if previous
                    @setCurrent previous
                    return true
                else
                    return @setCurrent @hits[@hits.length - 1]
        return false
module.exports = SearchSession
