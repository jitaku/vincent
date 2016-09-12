COMComposer = COM.COMComposer
COMRichText = COM.COMRichText
class RichTextBasedComposer extends COMComposer
    distributeAnchor:(children,option = {})->
        for child in children
            if child not instanceof COMRichText
                return false
        for anchor in @target.anchors
            offset = anchor.index
            for atom,index in children
                length = atom.length
                next = children[index + 1]
                # no longer block element
                if false and index isnt 0 and atom instanceof BlockAtomElement
                    offset -= 1
                if offset > length
                    offset -= length
                    continue
                else if offset is length and index is children.length - 1
                    target = atom
                    break
                # no longer block element now
                else if false and offset is length and next instanceof BlockAtomElement
                    target = atom
                    break
                else if offset is length
                    offset = 0
                    continue
                else
                    target = atom
                    break
            if target
                #anchor.cursor?.pointAt target,{anchor:{index:offset}}
                anchor.cursor?.context.pointIdenticalCursors anchor.cursor,target,{index:offset}
                continue
            if option.fallback
                anchor.cursor?.context.pointIdenticalCursors anchor.cursor,children[0],{index:0}
                #anchor.cursor?.pointAt children[0],{anchor:{index:0}}
                continue
        return true
class LeftInvokeOneLineElementExtractor extends RichTextBasedComposer
    type:"Void"
    reg:null
    backwardAssert:"\n"
    exec:()->
        contentString = @target.contentString
        reg = @reg
        match = contentString.match reg
        if match
            backwardFix = 0
            forwardFix = 0
            backwardAssert = @backwardAssert or ""
            forwardAssert = @forwardAssert or ""
            backwardAssertString = match[0].slice(0,backwardAssert.length)
            if backwardAssertString is backwardAssert
                backwardFix = backwardAssert.length
            forwardAssertString = match[0].slice(-forwardAssert.length)
            if forwardAssertString is forwardAssert
                forwardFix = forwardAssert.length
            lastChar = match[0].slice(-1)
            if lastChar isnt "\n" and @target.next()
                return false
            content = match[0].slice(backwardFix,-forwardFix or match[0].length)
            start = match.index + backwardFix
            end = start + content.length
            contentBefore = contentString.slice(0,start)
#            if content[content.length - 1] isnt "\n"
#                content += "\n"
            contentAfter = contentString.slice(end)
            renderTarget = @context.createElement @renderTargetType,{contentString:content}
            @rt = renderTarget
            children = []
            #debugger
            if contentBefore
                children.push @context.createElement "RichText",{contentString:contentBefore}
            children.push renderTarget
            if contentAfter
                children.push @context.createElement "RichText",{contentString:contentAfter}
            parent = @target.parent
            index = parent.indexOf @target
            parent.removeChild index
            parent.insert index,children...
            @distributeAnchor(children)
            return true
        else
            return false
    exec:()->
        contentString = @target.contentString
        reg = @reg
        match = contentString.match reg
        if match
            backwardFix = 0
            forwardFix = 0
            backwardAssert = @backwardAssert or ""
            forwardAssert = @forwardAssert or ""
            backwardAssertString = match[0].slice(0,backwardAssert.length)
            if backwardAssertString is backwardAssert
                backwardFix = backwardAssert.length
            forwardAssertString = match[0].slice(-forwardAssert.length)
            if forwardAssertString is forwardAssert
                forwardFix = forwardAssert.length
            lastChar = match[0].slice(-1)
            if lastChar isnt "\n" and @target.next()
                return false
            content = match[0].slice(backwardFix,-forwardFix or match[0].length)
            start = match.index + backwardFix
            end = start + content.length
            contentBefore = contentString.slice(0,start)
#            if content[content.length - 1] isnt "\n"
#                content += "\n"
            contentAfter = contentString.slice(end)
            renderTarget = @context.createElement @renderTargetType,{contentString:content}
            @rt = renderTarget
            children = []
            #debugger
            if contentBefore
                children.push @context.createElement "RichText",{contentString:contentBefore}
            children.push renderTarget
            if contentAfter
                children.push @context.createElement "RichText",{contentString:contentAfter}
            parent = @target.parent
            index = parent.indexOf @target
            parent.removeChild index
            parent.insert index,children...
            @distributeAnchor(children)
            return true
        else
            return false
class LeftInvokeOneLineElementRetainer extends RichTextBasedComposer
    reg:null
    exec:()->
        # 1. borrows a missing \n from next rich text if not tailing \n present
        # 2. move the extra \s*\n in head to previous rich text
        # 3. move the extra \n[\S\s]*\n in tail to next rich text
        # debugger
        contentString = @target.contentString
        reg = @reg
        match = contentString.match reg
        if match and match.index + match[0].length is contentString.length
            last = contentString[contentString.length - 1]
            next = @target.next()
            index = @target.parent.indexOf(@target)
            if not next or last is "\n"
                #debugger
                return false
            # If I can borrow one from next el
            if @target.composePolicy.borrow and next and line = next.borrowFirstLine()
                @target.contentString = contentString + line
                return true
        # not match
        lines = @target.contentString.split("\n")
        afters = []
        befores = []
        emptylineReg = /^\s*$/
        while true
            line = lines.pop()
            if typeof line is "string" and emptylineReg.test line
                afters.unshift(line)
            else if typeof line is "string"
                lines.push line
                break
            else
                break
        while true
            line = lines.shift()
            if typeof line is "string" and emptylineReg.test line
                befores.push line
            else if typeof line is "string"
                lines.unshift line
                break
            else
                break
        if befores.length > 0
            beforeContent = befores.join("\n") + "\n"
            before = @context.createElement "RichText",{contentString:beforeContent}
            @target.before before
        # afters.length is 1 means we fail to get a tailing \n
        if afters.length > 1
            afterContent = afters.join("\n")
            after = @context.createElement "RichText",{contentString:afterContent}
            @target.after after
        #debugger
        if beforeContent or afterContent
            beforeContent ?= ""
            afterContent ?= ""
            @target.removeText 0,beforeContent.length
            leftContent = @target.contentString
            @target.removeText leftContent.length - afterContent.length,afterContent.length
            return true
        replacement = @context.createElement "RichText",{contentString:contentString}
        @target.replaceBy replacement
        @distributeAnchor [replacement]
        @atRelease? @target,replacement
        return true
class PairedElementExtractor extends RichTextBasedComposer
    backwardAssert:"\n"
    exec:()->
        contentString = @target.contentString
        reg = @reg
        match = contentString.match reg
        if match
            backwardFix = 0
            forwardFix = 0
            backwardAssert = @backwardAssert or ""
            forwardAssert = @forwardAssert or ""
            backwardAssertString = match[0].slice(0,backwardAssert.length)
            if backwardAssertString is backwardAssert
                backwardFix = backwardAssert.length
            forwardAssertString = match[0].slice(-forwardAssert.length)
            if forwardAssertString is forwardAssert
                forwardFix = forwardAssert.length
            lastChar = match[0].slice(-1)
            if lastChar isnt "\n" and @target.next()
                return false
            if match[0][0] isnt "\n" and (previous = @target.previous())
                if previous.sortOf("RichText") and previous.contentString?.slice(-1) is "\n"
                    true
                else
                    return false
            #debugger
            content = match[0].slice(backwardFix,-forwardFix or match[0].length)
            start = match.index + backwardFix
            end = start + content.length
            contentBefore = contentString.slice(0,start)
            contentAfter = contentString.slice(end)
            renderTarget = @context.createElement @renderTargetType,{contentString:content}
            children = []
            #debugger
            if contentBefore
                children.push @context.createElement "RichText",{contentString:contentBefore}
            children.push renderTarget
            if contentAfter
                children.push @context.createElement "RichText",{contentString:contentAfter}
            parent = @target.parent
            index = parent.indexOf @target
            parent.removeChild index
            parent.insert index,children...
            @distributeAnchor(children)
            return true
        else
            return false
class PairedElementRetainer extends RichTextBasedComposer
    fastRetain:(cs)->
        return false
    exec:()->
        contentString = @target.contentString
        if @fastRetain(contentString)
            return false
        reg = @reg
        match = contentString.match reg
        if match and match.index + match[0].length is contentString.length
            last = contentString[contentString.length - 1]
            next = @target.next()
            index = @target.parent.indexOf(@target)
            if not next or last is "\n"
                return false
            if @target.composePolicy.borrow and next and line = next.borrowFirstLine()
                @target.contentString = contentString + line
                return true

            return false
        replacement = @context.createElement "RichText",{contentString:contentString}
        @target.replaceBy replacement
        @distributeAnchor [replacement]
        return true

module.exports = {
    RichTextBasedComposer
    LeftInvokeOneLineElementRetainer
    LeftInvokeOneLineElementExtractor
    PairedElementRetainer
    PairedElementExtractor
    COMComposer
}
