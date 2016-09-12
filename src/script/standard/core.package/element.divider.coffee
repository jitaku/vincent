COMRichText = COM.COMRichText

class DividerView extends Leaf.Widget
    constructor:(@divider)->
        template = """
<div class="com com-rich-text com-divider-block"><div data-id="container" class="container"></div><div data-id="titles" class="divider-renderer"></div></div>
"""
        super(template)
class Divider extends COMRichText
    type:"Divider"
    mime:"text/plain"
    constructor:(args...)->
        @appearance = {
            tagName:"code"
            classList:["com","com-rich-text","com-divider-block"]
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
        @layout = "block"
        return this
    isSingleLine:true
    customBaseRender:()->
        if not @cache.view
            @cache.view = new DividerView(this)
        #@domContainer = @cache.view.UI.container
        @el = @cache.view.node
        @el.com = this
        for item in @appearance?.classList or []
            @el.classList.add item
        return true
    specifyDomContainer:()->
        @domContainer = @cache.view.UI.container
    render:()->
        super()

module.exports = Divider
