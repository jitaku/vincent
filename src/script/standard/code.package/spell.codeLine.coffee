module.exports = class CodeLine extends COM.COMSpell
    class CodeLineView extends Leaf.Widget
        constructor:()->
            @template = """<codeline class="com com-text codeline"><div data-id="lineNumber" class="line-number" data-text="lineNumber">1</div><div class="text-wrapper"><div data-id="texts" class="texts"></div></div></codeline>"""
            super()
    type:"CodeLine"
    test:()->
        return null
    constructor:(args...)->
        @withDecoration = true
        @keepNewlineSpace = false
        super args...
        @decorationPolicy.behave {
            behavior:"default"
        }
        @leftCaretPriority = 0
        @rightCaretPriority = 1
    getEmptyBorder:()->
        targetIndex = -1
        for child,index in @cache.view.UI.texts.parentElement.children
            if child is @cache.view.UI.texts
                targetIndex = index
        if targetIndex < 0
            return null
        return new COM.COMVisualPosition.COMVisualBorder {
            node:@cache.view.UI.texts.parentElement
            offset:targetIndex
            position:"left"
            priority:@leftCaretPriority
        }
    compose:()->
        return false
    customBaseRender:()->
        @cache.view ?= new CodeLineView()
        @el = @cache.view.node
    specifyTextContainer:()->
        return @cache.view.UI.texts
    render:(args...)->
        if @cache.lastCs is @contentString and @lineNumber is @lastLineNumber
            return
        super(args...)
        #@cache.view.VM.lineNumber = @lineNumber or 1
        @cache.view.UI.lineNumber.textContent = @lineNumber
        @cache.lastCs = @contentString
        @cache.lineNumber = @lastLineNumber
        if @contentString is ""
            @specifyTextContainer()?.textContent = " "
