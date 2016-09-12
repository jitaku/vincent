LatexEditPopup = require "./view/latexEditPopup"
LatexRuneView = require "./view/latexRuneView"

class LatexRune extends COM.COMRune
    type:"LatexRune"
    constructor:(@context,data ={})->
        @appearance = {
            tagName:"latex-rune"
            classList:["com","com-rune"]
        }
        @latex = data.latex or ""
        super(@context)
    customBaseRender:()->
        if not @cache.view
            @cache.view ?= new LatexRuneView(this)
        @el = @cache.view.node
        return true
    render:(args...)->
        super args...
        @cache.view?.render()
        return true
    trigger:()->
        @edit()
        return true
    edit:()->
        popup = new LatexEditPopup()
        popup.edit @latex,(err,result)=>
            if err
                return
            @context.transact ()=>
                @context.operate new COM.COMOperation.ChangePropertyOperation @context,this,{
                    property:{
                        latex:result
                    }
                }
    toJSON:()->
        json = super()
        json.latex = @latex or ""
        return json

module.exports = LatexRune
