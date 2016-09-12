COMContext = require "./com/context"
COMRichText = require "./com/richText"
COMNamespace = require "./com/namespace"
COMDecoration = require "./com/decoration"
COMSpell = require "./com/spell"
COMElement = require "./com/element"
COMNode = require "./com/node"
COMComposer = require "./com/composer"

Caret = require "./facility/caret"
InputMethod = require "./facility/inputMethod"
HotkeyManager = require "./facility/hotkeyManager"
CommandManager = require "./facility/commandManager"
Clipboard = require "./facility/clipboard"
PluginManager = require "./facility/pluginManager"
Buffer = require "./facility/buffer"
DropManager = require "./facility/dropManager"
BufferManager = Buffer.BufferManager
Debugger = require "./facility/debugger"
Platform = require "./facility/platform"
ContextManager = require "./facility/contextManager"
DocumentFocus = require "./facility/documentFocus"
DOMSelection = require "./facility/selection"
CancelStack = require "./facility/cancelStack"
DragManager = require "./facility/dragManager"

SharedCallbacks = require "/component/sharedCallbacks"
class Editor extends Leaf.Widget
    @packs = []
    COM:require "./com/index"
    constructor:(el)->
        super el
        new NextRenderAware(this)
        @namespace = COMContext.namespace
        @debugger ?= new Debugger(this)
        @platform = Platform.create()
        @contextManager = new ContextManager(this)
        @contextManager.listenBy this,"context/create",(context)=>
            context.facilities.editor = this
        @bufferManager = new BufferManager(this)
        @__defineGetter__ "buffer",()=>
            return @bufferManager.currentFocus
        @__defineGetter__ "context",()=>
            return @bufferManager.currentFocus?.context
        @__defineGetter__ "selectSession",()=>
            return @bufferManager.currentFocus?.selectSession
        # Some custom parts of the editor can disable the input method
        # and editor input, by obtain the focus. In this state, this
        # editor is still active
        # manage visible buffer's position
        @clipboard = new Clipboard(this)
        @domSelection = new DOMSelection this
        @inputMethod ?= new InputMethod(this)
        @dragManager = new DragManager(this)
        @caret ?= new Caret(this)
        @bufferManager.listenBy this,"focus",(buffer)=>
            Buffer = require "./facility/buffer"
            if buffer instanceof Buffer.RichBuffer
                @caret.attachTo buffer

        @initHeight = window.initHeight
        @caret.init()
        @inputMethod.init()

        @hotkeys ?= new HotkeyManager(this)
        @commands ?= new CommandManager(this)
        @plugins ?= new PluginManager(this)
        @dropManager ?= new DropManager(this)
        @cancelStack ?= new CancelStack(this)
        @inputMethod.on "input",(input)=>
            if @buffer?.lockUserInput
                return
            if @focus.level isnt "all"
                return

            @userIsWriting = true
            @conduct "write",input
            @userIsWriting = false
        index = 0
        Key = Leaf.Key
        @inputMethod.on "key",(event)=>
            locked = @lockUserInput or @buffer?.lockUserInput

            @hotkeys.handleKeyEvent event
            if event.altKey and not event.ctrlKey and event.code isnt Leaf.Key.d
                event.capture()
            if not event.defaultPrevented and not window.hasCommandKey and @buffer and event.keyDown and @buffer?.selection?.isActive and not @buffer.selection?.isCollapsed?() and not event.isModified() and @focus.level is "buffer"
                if event.canOutput()
                    event.capture()
                    if not locked
                        @userIsWriting = true
                        @conduct "delete-selection"
                        @conduct "write",event.getInputText()
                        @userIsWriting = false
                        return
            if event.code in [Leaf.Key.backspace] and document.activeElement?.tagName not in ["TEXTAREA","INPUT"]
                event.raw.preventDefault()
                event.raw.stopImmediatePropagation()
            if event.altKey and event.code isnt Leaf.Key.d
                # Currently no case of default alt key related hotkey should we support.
                event.raw.preventDefault()
        @focus = new DocumentFocus.FocusManager(this)
        @registerPlugin?()
    asUser:(fn)=>
        userIsWriting = @userIsWriting
        @userIsWriting = true
        try
            fn()
        catch e
            Logger.error "Error during Editor.asUser",e
        @userIsWriting = userIsWriting

    getAllPlugins:()->
        return @plugins.plugins
    init:()->
        @setup()
        @activate()
        @focus.allowAll()
        @emit "ready"
        @platform.emitEmbedEvent "ready"
    setup:()->
        @caret.show()
        @plugins.init()
    conduct:(args...)->
        if args[0] is "write"
            @emit "write",args[1]
        @commands.conduct(args...)
    announce:(name,args...)->
        @emit "announcement/#{name}",args...
#   focus:()->
#       @activate()
#   blur:()->
#       @deactivate()
    activate:()->
        if @isActive
            return false
        @isActive = true
        @inputMethod.activate()
        @caret.activate()
        @renderFrame()
        return true
    deactivate:()->
        if not @isActive
            return false
        @isActive = false
        clearTimeout @timer
        cancelAnimationFrame @timer
        @inputMethod.deactivate()
        @caret.deactivate()
        return true
    plugin:(name)->
        return @plugins.plugins[name]
    render:()->
        @emit "beforeRender"
        @bufferManager.render()
        if document.body.scrollTop isnt 0
            if not @lastScrollTop
                @lastScrollTop = document.body.scrollTop
            else if @lastScrollTop is document.body.scrollTop
                document.body.scrollTop = 0
        if @caret.isShow
            @caret.update()
        @emit "afterRender"
        #if @buffer instanceof Buffer.RichBuffer
        #    @domSelection.render()
    renderFrame:()->
        @render()
        @timer = @nextRenderFrame ()=>
            @renderFrame()
    nextRenderFrame:(frame)->
        #return setTimeout frame,1
        return window.requestAnimationFrame frame
    addComponent:(Cons...)->
        for item in Cons
            if item.prototype instanceof COMDecoration.DecorationMaintainer
                @namespace.registerDecoration new item
            else if item instanceof COMDecoration.DecorationMaintainer
                @namespace.registerDecoration item
            else if item.prototype instanceof COMSpell
                @namespace.registerSpell item
            else if item.prototype instanceof COMNode
                @namespace.registerNode item
            # Note: register composer use INSTANCE of composer
            # The following 2 statement are for this
            else if item instanceof COMComposer
                @namespace.registerComposer item
            else if item.prototype instanceof COMComposer
                @namespace.registerComposer new item()
            else
                Logger.error "unknown inline resource",item

    addPackageStatic:(pack)->
        for Command in pack::Commands or []
            @commands.register Command
        for [key,handler] in pack::Hotkeys or []
            @hotkeys.registerCommandHotkey key,handler
        for Dec in pack::Decorations or []
            if Dec instanceof COMDecoration.DecorationMaintainer
                @namespace.registerDecoration Dec
            else if Dec.prototype instanceof COMDecoration.DecorationMaintainer
                @namespace.registerDecoration new Dec
            else
                Logger.error "Invalid decoration",Dec,"at",pack
        for Rune in pack::Runes or []
            @namespace.registerNode Rune
        for Spell in pack::Spells or []
            @namespace.registerSpell Spell
        for Element in pack::Elements or []
            @namespace.registerNode Element
        for Composer in pack::Composers or []
            if Composer instanceof COM.COMComposer
                @namespace.registerComposer Composer
            else if Composer.prototype instanceof COMComposer
                @namespace.registerComposer new Composer()
            else
                Logger.error "Invalid composer",Composer,"at",pack
        for Intent in pack::Intents or []
            COM.COMIntent.register Intent,Intent.name or Intent::name
class NextRenderAware extends Leaf.Trait
    nextRenderCallback:null
    initialize:()->
        @nextRenderCallback = SharedCallbacks.create()
        @listenBy NextRenderAware,"afterRender",()=>
            @nextRenderCallback()
    nextRender:(callback = ->)->
        @nextRenderCallback.push callback

module.exports = Editor
