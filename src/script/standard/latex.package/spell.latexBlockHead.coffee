COMSpell = COM.COMSpell

module.exports = class LatexBlockHead extends COMSpell
    reg = /^\$\$(.*)\n/
    type:"LatexBlockHead"
    test:(contentString = "",index,completeString)->
        return null
    constructor:(@context,@option)->
        @appearance = {
            tagName:"span"
            classList:["com","com-text","com-latex-head"]
        }
        super @context,@option
        # FIXME maybe a travel policy in future?
        @noTailingBoundary = true
    compose:()->
        return false
    getLanguage:()->
        result = @contentString.match /\$\$(.*)\n/
        language = result[1] or "".trim()
        return language.toLowerCase()
