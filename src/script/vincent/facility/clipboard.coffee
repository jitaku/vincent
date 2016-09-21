html2markdown = require "/component/html2markdown"
class Clipboard
    constructor:(@editor)->
        @mime = "application/json"
        window.addEventListener "paste",(e)=>
            for item in e.clipboardData.items or {}
                type = item.type or ""
            if not @editor.buffer or not @editor.buffer.selection
                return
            if @editor.buffer.selection.isActive and not @editor.buffer.selection.isCollapsed()
                @editor.context.transact ()=>
                    @editor.buffer.selection.removeSelectedNodes()
            if not @isActive
                return
            @editor.userIsWriting = true
            try
                @pasteClipboardData e
            catch e
                Logger.error "past failure"
                Logger.error e
            @editor.userIsWriting = false
        ,true
        window.addEventListener "copy",(e)=>
            @context = @editor.context
            readonly = @context?.isReadonly
            try
                @context?.isReadonly = false
                if not @isActive
                    return
                cursor = @editor.buffer.cursor
                if @editor.buffer.selection?.isActive and not @editor.buffer.selection.isCollapsed()
                    com =  @editor.buffer.selection.copySelectedNodes()
                    result = @extractPasteCOM com
                    text = com.toHumanString()
                    @setClipboardData e,{com:result,text:text}
                else if cursor?.anchor.inside and rune = cursor.target.runeAtIndex(cursor.anchor.index)
                    wrapper = @editor.context.createElement "RichText",{contentString:""}
                    wrapper.insertRune(0,rune.clone())
                    result = @extractPasteCOM wrapper
                    @setClipboardData e,{com:result,text:rune.toHumanString?() or ""}
                else
                    #pass
                @context.isReadonly = readonly
            catch err
                Logger.error e,err,"fail to copy things"
            if @editor.platform.isMobile() and document.activeElement?.type not in ["textarea","input"]
                document.activeElement?.blur?()
                @editor.inputMethod.showVirtualKeyboard()
        ,true
        window.addEventListener "cut",(e)=>
            if not @isActive
                return
            @context = @editor.context
            readonly = @context?.isReadonly

            if readonly
                return
            @editor.userIsWriting = true
            try
                @context?.isReadonly = false
                cursor = @editor.buffer.cursor
                if @editor.buffer.selection?.isActive and not @editor.buffer.selection.isCollapsed()
                    @editor.context.transact ()=>
                        com = @editor.buffer.selection.cutSelectedNodes()
                        result = @extractPasteCOM com
                        text = com.toHumanString()
                        @setClipboardData e,{com:result,text:text}
                else if cursor?.anchor.inside and rune = cursor.target.runeAtIndex(cursor.anchor.index)
                    clone = rune.clone()
                    @editor.context.transact ()=>
                        rune.parent.reflow()
                        cursor.anchor.index = rune.startOffset
                        rune.parent.removeText rune.startOffset,rune.length
                    wrapper = @editor.context.createElement "RichText",{contentString:""}
                    wrapper.insertRune(0,clone)
                    result = @extractPasteCOM wrapper
                    @setClipboardData e,{com:result,text:rune.toHumanString?() or ""}
                @context.isReadonly = readonly
            catch e
                Logger.error e,"fail to copy things"
            if @editor.platform.isMobile() and document.activeElement?.type not in ["textarea","input"]
                document.activeElement?.blur?()
                @editor.inputMethod.showVirtualKeyboard()

            @editor.userIsWriting = false
        ,true
    extractPasteCOM:(value)->
        value = value.toJSON()
        # algo -> http://markoff.info/NStal/813993099145
        results = []
        target = value
        return value
    enable:()->
        @isActive = true
    disable:()->
        @isActive = false
    extractPasteCOM:(value)->
        #value = value.toJSON()
        parser = new COMFlattenLevel1(@editor,value)
        parser.parse()
        if parser.results.length is 0
            return null
        if parser.results
            return {
                version:"v1"
                type:"com"
                contents:parser.results
            }
        return null
#    extracePasteCOM:(value)->
#        while value.children
#            first = value.children
    setClipboardData:(e,json)->
        clip = new Clip(e)
        clip.setClipboardData({text:json.text,com:json.com})
    insertCOM:(value)->
        if value.version is "v0" or not value.version
            @pasteCOMV0(value)
        else if value.version is "v1"
            #@pasteCOMV1_2(value)
            @pasteCOMV1(value)
    insertText:(text)->
        @editor.conduct "write",text
    pasteClipboardData:(e)->
        if @editor.buffer.selection?.isActive
            @editor.buffer.selection.cancel()
        if @editor.buffer.type isnt "RichBuffer"
            return
        clip = new Clip(e)
        data = clip.getClipboardData()
        target = @editor.buffer.cursor.target
        if not target or not target.mime
            return
        e.preventDefault()
        e.stopImmediatePropagation()
        if data.image
            @editor.inputMethod.emit "image",data.image
            return
        if data.com
            if target.mime is "text/com-rich-text"
                @insertCOM(data.com)
                return
            else
                @insertText(data.text)
                return
        else if data.html and not data.com and (not html2markdown.isHTMLSimple(data.html) or window.forcePasteHTML)
            @editor.conduct "write",@editor.buffer.context.createElement "HTMLPortion",{html:data.html}
            return
        else if data.markdown
            # matching no version then we just past it
            @editor.conduct "write",data.markdown
            return
        if not data.text
            return
        if data.text and url = @extractAppUrl(data.text)
            e.preventDefault()
            @editor.conduct "write",url
            return true
        else if data.text
            @editor.conduct "write",data.text
    extractAppUrl:(text)->
        if not text
            return null
        protocols = ["https","http"]
        domains = ["miku\\.jitaku\\.io","jitaku\\.io","vuvu:9999"]
        reg = new RegExp("^\\s*(#{protocols.join("|")})://(#{domains.join("|")})/([a-z0-9_-]*)/(.*)$","i")
        match = text.trim().match reg
        if not match
            return null
        [_,protocol,domain,username,path] = match
        reservedKeyword = ["s","share"]
        if username in reservedKeyword
            return null
        currentMatch = window.location.toString().match(reg)
        currentUser = currentMatch?[3] or null
        if currentUser is username
            return "jtk://#{path}"
        else
            return "jtk:///#{username}/#{path}"
    pasteCOMV0:(value)->
        @editor.context.transact ()=>
            split = @editor.buffer.cursor.anchor?.split()
            temp = @editor.context.createElement "RichText",{contentString:""}
            node = @editor.context.createElement value
            if split or @editor.buffer.cursor.anchor.isTail()
                @editor.buffer.cursor.target.after temp
                @editor.buffer.cursor.target.after node
            else
                @editor.buffer.cursor.target.before node
                @editor.buffer.cursor.target.before temp
            @editor.buffer.cursor.pointAt temp
            @editor.buffer.cursor.anchor.head()
            @editor.caret.scrollViewPortToComfortable()
    pasteCOMV1_2:(value)->
        @editor.context.transact ()=>

            contents = value.contents.slice()
            cursor = @editor.buffer.cursor
            target = cursor.target
            target.reflow()
            if rune = target.runeAtIndex cursor.anchor.index
                cursor.anchor.index = rune.endOffset
            split = @editor.buffer.cursor.anchor?.split()
            cs = ""
            for item in contents
                rt = @editor.context.createElement item
                if not rt.sortOf "RichText"
                    Logger.error "Unexpected clip item",rt
                    continue
                cs += rt.contentString
            @editor.buffer.cursor.target.insertText @editor.buffer.cursor.anchor.index,cs
            @editor.buffer.cursor.anchor.index += cs.length
            @editor.caret.scrollViewPortToComfortable()
    pasteCOMV1:(value)->
        @editor.context.transact ()=>

            contents = value.contents.slice()
            cursor = @editor.buffer.cursor
            target = cursor.target
            target.reflow()
            if rune = target.runeAtIndex cursor.anchor.index
                if target.anchor.inside
                    cursor.anchor.index = rune.endOffset
            split = @editor.buffer.cursor.anchor?.split()
            if contents.length isnt 1 or contents[0].collapseListItems or contents[0].collapseHeadContents
                temp = @editor.context.createElement "RichText",{contentString:""}
                if split or @editor.buffer.cursor.anchor.isTail()
                    @editor.buffer.cursor.target.after temp
                    contents.reverse()
                    for item,index in contents
                        node = @editor.context.createElement item
                        @editor.buffer.cursor.target.after node
                        if index is 0
                            last = node
                else
                    for item,index in contents
                        node = @editor.context.createElement item
                        @editor.buffer.cursor.target.before node
                        last = node
                    @editor.buffer.cursor.target.before temp
                @editor.buffer.cursor.pointAt last
                @editor.buffer.cursor.anchor.tail()
            else
                rt = @editor.context.createElement contents[0]
                cs = rt.contentString
                @editor.buffer.cursor.target.insertText @editor.buffer.cursor.anchor.index,cs
                @editor.buffer.cursor.anchor.index += cs.length
            cursor = @editor.buffer.cursor
            @editor.caret.scrollViewPortToComfortable()
# docs at http://markoff.info/NStal/813993099145
class COMFlattenLevel1
    constructor:(@editor,@value)->
        @context = @editor.context
        @version = 1
    parse:()->
        @target = @value
        @parents = []
        @results = []
        @findTopRichText()
    father:()->
        return @parents[@parents.length - 1]
    findTopRichText:()->
        if not @target
            return
        if @context.namespace.sortOf(@target.type,"RichText")
            @results.push @target
            return
        if not @target.children or @target.children.length is 0
            @skipChildOnce = true
            return @stepOver()
        if @context.namespace.sortOf @target.children[0].type,"RichText"
            @skipChildOnce = true
            if @target.children.length > 1
                @results.push @target.children...
                return
            rt = @target.children[0]
            if not rt.isPartial
                @results.push rt
                return
            if rt.children and (rt.children.length > 1 or rt.children.length is 0)
                @results.push rt
                return
            if @context.namespace.sortOf rt.children[0].type,"Text"
                @results.push rt
                return
            # Rune!
            if not rt.children[0].isPartial
                @results.push rt
                return
            parser = new COMFlattenLevel1(@editor,rt.children[0])
            parser.parse()
            if parser.results.length > 0
                @results.push parser.results...
            return

        while @stepOver()
            @findTopRichText()
    stepOver:()->
        # goto child
        if @target.children and @target.children[0] and not @skipChildOnce
            @parents.push @target
            @target = @target.children[0]
            return true
        @skipChildOnce = false
        # go for brother
        father = @father()
        if not father
            return false
        index = father.children.indexOf(@target)
        if index < father.children.length - 1
            @target = father.children[index + 1]
            return true
        # go for parent
        while father = @parents.pop()
            grand = @father()
            if not grand
                return false
            index = grand.children.indexOf(father)
            if index < grand.children.length - 1
                @target = grand.children[index + 1]
                return true
        return false
class Clip
    constructor:(@e)->
    setClipboardData:(data)->
        e = @e
        if data.text
            e.clipboardData.setData "text/plain",data.text
        if data.com
            comString = JSON.stringify(data.com)
            e.clipboardData.setData "application/json",comString
            e.clipboardData.setData "text/html",@encodeHTMLCOM(comString,data.text)
        e.preventDefault()

    getClipboardData:()->
        e = @e
        text = e.clipboardData.getData "text/plain"
        json = e.clipboardData.getData "application/json"
        html = e.clipboardData.getData "text/html"
        result = {
            text
        }
        for item in e.clipboardData.items or {}
            type = item.type or ""
            if type.indexOf("image/") is 0
                blob = item.getAsFile()
                if blob instanceof Blob
                    result.image = {
                        blob
                        related:{text,json,html}
                    }
                    e.preventDefault()
                    e.stopImmediatePropagation()
        e.preventDefault()
        if json
            try
                result.com = JSON.parse json
            catch e
                result.com = null
        if html
            result.html = html
        if html and not result.com
            try
                result.com = JSON.parse @decodeHTMLCOM html
            catch e
                result.com = null
        if html and not result.com
            try
                markdown = html2markdown(html)
                result.markdown = markdown
            catch e
                Logger.error e#,html
        return result
    decodeHTMLCOM:(htmlComString)->
        div = document.createElement("div")
        div.innerHTML = htmlComString
        pre = div.querySelector("[com]")
        content = decodeURIComponent pre?.getAttribute("com") or ""
        return content or null

    encodeHTMLCOM:(comString,text)->
        return "<pre com=\"#{encodeURIComponent comString}\" style=\"\">#{text}</pre>"
module.exports = Clipboard
