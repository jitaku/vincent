EventEmitter = (require "../events").EventEmitter
class COMNodeList extends EventEmitter
    constructor:()->
        super()
        @nodes = []
        @__defineGetter__ "length",()=>
            return @nodes.length
    add:(nodes...)->
        change = false
        for node in nodes
            if node not in @nodes
                do (node)=>
                    @nodes.push node
                    change = true
                    node.stopListenBy this
                    node.listenBy this,"pend",()=>
                        @emit "pend",node
        if change
            @emit "change"
    remove:(nodes...)->
        change = false
        @nodes = @nodes.filter (item)->
            if item in nodes
                change = true
                item.stopListenBy this
                return false
            return true
        if change
            @emit "change"
    at:(index)->
        return @nodes[index]
    first:()->
        return @nodes[0] or null
    sort:()->
        @nodes.sort (a,b)->
            position = a.compareNodePosition(b)
            if position in ["under","contain","identical"]
                return 0
            else if position is "before"
                return -1
            else
                return 1
    toArray:()->
        return @nodes.slice()
module.exports = COMNodeList
