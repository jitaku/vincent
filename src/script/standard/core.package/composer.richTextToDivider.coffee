Composer = require "../helper/composerUtils"
Divider = require "./element.divider"
LeftInvokeOneLineElementExtractor = Composer.LeftInvokeOneLineElementExtractor
module.exports = class RichTextToDivider extends LeftInvokeOneLineElementExtractor
    type:"RichText"
    renderTargetType:"Divider"
    renderTargetCtor:Divider
    reg:/(?:\n|^)((===+)|(---+)) *(?:\n|$)/
