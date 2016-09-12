Composer = require "../helper/composerUtils"
PairedElementExtractor = Composer.PairedElementExtractor

module.exports = class RichTextToLatex extends PairedElementExtractor
    type:"RichText"
    renderTargetType:"Latex"
    reg:/(?:\n|^)(?:\$\$\s*\n)(?:.|\n)*?(?:\$\$ *)(?:\n|$)/
