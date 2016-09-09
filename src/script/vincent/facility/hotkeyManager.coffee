class HotkeyManager
    constructor:(@editor)->
        @candidates = []
        @disables = []
        @isOSX = @editor.platform.isMac()
        @isLinux = @editor.platform.isLinux()
        @isWindows = @editor.platform.isWindows()
        # traces of rdebug
        @traces = null
        HotkeyManager.isOSX = @isOSX
    trace:(name)->
        @traces ?= []
        @traces.push name
    debug:()->
        @isDebug = true
    getHotkeyStatistics:()->
            {name:can.commandName or "(CODE)",keyString:can.keyString} for can in @candidates
    handleKeyEvent:(event)->
        if @isDebug
            Logger.debug("Disables",@disables)
        for item in @candidates by -1
            if item.type and item.type in @disables
                continue
            if @isDebug
                if item.test event
                    Logger.debug("test pass",item.commandName,item)
                else
                    Logger.debug("no pass",item.commandName)
            if @traces and item.commandName in @traces
                Logger.debug "test",item.commandName
                Logger.debug event,item.keyString
            if item.exec(event,@editor)
                if @isDebug
                    Logger.debug "exec finally",item.commandName,item
                event.capture?()
                return true
        return false
    registerCommandHotkey:(keyString,commandName,args...)->
        if typeof keyString is "object"
            match  = false
            for prop,value of keyString
                if prop is "win"
                    if @isWindows
                        match = true
                        @registerCommandHotkey value,commandName,args...
                else if prop is "osx"
                    if @isOSX
                        match = true
                        @registerCommandHotkey value,commandName,args...
                else if prop is "linux"
                    if @isLinux
                        match = true
                        @registerCommandHotkey value,commandName,args...
                else if prop is "default"
                    if not match
                        @registerCommandHotkey value,commandName,args...
            return

        hk = new Hotkey(keyString,{
            description:@editor.commands.getCommandDescription(commandName)
            handler:@editor.conduct.bind(@editor,commandName)
            commandName:commandName
            args:args
        })

        @register(hk)
    getCommandHotkey:(command)->
        cmd = command.toLowerCase()
        hks = []
        for cand in @candidates
            if cand.commandName is cmd
                hks.push cand
        return hks
    registerHotkey:(keyString,handler)->
        @register new Hotkey(keyString,handler)
    register:(hotkey)->
        if not hotkey.isValid
            Logger.error "will to register a invalid hotkey",hotkey
        @candidates.push hotkey
    enableAll:()->
        @disables = []
    disableInput:()->
        @disables.push "input"
    disableBuffer:()->
        @disables.push "buffer"
    disableEditor:()->
        @disables.push "editor"
class Hotkey
    @normalize = (keyString)->
        return keyString.replace(/\s/g,"").replace(/>/g,"> ")
    keyStringReg = /^(input:|buffer:|editor:)?((<[^<>]+>\s*)*)([a-z0-9A-Z]+)(\s*@down)?(\s*@up)?$/
    modifierReg = /<([^<]+)>/gi
    constructor:(keyString = "",@handler)->
        matches = keyString.match keyStringReg
        @isValid = true
        if not matches
            Logger.error "invalid hotkey string #{keyString}"
            @isValid = false
            return
        @commandName = @handler.commandName
        @type = matches[1]?.replace(":","") or "buffer"
        if @type not in ["buffer","editor","input"]
            Logger.error "invalid hotkey type",@type
            @isValid = false
            return false
        modifiers = matches[2]
        modifierReg.lastIndex = 0
        while result = modifierReg.exec modifiers
            keyName = result[1]?.trim()?.toLowerCase()
            if keyName is "ctrl"
                @ctrlKey = true
            if keyName is "alt"
                @altKey = true
            if keyName is "shift"
                @shiftKey = true
            if keyName is "meta"
                @metaKey = true
            if keyName is "mod"
                @modKey = true
            if keyName is "command"
                @commandKey = true
        @keyName = matches[4]
        @keyDown = matches[5] and true or false
        @keyUp = matches[6] and true or false
        if not @keyDown and not @keyUp
            @keyDown = true
        @keyString = Hotkey.normalize keyString
        @description = @handler.description or "unkown hotkey description"
    testKeyString:(string)->
        hk = new Hotkey(string,{})
        prop = ["keyName","ctrlKey","altKey","metaKey","shiftKey","modKey","commandKey","keyUp","keyDown"]
        for name in prop
            if hk[name] isnt @[name]
                return false
        return true
    test:(event)->
        if typeof event is "string"
            return @testKeyString event
        result = false
        if event.isKey(@keyName) and (event.shiftKey^@shiftKey) is 0 and (event.altKey^@altKey) is 0 and (event.keyUp^@keyUp) is 0 and (event.keyDown^@keyDown) is 0 and event.isModMatch(@ctrlKey,@commandKey,@modKey)
            result = true
        return result
    exec:(event,editor)->
        if not @test event
            return false
        result = null
        transact = editor.context?.transact.bind(editor.context) or (handler)=>
            handler()
        transact ()=>
            result = @invoke(editor,event)
        return result
    invoke:(editor,event)->

        if typeof @handler is "function"
            args = @args or []
            @handler(editor,args...)
        else if typeof @handler.handler is "function"
            args = @handler.args or @args or []
            @handler.handler(args...)
    prettifyHTML:()->
        command = "⌘"
        if HotkeyManager.isOSX
            mod = command
            opt = "⌥"
            shift = "⇧"
            shift = "Shift"
            ctrl = "Ctrl"
        else
            mod = "Ctrl"
            opt = "Alt"
            shift = "Shift"
            ctrl = "Ctrl"
        map = {
            "<mod>":mod
            "<ctrl>":ctrl
            "<alt>":opt
            "<shift>":shift
            "<command>":command
            left:"←"
            right:"→"
            up:"↑"
            down:"↓"
            slash:"/"
            equal:"="
            comma:","
            period:"."
            escape:"esc"
        }
        ks = @keyString
        ks = ks.replace /^.+:/,""
        for key,value of map
            ks = ks.replace key,value
        arr = ks.split(/\s/).filter (item)->item
        arr = arr.map (item)->
            return "<key>" + item[0].toUpperCase() + item.slice(1) + "</key>"
        return arr.join("+")
    prettify:()->
        # code http://tech.karbassi.com/2009/05/27/command-option-shift-symbols-in-unicode/
        command = "⌘"
        if HotkeyManager.isOSX
            mod = command
            opt = "⌥"
            shift = "⇧"
            shift = "Shift"
            ctrl = "Ctrl"
        else
            mod = "Ctrl"
            opt = "Alt"
            shift = "Shift"
            ctrl = "Ctrl"
        map = {
            "<mod>":mod
            "<ctrl>":ctrl
            "<alt>":opt
            "<shift>":shift
            "<command>":command
            left:"←"
            right:"→"
            up:"↑"
            down:"↓"
            slash:"/"
            equal:"="
            comma:","
            period:"."
            escape:"esc"
        }
        ks = @keyString
        ks = ks.replace /^.+:/,""
        for key,value of map
            ks = ks.replace key,value
        arr = ks.split(/\s/).filter (item)->item
        arr = arr.map (item)->
            return item[0].toUpperCase() + item.slice(1)
        return arr.join(" + ")

    toString:()->
        return "[Hotkey #{@keyString}]"

module.exports = HotkeyManager
HotkeyManager.Hotkey = Hotkey
