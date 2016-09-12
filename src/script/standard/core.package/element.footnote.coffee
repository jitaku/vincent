COMRichText = COM.COMRichText

class Footnote extends COMRichText
    type:"Footnote"
    constructor:(@context,@data = {})->
        @appearance = {
            tagName:"div"
            classList:["com","com-rich-text","com-footnote"]
        }
        #@availableSpells = [FootnoteHead]
        @privateSpells = [FootnoteHead]
        super @context,@data
        @composePolicy.behave {
            borrow: true
            lend: false
            tailingNewline: true
        }
        @layout = "block"
    onRootAvailable:()->
        super()
    onRootDispel:()->
        super()

        
COMSpell = COM.COMSpell
Decoration = COM.COMDecoration

class FootnoteHead extends COMSpell
    reg = /^\s*\[\^?[^\[\]\n]*\]/
    DM = Decoration.createRegExpMaintainer "ReferenceQuoteDecoration",/(?:^\[\^?)|(?:\]$)/g,["edit-decoration"]
    dm = new DM
    type:"FootnoteHead"
    render:(rc)->
        super(rc)
    test:(contentString = "")->
        match = contentString.match reg
        if match
            return {
                start:match.index
                end:match.index + match[0].length
                match:match
            }

        return null
    constructor:(@context,@option = {})->
        # If no eye catching, then home/end key will ignore the spell
        # As scope
        @noEyeCatching = true
        @appearance ?= {
            tagName:"span"
            classList:["com","com-footnote-head","com-text"]
        }
        super(@context,@option)
        @addDecorationMaintainer dm
        @setDecorations()
        @decorationPolicy.behave {
            behavior:"break"
        }
        # Hot fix for caret position of footnote `#`
        # , maybe a caret policy in future
        @noTailingBoundary = true

    compose:()->
        if not reg.test @contentString
            Logger.error "note pass"
            debugger
        if super()
            return true
        #retain = /^\s*#{1,6} $/
        #if not retain.test @contentString
        #    @toNormalTextInPlace()
        #    @dirty = true
        #    @parent?.dirty = true
        #    return true
        @acknowledge()
        return false
    acknowledge:()->
        result = @contentString.match(reg)
        if not result
            throw new Error "logic error, unexpected unmatch of #{@contentString}"
            return
        match = result[0].match /\[\^?(.*)\]/
        if not match
            return
        referenceText = match[1]
        if @referenceText isnt referenceText
            @referenceText = referenceText
            @dirty = true
module.exports = Footnote
#customize.add FootnoteHead
