Composer = require "../helper/composerUtils"
PairedElementExtractor = Composer.PairedElementExtractor

class RichTextToCode extends PairedElementExtractor
    type:"RichText"
    renderTargetType:"Code"
    reg:/(?:\n|^)(?: *```[^`\n]*\n)(?:[^`]|\\`)*?(?:``` *)(?:\n|$)/
    reg:/(?:\n|^)(?: *```[^`\n]*\n)[\s\S]*?(?:``` *)(?:\n|$)/

module.exports = RichTextToCode
