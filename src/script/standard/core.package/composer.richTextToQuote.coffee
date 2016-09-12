Composer = require "../helper/composerUtils"
LeftInvokeOneLineElementExtractor = Composer.LeftInvokeOneLineElementExtractor
Quote = require "./element.quote"
module.exports = class RichTextToQuote extends LeftInvokeOneLineElementExtractor
    type:"RichText"
    reg:/(?:\n|^)( *)> +.*(?:\n|$)/
    renderTargetType:"Quote"
    renderTargetCtor:Quote
