COMSpell = COM.COMSpell
module.exports = class CodeBlockTail extends COMSpell
    reg = /^ *```(.*)\n/
    type:"CodeBlockTail"
    test:(contentString = "",index,completeString)->
        return null
    constructor:(@context,@option)->
        @appearance = {
            tagName:"span"
            classList:["com","com-text","com-code-tail"]
        }
        # FIXME maybe a travel policy in future?
        @noTailingBoundary = true
        super @context,@option
    compose:()->
        return false
