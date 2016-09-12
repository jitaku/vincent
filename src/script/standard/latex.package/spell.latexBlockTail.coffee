module.exports = class LatexBlockTail extends COM.COMSpell
    reg = /^\$\$(.*)\n/
    type:"LatexBlockTail"
    test:(contentString = "",index,completeString)->
        return null
    constructor:(@context,@option)->
        @appearance = {
            tagName:"span"
            classList:["com","com-text","com-latex-tail"]
        }
        # FIXME maybe a travel policy in future?
        @noTailingBoundary = true
        super @context,@option
    compose:()->
        return false
