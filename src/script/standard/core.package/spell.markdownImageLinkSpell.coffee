MarkdownImageSpell = require "./spell.markdownImageSpell"
SmartImage = require "/widget/smartImage"

class MarkdownImageLinkSpell extends MarkdownImageSpell
    reg = /\[\!\[([^\[\]]*)\]\(([^\(\)\n]*)\)\]\(([^\(\)\n ]*)( [^\)\n]*)?\)/
    class ImageLinkView extends Leaf.Widget
        constructor:(@renderContext)->
            @include SmartImage
            @template = """<inline-image-link target="_blank" class="com com-markdown-image-link com-text com-block-like" data-class="state"><a data-id="link" target="_blank"><smart-image data-id="renderer" class="image-renderer com-block-like-renderer"></smart-image></a><div data-id="texts" class="com-block-like-texts com-no-trigger print-not"></div></inline-image-link>"""
            super()
            @UI.renderer.on "state",(state)=>
                @renderContext.emit "resize"
                if state is "failed"
                    @VM.state = "error"
                else
                    @VM.state = state

    test:(contentString = "")->
        match = contentString.match reg
        if match
            return {
                start:match.index
                end:match.index + match[0].length
                match:match
            }
        return null
    type:"MarkdownImageLinkSpell"
    constructor:(@context,@option = {})->

        @appearance ?= {
            tagName:"a"
            classList:["com","com-text","com-markdown-image","com-markdown-image-link"]
        }
        super(@context,@option)
    customBaseRender:()->
        @cache.view ?= new ImageLinkView(@rc)
        @cache.renderer = @cache.view.UI.renderer
        @cache.view.UI.texts.innerHTML = ""
        @el = @cache.view.node
    render:(args...)->
        super args...
        view = @cache.view
        if @url
            view.UI.link.setAttribute "href",@url
        else
            view.UI.link.setAttribute "href","#"
    parse:()->
        match = @contentString.match(reg)
        if not match
            return
        [_,@alt,@src,@url,@title] = match
        if title
            title = title.trim()
            if title[0] in ["\"","'"]
                title = title.slice(1)
            if title[title.length - 1] in  ["\"","'"]
                title = title.slice(0,-1)
            if title isnt @title
                @title = title
        return @url
    compose:()->
        # return false is not change or destroyed
        match = @contentString.match(reg)
        if not match or match.index isnt 0 or match[0].length isnt @length
            @toNormalTextInPlace()
            @dirty = true
            return true
        @parse()
        return false
module.exports = MarkdownImageLinkSpell
