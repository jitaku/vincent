COMNodeList = COM.COMNodeList
COMRichText = COM.COMRichText
COMSpell = COM.COMSpell
COMOperation = COM.COMOperation

class HeadlineHead extends COMSpell
    reg = /^\s*#{1,6} /
    type:"HeadlineHead"
    render:(rc)->
        super(rc)
    test:(contentString = "")->
        match = contentString.match reg
        if match
            return {
                start:match.index
                end:match.index + match[0].length
                match:match
            }

        # Hot fix for caret position of headline `#`
        # , maybe a caret policy in future

        @noTailingBoundary = true
        return null
    constructor:(@context,@option = {})->
        # If no eye catching, then home/end key will ignore the spell
        # As scope
        @noEyeCatching = true
        @appearance ?= {
            tagName:"span"
            classList:["com","com-headline-head","com-text"]
        }
        super(@context,@option)
    compose:()->
        if super()
            return true
        retain = /^\s*#{1,6} $/
        if not retain.test @contentString
            @toNormalTextInPlace()
            @dirty = true
            @parent?.dirty = true
            return true
        @acknowledge()
        return false
    acknowledge:()->
        result = @contentString.match(reg)
        if not result
            throw new Error "logic error, unexpected unmatch of #{@contentString}"
            return

        level = result[0].replace(/\s/g,"").length
        if @level isnt level
            @parent.setLevel(level)
            @dirty = true
        @level = level

class Headline extends COMRichText
    @initContext = (context)->
        # So we make sure there are not default title left
        # And we decide don't preserve previous title, this may not be good experience
        # But it's more understandable a design.
        context.setMeta "title",""
        if not context.get "headlines"
            context.set "headlines",list = new COMNodeList()
            context.set "titleMaintainer",new TitleMaintainer context,list
        #context.metas.title = ""
    type:"Headline"
    isSingleLine:true
    getPrefix:()->
        match = @contentString.match /^\s*#+ +/
        return match[0]
    toPlainString:()->
        string = super()

        return string.replace(/^\s*#+\s+/,"").trim()

    getTitle:()->
        return @toPlainString()
        #return @toHumanString({noRecursive:true})?.replace(/^\s*#+\s+/,"").trim()
    constructor:(@context,@data = {})->
        @appearance = {
            tagName:"h1"
            classList:["com","com-rich-text","com-headline","com-el-single-line"]
        }
        @privateSpells = [HeadlineHead]
        super @context,@data
        @isCollapsed = false
        @collapseHeadContents = []
        @level = @data.level or 1
        if @data.collapseHeadContents and @data.collapseHeadContents.length > 0
            for item in @data.collapseHeadContents
                @collapseHeadContents.push @context.createElement item
            @isCollapsed = true
        @composePolicy.behave {
            borrow: true
            lend: false
            tailingNewline: true
        }
        @layout = "block"
    onRootAvailable:()->
        super()
        if not list = @context.get "headlines"
            return
        list.add this
    onRootDispel:()->
        super()
        if not list = @context.get "headlines"
            return
        list.remove this
    clone:()->
        result = super()
        if not result
            return result
        if @isCollapsed
            result.isCollapsed = @isCollapsed
            result.collapseHeadContents = (item.clone() for item in @collapseHeadContents)
        return result
    slice:(option)->
        slice = super(option)
        if not slice
            return null
        if slice.isPartial and not slice.looseComplete
            return slice
        return @clone()
    toHumanString:(option = {})->
        result = [super()]
        if @isCollapsed and not option.noRecursive
            for item in @collapseHeadContents
                result.push item.toHumanString()
        return result.join ""
    toJSON:(option)->
        json = super(option)
        if not json
            return null
        json.level = @level
        if @isCollapsed
            json.isCollapsed = true
            results = []
            for item in @collapseHeadContents
                results.push item.toJSON()
            json.collapseHeadContents = results
        return json
    render:(rc)->
        if @isCollapsed
            @forceHolder = true
            @placeholder = "..."
        else
            @forceHolder = false
            @placeholder = ""

        super(rc)
        classList = (item for item in @el.classList)
        for item in classList
            if item.indexOf("com-headline-level") is 0
                @el.classList.remove item
        @el.classList.add "com-headline-level-#{@level or 0}"
        if @voidContent
            @el.classList.add "void-content"
        else
            @el.classList.remove "void-content"
        if @isCollapsed
            @el.classList.add "collapsed"
        else
            @el.classList.remove "collapsed"
    trigger:(option = {})->
        if not option.force and not @isCollapsed and option.via isnt "tap"
            return false
        if @isCollapsed
            return @expand()
        else
            return @collapse()
        return false
    collapse:()->
        if @isCollapsed
            return false
        target = this
        items = []
        while true
            next = target.next()
            if not next
                break
            if not next.sortOf("Headline") or next.level > @level
                items.push next
                target = next
                continue
            break
#        for item in items.slice() by -1
#            if /^\s*$/.test item.contentString
#                items.pop()
#            else
#                break
        if items.length is 0
            return false
        @context.operate new CollapseHeadContentOperation @context,this,{items}
        for item in items
            item.remove()
        return true
    expand:()->
        if not @isCollapsed
            return false
        items = @collapseHeadContents.slice()
        items.reverse()
        for item in items
            @after item
        @context.operate new ExpandHeadContentOperation @context,this,{}
        return true
    toContentString:()->
        if not @isCollapsed
            return @contentString
        after = ""
        for item in @collapseHeadContents
            after += item.toContentString()
        return @contentString + after
    setLevel:(level)->
        if @level isnt level
            @dirty = true
            @level = level
            prefix = @getPrefix()
            @removeText(0,prefix.length)
            prefix = ""
            for item in [0...@level]
                prefix += "#"
            prefix += " "
            @insertText(0,prefix)
        return true
    compose:()->
        if super()
            return true
        @voidContent = false
        for child in @children
            if child instanceof HeadlineHead
                length = child.contentString.length
                if /^\s*$/.test @contentString.slice(length)
                    @voidContent = true
                    @dirty = true
                break
        return false
class TitleMaintainer extends Leaf.EventEmitter
    constructor:(@context,@headlines)->
        super()
        @headlines.listenBy this,"change",()=>
            @headlines.sort()
            @maintain @headlines.first()
    getTitle:()->
        return @headline?.getTitle() or null
    maintain:(headline)->
        if headline is @headline
            return
        if @headline
            @headline.stopListenBy this
        @headline = headline
        if not @headline
            @setTitle ""
            return
        @setTitle @headline.getTitle()
        @headline.listenBy this,"pend",()=>
            @headline.context.nextCompose ()=>
                if @headline and @headline.root
                    @setTitle @headline.getTitle()
    setTitle:(title)->
        @context.set "title",title
        @context.setMeta "title",title
        #@context.metas.title = title

class CollapseHeadContentOperation extends COMOperation.EditOperation
    name:"CollapseHeadContentOperation"
    invoke:()->
        @target.collapseHeadContents = @option.items or []
        @target.isCollapsed = true
        @target.pend()
        return true
    revoke:()->
        @target.collapseHeadContents = []
        @target.isCollapsed = false
        @target.pend()
        return true
class ExpandHeadContentOperation extends COMOperation.EditOperation
    name:"ExpandHeadContentOperation"
    invoke:()->
        @option.items = @target.collapseHeadContents.slice()
        @target.isCollapsed = false
        @target.collapseHeadContents = []
        @target.pend()
        return true
    revoke:()->
        @target.isCollapsed = true
        @target.collapseHeadContents = @option.items.slice()
        @target.pend()
        return true

module.exports = Headline
