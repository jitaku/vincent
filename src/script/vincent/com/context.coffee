COMRoot = require "./root"
COMNode = require "./node"
COMContainer = require "./container"
COMContents = require "./contents"
COMCursor = require "./cursor"
COMNamespace = require "./namespace"
COMRichText = require "./richText"
COMRune = require "./rune"
COMSpell = require "./spell"
COMUnknownRune = require "./unknownRune"
COMText = require "./text"
Walker = require "./helper/walker"
EventEmitter = (require "./events").EventEmitter
Errors = require "./errors"
COMRuneCache = require "./runeCache"
Compressor = require "./helper/compressor"
COMIntent = require "./intent"
SharedCallbacks = require "./helper/sharedCallbacks"
Trait = require "./helper/trait"

# RenderContext hold the required information for each render target
class RenderContext extends EventEmitter
    constructor:(@context,@id)->
        super()
        @caches = {}
        @interactive = true
        # Some render specified config such as minimum image width
        @renderConfig = {}
        # Supported Events
        # "resize": When something changed in the context, we may need to update caret.
    destroy:()->
        @emit "destroy"
        @caches = null
    cache:(id)->
        if not @caches[id]
            @caches[id] = {}
        return @caches[id]
    staticize:()->
        contents = @context.root.children[0]
        container = contents.el
        for child in contents.children
            el = child.el
            [l,t] = [el.offsetLeft,el.offsetTop]
            child.position = {l,t}
        for child,index in contents.children
            child.el.style.position = "absolute"
            child.el.style.left = "0"
            child.el.style.top = "0"
            child.el.style.transform = "translateX(#{child.position.l}px) translateY(#{child.position.t}px)"
            if index < 500
                child.el.style.display = "none"
                child.el.parentElement.removeChild child.el
class IntentCapable extends Trait
    Intent:COMIntent
    getConstructor:(name)->
        return @namespace.creators[name].creator
    createIntent:(name,args...)->
        Intent = @Intent.Intents[name]
        if not Intent
            return null
        return new Intent @context,args...
    castIntent:(intent,args...)->
        if intent instanceof COMIntent
            @emit "intent",intent
            return true
        result = @createIntent(intent,args...)
        if not result
            Logger.error "Intent not found:",intent
            return false
        @emit "intent",result
        return true

class COMContext extends EventEmitter
    @namespace = new COMNamespace()
    @index = 0
    constructor:(option = {})->
        super()
        new IntentCapable(this)
        new RenderableTrait(this)
        new PropertyTrait(this)
        new NestedContextTrait(this)
        new CursorManagerTrait(this)
        new MetaManagerTrait(this)
        new PluginStorageCapable(this)
        new FacilityAttachable(this)
        new ComposableTrait(this)
        new NodeAttachableTrait(this)
        # This is an experienmetal technology that make
        # rendering/composing split into small piece and thus
        # behaved like async. This make UI responsive but not making any change
        @enableAsync = false
        @namespace = option.namespace or COMContext.namespace.clone()
        @runeCache = new COMRuneCache(this)
        @root = @createElement "Root",{withContext:true}
        @id = (COMContext.index++).toString()
        @__defineGetter__ "locked",()=>
            return @composeContext.isComposing
        @__defineGetter__ "isSelfReadly",()=>
            return @_isReadonly
        @__defineGetter__ "isReadonly",()=>
            return @_isReadonly or @parent?.isReadonly
        @__defineSetter__ "isReadonly",(v)=>
            @_isReadonly = v
            @emit "readonly",@_isReadonly
        @define "title"
        @define "type"
        @define "ownerName"
        # Note name can be a complex object indicate that this note is not
        # a normal note. (Such as inline note)
        @define "noteName"
        @namespace.initContext this
    fromJSON:(json)->
        ro = @isReadonly
        @isReadonly = false
        @root.fromJSON json.content
        @revision = json.revision or 1
        if json.pluginStorage
            for prop,value of json.pluginStorage
                @setPluginData prop,value
        # ~~no longer compose when from JSON~~ enable it again.

        @compose()
        @isReadonly = ro
        return this
    toJSON:()->
        if @_jsonHistory and @revision is @_jsonHistory.revision
            return @_jsonHistory
        @_jsonHistory = json = {
            content:@root.toJSON()
            revision:@revision
        }
        for prop,value of @metas
            if value?.toJSON
                value = value.toJSON()
            json[prop] = value
        if @pluginStorage
            json.pluginStorage = @getPluginStorageJSON()
        json.humanString = @toHumanString()
        # trim first title
        json.digest = json.humanString?.slice(0,1000).replace(/(^|\n)#{1,6}\s+.*/,"").trim() or ""
        return json
    toHumanString:()->
        if @_humanStringRevision is @revision
            return @_humanStringCache
        else
            @_humanStringCache = @root?.toHumanString() or ""
            @_humanStringRevision = @revision
            return @_humanStringCache
    createElement:(name,args...)->
        if name instanceof COMNode
            return name.clone()
        else if typeof name.type is "string"
            # @createElement {type:"Text",contentString:"abc"}
            return @namespace.create this,name.type,name
        else if typeof name is "string"
            # @createElement "Text",{contentString:"abc"}
            return @namespace.create this,name,args...
        return null
    forceChange:()->
        @revision += 1
        @emit "change"
class NodeAttachableTrait extends Trait
    handleNodeAttach:(node)->
    handleNodeDetach:(node)->
class PropertyTrait extends Trait
    waitPropertyAvailables:[]
    property:{}
    getWhenAvailable:(name,callback)->
        if @property[name]
            callback null,@property[name]
            return
        @waitPropertyAvailables.push {name,callback}
    getAndListenBy:(who,name,callback)->
        @listenBy who,"property/#{name}",callback
        if @property[name]
            callback @property[name]
    define:()->
        # Keep interface consist with
        # component/properties.coffee
        # `define` only for documentation purpose now
    get:(name)->
        return @property[name]
    set:(name,value)->
        @property[name] = value
        @emit "property",name,value
        @emit "property/#{name}",value
        @waitPropertyAvailables = @waitPropertyAvailables.filter (item)->
            if item.name is name
                item.callback null,value
                return false
            return true
        return

class RenderableTrait extends Trait
    renderContexts:{}
    defaultRenderContext:null
    initialize:()->
        @defaultRenderContext = @allocateRenderContext()
    allocateRenderContext:()->
        @renderContextOffset ?= 0
        id =  @id * 10000 + @renderContextOffset++
        @renderContexts[id] = new RenderContext(this,id)
        return @renderContexts[id]
    destroyRenderContext:(rc)->
        if rc.context isnt this
            Logger.error "destroy context not belongs to current context",rc
            return
        rc.destroy()
        @renderContexts[rc.id] = null
    setRenderContext:(rc)->
        @currentRenderContext = rc
        @root.setRenderContext rc
    render:(rc = @defaultRenderContext,option = {})->
        @setRenderContext rc
        if not @root.dirty
            return
        return @root.render(rc,option)

class NestedContextTrait extends Trait
    children:[]
    parent:null
    addChild:(context)->
        if context.parent is this
            return true
        if context.parent
            return false
        context.parent = this
        @children.push context
    removeChild:(context)->
        if context.parent isnt this
            return false
        @children = @children.filter (item)-> item is context
        context.parent = null
        return true

class CursorManagerTrait extends Trait
    cursors:{}
    createCursor:(option)->
        cursor = new COMCursor this,option
        @cursors[cursor.id] = cursor
        cursor.listenBy this,"destroyed",()=>
            cursor.stopListenBy this
            delete @cursors[cursor.id]
        return cursor
    removeCursor:(cursor)->
        delete @cursors[cursor.id]
    getCursorsJSON:()->
        cursors = {}
        for id,cursor of @cursors
            cursors[id] = cursor.toJSON()
        return cursors
    pointIdenticalCursors:(cursor,node,option)->
        cursor.captureIdenticalCursors()
        cursor.pointAt node,option
        cursor.transportIdenticalCursors()
    pointIdenticalCursorsAnchor:(cursor,anchor)->
        cursor.captureIdenticalCursors()
        cursor.pointAtAnchor anchor
        cursor.transportIdenticalCursors()
    ensureCursorValid:()->
        # Somebugs may appear when some cursor may point at
        # somewhere not attached to root, make this kind cursor invalid.
        # In this case we move the cursor to begin of the document.
        for id,cursor of @cursors
            if not cursor.anchor or not cursor.anchor.node.root
                cursor.emit("invalid")
                if @cursors[cursor.id] is cursor
                    cursor.begin()
            else
                cursor.conduct "applyTailBoundary"

# Note:
# props on meta are directly set on JSON of the note.toJSON()
# when saving to backend. That is any meta attribute that need to be persisted
# should explicity handled in backend server.
# We may have a facility "PluginStorage" for storing arbitary data.
class MetaManagerTrait extends Trait
    metas:{}
    setMeta:(prop,value)->
        if @metas[prop] is value
            return
        if not Leaf.Util.compare @metas[prop],value
            @metas[prop] = value
            change = {}
            change[prop] = value
            @emit "change/meta/#{prop}",value
            @emit "change/meta",change
            @emit "change"
class PluginStorageCapable extends Trait
    pluginStorage:{}
    setPluginData:(key,value)->
        if @pluginStorage[key] is value
            return
        if not Leaf.Util.compare @pluginStorage[key],value
            @pluginStorage[key] = value
            @emit "pluginStorage/#{key}",value
            @emit "change"
    getPluginData:(key)->
        return @pluginStorage[key]
    getPluginStorageJSON:()->
        json = {}
        for prop,value of @pluginStorage
            if value?.toJSON
                json[prop] = value.toJSON()
            else
                json[prop] = value
        return json

# Packages can attach usefull evironment related tools to a context
# So the custom element or runes can use them.
class FacilityAttachable extends Trait
    facilities:{}

class ComposableTrait extends Trait
    composeOperations:[]
    seedOperations:[]
    nextComposeCallback:[]
    initialize:()->
        @composeContext = new ComposeContext(this)
        @history = new OperationHistory(this)
        @checkPointProvider = new CheckPointProvider(this)
        @nextComposeCallback = SharedCallbacks.create()
    operate:(operation)->
        if @isReadonly
            @emit "editAttempt"
            return false
        if operation.invoke()
            # Before the context utils comes out
            # I may use my own context to create some digest of a sub note
            # or something. This sort of operation is not a change to the context
            # tree, thus won't add operation in to history.
            # If I missing something here, they will eventually be add to root.
            # So I guess it's OK.
            if operation.target?.root is @root
                if @composeContext.isComposing
                    @composeOperations.push operation
                else
                    @seedOperations.push operation
                @emit "operate",operation
            return true
        return false
    nextCompose:(handler)->
        if not @isComposing and not @composeContext.requireCompose
            handler()
        else
            @nextComposeCallback.push handler
    try:(fn,debug)->
        if debug
            fn()
            return null
        else
            try fn()
            catch e
                return e
            return null
    transact:(executer)->
        returnValue = null
        e =  @try ()=>
            transaction = @isTransaction
            if not @isTransaction
                if not @history.isRedoing()
                    # If we are in redo session, we should already AT
                    # a check-point.
                    @history.addCheckPoint()
            @isTransaction = true
            result = executer()
            @isTransaction = transaction
            # Recursive transact done,
            #
            if not @isTransaction
                returnValue =  @compose()
                if not @isComposing and not @requireCompose
                    @runeCache.gc()
        ,window?.isDebug
        if e
            Logger.error "error occurs during COMContext transaction",e
        return returnValue
    compose:()->
        @isComposing = true
        start = Date.now()
        if @seedOperations.length > 0
            @history.addSeedRecord @seedOperations.slice()
            @seedOperations.length = 0
            hasInput = true
            @emit "hasInput"
        @composeOperations.length = 0
        composeFinish = ()=>
            if @composeOperations.length > 0
                try
                    @history.addComposeRecord @composeOperations.slice()
                catch e
                    if e.type is "multiCompose"
                        Logger.error e,"multiCompose"
                    else if e.type is "impossibleCompose"
                        Logger.error e,"impossibleCompose"
                    else
                        Logger.error e,"unkown compose"
                hasCompose = true
                @emit "hasCompose"
            SLOW_COMPOSE = 100
            SLOW_COMPOSE = 10
            endCompose = Date.now()
            if endCompose - start > SLOW_COMPOSE
                Logger.debug "SLOW_COMPOSE",endCompose - start,"ms",">",SLOW_COMPOSE,"ms"
            @ensureCursorValid()
            @isComposing = false
            @revision ?= 0
            if hasInput or hasCompose
                @revision += 1
            # FIXME: For now just add history no matter what
            # If the behavior is better than I will clean this up.
            if @checkPointProvider.consume() or true
                @history.addCheckPoint()
            @emit "composeEnd",{hasInput,hasCompose}
            if hasInput or hasCompose
                @emit "change"
            @nextComposeCallback()
        if @enableAsync
            @composeContext.composeAsync ()=>
                composeFinish()
        else
            @composeContext.compose()
            composeFinish()
    requestCompose:(who)->
        if who.context isnt this
            return
        @composeContext.add who

class CheckPointProvider
    constructor:(@context)->
        @value = 0
        @context.on "operate",()=>
            @value += 3
        @context.on "hasInput",()=>
            @value += 1
        @context.on "hasCompose",()=>
            @value += 10
        @threshold = 10
    consume:()->
        # Should I add a check point?
        if @value > @threshold
            @value = 0
            return true
        return false

class OperationHistory
    constructor:(@context)->
        @stack = []
        @index = -1
        @maxHistoryStep = 1000
        @checkPointCount = 0
        @overflowStepDeletion = 10
        # S: SeedOperationRecord
        # C: ComposeOperationRecord
        # A seed record may cause several compose operation.
        # State between "S"&"C" and "C"&"S" are unstable.
        # Only state just before "S" are stable. So we allow to add
        # check point unless we are just finish the composing.
        #
        # Add check point at each "S" is not a good idea.
        # That's why we provide `CheckPoint` not simply always consider
        # the "S" state as check point.
        #
        # "C" or "S" usuall contains series of operation.
    last:()->
        return @stack[@stack.length - 1] or null
    current:()->
        return @stack[@index] or null
    addSeedRecord:(operations)->
        @index += 1
        @stack.length = @index
        @stack.push {
            operations
            type:"Seed"
        }
    addComposeRecord:(operations)->
        last = @last()
        if last?.type is "Compose"
            throw new Errors.LogicError "continuous composing record",{type:"multiCompose"}
        else if last?.type is "CheckPoint"
            @debug()
            throw new Errors.LogicError "composing next to check point",{type:"impossibleCompose",records:operations}
        @index++
        @stack.length = @index
        @stack.push {
            operations
            type:"Compose"
        }
    addCheckPoint:()->
        # don't allow add check point at redo session
        if @isRedoing()
            return false
        @context.nextCompose ()=>
            @_addCheckPoint()
    enableCheckPoint:()->
        @isCheckPointDisabled = false
    disableCheckPoint:()->
        @isCheckPointDisabled = true
    isRedoing:()->
        @index isnt @stack.length - 1
    _addCheckPoint:(option = {})->
        if @isCheckPointDisabled
            return
        @index++
        @stack.length = @index
        if @stack[@index - 1]?.type is "CheckPoint"
            @stack.pop()
            @checkPointCount -= 1
            @index--
        @stack.push {
            type:"CheckPoint"
            cursors:@context.getCursorsJSON()
            time:Date.now()
        }
        @checkPointCount += 1
        # remove until checkPoint count
        if @checkPointCount > @maxHistoryStep
            counter = @overflowStepDeletion
            for item,index in @stack
                if item.type is "CheckPoint"
                    if counter > 0
                        counter -= 1
                        continue
                    else
                        targetIndex = index
                        break
                else
                    continue
            if not targetIndex
                return
            else
                @stack.splice(0,targetIndex)
                @index -= targetIndex
                @checkPointCount -= @overflowStepDeletion
    backward:()->
        if @current()?.type isnt "CheckPoint"
            @addCheckPoint()
        records = []
        while true
            if @index is 0
                break
            if @index > 0
                @index -= 1
            if @current().type is "CheckPoint"
                break
            records.push @current()
        if records.length is 0
            return false
        records.reverse()
        ops = []
        records.forEach (record)->
            ops.push record.operations...
        for op in ops by -1
            op.revoke()
        for id,json of @current().cursors or {}
            @context.cursors[id]?.setByJSON(json)
        return true
    forward:(n)->
        # assume we always start with a check point or -1
        records = []
        if @index is @stack.length - 1
            return false
        while true
            if @index is @stack.length - 1
                break
            if @index >= @stack.length
                break
            @index += 1
            if @current().type is "CheckPoint"
                break
            records.push @current()
        if records.length is 0
            return false
        ops = []
        records.forEach (record)->
            ops.push record.operations...
        for op in ops
            op.invoke()
        for id,json of @current().cursors or {}
            @context.cursors[id]?.setByJSON(json)
        return true
    fromNow:()->
        @stack.length = 0
        @index = -1
        @addCheckPoint()
    describe:()->
        return @stack.slice().map (item)->"#{item.type}.#{(item.operations?.map (o)->o.describe())?.join('|') or "nil"}"
    debug:()->
        infos = @stack.map (item)->
            if item.type is "Seed"
                return "S"
            else if item.type is "Compose"
                return "C"
            else
                return "CP:#{JSON.stringify(item.cursors)}"

class ComposeContext
    constructor:()->
        @queue = []
        @counter = 0
        @composeInterval = 30
        @requireCompose = false
    add:(target)->
        if target._requireCompose
            return false
        target._requireCompose = true
        @requireCompose = true
        @queue.push target
    next:()->
        if @queue.length is 0
            return false
        target = @queue.shift()
        # set requireCompose before actually run compose
        # this enables recursive composing himself
        # Say I merge the element of my next,
        # then I'm done. But another composer of me
        # think my new content might have some new composing job.
        target._requireCompose = false
        @previousComposeTarget = target
        if target.root and target.root.withContext and target.compose()
            return true
        return true
    composeAsync:(callback = ()->)->
        if not @requireCompose
            @composeStartDate = null
            return false
        if @isComposing
            return
        @composeStartDate = Date.now()
        @isComposing = true
        @totalComposeCount = 0
        @asyncInterval = 0
        @asyncHasCompose = false
        @asyncComposeCallback = callback
        @_composeChunk()
    _composeChunk:()->
        counter = 0
        MAX_COMPOSE = 200000
        DANGER_COMPOSE = 10000
        chunkCheck = 500
        chunkTime = 200
        start = Date.now()
        while notYet = @next()
            @totalComposeCount += 1
            counter += 1
            if @totalComposeCount > DANGER_COMPOSE
                debugger
            if @totalComposeCount > MAX_COMPOSE
                throw new Error "MAX COMPOSE EXCEED #{MAX_COMPOSE}"
            @asyncHasCompose = true
            if counter > chunkCheck
                counter = 0
                if Date.now() - start > chunkTime
                    break
        if notYet
            setTimeout ()=>
                @_composeChunk()
            ,@asyncInterval
            return
        @requireCompose = false
        @isComposing = false
        callback = @asyncComposeCallback
        @asyncComposeCallback = null
        callback(@asyncHasCompose)
        return
    compose:()->
        if not @requireCompose
            @composeStartDate = null
            return false
        if @isComposing
            return
        @composeStartDate = Date.now()
        @isComposing = true
        hasCompose = false
        counter = 0
        debug = false
        MAX_COMPOSE = 1000 * 100
        DANGER_COMPOSE = 10 * 1000
        if debug
            MAX_COMPOSE /= 100
            DANGER_COMPOSE /= 10
        RECORD = DANGER_COMPOSE - 100

        while @next()
            counter += 1
            if counter > RECORD and counter < DANGER_COMPOSE
                window.DANGER_LOG = (args...)->
                    Logger.error args...
                target = @previousComposeTarget
                @_composeDebugTrunk ?= []
                @_composeDebugTrunk.push target
            if counter > DANGER_COMPOSE
                debugger
            if counter > MAX_COMPOSE
                debugger
                throw new Error "MAX COMPOSE EXCEED #{MAX_COMPOSE}"
            hasCompose = true
        @requireCompose = false
        @isComposing = false
        @counter++
        return hasCompose



COMContext.namespace.registerNode COMText
COMContext.namespace.registerNode COMSpell
COMContext.namespace.registerNode COMRichText
COMContext.namespace.registerNode COMNode
COMContext.namespace.registerNode COMContainer
COMContext.namespace.registerNode COMRoot
COMContext.namespace.registerNode COMRune
COMContext.namespace.registerNode COMContents
COMContext.namespace.registerNode COMUnknownRune
COMContext.namespace.registerComposer new COMContents.ContentsAvoidEmpty
COMContext.namespace.registerComposer new COMContents.NormalizeRichTexts
COMContext.namespace.registerComposer new COMContents.MergeByComposePolicy
COMContext.namespace.registerComposer new COMRoot.RootAvoidEmpty

module.exports = COMContext
