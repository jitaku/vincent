Composer = require "../helper/composerUtils"
LeftInvokeOneLineElementExtractor = Composer.LeftInvokeOneLineElementExtractor

module.exports = class RichTextToHeadline extends LeftInvokeOneLineElementExtractor
    type:"RichText"
    renderTargetType:"Headline"
    reg:/(?:\n|^)( *)#{1,6} +.*(?:\n|$)/
    exec:(args...)->
        if super args...
            return true
        return false
