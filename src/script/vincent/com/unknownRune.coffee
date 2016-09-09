i18n = require "./i18n"
COMRune = require "./rune"
class COMUnknownRune extends COMRune
    type:"UnknownRune"
    constructor:(@context,@data = {detail:null})->
        super(@context,@data)
        @appearance.classList?.push "com-unknown-rune"
    render:()->
        super()
        title = i18n.UnknownRuneTitle
        @el?.title = title
        @el?.setAttribute "title",title
        @el?.onclick = ()=>
            Logger.error "UnknownRuneDetail",JSON.stringify @data?.detail,null,4
    toJSON:()->
        return @data.detail

module.exports = COMUnknownRune
