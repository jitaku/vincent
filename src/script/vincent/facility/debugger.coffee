class Debugger
    constructor:()->
        @saves = {}
        @debugFunctions = ["time","timeEnd","debug","log"]
        for prop in @debugFunctions
            @saves[prop] = console[prop]
    enable:(prop)->
        if prop and @saves[prop]
            console[prop] = @saves[prop]
        else
            for prop of @saves
                console[prop] = @saves[prop]
    disable:(prop)->
        if prop and @saves[prop]
            console[prop] = ()->
        else
            for prop of @debugFunctions
                console[prop] = ()->
module.exports = Debugger
