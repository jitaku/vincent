COMText = require "./text"
Errors = require "./errors"

class COMSpell extends COMText
    test:()->
        return false
    type:"Spell"
    isSpell:true
    constructor:(@context,@option = {})->
        @decorationMaintainers = []
        super(@context,@option)
        @decorationPolicy.behave {
            behavior:"singular"
        }
    addDecorationMaintainer:(maintainer)->
        @decorationMaintainers.push maintainer
    toNormalTextInPlace:()->
        @replaceBy new COMText @context,{contentString:@contentString}
    render:(args...)->
        super(args...)
    setDecorations:(decs)->
        if @decorationPolicy.behavior is "break"
            decs = []
        decs ?= []
        cs = @contentString
        for dm in @decorationMaintainers
            _decs = (dm.compute cs)
            decs.push _decs...
        super decs
    castToText:(text,start,end)->
        if end < start
            throw new Errors.LogicError "end should larger that start"
        middle = text.splitInPlace(start)
        if not middle
            middle = text
        last = middle.splitInPlace(end - start) or null

        middle.replaceBy this
        @contentString = middle.contentString
        @compose()
        @dirty = true
        @parent?.dirty = true
        return last
    compose:()->
        @setDecorations()
        return false
    toJSON:(option)->
        json = super(option)
        if not json
            return null
        json.spell = true
        return json
module.exports = COMSpell
