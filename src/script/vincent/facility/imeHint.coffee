Highlighter = require "./highlighter"
class IMEHint
    constructor:(@buffer)->
        @cursor = @buffer.cursor
        @highlighter = new Highlighter(@buffer)
        @lightSession = @highlighter.createSession()
    clear:()->
        @lightSession.clear()
    hint:(hint)->
        @clear()
        {start,end} = @cursor?.anchor?.getIMEAnchor(hint)
        if start and end
            @lightSession.addHighlight(start,end,{customClass:"ime-hint-highlight"})
            @lightSession.applyAll({force:true})
module.exports = IMEHint
