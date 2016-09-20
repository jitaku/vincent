HTMLEntity = require "/component/htmlEntity"
Property = require "/component/property"
HTMLTag = require "./htmlTag"

class COMConverter
    html2com:(context,html)->
        parser = new HTMLTagParser(html)
        flatten = new HTMLTag2Flatten(parser.contents)
        results = []
        for item in flatten.result
            if typeof item is "string"
                results.push context.createElement "Text",{contentString:item}
            else
                com = context.createElement item
                if com
                    results.push com
        richText = context.createElement "RichText",{}
        for item in results
            richText.append item
        return richText

class HTMLTagParser
    constructor:(html)->
        # Add `!` so we never conflict with real world html tag
        @contents = new HTMLTag("!contents",[],{})
        @tagStack = [@contents]
        new Property(this,"currentTag").atGet ()=>
            return @tagStack[@tagStack.length - 1] or null
        parser = new DOMParser()
        doc = parser.parseFromString(html,"text/html")
        @contents.addChild @parse(doc)
    parse:(el)->
        if el.nodeType is el.TEXT_NODE
            return new HTMLTag "TEXT",el.textContent
        props = {}
        if el.attributes
            for item in el.attributes
                props[item.name] = item.value
        tag = new HTMLTag((el.tagName or "Unknown").toLowerCase(),[],props)
        if el.childNodes
            for node in el.childNodes
                child = @parse node
                if child
                    tag.addChild child
        return tag

# Flatten =
# [TextStream...]
# TextStream =  [Text/Rune/Spell]
# Rune = [Rune[...]]

class HTMLTag2Flatten
    constructor:(@htmlTag)->
        @acceptTags = ["h1","h2","h3","h4","h5","h6","code","a","img","ul","ol","li","table","tbody","tr","td","th","strong","pre","b"]
        @inlineTags = ["a","img","table","strong","bold","b"]
        @blockTag = ["p","br"]
        @elementType = ["headline","list"]
        @inlines = {}
        @inlineId = 1000
        @inlineReg = new RegExp("\{\{\{\{[0-9]{4,8}\}\}\}\}")
        @inlineRegG = new RegExp("\{\{\{\{[0-9]{4,8}\}\}\}\}","g")

        heading = ""
        for level in [1..6]
            heading += "#"
            do (level,heading)=>
                @["h#{level}Flatten"] = (tag)=>
                    return "\n" + heading + " " + @getChildrenTextStream(tag) + "\n"
        @flatText = @toFlatten @normalize(@htmlTag)
        @result = @resolveInlineResource(@flatText)
    createTagInlineText:(tag)->
        id = @inlineId++
        @inlines[id] = {
            id
            detail:tag
        }
        return "{{{{#{id}}}}}"
    mergeTextArray:(children)->
        result = []
        currentText = null
        for child in children
            if child.isText()
                if currentText
                    currentText.text += child.text
                else
                    currentText = child
            else
                if currentText
                    currentText = @normalizeText currentText
                    if currentText.text.length isnt 0
                        result.push currentText
                    result.push child
                    currentText = null
                else
                    result.push child
        if currentText
            result.push currentText
        return result
    normalizeText:(tag)->
        tag.text = tag.text.replace(/\s*\n\s*\n\s*/g,"\n\n").replace(/\n\n+/g,"\n\n")
        return tag
    getChildrenTextStream:(tag,plain = false)->
        if not tag.isText
            return ""
        if tag.isText()
            return tag.text
        if tag.name in @inlineTags
            if plain
                plainText = ""
                for child in tag.children
                    plainText += @getChildrenTextStream(child,true)
                return plainText
            return @createTagInlineText(tag)
        text = ""
        for child in tag.children
            if child.isText()
                text += child.text
            else if child.name in @inlineTags
                if plain
                    return @getChildrenTextStream(child,plain)
                text += @createTagInlineText(tag)
            else
                text += @getChildrenTextStream(child,plain)
        return text
    normalize:(tag)->
        result = []
        # TEXT
        if tag.children not instanceof Array
            return tag
        if tag.name not in @acceptTags
            for item in tag.children
                child = @normalize(item)
                if child instanceof Array
                    result.push child...
                else
                    result.push child
            if tag.name in @blockTag
                result.push new HTMLTag("TEXT","\n\n")
            return @mergeTextArray result
        else if tag.name in @acceptTags
            for item in tag.children
                child = @normalize(item)
                if child instanceof Array
                    result.push child...
                else
                    result.push child
            result = @mergeTextArray result
            tag.children.length = 0
            for child in result
                tag.addChild child
            return tag
    toFlatten:(arr)->
        if arr instanceof HTMLTag
            arr = [arr]
        text = ""
        for child in arr
            if flatter = @["#{child.name}Flatten"]
                text += flatter.call(this,child)
            else
                text += @getChildrenTextStream(child)
        return text
        # For any tag given
        # 1. MatchElement => break current element and push to root
        #
        # If any of it's children is other than Text then we flatten it (ignore itself)
        # else we admit it.
    ulFlatten:(tag)->
        return new UlFlatter(this,tag).text
    olFlatten:(tag)->
        return new UlFlatter(this,tag).text
    codeFlatten:(tag)->
        cs = @escapeChar @getChildrenTextStream(tag),"`"
        if cs.indexOf("\n") < 0
            return "`#{cs}`"
        return "\n```\n#{cs}\n```\n"
    preFlatten:(tag)->
        cs = @escapeChar @getChildrenTextStream(tag),"`"
        if cs.indexOf("\n") < 0
            return "`#{cs}`"
        return "\n```\n#{cs}\n```\n"
    escapeChar:(text,char,replacement)->
        return text.replace(new RegExp(char,"g"),replacement or "\\#{char}")
    resolveInlineResource:(text)->
        @inlineReg.lastIndex = 0
        left = text
        result = []
        while match = left.match @inlineReg
            result.push left.slice(0,match.index)
            left = left.slice(match.index + match[0].length)
            code = match[0].slice(4).slice(0,-4)
            l = @inlines[code]
            tag = l.detail
            if solver = @["#{tag.name}InlineSolve"]
                rune = solver.call this,tag
                if rune
                    result.push rune
                    continue
            result.push @getChildrenTextStream tag,true
        result.push left
        return @mergeSolvedResult(result)
    escapeMarkdownUrl:(string = "")->
        _map = {
            "(":"\\("
            ")":"\\)"
            "\\":"\\\\"
        }
        result =  string.replace /\(|\)|\\/g,(match)->
            return _map[match] or match
        return result
    mergeSolvedResult:(arr)->
        results = []
        text = null
        for item in arr
            if typeof item is "string"
                if text
                    text += item
                else
                    text = item
            else
                if text
                    results.push text
                    text = null
                results.push item
        if text
            results.push text
        return results
    tableInlineSolve:(tag)->
        return new TableRuneParser(this,tag).rune
    imgInlineSolve:(tag)->
        return "![](#{@escapeMarkdownUrl tag.props?.src})"
    bInlineSolve:(tag)->
        return "**#{@getChildrenTextStream(tag,true)}**"
    boldInlineSolve:(tag)->
        return "**#{@getChildrenTextStream(tag,true)}**"
    strongInlineSolve:(tag)->
        return "**#{@getChildrenTextStream(tag,true)}**"
    aInlineSolve:(tag)->
        link = tag.props.href
        title = @getChildrenTextStream(tag,true)
        return {
            type:"LinkRune"
            link,title
        }

class UlFlatter
    constructor:(@flatter,@tag)->
        @items = []
        @acceptTags = ["ul","li","ol"]
        @inlineTags = ["a","img","table","strong","bold"]
        @blockTag = []
        @indentStep = 4
        normalizedTag = @normalize(@tag)
        @text = @flatten(normalizedTag) + "\n"
    normalize:(tag)->
        result = []
        # TEXT
        if tag.children not instanceof Array
            return tag
        if tag.name not in @acceptTags and tag.name not in @inlineTags
            for item in tag.children
                child = @normalize(item)
                if child instanceof Array
                    result.push child...
                else
                    result.push child
            if tag.name in @blockTag
                result.push new HTMLTag("TEXT","\n")
            return @flatter.mergeTextArray result
        else if tag.name in @acceptTags
            for item in tag.children
                child = @normalize(item)
                if child instanceof Array
                    result.push child...
                else
                    result.push child
            result = @flatter.mergeTextArray result
            tag.children.length = 0
            for child in result
                tag.addChild child
            return tag
        else if tag.name in @inlineTags
            t = new HTMLTag("TEXT",@flatter.createTagInlineText(tag))
            return t
    flatten:(tag,indent = 0)->
        space = ""
        for index in [0...indent]
            space += " "
        if tag.name is "li"
            text = "#{space} * "
            tailing = true
            for child in tag.children
                if child.isText()
                    text += @singleline child.text
                else if child.name in ["ul","ol"]
                    tailing = false
                    text += "\n" + @flatten(child,indent + @indentStep)
                else if child.name is "li"
                    text += @flatter.getChildrenTextStream(child)
                else
                    Logger.error "Unexpected tag(#{tag.name})",tag
                    continue
            return text + (tailing and "\n" or "")
        else if tag.name in ["ul","ol"]
            text = ""
            previousText = false
            tailing = true
            for child in tag.children
                if child.isText()
                    if t = child.text.trim()
                        previousText = true
                        text += t
                    else
                        continue
                else if child.name is ["ul","ol"]
                    text += @flatter.getChildrenTextStream(child)
                else if child.name is "li"
                    tailing = false
                    if previousText
                        previousText = false
                        text += "\n"
                    text += @flatten(child,indent)
            return text + (tailing and "\n" or "")
        else if tag.isText()
            return tag.text
    singleline:(text)->
        return text.replace(/\s*\n\s*/g," ")
class TableRuneParser
    constructor:(@flatter,@tag)->
        @rune = null
        #@tag = @normalize(@tag)
        if @tag.children[0]?.name is "tbody"
            @parseTableContent(@tag.children[0])
        else if @tag.children[0]?.name is "tr"
            @parseTableContent(@tag)
        else
            return this
    normalize:(tag)->
        if tag.name in ["th","td"]
            return tag
        if tag.name is "tbody" or tag.name is "table"
            children = tag.children.slice()
            results = []
            for child in children
                if child.name not in ["tr"]
                    continue
                if c = @normalize child
                    results.push c
            tag.children.length = 0
            for child in results
                tag.addChild child
            return tag
        if tag.name is "tr"
            children = tag.children.slice()
            results = []
            for child in children
                if child.name not in ["td","th"]
                    continue
                if c= @normalize(child)
                    results.push c
            tag.children.length = 0
            for child in results
                tag.addChild child
            return tag
        return null

    parseTableContent:(tag)->
        tag = @normalize(tag)
        for child in tag.children
            if child.name isnt "tr"
                return null
        colCount = tag.children.length
        rowCount = tag.children[0]?.children?.length
        if not colCount or not rowCount
            return null
        cells = []
        for row in tag.children
            for child in row.children
                cells.push {
                    type:"TableCell"
                    contentString:@flatter.getChildrenTextStream(child,"plain")
                }
        return @rune = {
            type:"Table"
            col:colCount
            row:rowCount
            children:cells
        }

COMConverter.HTMLTagParser = HTMLTagParser
COMConverter.HTMLTag2Flatten = HTMLTag2Flatten
module.exports = COMConverter
