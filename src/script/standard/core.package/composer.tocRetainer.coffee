Composer = require "../helper/composerUtils"
PairedElementRetainer = Composer.PairedElementRetainer

module.exports = class TocRetainer extends PairedElementRetainer
    type:"Toc"
    reg:/^\[toc\] *\n?$/i
