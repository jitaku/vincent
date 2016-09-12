Composer = require "../helper/composerUtils"
LeftInvokeOneLineElementRetainer = Composer.LeftInvokeOneLineElementRetainer

module.exports = class ListItemRetainer extends LeftInvokeOneLineElementRetainer
    type:"ListItem"
    reg:/^( *)(?:-|\*|\+|[0-9]+(\.|\)|、)) +.*\n?$/
    atRelease:(target,replacement)->
        if target.isCollapsed and target.collapseListItems?.length > 0 and target.contentString.length > 0
            items = target.collapseListItems.slice()
            items.reverse()
            for item in items
                replacement.after item
