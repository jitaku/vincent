Composer = require "../helper/composerUtils"
LeftInvokeOneLineElementRetainer = Composer.LeftInvokeOneLineElementRetainer

module.exports = class FootnoteRetainer extends LeftInvokeOneLineElementRetainer
    type:"Footnote"
    reg:/^( *)\[\^?[^\[\]\n]*\]: *.*\n?$/
