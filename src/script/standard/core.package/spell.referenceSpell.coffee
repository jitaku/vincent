COMSpell = require "/vincent/com/spell"
Decoration = require "/vincent/com/decoration"

class ReferenceSpell extends COMSpell
    reg = /\[.*\]\[[^\]\n\[]*\]/
    DM = Decoration.createRegExpMaintainer "ReferenceQuoteDecoration",/(?:\[)|(?:\]\[.*\])/g,["edit-decoration"]

    dm = new DM
    type:"ReferenceSpell"
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
            tagName:"a"
            classList:["com","com-reference","com-text"]
        }
        super args...
        @addDecorationMaintainer dm
        @setDecorations()
        @decorationPolicy.behave {
            behavior:"default"
        }
    render:(args...)->
        super(args...)
    compose:()->
        match = @contentString.match(reg)
        if not match or match.index isnt 0 or match[0].length isnt @length
            @toNormalTextInPlace()
            @dirty = true
            return true
        return false
    trigger:()->
        return false
module.exports = ReferenceSpell
