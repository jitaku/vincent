class Walker
    constructor:(@context)->
        @MAX = 1000 * 100
        @top = @context.root
        @node = @context.root
    setTop:(@top)->
    setNode:(@node)->
    stepIn:()->
        if @node.children?[0]
            @node = @node.children[0]
            return true
        return false
    stepOver:()->
        node = @node.next()
        if node
            @node = node
            return true
        return false
    stepBack:()->
        node = @node.previous()
        if node
            @node = node
            return true
        return false
    stepOut:()->
        if @top and @node is @top
            return false
        if @node.parent
            @node = @node.parent
            return true
        return false
class WalkerRootFirst
    constructor:(@context)->
        @MAX = 1000 * 100
        @top = @context.root
    isTop:()->
        return @node.isRoot
    setNode:(@node)->
    setTop:(@top)->
    next:(judge = ()->return true)->
        counter = 0
        while true
            counter++
            if counter > @MAX
                throw new Error "like to be recursive walking! walked node exceed max #{@MAX}"
            # first go into children
            if @node.children and @node.children.length > 0 and @node.child and not @skipChildOnce
                @node = @node.child(0)
                if judge @node
                    return true
                continue
            @skipChildOnce = false
            if @top and @node is @top
                @skipBrotherOnce = false
                return false

            # try go next
            next = @node.next()
            if next and not @skipBrotherOnce
                @node = next
                if judge @node
                    return true
                continue
            @skipBrotherOnce = false
            # try go out
            node = @node
            while true
                parent = node.parent
                if not parent or parent is @top
                    return false
                pnext = parent.next()
                if pnext
                    @node = pnext
                    if judge @node
                        return true
                    break
                node = parent
            continue
    previous:(judge = ()->return true)->
        # first go into children
        while true
            if @node.children and @node.children.length > 0 and @node.last() and not @skipChildOnce
                @node = @node.last()
                if judge @node
                    return true
                continue

            @skipChildOnce = false
            # try go previous

            # don't go brother
            if @top and @node is @top
                @skipBrotherOnce = false
                return false
            previous = @node.previous()
            if previous and not @skipBrotherOnce
                @node = previous
                if judge @node
                    return true
                continue
            @skipBrotherOnce = false
            # try go out
            node = @node
            while true
                parent = node.parent
                if not parent or parent is @top
                    return false
                pprevious = parent.previous()
                if pprevious
                    @node = pprevious
                    if judge @node
                        return true
                    break
                node = parent
            continue
    last:(judge = ()-> return true)->
        @setNode @top or @context.root
        return @previous judge
    first:(judge = ()-> return true)->
        @setNode @top or @context.root
        return @next judge
module.exports = Walker
module.exports.WalkerRootFirst = WalkerRootFirst
