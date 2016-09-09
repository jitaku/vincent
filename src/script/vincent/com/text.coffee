COMNode = require "./node"
COMVisualPosition = require "./visualPosition"
COMDecorationPolicy = require "./decorationPolicy"
Decoration = require "./decoration"
Operation = require "./operation"

class COMText extends COMNode
    type:"Text"
    toString:()->
        return @contentString
    isEmpty:()->
        return @contentString.length is 0
    toHumanString:()->
        return @toString()
    constructor:(@context,@data = {})->
        @skipDirtyCheck = true
        @contentString = @data.contentString?.toString?() or ""
        @decorationPolicy = new COMDecorationPolicy(this).behave {
            behavior:"default"
        }
        @decorationMaintainers = []
        @decorations = []
        @editIndex = 0
        @__defineGetter__ "holder",()->
            if not @cache
                return null
            if not @cache.holder
                @cache.holder = document.createElement("span")
                @cache.holder.innerHTML = " "
                @cache.holder.classList.add "com-text-holder"
            return @cache.holder
        @__defineGetter__ "partials",()->
            return @cache.partial or []
        @__defineSetter__ "partials",(value)->
            return @cache.partial = value
        @appearance ?= {
            tagName:"span"
            classList:["com","com-text"]
        }
        #@keepNewlineSpace = true
        # Temperoryly disable holder.
        # Now holder is provided by richtext(parent).
        # We may remove it after I confirm it's totaly useless.
        @__defineGetter__ "withHolder",()=>
            return @_withHolder
        @__defineSetter__ "withHolder",(v)=>
            if v isnt @_withHolder
                @dirty = true
            @_withHolder  = v
            return @_withHolder
        @withHolder = @data.withHolder
        super(@context)
        @__defineGetter__ "length",()->
            return @contentString.length
    mergeInPlace:(target)->
        target.remove()
        @insertText @contentString.length,target.contentString
        return true
    splitInPlace:(index,option = {})->
        if index >= @contentString.length
            return null
        if index is 0
            return null
        next = @contentString.slice(index)
        @removeText index
        next = new COMText(@context,{contentString:next})
        @after(next)
        return next
    render:(rc)->
        super(rc,{force:true})
        @computePartials()
        frag = document.createDocumentFragment()
        for partial,index in @partials
            partial.el = document.createElement "span"
            partial.el.classList.add "com-text-part"
            partial.el.com = this
            partial.el.comText = this
            partial.el.comPartial = partial
            content = partial.content
            if index is @partials.length - 1 and @blockTail and content.slice(-1) is "\n"
                if @keepNewlineSpace
                    content = content.slice(0,-1) + " "
                else
                    content = content.slice(0,-1) + ""
            partial.textNode = document.createTextNode content.toString()
            partial.el.appendChild partial.textNode
            for dec in partial.decorations
                dec.apply partial.el
            frag.appendChild partial.el
        if @withHolder
            frag.appendChild @holder
        for property,value of @domProperty or {}
            @el?.setAttribute property,value
        #@el.innerHTML = ""

        container = @specifyTextContainer()
        container.innerHTML = ""
        container.appendChild frag
    specifyTextContainer:()->
        return @el
    computePartials:()->
        partials = []
        cuts = [0,@contentString.length]
        for dec in @decorations
            for item,index in cuts
                if item is dec.start
                    break
                if item < dec.start
                    continue
                else
                    cuts.splice(index,0,dec.start)
                    break
            for item,index in cuts
                if item is dec.end
                    break
                if item < dec.end
                    continue
                else
                    cuts.splice(index,0,dec.end)
        decorations = @decorations.slice()
        for cut,index in cuts
            nextCut = cuts[index+1]
            if not nextCut
                break
            part = {
                decorations:[]
                content:@contentString.slice(cut,nextCut)
            }
            nextDec = []
            for dec in decorations
                if dec.end <= cut
                    continue
                nextDec.push dec
                if dec.start >= nextCut
                    continue
                part.decorations.push dec
            decorations = nextDec
            partials.push part
        @partials = partials
        return @partials

    computePartialsBad:()->
        partials = []
        partStart = 0
        decorations = @decorations.slice()

        lastCombination = ""
        lastDecRef = []
        # do declare decRef twice
        for index in [0...@contentString.length]
            combination = ""
            decDirty = false
            decRef = []
            decorations = decorations.filter (dec,decIndex)->
                if index < dec.start
                    return true
                else if index >= dec.end
                    return false
                combination += dec.mid+"-"
                decRef.push dec
            if combination isnt lastCombination and index > 0
                c = @contentString.slice(partStart,index)
                partials.push {
                    content:@contentString.slice(partStart,index)
                    decorations:lastDecRef
                }
                partStart = index
            lastCombination = combination

            lastDecRef = decRef
        if partStart  < @contentString.length
            partials.push {
                    content:@contentString.slice(partStart,@contentString.length)
                    decorations:lastDecRef or []
            }
        @partials = partials
        return @partials
    insertText:(start,value)->
        if typeof start isnt "number"
            Logger.error "cant insert text at #{start}"
            return false
        if not value
            Logger.error "insert text request value provided"
            return false
        result = @context.operate new InsertTextOperation(@context,this,{start,value})
        if result
            @pend()
            return true
        return false
    setDecorations:(decorations)->
        @context.operate new Decoration.ChangeDecorationOperation @context,this,{decorations}
    removeText:(start,length)->
        if typeof start isnt "number"
            return false
        if typeof length isnt "number"
            length = @contentString.length - start
        if start >= @contentString.length
            return false
        if start + length > @contentString.length
            return false
        result = @context.operate new RemoveTextOperation @context,this,{start,length}
        if result
            @pend()
            return true
        return false
    getVisualBorder:(index,relativeToCursor)->
        if @dirty and not @skipDirtyCheck

#            window.inspectProperty this,"dirty",(type,o,n)->
#                if type is "set" and not n
            Logger.error "dirty query",@root,this,@dirty,@context,@rc.id,@cache.rev,@rev
            throw new Error "shouldn't get caret position when dirty"
        # If position is "right" I should use the right border of the text part
        # If position is "left" I should use the left border of the text part
        if relativeToCursor not in ["left","right"]
            relativeToCursor = "left"
        offset = 0
        target = null
        if relativeToCursor not in ["left","right"]
            return true
        # special case for handling block tail
        # block tail is used for replace last "\n" in richtext into a placeholder
        # since we are actually block level DOM elemen.

        if @blockTail and index is @contentString.length - 1
            part = @partials[@partials.length - 1]
            content = part.content
            lastChar = content[content.length - 1]
            if lastChar is "\n" and @blockTail and @withHolder
                if relativeToCursor is "right"
                    nodes = [].slice.call @holder.parentElement.childNodes
                    holderIndex = nodes.indexOf @holder
                    return new COMVisualPosition.COMVisualBorder {
                        node:@holder.parentElement
                        offset:holderIndex
                        position:"left"
                        priority:@leftCaretPriority
                    }
                # relative is left so, it's ok because we will use the
        for part,partIndex in @partials
            if offset is index
                if relativeToCursor is "left"
                    previous = @partials[partIndex - 1]
                    # At left side of cursor
                    # use the previous char's right border
                    if previous
                        target = previous
                        partialOffset = target.content.length - 1
                        position = "right"
                        break
                    else
                        target = part
                        partialOffset = 0
                        position = "left"
                        break
                else
                    target = part
                    partialOffset = 0
                    position = "left"
                    break
            if offset + part.content.length > index
                partialOffset = index - offset
                target = part
                position = "left"
                break
            offset += part.content.length
        if offset is index and not target
            # empty
            if offset is 0
                if @withHolder and @holder and @holder.parentElement
                    nodes = [].slice.call @holder.parentElement.childNodes
                    holderIndex = nodes.indexOf @holder
                    return new COMVisualPosition.COMVisualBorder({
                        node:@holder.parentElement
                        offset:holderIndex
                        position:"left"
                        priority:@leftCaretPriority or 0
                    })
            target = @partials[@partials.length - 1]
            if relativeToCursor is "right"
                if target
                    partialOffset = target.content.length - 1
                    position = "right"
            else if relativeToCursor is "left"
                if @holder and @holder.parentElement and @withHolder
                    nodes = [].slice.call @holder.parentElement.childNodes
                    holderIndex = nodes.indexOf @holder
                    return new COMVisualPosition.COMVisualBorder({
                        node:@holder.parentElement
                        offset:holderIndex
                        position:"left"
                        priority:@leftCaretPriority or 0
                    })
                else
                    # return last char of the last ()
                    last = @partials[@partials.length - 1]
                    return new COMVisualPosition.COMVisualBorder {
                        node:last.textNode
                        offset:last.textNode.length - 1
                        position:"right"
                        priority:@leftCaretPriority or 0
                    }
            else if target
                partialOffset = target.content.length - 1
                position = "right"
        if not target
            return null
        if position is "left"
            priority = @leftCaretPriority or 0
        else
            priority = @rightCaretPriority or 0
        return new COMVisualPosition.COMVisualBorder({
            node:target.textNode
            offset:partialOffset
            position:position
            priority:priority
        })

    getCorrespondingBoundaryByOffset:(index,option = {})->
        # We currently skip dirty check
        if @dirty and not @skipDirtyCheck
            Logger.error "dirty query",@root,this,@dirty,@context,@rc.id,@cache.rev,@rev
            throw new Error "shouldn't get caret position when dirty"
        offset = 0
        for part in @partials
            offset += part.content.length
            if index < offset
                target = part
                partialOffset = index - (offset - part.content.length)
                break
        # In somecase such as followed by a Rune
        # we have to handle the cursor at tail of text.
        # I use the last char of me
        if index is offset
            target = @partials[@partials.length - 1] or null
            if not target
                return null
            partialOffset = target.content.length
            return node:target.textNode,offset:partialOffset,via:"Text"
        if not target
            return null
        char = target.textNode.textContent[partialOffset - 1]
        # try my best to return the right side of it
        if partialOffset > 0 and option.right and char isnt "\n"

            return node:target.textNode,offset:partialOffset - 1,via:"Text",type:"right"
        else
            return node:target.textNode,offset:partialOffset,via:"Text"
        return null
    detectTextOffset:(textNode,index)->
        if @dirty and not @skipDirtyCheck
            throw new Error "shouldn't detect textoffset when dirty"
        offset = 0
        if textNode is @holder?.childNodes[0]
            if @blockTail and @contentString.slice(-1) is "\n"
                return {
                    offset:@length - 1
                }
            else
                return {
                    offset:@length
                }
        for part,partIndex in @partials
            if part.el.contains(textNode)
                fix = 0
                # fix block tail \n, \n is actually at next line not current line

                if @blockTail and @keepNewlineSpace and index is textNode?.length and part.content.slice(-1) is "\n" and partIndex is @partials.length - 1
                    fix -= 1
                return {
                    offset:offset + index + fix
                    part:part
                }
            offset += part.content.length
        if @el.contains textNode
            return {
                offset:@length
            }
        return null

    toJSON:(option)->
        json = super(option)
        if not json
            return null
        json.contentString = @contentString
        return json
    toHumanString:()->
        return @contentString
class InsertTextOperation extends Operation.EditOperation
    name:"InsertTextOperation"
    invoke:()->
        text = @target or @context.root.getChildByPath(@path)
        if typeof @option.start isnt "number" or @option.start > text.length
            @error "insert at #{@option.start} of text with length #{text.length}"
            return false
        if not @option.value or typeof @option.value isnt "string"
            @error "insert value of #{@option.value}"
            return false
        if text not instanceof COMText
            @error "target not instanceof COMText"
            return
        text.contentString = text.contentString.slice(0,@option.start) + @option.value + text.contentString.slice(@option.start)
        text.dirty = true
        text.parent?.pend()
        return true
    revoke:()->
        text = @target or @context.root.getChildByPath(@path)
        if text not instanceof COMText
            @error "target not instanceof COMText"
            return
        if typeof @option.start isnt "number" or @option.start + @option.value.length > text.length
            @error "revoke insert at #{@option.start} of text with length #{text.length}"
            return false
        if not @option.value
            @error "revoke insert value of #{@option.value}"
            return false
        if text.contentString.slice(@option.start,@option.start + @option.value.length) isnt @option.value
            @error "revoke insert value of #{@option.value} but the text in the corresponding area is #{text.contentString.slice(@option.start,@option.start + @option.value.length)}"
            return false
        text.contentString = text.contentString.slice(0,@option.start) + text.contentString.slice(@option.start+@option.value.length)
        text.dirty = true
        text.parent?.pend()
        return true
    describe:()->
        return "#{@name}: insert text \"#{@option.value}\" at #{@option.start}"
class RemoveTextOperation extends Operation.EditOperation
    name:"RemoveTextOperation"
    invoke:()->
        text = @target or @context.root.getChildByPath(@path)
        if text not instanceof COMText
            @error "target not instanceof COMText"
            return
        if typeof @option.start isnt "number" or @option.start > text.length
            @error "remove at #{@option.start} of text with length #{text.length}"
            return false
        if not @option.length
            @option.length = text.contentString.length - @option.start
            return false
        if @option.start + @option.length > text.length
            @error "remove at #{@option.start} length #{@option.length} exceed the contentString length of #{text.length}"
            return false
        @option.removed = text.contentString.slice(@option.start,@option.start + @option.length)
        text.contentString = text.contentString.slice(0,@option.start) + text.contentString.slice(@option.start+@option.length)
        #text.pend()
        text.dirty = true
        text.parent?.pend()
        return true
    revoke:()->
        text = @target or @context.root.getChildByPath(@path)
        if text not instanceof COMText
            @error "target not instanceof COMText"
            return
        if typeof @option.start isnt "number" or @option.start > text.length
            @error "revoke at start #{@option.start} but with text with length #{text.length}"
            return false
        if not @option.removed
            @error "revoke value of #{@option.value}"
            return false
        text.contentString = text.contentString.slice(0,@option.start) + @option.removed + text.contentString.slice(@option.start)
        #text.pend()
        text.dirty = true
        text.parent?.pend()
        return true
    describe:()->
        return "#{@name}: remove text at #{@option.start}~#{@option.start + @option.length}"
module.exports = COMText
