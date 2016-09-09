COMRichText = require "./com/richText"
Decoration = require "./com/decoration"
COMSpell = require "./com/spell"
COMElement = require "./com/element"
COMNamespace = require "./com/namespace"
COMNode = require "./com/node"
COMContext = require "./com/context"
COMComposer = require "./com/composer"

class Pack
    constructor:(packs...)->
        @decorations = []
        @spells = []
        @nodes = []
        @composers = []
        @add packs...
        @cmds = []
        @hotkeys = []
    add:(Cons...)->
        for item in Cons
            if item.prototype instanceof Decoration.DecorationMaintainer
                @decorations.push new item
            else if item instanceof Decoration.DecorationMaintainer
                @decorations.push item
            else if item.prototype instanceof COMSpell
                @spells.push item
            else if item.prototype instanceof COMNode
                @nodes.push item
            # Note: register composer use INSTANCE of composer
            # The following 2 statement are for this
            else if item instanceof COMComposer
                @composers.push item
            else if item.prototype instanceof COMComposer
                @composers.push new item()
            else
                Logger.error "unknown inline resource",item
    registerCommand:(cmd)->
        @cmds.push cmd
    registerHotkey:(keyString,handler)->
        @hotkeys.push {keyString,handler}
    applyTo:(target)->
        for item in @nodes
            target.registerNode item
        for item in @composers
            target.registerComposer item.type,item
        for item in @spells
            target.registerSpell item
        for item in @decorations
            target.registerDecoration item
    addConfig:(config)->
        for Command in config.Commands
            pack.registerCommand Command
        for Hotkey in config.Hotkeys
            pack.registerHotkey Hotkey
        for Decoration in config.Decorations
            pack.add Decoration
        for Spell in config.Spells
            pack.add Spell
        for Element in config.Elements
            pack.add Element
        for Composer in config.Composers
            pack.add Composer

module.exports = Pack
