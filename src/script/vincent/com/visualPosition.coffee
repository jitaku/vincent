class COMVisualPosition
    constructor:(option = {})->
        @left = option.left or null
        @right = option.right or null
        @center = option.center or null
        @priority = "right"
        pl = @left?.priority or  0
        pr = @right?.priority or 0
        if pl > pr
            @priority = "left"
        return

class COMVisualBorder
    constructor:(option)->
        @node = option.node or null
        @offset = option.offset or 0
        # position in ["left","right","contain"]
        # "left" means "left" side of the target string.
        @position = option.position
        @priority = option.priority or 0
        return
    isElementBoundary:()->
        return @node and @node.nodeType isnt @node.TEXT_NODE

COMVisualPosition.COMVisualBorder = COMVisualBorder
module.exports = COMVisualPosition
