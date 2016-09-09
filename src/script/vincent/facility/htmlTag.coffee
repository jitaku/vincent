class HTMLTag
    constructor:(@name,@children,@props)->
        if typeof @children is "string"
            @name = "TEXT"
            @text = @children
            @children = null
            @props = null
        else
            @name = @name.toLowerCase()
    isText:()->
        return @name is "TEXT"
    addChild:(child)->
        if @children instanceof Array
            @children.push child
            child.parent = this
        else
            Logger.error "Can add child to Text element"
module.exports = HTMLTag
