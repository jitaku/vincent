Decoration = COM.COMDecoration
COMContainer = COM.COMContainer
COMRichText = COM.COMRichText
COMSpell = COM.COMSpell
COMText = COM.COMText
customize = COM.customize

CodeBlockHead = require "./spell.codeBlockHead"
CodeBlockTail = require "./spell.codeBlockTail"
CodeLine = require "./spell.codeLine"

class CodeView extends Leaf.Widget
    constructor:()->
        super """<div class="com com-rich-text"><div data-id="renderer" class="code-render print-not">Rendering...</div><code data-id="container" class="container code"></code></div>"""
        @rendererId = "code-renderer-"+Math.random().toString().slice(4,20)
        @UI.renderer.setAttribute "id",@rendererId
class Code extends COMRichText
    type:"Code"
    mime:"text/plain"
    constructor:(args...)->
        @appearance = {
            tagName:"code"
            classList:["com","com-rich-text","com-code-block"]
        }
        @childNoTailingBoundary = true
        @withMarkdownWrapper ?= true
        super args...
        if @withMarkdownWrapper
            @availableSpells = [CodeBlockHead,CodeBlockTail,CodeLine]
        else
            @availableSpells = [CodeLine]
        @decorationMaintainers = []
        @layout = "block"
        @composePolicy.behave {
            borrow: true
            lend: false
            tailingNewline: true
        }
        @caretStyle = {className:"monokai"}
        @caretStyle = {className:"tomorrow"}
        @disableTextHolder = true
#        if @contentString.slice(-1) isnt "\n"
#            @contentString += "\n"
        #@codeHead = new CodeBlockHead(@context,{contentString:""})
        #@codeTail = new CodeBlockTail(@context,{contentString:""})
    specifyDomContainer:()->
        @domContainer = @cache.view.UI.container
    customBaseRender:()->
        if not @cache.view
            @cache.view = new CodeView()
            @cache.renderer = @cache.view.UI.renderer
        @el = @cache.view.node
        @el.com = this
        @el.className = ""
        for item in @appearance?.classList or []
            @el.classList.add item
    render:()->
        super()
        content = @getCodeContent()
        @renderPreview(content,{rendererId:@cache.view.rendererId,target:@cache.view.UI.renderer,parent:@el,renderContext:@rc})
        cs = @contentString
        if cs.length < 100 and /^```.*\n\s*```\s*$/.test cs
            @el.classList.add "empty"
        else
            @el.classList.remove "empty"
    getCodeContent:()->
        return @toHumanString().replace(/^```.*/,"").replace(/```\s*$/,"")
    compose:()->
        super()
#    recoverRunes:()->
#        super()
#        for item in @children.slice()
#            if item.sortOf("Rune")
#                @removeChild item
#        @reflow()
#        return false
    retainSpells:()->
        if not @withMarkdownWrapper
            return false
        texts = @children.slice()
        for item,index in texts
            if item instanceof CodeBlockHead and index isnt 0
                item.remove()
                changed = true
            if item instanceof CodeBlockTail and index isnt texts.length - 1
                item.remove()
                changed = true
        return changed or false
    computeDecoration:()->
        if @children[0]?.type is "CodeBlockHead"
            @language = @children[0]?.getLanguage?()
            if @language isnt @lastLanguage
                @setLanguage(@language)
            @lastLanguage = @language
        super()

    normalizeTexts:()->
        if @withMarkdownWrapper
            @normalizeTextsWithMarkdownWrapper()
        else
            @normalizeTextsSimple()
    normalizeTextsSimple:()->
        if @toHumanString() is "" and @children.length is 1 and @children[0] not instanceof CodeLine
            @empty()
            @append line = new CodeLine @context,{contentString:""}
            line.lineNumber = 1
            line.domProperty = {"data-line":index}
            return
        texts = @children.slice()
        toMerge = ""
        for item,index in texts
            # merge from previous line without tailing \n
            if toMerge
                change = true
                item.insertText 0,toMerge
                toMerge = ""
            contentString = item.contentString
            if contentString.length is 0 and index isnt texts.length - 1
                change = true
                item.remove()
                continue
            parts = contentString.split("\n")
            if parts.length is 1 and index isnt texts.length - 1
                # no \n and not last line so hope next line merge it
                change = true
                toMerge = contentString
                item.remove()
                continue
            else if parts.length is 1 and index is texts.length - 1
                # no \n and it's last line
                break
            else if parts.length is 2 and parts[1] is ""
                # \n at tail. That's cool, nothing todo.
                continue
            change = true
            atSplit = contentString
            if index isnt texts.length - 1
                firstLine = parts.shift()
                lastLine = parts.pop()
                item.removeText(0)
                item.insertText(0,firstLine+"\n")
                for part in parts by -1
                    item.after new CodeLine @context,{contentString:part+"\n"}
                if lastLine
                    toMerge = lastLine
            else
                lastLine = parts.pop()
                # when code tail end with a \n
                if not lastLine
                    lastLine = parts.pop()
                end = item.contentString.lastIndexOf(lastLine)
                item.removeText(0,end)
                for part in parts
                    item.before new CodeLine @context,{contentString:part+"\n"}
            continue
        if toMerge
            change = true
            @append new CodeLine @context,{contentString:toMerge}
        # always keep a new line available
        lhs = @last().toHumanString()
        if lhs.slice("-1") is "\n" and lhs isnt "\n"
            change  = true
            @append new CodeLine @context,{contentString:""}
        if @lastLength isnt @children.length
            for item,index in @children
                item.dirty = true
                item.lineNumber = index + 1
                item.domProperty = {"data-line":index}
        @lastLength = @children.length
    normalizeTextsWithMarkdownWrapper:()->
        texts = @children.slice()
        toMerge = ""
        for item,index in texts
            # merge from previous line without tailing \n
            if toMerge
                change = true
                item.insertText 0,toMerge
                toMerge = ""
            contentString = item.contentString
            parts = contentString.split("\n")
            if parts.length is 1 and index isnt texts.length - 1
                # no \n and not last line so hope next line merge it
                change = true
                toMerge = contentString
                item.remove()
                continue
            else if parts.length is 1 and index is texts.length - 1
                # no \n and it's last line
                break
            else if parts.length is 2 and parts[1] is ""
                # \n at tail. That's cool, nothing todo.
                continue
            change = true
            atSplit = contentString
            if index isnt texts.length - 1
                firstLine = parts.shift()
                lastLine = parts.pop()
                item.removeText(0)
                item.insertText(0,firstLine+"\n")
                for part in parts by -1
                    item.after new CodeLine @context,{contentString:part+"\n",}
                if lastLine
                    toMerge = lastLine
            else
                lastLine = parts.pop()
                # when code tail end with a \n
                if not lastLine
                    lastLine = parts.pop()
                end = item.contentString.lastIndexOf(lastLine)
                item.removeText(0,end)
                for part in parts
                    item.before new CodeLine @context,{contentString:part+"\n",}
            continue
        if toMerge
            change = true
            @append new CodeLine @context,{contentString:toMerge}
        if @lastLength isnt @children.length
            for item,index in @children
                item.dirty = true
                if @withMarkdownWrapper
                    item.lineNumber = index
                else
                    item.lineNumber = index + 1
                item.domProperty = {"data-line":index}
        @lastLength = @children.length
        return change or false
#        texts = @children.slice()
#        toMerge = ""
#        for item,index in texts
#            if toMerge
#                change = true
#                item.insertText 0,toMerge
#                toMerge = ""
#            contentString = item.contentString
#            parts = contentString.split("\n")
#            if parts.length is 1 and index isnt texts.length - 1
#                change = true
#                toMerge = contentString
#                item.remove()
#                continue
#            else if parts.length is 1 and index is texts.length - 1
#                break
#            else if parts.length is 2 and parts[1] is ""
#                continue
#            change = true
#            atSplit = contentString
#            firstLine = parts.shift()
#            lastLine = parts.pop()
#            item.removeText(0)
#            item.insertText(0,firstLine+"\n")
#            for part in parts by -1
#                item.after @context.createElement "Text",{contentString:part+"\n",}
#            if lastLine
#                toMerge = lastLine
#            continue
#        if toMerge
#            change = true
#            @append @context.createElement "Text",{contentString:toMerge}
#
#        if @lastLength isnt @children.length
#            for item,index in @children
#                item.dirty = true
#                item.domProperty = {"data-line":index}
#        @lastLength = @children.length
#        return change or false
    castSpells:()->
        # after spell normalized
        # first one and the last one should be cast as spell.
        for item,index in @children
            if index is 0 and @withMarkdownWrapper
                first = item
                if first not instanceof CodeBlockHead
                    has = true
                    new CodeBlockHead(@context).castToText first,0,first.length
            else if index is @children.length - 1 and @withMarkdownWrapper
                last = item
                if last not instanceof CodeBlockTail
                    has = true
                    new CodeBlockTail(@context).castToText last,0,last.length
            else if item.type is "Text"
                cl = new CodeLine(@context)
                cl.castToText item,0,item.length
                if @withMarkdownWrapper
                    cl.lineNumber = index
                else
                    cl.lineNumber = index + 1
                has = true
        return has or false
    acknowledge:()->
        return false
    setLanguage:(language)->
        @decorationMaintainers.length = 0
        plugin = Code.languages.get(language)
        if plugin?.decoration
            @decorationMaintainers.push plugin.decoration
        @appearance.classList.filter (item)->item not in ["with-preview"]
        if plugin?.decoration?.domain?.preview
            @appearance.classList.push "with-preview"
            @renderPreview = plugin.decoration.domain.render
            @dirty = true
        else
            @appearance.classList = @appearance.classList.filter (item)-> item isnt "with-preview"
            @renderPreview = ()->
            @dirty = true
    renderPreview:()->
        return true

class LanguageManager
    constructor:()->
        @languages = {}
    get:(language)->
        return @languages[language] or null
    registerLanguageHighlight:(name,domain)->
        @languages[name] ?= {}
        lang = @languages[name]
        lang.decoration = new CodeDecorationMaintainer(name,domain)
Code.languages = new LanguageManager()
Code.registerLanguageHighlight = (args...)->
    @languages.registerLanguageHighlight args...

class CodeDomain
    constructor:(info)->
        @targets = []
        @subDomains = []
        @preview = info.preview or false
        @render = info.render or ()->
        sources = []
        for item in info.domains or []
            @targets.push item
            if item.domain
                @subDomains.push new CodeDomain item.domain
            else
                @subDomains.push null
        # build reg
        if @targets.length is 0
            @reg = null
            return
        source = @targets
            .map (item)->
                if item.type is "keyword"
                    "(\\b#{item.source}\\b)"
                else
                    "(#{item.source})"
            .join "|"
        if not source
            @reg = null
        if info.ignoreCase
            modifier = "ig"
        else
            modifier = "g"
        @reg = new RegExp(source,modifier)
    analyze:(string,offset = 0)->
        if not @reg
            return []
        result = []
        @reg.lastIndex = 0
        if string[0] isnt " "
            string = " " + string
            fix = -1
        else
            fix = 0
        while match = @reg.exec string
            if match[0].length is 0
                throw new Error "empty code parsing!"
            index = @getMatchIndex(match)
            if index < 0
                throw new Error "unexpected parse match",match,@reg
            content = match[index]
            target = @targets[index - 1]
            if not target
                Logger.error index,content,match,@reg
            result.push {
                start:match.index + offset + fix
                length:match[0].length
                type:target.type or "custom"
                name:target.name
            }
            if target.domain and subDomain = @subDomains[index - 1]
                result.push (subDomain.analyze match[0],match.index + offset + fix)...
        return result
    getMatchIndex:(reg)->
        for index in [1...reg.length]
            if reg[index]
                return index
        return -1
class CodeDecorationMaintainer extends Decoration.DecorationMaintainer
    constructor:(@language,@domain)->
        if @domain
            @analyzer = new CodeDomain(@domain)
    compute:(string)->
        result = @analyzer.analyze string
        @decorations = []
        for item in result
            @decorations.push new CodeDecoration(
                this
                item.start
                item.start + item.length
                {
                    classes:[
                        "code-highlight-#{item.type}"
                        "code-highlight-#{item.type}-#{item.name or "anonymous"}"
                    ]
                }
            )
        return @decorations
class CodeDecoration extends Decoration
    constructor:(@maintainer,@start,@end,@styles = {})->
        @isCode = true
    clone:()->
        return new CodeDecoration @maintainer,@start,@end,@styles
    apply:(el)->
        el.classList.add (@styles.classes or [])...
    cancel:(el)->
        el.classList.remove (@styles.classes or [])...
    equal:(target)->
        return target.isCode and target.start is @start and target.end is @end and @maintainer.language is target.maintainer.language
module.exports = Code
