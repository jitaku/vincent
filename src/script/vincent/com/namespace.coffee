Errors = require "./errors"
COMComposer = require "./composer"
# Namespace contains all behavior of the Context.
# 1. Composing
# 2. Available Element
# 3. Available Spell
# 4. Decorations
class COMNamespace
    constructor:()->
        @creators = {}
        @decorations = []
        @spells = []
        return this
    registerDecoration:(args...)->
        @decorations.push args...
    registerSpell:(args...)->
        @spells.push args...
    registerComposer:(name,composer)->
        if name instanceof COMComposer
            composer = name
            name = composer.type
        target = @creators[name]
        if not target
            Logger.debug target,name,composer,"///"
            Logger.error "invalid composer target #{name}"
            return false
        target.composers ?= []
        target.composers.push composer
    initContext:(context)->
        for name,ctr of @creators
            ctr.creator.initContext? context
    registerNode:(creator)->
        if not creator::type
            Logger.error "invalid creator without Ctor::type"
            return false
        if @creators[creator::type]
            Logger.error "fail to register creator #{creator::type},type conflict",creator
            return false
        @creators[creator::type] = {type:creator::type,creator}
    sortOf:(a,type)->
        creator = @creators[type]?.creator
        if typeof a is "string"
            a = @creators[a]?.creator
            if a
                return a.prototype instanceof creator or a is creator
            else
                return false
        return (typeof creator is "function") and a instanceof creator
    create:(context,type,args...)->
        target = @creators[type]
        if not target
            Logger.error "Unregistered Node type #{type}"
            return null
        result = new target.creator context,args...
        return result
    compose:(target)->
        if not target.root or target.root isnt target.context?.root
            return false
        Ctor = @creators[target.type]
        #Logger.debug "composing",target.type
        if not Ctor
            throw new Errors.LogicError "compose unregistered element #{target.type}"
        composers = Ctor.composers or []
        window.perf ?= new Perf()
        for composer in composers
            perf.start(composer.constructor.name)
            #Logger.debug "test composer",composer.type,composer.constructor.name
            #
            result = composer.compose(target)
            perf.end(composer.constructor.name)
            if result
                #Logger.debug "run comp",composer.constructor.name,result
                return true

            if not target.root
                # Apparently, the target is modified,
                # but result is not true
                Logger.error "composer should return true if it changes it's target"
                #debugger
                return true
        return false
    clone:()->
        ns = new COMNamespace()
        for prop of @creators
            ns.creators[prop] = @creators[prop]
        ns.spells = @spells.slice()
        ns.decorations = @decorations.slice()
        return ns

module.exports = COMNamespace
