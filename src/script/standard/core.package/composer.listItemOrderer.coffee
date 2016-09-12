Composer = require "../helper/composerUtils"
module.exports = class ListItemOrderer extends Composer.COMComposer
    type:"ListItem"
    exec:()->
        prefix = @target.getHeadPrefix()
        if @cache.listHeadPrefix is prefix and @cache.listHeadIndent is @target.getIndentLevel()
            return false
        @cache.listHeadPrefix = prefix
        currentIndent = @target.getIndentLevel()
        sequence = []
        stack = []
        previous = @target
        while previous = previous.previous()
            if not previous.sortOf("ListItem")
                break
            sequence.unshift(previous)
        sequence.push @target
        next = @target
        while next = next.next()
            if not next.sortOf("ListItem")
                break
            sequence.push next

        lastIndent = null
        targetHasOrder = @target.getType() is "order"
        if sequence.length is 1
            return false
        if targetHasOrder
            prefixDecorator = @target.getPrefixDecorator()
        else
            prefixDecorator = "."

        for item,_i in sequence
            prev = sequence[_i - 1] or null
            currentIndent = item.getIndentLevel()
            if stack.length is 0
                stack.push -1
                lastIndent = currentIndent
            indent = currentIndent
            while indent > lastIndent
                indent--
                stack.push -1
            indent = currentIndent
            while indent < lastIndent
                indent++
                stack.pop()
            if stack.length is 0
                stack.push -1
            lastIndent = currentIndent
            if item.getType() is "order"
                offset = stack[stack.length-1]
                if offset < 0
                    offset = item.getOrderIndex()
                    stack[stack.length - 1] = offset
                    # Always start from one if we only have 2 sequence
                    # or current sequence is a sub list of previous indent
                    # ,and this behavior is tricky and hard to explain.
                    # Generally, we want always sort the list from 1.
                    # But when user split list with \n, we should keep the order and not resort from 1.
                    # When split with \n and followed by a listItem, and user press enter will auto create
                    # next list item, which wil cause a resort if we only check sequence.length is 1
                    # So we also check it here for 2
                    if sequence.length isnt 2 or prev
                        stack[stack.length - 1] = 1
                index = stack[stack.length-1]++
                prefix = index + prefixDecorator
                if item.getHeadPrefix() is prefix
                    continue
                item.setHeadPrefix(prefix)
                item.composerBuffer.listHeadPrefix = prefix
                item.composerBuffer.listHeadIndent = currentIndent
                if item is @target
                    changed = true
            else
                continue
        # no need to force rerun
        return changed
