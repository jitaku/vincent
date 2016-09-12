Decoration = COM.COMDecoration
COMContainer = COM.COMContainer
COMRichText = COM.COMRichText

LatexBlockHead = require "./spell.latexBlockHead"
LatexBlockTail = require "./spell.latexBlockTail"

class LatexView extends Leaf.Widget
    constructor:(@latex)->
        template = """
<div class="com com-rich-text com-latex-block"><div data-id="container" class="container"></div><div data-id="renderer" class="latex-renderer"></div></div>
"""
        super(template)
    render:(content)->
        if @cacheTex is content
            return
        @UI.renderer.textContent = "$$#{content}$$"
        @latex.context.facilities.latex.renderTexElement @UI.renderer,()=>
            @latex.context.castIntent "RenderIntent"
            @cacheTex = content
class Latex extends COMRichText
    type:"Latex"
    mime:"text/plain"
    constructor:(args...)->
        @appearance = {
            tagName:"code"
            classList:["com","com-rich-text","com-latex-block"]
        }
        @childNoTailingBoundary = true
        super args...
        @availableSpells = [LatexBlockHead,LatexBlockTail]
        @decorationMaintainers = []
        @layout = "block"
        @composePolicy.behave {
            borrow: true
            lend: false
            tailingNewline: true
        }
        #@caretStyle = {className:"monokai"}
#        if @contentString.slice(-1) isnt "\n"
#            @contentString += "\n"
        #@codeHead = new LatexBlockHead(@context,{contentString:""})
        #@codeTail = new LatexBlockTail(@context,{contentString:""})
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
        texts = @children.slice()
        for item,index in texts
            if item instanceof LatexBlockHead and index isnt 0
                item.remove()
                changed = true
            if item instanceof LatexBlockTail and index isnt texts.length - 1
                item.remove()
                changed = true
        return changed or false
    computeDecoration:()->
        if @children[0]?.type is "LatexBlockHead"
            @language = @children[0]?.getLanguage?()
            if @language isnt @lastLanguage
                @setLanguage(@language)
        @lastLanguage = @language
        super()
    normalizeTexts:()->
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
                    item.after @context.createElement "Text",{contentString:part+"\n",}
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
                    item.before @context.createElement "Text",{contentString:part+"\n",}
            continue
        if toMerge
            change = true
            @append @context.createElement "Text",{contentString:toMerge}
        return change or false
    castSpells:()->
        # after spell normalized
        # first one and the last one should be cast as spell.
        first = @children[0]
        if first not instanceof LatexBlockHead
            has = true
            new LatexBlockHead(@context).castToText first,0,first.length
        last = @last()
        if last not instanceof LatexBlockTail
            has = true
            new LatexBlockTail(@context).castToText last,0,last.length
        return has or false
    acknowledge:()->
        reg = /\$\$(.*)/
        @contentString.match(reg)
        return false
    setLanguage:(language)->
        @decorationMaintainers.length = 0
        plugin = Latex.languages.get(language)
        if plugin?.decoration
            @decorationMaintainers.push plugin.decoration
    # TODO: May be I should even implement setByDOM and
    # getCorrespondingBoundary API for Latex Render result
    customBaseRender:()->
        if not @cache.view
            @cache.view = new LatexView(this)
            @cache.renderer = @cache.view.UI.renderer
        @el = @cache.view.node
        @el.com = this
        for item in @appearance?.classList or []
            @el.classList.add item
        return true
    specifyDomContainer:()->
        @domContainer = @cache.view.UI.container
    render:()->
        super()
        try
            @cache.renderer.classList.remove "error"
            cs = @contentString
            start = cs.indexOf("$") + 2
            end = cs.lastIndexOf("$") - 1
            content = cs.slice(start,end)
            @cache.view.render(content)
            if /^(\s|\n)*$/.test content
                @el.classList.add "empty"
            else
                @el.classList.remove "empty"
        catch e
            @cache.renderer.classList.add "error"
            @cache.renderer.innerHTML = "#{cs.slice(start,end)?.trim()}:#{JSON.stringify e,null,4}"
class LanguageManager
    constructor:()->
        @languages = {}
    get:(language)->
        return @languages[language] or null
    registerLanguageHighlight:(name,domain)->
        @languages[name] ?= {}
        lang = @languages[name]
        lang.decoration = new LatexDecorationMaintainer(name,domain)
Latex.languages = new LanguageManager()
Latex.registerLanguageHighlight = (args...)->
    @languages.registerLanguageHighlight args...

class LatexDomain
    constructor:(info)->
        @targets = []
        @subDomains = []
        sources = []
        for item in info
            @targets.push item
            if item.domain
                @subDomains.push new LatexDomain item.domain
            else
                @subDomains.push null
        # build reg
        source = @targets
            .map (item)->
                if item.type is "keyword"
                    "(\\b#{item.source}\\b)"
                else
                    "(#{item.source})"
            .join "|"
        if not source
            @reg = null
        @reg = new RegExp(source,"g")
    analyze:(string,offset = 0)->
        if not @reg
            return []
        result = []
        while match = @reg.exec string
            if match[0].length is 0
                throw new Error "empty latex parsing!"
            index = @getMatchIndex(match)
            if index < 0
                throw new Error "unexpected parse match",match,@reg
            content = match[index]
            target = @targets[index - 1]
            result.push {
                start:match.index + offset
                length:match[0].length
                type:target.type or "custom"
                name:target.name
            }
            if target.domain and subDomain = @subDomains[index - 1]
                result.push (subDomain.analyze match[0],match.index + offset)...
        return result
    getMatchIndex:(reg)->
        for index in [1...reg.length]
            if reg[index]
                return index
        return -1

class LatexDecorationMaintainer extends Decoration.DecorationMaintainer
    constructor:(@language,@domain)->
        if @domain
            @analyzer = new LatexDomain(@domain)
    compute:(string)->
        result = @analyzer.analyze string
        @decorations = []
        for item in result
            @decorations.push new LatexDecoration(
                this
                item.start
                item.start + item.length
                {
                    classes:[
                        "latex-highlight-#{item.type}"
                        "latex-highlight-#{item.type}-#{item.name or "anonymous"}"
                    ]
                }
            )
        return @decorations
#        @decorations = []
#        @reg.lastIndex = 0
#
#        while result = @reg.exec string
#            if not result[0]
#                break
#            styles = @getStyleByRegResult(result)
#            if not styles
#                continue
#            start = result.index
#            end = result[0].length + start
#            @decorations.push new LatexDecoration(this,start,end,styles)
#        debugger
#        return @decorations
class LatexDecoration extends Decoration
    constructor:(@maintainer,@start,@end,@styles = {})->
        @isLatex = true
    apply:(el)->
        el.classList.add (@styles.classes or [])...
    equal:(target)->
        return target.isLatex and target.start is @start and target.end is @end and @maintainer.language is target.maintainer.language

#Latex.registerLanguageHighlight "coffee-script",["class","if","else","not","and","or","return","new","while","of","in","extends","interface","import","unless","for","function"],[{
#        name:"string"
#        source:"\"(?:(?:[^\n\"\\\\])|(?:\\\\\")|(?:\\\\))*\""
#    },{
#        name:"string"
#        source:"'(?:(?:[^\n'\\\\])|(?:\\\\')|(?:\\\\))*'"
#    },{
#        name:"comment"
#        source:"#.*"
#    },{
#        name:"property"
#        source:"@[0-9a-zA-Z_.]+"
#    },{
#        name:"key"
#        source:"\\b\\w+\\s*:"
#    }]

#customize.registerCommand {
#    name:"newline-and-indent"
#    description:"enter a newline and indent to be aligned with previous line"
#    handler:(editor)->
#        cursor = editor.buffer.cursor
#        if not cursor.target?.sortOf("Latex")
#            return false
#        indent = ""
#        do ()->
#            cursor.state.save()
#            cursor.anchor.startOfLine({begin:true})
#            cs = cursor.target.contentString
#            if not cs
#                return false
#            while cs[cursor.anchor.index] is " "
#                indent += " "
#                cursor.anchor.index+=1
#        cursor.state.restore()
#        if indent.length > 0
#            cursor.conduct "write","\n#{indent}"
#            return true
#        return false
#}
#customize.registerHotkey "input:enter","newline-and-indent"
#customize.registerCommand {
#    name:"tab-to-space-in-code"
#    description:"give 4 space if user press tab in code block"
#    handler:(editor)->
#        cursor = editor.buffer.cursor
#        if cursor.target?.sortOf("Latex")
#            return cursor.conduct "write","    "
#        return false
#}
#customize.registerHotkey "input:tab","tab-to-space-in-code"
module.exports = Latex
