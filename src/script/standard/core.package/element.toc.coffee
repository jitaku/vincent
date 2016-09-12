Decoration = COM.COMDecoration
COMRichText = COM.COMRichText
COMSpell = COM.COMSpell

class TocView extends Leaf.Widget
    constructor:(@toc)->
        template = """
<div class="com com-rich-text com-toc-block"><div data-id="container" class="container"></div><div data-id="titles" class="toc-renderer"></div></div>
"""
        super(template)
        @toc.listenBy this,"enable",()=>
            @attach()
        @toc.listenBy this,"disable",()=>
            @detach()
    attach:()->
        if @headlines
            @headlines.stopListenBy this
        @headlines = @toc.context.get "headlines"
        @headlines.listenBy this,"change",()=>
            @headlines.sort()
            @update()
    detach:()->
        @headlines.stopListenBy this
    update:()->
        #@items.length = 0
        #headlines = @headlines.toArray()
class Toc extends COMRichText
    type:"Toc"
    mime:"text/plain"
    isSingleLine:true
    constructor:(args...)->
        @appearance = {
            tagName:"code"
            classList:["com","com-rich-text","com-toc-block"]
        }
        @childNoTailingBoundary = true
        super args...
        @decorationMaintainers = []
        @layout = "block"
        @composePolicy.behave {
            borrow: true
            lend: false
            tailingNewline: true
        }
    customBaseRender:()->
        if not @cache.view
            @cache.view = new TocView(this)
            @cache.view.attach()
        #@domContainer = @cache.view.UI.container
        @el = @cache.view.node
        @el.com = this
        for item in @appearance?.classList or []
            @el.classList.add item
        return true
    onRootAvailable:()->
        super()
        @emit "enable"
        count = (@context.get "tocCount") or 0
        count += 1
        @context.set "tocCount",count
    onRootDispel:()->
        super()
        @emit "disable"
        count = (@context.get "tocCount") or 0
        count -= 1
        if count < 0
            count = 0
        @context.set "tocCount",count
    specifyDomContainer:()->
        @domContainer = @cache.view.UI.container
    render:()->
        super()

module.exports = Toc
