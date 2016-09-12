COMSpell = COM.COMSpell
Decoration = COM.COMDecoration
COMVisualPosition = require "/vincent/com/visualPosition"
class LatexSpell extends COMSpell
    reg = /\$\$([^$\n\r]|\\\$)*[^\\$\r\n]\$\$/
    class LatexView extends Leaf.Widget
        constructor:(@latexSpell)->
            @template = """<latex-spell class="com com-latex com-text com-block-like" data-class="error,empty"><div data-id="renderer" class="latex-renderer com-block-like-renderer"></div><div data-id="texts" class="com-block-like-texts"></div></latex-spell>"""
            super()
        render:(content)->
            if @cacheTex is content
                return
            @UI.renderer.textContent = "$#{content}$"
            @latexSpell.context.facilities.latex.renderTexElement @UI.renderer,()=>
                @latexSpell.context.castIntent "RenderIntent"
                @cacheTex = content
    type:"LatexSpell"
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
            classList:["com","com-latex","com-text"]
        }
        super args...
        @leftCaretPriority = 1
        @rightCaretPriority = 1
        @withHolder = true
    parse:()->
        return null
    getOffsetByDOM:(node,offset)->
        if node is @cache?.renderer
            return {index:@length-1,inside:false}
        return null
    #getVisualBorder:(index,relativeToCursor)->
    #    if index is 0
    #        return new COMVisualPosition.COMVisualBorder {
    #            node:@el
    #            offset:0
    #            position:"left"
    #            priority:1
    #        }
    #    else
    #        result = super(index,relativeToCursor)
    specifyTextContainer:()->
        return @cache.view.UI.texts
    customBaseRender:()->
        @cache.view ?= new LatexView(this)
        @cache.renderer = @cache.view.UI.renderer
        @cache.view.UI.texts.innerHTML = ""
        @el = @cache.view.node
    render:(args...)->
        content = @contentString.slice 2,-2
        super(args...)
        view = @cache.view
        if /^\s*$/.test content
            view.VM.empty = true
        else
            view.VM.empty = false
            view.render(content)
    compose:()->
        match = @contentString.match(reg)
        if not match or match.index isnt 0 or match[0].length isnt @length
            @toNormalTextInPlace()
            @dirty = true
            return true
        return false
module.exports = LatexSpell
