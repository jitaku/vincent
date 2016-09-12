COMRichText = COM.COMRichText
COMDecoration = COM.COMDecoration

class Quote extends COMRichText
    @preferedUnorderedPrefix = "*"
    @QuoteHeadReg
    @isContentMatchQuote = (content)->
        /^( *)(?:-|\*|[0-9]+\.) +.*\n?$/.test content
    type:"Quote"
    onRootAvailable:()->
        super()
        @pend()
    isSingleLine:true
    constructor:(@context,@data = {})->
        @appearance = {
            tagName:"span"
            classList:["com","com-rich-text","com-quote","com-el-single-line"]
        }
        super @context,@data
        Quote.headHighlight ?= new QuoteHeadHighlight()
        @decorationMaintainers.push Quote.headHighlight
        @composePolicy.behave {
            borrow: true
            lend: false
            tailingNewline: true
        }
        @layout = "block"
        return this
    isEmpty:()->
        return @contentString.trim().indexOf(" ") < 0
    anchorAtBeginText:()->
        anchor = @anchor.clone()
        anchor.index = @getHead()?.length or 0
        return anchor
    trigger:(option = {})->
        return false
    render:(rc)->
        super(rc)
        return true
    clone:()->
        result = super()
        if not result
            return result
        return result
    toHumanString:()->
        super()
    toJSON:(option)->
        json = super(option)
        if not json
            return null
        return json
    getHead:()->
        contentString = @contentString
        index = 0
        while contentString[index] is " "
            index += 1
        return contentString.slice(0,index + 1)
    getHeadPrefix:()->
        return @getHead().trim()
    getHead:()->
        match = @contentString.match QuoteHeadReg
        if not match
            return ""
        return match[0]
QuoteHeadReg = /^\s*> /
QuoteHeadRegG = /^\s*> /g
QuoteHeadHighlight = COMDecoration.createRegExpMaintainer "QuoteHead",QuoteHeadRegG,["com-inline-quote-head"]
module.exports = Quote
