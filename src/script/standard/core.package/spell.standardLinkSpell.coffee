LinkSpell = require "./base/spell.link"

class StandardLinkSpell extends LinkSpell
    reg = new RegExp '(([0-9a-zA-Z\\.\\-]+):)(//([^`/?#\\(\\) \n*]*))([^`?# \\(\\)\n*]*)(\\?([^#\\(\\) \n`*]*))?(#([^\\(\\) \n`*]*))?'
    test:(contentString = "")->
        match = contentString.match reg
        if match
            return {
                start:match.index
                end:match.index + match[0].length
                match:match
            }
        return null
    type:"StandardLinkSpell"
    constructor:(@context,@option = {})->
        super(@context,@option)
    parse:()->
        match = @contentString.match(reg)
        url = match[0]
        if url isnt @url
            @url = url
        return @url or null
    compose:()->
        # return false is not change or destroyed
        match = @contentString.match(reg)
        if not match or match.index isnt 0 or match[0].length isnt @length
            @toNormalTextInPlace()
            @dirty = true
            @parent?.dirty = true
            return true
        url = match[0]
        if url isnt @url
            @url = url
            @parent?.dirty = true
            @dirty = true
        return false

module.exports = StandardLinkSpell
