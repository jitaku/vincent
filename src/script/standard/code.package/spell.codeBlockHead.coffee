module.exports = class CodeBlockHead extends COM.COMSpell
    reg = /^ *```(.*)\n/
    type:"CodeBlockHead"
    test:(contentString = "",index,completeString)->
        return null
    constructor:(@context,@option)->
        @appearance = {
            tagName:"span"
            classList:["com","com-text","com-code-head"]
        }
        super @context,@option
        # FIXME maybe a travel policy in future?
        @noTailingBoundary = true
        @decorationPolicy.behave {
            behavior:"break"
        }
    compose:()->
        return false
    getLanguage:()->
        result = @contentString.match /```(.*)\n/
        if not result
            Logger.error "invalid langauge parsed",@contentString
            return null
        language = result[1] or "".trim()
        return language.toLowerCase()?.trim()
