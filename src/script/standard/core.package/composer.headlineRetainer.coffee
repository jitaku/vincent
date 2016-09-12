Composer = require "../helper/composerUtils"
LeftInvokeOneLineElementRetainer = Composer.LeftInvokeOneLineElementRetainer

module.exports = class DividerRetainer extends LeftInvokeOneLineElementRetainer
    type:"Divider"
    reg:/^((===+)|(---+)) *\n?$/
