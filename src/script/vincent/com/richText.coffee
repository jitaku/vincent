COMContainer = require "./container"
COMPath = require "./path"
COMRune = require "./rune"
COMSpell = require "./spell"
COMText = require "./text"
Operation = require "./operation"

COMTravelPolicy = require "./travelPolicy"
COMComposePolicy = require "./composePolicy"
COMComposer = require "./composer"

Errors = require "./errors"
COMRichTextAnchor = null
class COMRichText extends COMContainer
    @packs = []
    type:"RichText"
    mime:"text/com-rich-text"
    isSingleLine:false
    constructor:(@context,@option = {})->
        @appearance ?= {
            tagName:"span"
            classList:["com","com-rich-text"]
        }
        @decorationMaintainers = []
        @availableSpells ?= []
        @disableTextHolder = false
        for item in @context.namespace.decorations
            @decorationMaintainers.push item
        for item in @context.namespace.spells
            @availableSpells.push item
        if @privateSpells
            @availableSpells.push @privateSpells...
        @placeholder = @option.placeholder
        @__defineGetter__ "contentString",()=>
            # have content string buffer
            if @_contentString isnt null
                return @_contentString
            @_contentString = (@children.map (item)->item.contentString or "").join("")
            return @_contentString
        @__defineSetter__ "contentString",(cs)=>
            @empty()
            @append new COMText(@context,{contentString:cs,passive:true})
            @pend()
        @__defineGetter__ "length",()=>
            if @_length >= 0
                return @_length
            return @reflow()

        super(@context,@option)
        if @option.contentString or @children.length is 0
            @contentString = @option.contentString or ""
        @__defineGetter__ "holder",()->
            if not @cache
                return null
            if not @cache.holder
                @cache.holder = document.createElement("span")
                @cache.holder.textNode = document.createTextNode ""
                @cache.holder.appendChild @cache.holder.textNode
                @cache.holder.classList.add "com-holder"
                @cache.holder.com = this
            return @cache.holder
        @travelPolicy = new COMTravelPolicy(this).behave {
            write:"enable"
            forwardChar:"enable"
            backwardChar:"enable"
            deleteChar:"enable"
            forwardBypassed:"handover"
            backwardBypassed:"handover"
            deleteBypassed:"handover"
            head:"enable"
            tail:"enable"
            startOfLine:"boundary"
            endOfLine:"handover"
            tailBoundary:"pass"
        }
        @layout = "block"
        @composePolicy = new COMComposePolicy(this).behave {
            newlineSplitHead: true
            newlineSplitTail: true
            tailingNewline: false
            headingNewline: false
            borrow: false
            lend: true
        }
        if not COMRichTextAnchor
            COMRichTextAnchor = require "./richTextAnchor"
        @anchor = new COMRichTextAnchor(this)
    cutOut:(offset)->
        @reflow()
        for item in @children
            if item.endOffset >= offset
                target = item
                break

        if not target
            return null
        if item.sortOf("Rune") or item.endOffset is offset
            offset = item.endOffset
        else
            item.splitInPlace(offset - item.startOffset)
        index = @indexOf(item)
        children = @children.slice(index + 1)
        @removeChildren(children)
        result = @context.createElement "RichText",{}
        for item in children
            result.append item
        return result
    pend:()->
        @_contentString = null
        @_length = -1
        super()
    getRunes:()->
        return @children.filter (item)->item.sortOf("Rune")
    isStartOfChar:(char)->
        first = @children[0]
        if not first or not first.sortOf("Text")
            return false
        return first.contentString.slice(0,1) is char
    isEndOfChar:(char)->
        last = @last()
        if not last or not last.sortOf("Text")
            return false
        return last.contentString.slice(-1) is char
    isEmpty:()->
        return @children.length is 0 or (@children.length is 1 and @children[0].isEmpty()) and true
    append:(item)->
        if item not instanceof COMText and item not instanceof COMRune
            throw new Errors.LogicError "COMRichText only support COMSpell or COMText as child"
        super(item)
    reflow:()->
        offset = 0
        for item,index in @children
            item.startOffset = offset
            offset += item.length
            item.endOffset = offset
        @_length = offset
        return offset
    borrowFirstLine:()->
        if not @composePolicy.lend
            return ""
        cs = @contentString
        index = cs.indexOf("\n")
        if index < 0
            return ""
        @removeText 0,index + 1
        return cs.slice(0,index + 1)
    borrowHeadingNewline:()->
        if not @composePolicy.lend
            return false
        if @contentString[0] is "\n"
            @removeText 0,1
            return true
        return false
    borrowTailingNewline:()->
        if not @composePolicy.lend
            return false
        if @contentString.slice(-1) is "\n"
            @removeText @contentString.length - 1
            return true
        return false
    render:(rc)->
        solved = false
        modified = @beforeMark("hasDetachedChild") or @beforeMark("hasAttachedChild")
        next = @next()
        # Ensure holder state
        # holder is for ensuring HTML correct rendering the space and new line
        if @children.length is 0 or (@children.length is 1 and @children[0].length is 0) or @forceHolder
            @holder.textNode.textContent = @placeholder or ""
            if @trigger and not @holder.withClick
                @holder.withClick = true
                @holder.onclick = ()=>
                    @context.transact ()=>
                        @trigger?({via:"holder"})
        else
            @holder.textNode.textContent = ""
        # See COMText.blockTail for detail
        if @layout is "block"
            for item,index in @children
                item.blockTail = false
                if index is @children.length - 1 and item.sortOf("Text") and next
                    item.blockTail = true
        if not @beforeMark "hasAttachedChild"
            for item,index in @children
                if item.richTextIndex isnt index
                    modified = true
                    item.richTextIndex = index
        if @beforeMark("hasDetachedChild") and @domContainer
            removes = []
            for item in @domContainer.children
                if item.com not in @children and item isnt @holder
                    removes.push item
            for item in removes
                @domContainer.removeChild(item)
        if modified and @domContainer
            for child in @children
                if child.dirty
                    child.render(rc)
                    child.afterRender()
            # try only insert the missing one
            #counter = 0

            # Check from tail to head
            for child,index in @children by -1
                next = @children[index + 1]
                # First(tail)
                if not next
                    # Multi element child
                    if not child.elAfter
                        nes = child.el.nextElementSibling
                    else
                        nes = child.elAfter.nextElementSibling
                    hasCorrectParent = true
                    for el in [child.el,child.elBefore,child.elAfter]
                        if not el
                            continue
                        if el and el.parentElement isnt @domContainer
                            hasCorrectParent = false
                            break
                    if not hasCorrectParent or (nes and nes isnt @holder)
                        #counter += 1
                        if child.elBefore
                            @domContainer.appendChild child.elBefore
                        @domContainer.appendChild child.el
                        if child.elAfter
                            @domContainer.appendChild child.elAfter
                    continue
                if next.elBefore
                    neAnchor = next.elBefore
                    nesShould = next.elBefore.previousElementSibling
                else
                    neAnchor = next.el
                    nesShould = next.el.previousElementSibling
                hasCorrectParent = true
                for el in [child.el,child.elBefore,child.elAfter]
                    if not el
                        continue
                    if el and el.parentElement isnt @domContainer
                        hasCorrectParent = false
                        break
                if child.elAfter
                    ctail = child.elAfter
                else
                    ctail = child.el
                # Dirty, insert all three possible el to correct place.
                if not hasCorrectParent or nesShould isnt ctail
                    if child.elBefore
                        @domContainer.insertBefore child.elBefore,neAnchor
                    if child.el
                        @domContainer.insertBefore child.el,neAnchor
                    if child.elAfter
                        @domContainer.insertBefore child.elAfter,neAnchor
                else if child.elAfter
                    Logger.error "cel pass"
            solved = true
        super(rc,{recursive:true,selfless:not modified or solved})
        if @holder.parentElement isnt @domContainer or @holder.nextSibling
            @domContainer.appendChild(@holder)
    compose:()->
        if super()
            return true
        #hasRunes = @recoverRunes()
        retained = @retainSpells()
        normalized = @normalizeTexts()
        casted = @castSpells()
        normalized = @normalizeTexts()
        # recover rune at last because spell may change runes string
        hasRunes = @recoverRunes()
        @computeDecoration()
        if not @disableTextHolder
            for item,index in @children
                if index isnt @children.length - 1
                    item.withHolder = false
                else
                    item.withHolder = true
        changed = retained or normalized or casted
        if changed
            return true
        @acknowledge?()

        return false
    recoverRunes:()->
        children = @children.slice()
        reg = new RegExp("#{COMRune.RunePlaceBegin}([0-9]+)#{COMRune.RunePlaceEnd}")
        for item in children
            if item.type isnt "Text"
                continue
            while true
                result = item.contentString.match reg
                if not result
                    break
                if @mime isnt "text/com-rich-text"
                    item.removeText(result.index,result[0].length)
                    once = true
                    continue
                rune = @context.runeCache.cloneByCid result[1]
                if not rune
                    break
                item.removeText(result.index,result[0].length)
                after = item.splitInPlace(result.index)
                if result.index is 0
                    item.before rune
                else
                    item.after rune
                if not after
                    break
                item = after
                once = true
        return once or false
    retainSpells:()->
        result = false
        for item in @children
            if item instanceof COMSpell
                result = item.compose() or result
        return result
    castSpells:()->
        @reflow()
        cs = @contentString
        texts = []
        start = 0
        text = ""
        # Have all texts/spells merged togather.
        # So onlybe separated by runes.
        for item in @children.slice(0)
            if item.sortOf("Text")
                if not text
                    start = item.startOffset
                text += item.contentString
            else
                texts.push {content:text,start:start}
                text = ""
        if text
            texts.push {content:text,start}
        results = []
        for Spell in @availableSpells by - 1
            nexts = []
            offsetStart = 0
            for text,index in texts
                start = text.start
                candidate = text.content
                parts = []
                while candidate and match = Spell::test candidate,start,cs
                    if match.start is match.end
                        throw new Error "parse empty spell content"
                    before = candidate.slice(0,match.start)
                    content = candidate.slice(match.start,match.end)
                    after = candidate.slice(match.end)
                    if before
                        parts.push {start:start,content:before}
                    start += before.length
                    # consumed content is ignored then
                    #if content
                    #    parts.push {start:start,content:content}
                    results.push {
                        Spell
                        start:start
                        content:content
                    }
                    start += content.length
                    candidate = after
                if candidate
                    parts.push {start,content:candidate}
                nexts.push parts...
            texts = nexts

        results.sort (a,b)->
            return a.start - b.start

        # Warning:
        # If a spell fail to compose herself when she isnt'ed tested out,
        # then the count will mismatch, but castAllSpells don't check missing
        spells = @children.slice(0).filter (item)->item.sortOf("Spell")
        if results.length isnt spells.length
            @castAllSpells(results)
            return true
        for result,index in results
            spell = spells[index]
            if result.start is spell.startOffset and result.content.length is spell.length
                continue
            @castAllSpells(results)
            return true
        return false
    castAllSpells:(spells)->
        if spells.length is 0
            return
        #if window.onceRUN > 100
        #    return
        #
        #window.onceRUN ?= 0
        #window.onceRUN += 1
        #return

        @reflow()
        for info in spells
            index = @getChildTextIndexByOffset info.start
            target = @children[index]
            end = info.start + info.content.length
            while end > target.endOffset
                next = @children[index+1]
                if not next
                    break
                target.mergeInPlace next
                target.endOffset += next.length
            spell = new info.Spell(@context,{})
            startOffset = info.start - target.startOffset
            endOffset = startOffset + info.content.length
            spell.castToText target,startOffset,endOffset
    castSpellsOld:()->
        contentString = @contentString
        result = null
        for Spell in @availableSpells by -1
            texts = @children.slice().filter (item)-> return item.type is "Text"
            for text in texts
                result = @castSpellOn(Spell,text,contentString) or result
                if result
                    Logger.error "cast spell on",[text.toString()],Spell,texts.length
        return result
    castSpellOnOld:(Spell,text,contentString)->
        contentString = contentString or @contentString
        while text and result = Spell::test text.contentString,text.startOffset,contentString
            spell = new Spell(@context,{match:result.match})
            last = spell.castToText(text,result.start,result.end)
            text = last
            success = true
        return success

    normalizeTexts:()->
        if @noAutoMerge
            return false
        canMerge = (a,b)->
            return a.type is "Text" and b.type is "Text"
        if @children.length is 1
            return
        texts = @children.slice()
        retain = false
        prev = null
        for item,index in texts
            if item.length is 0 and index isnt texts.length - 1
                hasMerge = true
                item.remove()
                continue
            if not prev
                prev = item
                continue
            if canMerge(prev,item)
                prev.mergeInPlace item
                hasMerge = true
            else
                prev = item
        return hasMerge or false
    getBreakString:(count,breakChar = "\uE1F8")->
        # fast string repeat algo via stack overflow
        # http://stackoverflow.com/questions/202605/repeat-string-javascript
        pattern = breakChar
        if count < 1
            return ""
        result = ""
        while count > 1
            if count & 1
                result += pattern
            count >>= 1
            pattern += pattern
        return result + pattern
    getDecorationString:()->
        str = ""
        for item in @children
            behavior = item.decorationPolicy.behavior
            if behavior is "break"
                str += @getBreakString(item.length)
            else if behavior is "singular"
                # Using a "X" instead of " ", so the rune is regarded as
                # a string of char
                str += @getBreakString(item.length,"X")
            else
                str += item.contentString or ""
        return str
    computeDecoration:()->
        content = @getDecorationString()
        decorations = []
        for maintainer in @decorationMaintainers
            decorations.push (maintainer.compute content)...

        decorations.sort (a,b)->
            # we assume
            # if a.start === b.start
            # then (a.end - b.end) will do the determination
            # 1 million char should be large enouth?
            MAX_TEXTCOUNT = 1000001
            return a.start - b.start + (a.end - b.end)/MAX_TEXTCOUNT
        # escape decoration that start/end in a spell
        valid = []

        @reflow()

        disableRegions = []

        # ignore decorations in most spell
        #for item in @children
        #    if item.ignoreDecoration# and false
        #        disableRegions.push {start:item.startOffset,end:item.endOffset,allowWrapping:item.allowWrapping}
        decIndex = 0
        validDecs = decorations.slice()
        for disItem,disIndex in disableRegions
            while true
                dec = validDecs[decIndex]
                if not dec
                    break
                if dec.start > disItem.end
                    decIndex = decIndex
                    break
                if dec.end < disItem.start
                    decIndex += 1
                    continue
                if dec.start <= disItem.start and dec.end > disItem.start
                    # allow full contains
                    if disItem.allowWrapping
                        decIndex += 1
                    else
                        validDecs.splice(decIndex,1)
                    continue
                if dec.start >= disItem.start and dec.end <= disItem.end
                    validDecs.splice(decIndex,1)
                    continue
                if dec.start >= disItem.start and dec.start < disItem.end
                    # This situation is actually contains the previous situation
                    # I just write previous situation for clarification.
                    validDecs.splice(decIndex,1)
                    continue
                if dec.start <= disItem.start and dec.end >= disItem.end
                    validDecs.splice(decIndex,1)
                    continue
                break

        #for dec in decorations
        #
        #    # ignore comutation style of spell is ignored
        #    start = @getChildTextByOffset(dec.start)
        #    if start?.sortOf("Spell") and not start.withDecoration
        #        continue
        #    end = @getChildTextByOffset(dec.end - 1)
        #    if end.sortOf("Spell") and not end.withDecoration
        #        continue
        #    valid.push dec
        #decorations = valid
        decorations = validDecs
        targets = @children.slice()
        @reflow()
        targets.forEach (item)->item._decs = []
        backup = targets.slice()
        counter = 0

        # Cut decoration nu text/rune
        # For a 400 text peace * 600 dec text with
        # some overlapped part I rougly only compute 2000 times
        # I'm a genius
        for dec in decorations
            nextRound = []
            index = 0
            while true
                if index >= targets.length
                    break
                text = targets[index]
                if text.startOffset >= dec.end
                    # next text will not be within range of this dec
                    break
                if text.endOffset <= dec.start
                    # not within range of this dec AND
                    # text shouldn't be added to next round
                    # since the next dec should always has a larger start
                    targets.splice(index,1)
                    continue
                if dec.end <= text.endOffset
                    text._decs.push dec.shift -text.startOffset
                    if dec.start < 0
                        Logger.error "INVALID DEC",dec,text.startOffset,text.contentString
                else
                    next = dec.split(text.endOffset)
                    text._decs.push dec.shift(-text.startOffset)
                    if dec.start < 0
                        Logger.error "INVALID DEC AFTER",dec
                    dec = next
                index+=1
        # Note: the candidate decorations are also sorted by shifted start
        fpdec = (decs)->
            (decs.map (item)->""+item.mid+":"+item.start+"~"+item.end ).join("|")
        dc = 0
        for item in backup
            if item.ignoreDecoration and not item.allowWrapping
                item.setDecorations()
                continue
            if item._decs.length isnt item.decorations.length
                item.setDecorations? item._decs
                dc += 1
                continue
            for dec,index in item._decs
                if dec.equal item.decorations[index]
                    continue
                else
                    item.setDecorations? item._decs
                    dc += 1
                    break

    # split decoration for new usage
    insertText:(start,value)->
        if not @_insertText start,value
            return false
        for anchor in @anchors
            if anchor.index >= start
                inside = anchor.inside
                anchor.index += value.length
                anchor.inside = inside
        return true
    _insertText:(start,value)->
        @reflow()
        for text,index in @children
            last = text
            next = @children[index + 1]
            if start >= text.startOffset and start < text.endOffset
                if text.insertText (start - text.startOffset),value
                    @pend()
                    return true
                else
                    return false
            else if start is text.endOffset and text.sortOf("Text") and next and next.sortOf("Rune")
                if text.insertText (start - text.startOffset),value
                    @pend()
                    return true
                else
                    return false
            else if start >= text.startOffset and start is text.endOffset and text instanceof COMSpell
                if text.insertText start - text.startOffset,value
                    @pend()
                    return true
                else
                    return false
        if last and start is last.endOffset
            if last.insertText start - last.startOffset,value
                @pend()
                return true
        else if start is 0
            if @append new COMText(@context,{contentString:value})
                @pend()
                return true
        return false
    insertRune:(start,rune)->
        if not @_insertRune start,rune
            return false

        for anchor in @anchors
            if anchor.index is start
                anchor.index += rune.length
            else if anchor.index >= start
                inside = anchor.inside
                anchor.index += rune.length
                anchor.inside = inside
        return true
    _insertRune:(start,rune)->
        offset = 0
        @reflow()
        if start is @contentString.length
            @pend()
            return @append rune
        if start is 0
            @pend()
            return @insert 0,rune
        for text in @children
            if text.endOffset < start
                continue
            if text.startOffset is start
                text.before(rune)
            else if text.endOffset is start
                text.after rune
            else if text instanceof COMText
                text.splitInPlace(start - text.startOffset)
                text.after(rune)
            else
                text.after rune
            @pend()
            return true
        return false
#    removeText:(start,length)->
#        oldLength = @length
#        if not @_removeText start,length
#            return false
#        length = oldLength - @length
        for anchor in @anchors
            inside = anchor.inside
            if anchor.index < start
                return
            if anchor.index >= start + length
                anchor.index -= length
                anchor.inside = inside
                continue
            if anchor.index >= start
                anchor.index = start
                anchor.inside = inside
                continue
        return true
    removeRune:(rune)->
        if rune.parent isnt this
            return false
        return @removeText rune.startOffset,rune.length
    removeText:(start,length)->
        cs = @contentString
        if not length?
            length = cs.length - start
        actions = []
        offset = start
        end = start + length
        if start > cs.length or start + length > cs.length
            return false
        @reflow()
        for text,index in @children
            if text.startOffset >= end
                break
            else if text.endOffset <= start
                continue
            textStart = offset - text.startOffset
            textEnd = end - text.startOffset
            if textEnd >= text.length
                textEnd = text.length
                if textStart is 0
                    actions.push {remove:true,text}
                else
                    actions.push {start:textStart,text}
                offset  = text.endOffset
            else
                actions.push {start:textStart,length:textEnd - textStart,text}
                break
        for action,index in actions
            if action.remove
                action.text.remove()
            else
                action.text.removeText action.start,action.length or null
            # Fix the start/end when they are within a rune.
            if index is 0 and action.text.sortOf "Rune"
                start = action.text.startOffset
            if index is actions.length - 1 and action.text.sortOf "Rune"
                end = action.text.endOffset
        length = end - start
        for anchor in @anchors
            inside = anchor.inside
            if anchor.index < start
                continue
            if anchor.index >= start + length
                anchor.index -= length
                anchor.inside = inside
                continue
            if anchor.index >= start
                anchor.index = start
                anchor.inside = inside
                continue
        if @children.length is 0
            @contentString = ""
            @pend()
            return
        if actions.length > 0
            @pend()
            return true
        return false
    getOffsetByDOM:(node,offset)->
        for item in @children
            if item.isSpell
                result = item?.getOffsetByDOM?(node,offset)
                if result
                    result.index += item.startOffset
                    return result
        return null
    getChildTextIndexByOffset:(offset)->
        @reflow()
        if @last() and @last().endOffset is offset
            return @last()
        for text,index in @children
            if text.startOffset <= offset and text.endOffset > offset
                return index
    getChildTextByOffset:(offset)->
        @reflow()
        if @last() and @last().endOffset is offset
            return @last()
        for text,index in @children
            if text.startOffset <= offset and text.endOffset > offset
                return text
        return null
    mergeContentString:(content)->
        if not content
            return true
        return @insertText @length,content

    toContentString:(option = {})->
        if not option.purify
            return @contentString
        else
            return COMRune.purifyContentString @contentString,option
    hasRune:(handler = ->)->
        for item in @children
            if item.sortOf("Rune")
                if handler(item)
                    return true
        return false
    filterRunes:(handler = ->)->
        result = []
        for item in @children
            if item.sortOf("Rune")
                if handler(item)
                    result.push item
        return result
    fromJSON:(option)->
        if option.children
            @empty()
            for child in option.children
                if not child
                    continue
                if child instanceof COMText
                    @append child
                else if child.type is "Text"
                    @append new COMText @context,child
                else if child.spell is true
                    find = @availableSpells.some (Spell)=>
                        if Spell::type is child.type
                            @append new Spell(@context,child)
                            return true
                        return false
                    if not find
                        Logger.error "RichText:fail to build spell from json for ",child
                        Logger.error "fallback into normal texts."
                        @append new COMText @context,child
                else if child.sortOf and child.sortOf "Rune"
                    @append child
                else if child.type and @context.namespace.sortOf child.type,"Rune"
                    @append @context.createElement child
                else
                    @append @context.createElement {type:"UnknownRune",detail:child}
                    Logger.error "RichText: unsupported typeof child",child,@context
    runeAtIndex:(index)->
        @reflow()
        if typeof index isnt "number"
            return null
        child = @getChildTextByOffset(index)
        if child instanceof COMRune
            return child
        return null
    isRuneAt:(index,option = {})->
        @reflow()
        child = @getChildTextByOffset(index)
        if option.strict
            return child instanceof COMRune and child.startOffset is index
        return child instanceof COMRune
    spellAtIndex:(index)->
        @reflow()
        child = @getChildTextByOffset(index)
        if not child
            return null
        if child instanceof COMSpell
            return child
        return null
    clone:()->
        children = []
        for item in @children
            children.push item.toJSON()
        return @context.createElement @type,{children:children}
    slice:(option = {})->
        if option.left
            left = option.left
        else
            left = {leftMost:true}
        if option.right
            right = option.right
        else
            right = {rightMost:true}
        leftAnchor = @anchor.clone()
        leftAnchor.head()
        rightAnchor = @anchor.clone()
        rightAnchor.tail()
        if leftAnchor.compare(right) is "after"
            return null
        if rightAnchor.compare(left) is "before"
            return null
        if leftAnchor.compare(left) in ["after","identical"] and rightAnchor.compare(right) in ["before","identical"]
            return @clone()
        children = []
        @reflow()
        ll = leftAnchor.compare left
        rr = rightAnchor.compare right
        if ll is "before"
            if left.node is leftAnchor.node
                leftAnchor.fromJSON left.toJSON()
            else
                target = left.node
                while target and (target isnt leftAnchor.node)
                    pointAt = target
                    target = target.parent
                if not pointAt
                    throw new Errors.LogicError "since leftAnchor is before leftEdge and rightAnchor is after rightEdge, leftAnchor and leftEdge should have same ancester"
                leftAnchor.pointAt pointAt
        pointAt = null
        if rr is "after"
            if right.node is rightAnchor.node
                rightAnchor.fromJSON right.toJSON()
            else
                target = right.node
                while target and (target isnt rightAnchor.node)
                    pointAt = target
                    target = target.parent
                if not pointAt
                    throw new Errors.LogicError "since rightAnchor is before rightEdge and rightAnchor is after rightEdge, rightAnchor and rightEdge should have same ancester"
                rightAnchor.pointAt pointAt
        if leftAnchor.index is 0 and rightAnchor.index is @contentString.length
            return @clone()
        for item in @children
            #lr = leftAnchor.compare(right)
            #if lr is "after"
            #    break
            #rl = rightAnchor.compare(left)
            #if rl is "before"
            #    continue

            if item.endOffset <= leftAnchor.index
                continue
            if item.startOffset >= rightAnchor.index  and not rightAnchor.inside
                break
            if item.sortOf("Rune")
                child = item.slice(option)
                if child
                    children.push child
                continue

            leftOffset = Math.max item.startOffset,leftAnchor.index
            rightOffset = Math.min item.endOffset,rightAnchor.index
            if rightOffset <= leftOffset
                continue
            # No matter spell or text, just make them all text.
            # This is how spell works
            start = leftOffset - item.startOffset
            end  = rightOffset - item.startOffset
            cs = item.contentString.slice(start,end)
            text = new COMText @context,{contentString:cs}
            if leftOffset isnt item.startOffset or rightOffset isnt item.endOffset and option.selection
                text.isPartial = true
            children.push text
        isPartial = false
        if children.length isnt @children.length
            isPartial = true
        clone = @context.createElement @type
        clone.empty()
        last = @last()
        lastCs = last.contentString
        looseComplete = false
        for item,index in children
            if item.isPartial
                if index is @children.length - 1 and lastCs?.length - 1 is item.contentString?.length and lastCs?[lastCs?.length - 1] is "\n"

                    isPartial = true
                    looseComplete = true
                else
                    isPartial = true
            clone.append item
        clone.isPartial = @isPartial or isPartial
        clone.looseComplete = looseComplete
        return clone
    toJSON:()->
        json = super()
        delete json.contentString
        return json

module.exports = COMRichText
