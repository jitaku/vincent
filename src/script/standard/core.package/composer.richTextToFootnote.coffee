Composer = require "../helper/composerUtils"
LeftInvokeOneLineElementExtractor = Composer.LeftInvokeOneLineElementExtractor

module.exports = class RichTextToFootnote extends LeftInvokeOneLineElementExtractor
    type:"RichText"
    renderTargetType:"Footnote"
    reg:/(?:\n|^)( *)\[\^?[^\[\]\n]*\]: *.*(?:\n|$)/
    exec:(args...)->
        if super args...
            return true
        return false
