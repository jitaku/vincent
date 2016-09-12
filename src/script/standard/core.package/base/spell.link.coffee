COMSpell = require "/vincent/com/spell"
class LinkSpell extends COMSpell
    type:"Void"
    constructor:(args...)->
        @appearance ?= {
            tagName:"a"
            classList:["com","com-link","com-text"]
        }
        super args...
    parse:()->
        return null
    render:(args...)->
        super(args...)
        @el.setAttribute "target","_blank+#{Math.random()}"
        @parse()
        if @url
            @el.setAttribute "href",@url
        if @title
            @el.setAttribute "title",@title
    trigger:(option = {})->
        @parse()
        @context.castIntent "OpenIntent",@url
        return true
module.exports = LinkSpell
