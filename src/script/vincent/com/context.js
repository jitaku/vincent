// Generated by CoffeeScript 1.10.0
(function() {
  var COMContainer, COMContents, COMContext, COMCursor, COMIntent, COMNamespace, COMNode, COMRichText, COMRoot, COMRune, COMRuneCache, COMSpell, COMText, COMUnknownRune, CheckPointProvider, ComposableTrait, ComposeContext, Compressor, CursorManagerTrait, Errors, EventEmitter, FacilityAttachable, IntentCapable, MetaManagerTrait, NestedContextTrait, NodeAttachableTrait, OperationHistory, PluginStorageCapable, PropertyTrait, RenderContext, RenderableTrait, SharedCallbacks, Trait, Walker,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  COMRoot = require("./root");

  COMNode = require("./node");

  COMContainer = require("./container");

  COMContents = require("./contents");

  COMCursor = require("./cursor");

  COMNamespace = require("./namespace");

  COMRichText = require("./richText");

  COMRune = require("./rune");

  COMSpell = require("./spell");

  COMUnknownRune = require("./unknownRune");

  COMText = require("./text");

  Walker = require("./helper/walker");

  EventEmitter = (require("./events")).EventEmitter;

  Errors = require("./errors");

  COMRuneCache = require("./runeCache");

  Compressor = require("./helper/compressor");

  COMIntent = require("./intent");

  SharedCallbacks = require("./helper/sharedCallbacks");

  Trait = require("./helper/trait");

  RenderContext = (function(superClass) {
    extend(RenderContext, superClass);

    function RenderContext(context1, id1) {
      this.context = context1;
      this.id = id1;
      RenderContext.__super__.constructor.call(this);
      this.caches = {};
      this.interactive = true;
      this.renderConfig = {};
    }

    RenderContext.prototype.destroy = function() {
      this.emit("destroy");
      return this.caches = null;
    };

    RenderContext.prototype.cache = function(id) {
      if (!this.caches[id]) {
        this.caches[id] = {};
      }
      return this.caches[id];
    };

    RenderContext.prototype.staticize = function() {
      var child, container, contents, el, i, index, j, l, len, len1, ref, ref1, ref2, results, t;
      contents = this.context.root.children[0];
      container = contents.el;
      ref = contents.children;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        el = child.el;
        ref1 = [el.offsetLeft, el.offsetTop], l = ref1[0], t = ref1[1];
        child.position = {
          l: l,
          t: t
        };
      }
      ref2 = contents.children;
      results = [];
      for (index = j = 0, len1 = ref2.length; j < len1; index = ++j) {
        child = ref2[index];
        child.el.style.position = "absolute";
        child.el.style.left = "0";
        child.el.style.top = "0";
        child.el.style.transform = "translateX(" + child.position.l + "px) translateY(" + child.position.t + "px)";
        if (index < 500) {
          child.el.style.display = "none";
          results.push(child.el.parentElement.removeChild(child.el));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    return RenderContext;

  })(EventEmitter);

  IntentCapable = (function(superClass) {
    extend(IntentCapable, superClass);

    function IntentCapable() {
      return IntentCapable.__super__.constructor.apply(this, arguments);
    }

    IntentCapable.prototype.Intent = COMIntent;

    IntentCapable.prototype.getConstructor = function(name) {
      return this.namespace.creators[name].creator;
    };

    IntentCapable.prototype.createIntent = function() {
      var Intent, args, name;
      name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      Intent = this.Intent.Intents[name];
      if (!Intent) {
        return null;
      }
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Intent, [this.context].concat(slice.call(args)), function(){});
    };

    IntentCapable.prototype.castIntent = function() {
      var args, intent, result;
      intent = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (intent instanceof COMIntent) {
        this.emit("intent", intent);
        return true;
      }
      result = this.createIntent.apply(this, [intent].concat(slice.call(args)));
      if (!result) {
        Logger.error("Intent not found:", intent);
        return false;
      }
      this.emit("intent", result);
      return true;
    };

    return IntentCapable;

  })(Trait);

  COMContext = (function(superClass) {
    extend(COMContext, superClass);

    COMContext.namespace = new COMNamespace();

    COMContext.index = 0;

    function COMContext(option) {
      if (option == null) {
        option = {};
      }
      COMContext.__super__.constructor.call(this);
      new IntentCapable(this);
      new RenderableTrait(this);
      new PropertyTrait(this);
      new NestedContextTrait(this);
      new CursorManagerTrait(this);
      new MetaManagerTrait(this);
      new PluginStorageCapable(this);
      new FacilityAttachable(this);
      new ComposableTrait(this);
      new NodeAttachableTrait(this);
      this.enableAsync = false;
      this.namespace = option.namespace || COMContext.namespace.clone();
      this.runeCache = new COMRuneCache(this);
      this.root = this.createElement("Root", {
        withContext: true
      });
      this.id = (COMContext.index++).toString();
      this.__defineGetter__("locked", (function(_this) {
        return function() {
          return _this.composeContext.isComposing;
        };
      })(this));
      this.__defineGetter__("isSelfReadly", (function(_this) {
        return function() {
          return _this._isReadonly;
        };
      })(this));
      this.__defineGetter__("isReadonly", (function(_this) {
        return function() {
          var ref;
          return _this._isReadonly || ((ref = _this.parent) != null ? ref.isReadonly : void 0);
        };
      })(this));
      this.__defineSetter__("isReadonly", (function(_this) {
        return function(v) {
          _this._isReadonly = v;
          return _this.emit("readonly", _this._isReadonly);
        };
      })(this));
      this.define("title");
      this.define("type");
      this.define("ownerName");
      this.define("noteName");
      this.namespace.initContext(this);
    }

    COMContext.prototype.fromJSON = function(json) {
      var prop, ref, ro, value;
      ro = this.isReadonly;
      this.isReadonly = false;
      this.root.fromJSON(json.content);
      this.revision = json.revision || 1;
      if (json.pluginStorage) {
        ref = json.pluginStorage;
        for (prop in ref) {
          value = ref[prop];
          this.setPluginData(prop, value);
        }
      }
      this.compose();
      this.isReadonly = ro;
      return this;
    };

    COMContext.prototype.toJSON = function() {
      var json, prop, ref, ref1, value;
      if (this._jsonHistory && this.revision === this._jsonHistory.revision) {
        return this._jsonHistory;
      }
      this._jsonHistory = json = {
        content: this.root.toJSON(),
        revision: this.revision
      };
      ref = this.metas;
      for (prop in ref) {
        value = ref[prop];
        if (value != null ? value.toJSON : void 0) {
          value = value.toJSON();
        }
        json[prop] = value;
      }
      if (this.pluginStorage) {
        json.pluginStorage = this.getPluginStorageJSON();
      }
      json.humanString = this.toHumanString();
      json.digest = ((ref1 = json.humanString) != null ? ref1.slice(0, 1000).replace(/(^|\n)#{1,6}\s+.*/, "").trim() : void 0) || "";
      return json;
    };

    COMContext.prototype.toHumanString = function() {
      var ref;
      if (this._humanStringRevision === this.revision) {
        return this._humanStringCache;
      } else {
        this._humanStringCache = ((ref = this.root) != null ? ref.toHumanString() : void 0) || "";
        this._humanStringRevision = this.revision;
        return this._humanStringCache;
      }
    };

    COMContext.prototype.createElement = function() {
      var args, name, ref;
      name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (name instanceof COMNode) {
        return name.clone();
      } else if (typeof name.type === "string") {
        return this.namespace.create(this, name.type, name);
      } else if (typeof name === "string") {
        return (ref = this.namespace).create.apply(ref, [this, name].concat(slice.call(args)));
      }
      return null;
    };

    COMContext.prototype.forceChange = function() {
      this.revision += 1;
      return this.emit("change");
    };

    return COMContext;

  })(EventEmitter);

  NodeAttachableTrait = (function(superClass) {
    extend(NodeAttachableTrait, superClass);

    function NodeAttachableTrait() {
      return NodeAttachableTrait.__super__.constructor.apply(this, arguments);
    }

    NodeAttachableTrait.prototype.handleNodeAttach = function(node) {};

    NodeAttachableTrait.prototype.handleNodeDetach = function(node) {};

    return NodeAttachableTrait;

  })(Trait);

  PropertyTrait = (function(superClass) {
    extend(PropertyTrait, superClass);

    function PropertyTrait() {
      return PropertyTrait.__super__.constructor.apply(this, arguments);
    }

    PropertyTrait.prototype.waitPropertyAvailables = [];

    PropertyTrait.prototype.property = {};

    PropertyTrait.prototype.getWhenAvailable = function(name, callback) {
      if (this.property[name]) {
        callback(null, this.property[name]);
        return;
      }
      return this.waitPropertyAvailables.push({
        name: name,
        callback: callback
      });
    };

    PropertyTrait.prototype.getAndListenBy = function(who, name, callback) {
      this.listenBy(who, "property/" + name, callback);
      if (this.property[name]) {
        return callback(this.property[name]);
      }
    };

    PropertyTrait.prototype.define = function() {};

    PropertyTrait.prototype.get = function(name) {
      return this.property[name];
    };

    PropertyTrait.prototype.set = function(name, value) {
      this.property[name] = value;
      this.emit("property", name, value);
      this.emit("property/" + name, value);
      this.waitPropertyAvailables = this.waitPropertyAvailables.filter(function(item) {
        if (item.name === name) {
          item.callback(null, value);
          return false;
        }
        return true;
      });
    };

    return PropertyTrait;

  })(Trait);

  RenderableTrait = (function(superClass) {
    extend(RenderableTrait, superClass);

    function RenderableTrait() {
      return RenderableTrait.__super__.constructor.apply(this, arguments);
    }

    RenderableTrait.prototype.renderContexts = {};

    RenderableTrait.prototype.defaultRenderContext = null;

    RenderableTrait.prototype.initialize = function() {
      return this.defaultRenderContext = this.allocateRenderContext();
    };

    RenderableTrait.prototype.allocateRenderContext = function() {
      var id;
      if (this.renderContextOffset == null) {
        this.renderContextOffset = 0;
      }
      id = this.id * 10000 + this.renderContextOffset++;
      this.renderContexts[id] = new RenderContext(this, id);
      return this.renderContexts[id];
    };

    RenderableTrait.prototype.destroyRenderContext = function(rc) {
      if (rc.context !== this) {
        Logger.error("destroy context not belongs to current context", rc);
        return;
      }
      rc.destroy();
      return this.renderContexts[rc.id] = null;
    };

    RenderableTrait.prototype.setRenderContext = function(rc) {
      this.currentRenderContext = rc;
      return this.root.setRenderContext(rc);
    };

    RenderableTrait.prototype.render = function(rc, option) {
      if (rc == null) {
        rc = this.defaultRenderContext;
      }
      if (option == null) {
        option = {};
      }
      this.setRenderContext(rc);
      if (!this.root.dirty) {
        return;
      }
      return this.root.render(rc, option);
    };

    return RenderableTrait;

  })(Trait);

  NestedContextTrait = (function(superClass) {
    extend(NestedContextTrait, superClass);

    function NestedContextTrait() {
      return NestedContextTrait.__super__.constructor.apply(this, arguments);
    }

    NestedContextTrait.prototype.children = [];

    NestedContextTrait.prototype.parent = null;

    NestedContextTrait.prototype.addChild = function(context) {
      if (context.parent === this) {
        return true;
      }
      if (context.parent) {
        return false;
      }
      context.parent = this;
      return this.children.push(context);
    };

    NestedContextTrait.prototype.removeChild = function(context) {
      if (context.parent !== this) {
        return false;
      }
      this.children = this.children.filter(function(item) {
        return item === context;
      });
      context.parent = null;
      return true;
    };

    return NestedContextTrait;

  })(Trait);

  CursorManagerTrait = (function(superClass) {
    extend(CursorManagerTrait, superClass);

    function CursorManagerTrait() {
      return CursorManagerTrait.__super__.constructor.apply(this, arguments);
    }

    CursorManagerTrait.prototype.cursors = {};

    CursorManagerTrait.prototype.createCursor = function(option) {
      var cursor;
      cursor = new COMCursor(this, option);
      this.cursors[cursor.id] = cursor;
      cursor.listenBy(this, "destroyed", (function(_this) {
        return function() {
          cursor.stopListenBy(_this);
          return delete _this.cursors[cursor.id];
        };
      })(this));
      return cursor;
    };

    CursorManagerTrait.prototype.removeCursor = function(cursor) {
      return delete this.cursors[cursor.id];
    };

    CursorManagerTrait.prototype.getCursorsJSON = function() {
      var cursor, cursors, id, ref;
      cursors = {};
      ref = this.cursors;
      for (id in ref) {
        cursor = ref[id];
        cursors[id] = cursor.toJSON();
      }
      return cursors;
    };

    CursorManagerTrait.prototype.pointIdenticalCursors = function(cursor, node, option) {
      cursor.captureIdenticalCursors();
      cursor.pointAt(node, option);
      return cursor.transportIdenticalCursors();
    };

    CursorManagerTrait.prototype.pointIdenticalCursorsAnchor = function(cursor, anchor) {
      cursor.captureIdenticalCursors();
      cursor.pointAtAnchor(anchor);
      return cursor.transportIdenticalCursors();
    };

    CursorManagerTrait.prototype.ensureCursorValid = function() {
      var cursor, id, ref, results;
      ref = this.cursors;
      results = [];
      for (id in ref) {
        cursor = ref[id];
        if (!cursor.anchor || !cursor.anchor.node.root) {
          cursor.emit("invalid");
          if (this.cursors[cursor.id] === cursor) {
            results.push(cursor.begin());
          } else {
            results.push(void 0);
          }
        } else {
          results.push(cursor.conduct("applyTailBoundary"));
        }
      }
      return results;
    };

    return CursorManagerTrait;

  })(Trait);

  MetaManagerTrait = (function(superClass) {
    extend(MetaManagerTrait, superClass);

    function MetaManagerTrait() {
      return MetaManagerTrait.__super__.constructor.apply(this, arguments);
    }

    MetaManagerTrait.prototype.metas = {};

    MetaManagerTrait.prototype.setMeta = function(prop, value) {
      var change;
      if (this.metas[prop] === value) {
        return;
      }
      if (!Leaf.Util.compare(this.metas[prop], value)) {
        this.metas[prop] = value;
        change = {};
        change[prop] = value;
        this.emit("change/meta/" + prop, value);
        this.emit("change/meta", change);
        return this.emit("change");
      }
    };

    return MetaManagerTrait;

  })(Trait);

  PluginStorageCapable = (function(superClass) {
    extend(PluginStorageCapable, superClass);

    function PluginStorageCapable() {
      return PluginStorageCapable.__super__.constructor.apply(this, arguments);
    }

    PluginStorageCapable.prototype.pluginStorage = {};

    PluginStorageCapable.prototype.setPluginData = function(key, value) {
      if (this.pluginStorage[key] === value) {
        return;
      }
      if (!Leaf.Util.compare(this.pluginStorage[key], value)) {
        this.pluginStorage[key] = value;
        this.emit("pluginStorage/" + key, value);
        return this.emit("change");
      }
    };

    PluginStorageCapable.prototype.getPluginData = function(key) {
      return this.pluginStorage[key];
    };

    PluginStorageCapable.prototype.getPluginStorageJSON = function() {
      var json, prop, ref, value;
      json = {};
      ref = this.pluginStorage;
      for (prop in ref) {
        value = ref[prop];
        if (value != null ? value.toJSON : void 0) {
          json[prop] = value.toJSON();
        } else {
          json[prop] = value;
        }
      }
      return json;
    };

    return PluginStorageCapable;

  })(Trait);

  FacilityAttachable = (function(superClass) {
    extend(FacilityAttachable, superClass);

    function FacilityAttachable() {
      return FacilityAttachable.__super__.constructor.apply(this, arguments);
    }

    FacilityAttachable.prototype.facilities = {};

    return FacilityAttachable;

  })(Trait);

  ComposableTrait = (function(superClass) {
    extend(ComposableTrait, superClass);

    function ComposableTrait() {
      return ComposableTrait.__super__.constructor.apply(this, arguments);
    }

    ComposableTrait.prototype.composeOperations = [];

    ComposableTrait.prototype.seedOperations = [];

    ComposableTrait.prototype.nextComposeCallback = [];

    ComposableTrait.prototype.initialize = function() {
      this.composeContext = new ComposeContext(this);
      this.history = new OperationHistory(this);
      this.checkPointProvider = new CheckPointProvider(this);
      return this.nextComposeCallback = SharedCallbacks.create();
    };

    ComposableTrait.prototype.operate = function(operation) {
      var ref;
      if (this.isReadonly) {
        this.emit("editAttempt");
        return false;
      }
      if (operation.invoke()) {
        if (((ref = operation.target) != null ? ref.root : void 0) === this.root) {
          if (this.composeContext.isComposing) {
            this.composeOperations.push(operation);
          } else {
            this.seedOperations.push(operation);
          }
          this.emit("operate", operation);
        }
        return true;
      }
      return false;
    };

    ComposableTrait.prototype.nextCompose = function(handler) {
      if (!this.isComposing && !this.composeContext.requireCompose) {
        return handler();
      } else {
        return this.nextComposeCallback.push(handler);
      }
    };

    ComposableTrait.prototype["try"] = function(fn, debug) {
      var e, error;
      if (debug) {
        fn();
        return null;
      } else {
        try {
          fn();
        } catch (error) {
          e = error;
          return e;
        }
        return null;
      }
    };

    ComposableTrait.prototype.transact = function(executer) {
      var e, returnValue;
      returnValue = null;
      e = this["try"]((function(_this) {
        return function() {
          var result, transaction;
          transaction = _this.isTransaction;
          if (!_this.isTransaction) {
            if (!_this.history.isRedoing()) {
              _this.history.addCheckPoint();
            }
          }
          _this.isTransaction = true;
          result = executer();
          _this.isTransaction = transaction;
          if (!_this.isTransaction) {
            returnValue = _this.compose();
            if (!_this.isComposing && !_this.requireCompose) {
              return _this.runeCache.gc();
            }
          }
        };
      })(this), typeof window !== "undefined" && window !== null ? window.isDebug : void 0);
      if (e) {
        Logger.error("error occurs during COMContext transaction", e);
      }
      return returnValue;
    };

    ComposableTrait.prototype.compose = function() {
      var composeFinish, hasInput, start;
      this.isComposing = true;
      start = Date.now();
      if (this.seedOperations.length > 0) {
        this.history.addSeedRecord(this.seedOperations.slice());
        this.seedOperations.length = 0;
        hasInput = true;
        this.emit("hasInput");
      }
      this.composeOperations.length = 0;
      composeFinish = (function(_this) {
        return function() {
          var SLOW_COMPOSE, e, endCompose, error, hasCompose;
          if (_this.composeOperations.length > 0) {
            try {
              _this.history.addComposeRecord(_this.composeOperations.slice());
            } catch (error) {
              e = error;
              if (e.type === "multiCompose") {
                Logger.error(e, "multiCompose");
              } else if (e.type === "impossibleCompose") {
                Logger.error(e, "impossibleCompose");
              } else {
                Logger.error(e, "unkown compose");
              }
            }
            hasCompose = true;
            _this.emit("hasCompose");
          }
          SLOW_COMPOSE = 100;
          SLOW_COMPOSE = 10;
          endCompose = Date.now();
          if (endCompose - start > SLOW_COMPOSE) {
            Logger.debug("SLOW_COMPOSE", endCompose - start, "ms", ">", SLOW_COMPOSE, "ms");
          }
          _this.ensureCursorValid();
          _this.isComposing = false;
          if (_this.revision == null) {
            _this.revision = 0;
          }
          if (hasInput || hasCompose) {
            _this.revision += 1;
          }
          if (_this.checkPointProvider.consume() || true) {
            _this.history.addCheckPoint();
          }
          _this.emit("composeEnd", {
            hasInput: hasInput,
            hasCompose: hasCompose
          });
          if (hasInput || hasCompose) {
            _this.emit("change");
          }
          return _this.nextComposeCallback();
        };
      })(this);
      if (this.enableAsync) {
        return this.composeContext.composeAsync((function(_this) {
          return function() {
            return composeFinish();
          };
        })(this));
      } else {
        this.composeContext.compose();
        return composeFinish();
      }
    };

    ComposableTrait.prototype.requestCompose = function(who) {
      if (who.context !== this) {
        return;
      }
      return this.composeContext.add(who);
    };

    return ComposableTrait;

  })(Trait);

  CheckPointProvider = (function() {
    function CheckPointProvider(context1) {
      this.context = context1;
      this.value = 0;
      this.context.on("operate", (function(_this) {
        return function() {
          return _this.value += 3;
        };
      })(this));
      this.context.on("hasInput", (function(_this) {
        return function() {
          return _this.value += 1;
        };
      })(this));
      this.context.on("hasCompose", (function(_this) {
        return function() {
          return _this.value += 10;
        };
      })(this));
      this.threshold = 10;
    }

    CheckPointProvider.prototype.consume = function() {
      if (this.value > this.threshold) {
        this.value = 0;
        return true;
      }
      return false;
    };

    return CheckPointProvider;

  })();

  OperationHistory = (function() {
    function OperationHistory(context1) {
      this.context = context1;
      this.stack = [];
      this.index = -1;
      this.maxHistoryStep = 1000;
      this.checkPointCount = 0;
      this.overflowStepDeletion = 10;
    }

    OperationHistory.prototype.last = function() {
      return this.stack[this.stack.length - 1] || null;
    };

    OperationHistory.prototype.current = function() {
      return this.stack[this.index] || null;
    };

    OperationHistory.prototype.addSeedRecord = function(operations) {
      this.index += 1;
      this.stack.length = this.index;
      return this.stack.push({
        operations: operations,
        type: "Seed"
      });
    };

    OperationHistory.prototype.addComposeRecord = function(operations) {
      var last;
      last = this.last();
      if ((last != null ? last.type : void 0) === "Compose") {
        throw new Errors.LogicError("continuous composing record", {
          type: "multiCompose"
        });
      } else if ((last != null ? last.type : void 0) === "CheckPoint") {
        this.debug();
        throw new Errors.LogicError("composing next to check point", {
          type: "impossibleCompose",
          records: operations
        });
      }
      this.index++;
      this.stack.length = this.index;
      return this.stack.push({
        operations: operations,
        type: "Compose"
      });
    };

    OperationHistory.prototype.addCheckPoint = function() {
      if (this.isRedoing()) {
        return false;
      }
      return this.context.nextCompose((function(_this) {
        return function() {
          return _this._addCheckPoint();
        };
      })(this));
    };

    OperationHistory.prototype.enableCheckPoint = function() {
      return this.isCheckPointDisabled = false;
    };

    OperationHistory.prototype.disableCheckPoint = function() {
      return this.isCheckPointDisabled = true;
    };

    OperationHistory.prototype.isRedoing = function() {
      return this.index !== this.stack.length - 1;
    };

    OperationHistory.prototype._addCheckPoint = function(option) {
      var counter, i, index, item, len, ref, ref1, targetIndex;
      if (option == null) {
        option = {};
      }
      if (this.isCheckPointDisabled) {
        return;
      }
      this.index++;
      this.stack.length = this.index;
      if (((ref = this.stack[this.index - 1]) != null ? ref.type : void 0) === "CheckPoint") {
        this.stack.pop();
        this.checkPointCount -= 1;
        this.index--;
      }
      this.stack.push({
        type: "CheckPoint",
        cursors: this.context.getCursorsJSON(),
        time: Date.now()
      });
      this.checkPointCount += 1;
      if (this.checkPointCount > this.maxHistoryStep) {
        counter = this.overflowStepDeletion;
        ref1 = this.stack;
        for (index = i = 0, len = ref1.length; i < len; index = ++i) {
          item = ref1[index];
          if (item.type === "CheckPoint") {
            if (counter > 0) {
              counter -= 1;
              continue;
            } else {
              targetIndex = index;
              break;
            }
          } else {
            continue;
          }
        }
        if (!targetIndex) {

        } else {
          this.stack.splice(0, targetIndex);
          this.index -= targetIndex;
          return this.checkPointCount -= this.overflowStepDeletion;
        }
      }
    };

    OperationHistory.prototype.backward = function() {
      var i, id, json, op, ops, records, ref, ref1, ref2;
      if (((ref = this.current()) != null ? ref.type : void 0) !== "CheckPoint") {
        this.addCheckPoint();
      }
      records = [];
      while (true) {
        if (this.index === 0) {
          break;
        }
        if (this.index > 0) {
          this.index -= 1;
        }
        if (this.current().type === "CheckPoint") {
          break;
        }
        records.push(this.current());
      }
      if (records.length === 0) {
        return false;
      }
      records.reverse();
      ops = [];
      records.forEach(function(record) {
        return ops.push.apply(ops, record.operations);
      });
      for (i = ops.length - 1; i >= 0; i += -1) {
        op = ops[i];
        op.revoke();
      }
      ref1 = this.current().cursors || {};
      for (id in ref1) {
        json = ref1[id];
        if ((ref2 = this.context.cursors[id]) != null) {
          ref2.setByJSON(json);
        }
      }
      return true;
    };

    OperationHistory.prototype.forward = function(n) {
      var i, id, json, len, op, ops, records, ref, ref1;
      records = [];
      if (this.index === this.stack.length - 1) {
        return false;
      }
      while (true) {
        if (this.index === this.stack.length - 1) {
          break;
        }
        if (this.index >= this.stack.length) {
          break;
        }
        this.index += 1;
        if (this.current().type === "CheckPoint") {
          break;
        }
        records.push(this.current());
      }
      if (records.length === 0) {
        return false;
      }
      ops = [];
      records.forEach(function(record) {
        return ops.push.apply(ops, record.operations);
      });
      for (i = 0, len = ops.length; i < len; i++) {
        op = ops[i];
        op.invoke();
      }
      ref = this.current().cursors || {};
      for (id in ref) {
        json = ref[id];
        if ((ref1 = this.context.cursors[id]) != null) {
          ref1.setByJSON(json);
        }
      }
      return true;
    };

    OperationHistory.prototype.fromNow = function() {
      this.stack.length = 0;
      this.index = -1;
      return this.addCheckPoint();
    };

    OperationHistory.prototype.describe = function() {
      return this.stack.slice().map(function(item) {
        var ref, ref1;
        return item.type + "." + (((ref = (ref1 = item.operations) != null ? ref1.map(function(o) {
          return o.describe();
        }) : void 0) != null ? ref.join('|') : void 0) || "nil");
      });
    };

    OperationHistory.prototype.debug = function() {
      var infos;
      return infos = this.stack.map(function(item) {
        if (item.type === "Seed") {
          return "S";
        } else if (item.type === "Compose") {
          return "C";
        } else {
          return "CP:" + (JSON.stringify(item.cursors));
        }
      });
    };

    return OperationHistory;

  })();

  ComposeContext = (function() {
    function ComposeContext() {
      this.queue = [];
      this.counter = 0;
      this.composeInterval = 30;
      this.requireCompose = false;
    }

    ComposeContext.prototype.add = function(target) {
      if (target._requireCompose) {
        return false;
      }
      target._requireCompose = true;
      this.requireCompose = true;
      return this.queue.push(target);
    };

    ComposeContext.prototype.next = function() {
      var target;
      if (this.queue.length === 0) {
        return false;
      }
      target = this.queue.shift();
      target._requireCompose = false;
      this.previousComposeTarget = target;
      if (target.root && target.root.withContext && ((target != null ? target.parent : void 0) || (target != null ? target.root : void 0) === target) && target.compose()) {
        return true;
      }
      return true;
    };

    ComposeContext.prototype.composeAsync = function(callback) {
      if (callback == null) {
        callback = function() {};
      }
      if (!this.requireCompose) {
        this.composeStartDate = null;
        return false;
      }
      if (this.isComposing) {
        return;
      }
      this.composeStartDate = Date.now();
      this.isComposing = true;
      this.totalComposeCount = 0;
      this.asyncInterval = 0;
      this.asyncHasCompose = false;
      this.asyncComposeCallback = callback;
      return this._composeChunk();
    };

    ComposeContext.prototype._composeChunk = function() {
      var DANGER_COMPOSE, MAX_COMPOSE, callback, chunkCheck, chunkTime, counter, notYet, start;
      counter = 0;
      MAX_COMPOSE = 200000;
      DANGER_COMPOSE = 10000;
      chunkCheck = 500;
      chunkTime = 200;
      start = Date.now();
      while (notYet = this.next()) {
        this.totalComposeCount += 1;
        counter += 1;
        if (this.totalComposeCount > DANGER_COMPOSE) {
          debugger;
        }
        if (this.totalComposeCount > MAX_COMPOSE) {
          throw new Error("MAX COMPOSE EXCEED " + MAX_COMPOSE);
        }
        this.asyncHasCompose = true;
        if (counter > chunkCheck) {
          counter = 0;
          if (Date.now() - start > chunkTime) {
            break;
          }
        }
      }
      if (notYet) {
        setTimeout((function(_this) {
          return function() {
            return _this._composeChunk();
          };
        })(this), this.asyncInterval);
        return;
      }
      this.requireCompose = false;
      this.isComposing = false;
      callback = this.asyncComposeCallback;
      this.asyncComposeCallback = null;
      callback(this.asyncHasCompose);
    };

    ComposeContext.prototype.compose = function() {
      var DANGER_COMPOSE, MAX_COMPOSE, RECORD, counter, debug, hasCompose, target;
      if (!this.requireCompose) {
        this.composeStartDate = null;
        return false;
      }
      if (this.isComposing) {
        return;
      }
      this.composeStartDate = Date.now();
      this.isComposing = true;
      hasCompose = false;
      counter = 0;
      debug = false;
      MAX_COMPOSE = 1000 * 100;
      DANGER_COMPOSE = 10 * 1000;
      if (debug) {
        MAX_COMPOSE /= 100;
        DANGER_COMPOSE /= 10;
      }
      RECORD = DANGER_COMPOSE - 100;
      while (this.next()) {
        counter += 1;
        if (counter > RECORD && counter < DANGER_COMPOSE) {
          window.DANGER_LOG = function() {
            var args;
            args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
            return Logger.error.apply(Logger, args);
          };
          target = this.previousComposeTarget;
          if (this._composeDebugTrunk == null) {
            this._composeDebugTrunk = [];
          }
          this._composeDebugTrunk.push(target);
        }
        if (counter > DANGER_COMPOSE) {
          debugger;
        }
        if (counter > MAX_COMPOSE) {
          debugger;
          throw new Error("MAX COMPOSE EXCEED " + MAX_COMPOSE);
        }
        hasCompose = true;
      }
      this.requireCompose = false;
      this.isComposing = false;
      this.counter++;
      return hasCompose;
    };

    return ComposeContext;

  })();

  COMContext.namespace.registerNode(COMText);

  COMContext.namespace.registerNode(COMSpell);

  COMContext.namespace.registerNode(COMRichText);

  COMContext.namespace.registerNode(COMNode);

  COMContext.namespace.registerNode(COMContainer);

  COMContext.namespace.registerNode(COMRoot);

  COMContext.namespace.registerNode(COMRune);

  COMContext.namespace.registerNode(COMContents);

  COMContext.namespace.registerNode(COMUnknownRune);

  COMContext.namespace.registerComposer(new COMContents.ContentsAvoidEmpty);

  COMContext.namespace.registerComposer(new COMContents.NormalizeRichTexts);

  COMContext.namespace.registerComposer(new COMContents.MergeByComposePolicy);

  COMContext.namespace.registerComposer(new COMRoot.RootAvoidEmpty);

  module.exports = COMContext;

}).call(this);
