COMSpell = COM.COMSpell
COMRichText = COM.COMRichText
COMDecoration = COM.COMDecoration
COMOperation = COM.COMOperation
# ChineseDot = "、"

class ListItemHeadSpell extends COMSpell
    class ListItemHeadView extends Leaf.Widget
        constructor:(@renderContext,@listItem)->
            @template = """<span data-class="active" class="com-inline-list-head"><span data-id="texts" class="texts"></span><div class="list-item-menu-trigger print-not"><i class="fa fa-ellipsis-h"></i></div><div class='gtd-indicator'><div class="i-todo"></div><div class="i-done"></div><div class="i-pending"></div><div class="i-cancel"></div></div></span>"""
            super()
            @sm = @listItem?.context?.editor?.plugin?("SillyMenu")
            @buffer = @renderContext.buffer
            @node.addEventListener "touchstart",@onMousedownNode.bind(this)
        onMousedownNode:(e)->
            e.preventDefault()
            e.stopImmediatePropagation()
            @showMenu()
        showMenu:()->
            if not @sm
                return
            if @buffer.cursor.target isnt @listItem
                @buffer.cursor.pointAt @listItem
                @buffer.editor.conduct "start-of-list-item"
            @VM.active = true
            @sm.prompts @getListMenuOptions(@listItem,@buffer),@node,{
                callback:()=>
                    @VM.active = false
            }
        getListMenuOptions:(listItem,buffer)->
            options = []
            cursor = buffer.cursor
            editor = buffer.editor
            if listItem.isCollapsed
                options.push {
                    content:"Expand"
                    icon:"fa-ellipsis-v"
                    title:"{cmd:force-trigger} or {cmd:expand-list-item}: Expand the list"
                    callback:()=>
                        listItem.context.transact ()=>
                            if cursor.target isnt listItem
                                cursor.pointAt listItem
                            editor.conduct "expand-list-item"
                }
            else
                next = listItem.next()
                if next and next.sortOf("ListItem") and next.getIndentLevel() > listItem.getIndentLevel()
                    options.push {
                        content:"Collapse"
                        icon:"fa-ellipsis-h"
                        title:"{cmd:force-trigger} or {cmd:collapse-list-item}: Collapse the list"
                        callback:()=>
                            listItem.context.transact ()=>
                                if cursor.target isnt listItem
                                    cursor.pointAt listItem
                                editor.conduct "collapse-list-item"
                    }
            options.push {
                content:"Delete"
                title:"{cmd:remove-current-list}: Remove the list"
                icon:"fa-remove"
                callback:()=>
                    listItem.context.transact ()=>
                        if cursor.target isnt listItem
                            cursor.pointAt listItem
                        editor.conduct "remove-current-list"
            }
            todo = null
            for item in listItem.children
                if item.type is "Todo"
                    todo = item
                    break
            if todo
                options.push {
                    content:"Toggle todo"
                    icon:"fa-check-square-o"
                    title:"{cmd:mark-list-todo-next} or {cmd:mark-list-todo-previous}: Change todo state"
                    callback:()=>
                        listItem.context.transact ()=>
                        if cursor.target isnt listItem
                            cursor.pointAt listItem
                            editor.conduct "start-of-list-item"
                        editor.conduct "mark-list-todo-next"
                }
            else
                options.push {
                    content:"Todo"
                    icon:"fa-check-square-o"
                    title:"{cmd:mark-list-todo}: Mark list as todo"
                    callback:()=>
                        listItem.context.transact ()=>
                        if cursor.target isnt listItem
                            cursor.pointAt listItem
                            editor.conduct "start-of-list-item"
                        editor.conduct "mark-list-todo"
                }
            options.push {
                content:"Forward"
                icon:"fa-indent"
                title:"{cmd:indent-forward}: Indent the list forward"
                callback:()=>
                    listItem.context.transact ()=>
                        if cursor.target isnt listItem
                            cursor.pointAt listItem
                        editor.conduct "indent-forward"
            }
            options.push {
                content:"Backward"
                icon:"fa-outdent"
                title:"{cmd:indent-backward}: Indent the list backward"
                callback:()=>
                    listItem.context.transact ()=>
                        if cursor.target isnt listItem
                            cursor.pointAt listItem
                        editor.conduct "indent-backward"
            }

            if not editor.platform.isMobile()
                options.push {
                    content:"Caret to begin"
                    icon:"fa-i-cursor"
                    title:"{cmd:start-of-list-item}: Move caret to start of the list item"
                    callback:()=>
                        listItem.context.transact ()=>
                            if cursor.target isnt listItem
                                cursor.pointAt listItem
                            editor.conduct "start-of-list-item"
                }
            if listItem.previous()?.sortOf("ListItem")
                options.push {
                    content:"Move to top"
                    title:"{cmd:move-current-list-item-to-block-begin}: Move current list to top"
                    icon:"fa-long-arrow-up"
                    callback:()=>
                        listItem.context.transact ()=>
                            if cursor.target isnt listItem
                                cursor.pointAt listItem
                            editor.conduct "start-of-list-item"
                            editor.conduct "move-current-list-item-to-block-begin"
                }
                options.push {
                    content:"Swap up"
                    title:"{cmd:list-item-swap-up}: Swap the current list with the previous one"
                    icon:"fa-angle-up"
                    callback:()=>
                        listItem.context.transact ()=>
                            if cursor.target isnt listItem
                                cursor.pointAt listItem
                            editor.conduct "start-of-list-item"
                            editor.conduct "list-item-swap-up"

                }
                #if listItem.getSubList()?.length > 0 and listItem.getPreviousUpperLevel()
                #    options.push {
                #        content:"Swap up +"
                #        icon:"fa-angle-double-up"
                #        title:"{cmd:list-block-swap-up}: Swap the current list and it's sub-list with the previous one"
                #
                #        callback:()=>
                #            listItem.context.transact ()=>
                #                if cursor.target isnt listItem
                #                    cursor.pointAt listItem
                #                editor.conduct "start-of-list-item"
                #                editor.conduct "list-block-swap-up"
                #    }
            if listItem.next()?.sortOf("ListItem")
                options.push {
                    content:"Swap down"
                    icon:"fa-angle-down"
                    title:"{cmd:list-item-swap-down}: Swap the current list with the next one"
                    callback:()=>
                        listItem.context.transact ()=>
                            if cursor.target isnt listItem
                                cursor.pointAt listItem
                            editor.conduct "start-of-list-item"
                            editor.conduct "list-item-swap-down"
                }
                options.push {
                    content:"Move to bottom"
                    title:"{cmd:move-current-list-item-to-block-begin}: Move current list to bottom"
                    icon:"fa-long-arrow-down"
                    callback:()=>
                        listItem.context.transact ()=>
                            if cursor.target isnt listItem
                                cursor.pointAt listItem
                            editor.conduct "start-of-list-item"
                            editor.conduct "move-current-list-item-to-block-end"
                }
                #if listItem.getSubList()?.length > 0 and listItem.getNextUpperLevel()
                #    options.push {
                #        content:"Swap down +"
                #        icon:"fa-angle-double-down"
                #        title:"{cmd:list-block-swap-down}: Swap the current list and it's sub-list with the next one"
                #
                #        callback:()=>
                #            listItem.context.transact ()=>
                #                if cursor.target isnt listItem
                #                    cursor.pointAt listItem
                #                editor.conduct "start-of-list-item"
                #                editor.conduct "list-block-swap-down"
                #    }

            options.push {
                content:"Clear finished"
                title:"{cmd:clear-all-done-or-cancel-list-at-current-level}: Remove list that is marked as done or cancel only at current list level"
                icon:"fa-list-ul"
                callback:()=>
                    if cursor.target isnt listItem
                        cursor.pointAt listItem
                    editor.conduct "start-of-list-item"
                    editor.conduct "clear-all-done-or-cancel-list-at-current-level"

            }
            if cursor.context.metas.gtdOverview?.done > 0 or cursor.context.metas.gtdOverview?.cancel > 0
                options.push {
                    content:"Clear all finished"
                    title:"{cmd:clear-all-done-or-cancel-list}: Remove all list in the document that is marked as done or cancel"
                    icon:"fa-list"
                    callback:()=>
                        editor.conduct "clear-all-done-or-cancel-list"

                }

            return options
    reg = /^\s*(-|\*|\+|[0-9]+(\.|\)|、)) /
    constructor:(args...)->
        @appearance ?= {
            tagName:"span"
            classList:["com","com-inline-list-head","com-text"]
        }
        super args...
        @noTriggerFocus = true
    onRootAvailable:()->
        super()
        @parent.head = this
    type:"ListItemHeadSpell"
    specifyTextContainer:()->
        return @cache.view.UI.texts
    customBaseRender:()->
        @cache.view ?= new ListItemHeadView(@rc,@parent)
        @cache.view.UI.texts.innerHTML = ""
        @el = @cache.view.node
    render:(args...)->
        super(args...)
    trigger:()->
        @cache.view?.showMenu()
    test:(contentString = "",index,completeString)->
        if typeof index is "number" and index isnt 0
            return null
        match = contentString.match reg
        if match
            return {
                start:match.index
                end:match.index + match[0].length
                match:match
            }
        return null
    compose:()->
        # return false is not change or destroyed
        match = @contentString.match(reg)
        myIndex = @parent.indexOf(this)
        if not match or match.index isnt 0 or match[0].length isnt @length or myIndex isnt 0
            @toNormalTextInPlace()
            @dirty = true
            @parent?.dirty = true
            return true
        return false

class ListItem extends COMRichText
    @preferedUnorderedPrefix = "*"
    @isContentMatchListItem = (content)->
        /^( *)(?:-|\*|\+|[0-9]+(\.|\)|、)) +.*\n?$/.test content
    @isContentMatchListItemHeader = (content)->
        /^( *)(?:-|\*|\+|[0-9]+(\.|\)|、)) +\n?$/.test content
    type:"ListItem"
    onRootAvailable:()->
        super()
        @pend()
    isSingleLine:true
    constructor:(@context,@data = {})->
        @appearance = {
            tagName:"span"
            classList:["com","com-rich-text","com-list-item","com-el-single-line"]
        }
        @privateSpells = [ListItemHeadSpell]
        super @context,@data
        #ListItem.headHighlight ?= new ListHeadHighlight()
        #@decorationMaintainers.push ListItem.headHighlight
        @spacePerIndent ?= 4
        @registerCommand "indentForward",()=>
            max = @guessMaxIndent()
            current = @getIndentLevel()
            if current < max
                @setIndentLevel(current + 1)
            else
                @setIndentLevel(0)
            return true
        @registerCommand "indentBackward",()=>
            current = @getIndentLevel()
            if current > 0
                @setIndentLevel(current - 1)
            else
                @setIndentLevel(0)
            return true

        @isCollapsed = false
        @collapseListItems = []
        if @data.collapseListItems and @data.collapseListItems.length > 0
            for item in @data.collapseListItems
                @collapseListItems.push @context.createElement item
            @isCollapsed = true
            @collapseIndent = @data.collapseIndent or 0
        @composePolicy.behave {
            borrow: true
            lend: false
            tailingNewline: true
        }
        @layout = "block"
        if @getHead()?.indexOf("*") >= 0
            ListItem.preferedUnorderedPrefix = "*"
        else if @getHead()?.indexOf("-") >= 0
            ListItem.preferedUnorderedPrefix = "-"
        else if @getHead()?.indexOf("+") >= 0
            ListItem.preferedUnorderedPrefix = "+"
        @headerClickCheck = @headerClickCheck.bind(this)
        @gtd = @data.gtd or {}
        return this
    getTodoType:()->
        todos = @filterRunes (item)->
            return item.sortOf("Todo")
        if todos.length is 0
            return null
        return todos[0].state
    isEmpty:()->
        return @contentString.trim().indexOf(" ") < 0
    anchorAtBeginText:()->
        anchor = @anchor.clone()
        anchor.index = @getHead()?.length or 0
        return anchor
    trigger:(option = {})->
        if not option.force and option.via isnt "tap" and option.via isnt "holder"
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
        indent = @getIndentLevel()
        while true
            next = target.next()
            if next and next.sortOf("ListItem") and next.getIndentLevel() > indent
                items.push next
                target = next
                continue
            break
        if items.length is 0
            return false
        @context.operate new CollapseListContentOperation @context,this,{items,indent}
        cursorToSave = []
        @gtd = {todo:0,done:0,cancel:0,pending:0}
        for item in items
            todoType = item.getTodoType()
            if todoType
                @gtd[todoType] += 1
            for anchor in item.anchors or []
                if anchor.cursor
                    cursorToSave.push anchor.cursor
            item.remove()
        tail = @anchor.clone()
        tail.endOfLine()
        for cursor in cursorToSave
            cursor.pointAtAnchor tail
        return true
    getOrderIndex:()->
        if @listType is "list"
            return -1
        return parseInt @getHeadPrefix()
    getPrefixDecorator:()->
        return @getHead()?.replace(/[0-9]+/g,"").trim()
    expand:()->
        if not @isCollapsed
            return false

        items = @collapseListItems.slice()
        items.reverse()
        for item in items
            @after item
        indent = @getIndentLevel()
        if indent isnt @collapseIndent
            change = indent - @collapseIndent
            for item in items
                item.setIndentLevel(item.getIndentLevel() + change)
        @gtd = {}
        @context.operate new ExpandListContentOperation @context,this,{}
        return true
    getSubList:()->
        items = []
        next = this
        indent = @getIndentLevel()
        while next = next.next()
            if not next.sortOf("ListItem")
                return items
            if next.getIndentLevel() > indent
                items.push next
            else
                return items
        return items
    getNextUpperLevel:()->
        next = this
        indent = @getIndentLevel()
        while next = next.next()
            if not next.sortOf("ListItem")
                return null
            if next.getIndentLevel() <= indent
                return next
        return null
    getPreviousUpperLevel:()->
        previous = this
        indent = @getIndentLevel()
        while previous = previous.previous()
            if not previous.sortOf("ListItem")
                return null
            if previous.getIndentLevel() <= indent
                return previous
        return null
    toContentString:(option)->
        cs = super option
        if not @isCollapsed or cs is ""
            return cs
        after = ""
        for item in @collapseListItems
            after += item.toContentString(option)
        return cs + after
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
            if item.indexOf("com-list-item-indent-space") is 0
                @el.classList.remove item
            if item.indexOf("gtd-inside") is 0
                @el.classList.remove item
        @el.classList.add "com-list-item-indent-space-#{@getIndentLevel() * @spacePerIndent}"
        if @isCollapsed
            @el.classList.add "collapsed"
            # We don't damn care about cancel
            for prop in ["todo","done","pending","cancel"]
                if @gtd[prop] > 0
                    @el.classList.add "gtd-inside-#{prop}"
        else
            @el.classList.remove "collapsed"
        @el.removeEventListener "mousedown",@headerClickCheck
        @el.addEventListener "mousedown",@headerClickCheck
        return true
    headerClickCheck:(e)->
        src = e.target or e.srcElement
        if src?.classList?.contains "com-inline-list-head"
            e.stopImmediatePropagation()
            e.preventDefault()
            @context.transact ()=>
                if @isCollapsed
                    @expand()
                else
                    @collapse()
    clone:()->
        result = super()
        if not result
            return result
        if @isCollapsed
            result.isCollapsed = @isCollapsed
            result.collapseListItems = (item.clone() for item in @collapseListItems)
            result.collapseIndent = @collapseIndent
        return result
    slice:(option)->
        slice = super(option)
        if not slice
            return null
        if slice.isPartial and not slice.looseComplete
            return slice
        return @clone()
    toHumanString:()->
        result = [super()]
        if @isCollapsed
            for item in @collapseListItems
                result.push item.toHumanString()
        return result.join ""
    toJSON:(option)->
        json = super(option)
        if not json
            return null
        # just copy part of it not complete
        if @isCollapsed
            json.isCollapsed = true
            results = []
            for item in @collapseListItems
                results.push item.toJSON()
            json.collapseListItems = results
            json.collapseIndent = @collapseIndent
            json.gtd = {
                todo:@gtd.todo or 0
                pending:@gtd.pending or 0
                done:@gtd.done or 0
                cancel:@gtd.cancel or 0
            }
        return json
    getHead:()->
        contentString = @contentString
        index = 0
        while contentString[index] is " "
            index += 1
        while contentString[index] isnt " "
            index += 1
        return contentString.slice(0,index)
    getType:()->
        @updateType()
        return @listType
    updateType:()->
        head = @getHead()?.trim() or ""
        if head is "*"
            @listType = "list"
        else if head is "-"
            @listType = "list"
        else if head is "+"
            @listType = "list"
        else if /[0-9]+(\.|\)|、)/.test head
            @listType = "order"
        else
            @listType = "list"
    getHeadPrefix:()->
        return @getHead().trim()
    toggleOrderType:()->
        if @getType() is "list"
            @toOrdered()
        else
            @toUnordered()
    toOrdered:()->
        return @setHeadPrefix "1."
    toUnordered:()->
        return @setHeadPrefix ListItem.preferedUnorderedPrefix or "-"
    setHeadPrefix:(prefix = "")->
        prefix = prefix.trim()
        if not prefix
            return false
        space = @getIndentSpace()
        head = "#{space}#{prefix} "
        oldHead = @getHead()
        @insertText oldHead.length,head
        @removeText 0,oldHead.length
        return true
    getHead:()->
        match = @contentString.match ListHeadReg
        if not match
            return ""
        return match[0]
    guessMaxIndent:()->
        return @guessPreviousIndentLevel() + 1
    guessPreviousIndentLevel:()->
        recursive = 2
        previous = @previous()
        while previous and recursive > 0
            recursive -= 1
            if previous instanceof ListItem
                return previous.getIndentLevel()
            previous = previous.previous()
        return 0
    getIndentSpace:()->
        content = @contentString
        index = 0
        while content[index] is " "
            index++
        return content.slice(0,index)
    getIndentLevel:()->
        content = @contentString
        index = 0
        while content[index] is " "
            index++
        return Math.floor(index/@spacePerIndent)
    setIndentLevel:(level)->
        if level < 0
            level = 0
        level = parseInt(level) or 0
        content = @contentString
        previousLength = content.length
        editIndex = @anchor.index or 0
        index = 0
        while content[index] is " "
            index++
        toAdd = level * @spacePerIndent - index
        if toAdd > 0
            spaces = ""
            for _ in [0...toAdd]
                spaces += " "
            @insertText(0,spaces)
        else if toAdd < 0
            @removeText(0,-toAdd)
        currentLength = @contentString.length
        editIndex -= (previousLength - currentLength)
        if editIndex < 0
            editIndex = 0
        if @anchor.isActive
            @anchor.index = editIndex

ListHeadReg = /^\s*(-|\*|\+|[0-9]+(\.|\)|、)) /
ListHeadRegG = /^\s*(-|\*|\+|[0-9]+(\.|\)|、)) /g
ListHeadHighlight = COMDecoration.createRegExpMaintainer "ListHead",ListHeadRegG,["com-inline-list-head"]

class CollapseListContentOperation extends COMOperation.EditOperation
    name:"CollapseListContentOperation"
    invoke:()->
        @target.collapseIndent = @option.indent
        @target.collapseListItems = @option.items or []
        @target.isCollapsed = true
        @target.dirty = true
        return true
    revoke:()->
        @target.collapseIndent = 0
        @target.collapseListItems = []
        @target.isCollapsed = false
        @target.dirty = true
        return true
class ExpandListContentOperation extends COMOperation.EditOperation
    name:"ExpandListContentOperation"
    invoke:()->
        @option.indent = @target.collapseIndent
        @option.items = @target.collapseListItems.slice()
        @target.isCollapsed = false
        @target.collapseListItems = []
        @target.dirty = true
        @target.collapseIndent = 0
        return true
    revoke:()->
        @target.isCollapsed = true
        @target.collapseListItems = @option.items.slice()
        @target.collapseIndent = @option.indent
        @target.dirty = true
        return true

module.exports = ListItem
