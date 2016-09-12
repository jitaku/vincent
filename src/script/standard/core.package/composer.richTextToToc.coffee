Composer = require "../helper/composerUtils"
PairedElementExtractor = Composer.PairedElementExtractor

module.exports = class RichTextToToc extends PairedElementExtractor
    type:"RichText"
    renderTargetType:"Toc"
    reg:/(?:\n|^)\[toc\](?:\n|$)/i
