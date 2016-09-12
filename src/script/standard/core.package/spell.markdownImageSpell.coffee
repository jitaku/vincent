COMSpell = require "/vincent/com/spell"
Decoration = require "/vincent/com/decoration"
SmartImage = require "/widget/smartImage"
class MarkdownImageSpell extends COMSpell
    #DM = Decoration.createRegExpMaintainer "MarkdownImageSpellDecoration",/!\[([^\[\]]*)\]\(([^\(\)]*)\)/g,["com-inline-markdown-image"]
    #dm = new DM
    reg = /\!\[([^\[\]]*)\]\(([^\(\)\n]*)\)/
    class ImageView extends Leaf.Widget
        constructor:(@renderContext)->
            @include SmartImage
            @template = """<inline-image class="com com-markdown-image com-text com-block-like" data-class="state"><smart-image data-id="renderer" class="image-renderer com-block-like-renderer"></smart-image><div data-id="texts" class="com-block-like-texts com-no-trigger print-not"></div></inline-image>"""
            super()
            @UI.renderer.on "state",(state)=>

                @renderContext.emit "resize"
                if state is "failed"
                    @VM.state = "error"
                else
                    @VM.state = state
    type:"MarkdownImageSpell"
    toPlainString:()->
        @parse()
        return @alt or @toHumanString()
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
            classList:["com","com-markdown-image","com-text"]
        }
        super args...
        @leftCaretPriority = 1
        @rightCaretPriority = 1
        @withHolder = true
        new ImageStateTrait(this)
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
        @cache.view ?= new ImageView(@rc)
        @cache.renderer = @cache.view.UI.renderer
        @cache.view.UI.texts.innerHTML = ""
        @el = @cache.view.node
    parse:()->
        match = @contentString.match(reg)
        if not match
            return
        [_,@alt,@src] = match
        return
    render:(args...)->
        super(args...)
        @parse()
        view = @cache.view
        if not @src
            view.VM.empty = true
            @cache.renderer.src = ""
            @cache.renderer.alt = @alt or ""
        else
            view.VM.empty = false
            if @cache.renderer.src isnt @src
                @cache.renderer.src = @src
            if @cache.renderer.alt isnt @alt
                @cache.renderer.alt = @alt or ""
    compose:()->
        match = @contentString.match(reg)
        if not match or match.index isnt 0 or match[0].length isnt @length
            @toNormalTextInPlace()
            @dirty = true
            return true
        @parse()
        return false
class ImageStateTrait extends Leaf.Trait
    initialize:()->
        CDNResource = require "/webService/CDNResource"
        @loadingSrc = CDNResource.loadingHintGif
    setSrc:(src)->
        App = require "/app"
        App.imageLoader.load {src},(err,image)=>
            if err
                @setFail reason
                return
            @UI.renderer.src = image.src
    setFail:(reason)->
        # We failed to load the image set some reason for it
        # For now we just let it loading forever
        @UI.
        return


module.exports = MarkdownImageSpell
