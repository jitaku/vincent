COMSpell = require "/vincent/com/spell"
Decoration = require "/vincent/com/decoration"

class SuperReferenceSpell extends COMSpell
    reg = /\[\^.*?\]/
    DM = Decoration.createRegExpMaintainer "ReferenceQuoteDecoration",/(?:^\[\^)|(?:\]$)/g,["edit-decoration"]
    dm = new DM
    type:"SuperReferenceSpell"
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
            tagName:"sup"
            classList:["com","com-reference","com-text"]
        }
        super args...
        @addDecorationMaintainer dm
        @setDecorations()
        @decorationPolicy.behave {
            behavior:"default"
        }
    trigger:()->
        return false
    render:(args...)->
        super(args...)
    compose:()->
        match = @contentString.match(reg)
        if not match or match.index isnt 0 or match[0].length isnt @length
            @toNormalTextInPlace()
            @dirty = true
            return true
        return false

module.exports = SuperReferenceSpell
