Buffer = require "./buffer"
class CommandManager
    constructor:(@editor)->
        @entries = {}
    register:(cmd)->
        if not cmd
            Logger.error "register command request a object like {name,description,handler}"
            return false
        if not cmd.name
            Logger.error "invalid command name provided"
            return false
        if not cmd.handler
            Logger.error "invalid command handler provided"
            return false
        if @entries[cmd.name]
            Logger.error "duplicate command name #{cmd.name}"
            return false
        @entries[cmd.name] = {
            name:cmd.name
            description:cmd.description
            invoke:cmd.handler
            option:cmd.option or null
            global:cmd.global or false
        }
        return true
    conduct:(name,args...)->
        result = false
        cmd = @entries[name]
        if not cmd
            return false
        if cmd.context and (not @editor.context or @editor.context.isReadonly)
            return false
        transact = @editor.context?.transact.bind(@editor.context) or (handler)->
            handler()
        transact ()=>
            result = cmd.invoke(@editor,args...) or false
        return result
    has:(name)->
        return @entries[name] and true or false
    getCommandDescription:(name)->
        if not @has(name)
            return null
        return @entries[name].description or "<CMD #{name}> has no description"
module.exports = CommandManager
