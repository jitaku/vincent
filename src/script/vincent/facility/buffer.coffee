COMContext = require "../com/context"
Trait = require "../com/helper/trait"
COMSelection = require "../com/selection"
COMCursor = require "../com/cursor"
DOMSelection = require "./selection"
ViewPort = require "./viewPort"
SelectSession = require "./selectSession"
SelectionHighlight = require "./selectionHighlight"
Highlighter = require "./highlighter"
SearchSession = require "./searchSession"
EventEmitter = (require "../common/events").EventEmitter
IMEHint = require "./imeHint"
Properties = require "/component/properties"
SharedCallbacks = require "/component/sharedCallbacks"
class Buffer extends Leaf.Widget
    @index = 0
    type:"Buffer"
    constructor:(@editor,option = {})->
        @id = (Buffer.index++).toString()
        super()
        @isActive = false
        @name = option.name or "<buffer #{@id}>"
        @properties = new Properties(this)
    focus:()->
        if @isFocusing
            return
        if not @isActive
            return false
        @isFocusing = true
        @emit "focus"
    blur:()->
        if not @isFocusing
            return
        if not @isActive
            return false
        @isFocusing = false
        @emit "blur"
    activate:()->
        # Activate is usually called by Layout
        # Or modules that have the knowledge if the buffer
        # Is *DISPLAYED*.
        if @isActive
            return
        @isActive = true
        @emit "active"
    deactivate:()->
        if not @isActive
            return
        @blur()
        @isActive = false
        @emit "deactive"
    render:()->
        return false
    destroy:()->
        @emit "destroy"
        return
class RichBuffer extends Buffer
    @renderConfig = {}
    @setRenderConfig = (config)->
        for prop,value of config
            @renderConfig[prop] = value
    type:"RichBuffer"
    constructor:(@editor,option = {})->
        @template ?= """<div class="buffer" data-class="focusState">
          <div data-id="viewPort" class="com-view-port needsclick">
              <div data-id="wrapper" class="wrapper"></div>
          </div>
        </div>
        """

        super(@editor,option)
        @viewPort = new ViewPort(this,@UI.viewPort)
        @context = option.context
        @cursor = @context.createCursor {name:"master"}
        @selection = new COMSelection(@context,@cursor)
        @selectSession = new SelectSession(this)
        @selectionHighlight = new SelectionHighlight(this)
        @nextRenderCallback = SharedCallbacks.create()
        @dropHandler = new BufferDropHandler(this)
        @imeHint = new IMEHint(this)
        @viewPort.listenBy this,"scroll",()=>
            @emit "reflow"
        @highlighter ?= new Highlighter(this)
        @searchSession = new SearchSession(this)
        @renderContext ?= @context.allocateRenderContext()
        @__defineGetter__ "rootElement",()=>
            return @renderContext.rootElement
        @renderContext.buffer = this
        for prop,value of RichBuffer.renderConfig
            @renderContext.renderConfig[prop] = value
        @renderContext.listenBy this,"resize",()=>
            @emit "resize"

        # If a buffer is not interactive it will never been auto rendered
        # You should manually call render. This is useful when a buffer is
        # only meant to be display content not instead of editing any.
        @interactive = false
        # if @lockUserInput and current buffer is active
        # editor should ignore "input","key" event from input method
        # buffer viewPort should ignore pointerEvent from user
        @lockUserInput = false

        @node.addEventListener "click",()=>
            @ensureFocus()
        @node.addEventListener "touchend",()=>
            @ensureFocus()

        @renderContext.buffer = this
        @renderContext.cursor = @cursor
        @__defineGetter__ "interactive",()=>
            return @renderContext.interactive
        @__defineSetter__ "interactive",(value)=>
            @renderContext.interactive = value
            @emit "interactiveChange",value
        @__defineGetter__ "renderOption",(value)=>
            return @renderContext.renderConfig
        @viewPort.init()
    activate:()->
        super()
    deactivate:()->
        super()
    ensureFocus:()->
        if @lockUserInput
            return
        @editor.bufferManager.focusAt this
    ensureRenderContext:()->
        if @context.currentRenderContext isnt @renderContext
            @context.setRenderContext @renderContext
    focus:()->
        super()
        @selectSession.activate()
        @VM.focusState = "buffer-focus"
    blur:()->
        super()
        @selectSession.deactivate()
        @VM.focusState = "buffer-blur"
    nextRender:(callback)->
        @nextRenderCallback.push(callback)
    render:()->
        @context.render(@renderContext)
        if @name is "debug"
            Logger.debug "render debug",this
        @viewPort.setRoot @renderContext.el
        @selectionHighlight.render()
        @nextRenderCallback()
    setContentString:(contentString)->
        @context.transact ()=>
            @context.root.empty()
            p = @context.createElement "Contents",{children:[(@context.createElement "RichText",{contentString}).toJSON()]}
            @context.root.append p
            @cursor.pointAt p.children[0]
            @context.history.fromNow()
        return true
    markAsReadonly:()->
        @emit "readonly"
        @context.isReadonly = true
    unmarkAsReadonly:()->
        @emit "readwrite"
        @context.isReadonly = false
    destroy:()->
        @context?.destroyRenderContext @renderContext
        @selectionHighlight.destroy()
        super()

# Buffer manager can hold all buffers, and make sure only one buffer is focused a time
class BufferManager extends EventEmitter
    constructor:(@editor)->
        super()
        @buffers = []
        @focusStack = []
        new ManagerDragCapableTrait(this)
    render:()->
        SLOW_RENDER = 10
        start = Date.now()
        for buffer in @buffers
            if not buffer.isActive or not buffer.interactive
                continue
            buffer.render()
            buffer.emit "afterRender"
            if buffer.isFocusing
                buffer.selectSession.syncSelection()
        @currentFocus?.ensureRenderContext()
        endRender = Date.now()
        if endRender - start > SLOW_RENDER
            Logger.debug "SLOW_RENDER",endRender - start,"ms",">",SLOW_RENDER,"ms"
    allocate:(context,option = {})->
        if context instanceof Buffer
            buffer = context
        else
            option.context = context
            buffer = new RichBuffer(@editor,option)
        buffer.manager = this
        @buffers.push buffer
        buffer.listenBy this,"active",()=>
            @emit "active",buffer
        buffer.listenBy this,"deactive",()=>
            @emit "deactive",buffer
        return buffer
    recover:(buffer)->
        buffer.stopListenBy this
        buffer.destroy()

    focusAt:(buffer)->
        if @currentFocus
            @currentFocus.blur()
        @currentFocus = buffer
        buffer.ensureRenderContext()
        buffer.focus()
        if not buffer.isActive
            Logger.warn "Focus at none active buffer doesn't make sense.",buffer
        @emit "focus",buffer
    pushFocus:(buffer)->
        if @currentFocus
            @focusStack.push @currentFocus
        @focusAt buffer
    popFocus:(buffer)->
        if @currentFocus is buffer
            if @focusStack.length > 0
                @focusAt @focusStack.pop()
        else
            @focusStack = @focusStack.filter (item)->item is buffer
class ManagerDragCapableTrait extends Trait
    initialize:()->
        # default handler for moving runes
        @registerDropHandler (e,buffer)=>
            for protocol in e.detail.protocols
                if protocol.type is "Rune"
                    @transferRune buffer,protocol.data
                    e.preventDefault()
                    e.stopImmediatePropagation()
    transferRune:(buffer,origin)->
        if buffer.cursor.target.mime isnt "text/com-rich-text"
            return false
        if origin.context isnt buffer.context
            ref = buffer.context.createElement origin.type,origin.toJSON()
        else
            ref = origin
        if origin is buffer.cursor.target.runeAtIndex(buffer.cursor.anchor.index)
            return true
        origin.context.transact ()=>
            if origin.parent
                origin.parent.reflow()
                origin.parent.removeText origin.startOffset,origin.length
        buffer.context.transact ()=>
            buffer.cursor.conduct "write",ref
            ref.dirty = true
        buffer.viewPort.controller?.reform()
    registerDropHandler:(handler = ()->)->
        @dropHandlers ?= []
        @dropHandlers.push handler
class BufferDropHandler
    constructor:(@buffer)->
        @editor = @buffer.editor
        @viewPort = @buffer.viewPort
        @viewPort.el.addEventListener "user-drop",(e)=>
            for handler in @dropHandlers or []
                handler e
                if e.defaultPrevented
                    return
            for handler in @editor.bufferManager.dropHandlers
                handler e,@buffer
                if e.defaultPrevented
                    return
    registerDropHandler:(handler = ()->)->
        @dropHandlers ?= []
        @dropHandlers.push handler
Buffer.RichBuffer = RichBuffer
Buffer.BufferManager = BufferManager
module.exports = Buffer
