class DOMWalker
    constructor:(@node,@begin,@end)->
    traverse:(handler)->
        top = @node
        if not top.childNodes or top.childNodes.length is 0
            if top and @begin is top or @end is top
                handler(top)
            return
        node = @begin or top.childNodes[0]
        while true
            if not node
                break
            if handler(node)
                break
            if node is top
                break
            if node is @end
                break
            if node.childNodes and node.childNodes.length > 0
                node = node.childNodes[0]
                continue
            next = node.nextSibling
            if next
                node = next
                continue
            while node = node.parentElement
                pn = node.nextSibling
                if node is top
                    break
                if pn
                    node = pn
                    break

exports.traverse = (node,handler)->
    walker = new DOMWalker(node)
    walker.traverse handler
exports.traverseRange = (range,handler)->
    top = range.commonAncestorContainer
    if range.startContainer instanceof window.Text
        begin = range.startContainer
    else
        begin = range.startContainer.children[range.startOffset]
    if range.endContainer instanceof window.Text
        end = range.endContainer
    else
        end = range.endContainer.children[range.endOffset]
    walker = new DOMWalker(top,begin,end)
    walker.traverse handler
