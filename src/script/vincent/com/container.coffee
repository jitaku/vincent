COMNode = require "./node"
COMPath = require "./path"
Operation = require "./operation"
COMAnchor = require "./anchor"
Errors = require "./errors"
class COMContainer extends COMNode
    type:"Container"
    constructor:(@context,option = {})->
        @children = []
        super(@context,option)
        @fromJSON(option)
        # We can specified which child @el is the
        # actually container element that hold other children.
        # This is useful complicated `Rune` but not complicated enough
        # to manage children itself.
        @__defineGetter__ "domContainer",()=>
            return @cache?.domContainer or null
        @__defineSetter__ "domContainer",(domContainer)=>
            domContainer?.com = this
            return @cache.domContainer = domContainer
    onRootDispel:()->
        super()
        for child in @children
            child.root = null
    onRootAvailable:()->
        super()
        for child in @children
            child.root = @root
    setRenderContext:(rc)->
        if rc is @rc
            return
        super(rc)
        for child in @children
            child.setRenderContext rc
    cacheIndex:()->
        for item,index in @children
            item._containerIndex = index
        @_indexCached = true
        return @_indexCached
    some:(args...)->
        return @children.some args...
    every:(args...)->
        return @children.every args...
    render:(rc,option = {})->
        if not @dirty
            return
        recursive = option.recursive
        selfless = option.selfless and @el and @el.children.length > 0
        # selfless is very important
        # it means that I may not need to rerender myself.
        # 1. If selfless or
        # 2. And we are after the rearrange mark
        # Then we don't rearrange
        rearrange = not selfless or @beforeMark("rearrange")
        if rearrange
            super(rc,{force:true})
            @specifyDomContainer()
            if not @domContainer
                @domContainer = @el

            frag = document.createDocumentFragment()
        else
            super(rc)
            @specifyDomContainer()
            if not @domContainer
                @domContainer = @el
        extraAppearance = []
        for child in @children
            if child.parentAppearance?.length > 0
                for item in child.parentAppearance
                    if item not in extraAppearance
                        extraAppearance.push item
            if recursive and (child.dirty or not child.el or option.force)
                child.render(rc,option)
                child.afterRender()
            if rearrange
                if not child.el
                    Logger.error child,"has no el of",this,child.type,child._id,@type,@_id
                if child.elBefore
                    frag.appendChild child.elBefore
                frag.appendChild child.el
                if child.elAfter
                    frag.appendChild child.elAfter

        #if extraAppearance.join("") isnt @cache?.extraAppearance?.join("")
        for item in @cache?.extraAppearance or []
            @el.classList.remove item
        for item in extraAppearance
            @el.classList.add item
        @cache.extraAppearance = extraAppearance
        if rearrange
            if @domContainer isnt @el
                @domContainer.innerHTML = ""
            @domContainer.appendChild frag
    # show set @domContainer to specify element when called
    specifyDomContainer:()->
        # overwrite this method to specify your custom domContainer
        @domContainer = @el
        return
    _attach:(node)->
        if node.parent
            throw new Errors.LogicError "can't attach a node to container that is not orphan"
        node.parent = this
        node.root = @root
        @pend()
        @setRevisionMark("rearrange")
        @setRevisionMark "hasAttachedChild"
        node.listenBy this,"pend",()=>
            @pend()
    _detach:(node)->
        if node.parent isnt this
            throw new Errors.LogicError "can't detach node without being it's parent"
        node.parent = null
        node.root = null
        node.stopListenBy this
        @pend()
        @setRevisionMark "hasDetachedChild"
        @setRevisionMark("rearrange")
    last:()->
        return @children[@children.length - 1] or null
    child:(index)->
        return @children[index] or null
    indexOf:(node)->
        if node.parent isnt this
            return -1
        if @_indexCached
            return node._containerIndex
        return @children.indexOf(node)
    contains:(node)->
        for child in @children
            if child is node
                return true
        for child in @children
            if child.contains and child.contains node
                return true
        return false
    removeChild:(node)->
        if typeof node is "number"
            index = node
        else if node.parent isnt this
            return false
        else
            index = @indexOf node
        if index < 0
            return false
        return @context.operate new RemoveChildOperation @context,this,{index}
    removeChildren:(children)->
        for child in children
            @removeChild child
    insert:(index,nodes...)->
        return @context.operate new InsertOperation @context,this,{index,children:nodes}
    append:(nodes...)->
        return @context.operate new AppendChildOperation(@context,this,{children:nodes})
    empty:()->
        if @children.length is 0
            return true
        return @context.operate new EmptyOperation @context,this,{}
    clone:()->
        clone = @context.createElement @type
        for item in @children
            clone.append item.clone()
        return clone
    pend:()->
        @_indexCached = false
        super()
    compose:()->
        @cacheIndex()
        return super()
    slice:(option = {})->
        if (not option.left or option.left?.leftMost) and (not option.right or option.right.rightMost)
            return @clone()
        if option.left instanceof COMAnchor
            left = option.left
        else
            left = {leftMost:true}
        if option.right instanceof COMAnchor
            right = option.right
        else
            right = {rightMost:true}
        results = []
        for child in @children
            slice = child.slice(option)
            if not slice
                continue
            results.push slice
        if results.length is 0 and @children.length isnt 0
            return null
        isPartial = false
        for child in results
            if child.isPartial
                isPartial = true
                break
        clone = @context.createElement @type
        for item in results
            clone.append item
        clone.isPartial = isPartial
        return clone
    toPlainString:()->
        results = []
        for item in @children
            results.push item.toPlainString()
        return results.join("")
    toHumanString:()->
        results = []
        for item in @children
            results.push item.toHumanString()
        return results.join("")
    toJSON:()->
        result = super()
        result.children = (item.toJSON() for item in @children).filter((item)->item)
        if result.children.length is 0
            delete result.children
        return result
    fromJSON:(option)->
        if option.children and option.children.length > 0
            @empty()
            for child in option.children

                if not child
                    continue
                node = @context.createElement child
                if node
                    @append node
                else
                    Logger.error "invalid json",child
# COM namespace for different markin node
class AppendChildOperation extends Operation.TreeOperation
    name:"AppendChildOperation"
    invoke:()->
        target = @target or @context.root.getChildByPath(@path)
        if target not instanceof COMContainer
            @error "require a Container node to perform the action"
            return false
        if not @option.children
            @error "request children to append"
            return false
        @option.at = target.children.length
        for child in @option.children
            child = child instanceof COMNode and child or @context.createElement(child)
            target.children.push child
            target._attach child
        return true
    revoke:()->
        target = @target or @context.root.getChildByPath(@path)
        if target not instanceof COMContainer
            @error "require a Container node to perform the action"
            return false
        if @option.at + @option.children.length isnt target.children.length
            @error "revoke with target of children length #{target.children.length} does't match the invoke result"
            return false
        result = target.children.splice(@option.at,@option.children.length)
        for child in result
            target._detach child
class EmptyOperation extends Operation.TreeOperation
    name:"EmptyOperation"
    invoke:()->
        target = @target or @context.root.getChildByPath(@path)
        if target not instanceof COMContainer
            @error "require a Container node to perform the action"
            return false
        @option.children = target.children.slice()
        target.children.length = 0
        for item in @option.children
            target._detach item
        return true
    revoke:()->
        target = @target or @context.root.getChildByPath(@path)
        if target not instanceof COMContainer
            @error "require a Container node to perform the action"
            return false
        if target.children.length isnt 0
            @error "revoke with container chidlren.length #{target.children.length} isnt 0"
        for item in @option.children
            target.children.push item
            target._attach item
        return true
class InsertOperation extends Operation.TreeOperation
    name:"InsertOperation"
    invoke:()->
        if not @option.children or not (@option.children.length > 0)
            @error "insert without children provided"
        target = @target or @context.root.getChildByPath(@path)
        if target not instanceof COMContainer
            @error "require a Container node to perform the action"
            return false
        if target.children.length < @option.index
            @error "container children.length is #{target.children.length} less than the insert index #{@option.index}"
            return false
        insertion = @option.children.map (item)=>
            if item instanceof COMNode
                return item
            return @context.createElement item
        target.children.splice @option.index,0,insertion...
        for item in insertion
            target._attach item
        return true
    revoke:()->
        target = @target or @context.root.getChildByPath(@path)
        if target not instanceof COMContainer
            @error "require a Container node to perform the action"
            return false
        children = target.children.splice(@option.index,@option.children.length)
        for child in children
            target._detach child
        return true

class RemoveChildOperation extends Operation.TreeOperation
    name:"RemoveChildOperation"
    invoke:()->
        if not @option.length
            @option.length = 1
        target = @target or @context.root.getChildByPath(@path)
        if target not instanceof COMContainer
            @error "require a Container node to perform the action"
            return false
        if target.children.length <= @option.index
            @error "container children.length is #{target.children.length} less than the required index #{@option.index}"
            return false
        @option.children = target.children.splice(@option.index,@option.length)
        for child in @option.children
            target._detach child
        return true
    revoke:()->
        target = @target or @context.root.getChildByPath(@path)
        if target not instanceof COMContainer
            @error "require a Container node to perform the action"
            return false
        if target.children.length < @option.index
            @error "revoke container children.length is #{target.children.length} less than the required index #{@option.index}"
            return false
        target.children.splice(@option.index,0,@option.children...)
        for child in @option.children
            target._attach child
        return true
module.exports = COMContainer
