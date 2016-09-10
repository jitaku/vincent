HTMLParser = require "./htmlparser"
htmlEntity = require "./htmlEntity"

class DomEl
    constructor:(@name,attrs = [],@children = [])->
        @attrs = []
        @contentLength = 0
        for item in attrs
            @attrs[item.name] = item.value
        @name = @name.toUpperCase()
    push:(child)->
        child.parent = this
        @children.push child
class HTMLStack
    constructor:()->
        @__defineGetter__ "tag",()=>@stack[@stack.length - 1]

        @__defineGetter__ "indentString",()=> @getIndentSpace(@indent)
        #@modes = ["raw","multiLineEscape","singleLineEscape","splitline","inline"]
        @inlineTags = ["a","img","bold","strong","font","center","italic","span","b","em"]
        @singleLineTags = ["h1","h2","h3","h4","h5","h6","li"]
        @multiLineTags = ["code","pre"]
        @orderTags = ["li"]
        @singleLineSplit = ["blockquote"]
        @indentTags = ["ul","ol"]
        @ignoreTags = ["script","link","template","meta","header","title","br","base"]
    escapeMarkdownUrl:(string = "")->
        _map = {
            "(":"\\("
            ")":"\\)"
            "\\":"\\\\"
        }
        result =  string.replace /\(|\)|\\/g,(match)->
            return _map[match] or match
        return result
    escapeMarkdownUrlContent:(string = "")->
        if /^!\[.*\]\(.*\)$/.test string
            return string.replace(/\n/g,"")
        _map = {
            "[":"\\["
            "]":"\\]"
            "\\":"\\\\"
        }
        result =  string.replace /\[|\]|\\/g,(match)->
            return _map[match] or match
        return result
    createTagData:(tag,attrs,unary)->
        for item in attrs
            attrs[item.name] = item.value
        data = {
            name:tag
            attrs
            unary
            childTexts:[]
            children:[]
            transformContent:(str)->str
            decorationBefore:""
            decorationAfter:""
            marks:[]
            containMarks:(marks = [])->
                for mark in marks
                    if mark in @marks
                        return true
                return false
        }
        if tag in @inlineTags
            data.inline = true
        else if tag in @ignoreTags
            data.ignore = true
        else if tag in @indentTags
            data.indent = true
        else if tag in @singleLineTags
            data.singleLine = true
        else if tag in @multiLineTags
            data.multiLine = true
        else
            data.raw = true
        if tag is "a"
            url = @escapeMarkdownUrl data.attrs.href
            data.decorationBefore = () ->
                if data.containMarks ["h1","h2","h3","h4","h5","h6","a","li","ul","ol","code","pre","li","blockquote","img"]
                    return ""
                else
                    return " ["
            data.decorationAfter = (content,length)->
                if data.containMarks ["h1","h2","h3","h4","h5","h6","a","li","ul","ol","code","pre","li","blockquote","img"]
                    return ""
                else
                    "](#{url}) "
            data.transformContent = (content,length)=>
                if data.containMarks ["h1","h2","h3","h4","h5","h6","a","li","ul","ol","code","pre","li","blockquote","img"]
                    return content
                @escapeMarkdownUrlContent content
        if tag is "img"
            if not data.attrs.src
                data.markdownString = ""
            else
                data.markdownString = "![#{@escapeMarkdownUrlContent(data.attrs.alt or data.attrs.title or "")}](#{@escapeMarkdownUrl(data.attrs.src or "")})"
        if tag is "li"
            data.decorationBefore = (content = "")->
                if content.trim().length is 0
                    return ""
                else
                    return "* "
            data.transformContent = (str)->str.replace(/\n/,"")
        if tag is "blockquote"
            data.decorationBefore = "> "
        if tag in ["h1","h2","h3","h4","h5","h6"]
            count = parseInt(tag[1]) or 1
            headline = ""
            for _ in [0...count]
                headline += "#"
            data.decorationBefore = "#{headline} "
        if tag in ["pre","code"]
            data.decorationBefore = ()=>
                if data.containMarks ["code","pre"]
                    return ""
                else
                    return "```\n"
            data.decorationAfter = ()=>
                if data.containMarks ["code","pre"]
                    return ""
                else
                    return "\n```"
            data.transformContent = (str = "")->
                if data.containMarks ["code","pre"]
                    return str
                else
                    return str.replace(/```/g,"\\`\\`\\`")
        return data
    getIndentSpace:(n = 0)->
        ("    " for item in [0...n]).join("")
    markAncestor:(name)->
        for item in @stack
            if name not in item.marks
                item.marks.push name
    parse:(html)->
        @indent = 0
        @stack = []
        @disabledTagNames = ["script","link","style","meta","template","header"]
        @indentTagNames = ["ul","ol"]
        @stack.push @createTagData("root",[],false)
        HTMLParser html,{
            start:(tag,attrs,unary)=>
                tag = tag.toLowerCase()
                data = @createTagData(tag,attrs,unary)
                @tag.children.push data
                @markAncestor tag
                if unary
                    @tag.childTexts.push data.markdownString or ""
                else
                    @stack.push data
            end:(tag)=>
                content = @tag.transformContent(@tag.childTexts.join(""))
                before = ""
                after =""
                if typeof @tag.decorationBefore is "function"
                    before = @tag.decorationBefore(content,@tag.childTexts,@tag.childTexts)
                else if typeof @tag.decorationBefore is "string"
                    before = @tag.decorationBefore
                if typeof @tag.decorationAfter is "function"
                    after = @tag.decorationAfter(content,@tag.childTexts,@tag.childTexts)
                else if typeof @tag.decorationAfter is "string"
                    after = @tag.decorationAfter

                text = before + content  + after
                if @tag.ignore
                    text = ""
                else if @tag.inline
                    text = text
                else if @tag.singleLine
                    text = "\n" + text.replace(/\n/g,"")
                else
                    text = "\n" + text.replace(/\n\n+/g,"\n\n").trim() + "\n"
                @tag.text = text
                @stack.pop()
                @tag.childTexts.push text
                if tag in @indentTagNames
                    @indent -= 1
            chars:(text)=>
                @tag.childTexts.push htmlEntity.decode text
        }
        return @stack[0].childTexts.join("").trim()
        return ""

module.exports = (html)=>
    stack = []
    items = []
    HTMLParser(html,{
        start:(tag,attrs,unary)=>
            el = new DomEl(tag,attrs)
            last = stack[stack.length - 1]
            if not last
                stack.push el
                if unary
                    stack.pop()
                items.push el
            else
                stack.push el
                current = last
                current.push el
                if unary
                    stack.pop()
        end:(tag)=>
            stack.pop()
        chars:(text)=>
            el = new DomEl("TEXT_CONTENT",[{value:htmlEntity.decode(text),name:"text"}])
            last = stack[stack.length - 1]
            if last
                last.push el
            else
                items.push el
            el.contentLength = text.length
            while el.parent
                el = el.parent
                el.contentLength += text.length
        comment:()->
    })
    markdown = toMarkdown flatten items
    markdown = markdown.replace(/\n\n\n+/g,"\n\n").replace(/、\s*/g,"、 ")
    markdown = markdown.replace(new RegExp("  +","g")," ")

flatten = (items)->
    return items
_stack = []
toMarkdown = (doms,option = {})->
    texts = []
    count = 0
    escapeMarkdownUrl = (string)->
        _map = {
            "(":"\\("
            ")":"\\)"
            "\\":"\\\\"
        }
        result =  string.replace /\(|\)|\\/g,(match)->
            return _map[match] or match
        return result
    for item in doms
        _stack.push item.name
        if option.filter?.length > 0 and item.name not in option.filter
            if option.plainWithoutFilter
                option.plain = true
            else
                continue
        if option.limit
            count += 1
            if count > option.limit
                break
        if item.name in ["P","div"]
            texts.push toMarkdown(item.children,option).replace(/\n+/g,"\n") + "\n\n"
        else if item.name in ["H1","H2","H3","H4","H5","H6"]
            if option.plain
                headline = ""
            else
                count = parseInt(item.name[1]) or 1
                headline = ""
                for _ in [0...count]
                    headline += "#"
                headline += " "
            texts.push "\n#{headline} #{toMarkdown(item.children,option).replace(/\n/g," ")}\n"
        else if item.name is "PRE"
            if option.plain
                texts.push "#{toMarkdown(item.children,option).replace(/\n/g," ")}\n\n"
            else
                texts.push "\b```\n"
                texts.push "#{toMarkdown(item.children,option).replace(/`/g,"\\`")}\n\n"
                texts.push "\n```\n"
        else if item.name is "QUOTE"
            if option.plain
                headline = ""
            else
                headline = "> "
            texts.push "> #{toMarkdown(item.children,option).replace(/\n/g," ")}\n\n"
        else if item.name is "TEXT_CONTENT"
            texts.push item.attrs.text?.trim?() or ""
        else if item.name is "A"
            if option.plain
                texts.push toMarkdown(item.children,{plain:true})
            else
                hint = toMarkdown(item.children,{plain:true,limit:1,plainWithoutFilter:true,filter:["IMG","TEXT_CONTENT"]}).trim()
                href = item.attrs.href or ""
                if href?.indexOf("javascript:") is 0
                    href = ""
                href = escapeMarkdownUrl(href or "")
                if not href and not hint
                    texts.push ""
                else
                    texts.push " [#{hint}](#{href}) "
        else if item.name is "SPAN"
            texts.push toMarkdown(item.children,option)
        else if item.name is "IMG"
            content = " ![#{item.attrs.alt or item.attrs.title or ""}](#{escapeMarkdownUrl(item.attrs.src or "")}) "
            if option.plain
                texts.push content
            else
                texts.push "\n#{content}\n"
        else if item.name in ["B","STRONG"]
            texts.push " *#{toMarkdown(item.children,{plain:true})}* "
        else if item.name is "BR"
            texts.push "\n"
        else if item.name in ["SCRIPT","LINK","STYLE"]
            texts.push ""
        else
            texts.push toMarkdown(item.children,option)
    #if option.sub
    #    result = result.replace(/\n/g," ")
    result = texts.join("").replace(/\r\n/g,"\n").replace(/\r/g,"\n")
    return result
module.exports = (html)=>
    stack = new HTMLStack()
    return stack.parse html
module.exports.isHTMLSimple = (html)->
    try
        complicatedTags = ["IMG","VIDEO","TABLE","NAV"]
        meaningfulTags = ["H1","H2","H3","H4","H5","H6","UL","OL","LI"]
        HTMLParser html,{
            start:(tag)->
                if tag?.toUpperCase() in complicatedTags
                    throw new Error "Not Simple!"
            chars:()->
            end:()->
        }
        return true
    catch e
        Logger.error e
        return false
