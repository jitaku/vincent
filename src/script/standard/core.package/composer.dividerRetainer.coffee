Composer = require "../helper/composerUtils"
LeftInvokeOneLineElementRetainer = Composer.LeftInvokeOneLineElementRetainer

module.exports = class HeadlineRetainer extends LeftInvokeOneLineElementRetainer
    type:"Headline"
    reg:/^( *)#{1,6} +.*\n?$/
    atRelease:(target,replacement)->
        # contentString > 0 for not completely copied
        if target.isCollapsed and target.collapseHeadContents?.length > 0 and target.contentString.length > 0
            items = target.collapseHeadContents.slice()
            items.reverse()
            for item in items
                replacement.after item
