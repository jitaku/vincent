Errors = require "./errors"
EventEmitter = (require "./events").EventEmitter
COMPath = require "./path"
# Every COMNode hold one corresponding DOMElement
# The el DOMElement may contains child.
class COMNode extends EventEmitter
    @index = 1000
    type:"Node"
    constructor:(@context)->
        super()
        @composerBuffer = {}
        @_id = COMNode.index++
        @id = @_id
        @type = @type
        # Node revision, auto increase upon node modification.
        @rev = 0
        @revisionMarks = {}
        @parent = null
        @appearance ?= {}
        @appearance.tagName ?= "div"
        @appearance.classList ?= ["com"]
        @parentAppearance = []
        # If a node is shadow, Root.toJSON should ignore it.
        @isCOMObject = true
        @pend()
        @__defineGetter__ "dirty",()=>
            if not @cache
                return false
            return @cache?.rev isnt @rev or false
        @__defineSetter__ "dirty",(v)=>
            if v
                @rev += 1
                if @parent
                    @parent.dirty = true
            else
                @cache?.rev = @rev
        @__defineGetter__ "el",()=>
            return @cache?.el or null
        @__defineSetter__ "el",(el)=>
            el?.com = this
            #if @cache.el
            #    @cache.el.com = null
            return @cache.el = el
        # elAfter/elBefore is the shadow element placed after or before the actual element.
        # It is used for some special purpose such as Image placeholder when set left/right
        # align.
        @__defineGetter__ "elAfter",()=>
            return @cache?.elAfter or null
        @__defineSetter__ "elAfter",(elAfter)=>
            elAfter?.com = this
            return @cache.elAfter = elAfter
        @__defineGetter__ "elBefore",()=>
            return @cache?.elBefore or null
        @__defineSetter__ "elBefore",(elBefore)=>
            elBefore?.com = this
            return @cache.elBefore = elBefore
        @__defineGetter__ "root",()=>
            return @_root or null
        @__defineSetter__ "root",(root)=>
            old = @_root
            @_root = root
            if (not old or not old.withContext) and root and root.withContext
                @onRootAvailable?()
                @emit "rootAvailable"
            else if not root and old and old.withContext
                @onRootDispel?()
                @emit "rootDispel"
        @commands = {}
        @anchors = []
    setRevisionMark:(mark)->
        # Mark is used to determine if the current render is before/after
        # certain COM action. For example, Container my have a child add or remove.
        # Under this situation a force rerender of container is required, thus
        # we use a mark to indicate the revision that this COM operation happens.
        # Every renderContext before this revision requires the rerender completely.
        #
        # For example @setRevisionMark("rearrange") will mark the rearrange to current revision
        # Then next time when we decide to render, and we find the rendered revision is less
        # then the revisionMarks of "rearrange", we may need to rerender it.
        @revisionMarks[mark] = @rev
    beforeMark:(mark)->
        if not @cache?.rev
            return true
        return @cache.rev < @revisionMarks[mark]
    setRenderContext:(rc)->
        # A context can be rendered to multi interface(Like mirror view).
        # So we should switch to different RenderContext.
        # RenderContext holds the render cache or result, HEMLElements, for example.
        @rc = rc
        @cache = @rc.cache(@id)
    sortOf:(type)->
        # If the node is a certain `type` of Node or a subclass of it
        return @context.namespace.sortOf this,type
    exec:(name,params...)->
        return @commands[name]?(params...)
    registerCommand:(name,fn)->
        return @commands[name] = fn
    getPath:()->
        return COMPath.fromNode this
    customBaseRender:()->
        # Custom render that return true will overwrite the default render behavior
        # In custom render you should
        # 1. specify the @el
        # 2. return true if did so.
        return false
    afterRender:()->
        # After render is done, set the
        @cache.rev = @rev
    render:(rc,option = {})->
        if @el and not option.force
            @el.com = this
            return
        _el = @el
        if @customBaseRender()
            @el.com = this
            return true
        else
            @el = document.createElement @appearance.tagName or "div"
            @appearance.classList.filter((item)->item).map (name)=>
                if name
                    @el.classList.add name
        if _el and _el.parentElement
            _el.parentElement.replaceChild @el,_el
        @el.com = this
    before:(node)->
        if not @parent
            return
        index = @parent.indexOf(this)
        @parent.insert index,node
    after:(node)->
        if not @parent
            return
        index = @parent.indexOf(this)
        @parent.insert index + 1,node
    previous:(count = 1)->
        if not @parent
            return null
        if count is 0
            return this
        if not count
            return null
        index = @parent.indexOf(this)
        index -= count
        if index >= 0
            return @parent.child(index)
        return null
    replaceBy:(node)->
        if not @parent
            throw new Errors.LogicError "can't replace orphan node"
        parent = @parent
        if node.parent
            node.parent.removeChild(node)
        index = parent.indexOf this
        parent.insert index,node
        parent.removeChild this
    next:(count = 1)->
        if not @parent
            return null
        if count is 0
            return this
        if not count
            return null
        index = @parent.indexOf(this)
        index += count
        if index < @parent.children.length
            return @parent.child(index)
        return null
    remove:()->
        if @parent
            @parent.removeChild(this)
    toJSON:()->
        result = {}
#        data = @data or {}
#        for prop of data
#            if data.hasOwnProperty prop
#                result[prop] = data[prop]
        result.type = @type or "Void"
        return result
    compose:()->
        if @context.namespace.compose this
            return true
        @acknowledge?()
        return false
    onRootDispel:()->
        # Should be invoked when
        @context.handleNodeDetach(this)
    onRootAvailable:()->
        @context.requestCompose(this)
        if @root.rc
            @setRenderContext @root.rc
        @context.handleNodeAttach(this)
    forceChange:()->
        @context.forceChange()
    pend:()->
        @dirty = true
        if @root
            @context.requestCompose(this)
        @composerBuffer = {}
        @emit "pend"
    acknowledge:()->
        return false
    slice:(option = {})->
        # Create a slice of the node(includes it's children).
        return @clone()
    clone:()->
        # Create a deep clone of the node
        result = @context.createElement @type,@toJSON()
        result.isPartial = false
        return result
    compareNodePosition:(b)->
        if not @parent and not @isRoot
            return null
        return @getPath().compare(b.getPath())
    toHumanString:()->
        return ""
    toPlainString:()->
        return @toHumanString()
    transactTrigger:(args...)->
        # trigger the element and run the compose after that.
        if not @trigger
            return false
        result = false
        @context.transact ()=>
            result = @trigger(args...)
        return result
    toMarkdown:()->
        return @toHumanString()
module.exports = COMNode
