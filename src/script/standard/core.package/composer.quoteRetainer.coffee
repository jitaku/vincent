Composer = require "../helper/composerUtils"
LeftInvokeOneLineElementRetainer = Composer.LeftInvokeOneLineElementRetainer

module.exports = class QuoteRetainer extends LeftInvokeOneLineElementRetainer
    type:"Quote"
    reg:/^( *)> +.*\n?$/
