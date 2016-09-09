class PluginManager
    constructor:(@editor)->
        @plugins = {}
        @pluginCtors = {}
        @dependencies = new Dependencies()
    register:(Plugin)->
        if not Plugin::name and not Plugin.name
            Logger.error "Invalid Plugin",Plugin
            throw new Error "invalid plugin without name"

        @editor.addPackageStatic Plugin
        @pluginCtors[Plugin::name or Plugin.name] = Plugin
        @dependencies.add {
            name: Plugin::name or Plugin.name
            requires: (Plugin::requires or Plugin.requires or [])

        }
    init:()->
        # dependencies should be resolved but not done yet.
        for prop,Ctor of @pluginCtors
            @initPlugin(prop)
    initPlugin:(name)->
        if @plugins[name]
            return true
        deps = @dependencies.get(name).flatten()
        Ctor = @pluginCtors[name]
        if typeof Ctor is "function"
            # Dynamic plugin
            @plugins[name] = new Ctor()
        else
            # Static plugin
            @plugins[name] = Ctor
        for dep in deps
            @initPlugin(dep)
        @plugins[name].init?(@editor,@plugins)

class Dependency
    constructor:(@name)->
        @dependencies = []
    addDirectDependency:(item)->
        parent = this
        name = item.name
        while parent
            if parent.name is item.name
                Logger.error "recursive dependencies #{@name} require #{name}"
                Logger.error "but #{@name} require is required by #{name}"
                throw new Error "recursive dependencies"
            parent = parent.parent
        item.parent = this
        @dependencies.push item
    flatten:(queue = [])->
        for child in @dependencies
            child.flatten(queue)
            if child.name not in queue
                queue.push child.name
        return queue
class Dependencies
    constructor:()->
        @items = {}
        @_state = 0
    add:(dep)->
        @_state++
        @items[dep.name] = dep
    get:(name)->
        target = @items[name]
        if not target
            return null
        return @getDependency(target)
    getDependency:(item,stack = [])->
        item.dependency = new Dependency(item.name)
        if item.name in stack
            throw new Error "recursive requires for #{item.name}"
        else
            stack.push item.name
        for child in item.requires or []
            if not @items[child]
                throw new Error "dependency #{child} not found"
            item.dependency.addDirectDependency(@getDependency(@items[child],stack.slice(0)))
        return item.dependency
module.exports = PluginManager
