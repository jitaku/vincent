Leaf.Key.home = 36
Leaf.Key.end = 35
Leaf.Key.quote = 222
Leaf.Key.openBracket = 219
Leaf.Key.closeBracket = 221
Leaf.Key.backSlash = 220
Leaf.Key.slash = 191
Leaf.Key.comma = 188
Leaf.Key.period = 190
Leaf.Key.dash = 189
Leaf.Key.semiColon = 186
Leaf.Key.graveAccent = 192

hasCommandKey = false
window.hasCommandKey = false
outputMap = {}
for code in [65...90]
    outputMap[code] = String.fromCharCode(code)
isMac = window.navigator.platform?.toLowerCase()?.indexOf("mac") >= 0
clearCmdTimer = null
window.addEventListener "keydown",(e)->
    if e.which in [224,91,93] and isMac
        hasCommandKey = true
        window.hasCommandKey = true
        # Make sure cmd key is not keep pressing by all case
        clearTimeout clearCmdTimer
        setTimeout ()=>
            hasCommandKey = false
            window.hasCommandKey = false
        ,5000
window.addEventListener "keyup",(e)->
    if e.which in [224,91,93] and isMac
        hasCommandKey = false
        window.hasCommandKey = false
window.addEventListener "blur",(e)->
    hasCommandKey = false
    window.hasCommandKey = false
window.addEventListener "focus",(e)->
    hasCommandKey = false
    window.hasCommandKey = false

module.exports = class KeyEvent
    constructor:(@raw)->
        @code = @raw?.which
        @ctrlKey = @raw.ctrlKey
        @shiftKey = @raw.shiftKey
        @altKey = @raw.altKey
        @commandKey = hasCommandKey
        @simulateName = @raw.simulateName
        if @raw.type is "keydown"
            @keyDown = true
        else if @raw.type is "keyup"
            @keyUp = true
        else
            @keyDown = true
    capture:()->
        @defaultPrevented = true
        @propagationStoped = true
        @raw?.preventDefault?()
        @raw?.stopImmediatePropagation?()
    isValid:()->
        return not @defaultPrevented and not @propagationStoped
    canOutput:()->
        return @code in [48..57].concat [65..90],[
            Leaf.Key.space
            Leaf.Key.enter
            Leaf.Key.quote
            Leaf.Key.openBracket
            Leaf.Key.closeBracket
            Leaf.Key.backSlash
            Leaf.Key.slash
            Leaf.Key.comma
            Leaf.Key.period
            Leaf.Key.dash
            Leaf.Key.graveAccent
        ]
    getInputText:()->
        char =  outputMap[@code] or ""
        if not @shiftKey
            return char.toLowerCase()
        else
            return char.toUpperCase()
    isKey:(name)->
        if @simulateName is name
            return true
        return @code and Leaf.Key[name] is @code
    isModified:()->
        return @ctrlKey or @altKey
    isMod:()->
        return hasCommandKey or @ctrlKey
    isModMatch:(ctrl,command,mod)->
        if @ctrlKey
            # ctrlKey consumed?
            # by ctrl
            # or by mod key under mac
            if not ctrl and (isMac or mod isnt true)
                return false
        else
            # ctrlKey required
            # or no mac but mod key required
            if ctrl or (not isMac and (mod is true))
                return false
        if hasCommandKey
            # commandKey consumed?
            # by command
            # or by mod key
            if not command and mod isnt true
                return false
        else
            if command or (isMac and mod is true)
                return false
        return true
        if ctrl isnt @ctrlKey and (not isMac or mod isnt @ctrlKey)
            return false
        if command isnt hasCommandKey
            return false
        if isMac and mod isnt hasCommandKey
            if command isnt hasCommandKey
                return false
        if not isMac and mod isnt @ctrlKey
            if ctrl isnt @ctrlKey
                return false
        return true
