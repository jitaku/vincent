class Package extends Leaf.EventEmitter
    name:"VoidPackage"
    # runtime plugin depencencies
    requires:[]
    Commands:[]
    Hotkeys:[]
    Decorations:[]
    Spells:[]
    Runes:[]
    Elements:[]
    Composers:[]
    Intents:[]
    isInitialized:false
    onContextCreate:null
    onContextDestroy:null
    init:(@editor,@deps = {})->
        @isInitialized = true
        if typeof @onContextCreate is "function"
            @editor.contextManager.listenBy this,"context/create",(c)=>
                @onContextCreate(c)
        if typeof @onContextDestroy is "function"
            @editor.contextManager.listenBy this,"context/destroy",(c)=>
                @onContextDestroy(c)

module.exports = Package
