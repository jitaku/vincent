Code = require "../code.package/element.code"
class LatexCode extends Code
    type:"LatexCode"
    constructor:(args...)->
        @withMarkdownWrapper = false
        @language = "latex"
        super args...
        @setLanguage @language
    getCodeContent:()->
        return @toHumanString()
    computeDecoration:()->
        @setLanguage(@language)
        super()
module.exports = LatexCode
