COMComposer = require "./composer"
COMRichText = require "./richText"
COMContainer = require "./container"

# Contents are used to hold series of RichTexts
class COMContents extends COMContainer
    type:"Contents"
    constructor:(@context,@data)->
        @appearance ?= {
            tagName:"div"
            classList:["com","com-contents"]
        }
        super @context,@data
    render:(rc)->
        super rc,{recursive:true,selfless:not @beforeMark("hasAttachedChild") and not @beforeMark("hasDetachedChild")}

class ContentsAvoidNested extends COMComposer
    type:"Contents"
    exec:()->
        children = @target.children.slice()
        for item,index in children
            if item.sortOf("Contents") or item.sortOf("Root")
                once = true
                toAppend = item.children.slice()
                item.empty()
                for child in toAppend by -1
                    item.after child
                item.remove()
        return once or false

class ContentsAvoidEmpty extends COMComposer
    type:"Contents"
    exec:()->
        last = @target.last()
        # prevent empty contents block.
        if not last# or not last.sortOf("RichText")# or last.contentString.slice("-1") isnt "\n"
            node = @context.createElement "RichText",{contentString:""}
            @target.append node
            return true
class NormalizeRichTexts extends COMComposer
    type:"Contents"
    exec:()->
        # Normalize means
        # 1. remove the empties (if not the last or first)
        # 2. join pure richtexts
        children = @target.children.slice()
        # remove empties
        window.perf?.start("L1")
        for item in children
            index  = @target.indexOf(item)
            # not begin
            # not end
            # is rich text
            # and empty

            if children.length > 1 and item.length is 0 # and index isnt @target.children.length - 1
                for anchor in item.anchors
                    cursor = anchor.cursor
                    cursor.next({actions:["head"]}) or cursor.previous({actions:["tail"]})
                item.remove()
                removed = true
            else if item.length is 0
                true
        window.perf?.end("L1")
        currentJoins = []
        children = @target.children.slice()
        # So the I don't need to specially handle the last group
        # of mergables
        children.push {end:true}
        # merge rich text
        window.perf?.start("L2")
        for item,index in children
            if item.type is "RichText" and not (item.length is 0 and item is @target.last())
                currentJoins.push item
            else
                if currentJoins.length < 2
                    currentJoins.length = 0
                    continue
                index = @target.indexOf(currentJoins[0])
                contents = currentJoins.map((item)->item.contentString).join("")
                for item in currentJoins
                    item.remove()
                    joined = true
                renderTarget = @context.createElement "RichText",{contentString:contents}
                @target.insert index,renderTarget
                @mergeAnchors currentJoins,renderTarget
                currentJoins.length = 0
                joined = true
        window.perf?.end("L2")
        last = @target.last()

        # Always keep a empty rich text at the end to prevent broken
        # style in list(with tab indent)
        if not last or last.type isnt "RichText"
            @target.append @context.createElement "RichText",{contentString:"\n"}
            return true
        if removed or joined
            return true
        return false
    mergeAnchors:(children,target)->
        base = 0
        for item in children
            for anchor in item.anchors
                anchor.cursor.pointAt target,{anchor:{index:base + anchor.index}}
            base += item.length


class MergeByComposePolicy extends COMComposer
    type:"Contents"
    obeys:(a,b)->
        # if not a or not b then no need to split
        if not a or not b
            return true
        needSplit = a.composePolicy.newlineSplitTail or b.composePolicy.newlineSplitHead
        if not needSplit
            return false
        #return a.isEmpty() or a.isEndOfChar("\n") or b.isEmpty() or b.isStartOfChar("\n") or false
        # though empty node may not obey the compose policy
        # but sometimes (begin/end of the doc) a empty rich text is reasonable
        # so merging the empty richtext is left to NormalizeRichTexts.
        # Even rich text remains, since we have a good travel policy things should be OK in most case
        ca = a.contentString
        cb = b.contentString
        return not ca or ca.slice(-1) is "\n" or not cb or cb[0] is "\n" or false
    exec:()->
        children = @target.children.slice()
        length = children.length
        index = 0
        counter = 0
        while child = children[index]
            counter += 1
            index += 1
            next = children[index]
            if not child or not next
                continue
            if child.composerBuffer.passMerge and next.composerBuffer.passMerge
                continue
            if @obeys child,next
#                child.composerBuffer.passMerge = true
#                next.composerBuffer.passMerge = true
                continue
            beforeContent = child.contentString
            afterContent = next.contentString
            childIndex = @target.indexOf(child)
            @target.removeChild child
            @target.removeChild next
            newText = @context.createElement "RichText",{contentString:(child.toContentString?() or beforeContent) + (next.toContentString() or afterContent)}
            @target.insert childIndex, newText
            for anchor in child.anchors
                anchor.cursor.pointAt newText,{anchor:{index:anchor.index}}
            for anchor in next.anchors
                anchor.cursor.pointAt newText,{anchor:{index:beforeContent.length + anchor.index}}
            children[index] = newText
            changed = true
        if changed
            return true
        return false
#COMContents.ContentsAvoidNested = ContentsAvoidNested
COMContents.ContentsAvoidEmpty = ContentsAvoidEmpty
COMContents.NormalizeRichTexts = NormalizeRichTexts
COMContents.MergeByComposePolicy = MergeByComposePolicy

module.exports = COMContents
