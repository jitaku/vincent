class COMPath
    @fromNode = (node)->
        routes = []
        while node.parent
            routes.push node.parent.indexOf(node)
            node = node.parent
        path = new COMPath({type:"COMPath",routes})
        path.anchor = node.anchor?.toJSON?() or null
        return path
    type:"COMPath"
    constructor:(node = {})->
        if node.leftMost
            @leftMost = true
        else if node.rightMost
            @rightMost = true
        @routes = []
        if node.isCOMObject
            while node.parent
                @routes.push node.parent.indexOf(node)
                node = node.parent
            if node.anchor
                @anchor = node.anchor.toJSON?() or null
        else if node instanceof COMPath
            @routes = node.getRoutes()
            @anchor = node.anchor
        else if node.type is "COMPath"
            @routes = node.routes or []
            @anchor = node.anchor or null
        else
            @routes = []
            @anchor = null
    getRoutes:()->
        return @routes.slice()
    toJSON:()->
        return {
            routes:@routes
            type:"COMPath"
            @leftMost
            @rightMost
        }
    compare:(b)->
        if @leftMost
            if b.leftMost
                return "identical"
            else
                return "before"
        else if @rightMost
            if b.rightMost
                return "identical"
            else
                return "after"
        a = this
        if a is b
            return "identical"
        pa = a.getRoutes()
        pb = b.getRoutes()
        while typeof (asub = pa.pop()) is "number"
            bsub = pb.pop()
            if asub is bsub
                continue
            else if typeof bsub isnt "number"
                # a deeper thab b
                # b contains a
                return "under"
            else if asub > bsub
                return "after"
            else if asub < bsub
                return "before"
        if typeof pb.pop() is "number"
            return "contain"
        return "identical"
module.exports = COMPath
