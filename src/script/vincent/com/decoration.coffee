Operation = require "./operation"
class DecorationMaintainer
    constructor:()->
        #
    compute:()->
        return []
    apply:()->
class RegExpDecorationMaintainer extends DecorationMaintainer
    constructor:()->
        super()
        @reg ?= null
        @classes ?= []
        @option ?= {}
        @parts = @option.parts or []
    getMatchRegion:(contentString)->
        if not @reg
            return
        @reg.lastIndex = 0
        results = []
        backwardFix = @option.backwardAssert?.length or 0
        forwardFix = @option.forwardAssert?.length or 0
        while match = @reg.exec contentString
            if match[0].length is 0
                break
            results.push [match.index + backwardFix , match.index + match[0].length - forwardFix,match[0],match]
        return results
    compute:(contentString)->
        results = []
        coreResults = @getMatchRegion?(contentString) or []
        for item in coreResults
            if @parts.length > 0
                content = contentString.slice(item[0],item[1])
                results.push @computePart(content,item[0])...
            results.push item
        return results.map (info)=> new Decoration(this,info...)
    apply:(dec,el)->
        el.classList.add @classes...
        if dec.detail?.classes
            el.classList.add dec.detail?.classes...
    cancel:(dec,el)->
        for name in @classes
            el.classList.remove name
        if dec.detail?.classes
            for name in dec.detail?.classes
                el.classList.remove name

    computePart:(content,offset)->
        results = []
        for part in @parts
            part.reg.lastIndex = 0
            while match = part.reg.exec content
                if match[0].length is 0
                    break
                results.push [match.index + offset,match.index + offset + match[0].length,part]
        return results

class Decoration
    constructor:(@maintainer,@start = 0,@end = 0, @detail)->
        @length = @end - @start
        @mid = @maintainer?.id
    apply:(el)->
        @maintainer.apply this,el
    cancel:(el)->
        @maintainer.cancel this,el
    clone:()->
        return new Decoration(@maintainer,@start,@end,@detail)
    split:(index)->
        next = @clone()
        next.start = index
        @end = index
        @length = @end - @start
        return next
    shift:(unit)->
        @start += unit
        @end += unit
        return this
    equal:(target)->
        return target.mid is @mid and target.start is @start and target.end is @end

class Decoration.PairDecorationMaintainer extends DecorationMaintainer
    constructor:()->
        super()
        @rules = []
    compute:(cs)->
        @results = []
        @stack = []
        @offset = 0
        @enterCount = 0
        breakChar = "\uE1F8"
        while @offset < cs.length
            close = false
            start = false
            char = cs[@offset]
            if char is breakChar
                @offset += 1
                @stack.length = 0
                continue
            # multi enter always break the unclosed stack
            if char is "\n"
                @enterCount += 1
                @offset += 1
                if @enterCount >= 1
                    @enterCount = 0
                    @stack.length = 0
                continue
            else
                @enterCount = 0
            for item,index in @stack by -1
                if @strcmp(cs,@offset,item.right)
                    @stack.length = index
                    @offset += item.right.length
                    item.end = @offset
                    if item.end - item.start is item.left.length + item.right.length
                        # Empty decoration don't get decorated for the moment
                        continue
                        item.empty = true
                    @results.push @createMatchingDecoration(cs,item)...
                    close = true
                    break
            if close
                continue
            for rule in @rules
                if @strcmp cs,@offset,rule.left
                    @stack.push {
                        start:@offset
                        rule:rule
                        right:rule.right
                        left:rule.left
                    }
                    @offset += rule.left.length
                    start = true
                    break
            if start
                continue
            @offset += 1
        return @results
    strcmp:(string,offset,match)->
        if match.length is 0
            return false
        for char,index in match
            if string[offset + index] isnt char
                return false
        return true
    createMatchingDecoration:(cs,result)->
        l1 = result.left.length
        l2 = result.right.length
        rule = result.rule
        return [
            new Decoration.PairDecoration(this,result.start,result.start + l1,{rule,isStart:true,empty:result.empty})
            new Decoration.PairDecoration(this,result.start + l1,result.end - l2,{rule,empty:result.empty})
            new Decoration.PairDecoration(this,result.end - l2,result.end,{rule,isEnd:true,empty:result.empty})
        ]
    register:(left,right,info = {})->
        rid = Decoration.allocateId()
        index = @rules.length
        @rules.push {
            left,right,rid,index,info
        }
class Decoration.PairDecoration extends Decoration
    clone:()->
        return new Decoration.PairDecoration(@maintainer,@start,@end,@detail)
    apply:(el)->
        for className in @detail.rule.info.classNames or []
            el.classList.add className
        if @detail.empty
            el.classList.add "com-dec-empty"
        if @detail.isStart
            if start = @detail.rule.startDecorator
                el.classList.add start
            else
                el.classList.add "com-dec-pair-start"
        else if @detail.isEnd
            if end = @detail.rule.endDecorator
                el.classList.add end
            else
                el.classList.add "com-dec-pair-end"
    cancel:(el)->
        if @detail.empty
            el.classList.remove "com-dec-empty"
        for className in @detail.rule.info.classNames or []
            el.classList.remove className
    equal:(target)->
        return @detail.rule.rid is target?.detail?.rule?.rid and target.start is @start and target.end is @end

class Decoration.ChangeDecorationOperation extends Operation.EditOperation
    name:"ChangeDecorationOperation"
    invoke:()->
        text = @target
        @option.oldDecorations = text.decorations?.slice?() or []
        text.decorations = @option.decorations?.slice?() or []
        text.dirty = true
        text.parent?.dirty = true
        return true
    revoke:()->
        text = @target
        text.decorations = @option.oldDecorations?.slice?() or []
        text.dirty = true
        text.parent?.dirty = true
    describe:()->
        return "make a decoration change to #{@target.type}"

exports = Decoration
exports.DecorationMaintainer = DecorationMaintainer



MID = 0
exports.createRegExpMaintainer = (name,reg,classes,option = {})->
    Maintainer = class CustomDecoratioMaintainer extends RegExpDecorationMaintainer
        constructor:()->
            @option = option or {}
            @reg = reg
            @name = name
            super()

    Maintainer::id = MID++
    Maintainer::name = name
    Maintainer::classes = classes
    return Maintainer
exports.allocateId = ()->
    return MID++

module.exports = exports
