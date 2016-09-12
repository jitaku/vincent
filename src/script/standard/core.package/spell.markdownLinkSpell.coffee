LinkSpell = require "./base/spell.link"
Decoration = require "/vincent/com/decoration"

class MarkdownLinkSpell extends LinkSpell
    DM = Decoration.createRegExpMaintainer "MarkdownLinkSpellDecoration",/\[((?:[^\[\]])*)\]\((([^\(\)\n\\ ]|(\\\()|(\\\))|(\\\\))*)( [^\)\n]*)?\)/g,[],{
        parts:[
            {
                reg:/\((([^\(\)\n\\ ]|(\\\()|(\\\))|(\\\\))*)( [^\)\n]*)?\)$/g
                classes:["edit-spell-decorator"]
            }
            {
                reg:/^\[|\]/g
                classes:["edit-spell-decorator"]
            }
        ]
    }
    dm = new DM
    reg = /\[([^\[\]]*)\]\(([^\(\)\n ]*)( [^\)\n]*)?\)/
    reg = /\[([^\[\]]*)\]\((([^\(\)\n\\ ]|(\\\()|(\\\))|(\\\\))*)( [^\)\n]*)?\)/
    reg = /\[((?:[^\[\]]|(?:\\\[)|(?:\\\]))*)\]\((([^\(\)\n\\ ]|(\\\()|(\\\))|(\\\\))*)( [^\)\n]*)?\)/
    class LinkView extends Leaf.Widget
        constructor:(@renderContext)->
            @template = """<markdown-link class="com com-markdown-link com-text com-block-like" data-class="state"><a data-id="renderer" class="image-renderer com-block-like-renderer"></a><div data-id="texts" class="com-block-like-texts com-no-trigger print-not"></div></markdown-link>"""
            super()
        setContent:(url,hint)->
            @UI.renderer.setAttribute "href",url
            if hint
                hint = hint.replace(/\\\\/g,"\\").replace(/\\\[/g,"[").replace(/\\\]/g,"]")
            if hint
                @UI.renderer.textContent = hint
                @node.classList.remove "raw-url"
            else
                @UI.renderer.textContent = url
                @node.classList.add "raw-url"
            if not url and not hint
                @UI.renderer.textContent = "[]()"
                @node.classList.add "empty"
            else
                @node.classList.remove "empty"
            return true
    test:(contentString = "")->
        match = contentString.match reg
        if match
            return {
                start:match.index
                end:match.index + match[0].length
                match:match
            }
        return null
    toPlainString:()->
        @parse()
        return @hint or @url or @toHumanString()
    type:"MarkdownLinkSpell"
    constructor:(@context,@option = {})->
        super(@context,@option)
        @addDecorationMaintainer dm
        #@setDecorations()
    specifyTextContainer:()->
        return @cache.view.UI.texts
    customBaseRender:()->
        @cache.view ?= new LinkView(@rc)
        @cache.renderer = @cache.view.UI.renderer
        @cache.view.UI.texts.innerHTML = ""
        @el = @cache.view.node
    render:(args...)->
        super(args...)
        @parse()
        view = @cache.view
        view.setContent(@url,@hint)
    parse:()->
        match = @contentString.match(reg)
        if not match
            return
        [_,@hint,url,_,_,_,_,title] = match
        @url = url.replace(/\\\\/g,"\\").replace(/\\\(/g,"(").replace(/\\\)/g,")")
        if title
            title = title.trim()
            if title[0] in ["\"","'"]
                title = title.slice(1)
            if title[title.length - 1] in  ["\"","'"]
                title = title.slice(0,-1)
            if title isnt @title
                @title = title
        else
            @title = @url
        return @url
    compose:()->
        # return false is not change or destroyed
        match = @contentString.match(reg)
        if not match or match.index isnt 0 or match[0].length isnt @length
            @toNormalTextInPlace()
            @dirty = true
            return true
        [_,hint,url,title] = match
        if url isnt @url
            @url = url
            @dirty = true
        if hint isnt @hint
            @hint = hint
            @dirty = true
        if title
            title = title.trim()
            if title[0] in ["\"","'"]
                title = title.slice(1)
            if title[title.length - 1] in  ["\"","'"]
                title = title.slice(0,-1)
            if title isnt @title
                @title = title
                @dirty = true
        #@setDecorations()
        return false
module.exports = MarkdownLinkSpell
