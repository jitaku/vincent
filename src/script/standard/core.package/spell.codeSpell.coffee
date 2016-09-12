COMSpell = require "/vincent/com/spell"
Decoration = require "/vincent/com/decoration"
class CodeSpell extends COMSpell
    reg = /`([^`\n\r]|\\`)*[^\\`\r\n]`/
    DM = Decoration.createRegExpMaintainer "InlineCodeQuoteDecoration",/(?:^`)|(?:`$)/g,["com-dec-hold"]
    dm = new DM
    test:(contentString = "")->
        match = contentString.match reg
        if match
            return {
                start:match.index
                end:match.index + match[0].length
                match:match
            }
        return null
    constructor:(args...)->
        @appearance ?= {
            tagName:"code"
            classList:["com","com-inline-code","com-text"]
        }
        super args...
        @addDecorationMaintainer dm
        @setDecorations()
        @decorationPolicy.behave {
            behavior:"singular"
        }
        @rightCaretPriority = 1
    type:"CodeSpell"
    parse:()->
        return null
    render:(args...)->
        super(args...)
    compose:()->
        if super()
            return true
        match = @contentString.match(reg)
        if not match or match.index isnt 0 or match[0].length isnt @length
            @toNormalTextInPlace()
            @dirty = true
            return true
        return false
module.exports = CodeSpell
