COMContainer = require "./container"
COMTrapPolicy = require "./trapPolicy"
COMDecorationPolicy = require "./decorationPolicy"
Decoration = require "./decoration"
Trait = require "./helper/trait"
COMVisualPosition = require "./visualPosition"
COMText = require "./text"
class COMRune extends COMContainer
    # We use a RunePlaceHolder to turn rune into string.
    # RunePlaceHolder contains rune's ID.
    # So can get the rune back by checking the RuneCache.
    # This approach is convenient but will introduce memory leak.
    # I will fix it in future release.
    # (Maybe we I can GC the RuneCache at start/end of the use of this feature)
    @RunePlaceBegin = "\uE1F5"
    @RunePlaceEnd = "\uE1F6"
    @RunePurifyHolder = "\uE1F7"
    @purifyContentString = (string,option = {})->
        replacement = " "
        if option.useHolder
            replacement = @RunePurifyHolder
        string.replace(new RegExp("\uE1F5[^\uE1F5\uE1F6]*\uE1F6","g"),(content)->
            return content.replace(/(?:.|\n)/ig,replacement)
            )
    type:"Rune"
    isEmpty:()->
        return false
    constructor:(@context,@data)->
        super(@context,@data)
        @editor = @context.editor
        #@length = 1
        @rightCaretPriority = 0
        @leftCaretPriority = 0
        @parentAppearance = []
        @decorations = []
        @trapPolicy = new COMTrapPolicy(this).behave {
            trap:"ignore"
        }
        @decorationPolicy = new COMDecorationPolicy(this).behave {
            behavior:"singular"
        }
        @context.runeCache.assign this
        @__defineGetter__ "length",()->
            return @cid.toString().length + 2
        @__defineGetter__ "contentString",()->
            return COMRune.RunePlaceBegin + @cid + COMRune.RunePlaceEnd
        @triggerByClick = @triggerByClick.bind(this)
        @layout = "inline"
        new DraggableTrait this
    onRootDispel:()->
        @context.runeCache.release(this)
        super()
    onRootAvailable:()->
        @context.runeCache.reuse(this)
        super()
    render:(rc,option)->
        super(rc,option)
        for dec in @previousDecorations or []
            dec.cancel @el
        for dec in @decorations
            dec.apply @el
        @handleDragElement(@el)
        #@el?.removeEventListener "mousedown",@triggerByClick
        #@el?.addEventListener "mousedown",@triggerByClick
    triggerByClick:(e)->
        if @trigger
            if @trigger()
                e.preventDefault()
                e.stopImmediatePropagation()
        return
    toProtocolDatas:()->
        return [{
            type:@type
            data:this
        }]
    setDecorations:(decorations)->
        @previousDecorations ?= []
        @previousDecorations.push (@decorations or [])...
        @context.operate new Decoration.ChangeDecorationOperation @context,this,{decorations}
    detectTextOffset:(el)->
        if @el.contains el or @el is el
            return {offset:0,part:@el}
    getVisualBorder:(offset,relativeToCursor)->
        targetIndex = 0
        for item,index in @el.parentElement.childNodes
            if item is @el
                targetIndex = index
                break
        position = "left"
        if offset is @length or relativeToCursor is "left"
            position = "right"
        if relativeToCursor is "inside"
            position = "contain"
        if relativeToCursor is "right"
            priority = @leftCaretPriority or 0
        else if relativeToCursor is "left"
            priority = @rightCaretPriority or 0
        else
            priority = 0
        return new COMVisualPosition.COMVisualBorder({node:@el.parentElement,offset:targetIndex,position,priority})
    getCorrespondingBoundaryByOffset:(offset,inside)->
        for item,index in @el.parentElement.childNodes
            if item is @el
                targetIndex = index
                break
        if offset is 0
            return node:@el.parentElement,offset:targetIndex,via:"RuneBefore"
        else if offset < @length or inside
            return node:@el,type:"include",via:"RuneInclude"
        else
            return node:@el.parentElement,offset:targetIndex + 1,via:"RuneAfter"
        return null
    slice:()->
        return @clone()
    clone:()->
        return @context.createElement @type,@toJSON()
    insertText:(start,value)->
        if start is 0
            return @before new COMText @context,{contentString:value}
        if start > 0
            return @after new COMText @context,{contentString:value}
        return false
    toHumanString:()->
        return ""
    removeText:(start,length)->
        @remove()
        return true
    toHumanString:()->
        return "<Rune #{@type}>"

class DraggableTrait extends Trait
    enableDragBehavior:(option = {})->
        if @dragBehaviorRegistered
            return
        @dragBehaviorRegistered = true
        @dragOption = option
    handleDragElement:(el)->
        # We don't have solution for drag in mobile for the moment.
        if not @dragBehaviorRegistered
            return
        if el.runeDragAdded
            return
        el.runeDragAdded = true
        el.dragSupport = "support"
        el.dragBehavior = "auto"
        el.addEventListener "user-draginit",(e)=>
            for item in @getDragProtocols()
                e.detail?.addProtocol? item.type,item.data

    getDragProtocols:()->
        result = [{
            type:"Rune"
            data:this
        }]
        extra = @dragOption.getDragProtocol?(this) or []
        return extra.concat result
module.exports = COMRune
