Composer = require "../helper/composerUtils"
ListItem = require "./element.listItem"
LeftInvokeOneLineElementExtractor = Composer.LeftInvokeOneLineElementExtractor
module.exports = class RichTextToListItem extends LeftInvokeOneLineElementExtractor
    type:"RichText"
    reg:/(?:\n|^)( *)(?:-|\*|\+|[0-9]+(\.|\)|、)) +.*(?:\n|$)/
    renderTargetType:"ListItem"
    renderTargetCtor:ListItem
