// Generated by CoffeeScript 1.10.0
(function() {
  var Dependencies, Dependency, PluginManager,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  PluginManager = (function() {
    function PluginManager(editor) {
      this.editor = editor;
      this.plugins = {};
      this.pluginCtors = {};
      this.dependencies = new Dependencies();
    }

    PluginManager.prototype.register = function(Plugin) {
      if (!Plugin.prototype.name && !Plugin.name) {
        Logger.error("Invalid Plugin", Plugin);
        throw new Error("invalid plugin without name");
      }
      this.editor.addPackageStatic(Plugin);
      this.pluginCtors[Plugin.prototype.name || Plugin.name] = Plugin;
      return this.dependencies.add({
        name: Plugin.prototype.name || Plugin.name,
        requires: Plugin.prototype.requires || Plugin.requires || []
      });
    };

    PluginManager.prototype.init = function() {
      var Ctor, prop, ref, results;
      ref = this.pluginCtors;
      results = [];
      for (prop in ref) {
        Ctor = ref[prop];
        results.push(this.initPlugin(prop));
      }
      return results;
    };

    PluginManager.prototype.initPlugin = function(name) {
      var Ctor, base, dep, deps, i, len;
      if (this.plugins[name]) {
        return true;
      }
      deps = this.dependencies.get(name).flatten();
      Ctor = this.pluginCtors[name];
      if (typeof Ctor === "function") {
        this.plugins[name] = new Ctor();
      } else {
        this.plugins[name] = Ctor;
      }
      for (i = 0, len = deps.length; i < len; i++) {
        dep = deps[i];
        this.initPlugin(dep);
      }
      return typeof (base = this.plugins[name]).init === "function" ? base.init(this.editor, this.plugins) : void 0;
    };

    return PluginManager;

  })();

  Dependency = (function() {
    function Dependency(name1) {
      this.name = name1;
      this.dependencies = [];
    }

    Dependency.prototype.addDirectDependency = function(item) {
      var name, parent;
      parent = this;
      name = item.name;
      while (parent) {
        if (parent.name === item.name) {
          Logger.error("recursive dependencies " + this.name + " require " + name);
          Logger.error("but " + this.name + " require is required by " + name);
          throw new Error("recursive dependencies");
        }
        parent = parent.parent;
      }
      item.parent = this;
      return this.dependencies.push(item);
    };

    Dependency.prototype.flatten = function(queue) {
      var child, i, len, ref, ref1;
      if (queue == null) {
        queue = [];
      }
      ref = this.dependencies;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        child.flatten(queue);
        if (ref1 = child.name, indexOf.call(queue, ref1) < 0) {
          queue.push(child.name);
        }
      }
      return queue;
    };

    return Dependency;

  })();

  Dependencies = (function() {
    function Dependencies() {
      this.items = {};
      this._state = 0;
    }

    Dependencies.prototype.add = function(dep) {
      this._state++;
      return this.items[dep.name] = dep;
    };

    Dependencies.prototype.get = function(name) {
      var target;
      target = this.items[name];
      if (!target) {
        return null;
      }
      return this.getDependency(target);
    };

    Dependencies.prototype.getDependency = function(item, stack) {
      var child, i, len, ref, ref1;
      if (stack == null) {
        stack = [];
      }
      item.dependency = new Dependency(item.name);
      if (ref = item.name, indexOf.call(stack, ref) >= 0) {
        throw new Error("recursive requires for " + item.name);
      } else {
        stack.push(item.name);
      }
      ref1 = item.requires || [];
      for (i = 0, len = ref1.length; i < len; i++) {
        child = ref1[i];
        if (!this.items[child]) {
          throw new Error("dependency " + child + " not found");
        }
        item.dependency.addDirectDependency(this.getDependency(this.items[child], stack.slice(0)));
      }
      return item.dependency;
    };

    return Dependencies;

  })();

  module.exports = PluginManager;

}).call(this);
