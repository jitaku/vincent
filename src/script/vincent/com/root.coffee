COMComposer = require "./composer"
COMContainer = require "./container"
class COMRoot extends COMContainer
    type:"Root"
    constructor:(@context,@data)->
        @appearance = {
            tagName:"div"
            classList:["com","com-root"]
        }
        @withContext = @data?.withContext or false
        @isRoot = true
        super(@context)
        @pend()
        @root = this
        @fromJSON(@data)
    pend:()->
        super()
    contains:(node)->
        return Util.topLevel(node) is this
    getChildByPath:(path = null)->
        if not path
            return null
        routes = path.getRoutes()
        if routes.length is 0
            return this
        routes = routes.slice(0)
        node = this
        while true
            if routes.length is 0
                return node
            index = routes.pop()
            if node and node.children and node.children[index]
                node = node.children[index]
                continue
            else
                return null
    render:(rc)->
        super(rc,{recursive:true,selfless:true})
        rc.el = @el
        #@el.contenteditable = true
        #@el.setAttribute "contenteditable","true"
        #@el.setAttribute "spellcheck","false"
        @afterRender()
        if not @rc.interactive
            @el.classList.add "readonly"
        else
            @el.classList.remove "readonly"
    _attach:(node)->
        super(node)
        node.root = this
    toJSON:(option)->
        json = super(option)
        if not json
            return null
        json.type = "Root"
        return json
    fromJSON:(json = {})->
        if json.type isnt "Root"
            return
        result = super(json)
        return result
class RootAvoidEmpty extends COMComposer
    type:"Root"
    exec:()->
        if @target.children?.length > 0
            return false
        ct = @context.createElement "Contents",{children:[@context.createElement("RichText",{contentString:""})]}
        @target.append ct
        return true
COMRoot.RootAvoidEmpty = RootAvoidEmpty
module.exports = COMRoot
