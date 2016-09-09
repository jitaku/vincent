KeyEvent = require "../common/keyEvent"
States = require "../common/states"
Errors = require "../common/errors"
EventEmitter = (require "../common/events").EventEmitter
Trait = require "../com/helper/trait"
# Default is isActive:false,hasFocus:true
class InputMethodMaster extends EventEmitter
    constructor:(@editor)->
        super()
    init:()->
        @coreInputMethod = new GeneralInputMethod(@editor,this)
        #@coreInputMethod = new InputMethodChrome(@editor,this)
        @backupInputMethod = new BackupInputMethod(@editor,this)
        @inputMethods = [@coreInputMethod,@backupInputMethod]
        new BrowserDefaultKeyBehaviorPreventor()
        @coreInputMethod.on "workingStateChange",()=>
            @emit "workingStateChange"

        # For some unknown reason, the input method lost it's focus.
        # The backup input method can capture the key event and fix it.
        @backupInputMethod.on "interactive",()=>
            @ensureInputStateWithoutVirtualKeyboard()
        @currentInputMethod = @coreInputMethod
        @hasFocus = true
        @editor.bufferManager.listenBy this,"focus",(buffer)=>
            @attachTo buffer
        @editor.caret.listenBy this,"move",()=>
            @updatePosition()
    isMobileKeyboardShow:()->
        if not @editor.platform.isMobile()
            return false
        h = document.body.clientHeight
        w = document.body.clientWidth
        sw = window.screen.width
        sh = window.screen.height
        keyboardMinSize = sh/4
        if (h - w) * (sh - sw) < 0
            _ = sw
            sw = sh
            sh = _
        return sh - h > keyboardMinSize
    attachTo:(buffer)->
        if not buffer.interactive
            return false
        if buffer is @buffer
            return
        @buffer?.stopListenBy this
        @buffer?.viewPort?.stopListenBy this
        @cursor?.stopListenBy this
        @buffer = buffer
        @cursor = @buffer.cursor
        for method in @inputMethods
            method.attachTo buffer
        @cursor.listenBy this,"move",()=>
            @editor.inputMethod.flush()
        if @viewPort
            @viewPort.stopListenBy this
        @viewPort = buffer.viewPort
        @viewPort.listenBy this,"hasInteraction",()=>
            @ensureInputStateWithoutVirtualKeyboard()
        @ensureInputStateWithoutVirtualKeyboard()
        @attachRootElement @buffer.viewPort.rootElement
        @buffer.viewPort.listenBy this,"rootElement",()=>
            @attachRootElement @buffer.viewPort.rootElement
    attachRootElement:(rootEl)->
        #@contentEditableHacker ?= new ContentEditableHacker(this)
        #@contentEditableHacker.setElement(rootEl)
    updatePosition:()->
        bl = @editor.caret.node.getBoundingClientRect()
        fix = document.body.getBoundingClientRect()
        #@currentInputMethod?.updatePosition(0,0,0,0)
        @currentInputMethod?.updatePosition (bl.right + bl.left - fix.left * 2)/2,bl.bottom - fix.top + 2,fix.bottom,fix.right

    releaseDocumentFocus:()->
        if not @hasDocumentFocus
            return
        @hasDocumentFocus = false
        @ensureInputStateWithoutVirtualKeyboard()
        #@applyState()
        @emit "workingStateChange"
    obtainDocumentFocus:()->
        if @hasDocumentFocus
            return
        @hasDocumentFocus = true
        @ensureInputStateWithoutVirtualKeyboard()
        #@applyState()
        @emit "workingStateChange"
    activate:()->
        if @isActive
            return
        @isActive = true
        @ensureInputStateWithoutVirtualKeyboard()
        @emit "workingStateChange"
    deactivate:()->
        if not @isActive
            return
        @isActive = false
        @ensureInputStateWithoutVirtualKeyboard()
        @emit "workingStateChange"
    flush:()->
        @currentInputMethod?.flush?()
    blur:()->
        @currentInputMethod?.blur?()
    focus:()->
        @currentInputMethod?.focus?()
    showVirtualKeyboard:()->
        if not @editor.platform.isVirtualKeyboard()
            return
        @activate()
        @applyState()
    hideVirtualKeyboard:()->
        if not @editor.platform.isVirtualKeyboard()
            return
        @deactivate()
        @applyState()
    ensureInputStateWithoutVirtualKeyboard:()->
        if @editor.platform.isVirtualKeyboard()
            return
        @updatePosition()
        @applyState()
    applyState:()->
        if @isActive
            if @hasDocumentFocus
                @currentInputMethod = @coreInputMethod
            else
                @currentInputMethod = @backupInputMethod
            for im in @inputMethods
                if im isnt @currentInputMethod
                    if im.isActive
                        im.deactivate()
                    im.ensureFocusState()
            if not @currentInputMethod.isActive
                @currentInputMethod.activate()
            @currentInputMethod.ensureFocusState()
            @listenTo @currentInputMethod
        else
            for im in @inputMethods
                im.deactivate()
                im.ensureFocusState()

    listenTo:(item)->
        if @lastListenTarget
            @lastListenTarget.stopListenBy this
        item.listenBy this,"input",(args...)=>
            @emit "input",args...
        item.listenBy this,"key",(key)=>
            @emit "key",key
        item.listenBy this,"image",(image)=>
            @emit "image",image
        @lastListenTarget = item

class BackupInputMethod extends Leaf.EventEmitter
    constructor:(@context,@master)->
        super()
        @canWrite = true
        window.addEventListener "keydown",(e)=>
            @emit "interactive"
            if not @isActive
                return
            if not @hasFocus
                return
            ke = new KeyEvent e
            @emit "key",ke
        ,true
        window.addEventListener "keyup",(e)=>
            if not @isActive
                return
            if not @hasFocus
                return
            ke = new KeyEvent e
            @emit "key",ke
        ,true
        @hasFocus = true
    ensureFocusState:()->
        @hasFocus = @isActive
    updatePosition:(x,y)->
        return true
    activate:()->
        @isActive = true
        @hasFocus = true
    deactivate:()->
        @isActive = false
        @hasFocus = false
    attachTo:()->

class InputMethodChrome extends States
    attachTo:(buffer)->
        @buffer = buffer
        @cursor?.stopListenBy this
        @cursor = @buffer.cursor
        @cursor.listenBy this,"move",()=>
            @flush()
    constructor:(@editor,@master)->
        super()
        @input = document.createElement "textarea"
#        @input.contenteditable = true
#        @input.setAttribute "contenteditable",true
        @input$ = $ @input
        @input.classList.add "input-method"
        @input.addEventListener "keydown",@onkeydown.bind(this),true
        @input.addEventListener "keyup",@onkeyup.bind(this),true
        @input.addEventListener "compositionstart",@oncompositionstart.bind(this)
        @input.addEventListener "compositionupdate",@oncompositionupdate.bind(this)
        #@input.addEventListener "paste",@onpaste.bind(this)
        @input.addEventListener "compositionend",@oncompositionend.bind(this)
        @checkResize = @checkResize.bind(this)
        #@debug()
        @input.addEventListener "focus",()=>
            @_canWrite = true
            @emit "workingStateChange"
        @input.addEventListener "blur",()=>
            @_canWrite = false
            @emit "workingStateChange"
        @__defineGetter__ "canWrite",()=>
            return @_canWrite and document.activeElement is @input
        @input.raws = 1
        @__defineGetter__ "shouldUseRealHolder",()=>
            if @editor.platform.isMobile()
                return true
            return false
        #setInterval @check.bind(this),1
        #@editor.listenBy this,"beforeRender",@check.bind(this)
        document.body.appendChild @input
        @data.keys = {}
    delayCheck:()->
        clearTimeout @checkTimer
        @checkTimer = setTimeout ()=>
            @check()
        ,0
    updatePosition:(x,y,maxBottom,maxRight)->
        args = [x,y,maxBottom,maxRight]
        change = false
        if @positionCache
            for item,index in args
                if item is @positionCache[index]
                    continue
                else
                    change = true
                    break
            if not change
                return false
        @positionCache = args
        if x < 0
            x = 0
        if y < 0
            y = 0
        css = {}
        if maxBottom and maxBottom < y
            css.bottom = 0
        else
            css.top = y
        if maxRight and maxRight < x
            css.right = 0
        else
            css.left = x
        #if @editor.platform.isMobile()
        #    css = {
        #        bottom:0
        #        left:0
        #        position:"fixed"
        #    }
        #else
        #    css.position = "absolute"
        if @editor.platform.isMobile() and not @data.isComposing
            css.left = 0
            css.right = "auto"
            css.bottom = 10
        if @editor.platform.isMobile() and false
            css.left = "auto"
            css.right = "-30px"
            css.bottom = "0"
            css.top = "auto"
            css.width = "100%"
            @input$.css css
        else
            css.position = "absolute"
            @input$.css css
    reset:()->
        super()
        @lastHolder = " "
        @input.value = @lastHolder
        @data.keys = {}
    activate:()->
        if @isActive
            return
        @focus()
        @reset()
        @setState "wait"
        @isActive = true
    deactivate:()->
        if not @isActive
            return
        @blur()
        if @editor.platform.isMobile()
            window.removeEventListener "resize",@checkResize
        @isActive = false
    ensureFocusState:(option = {})->
        @data.keys = {}
        if @isActive and document.activeElement isnt @input and (option.forceFocus or not @editor.platform.isMobile())
            @focus()
        else if not @isActive and document.activeElement is @input
            @blur()
    focus:()->
        if @editor.platform.isMobile()
            @input.blur()
        @input.focus()
    blur:()->
        @input.blur()
    flush:()->
        value = @input.value
        @holder ?= " "
        if @shouldUseRealHolder and @cursor
            cursor = @cursor
            if cursor and cursor.version isnt @cursorVersion

                contents = cursor?.getSurroundingText?(15)
                # Android input method have problem making
                # letter after `.?!` capitalize.
                period = contents.before.lastIndexOf(".")
                period2 = contents.before.lastIndexOf("?")
                period3 = contents.before.lastIndexOf("!")
                period4 = contents.before.lastIndexOf("\n")
                period = Math.max(period,period2,period3,period4)
                if period >=0
                    contents.before = contents.before.slice(period + 1)
                contents.before = contents.before.replace(/\n/g," ")
                if contents.before.length is 0
                    contents.before = " "
                @holder = contents.before
                @cursorVersion = cursor.version
        else
            @holder = " "
        # for ipad I don't know why when value is empty it stuck...
        if value isnt @holder
            @input.value = @holder
        if value isnt @lastHolder and (value is @lastHolder.slice(0,-1) or (value.length is 0))
            # simulate backspace
            @emit "key",new KeyEvent {which:8}

        else if value isnt @lastHolder
            value = value.slice(@lastHolder.length)
            if value and value.length > 0
                @emit "input",value
        @lastHolder = @holder
    check:()->
        if not @isActive
            return
        Key = Leaf.Key
        #if not @isActive
        #    return

        # In mobile platform we always need to run the flush to check
        # If input method have made a backspace.
        if @state isnt "composition" and (@input.value.length > 0 or @editor.platform.isMobile())
            @data.canFlush = true
        if @data.canFlush
            @data.canFlush = false
            @flush()
        keys = @data.keys
        for prop of keys or {}
            event = keys?[prop]
            if event and not event.defaultPrevented
                delete keys?[prop]
                @emit "key",new KeyEvent(event)
    onkeydown:(e)->
        #e.preventDefault()
        #e.stopImmediatePropagation()
        @delayCheck()
        if @isWaitingFor "input"
            @give "input",{
                type:"keyboard"
                event:e
            }
    onkeyup:(e)->
#        e.preventDefault()
#        e.stopImmediatePropagation()
        @delayCheck()
        if @isWaitingFor "input"
            @give "input",{
                type:"keyboard"
                event:e
            }
    oncompositionstart:(e)->
        if @isWaitingFor "input"
            @give "input",{
                type:"ime"
                event:e
                action:"start"
            }
    oncompositionupdate:(e)->
        @delayCheck()
        if @isWaitingFor "input"
            @give "input",{
                type:"ime"
                event:e
                action:"update"
            }
    oncompositionend:(e)->
        @delayCheck()
        if @isWaitingFor "input"
            @give "input",{
                type:"ime"
                event:e
                action:"end"
            }
    onpaste:(e)->
        cdata = e.clipboardData
        for item in e.clipboardData.items or {}
            type = item.type or ""
            if type.indexOf("image/") is 0
                blob = item.getAsFile()
                if blob instanceof Blob
                    @emit "image",{
                        blob
                    }
                    e.preventDefault()
                    e.stopImmediatePropagation()

    handleKeyboard:(e)->
        # we don't use key up!
        if e.type is "keyup"
            @data.canFlush = true
        else if e.type is "keydown"
            @data.canFlush = true
        @data.keys[e.which] = e
        @check()
    atWait:(sole)->
        @waitFor "input",(input)=>
            if input.type is "keyboard"
                @handleKeyboard input.event
                if @stale sole
                    return
                @setState "wait"
                return
            if input.type is "ime" and input.action is "start"
                @setState "composition"
                return
            @error new Errors.UnexpectedInput "unexpected input at wait",{input:info}
            return
    atPanic:()->
        Logger.error @panicState,@panicError
    atComposition:()->
        @input.classList.add "compose"
        @data.isComposing = true
        @data.canFlush = false
        @waitFor "input",(input)=>
            if input.type isnt "ime"
                # ignore normal input
                @setState "composition"
                return
            if input.action is "update"
                @setState "composition"
                return
            if input.action is "end"
                @data.canFlush = true
                @data.isComposing = false
                @input.classList.remove "compose"
                @setState "wait"
                return
            @setState "composition"
class CompositeSession
    constructor:(@fullText,@compositePart)->
    isValid:()->
        return @fullText?.slice?(-@compositePart.length) is @compositePart

class GeneralInputMethod extends Leaf.States
    constructor:(@editor,@master)->
        super()
        #@debug()
        new FocusableTrait(this)
        new ActivableTrait(this)
        new KeyEventHandler(this)
        @input = document.createElement "textarea"
        @input$ = $ @input
        @input.classList.add "general-input-method"
        @input.addEventListener "keydown",@onkeydown.bind(this),true
        @input.addEventListener "keyup",@onkeyup.bind(this),true
        @input.addEventListener "input",@oninput.bind(this)
        @input.addEventListener "compositionstart",@oncompositionstart.bind(this)
        @input.addEventListener "compositionupdate",@oncompositionupdate.bind(this)
        if @editor.platform.isMobile()
            @requestIMEComplete = true
        @inputHolder = "  "
        #@input.addEventListener "paste",@onpaste.bind(this)
        @input.addEventListener "compositionend",@oncompositionend.bind(this)
        @sessionId =0
        document.body.appendChild @input
        @checkResize = @checkResize.bind(this)
        window.addEventListener "resize",@checkResize
        @input.addEventListener "blur",()=>
            @reform()
        Key = Leaf.Key
        @charKeys = {
            " ":{which:Key.space,shiftKey:true}
            "!":{which:Key["1"],shiftKey:true}
            "@":{which:Key["2"],shiftKey:true}
            "#":{which:Key["3"],shiftKey:true}
            "$":{which:Key["4"],shiftKey:true}
            "%":{which:Key["5"],shiftKey:true}
            "^":{which:Key["6"],shiftKey:true}
            "&":{which:Key["7"],shiftKey:true}
            "*":{which:Key["8"],shiftKey:true}
            "(":{which:Key["9"],shiftKey:true}
            ")":{which:Key["0"],shiftKey:true}
            "_":{which:Key.dash,shiftKey:true}
            "+":{which:Key.equal,shiftKey:true}
            "~":{which:Key.graveAccent,shiftKey:true}
            "`":{which:Key.graveAccent}
        }
        @forceDisplay = false
        #if @editor.platform.isMobile()
        #    @ignoreKeyEvent = true
        #@ignoreKeyEvent = true
    checkResize:()->
        clearTimeout @resizeTimer
        @resizeTimer = setTimeout ()=>
            height = $(window).height()
            keyboardHeightMin = height/4
            if Math.abs(height - @editor.initHeight) < keyboardHeightMin
                # It's keyboard hide
                window.document.activeElement.blur()
        ,500
        setTimeout ()=>
            height = $(window).height()
            keyboardHeightMin = 150
            if not Math.abs(height - @editorn.initHeight) < keyboardHeightMin
                # likely to be keyboard show
                @editor.caret.scrollViewPortToComfortable()
        ,10
    atPanic:()->
        Logger.error @panicError,@panicState
    sync:(input)->
        if @input.value is @data.base.slice(0,-1)
            # simulate backspace
            # The only space is deleted
            try
                @emit "key",new KeyEvent {which:8}
                @reform()
            catch e
                Logger.error e
            return false
        else if @input.value is @data.base.slice(0,@input.value.length) and @data.base.length - @inputHolder.length >= @input.value?.length

            try
                @editor.conduct "delete-word"
                @reform()
            catch e
                Logger.error e
            return false
        #mobileLog "#{@input.value.length} #{@data.base.length}"
        holderLength = @inputHolder.length
        withEnter = false
        charKey = null
        prevContent = @data.previousContent or @data.base.slice(@inputHolder.length)
        if @input.value?.slice(-1) is "\n"
            ke = new KeyEvent {which:13}
            @emit "key",ke
            if ke.defaultPrevented
                content = @input.value.slice(holderLength,-1)
                @input.value = @input.value.slice(0,holderLength)
                withEnter = true
            else
                content = @input.value.slice(holderLength)
        else if charKey = @charKeys[@input.value?.slice(-1)]
            # simulate a space
            ke = new KeyEvent charKey
            @emit "key",ke
            if ke.defaultPrevented
                content = @input.value.slice(holderLength,-1)
                @input.value = @input.value.slice(0,holderLength)
            else
                content = @input.value.slice(holderLength)
        else
            content = @input.value.slice(holderLength)
        if prevContent is content
            return true
        @isReplacingIME = true
        if not @editor.buffer.selection.isCollapsed() and @editor.buffer.selection.isActive
            @editor.buffer.context.transact ()=>
                @editor.buffer.selection.removeSelectedNodes()
                @editor.buffer.selection.collapseToBegin()
                @editor.buffer.selection.deactivate()

        @editor.userIsWriting = true
        @cursor.IMEReplace prevContent,content
        @editor.userIsWriting = false
        @data.previousContent = content
        @isReplacingIME = false
        @data.previousContent = content
        if @input.value?.indexOf("\n") > 0 or withEnter
            @reform()
            return false
        if @data.suggestedContent
            suggestedContent = @data.suggestedContent
            @buffer?.nextRender ()=>
                if suggestedContent is @data.suggestedContent
                    @buffer?.imeHint.hint @data.suggestedContent
        else
            @buffer?.imeHint.clear()
        return true
    attachTo:(buffer)->
        if buffer is @buffer
            return
        @buffer?.stopListenBy this
        @buffer?.imeHint?.clear()

        @buffer = buffer
        @cursor?.stopListenBy this

        @cursor = @buffer.cursor
        @cursor.listenBy this,"move",()=>
            clearTimeout @_reformTimer
            if not @isReplacingIME
                @_reformTimer = setTimeout ()=>
                    if not @isReplacingIME and not @master.isMobileKeyboardShow()
                        @reform()
                ,5

        @reform()
    reform:()->
        @reset()
        @buffer?.context?.history.enableCheckPoint()
        @setState "init"
    getComposingText:()->
        super()
    updatePosition:(x,y,maxBottom,maxRight)->
        minLeft = 0
        if @editor.platform.isMobile() and not @forceDisplay
            x = -500
            minLeft = - 999999
        args = [x,y,maxBottom,maxRight]
        change = false
        xFix = 0
        yFix = 0
        if @editor.platform.isMobile()
            yFix = -25
        if @positionCache
            for item,index in args
                if item is @positionCache[index]
                    continue
                else
                    change = true
                    break
            if not change
                return false
        @positionCache = args
        css = {top:y + yFix,left:x + xFix}
        #if x < minLeft
        #    x = 0
        #if y < 0
        #    y = 0
        if maxBottom and maxBottom < y
            delete css.top
            css.bottom = 0
        else
            css.top = y
        #if maxRight and maxRight < x
        #    css.right = 0
        #else
        #    css.left = x
        css.position = "absolute"
        @input$.css css
    reset:()->
        super()

    onkeydown:(e)->
        @feed "input",{
            type:"keyboard"
            event:e
        }
    onkeyup:(e)->
        @feed "input",{
            type:"keyboard"
            event:e
        }
    oninput:(e)->
        @feed "input",{
            type:"input"
            event:e
        }
    oncompositionstart:(e)->
        @feed "input",{
            type:"ime"
            event:e
            action:"start"
        }
    oncompositionupdate:(e)->
        @feed "input",{
            type:"ime"
            event:e
            action:"update"
        }
    oncompositionend:(e)->
        @feed "input",{
            type:"ime"
            event:e
            action:"end"
        }
    onpaste:(e)->
        @reform()
        cdata = e.clipboardData
        for item in e.clipboardData.items or {}
            type = item.type or ""
            if type.indexOf("image/") is 0
                blob = item.getAsFile()
                if blob instanceof Blob
                    @emit "image",{
                        blob
                    }
                    e.preventDefault()
                    e.stopImmediatePropagation()
    atPanic:()->
        Logger.error @panicState,@panicError
    atHang:()->
        # Input method hangs
        # Perform another `ireform` to try again
        # Hang usually due to cursor not set
    atInit:()->
        if not @cursor
            @setState "hang"
            return
        if @requestIMEComplete
            word = @cursor?.getSurroundingWord(2)?.before or ""
            @data.base = @inputHolder + word
        else
            @data.base = @inputHolder
        if @input.value isnt @data.base
            @input.value = @data.base
        @setState "waitCompositeUpdate"
    atWaitCompositeUpdate:()->
        @consumeWhenAvailable "input",(input)=>
            if input.type is "keyboard"
                if @ignoreKeyEvent or input.event.which is 229
                    @setState "waitCompositeUpdate"
                    return
                result = @handleKeyboard(input.event)
                if result.defaultPrevented
                    @reform()
                    return
                else
                    @setState "waitCompositeUpdate"
                    return
            if input.type is "input"
                if not @sync()
                    return
                #if @data.onceEnd
                #    @reform()
                #    return
                @setState "waitCompositeUpdate"
                return
            if input.type isnt "ime"
                @reform()
                return
            if input.action is "update"
                @data.suggestedContent = input.event.data
                @setState "waitCompositeUpdate"
                return
            if input.action is "start"
                @buffer.context?.history.disableCheckPoint()
                @data.suggestedContent = ""
                @setState "waitCompositeUpdate"
                return
            if input.action is "end"
                @buffer.context?.history.enableCheckPoint()
                @buffer.context?.history.addCheckPoint()
                @data.onceEnd = true
                @data.suggestedContent = ""
                @buffer.imeHint?.clear()
                @setState "waitCompositeUpdate"
                return
            @reform()
class KeyEventHandler extends Trait
    handleKeyboard:(event)->
        try
            @emit "key",ke = new KeyEvent event
        catch e
            Logger.error e
        return ke
class FocusableTrait extends Trait
    ensureFocusState:(option = {})->
        if @isActive
            @isFocusing = true
        @_applyFocusToElement()
    focus:()->
        @isFocusing = true
        @_applyFocusToElement()
    blur:()->
        @isFocusing = false
        @_applyFocusToElement()
    _applyFocusToElement:()->
        if @editor.platform.isMobile() and @isFocusing
            @input.blur()
            @input.focus()
            @reform()
            return
        if @input isnt window.document.activeElement and @isFocusing
            @input.focus()
            @reform()
        else if @input is window.document.activeElement and not @isFocusing
            @input.blur()
            @reform()

class ActivableTrait extends Trait
    isActive:false
    activate:(option = {})->
        if @isActive
            return
        if option.forceFocus or not @editor.platform.isMobile()
            @focus()
        if @editor.platform.isMobile()
            window.addEventListener "resize",@checkResize
        @reset()
        @setState "init"
        @isActive = true
        @reform()
    deactivate:()->
        if not @isActive
            return
        @blur()
        if @editor.platform.isMobile()
            window.removeEventListener "resize",@checkResize
        @isActive = false
        @reform()
class ContentEditableHacker
    constructor:(@inputMethod)->
    setElement:(el)->
        @detach @el
        @attach el
        @el = el
    detach:(el)->
        if not el
            return
        el.removeEventListener "keydown"
        el.removeEventListener "input"
    attach:(el)->
        el.addEventListener "keydown",(e)->
            e.preventDefault()
            e.stopImmediatePropagation()
        el.addEventListener "compositionstart",(e)->
            e.preventDefault()
            e.stopImmediatePropagation()
        el.addEventListener "input",(e)->
            e.preventDefault()
            e.stopImmediatePropagation()
class BrowserDefaultKeyBehaviorPreventor
    # prevent unwanted browser key behavior
    @preventing = false
    constructor:()->
        if BrowserDefaultKeyBehaviorPreventor.preventing
            return
        window.addEventListener "keydown",(e)->
            if e.altKey and not e.ctrlKey and e.which isnt Leaf.Key.d
                e.preventDefault()
            else if e.which is Leaf.Key.tab
                e.preventDefault()
        BrowserDefaultKeyBehaviorPreventor.preventing = true
module.exports = InputMethodMaster
