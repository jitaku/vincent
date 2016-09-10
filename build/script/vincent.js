;
(function(){
/**
 * Implementation of base URI resolving algorithm in rfc2396.
 * - Algorithm from section 5.2
 *   (ignoring difference between undefined and '')
 * - Regular expression from appendix B
 * - Tests from appendix C
 *
 * @param {string} uri the relative URI to resolve
 * @param {string} baseuri the base URI (must be absolute) to resolve against
 */

var URI = function(){
    function resolveUri(sUri, sBaseUri) {
	    if (sUri == '' || sUri.charAt(0) == '#') return sUri;
	    var hUri = getUriComponents(sUri);
	    if (hUri.scheme) return sUri;
	    var hBaseUri = getUriComponents(sBaseUri);
	    hUri.scheme = hBaseUri.scheme;
	    if (!hUri.authority) {
	        hUri.authority = hBaseUri.authority;
	        if (hUri.path.charAt(0) != '/') {
		    aUriSegments = hUri.path.split('/');
		    aBaseUriSegments = hBaseUri.path.split('/');
		    aBaseUriSegments.pop();
		    var iBaseUriStart = aBaseUriSegments[0] == '' ? 1 : 0;
		    for (var i = 0;i < aUriSegments.length; i++) {
		        if (aUriSegments[i] == '..')
			    if (aBaseUriSegments.length > iBaseUriStart) aBaseUriSegments.pop();
		        else { aBaseUriSegments.push(aUriSegments[i]); iBaseUriStart++; }
		        else if (aUriSegments[i] != '.') aBaseUriSegments.push(aUriSegments[i]);
		    }
		    if (aUriSegments[i] == '..' || aUriSegments[i] == '.') aBaseUriSegments.push('');
		    hUri.path = aBaseUriSegments.join('/');
	        }
	    }
	    var result = '';
	    if (hUri.scheme   ) result += hUri.scheme + ':';
	    if (hUri.authority) result += '//' + hUri.authority;
	    if (hUri.path     ) result += hUri.path;
	    if (hUri.query    ) result += '?' + hUri.query;
	    if (hUri.fragment ) result += '#' + hUri.fragment;
	    return result;
    }
    uriregexp = new RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?');
    function getUriComponents(uri) {
	    var c = uri.match(uriregexp);
	    return { scheme: c[2], authority: c[4], path: c[5], query: c[7], fragment: c[9] };
    }
    var URI = {}
    URI.resolve = function(base,target){
        return resolveUri(target,base);
    }
    URI.normalize = function(url){
        return URI.resolve("",url);
    }
    return {URI:URI}
}();
BundleBuilder = function BundleBuilder(option) {
      if (option == null) {
        option = {};
      }
      this.prefixCodes = [];
      this.scripts = [];
      this.suffixCodes = [];
      this.contextName = option.contextName || "GlobalContext";
    }
BundleBuilder.prototype["addScript"] = function () {
      var item, ref, scripts, url;
      scripts = (function() {
        var i, len, results1;
        results1 = [];
        for (i = 0, len = arguments.length; i < len; i++) {
          item = arguments[i];
          results1.push(item);
        }
        return results1;
      }).apply(this, arguments);
      url = URI.URI;
      return (ref = this.scripts).push.apply(ref, scripts.map((function(_this) {
        return function(file) {
          var path;
          path = url.normalize(file.path);
          if (path.charAt(0) === "/") {
            path = path.slice(1);
          }
          return {
            path: path,
            content: file.scriptContent
          };
        };
      })(this)));
    };
BundleBuilder.prototype["createFakeWorker"] = function () {
      var guestend, hostend;
      hostend = {
        postMessage: function(message) {
          return typeof guestend.onmessage === "function" ? guestend.onmessage({
            data: message
          }) : void 0;
        },
        addEventListener: function(event, handler) {
          if (event === "message") {
            return this.onmessage = handler;
          }
        }
      };
      guestend = {
        isFakeWorker: true,
        postMessage: function(message) {
          return typeof hostend.onmessage === "function" ? hostend.onmessage({
            data: message
          }) : void 0;
        },
        addEventListener: function(event, handler) {
          if (event === "message") {
            return this.onmessage = handler;
          }
        }
      };
      return {
        hostend: hostend,
        guestend: guestend
      };
    };
BundleBuilder.prototype["addPrefixFunction"] = function (fn) {
      return this.prefixCodes.push("(" + (fn.toString()) + ")();");
    };
BundleBuilder.prototype["addEntryData"] = function (data, name) {
      return this.suffixCodes.push(name + " = " + (JSON.stringify(data)) + ";\n");
    };
BundleBuilder.prototype["addEntryFunction"] = function (fn) {
      return this.suffixCodes.push("(" + (fn.toString()) + ")();");
    };
BundleBuilder.prototype["addEntryModule"] = function (name) {
      return this.suffixCodes.push("(function(){" + this.contextName + ".require(\"" + name + "\")})();");
    };
BundleBuilder.prototype["generateWorker"] = function (option) {
      var js, smUrl, url, worker;
      if (option == null) {
        option = {};
      }
      js = this.generateBundle();
      if (option.sourceMap) {
        smUrl = this.sourceMapUrlFromJs(js);
        js += ";\n//# sourceMappingURL=" + smUrl;
      }
      url = URL.createObjectURL(new Blob([js]));
      worker = new Worker(url);
      return worker;
    };
BundleBuilder.prototype["sourceMapUrlFromJs"] = function (js) {
      var i, index, len, line, map, ref, result, smUrl;
      map = {
        "version": 3,
        "file": this.contextName,
        "sourceRoot": "",
        "sources": [this.contextName],
        "sourcesContent": [js],
        "names": [],
        "mappings": null
      };
      result = [];
      ref = js.split("\n");
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        line = ref[index];
        if (index === 0) {
          result.push("AAAA");
        } else {
          result.push(";AACA");
        }
      }
      map.mappings = result.join("");
      smUrl = "data:application/json;base64," + (btoa(unescape(encodeURIComponent(JSON.stringify(map)))));
      return smUrl;
    };
BundleBuilder.prototype["generateFakeWorker"] = function (option) {
      var code, fakeWorker, js, name, random, script, smUrl;
      if (option == null) {
        option = {};
      }
      js = this.generateBundle();
      fakeWorker = this.createFakeWorker();
      random = Math.random().toString().slice(5, 9);
      code = "(function(){\n    var self = _" + random + this.contextName + "FakeWorkerEnd;\n    " + js + ";\n})();";
      if (option.sourceMap) {
        smUrl = this.sourceMapUrlFromJs(js);
        code += "\n//# sourceMappingURL=" + smUrl;
      }
      name = "_" + random + this.contextName + "FakeWorkerEnd";
      self[name] = fakeWorker.guestend;
      script = document.createElement("script");
      script.innerHTML = code;
      script.setAttribute("worker", name);
      setTimeout(function() {
        return document.body.appendChild(script);
      }, 0);
      return fakeWorker.hostend;
    };
BundleBuilder.prototype["generateBundle"] = function () {
      var core, prefix, scripts, suffix;
      prefix = this.prefixCodes.join(";\n");
      suffix = this.suffixCodes.join(";\n");
      scripts = this.scripts.map((function(_this) {
        return function(script) {
          return _this.moduleTemplate.replace(/{{contextName}}/g, _this.contextName).replace(/{{currentModulePath}}/g, script.path).replace("{{currentModuleContent}}", script.content);
        };
      })(this));
      core = this.coreTemplate.replace(/{{contextName}}/g, this.contextName).replace("{{modules}}", scripts.join(";\n")).replace("{{createContextProcedure}}", this.getPureFunctionProcedure("createBundleContext")).replace("{{entryData}}").replace("{{BundleBuilderCode}}", this.getPureClassCode(BundleBuilder));
      return [prefix, core, suffix].join(";\n");
    };
BundleBuilder.prototype["getPureFunctionProcedure"] = function (name) {
      return "(" + (this["$" + name].toString()) + ")()";
    };
BundleBuilder.prototype["getPureClassCode"] = function (ClassObject, className) {
      var codes, constructor, prop, ref, template, value;
      if (!className) {
        className = ClassObject.name;
      }
      constructor = ClassObject.toString();
      template = className + ".prototype[\"{{prop}}\"] = {{value}};";
      codes = [];
      ref = ClassObject.prototype;
      for (prop in ref) {
        value = ref[prop];
        if (typeof value === "function") {
          value = value.toString();
        } else {
          value = JSON.stringify(value);
        }
        codes.push(template.replace("{{prop}}", prop).replace("{{value}}", value));
      }
      return className + " = " + (constructor.toString()) + "\n" + (codes.join("\n"));
    };
BundleBuilder.prototype["$createBundleContext"] = function () {
      return {
        modules: {},
        wrapCode: function(string) {
          return "(function(){\n" + string + "\n})();";
        },
        createDedicateWorker: function(pathes, option) {
          var bundle, i, item, j, len, len1, path, script, scripts;
          bundle = new BundleBuilder({
            contextName: option.contextName || (this.globalName || "GlobalContext") + "Worker"
          });
          for (i = 0, len = pathes.length; i < len; i++) {
            path = pathes[i];
            if (typeof path === "string") {
              script = this.getRequiredModule(path);
              scripts = [
                {
                  module: script,
                  path: path
                }
              ];
            } else if (path.test) {
              scripts = this.getMatchingModules(path);
            } else {
              continue;
            }
            for (j = 0, len1 = scripts.length; j < len1; j++) {
              item = scripts[j];
              script = {
                path: item.path,
                scriptContent: "(" + (item.module.exec.toString()) + ")()"
              };
              bundle.addScript(script);
            }
          }
          if (option.entryData) {
            bundle.addEntryData(option.entryData, option.entryDataName || "EntryData");
          }
          if (option.entryModule) {
            bundle.addEntryModule(option.entryModule);
          } else if (option.entryFunction) {
            bundle.addEntryFunction(option.entryFunction);
          }
          if (option.fake) {
            return bundle.generateFakeWorker(option);
          } else {
            return bundle.generateWorker(option);
          }
        },
        require: function(path) {
          return this.requireModule(null, path);
        },
        getRequiredModuleContent: function(path, fromPath) {
          var module;
          if (fromPath == null) {
            fromPath = "";
          }
          module = this.getRequiredModule(path, fromPath);
          return "(" + (module.exec.toString()) + ")()";
        },
        getMatchingModules: function(path) {
          var item, modulePath, ref, results;
          results = [];
          ref = this.modules;
          for (modulePath in ref) {
            item = ref[modulePath];
            if (path.test(modulePath)) {
              results.push({
                path: modulePath,
                module: item
              });
            }
          }
          return results;
        },
        getRequiredModule: function(path, fromPath) {
          var module, realPath, url;
          if (fromPath == null) {
            fromPath = "";
          }
          url = URI.URI;
          if (fromPath) {
            realPath = url.resolve(fromPath, path);
          } else {
            realPath = url.normalize(path);
          }
          if (realPath.charAt(0) === "/") {
            realPath = realPath.slice(1);
          }
          if (realPath.slice(-3) !== ".js") {
            realPath += ".js";
          }
          if (!this.modules[realPath]) {
            throw new Error("module " + path + " required at " + (fromPath || "/") + " is not exists");
          }
          module = this.modules[realPath];
          return module;
        },
        requireModule: function(fromPath, path) {
          var module;
          module = this.getRequiredModule(path, fromPath);
          if (module.exports) {
            return module.exports;
          }
          if (module.isRequiring) {
            return module.module.exports;
          }
          module.isRequiring = true;
          module.exec();
          module.exports = module.module.exports;
          module.isRequiring = false;
          return module.exports;
        },
        setModule: function(modulePath, module, exec) {
          if (modulePath.slice(-3) !== ".js") {
            modulePath += ".js";
          }
          return this.modules[modulePath] = {
            module: module,
            exec: exec
          };
        }
      };
    };
BundleBuilder.prototype["moduleTemplate"] = "(function(){\nvar require = {{contextName}}.requireModule.bind({{contextName}},\"{{currentModulePath}}\");\nvar module = {};\nmodule.exports = {};\nvar exports = module.exports;\nfunction exec(){\n    {{currentModuleContent}}\n}\n{{contextName}}.setModule(\"{{currentModulePath}}\",module,exec);\n})()";
BundleBuilder.prototype["coreTemplate"] = "(function(){\n/**\n * Implementation of base URI resolving algorithm in rfc2396.\n * - Algorithm from section 5.2\n *   (ignoring difference between undefined and '')\n * - Regular expression from appendix B\n * - Tests from appendix C\n *\n * @param {string} uri the relative URI to resolve\n * @param {string} baseuri the base URI (must be absolute) to resolve against\n */\n\nvar URI = function(){\n    function resolveUri(sUri, sBaseUri) {\n\t    if (sUri == '' || sUri.charAt(0) == '#') return sUri;\n\t    var hUri = getUriComponents(sUri);\n\t    if (hUri.scheme) return sUri;\n\t    var hBaseUri = getUriComponents(sBaseUri);\n\t    hUri.scheme = hBaseUri.scheme;\n\t    if (!hUri.authority) {\n\t        hUri.authority = hBaseUri.authority;\n\t        if (hUri.path.charAt(0) != '/') {\n\t\t    aUriSegments = hUri.path.split('/');\n\t\t    aBaseUriSegments = hBaseUri.path.split('/');\n\t\t    aBaseUriSegments.pop();\n\t\t    var iBaseUriStart = aBaseUriSegments[0] == '' ? 1 : 0;\n\t\t    for (var i = 0;i < aUriSegments.length; i++) {\n\t\t        if (aUriSegments[i] == '..')\n\t\t\t    if (aBaseUriSegments.length > iBaseUriStart) aBaseUriSegments.pop();\n\t\t        else { aBaseUriSegments.push(aUriSegments[i]); iBaseUriStart++; }\n\t\t        else if (aUriSegments[i] != '.') aBaseUriSegments.push(aUriSegments[i]);\n\t\t    }\n\t\t    if (aUriSegments[i] == '..' || aUriSegments[i] == '.') aBaseUriSegments.push('');\n\t\t    hUri.path = aBaseUriSegments.join('/');\n\t        }\n\t    }\n\t    var result = '';\n\t    if (hUri.scheme   ) result += hUri.scheme + ':';\n\t    if (hUri.authority) result += '//' + hUri.authority;\n\t    if (hUri.path     ) result += hUri.path;\n\t    if (hUri.query    ) result += '?' + hUri.query;\n\t    if (hUri.fragment ) result += '#' + hUri.fragment;\n\t    return result;\n    }\n    uriregexp = new RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\\\?([^#]*))?(#(.*))?');\n    function getUriComponents(uri) {\n\t    var c = uri.match(uriregexp);\n\t    return { scheme: c[2], authority: c[4], path: c[5], query: c[7], fragment: c[9] };\n    }\n    var URI = {}\n    URI.resolve = function(base,target){\n        return resolveUri(target,base);\n    }\n    URI.normalize = function(url){\n        return URI.resolve(\"\",url);\n    }\n    return {URI:URI}\n}();\n{{BundleBuilderCode}}\n{{contextName}} = {{createContextProcedure}};\n{{contextName}}.contextName = \"{{contextName}}\";\n{{modules}};\n})()";
GlobalContext = (function () {
      return {
        modules: {},
        wrapCode: function(string) {
          return "(function(){\n" + string + "\n})();";
        },
        createDedicateWorker: function(pathes, option) {
          var bundle, i, item, j, len, len1, path, script, scripts;
          bundle = new BundleBuilder({
            contextName: option.contextName || (this.globalName || "GlobalContext") + "Worker"
          });
          for (i = 0, len = pathes.length; i < len; i++) {
            path = pathes[i];
            if (typeof path === "string") {
              script = this.getRequiredModule(path);
              scripts = [
                {
                  module: script,
                  path: path
                }
              ];
            } else if (path.test) {
              scripts = this.getMatchingModules(path);
            } else {
              continue;
            }
            for (j = 0, len1 = scripts.length; j < len1; j++) {
              item = scripts[j];
              script = {
                path: item.path,
                scriptContent: "(" + (item.module.exec.toString()) + ")()"
              };
              bundle.addScript(script);
            }
          }
          if (option.entryData) {
            bundle.addEntryData(option.entryData, option.entryDataName || "EntryData");
          }
          if (option.entryModule) {
            bundle.addEntryModule(option.entryModule);
          } else if (option.entryFunction) {
            bundle.addEntryFunction(option.entryFunction);
          }
          if (option.fake) {
            return bundle.generateFakeWorker(option);
          } else {
            return bundle.generateWorker(option);
          }
        },
        require: function(path) {
          return this.requireModule(null, path);
        },
        getRequiredModuleContent: function(path, fromPath) {
          var module;
          if (fromPath == null) {
            fromPath = "";
          }
          module = this.getRequiredModule(path, fromPath);
          return "(" + (module.exec.toString()) + ")()";
        },
        getMatchingModules: function(path) {
          var item, modulePath, ref, results;
          results = [];
          ref = this.modules;
          for (modulePath in ref) {
            item = ref[modulePath];
            if (path.test(modulePath)) {
              results.push({
                path: modulePath,
                module: item
              });
            }
          }
          return results;
        },
        getRequiredModule: function(path, fromPath) {
          var module, realPath, url;
          if (fromPath == null) {
            fromPath = "";
          }
          url = URI.URI;
          if (fromPath) {
            realPath = url.resolve(fromPath, path);
          } else {
            realPath = url.normalize(path);
          }
          if (realPath.charAt(0) === "/") {
            realPath = realPath.slice(1);
          }
          if (realPath.slice(-3) !== ".js") {
            realPath += ".js";
          }
          if (!this.modules[realPath]) {
            throw new Error("module " + path + " required at " + (fromPath || "/") + " is not exists");
          }
          module = this.modules[realPath];
          return module;
        },
        requireModule: function(fromPath, path) {
          var module;
          module = this.getRequiredModule(path, fromPath);
          if (module.exports) {
            return module.exports;
          }
          if (module.isRequiring) {
            return module.module.exports;
          }
          module.isRequiring = true;
          module.exec();
          module.exports = module.module.exports;
          module.isRequiring = false;
          return module.exports;
        },
        setModule: function(modulePath, module, exec) {
          if (modulePath.slice(-3) !== ".js") {
            modulePath += ".js";
          }
          return this.modules[modulePath] = {
            module: module,
            exec: exec
          };
        }
      };
    })();
GlobalContext.contextName = "GlobalContext";
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"component/debounce.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Debounce,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Debounce = (function(superClass) {
    extend(Debounce, superClass);

    Debounce.debounce = function(time, method) {
      var db, option;
      if (time == null) {
        time = 0;
      }
      if (typeof time === "number") {
        option = {
          time: time
        };
      } else {
        option = time;
      }
      db = new Debounce(option, method);
      return db.trigger.bind(db);
    };

    function Debounce(option, handler) {
      if (option == null) {
        option = {};
      }
      this.handler = handler != null ? handler : function() {};
      Debounce.__super__.constructor.call(this);
      this.time = option.time || 1000;
      this.max = option.max || null;
      this.reset();
    }

    Debounce.prototype.setHandler = function(handler) {
      this.handler = handler;
    };

    Debounce.prototype.trigger = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      this.triggerArgs = args;
      if (!this.firstTriggerDate && this.max) {
        this.firstTriggerDate = Date.now();
        clearTimeout(this.maxTimer);
        this.maxTimer = setTimeout((function(_this) {
          return function() {
            clearTimeout(_this.timer);
            _this.firstTriggerDate = null;
            _this.handler.apply(_this, _this.triggerArgs);
            return _this.triggerArgs = [];
          };
        })(this), this.max);
      }
      clearTimeout(this.timer);
      this.timer = setTimeout((function(_this) {
        return function() {
          clearTimeout(_this.maxTimer);
          _this.maxTimer = null;
          _this.firstTriggerDate = null;
          _this.handler.apply(_this, _this.triggerArgs);
          return _this.triggerArgs = [];
        };
      })(this), this.time);
      return this;
    };

    Debounce.prototype.cancel = function() {
      return this.reset();
    };

    Debounce.prototype.reset = function() {
      clearTimeout(this.timer);
      clearTimeout(this.maxTimer);
      this.firstTriggerDate = null;
      return this.triggerArgs = [];
    };

    return Debounce;

  })(Leaf.EventEmitter);

  module.exports = Debounce;

}).call(this);

}
GlobalContext.setModule("component/debounce.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"component/dragManager.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var DragEventBehavior, DragManager, DragSession, DragShadowManager, MouseEventHelper,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  DragManager = (function(superClass) {
    extend(DragManager, superClass);

    function DragManager() {
      DragManager.__super__.constructor.call(this);
      this.mouseupListener = this.mouseupListener.bind(this);
      this.mousedownListener = this.mousedownListener.bind(this);
      this.mousemoveListener = this.mousemoveListener.bind(this);
      new DragEventBehavior(this);
      new DragShadowManager(this);
      new MouseEventHelper(this);
      this.init();
      this.minMovement = 6;
    }

    DragManager.prototype.init = function() {
      var capture;
      capture = true;
      window.addEventListener("mousedown", this.mouseupListener, capture);
      window.addEventListener("mouseup", this.mouseupListener, capture);
      window.addEventListener("mousemove", this.mousemoveListener, capture);
      this.reset();
      return this.setState("waitMouseDown");
    };

    DragManager.prototype.destroy = function() {
      this.reset();
      window.removeEventListener("mouseup", this.mouseupListener);
      window.removeEventListener("mousedown", this.mousedownListener);
      return window.removeEventListener("mousemove", this.mousemoveListener);
    };

    DragManager.prototype.reset = function() {
      DragManager.__super__.reset.call(this);
      return this.clearDrag();
    };

    DragManager.prototype.mouseupListener = function(e) {
      this.lastMouseEvent = e;
      return this.feed("mouse", e);
    };

    DragManager.prototype.mousedownListener = function(e) {
      this.lastMouseEvent = e;
      return this.feed("mouse", e);
    };

    DragManager.prototype.mousemoveListener = function(e) {
      this.lastMouseEvent = e;
      return this.feed("mouse", e);
    };

    DragManager.prototype.atWaitMouseDown = function() {
      this.clearDrag();
      return this.consumeWhenAvailable("mouse", (function(_this) {
        return function(e) {
          if (e.type === "mousedown") {
            _this.data.initMouseDown = e;
            return _this.setState("waitInitMouseMove");
          } else {
            return _this.setState("waitMouseDown");
          }
        };
      })(this));
    };

    DragManager.prototype.atWaitInitMouseMove = function() {
      return this.consumeWhenAvailable("mouse", (function(_this) {
        return function(e) {
          if (e.type === "mousemove") {
            if (_this.getMouseDistance(e, _this.data.initMouseDown) < _this.minMovement) {
              return _this.setState("waitInitMouseMove");
            } else {
              _this.data.initMoveEvent = e;
              return _this.setState("handleInitMove");
            }
          } else {
            return _this.setState("waitMouseDown");
          }
        };
      })(this));
    };

    DragManager.prototype.atHandleInitMove = function() {
      if (!this.dragStart(this.data.initMouseDown)) {
        this.setState("waitMouseDown");
        return;
      }
      return this.setState("waitMouseContinue");
    };

    DragManager.prototype.atWaitMouseContinue = function() {
      return this.consumeWhenAvailable("mouse", (function(_this) {
        return function(e) {
          if (e.type === "mousemove") {
            _this.dragMove(e);
            return _this.setState("waitMouseContinue");
          } else if (e.type === "mouseup") {
            _this.data.finalUpEvent = e;
            return _this.setState("handleMouseUp");
          } else {
            return _this.setState("waitMouseDown");
          }
        };
      })(this));
    };

    DragManager.prototype.atHandleMouseUp = function() {
      this.drop(this.data.finalUpEvent);
      return this.setState("waitMouseDown");
    };

    return DragManager;

  })(Leaf.States);

  MouseEventHelper = (function(superClass) {
    extend(MouseEventHelper, superClass);

    function MouseEventHelper() {
      return MouseEventHelper.__super__.constructor.apply(this, arguments);
    }

    MouseEventHelper.prototype.computeRelativeMousePosition = function(el, e) {
      var rect, src;
      src = this.getMouseSrc(e);
      if (!el.contains(src)) {
        return null;
      }
      rect = el.getBoundingClientRect();
      return {
        x: rect.left - e.clientX,
        y: rect.top - e.clientY
      };
    };

    MouseEventHelper.prototype.getMousePosition = function(e) {
      if (!e) {
        return null;
      }
      return {
        x: e.clientX,
        y: e.clientY
      };
    };

    MouseEventHelper.prototype.getMouseDistance = function(e1, e2) {
      var dx, dy, p1, p2;
      p1 = this.getMousePosition(e1);
      p2 = this.getMousePosition(e2);
      dx = p1.x - p2.x;
      dy = p1.y - p2.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    MouseEventHelper.prototype.getDefaultShadow = function(el) {
      var copy, domCopy, prop;
      domCopy = require("/component/domCopy");
      copy = domCopy(el);
      for (prop in copy.style) {
        if (!prop) {
          delete copy.style;
        }
      }
      copy.style.opacity = 0.5;
      copy.style.backgroundColor = "white";
      copy.style.pointerEvents = "none";
      copy.style.transition = "opacity 200ms";
      copy.style.webkitTransfrom = "scale(0.7)";
      window.cpyy = copy;
      return copy;
    };

    MouseEventHelper.prototype.getMouseSrc = function(e) {
      return e.srcElement || e.target;
    };

    MouseEventHelper.prototype.isElementDraggable = function(el) {
      return el && (el.dragSupport === "support" || el.getAttribute("drag-support") === "support");
    };

    MouseEventHelper.prototype.isElementDragless = function(el) {
      return !el || el.dragSupport === "disable" || el.getAttribute("drag-support") === "disable";
    };

    MouseEventHelper.prototype.getDraggable = function(e) {
      var el;
      el = this.getMouseSrc(e);
      while (el) {
        if (this.isElementDragless(el)) {
          return null;
        } else if (this.isElementDraggable(el)) {
          return el;
        }
        el = el.parentElement;
      }
    };

    MouseEventHelper.prototype.createCustomEvent = function(name, data) {
      return new CustomEvent(name, data);
    };

    return MouseEventHelper;

  })(Leaf.Trait);

  DragShadowManager = (function(superClass) {
    extend(DragShadowManager, superClass);

    function DragShadowManager() {
      return DragShadowManager.__super__.constructor.apply(this, arguments);
    }

    DragShadowManager.prototype.dragFix = {
      x: 0,
      y: 0
    };

    DragShadowManager.prototype.shadowScale = 0.7;

    DragShadowManager.prototype.clearShadow = function() {
      var ref, ref1;
      if ((ref = this.draggingShadow) != null ? ref.parentElement : void 0) {
        if ((ref1 = this.draggingShadow) != null) {
          ref1.parentElement.removeChild(this.draggingShadow);
        }
      }
      return this.draggingShadow = null;
    };

    DragShadowManager.prototype.setShadowElement = function(el, fix) {
      var base, base1, ref, ref1;
      if (fix == null) {
        fix = {};
      }
      if ((ref = this.draggingShadow) != null ? ref.parentElement : void 0) {
        if ((ref1 = this.draggingShadow) != null) {
          ref1.parentElement.removeChild(this.draggingShadow);
        }
      }
      this.draggingShadow = el;
      document.body.appendChild(el);
      el.style.position = "absolute";
      el.style.pointerEvents = "none";
      el.style.top = "0";
      el.style.left = "0";
      el.style.zIndex = 100000;
      this.dragFix = fix || {};
      if ((base = this.dragFix).x == null) {
        base.x = 0;
      }
      if ((base1 = this.dragFix).y == null) {
        base1.y = 0;
      }
      return this.updateShadowPosition();
    };

    DragShadowManager.prototype.updateShadowPosition = function() {
      var point, ref, ref1, ref2, ref3, scaleFix, transform, transformOrigin;
      if (!this.draggingShadow) {
        return;
      }
      point = this.getMousePosition(this.lastMouseEvent);
      this.shadowScale = 0.7;
      scaleFix = this.shadowScale;
      transform = "translateX(" + (point.x + this.dragFix.x * scaleFix) + "px) translateY(" + (point.y + this.dragFix.y * scaleFix) + "px) scale(" + this.shadowScale + ")";
      transformOrigin = "top left";
      if ((ref = this.draggingShadow.style) != null) {
        ref.transform = transform;
      }
      if ((ref1 = this.draggingShadow.style) != null) {
        ref1.webkitTransform = transform;
      }
      if ((ref2 = this.draggingShadow.style) != null) {
        ref2.transformOrigin = transformOrigin;
      }
      return (ref3 = this.draggingShadow.style) != null ? ref3.webkitTransformOrigin = transformOrigin : void 0;
    };

    DragShadowManager.prototype.setDraggingStyle = function() {
      if (this._setTarget) {
        this.restoreDraggingstyle();
      }
      this._setTarget = this.draggingElement;
      this._opacity = this._setTarget.style.opacity;
      this._transition = this._setTarget.style.transition;
      this._setTarget.style.opacity = 0.15;
      return this._setTarget.style.transition = "all 200ms";
    };

    DragShadowManager.prototype.restoreDraggingstyle = function() {
      var ref, ref1;
      if ((ref = this._setTarget) != null) {
        ref.style.opacity = this._opacity;
      }
      if ((ref1 = this._setTarget) != null) {
        ref1.style.transition = this._transition;
      }
      return this._setTarget = null;
    };

    return DragShadowManager;

  })(Leaf.Trait);

  DragEventBehavior = (function(superClass) {
    extend(DragEventBehavior, superClass);

    function DragEventBehavior() {
      return DragEventBehavior.__super__.constructor.apply(this, arguments);
    }

    DragEventBehavior.prototype.initialize = function() {
      var preventDefault;
      preventDefault = function(e) {
        e.preventDefault();
        return e.stopImmediatePropagation();
      };
      this.__defineGetter__("draggingElement", (function(_this) {
        return function() {
          return _this._draggingElement;
        };
      })(this));
      return this.__defineSetter__("draggingElement", (function(_this) {
        return function(v) {
          var _draggingElement;
          if (v === _this._draggingElement) {
            return;
          }
          if (_this._draggingElement) {
            _draggingElement = _this._draggingElement;
            setTimeout(function() {
              return _draggingElement.removeEventListener("click", preventDefault, true);
            }, 1);
          }
          _this._draggingElement = v;
          if (!v) {
            return;
          }
          return _this._draggingElement.addEventListener("click", preventDefault, true);
        };
      })(this));
    };

    DragEventBehavior.prototype.clearDrag = function() {
      this.clearShadow();
      this.draggingElement = null;
      return document.body.classList.remove("dragging");
    };

    DragEventBehavior.prototype.dragStart = function(e) {
      var event, src;
      src = this.getDraggable(e);
      this.clearDrag();
      if (!src) {
        return false;
      }
      document.body.classList.add("dragging");
      this.dragSession = new DragSession(this);
      this.currentDraggable = src;
      event = this.createCustomEvent("user-draginit", {
        detail: this.dragSession,
        bubbles: true
      });
      src.dispatchEvent(event);
      this.draggingElement = src;
      if (this.draggingElement.dragBehavior === "auto" || this.draggingElement.getAttribute("dragBehavior") === "auto") {
        this.shadowScale = 0.7;
        this.setDraggingStyle();
        this.setShadowElement(this.getDefaultShadow(this.draggingElement), this.computeRelativeMousePosition(src, e));
      }
      return true;
    };

    DragEventBehavior.prototype.dragMove = function(e) {
      var event, i, len, protocol, ref, ref1, target;
      event = this.createCustomEvent("user-dragging", {
        detail: this.dragSession,
        bubbles: true
      });
      if ((ref = this.draggingElement) != null) {
        ref.dispatchEvent(event);
      }
      target = this.getMouseSrc(e);
      event = this.createCustomEvent("user-dropstand", {
        detail: this.dragSession,
        bubbles: true
      });
      if (target != null) {
        target.dispatchEvent(event);
      }
      if (!event.defaultPrevented) {
        ref1 = this.dragSession.protocols;
        for (i = 0, len = ref1.length; i < len; i++) {
          protocol = ref1[i];
          event = this.createCustomEvent("user-dropstand/" + protocol.type, {
            detail: protocol,
            bubbles: true
          });
          target.dispatchEvent(event);
        }
      }
      return this.updateShadowPosition();
    };

    DragEventBehavior.prototype.drop = function(e) {
      var event, i, len, protocol, ref, ref1, target;
      this.restoreDraggingstyle();
      target = this.getMouseSrc(e);
      event = this.createCustomEvent("user-drop", {
        detail: this.dragSession,
        bubbles: true
      });
      target.dispatchEvent(event);
      if (!event.defaultPrevented) {
        ref = this.dragSession.protocols;
        for (i = 0, len = ref.length; i < len; i++) {
          protocol = ref[i];
          event = this.createCustomEvent("user-drop/" + protocol.type, {
            detail: protocol,
            bubbles: true
          });
          target.dispatchEvent(event);
        }
      }
      event = this.createCustomEvent("user-dragfinish", {
        detail: this.dragSession,
        bubbles: true
      });
      if (this.draggingElement.contains(target)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      if ((ref1 = this.draggingElement) != null) {
        ref1.dispatchEvent(event);
      }
      this.draggingElement = null;
      return this.clearShadow();
    };

    return DragEventBehavior;

  })(Leaf.Trait);

  DragSession = (function() {
    function DragSession(behavior) {
      this.behavior = behavior;
      this.protocols = [];
      this.__defineGetter__("protocol", (function(_this) {
        return function() {
          return _this.protocols[0];
        };
      })(this));
    }

    DragSession.prototype.addProtocol = function(type, data) {
      var protocol;
      protocol = new DragManager.Protocol(type, data);
      return this.protocols.push(protocol);
    };

    return DragSession;

  })();

  DragManager.Protocol = (function() {
    Protocol.prototype.type = "Void";

    Protocol.prototype.data = null;

    function Protocol(type1, data1) {
      this.type = type1;
      this.data = data1;
    }

    return Protocol;

  })();

  module.exports = DragManager;

}).call(this);

}
GlobalContext.setModule("component/dragManager.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"component/html2markdown.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var DomEl, HTMLParser, HTMLStack, _stack, flatten, htmlEntity, toMarkdown,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  HTMLParser = require("./htmlparser");

  htmlEntity = require("./htmlEntity");

  DomEl = (function() {
    function DomEl(name1, attrs, children) {
      var i, item, len;
      this.name = name1;
      if (attrs == null) {
        attrs = [];
      }
      this.children = children != null ? children : [];
      this.attrs = [];
      this.contentLength = 0;
      for (i = 0, len = attrs.length; i < len; i++) {
        item = attrs[i];
        this.attrs[item.name] = item.value;
      }
      this.name = this.name.toUpperCase();
    }

    DomEl.prototype.push = function(child) {
      child.parent = this;
      return this.children.push(child);
    };

    return DomEl;

  })();

  HTMLStack = (function() {
    function HTMLStack() {
      this.__defineGetter__("tag", (function(_this) {
        return function() {
          return _this.stack[_this.stack.length - 1];
        };
      })(this));
      this.__defineGetter__("indentString", (function(_this) {
        return function() {
          return _this.getIndentSpace(_this.indent);
        };
      })(this));
      this.inlineTags = ["a", "img", "bold", "strong", "font", "center", "italic", "span", "b", "em"];
      this.singleLineTags = ["h1", "h2", "h3", "h4", "h5", "h6", "li"];
      this.multiLineTags = ["code", "pre"];
      this.orderTags = ["li"];
      this.singleLineSplit = ["blockquote"];
      this.indentTags = ["ul", "ol"];
      this.ignoreTags = ["script", "link", "template", "meta", "header", "title", "br", "base"];
    }

    HTMLStack.prototype.escapeMarkdownUrl = function(string) {
      var _map, result;
      if (string == null) {
        string = "";
      }
      _map = {
        "(": "\\(",
        ")": "\\)",
        "\\": "\\\\"
      };
      result = string.replace(/\(|\)|\\/g, function(match) {
        return _map[match] || match;
      });
      return result;
    };

    HTMLStack.prototype.escapeMarkdownUrlContent = function(string) {
      var _map, result;
      if (string == null) {
        string = "";
      }
      if (/^!\[.*\]\(.*\)$/.test(string)) {
        return string.replace(/\n/g, "");
      }
      _map = {
        "[": "\\[",
        "]": "\\]",
        "\\": "\\\\"
      };
      result = string.replace(/\[|\]|\\/g, function(match) {
        return _map[match] || match;
      });
      return result;
    };

    HTMLStack.prototype.createTagData = function(tag, attrs, unary) {
      var _, count, data, headline, i, item, j, len, ref, url;
      for (i = 0, len = attrs.length; i < len; i++) {
        item = attrs[i];
        attrs[item.name] = item.value;
      }
      data = {
        name: tag,
        attrs: attrs,
        unary: unary,
        childTexts: [],
        children: [],
        transformContent: function(str) {
          return str;
        },
        decorationBefore: "",
        decorationAfter: "",
        marks: [],
        containMarks: function(marks) {
          var j, len1, mark;
          if (marks == null) {
            marks = [];
          }
          for (j = 0, len1 = marks.length; j < len1; j++) {
            mark = marks[j];
            if (indexOf.call(this.marks, mark) >= 0) {
              return true;
            }
          }
          return false;
        }
      };
      if (indexOf.call(this.inlineTags, tag) >= 0) {
        data.inline = true;
      } else if (indexOf.call(this.ignoreTags, tag) >= 0) {
        data.ignore = true;
      } else if (indexOf.call(this.indentTags, tag) >= 0) {
        data.indent = true;
      } else if (indexOf.call(this.singleLineTags, tag) >= 0) {
        data.singleLine = true;
      } else if (indexOf.call(this.multiLineTags, tag) >= 0) {
        data.multiLine = true;
      } else {
        data.raw = true;
      }
      if (tag === "a") {
        url = this.escapeMarkdownUrl(data.attrs.href);
        data.decorationBefore = function() {
          if (data.containMarks(["h1", "h2", "h3", "h4", "h5", "h6", "a", "li", "ul", "ol", "code", "pre", "li", "blockquote", "img"])) {
            return "";
          } else {
            return " [";
          }
        };
        data.decorationAfter = function(content, length) {
          if (data.containMarks(["h1", "h2", "h3", "h4", "h5", "h6", "a", "li", "ul", "ol", "code", "pre", "li", "blockquote", "img"])) {
            return "";
          } else {
            return "](" + url + ") ";
          }
        };
        data.transformContent = (function(_this) {
          return function(content, length) {
            if (data.containMarks(["h1", "h2", "h3", "h4", "h5", "h6", "a", "li", "ul", "ol", "code", "pre", "li", "blockquote", "img"])) {
              return content;
            }
            return _this.escapeMarkdownUrlContent(content);
          };
        })(this);
      }
      if (tag === "img") {
        if (!data.attrs.src) {
          data.markdownString = "";
        } else {
          data.markdownString = "![" + (this.escapeMarkdownUrlContent(data.attrs.alt || data.attrs.title || "")) + "](" + (this.escapeMarkdownUrl(data.attrs.src || "")) + ")";
        }
      }
      if (tag === "li") {
        data.decorationBefore = function(content) {
          if (content == null) {
            content = "";
          }
          if (content.trim().length === 0) {
            return "";
          } else {
            return "* ";
          }
        };
        data.transformContent = function(str) {
          return str.replace(/\n/, "");
        };
      }
      if (tag === "blockquote") {
        data.decorationBefore = "> ";
      }
      if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
        count = parseInt(tag[1]) || 1;
        headline = "";
        for (_ = j = 0, ref = count; 0 <= ref ? j < ref : j > ref; _ = 0 <= ref ? ++j : --j) {
          headline += "#";
        }
        data.decorationBefore = headline + " ";
      }
      if (tag === "pre" || tag === "code") {
        data.decorationBefore = (function(_this) {
          return function() {
            if (data.containMarks(["code", "pre"])) {
              return "";
            } else {
              return "```\n";
            }
          };
        })(this);
        data.decorationAfter = (function(_this) {
          return function() {
            if (data.containMarks(["code", "pre"])) {
              return "";
            } else {
              return "\n```";
            }
          };
        })(this);
        data.transformContent = function(str) {
          if (str == null) {
            str = "";
          }
          if (data.containMarks(["code", "pre"])) {
            return str;
          } else {
            return str.replace(/```/g, "\\`\\`\\`");
          }
        };
      }
      return data;
    };

    HTMLStack.prototype.getIndentSpace = function(n) {
      var item;
      if (n == null) {
        n = 0;
      }
      return ((function() {
        var i, ref, results;
        results = [];
        for (item = i = 0, ref = n; 0 <= ref ? i < ref : i > ref; item = 0 <= ref ? ++i : --i) {
          results.push("    ");
        }
        return results;
      })()).join("");
    };

    HTMLStack.prototype.markAncestor = function(name) {
      var i, item, len, ref, results;
      ref = this.stack;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (indexOf.call(item.marks, name) < 0) {
          results.push(item.marks.push(name));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    HTMLStack.prototype.parse = function(html) {
      this.indent = 0;
      this.stack = [];
      this.disabledTagNames = ["script", "link", "style", "meta", "template", "header"];
      this.indentTagNames = ["ul", "ol"];
      this.stack.push(this.createTagData("root", [], false));
      HTMLParser(html, {
        start: (function(_this) {
          return function(tag, attrs, unary) {
            var data;
            tag = tag.toLowerCase();
            data = _this.createTagData(tag, attrs, unary);
            _this.tag.children.push(data);
            _this.markAncestor(tag);
            if (unary) {
              return _this.tag.childTexts.push(data.markdownString || "");
            } else {
              return _this.stack.push(data);
            }
          };
        })(this),
        end: (function(_this) {
          return function(tag) {
            var after, before, content, text;
            content = _this.tag.transformContent(_this.tag.childTexts.join(""));
            before = "";
            after = "";
            if (typeof _this.tag.decorationBefore === "function") {
              before = _this.tag.decorationBefore(content, _this.tag.childTexts, _this.tag.childTexts);
            } else if (typeof _this.tag.decorationBefore === "string") {
              before = _this.tag.decorationBefore;
            }
            if (typeof _this.tag.decorationAfter === "function") {
              after = _this.tag.decorationAfter(content, _this.tag.childTexts, _this.tag.childTexts);
            } else if (typeof _this.tag.decorationAfter === "string") {
              after = _this.tag.decorationAfter;
            }
            text = before + content + after;
            if (_this.tag.ignore) {
              text = "";
            } else if (_this.tag.inline) {
              text = text;
            } else if (_this.tag.singleLine) {
              text = "\n" + text.replace(/\n/g, "");
            } else {
              text = "\n" + text.replace(/\n\n+/g, "\n\n").trim() + "\n";
            }
            _this.tag.text = text;
            _this.stack.pop();
            _this.tag.childTexts.push(text);
            if (indexOf.call(_this.indentTagNames, tag) >= 0) {
              return _this.indent -= 1;
            }
          };
        })(this),
        chars: (function(_this) {
          return function(text) {
            return _this.tag.childTexts.push(htmlEntity.decode(text));
          };
        })(this)
      });
      return this.stack[0].childTexts.join("").trim();
      return "";
    };

    return HTMLStack;

  })();

  module.exports = (function(_this) {
    return function(html) {
      var items, markdown, stack;
      stack = [];
      items = [];
      HTMLParser(html, {
        start: function(tag, attrs, unary) {
          var current, el, last;
          el = new DomEl(tag, attrs);
          last = stack[stack.length - 1];
          if (!last) {
            stack.push(el);
            if (unary) {
              stack.pop();
            }
            return items.push(el);
          } else {
            stack.push(el);
            current = last;
            current.push(el);
            if (unary) {
              return stack.pop();
            }
          }
        },
        end: function(tag) {
          return stack.pop();
        },
        chars: function(text) {
          var el, last, results;
          el = new DomEl("TEXT_CONTENT", [
            {
              value: htmlEntity.decode(text),
              name: "text"
            }
          ]);
          last = stack[stack.length - 1];
          if (last) {
            last.push(el);
          } else {
            items.push(el);
          }
          el.contentLength = text.length;
          results = [];
          while (el.parent) {
            el = el.parent;
            results.push(el.contentLength += text.length);
          }
          return results;
        },
        comment: function() {}
      });
      markdown = toMarkdown(flatten(items));
      markdown = markdown.replace(/\n\n\n+/g, "\n\n").replace(/、\s*/g, "、 ");
      return markdown = markdown.replace(new RegExp("  +", "g"), " ");
    };
  })(this);

  flatten = function(items) {
    return items;
  };

  _stack = [];

  toMarkdown = function(doms, option) {
    var _, content, count, escapeMarkdownUrl, headline, hint, href, i, item, j, len, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, result, texts;
    if (option == null) {
      option = {};
    }
    texts = [];
    count = 0;
    escapeMarkdownUrl = function(string) {
      var _map, result;
      _map = {
        "(": "\\(",
        ")": "\\)",
        "\\": "\\\\"
      };
      result = string.replace(/\(|\)|\\/g, function(match) {
        return _map[match] || match;
      });
      return result;
    };
    for (i = 0, len = doms.length; i < len; i++) {
      item = doms[i];
      _stack.push(item.name);
      if (((ref = option.filter) != null ? ref.length : void 0) > 0 && (ref1 = item.name, indexOf.call(option.filter, ref1) < 0)) {
        if (option.plainWithoutFilter) {
          option.plain = true;
        } else {
          continue;
        }
      }
      if (option.limit) {
        count += 1;
        if (count > option.limit) {
          break;
        }
      }
      if ((ref2 = item.name) === "P" || ref2 === "div") {
        texts.push(toMarkdown(item.children, option).replace(/\n+/g, "\n") + "\n\n");
      } else if ((ref3 = item.name) === "H1" || ref3 === "H2" || ref3 === "H3" || ref3 === "H4" || ref3 === "H5" || ref3 === "H6") {
        if (option.plain) {
          headline = "";
        } else {
          count = parseInt(item.name[1]) || 1;
          headline = "";
          for (_ = j = 0, ref4 = count; 0 <= ref4 ? j < ref4 : j > ref4; _ = 0 <= ref4 ? ++j : --j) {
            headline += "#";
          }
          headline += " ";
        }
        texts.push("\n" + headline + " " + (toMarkdown(item.children, option).replace(/\n/g, " ")) + "\n");
      } else if (item.name === "PRE") {
        if (option.plain) {
          texts.push((toMarkdown(item.children, option).replace(/\n/g, " ")) + "\n\n");
        } else {
          texts.push("\b```\n");
          texts.push((toMarkdown(item.children, option).replace(/`/g, "\\`")) + "\n\n");
          texts.push("\n```\n");
        }
      } else if (item.name === "QUOTE") {
        if (option.plain) {
          headline = "";
        } else {
          headline = "> ";
        }
        texts.push("> " + (toMarkdown(item.children, option).replace(/\n/g, " ")) + "\n\n");
      } else if (item.name === "TEXT_CONTENT") {
        texts.push(((ref5 = item.attrs.text) != null ? typeof ref5.trim === "function" ? ref5.trim() : void 0 : void 0) || "");
      } else if (item.name === "A") {
        if (option.plain) {
          texts.push(toMarkdown(item.children, {
            plain: true
          }));
        } else {
          hint = toMarkdown(item.children, {
            plain: true,
            limit: 1,
            plainWithoutFilter: true,
            filter: ["IMG", "TEXT_CONTENT"]
          }).trim();
          href = item.attrs.href || "";
          if ((href != null ? href.indexOf("javascript:") : void 0) === 0) {
            href = "";
          }
          href = escapeMarkdownUrl(href || "");
          if (!href && !hint) {
            texts.push("");
          } else {
            texts.push(" [" + hint + "](" + href + ") ");
          }
        }
      } else if (item.name === "SPAN") {
        texts.push(toMarkdown(item.children, option));
      } else if (item.name === "IMG") {
        content = " ![" + (item.attrs.alt || item.attrs.title || "") + "](" + (escapeMarkdownUrl(item.attrs.src || "")) + ") ";
        if (option.plain) {
          texts.push(content);
        } else {
          texts.push("\n" + content + "\n");
        }
      } else if ((ref6 = item.name) === "B" || ref6 === "STRONG") {
        texts.push(" *" + (toMarkdown(item.children, {
          plain: true
        })) + "* ");
      } else if (item.name === "BR") {
        texts.push("\n");
      } else if ((ref7 = item.name) === "SCRIPT" || ref7 === "LINK" || ref7 === "STYLE") {
        texts.push("");
      } else {
        texts.push(toMarkdown(item.children, option));
      }
    }
    result = texts.join("").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    return result;
  };

  module.exports = (function(_this) {
    return function(html) {
      var stack;
      stack = new HTMLStack();
      return stack.parse(html);
    };
  })(this);

  module.exports.isHTMLSimple = function(html) {
    var complicatedTags, e, error, meaningfulTags;
    try {
      complicatedTags = ["IMG", "VIDEO", "TABLE", "NAV"];
      meaningfulTags = ["H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI"];
      HTMLParser(html, {
        start: function(tag) {
          var ref;
          if (ref = tag != null ? tag.toUpperCase() : void 0, indexOf.call(complicatedTags, ref) >= 0) {
            throw new Error("Not Simple!");
          }
        },
        chars: function() {},
        end: function() {}
      });
      return true;
    } catch (error) {
      e = error;
      Logger.error(e);
      return false;
    }
  };

}).call(this);

}
GlobalContext.setModule("component/html2markdown.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"component/htmlEntity.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var decodeReg, decodeTable, encodeTable, prop, regStrs, value;

  encodeTable = {
    "\"": "&quot;",
    "'": "&apos;",
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    " ": "&nbsp;",
    "¡": "&iexcl;",
    "¢": "&cent;",
    "£": "&pound;",
    "¤": "&curren;",
    "¥": "&yen;",
    "¦": "&brvbar;",
    "§": "&sect;",
    "¨": "&uml;",
    "©": "&copy;",
    "ª": "&ordf;",
    "«": "&laquo;",
    "¬": "&not;",
    "": "&shy;",
    "®": "&reg;",
    "¯": "&macr;",
    "°": "&deg;",
    "±": "&plusmn;",
    "²": "&sup2;",
    "³": "&sup3;",
    "´": "&acute;",
    "µ": "&micro;",
    "¶": "&para;",
    "·": "&middot;",
    "¸": "&cedil;",
    "¹": "&sup1;",
    "º": "&ordm;",
    "»": "&raquo;",
    "¼": "&frac14;",
    "½": "&frac12;",
    "¾": "&frac34;",
    "¿": "&iquest;",
    "×": "&times;",
    "÷": "&divide;",
    "À": "&Agrave;",
    "Á": "&Aacute;",
    "Â": "&Acirc;",
    "Ã": "&Atilde;",
    "Ä": "&Auml;",
    "Å": "&Aring;",
    "Æ": "&AElig;",
    "Ç": "&Ccedil;",
    "È": "&Egrave;",
    "É": "&Eacute;",
    "Ê": "&Ecirc;",
    "Ë": "&Euml;",
    "Ì": "&Igrave;",
    "Í": "&Iacute;",
    "Î": "&Icirc;",
    "Ï": "&Iuml;",
    "Ð": "&ETH;",
    "Ñ": "&Ntilde;",
    "Ò": "&Ograve;",
    "Ó": "&Oacute;",
    "Ô": "&Ocirc;",
    "Õ": "&Otilde;",
    "Ö": "&Ouml;",
    "Ø": "&Oslash;",
    "Ù": "&Ugrave;",
    "Ú": "&Uacute;",
    "Û": "&Ucirc;",
    "Ü": "&Uuml;",
    "Ý": "&Yacute;",
    "Þ": "&THORN;",
    "ß": "&szlig;",
    "à": "&agrave;",
    "á": "&aacute;",
    "â": "&acirc;",
    "ã": "&atilde;",
    "ä": "&auml;",
    "å": "&aring;",
    "æ": "&aelig;",
    "ç": "&ccedil;",
    "è": "&egrave;",
    "é": "&eacute;",
    "ê": "&ecirc;",
    "ë": "&euml;",
    "ì": "&igrave;",
    "í": "&iacute;",
    "î": "&icirc;",
    "ï": "&iuml;",
    "ð": "&eth;",
    "ñ": "&ntilde;",
    "ò": "&ograve;",
    "ó": "&oacute;",
    "ô": "&ocirc;",
    "õ": "&otilde;",
    "ö": "&ouml;",
    "ø": "&oslash;",
    "ù": "&ugrave;",
    "ú": "&uacute;",
    "û": "&ucirc;",
    "ü": "&uuml;",
    "ý": "&yacute;",
    "þ": "&thorn;",
    "ÿ": "&yuml;"
  };

  decodeTable = {};

  regStrs = [];

  for (prop in encodeTable) {
    value = encodeTable[prop];
    decodeTable[value] = prop;
    regStrs.push(value);
  }

  decodeReg = new RegExp(regStrs.join("|"), "g");

  module.exports.decode = function(string) {
    decodeReg.lastIndex = 0;
    return string.replace(decodeReg, function(match) {
      value = decodeTable[match];
      if (value) {
        return value;
      } else {
        return match;
      }
    });
  };

}).call(this);

}
GlobalContext.setModule("component/htmlEntity.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"component/properties.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Properties,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Properties = (function(superClass) {
    extend(Properties, superClass);

    function Properties(target) {
      Properties.__super__.constructor.call(this);
      this.props = {};
      if (target) {
        this.mixin(target);
      }
    }

    Properties.prototype.define = function() {
      var args, property;
      property = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    };

    Properties.prototype.debug = function(fn) {
      this.isDebug = true;
      if (this.log == null) {
        this.log = fn || Logger.debug.bind(console);
      }
      return this;
    };

    Properties.prototype._log = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (this.isDebug) {
        return this.log.apply(this, args);
      }
    };

    Properties.prototype.mixin = function(target1) {
      this.target = target1;
      if (!this.target.listenBy) {
        Leaf.EventEmitter.mixin(this.target);
      }
      this.target.get = this.get.bind(this);
      this.target.set = this.set.bind(this);
      this.target.define = this.define.bind(this);
      this.target.getWhenAvailable = this.getWhenAvailable.bind(this);
      this.target.getAndListenBy = this.getAndListenBy.bind(this);
      return this.target.forProperties = this.forProperties.bind(this);
    };

    Properties.prototype.toJSON = function() {
      return JSON.parse(JSON.stringify(this.props));
    };

    Properties.prototype.fromJSON = function(props) {
      var prop, results, value;
      results = [];
      for (prop in props) {
        value = props[prop];
        results.push(this.set(prop, value));
      }
      return results;
    };

    Properties.prototype.forProperties = function(callback) {
      var k, ref, results, v;
      if (callback == null) {
        callback = function() {};
      }
      ref = this.props;
      results = [];
      for (k in ref) {
        v = ref[k];
        results.push(callback(k, v));
      }
      return results;
    };

    Properties.prototype.set = function(key, value) {
      var oldValue;
      oldValue = this.props[key];
      this.props[key] = value;
      this.emit("change", key, value, oldValue);
      this.fire("property", key, value, oldValue);
      this.emit("change/" + key, value, oldValue);
      this.fire("property/" + key, value, oldValue);
      this._log("set prop", key, "from", oldValue, "to", value);
      return value;
    };

    Properties.prototype.fire = function() {
      var args, ref;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref = this.target).emit.apply(ref, args);
    };

    Properties.prototype.get = function(key) {
      return this.props[key];
    };

    Properties.prototype.getWhenAvailable = function(key, callback) {
      if (typeof this.props[key] !== "undefined") {
        callback(this.props[key]);
        return;
      }
      return this.target.once("property/" + key, function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return callback.apply(null, args);
      });
    };

    Properties.prototype.getAndListenBy = function(who, key, callback) {
      this.target.listenBy(who, "property/" + key, callback);
      if (typeof this.props[key] !== "undefined") {
        return callback.call(who, this.props[key]);
      }
    };

    Properties.prototype.clear = function() {
      var prop, results;
      for (prop in this.props) {
        this.set(prop);
      }
      results = [];
      for (prop in this.props) {
        results.push(delete this.props[prop]);
      }
      return results;
    };

    return Properties;

  })(Leaf.EventEmitter);

  module.exports = Properties;

}).call(this);

}
GlobalContext.setModule("component/properties.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"component/property.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Property,
    slice = [].slice;

  Property = (function() {
    Property.define = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Property, args, function(){});
    };

    function Property(target, name) {
      this.target = target;
      this.value = this.target[name];
      this.target.__defineGetter__(name, (function(_this) {
        return function() {
          if (_this.handleGet != null) {
            return _this.handleGet();
          }
          return _this.value;
        };
      })(this));
      this.target.__defineSetter__(name, (function(_this) {
        return function(value) {
          var oldValue;
          oldValue = _this.value;
          if (_this.handleBeforeSet) {
            value = _this.handleBeforeSet(value, oldValue);
          }
          _this.value = value;
          if (_this.handleAfterSet) {
            _this.handleAfterSet(value, oldValue);
          }
          return value;
        };
      })(this));
    }

    Property.prototype.get = function(handler) {
      return this.handleGet = handler;
    };

    Property.prototype.atGet = function(handler) {
      this.handleGet = handler;
      return this;
    };

    Property.prototype.beforeSet = function(handler) {
      this.handleBeforeSet = handler;
      return this;
    };

    Property.prototype.afterSet = function(handler) {
      this.handleAfterSet = handler;
      return this;
    };

    Property.prototype.define = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return Property.define.apply(Property, args);
    };

    return Property;

  })();

  module.exports = Property;

}).call(this);

}
GlobalContext.setModule("component/property.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"component/sharedCallbacks.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var slice = [].slice;

  module.exports.create = (function(_this) {
    return function() {
      var fn;
      fn = function() {
        var args, callback, cbs, i, len, results;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        cbs = fn.callbacks.slice(0);
        fn.callbacks.length = 0;
        results = [];
        for (i = 0, len = cbs.length; i < len; i++) {
          callback = cbs[i];
          results.push(callback.apply(null, args));
        }
        return results;
      };
      fn.callbacks = [];
      fn.__defineGetter__("length", function() {
        return fn.callbacks.length;
      });
      fn.__defineGetter__("count", function() {
        return fn.callbacks.length;
      });
      fn.push = function(callback) {
        if (typeof callback !== "function") {
          Logger.warn("SharedCallback.push with none function", callback);
          return false;
        }
        return this.callbacks.push(callback);
      };
      fn.clear = function() {
        return fn.callbacks.length = 0;
      };
      return fn;
    };
  })(this);

}).call(this);

}
GlobalContext.setModule("component/sharedCallbacks.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"component/vibration.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  module.exports = {
    vibrate: function(value) {
      var ref;
      return (ref = window.navigator) != null ? typeof ref.vibrate === "function" ? ref.vibrate(value) : void 0 : void 0;
    },
    feedback: function(value) {
      return this.vibrate(15);
    }
  };

}).call(this);

}
GlobalContext.setModule("component/vibration.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/editor.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Buffer, BufferManager, COMComposer, COMContext, COMDecoration, COMElement, COMNamespace, COMNode, COMRichText, COMSpell, CancelStack, Caret, Clipboard, CommandManager, ContextManager, DOMSelection, Debugger, DocumentFocus, DragManager, DropManager, Editor, HotkeyManager, InputMethod, NextRenderAware, Platform, PluginManager, SharedCallbacks,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  COMContext = require("./com/context");

  COMRichText = require("./com/richText");

  COMNamespace = require("./com/namespace");

  COMDecoration = require("./com/decoration");

  COMSpell = require("./com/spell");

  COMElement = require("./com/element");

  COMNode = require("./com/node");

  COMComposer = require("./com/composer");

  Caret = require("./facility/caret");

  InputMethod = require("./facility/inputMethod");

  HotkeyManager = require("./facility/hotkeyManager");

  CommandManager = require("./facility/commandManager");

  Clipboard = require("./facility/clipboard");

  PluginManager = require("./facility/pluginManager");

  Buffer = require("./facility/buffer");

  DropManager = require("./facility/dropManager");

  BufferManager = Buffer.BufferManager;

  Debugger = require("./facility/debugger");

  Platform = require("./facility/platform");

  ContextManager = require("./facility/contextManager");

  DocumentFocus = require("./facility/documentFocus");

  DOMSelection = require("./facility/selection");

  CancelStack = require("./facility/cancelStack");

  DragManager = require("./facility/dragManager");

  SharedCallbacks = require("/component/sharedCallbacks");

  Editor = (function(superClass) {
    extend(Editor, superClass);

    Editor.packs = [];

    Editor.prototype.COM = require("./com/index");

    function Editor(el) {
      this.asUser = bind(this.asUser, this);
      var Key, index;
      Editor.__super__.constructor.call(this, el);
      new NextRenderAware(this);
      this.namespace = COMContext.namespace;
      if (this["debugger"] == null) {
        this["debugger"] = new Debugger(this);
      }
      this.platform = Platform.create();
      this.contextManager = new ContextManager(this);
      this.contextManager.listenBy(this, "context/create", (function(_this) {
        return function(context) {
          return context.facilities.editor = _this;
        };
      })(this));
      this.bufferManager = new BufferManager(this);
      this.__defineGetter__("buffer", (function(_this) {
        return function() {
          return _this.bufferManager.currentFocus;
        };
      })(this));
      this.__defineGetter__("context", (function(_this) {
        return function() {
          var ref;
          return (ref = _this.bufferManager.currentFocus) != null ? ref.context : void 0;
        };
      })(this));
      this.__defineGetter__("selectSession", (function(_this) {
        return function() {
          var ref;
          return (ref = _this.bufferManager.currentFocus) != null ? ref.selectSession : void 0;
        };
      })(this));
      this.clipboard = new Clipboard(this);
      this.domSelection = new DOMSelection(this);
      if (this.inputMethod == null) {
        this.inputMethod = new InputMethod(this);
      }
      this.dragManager = new DragManager(this);
      if (this.caret == null) {
        this.caret = new Caret(this);
      }
      this.bufferManager.listenBy(this, "focus", (function(_this) {
        return function(buffer) {
          Buffer = require("./facility/buffer");
          if (buffer instanceof Buffer.RichBuffer) {
            return _this.caret.attachTo(buffer);
          }
        };
      })(this));
      this.initHeight = $(window).height();
      this.caret.init();
      this.inputMethod.init();
      if (this.hotkeys == null) {
        this.hotkeys = new HotkeyManager(this);
      }
      if (this.commands == null) {
        this.commands = new CommandManager(this);
      }
      if (this.plugins == null) {
        this.plugins = new PluginManager(this);
      }
      if (this.dropManager == null) {
        this.dropManager = new DropManager(this);
      }
      if (this.cancelStack == null) {
        this.cancelStack = new CancelStack(this);
      }
      this.inputMethod.on("input", (function(_this) {
        return function(input) {
          var ref;
          if ((ref = _this.buffer) != null ? ref.lockUserInput : void 0) {
            return;
          }
          if (_this.focus.level !== "all") {
            return;
          }
          _this.userIsWriting = true;
          _this.conduct("write", input);
          return _this.userIsWriting = false;
        };
      })(this));
      index = 0;
      Key = Leaf.Key;
      this.inputMethod.on("key", (function(_this) {
        return function(event) {
          var locked, ref, ref1, ref2, ref3, ref4, ref5, ref6;
          locked = _this.lockUserInput || ((ref = _this.buffer) != null ? ref.lockUserInput : void 0);
          _this.hotkeys.handleKeyEvent(event);
          if (event.altKey && !event.ctrlKey && event.code !== Leaf.Key.d) {
            event.capture();
          }
          if (!event.defaultPrevented && !window.hasCommandKey && _this.buffer && event.keyDown && ((ref1 = _this.buffer) != null ? (ref2 = ref1.selection) != null ? ref2.isActive : void 0 : void 0) && !((ref3 = _this.buffer.selection) != null ? typeof ref3.isCollapsed === "function" ? ref3.isCollapsed() : void 0 : void 0) && !event.isModified() && _this.focus.level === "buffer") {
            if (event.canOutput()) {
              event.capture();
              if (!locked) {
                _this.userIsWriting = true;
                _this.conduct("delete-selection");
                _this.conduct("write", event.getInputText());
                _this.userIsWriting = false;
                return;
              }
            }
          }
          if (((ref4 = event.code) === Leaf.Key.backspace) && ((ref5 = (ref6 = document.activeElement) != null ? ref6.tagName : void 0) !== "TEXTAREA" && ref5 !== "INPUT")) {
            event.raw.preventDefault();
            event.raw.stopImmediatePropagation();
          }
          if (event.altKey && event.code !== Leaf.Key.d) {
            return event.raw.preventDefault();
          }
        };
      })(this));
      this.focus = new DocumentFocus.FocusManager(this);
      if (typeof this.registerPlugin === "function") {
        this.registerPlugin();
      }
    }

    Editor.prototype.asUser = function(fn) {
      var e, error, userIsWriting;
      userIsWriting = this.userIsWriting;
      this.userIsWriting = true;
      try {
        fn();
      } catch (error) {
        e = error;
        Logger.error("Error during Editor.asUser", e);
      }
      return this.userIsWriting = userIsWriting;
    };

    Editor.prototype.getAllPlugins = function() {
      return this.plugins.plugins;
    };

    Editor.prototype.init = function() {
      this.setup();
      this.activate();
      this.focus.allowAll();
      this.emit("ready");
      return this.platform.emitEmbedEvent("ready");
    };

    Editor.prototype.setup = function() {
      this.caret.show();
      return this.plugins.init();
    };

    Editor.prototype.conduct = function() {
      var args, ref;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (args[0] === "write") {
        this.emit("write", args[1]);
      }
      return (ref = this.commands).conduct.apply(ref, args);
    };

    Editor.prototype.announce = function() {
      var args, name;
      name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      return this.emit.apply(this, ["announcement/" + name].concat(slice.call(args)));
    };

    Editor.prototype.activate = function() {
      if (this.isActive) {
        return false;
      }
      this.isActive = true;
      this.inputMethod.activate();
      this.caret.activate();
      this.renderFrame();
      return true;
    };

    Editor.prototype.deactivate = function() {
      if (!this.isActive) {
        return false;
      }
      this.isActive = false;
      clearTimeout(this.timer);
      cancelAnimationFrame(this.timer);
      this.inputMethod.deactivate();
      this.caret.deactivate();
      return true;
    };

    Editor.prototype.plugin = function(name) {
      return this.plugins.plugins[name];
    };

    Editor.prototype.render = function() {
      this.emit("beforeRender");
      this.bufferManager.render();
      if (document.body.scrollTop !== 0) {
        if (!this.lastScrollTop) {
          this.lastScrollTop = document.body.scrollTop;
        } else if (this.lastScrollTop === document.body.scrollTop) {
          document.body.scrollTop = 0;
        }
      }
      if (this.caret.isShow) {
        this.caret.update();
      }
      return this.emit("afterRender");
    };

    Editor.prototype.renderFrame = function() {
      this.render();
      return this.timer = this.nextRenderFrame((function(_this) {
        return function() {
          return _this.renderFrame();
        };
      })(this));
    };

    Editor.prototype.nextRenderFrame = function(frame) {
      return window.requestAnimationFrame(frame);
    };

    Editor.prototype.addComponent = function() {
      var Cons, i, item, len, results;
      Cons = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      results = [];
      for (i = 0, len = Cons.length; i < len; i++) {
        item = Cons[i];
        if (item.prototype instanceof COMDecoration.DecorationMaintainer) {
          results.push(this.namespace.registerDecoration(new item));
        } else if (item instanceof COMDecoration.DecorationMaintainer) {
          results.push(this.namespace.registerDecoration(item));
        } else if (item.prototype instanceof COMSpell) {
          results.push(this.namespace.registerSpell(item));
        } else if (item.prototype instanceof COMNode) {
          results.push(this.namespace.registerNode(item));
        } else if (item instanceof COMComposer) {
          results.push(this.namespace.registerComposer(item));
        } else if (item.prototype instanceof COMComposer) {
          results.push(this.namespace.registerComposer(new item()));
        } else {
          results.push(Logger.error("unknown inline resource", item));
        }
      }
      return results;
    };

    Editor.prototype.addPackageStatic = function(pack) {
      var Command, Composer, Dec, Element, Intent, Rune, Spell, handler, i, j, k, key, l, len, len1, len2, len3, len4, len5, len6, len7, m, n, o, p, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, results;
      ref = pack.prototype.Commands || [];
      for (i = 0, len = ref.length; i < len; i++) {
        Command = ref[i];
        this.commands.register(Command);
      }
      ref1 = pack.prototype.Hotkeys || [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        ref2 = ref1[j], key = ref2[0], handler = ref2[1];
        this.hotkeys.registerCommandHotkey(key, handler);
      }
      ref3 = pack.prototype.Decorations || [];
      for (k = 0, len2 = ref3.length; k < len2; k++) {
        Dec = ref3[k];
        if (Dec instanceof COMDecoration.DecorationMaintainer) {
          this.namespace.registerDecoration(Dec);
        } else if (Dec.prototype instanceof COMDecoration.DecorationMaintainer) {
          this.namespace.registerDecoration(new Dec);
        } else {
          Logger.error("Invalid decoration", Dec, "at", pack);
        }
      }
      ref4 = pack.prototype.Runes || [];
      for (l = 0, len3 = ref4.length; l < len3; l++) {
        Rune = ref4[l];
        this.namespace.registerNode(Rune);
      }
      ref5 = pack.prototype.Spells || [];
      for (m = 0, len4 = ref5.length; m < len4; m++) {
        Spell = ref5[m];
        this.namespace.registerSpell(Spell);
      }
      ref6 = pack.prototype.Elements || [];
      for (n = 0, len5 = ref6.length; n < len5; n++) {
        Element = ref6[n];
        this.namespace.registerNode(Element);
      }
      ref7 = pack.prototype.Composers || [];
      for (o = 0, len6 = ref7.length; o < len6; o++) {
        Composer = ref7[o];
        if (Composer instanceof COM.COMComposer) {
          this.namespace.registerComposer(Composer);
        } else if (Composer.prototype instanceof COMComposer) {
          this.namespace.registerComposer(new Composer());
        } else {
          Logger.error("Invalid composer", Composer, "at", pack);
        }
      }
      ref8 = pack.prototype.Intents || [];
      results = [];
      for (p = 0, len7 = ref8.length; p < len7; p++) {
        Intent = ref8[p];
        results.push(COM.COMIntent.register(Intent, Intent.name || Intent.prototype.name));
      }
      return results;
    };

    return Editor;

  })(Leaf.Widget);

  NextRenderAware = (function(superClass) {
    extend(NextRenderAware, superClass);

    function NextRenderAware() {
      return NextRenderAware.__super__.constructor.apply(this, arguments);
    }

    NextRenderAware.prototype.nextRenderCallback = null;

    NextRenderAware.prototype.initialize = function() {
      this.nextRenderCallback = SharedCallbacks.create();
      return this.listenBy(NextRenderAware, "afterRender", (function(_this) {
        return function() {
          return _this.nextRenderCallback();
        };
      })(this));
    };

    NextRenderAware.prototype.nextRender = function(callback) {
      if (callback == null) {
        callback = function() {};
      }
      return this.nextRenderCallback.push(callback);
    };

    return NextRenderAware;

  })(Leaf.Trait);

  module.exports = Editor;

}).call(this);

}
GlobalContext.setModule("vincent/editor.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/index.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  module.exports = {
    Package: require("./package"),
    Caret: require("./facility/caret"),
    Buffer: require("./facility/buffer")
  };

}).call(this);

}
GlobalContext.setModule("vincent/index.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/pack.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMComposer, COMContext, COMElement, COMNamespace, COMNode, COMRichText, COMSpell, Decoration, Pack,
    slice = [].slice;

  COMRichText = require("./com/richText");

  Decoration = require("./com/decoration");

  COMSpell = require("./com/spell");

  COMElement = require("./com/element");

  COMNamespace = require("./com/namespace");

  COMNode = require("./com/node");

  COMContext = require("./com/context");

  COMComposer = require("./com/composer");

  Pack = (function() {
    function Pack() {
      var packs;
      packs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      this.decorations = [];
      this.spells = [];
      this.nodes = [];
      this.composers = [];
      this.add.apply(this, packs);
      this.cmds = [];
      this.hotkeys = [];
    }

    Pack.prototype.add = function() {
      var Cons, i, item, len, results;
      Cons = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      results = [];
      for (i = 0, len = Cons.length; i < len; i++) {
        item = Cons[i];
        if (item.prototype instanceof Decoration.DecorationMaintainer) {
          results.push(this.decorations.push(new item));
        } else if (item instanceof Decoration.DecorationMaintainer) {
          results.push(this.decorations.push(item));
        } else if (item.prototype instanceof COMSpell) {
          results.push(this.spells.push(item));
        } else if (item.prototype instanceof COMNode) {
          results.push(this.nodes.push(item));
        } else if (item instanceof COMComposer) {
          results.push(this.composers.push(item));
        } else if (item.prototype instanceof COMComposer) {
          results.push(this.composers.push(new item()));
        } else {
          results.push(Logger.error("unknown inline resource", item));
        }
      }
      return results;
    };

    Pack.prototype.registerCommand = function(cmd) {
      return this.cmds.push(cmd);
    };

    Pack.prototype.registerHotkey = function(keyString, handler) {
      return this.hotkeys.push({
        keyString: keyString,
        handler: handler
      });
    };

    Pack.prototype.applyTo = function(target) {
      var i, item, j, k, l, len, len1, len2, len3, ref, ref1, ref2, ref3, results;
      ref = this.nodes;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        target.registerNode(item);
      }
      ref1 = this.composers;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        item = ref1[j];
        target.registerComposer(item.type, item);
      }
      ref2 = this.spells;
      for (k = 0, len2 = ref2.length; k < len2; k++) {
        item = ref2[k];
        target.registerSpell(item);
      }
      ref3 = this.decorations;
      results = [];
      for (l = 0, len3 = ref3.length; l < len3; l++) {
        item = ref3[l];
        results.push(target.registerDecoration(item));
      }
      return results;
    };

    Pack.prototype.addConfig = function(config) {
      var Command, Composer, Element, Hotkey, Spell, i, j, k, l, len, len1, len2, len3, len4, len5, m, n, ref, ref1, ref2, ref3, ref4, ref5, results;
      ref = config.Commands;
      for (i = 0, len = ref.length; i < len; i++) {
        Command = ref[i];
        pack.registerCommand(Command);
      }
      ref1 = config.Hotkeys;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        Hotkey = ref1[j];
        pack.registerHotkey(Hotkey);
      }
      ref2 = config.Decorations;
      for (k = 0, len2 = ref2.length; k < len2; k++) {
        Decoration = ref2[k];
        pack.add(Decoration);
      }
      ref3 = config.Spells;
      for (l = 0, len3 = ref3.length; l < len3; l++) {
        Spell = ref3[l];
        pack.add(Spell);
      }
      ref4 = config.Elements;
      for (m = 0, len4 = ref4.length; m < len4; m++) {
        Element = ref4[m];
        pack.add(Element);
      }
      ref5 = config.Composers;
      results = [];
      for (n = 0, len5 = ref5.length; n < len5; n++) {
        Composer = ref5[n];
        results.push(pack.add(Composer));
      }
      return results;
    };

    return Pack;

  })();

  module.exports = Pack;

}).call(this);

}
GlobalContext.setModule("vincent/pack.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/package.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Package,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Package = (function(superClass) {
    extend(Package, superClass);

    function Package() {
      return Package.__super__.constructor.apply(this, arguments);
    }

    Package.prototype.name = "VoidPackage";

    Package.prototype.requires = [];

    Package.prototype.Commands = [];

    Package.prototype.Hotkeys = [];

    Package.prototype.Decorations = [];

    Package.prototype.Spells = [];

    Package.prototype.Runes = [];

    Package.prototype.Elements = [];

    Package.prototype.Composers = [];

    Package.prototype.Intents = [];

    Package.prototype.isInitialized = false;

    Package.prototype.onContextCreate = null;

    Package.prototype.onContextDestroy = null;

    Package.prototype.init = function(editor, deps) {
      this.editor = editor;
      this.deps = deps != null ? deps : {};
      this.isInitialized = true;
      if (typeof this.onContextCreate === "function") {
        this.editor.contextManager.listenBy(this, "context/create", (function(_this) {
          return function(c) {
            return _this.onContextCreate(c);
          };
        })(this));
      }
      if (typeof this.onContextDestroy === "function") {
        return this.editor.contextManager.listenBy(this, "context/destroy", (function(_this) {
          return function(c) {
            return _this.onContextDestroy(c);
          };
        })(this));
      }
    };

    return Package;

  })(Leaf.EventEmitter);

  module.exports = Package;

}).call(this);

}
GlobalContext.setModule("vincent/package.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/anchor.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMAnchor, EventEmitter,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = (require("./events")).EventEmitter;

  COMAnchor = (function(superClass) {
    extend(COMAnchor, superClass);

    function COMAnchor() {
      COMAnchor.__super__.constructor.call(this);
    }

    return COMAnchor;

  })(EventEmitter);

  module.exports = COMAnchor;

}).call(this);

}
GlobalContext.setModule("vincent/com/anchor.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/composePolicy.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMComposePolicy, COMPolicy,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  COMPolicy = require("./policy");

  COMComposePolicy = (function(superClass) {
    extend(COMComposePolicy, superClass);

    function COMComposePolicy(node) {
      this.node = node;
      COMComposePolicy.__super__.constructor.call(this, this.node);
    }

    COMComposePolicy.prototype.newlineSplitHead = false;

    COMComposePolicy.prototype.newlineSplitTail = false;

    COMComposePolicy.prototype.tailingNewline = false;

    COMComposePolicy.prototype.headingNewline = false;

    COMComposePolicy.prototype.borrows = false;

    COMComposePolicy.prototype.lend = false;

    return COMComposePolicy;

  })(COMPolicy);

  module.exports = COMComposePolicy;

}).call(this);

}
GlobalContext.setModule("vincent/com/composePolicy.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/composer.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMComposer;

  COMComposer = (function() {
    function COMComposer() {}

    COMComposer.prototype.type = "VoidComposer";

    COMComposer.prototype.compose = function(target) {
      var result;
      if (!target.root) {
        return false;
      }
      this.context = target.context;
      this.target = target;
      this.cache = target.composerBuffer;
      result = (typeof this.exec === "function" ? this.exec() : void 0) || false;
      return result;
    };

    return COMComposer;

  })();

  module.exports = COMComposer;

}).call(this);

}
GlobalContext.setModule("vincent/com/composer.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/container.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var AppendChildOperation, COMAnchor, COMContainer, COMNode, COMPath, EmptyOperation, Errors, InsertOperation, Operation, RemoveChildOperation,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice1 = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  COMNode = require("./node");

  COMPath = require("./path");

  Operation = require("./operation");

  COMAnchor = require("./anchor");

  Errors = require("./errors");

  COMContainer = (function(superClass) {
    extend(COMContainer, superClass);

    COMContainer.prototype.type = "Container";

    function COMContainer(context, option) {
      this.context = context;
      if (option == null) {
        option = {};
      }
      this.children = [];
      COMContainer.__super__.constructor.call(this, this.context, option);
      this.fromJSON(option);
      this.__defineGetter__("domContainer", (function(_this) {
        return function() {
          var ref;
          return ((ref = _this.cache) != null ? ref.domContainer : void 0) || null;
        };
      })(this));
      this.__defineSetter__("domContainer", (function(_this) {
        return function(domContainer) {
          if (domContainer != null) {
            domContainer.com = _this;
          }
          return _this.cache.domContainer = domContainer;
        };
      })(this));
    }

    COMContainer.prototype.onRootDispel = function() {
      var child, i, len, ref, results1;
      COMContainer.__super__.onRootDispel.call(this);
      ref = this.children;
      results1 = [];
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        results1.push(child.root = null);
      }
      return results1;
    };

    COMContainer.prototype.onRootAvailable = function() {
      var child, i, len, ref, results1;
      COMContainer.__super__.onRootAvailable.call(this);
      ref = this.children;
      results1 = [];
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        results1.push(child.root = this.root);
      }
      return results1;
    };

    COMContainer.prototype.setRenderContext = function(rc) {
      var child, i, len, ref, results1;
      if (rc === this.rc) {
        return;
      }
      COMContainer.__super__.setRenderContext.call(this, rc);
      ref = this.children;
      results1 = [];
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        results1.push(child.setRenderContext(rc));
      }
      return results1;
    };

    COMContainer.prototype.cacheIndex = function() {
      var i, index, item, len, ref;
      ref = this.children;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        item = ref[index];
        item._containerIndex = index;
      }
      this._indexCached = true;
      return this._indexCached;
    };

    COMContainer.prototype.some = function() {
      var args, ref;
      args = 1 <= arguments.length ? slice1.call(arguments, 0) : [];
      return (ref = this.children).some.apply(ref, args);
    };

    COMContainer.prototype.every = function() {
      var args, ref;
      args = 1 <= arguments.length ? slice1.call(arguments, 0) : [];
      return (ref = this.children).every.apply(ref, args);
    };

    COMContainer.prototype.render = function(rc, option) {
      var child, extraAppearance, frag, i, item, j, k, l, len, len1, len2, len3, rearrange, recursive, ref, ref1, ref2, ref3, ref4, selfless;
      if (option == null) {
        option = {};
      }
      if (!this.dirty) {
        return;
      }
      recursive = option.recursive;
      selfless = option.selfless && this.el && this.el.children.length > 0;
      rearrange = !selfless || this.beforeMark("rearrange");
      if (rearrange) {
        COMContainer.__super__.render.call(this, rc, {
          force: true
        });
        this.specifyDomContainer();
        if (!this.domContainer) {
          this.domContainer = this.el;
        }
        frag = document.createDocumentFragment();
      } else {
        COMContainer.__super__.render.call(this, rc);
        this.specifyDomContainer();
        if (!this.domContainer) {
          this.domContainer = this.el;
        }
      }
      extraAppearance = [];
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        if (((ref1 = child.parentAppearance) != null ? ref1.length : void 0) > 0) {
          ref2 = child.parentAppearance;
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            item = ref2[j];
            if (indexOf.call(extraAppearance, item) < 0) {
              extraAppearance.push(item);
            }
          }
        }
        if (recursive && (child.dirty || !child.el || option.force)) {
          child.render(rc, option);
          child.afterRender();
        }
        if (rearrange) {
          if (!child.el) {
            Logger.error(child, "has no el of", this, child.type, child._id, this.type, this._id);
          }
          if (child.elBefore) {
            frag.appendChild(child.elBefore);
          }
          frag.appendChild(child.el);
          if (child.elAfter) {
            frag.appendChild(child.elAfter);
          }
        }
      }
      ref4 = ((ref3 = this.cache) != null ? ref3.extraAppearance : void 0) || [];
      for (k = 0, len2 = ref4.length; k < len2; k++) {
        item = ref4[k];
        this.el.classList.remove(item);
      }
      for (l = 0, len3 = extraAppearance.length; l < len3; l++) {
        item = extraAppearance[l];
        this.el.classList.add(item);
      }
      this.cache.extraAppearance = extraAppearance;
      if (rearrange) {
        if (this.domContainer !== this.el) {
          this.domContainer.innerHTML = "";
        }
        return this.domContainer.appendChild(frag);
      }
    };

    COMContainer.prototype.specifyDomContainer = function() {
      this.domContainer = this.el;
    };

    COMContainer.prototype._attach = function(node) {
      if (node.parent) {
        throw new Errors.LogicError("can't attach a node to container that is not orphan");
      }
      node.parent = this;
      node.root = this.root;
      this.pend();
      this.setRevisionMark("rearrange");
      this.setRevisionMark("hasAttachedChild");
      return node.listenBy(this, "pend", (function(_this) {
        return function() {
          return _this.pend();
        };
      })(this));
    };

    COMContainer.prototype._detach = function(node) {
      if (node.parent !== this) {
        throw new Errors.LogicError("can't detach node without being it's parent");
      }
      node.parent = null;
      node.root = null;
      node.stopListenBy(this);
      this.pend();
      this.setRevisionMark("hasDetachedChild");
      return this.setRevisionMark("rearrange");
    };

    COMContainer.prototype.last = function() {
      return this.children[this.children.length - 1] || null;
    };

    COMContainer.prototype.child = function(index) {
      return this.children[index] || null;
    };

    COMContainer.prototype.indexOf = function(node) {
      if (node.parent !== this) {
        return -1;
      }
      if (this._indexCached) {
        return node._containerIndex;
      }
      return this.children.indexOf(node);
    };

    COMContainer.prototype.contains = function(node) {
      var child, i, j, len, len1, ref, ref1;
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        if (child === node) {
          return true;
        }
      }
      ref1 = this.children;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        child = ref1[j];
        if (child.contains && child.contains(node)) {
          return true;
        }
      }
      return false;
    };

    COMContainer.prototype.removeChild = function(node) {
      var index;
      if (typeof node === "number") {
        index = node;
      } else if (node.parent !== this) {
        return false;
      } else {
        index = this.indexOf(node);
      }
      if (index < 0) {
        return false;
      }
      return this.context.operate(new RemoveChildOperation(this.context, this, {
        index: index
      }));
    };

    COMContainer.prototype.removeChildren = function(children) {
      var child, i, len, results1;
      results1 = [];
      for (i = 0, len = children.length; i < len; i++) {
        child = children[i];
        results1.push(this.removeChild(child));
      }
      return results1;
    };

    COMContainer.prototype.insert = function() {
      var index, nodes;
      index = arguments[0], nodes = 2 <= arguments.length ? slice1.call(arguments, 1) : [];
      return this.context.operate(new InsertOperation(this.context, this, {
        index: index,
        children: nodes
      }));
    };

    COMContainer.prototype.append = function() {
      var nodes;
      nodes = 1 <= arguments.length ? slice1.call(arguments, 0) : [];
      return this.context.operate(new AppendChildOperation(this.context, this, {
        children: nodes
      }));
    };

    COMContainer.prototype.empty = function() {
      if (this.children.length === 0) {
        return true;
      }
      return this.context.operate(new EmptyOperation(this.context, this, {}));
    };

    COMContainer.prototype.clone = function() {
      var clone, i, item, len, ref;
      clone = this.context.createElement(this.type);
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        clone.append(item.clone());
      }
      return clone;
    };

    COMContainer.prototype.pend = function() {
      this._indexCached = false;
      return COMContainer.__super__.pend.call(this);
    };

    COMContainer.prototype.compose = function() {
      this.cacheIndex();
      return COMContainer.__super__.compose.call(this);
    };

    COMContainer.prototype.slice = function(option) {
      var child, clone, i, isPartial, item, j, k, left, len, len1, len2, ref, ref1, results, right, slice;
      if (option == null) {
        option = {};
      }
      if ((!option.left || ((ref = option.left) != null ? ref.leftMost : void 0)) && (!option.right || option.right.rightMost)) {
        return this.clone();
      }
      if (option.left instanceof COMAnchor) {
        left = option.left;
      } else {
        left = {
          leftMost: true
        };
      }
      if (option.right instanceof COMAnchor) {
        right = option.right;
      } else {
        right = {
          rightMost: true
        };
      }
      results = [];
      ref1 = this.children;
      for (i = 0, len = ref1.length; i < len; i++) {
        child = ref1[i];
        slice = child.slice(option);
        if (!slice) {
          continue;
        }
        results.push(slice);
      }
      if (results.length === 0 && this.children.length !== 0) {
        return null;
      }
      isPartial = false;
      for (j = 0, len1 = results.length; j < len1; j++) {
        child = results[j];
        if (child.isPartial) {
          isPartial = true;
          break;
        }
      }
      clone = this.context.createElement(this.type);
      for (k = 0, len2 = results.length; k < len2; k++) {
        item = results[k];
        clone.append(item);
      }
      clone.isPartial = isPartial;
      return clone;
    };

    COMContainer.prototype.toPlainString = function() {
      var i, item, len, ref, results;
      results = [];
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        results.push(item.toPlainString());
      }
      return results.join("");
    };

    COMContainer.prototype.toHumanString = function() {
      var i, item, len, ref, results;
      results = [];
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        results.push(item.toHumanString());
      }
      return results.join("");
    };

    COMContainer.prototype.toJSON = function() {
      var item, result;
      result = COMContainer.__super__.toJSON.call(this);
      result.children = ((function() {
        var i, len, ref, results1;
        ref = this.children;
        results1 = [];
        for (i = 0, len = ref.length; i < len; i++) {
          item = ref[i];
          results1.push(item.toJSON());
        }
        return results1;
      }).call(this)).filter(function(item) {
        return item;
      });
      if (result.children.length === 0) {
        delete result.children;
      }
      return result;
    };

    COMContainer.prototype.fromJSON = function(option) {
      var child, i, len, node, ref, results1;
      if (option.children && option.children.length > 0) {
        this.empty();
        ref = option.children;
        results1 = [];
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          if (!child) {
            continue;
          }
          node = this.context.createElement(child);
          if (node) {
            results1.push(this.append(node));
          } else {
            results1.push(Logger.error("invalid json", child));
          }
        }
        return results1;
      }
    };

    return COMContainer;

  })(COMNode);

  AppendChildOperation = (function(superClass) {
    extend(AppendChildOperation, superClass);

    function AppendChildOperation() {
      return AppendChildOperation.__super__.constructor.apply(this, arguments);
    }

    AppendChildOperation.prototype.name = "AppendChildOperation";

    AppendChildOperation.prototype.invoke = function() {
      var child, i, len, ref, target;
      target = this.target || this.context.root.getChildByPath(this.path);
      if (!(target instanceof COMContainer)) {
        this.error("require a Container node to perform the action");
        return false;
      }
      if (!this.option.children) {
        this.error("request children to append");
        return false;
      }
      this.option.at = target.children.length;
      ref = this.option.children;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        child = child instanceof COMNode && child || this.context.createElement(child);
        target.children.push(child);
        target._attach(child);
      }
      return true;
    };

    AppendChildOperation.prototype.revoke = function() {
      var child, i, len, result, results1, target;
      target = this.target || this.context.root.getChildByPath(this.path);
      if (!(target instanceof COMContainer)) {
        this.error("require a Container node to perform the action");
        return false;
      }
      if (this.option.at + this.option.children.length !== target.children.length) {
        this.error("revoke with target of children length " + target.children.length + " does't match the invoke result");
        return false;
      }
      result = target.children.splice(this.option.at, this.option.children.length);
      results1 = [];
      for (i = 0, len = result.length; i < len; i++) {
        child = result[i];
        results1.push(target._detach(child));
      }
      return results1;
    };

    return AppendChildOperation;

  })(Operation.TreeOperation);

  EmptyOperation = (function(superClass) {
    extend(EmptyOperation, superClass);

    function EmptyOperation() {
      return EmptyOperation.__super__.constructor.apply(this, arguments);
    }

    EmptyOperation.prototype.name = "EmptyOperation";

    EmptyOperation.prototype.invoke = function() {
      var i, item, len, ref, target;
      target = this.target || this.context.root.getChildByPath(this.path);
      if (!(target instanceof COMContainer)) {
        this.error("require a Container node to perform the action");
        return false;
      }
      this.option.children = target.children.slice();
      target.children.length = 0;
      ref = this.option.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        target._detach(item);
      }
      return true;
    };

    EmptyOperation.prototype.revoke = function() {
      var i, item, len, ref, target;
      target = this.target || this.context.root.getChildByPath(this.path);
      if (!(target instanceof COMContainer)) {
        this.error("require a Container node to perform the action");
        return false;
      }
      if (target.children.length !== 0) {
        this.error("revoke with container chidlren.length " + target.children.length + " isnt 0");
      }
      ref = this.option.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        target.children.push(item);
        target._attach(item);
      }
      return true;
    };

    return EmptyOperation;

  })(Operation.TreeOperation);

  InsertOperation = (function(superClass) {
    extend(InsertOperation, superClass);

    function InsertOperation() {
      return InsertOperation.__super__.constructor.apply(this, arguments);
    }

    InsertOperation.prototype.name = "InsertOperation";

    InsertOperation.prototype.invoke = function() {
      var i, insertion, item, len, ref, target;
      if (!this.option.children || !(this.option.children.length > 0)) {
        this.error("insert without children provided");
      }
      target = this.target || this.context.root.getChildByPath(this.path);
      if (!(target instanceof COMContainer)) {
        this.error("require a Container node to perform the action");
        return false;
      }
      if (target.children.length < this.option.index) {
        this.error("container children.length is " + target.children.length + " less than the insert index " + this.option.index);
        return false;
      }
      insertion = this.option.children.map((function(_this) {
        return function(item) {
          if (item instanceof COMNode) {
            return item;
          }
          return _this.context.createElement(item);
        };
      })(this));
      (ref = target.children).splice.apply(ref, [this.option.index, 0].concat(slice1.call(insertion)));
      for (i = 0, len = insertion.length; i < len; i++) {
        item = insertion[i];
        target._attach(item);
      }
      return true;
    };

    InsertOperation.prototype.revoke = function() {
      var child, children, i, len, target;
      target = this.target || this.context.root.getChildByPath(this.path);
      if (!(target instanceof COMContainer)) {
        this.error("require a Container node to perform the action");
        return false;
      }
      children = target.children.splice(this.option.index, this.option.children.length);
      for (i = 0, len = children.length; i < len; i++) {
        child = children[i];
        target._detach(child);
      }
      return true;
    };

    return InsertOperation;

  })(Operation.TreeOperation);

  RemoveChildOperation = (function(superClass) {
    extend(RemoveChildOperation, superClass);

    function RemoveChildOperation() {
      return RemoveChildOperation.__super__.constructor.apply(this, arguments);
    }

    RemoveChildOperation.prototype.name = "RemoveChildOperation";

    RemoveChildOperation.prototype.invoke = function() {
      var child, i, len, ref, target;
      if (!this.option.length) {
        this.option.length = 1;
      }
      target = this.target || this.context.root.getChildByPath(this.path);
      if (!(target instanceof COMContainer)) {
        this.error("require a Container node to perform the action");
        return false;
      }
      if (target.children.length <= this.option.index) {
        this.error("container children.length is " + target.children.length + " less than the required index " + this.option.index);
        return false;
      }
      this.option.children = target.children.splice(this.option.index, this.option.length);
      ref = this.option.children;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        target._detach(child);
      }
      return true;
    };

    RemoveChildOperation.prototype.revoke = function() {
      var child, i, len, ref, ref1, target;
      target = this.target || this.context.root.getChildByPath(this.path);
      if (!(target instanceof COMContainer)) {
        this.error("require a Container node to perform the action");
        return false;
      }
      if (target.children.length < this.option.index) {
        this.error("revoke container children.length is " + target.children.length + " less than the required index " + this.option.index);
        return false;
      }
      (ref = target.children).splice.apply(ref, [this.option.index, 0].concat(slice1.call(this.option.children)));
      ref1 = this.option.children;
      for (i = 0, len = ref1.length; i < len; i++) {
        child = ref1[i];
        target._attach(child);
      }
      return true;
    };

    return RemoveChildOperation;

  })(Operation.TreeOperation);

  module.exports = COMContainer;

}).call(this);

}
GlobalContext.setModule("vincent/com/container.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/contents.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMComposer, COMContainer, COMContents, COMRichText, ContentsAvoidEmpty, ContentsAvoidNested, MergeByComposePolicy, NormalizeRichTexts,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  COMComposer = require("./composer");

  COMRichText = require("./richText");

  COMContainer = require("./container");

  COMContents = (function(superClass) {
    extend(COMContents, superClass);

    COMContents.prototype.type = "Contents";

    function COMContents(context, data) {
      this.context = context;
      this.data = data;
      if (this.appearance == null) {
        this.appearance = {
          tagName: "div",
          classList: ["com", "com-contents"]
        };
      }
      COMContents.__super__.constructor.call(this, this.context, this.data);
    }

    COMContents.prototype.render = function(rc) {
      return COMContents.__super__.render.call(this, rc, {
        recursive: true,
        selfless: !this.beforeMark("hasAttachedChild") && !this.beforeMark("hasDetachedChild")
      });
    };

    return COMContents;

  })(COMContainer);

  ContentsAvoidNested = (function(superClass) {
    extend(ContentsAvoidNested, superClass);

    function ContentsAvoidNested() {
      return ContentsAvoidNested.__super__.constructor.apply(this, arguments);
    }

    ContentsAvoidNested.prototype.type = "Contents";

    ContentsAvoidNested.prototype.exec = function() {
      var child, children, i, index, item, j, len, once, toAppend;
      children = this.target.children.slice();
      for (index = i = 0, len = children.length; i < len; index = ++i) {
        item = children[index];
        if (item.sortOf("Contents") || item.sortOf("Root")) {
          once = true;
          toAppend = item.children.slice();
          item.empty();
          for (j = toAppend.length - 1; j >= 0; j += -1) {
            child = toAppend[j];
            item.after(child);
          }
          item.remove();
        }
      }
      return once || false;
    };

    return ContentsAvoidNested;

  })(COMComposer);

  ContentsAvoidEmpty = (function(superClass) {
    extend(ContentsAvoidEmpty, superClass);

    function ContentsAvoidEmpty() {
      return ContentsAvoidEmpty.__super__.constructor.apply(this, arguments);
    }

    ContentsAvoidEmpty.prototype.type = "Contents";

    ContentsAvoidEmpty.prototype.exec = function() {
      var last, node;
      last = this.target.last();
      if (!last) {
        node = this.context.createElement("RichText", {
          contentString: ""
        });
        this.target.append(node);
        return true;
      }
    };

    return ContentsAvoidEmpty;

  })(COMComposer);

  NormalizeRichTexts = (function(superClass) {
    extend(NormalizeRichTexts, superClass);

    function NormalizeRichTexts() {
      return NormalizeRichTexts.__super__.constructor.apply(this, arguments);
    }

    NormalizeRichTexts.prototype.type = "Contents";

    NormalizeRichTexts.prototype.exec = function() {
      var anchor, children, contents, currentJoins, cursor, i, index, item, j, joined, k, l, last, len, len1, len2, len3, ref, ref1, ref2, ref3, ref4, ref5, ref6, removed, renderTarget;
      children = this.target.children.slice();
      if ((ref = window.perf) != null) {
        ref.start("L1");
      }
      for (i = 0, len = children.length; i < len; i++) {
        item = children[i];
        index = this.target.indexOf(item);
        if (children.length > 1 && item.length === 0) {
          if ((ref1 = window.perf) != null) {
            ref1.start("AC");
          }
          ref2 = item.anchors;
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            anchor = ref2[j];
            cursor = anchor.cursor;
            cursor.next({
              actions: ["head"]
            }) || cursor.previous({
              actions: ["tail"]
            });
          }
          if ((ref3 = window.perf) != null) {
            ref3.end("AC");
          }
          item.remove();
          removed = true;
        } else if (item.length === 0) {
          true;
        }
      }
      if ((ref4 = window.perf) != null) {
        ref4.end("L1");
      }
      currentJoins = [];
      children = this.target.children.slice();
      children.push({
        end: true
      });
      if ((ref5 = window.perf) != null) {
        ref5.start("L2");
      }
      for (index = k = 0, len2 = children.length; k < len2; index = ++k) {
        item = children[index];
        if (item.type === "RichText" && !(item.length === 0 && item === this.target.last())) {
          currentJoins.push(item);
        } else {
          if (currentJoins.length < 2) {
            currentJoins.length = 0;
            continue;
          }
          index = this.target.indexOf(currentJoins[0]);
          contents = currentJoins.map(function(item) {
            return item.contentString;
          }).join("");
          for (l = 0, len3 = currentJoins.length; l < len3; l++) {
            item = currentJoins[l];
            item.remove();
            joined = true;
          }
          renderTarget = this.context.createElement("RichText", {
            contentString: contents
          });
          this.target.insert(index, renderTarget);
          this.mergeAnchors(currentJoins, renderTarget);
          currentJoins.length = 0;
          joined = true;
        }
      }
      if ((ref6 = window.perf) != null) {
        ref6.end("L2");
      }
      last = this.target.last();
      if (!last || last.type !== "RichText") {
        this.target.append(this.context.createElement("RichText", {
          contentString: "\n"
        }));
        return true;
      }
      if (removed || joined) {
        return true;
      }
      return false;
    };

    NormalizeRichTexts.prototype.mergeAnchors = function(children, target) {
      var anchor, base, i, item, j, len, len1, ref, results;
      base = 0;
      results = [];
      for (i = 0, len = children.length; i < len; i++) {
        item = children[i];
        ref = item.anchors;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          anchor = ref[j];
          anchor.cursor.pointAt(target, {
            anchor: {
              index: base + anchor.index
            }
          });
        }
        results.push(base += item.length);
      }
      return results;
    };

    return NormalizeRichTexts;

  })(COMComposer);

  MergeByComposePolicy = (function(superClass) {
    extend(MergeByComposePolicy, superClass);

    function MergeByComposePolicy() {
      return MergeByComposePolicy.__super__.constructor.apply(this, arguments);
    }

    MergeByComposePolicy.prototype.type = "Contents";

    MergeByComposePolicy.prototype.obeys = function(a, b) {
      var ca, cb, needSplit;
      if (!a || !b) {
        return true;
      }
      needSplit = a.composePolicy.newlineSplitTail || b.composePolicy.newlineSplitHead;
      if (!needSplit) {
        return false;
      }
      ca = a.contentString;
      cb = b.contentString;
      return !ca || ca.slice(-1) === "\n" || !cb || cb[0] === "\n" || false;
    };

    MergeByComposePolicy.prototype.exec = function() {
      var afterContent, anchor, beforeContent, changed, child, childIndex, children, counter, i, index, j, len, len1, length, newText, next, ref, ref1;
      children = this.target.children.slice();
      length = children.length;
      index = 0;
      counter = 0;
      while (child = children[index]) {
        counter += 1;
        index += 1;
        next = children[index];
        if (!child || !next) {
          continue;
        }
        if (child.composerBuffer.passMerge && next.composerBuffer.passMerge) {
          continue;
        }
        if (this.obeys(child, next)) {
          continue;
        }
        beforeContent = child.contentString;
        afterContent = next.contentString;
        childIndex = this.target.indexOf(child);
        this.target.removeChild(child);
        this.target.removeChild(next);
        newText = this.context.createElement("RichText", {
          contentString: ((typeof child.toContentString === "function" ? child.toContentString() : void 0) || beforeContent) + (next.toContentString() || afterContent)
        });
        this.target.insert(childIndex, newText);
        ref = child.anchors;
        for (i = 0, len = ref.length; i < len; i++) {
          anchor = ref[i];
          anchor.cursor.pointAt(newText, {
            anchor: {
              index: anchor.index
            }
          });
        }
        ref1 = next.anchors;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          anchor = ref1[j];
          anchor.cursor.pointAt(newText, {
            anchor: {
              index: beforeContent.length + anchor.index
            }
          });
        }
        children[index] = newText;
        changed = true;
      }
      if (changed) {
        return true;
      }
      return false;
    };

    return MergeByComposePolicy;

  })(COMComposer);

  COMContents.ContentsAvoidEmpty = ContentsAvoidEmpty;

  COMContents.NormalizeRichTexts = NormalizeRichTexts;

  COMContents.MergeByComposePolicy = MergeByComposePolicy;

  module.exports = COMContents;

}).call(this);

}
GlobalContext.setModule("vincent/com/contents.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/context.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
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
      if (target.root && target.root.withContext && target.compose()) {
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

}
GlobalContext.setModule("vincent/com/context.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/cursor.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMCursor, COMCursorState, COMPath, COMTravelPolicy, CaretUISuggesterTrait, ConductableTrait, CursorActions, CursorCommands, Errors, EventEmitter, IdenticalCursorTrasportable, InputSuggesterTrait, PointableTrait, Teleportable, Trait, TrapableTrait, WalkableTrait, Walker, WalkerRootFirst,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Walker = require("./helper/walker");

  WalkerRootFirst = Walker.WalkerRootFirst;

  COMPath = require("./path");

  Errors = require("./errors");

  EventEmitter = (require("./events")).EventEmitter;

  COMTravelPolicy = require("./travelPolicy");

  Trait = require("./helper/trait");

  COMCursor = (function(superClass) {
    extend(COMCursor, superClass);

    COMCursor.index = 1000;

    function COMCursor(context, option1) {
      this.context = context;
      this.option = option1 != null ? option1 : {};
      COMCursor.__super__.constructor.call(this);
      new WalkableTrait(this);
      new ConductableTrait(this);
      new CaretUISuggesterTrait(this);
      new InputSuggesterTrait(this);
      new TrapableTrait(this);
      new PointableTrait(this);
      new Teleportable(this);
      new IdenticalCursorTrasportable(this);
      this.id = (COMCursor.index++).toString();
      this.name = this.option.name || null;
      this.isShadow = this.option.isShadow || false;
      return;
    }

    COMCursor.prototype.destroy = function() {
      var ref;
      this.isDestroyed = true;
      if ((ref = this.anchor) != null) {
        if (typeof ref.deactivate === "function") {
          ref.deactivate();
        }
      }
      this.target = null;
      this.emit("destroyed");
      return true;
    };

    COMCursor.prototype.getPath = function() {
      var path;
      if (!this.anchor) {
        return null;
      }
      path = this.anchor.node.getPath();
      path.anchor = this.anchor.toJSON();
      return path;
    };

    COMCursor.prototype.getCurrentPath = function() {
      var path;
      if (!this.target) {
        return null;
      }
      path = new COMPath(this.target);
      return path;
    };

    COMCursor.prototype.toJSON = function() {
      var json;
      if (!this.target) {
        return null;
      }
      json = {
        path: this.getCurrentPath().toJSON() || null,
        anchor: this.anchor.toJSON()
      };
      return json;
    };

    COMCursor.prototype.setByJSON = function(json) {
      if (json == null) {
        json = {};
      }
      return this.setByPath(new COMPath(json.path) || [], json.anchor || null);
    };

    COMCursor.prototype.setByPath = function(path, anchor) {
      var child;
      if (!path) {
        return false;
      }
      child = this.context.root.getChildByPath(path);
      return this.pointAt(child, {
        anchor: anchor
      });
    };

    COMCursor.prototype.setCursorByDOMRegion = function(region) {
      var com, lastPointable, node, offset, target;
      node = region.node;
      offset = region.index;
      if (node instanceof Text) {
        target = node.parentElement;
      } else {
        target = node;
      }
      while (target && target !== this.context.root.el) {
        if (!target.com) {
          target = target.parentElement;
          continue;
        }
        com = target.com;
        break;
      }
      if (!com) {
        return false;
      }
      lastPointable = null;
      while (com.parent) {
        if (com.anchor) {
          lastPointable = com;
          break;
        }
        com = com.parent;
      }
      if (!lastPointable) {
        return false;
      }
      this.setByPath(lastPointable.getPath());
      this.anchor.setByDOM(node, offset);
      return true;
    };

    COMCursor.prototype.clone = function() {
      var cursor;
      cursor = this.context.createCursor();
      cursor.pointAtAnchor(this.anchor);
      return cursor;
    };

    COMCursor.prototype.getData = function() {
      return {
        context: this.context,
        anchor: this.anchor.clone()
      };
    };

    COMCursor.prototype.fromData = function(data) {
      this.pointAtAnchor(data.anchor);
      return this;
    };

    COMCursor.prototype.equal = function(cursor) {
      var ref;
      return cursor.context === this.context && ((ref = cursor.anchor) != null ? ref.equal(this.anchor) : void 0);
    };

    return COMCursor;

  })(EventEmitter);

  TrapableTrait = (function(superClass) {
    extend(TrapableTrait, superClass);

    function TrapableTrait() {
      return TrapableTrait.__super__.constructor.apply(this, arguments);
    }

    TrapableTrait.prototype.getTrapTop = function(target) {
      var node;
      node = target || this.target;
      while (node && !node.trapPolicy) {
        node = node.parent;
      }
      if (node && node.trapPolicy) {
        return node;
      }
      return null;
    };

    TrapableTrait.prototype.trapIn = function(node, option) {
      var action, current, method;
      if (!node.trapPolicy || node.trapPolicy.trap === "ignore") {
        return false;
      }
      current = this.getTrapTop();
      if (current && !current.contains(node)) {
        Logger.error("invalid trap inhirency");
        return false;
      }
      this.walkerRootFirst.setTop(node);
      if (node.anchor) {
        if (option.direction === "left") {
          action = "head";
        } else {
          action = "tail";
        }
        this.pointAt(node, {
          actions: [action]
        });
        return true;
      }
      this.walkerRootFirst.setNode(node);
      if (option.direction === "left") {
        method = "next";
        action = "head";
      } else {
        method = "previous";
        action = "tail";
      }
      if (this.walkerRootFirst[method](function(item) {
        return item.anchor;
      })) {
        this.pointAt(this.walkerRootFirst.node, {
          actions: [action]
        });
        return true;
      }
      this.pointAt(node.parent, {
        trapTarget: node,
        trapOutDirection: option.direction
      });
      return false;
    };

    return TrapableTrait;

  })(Trait);

  Teleportable = (function(superClass) {
    extend(Teleportable, superClass);

    function Teleportable() {
      return Teleportable.__super__.constructor.apply(this, arguments);
    }

    Teleportable.prototype.teleportStartAnchor = null;

    Teleportable.prototype.startTeleport = function() {
      if (!this.anchor) {
        return;
      }
      this.isTeleporting = true;
      return this.teleportStartAnchor = this.anchor.clone();
    };

    Teleportable.prototype.endTeleport = function() {
      if (!this.teleportStartAnchor) {
        return;
      }
      this.isTeleporting = false;
      if (!this.teleportStartAnchor.equal(this.anchor)) {
        this.emit("move");
      }
      return this.teleportStartAnchor = null;
    };

    return Teleportable;

  })(Trait);

  PointableTrait = (function(superClass) {
    extend(PointableTrait, superClass);

    function PointableTrait() {
      return PointableTrait.__super__.constructor.apply(this, arguments);
    }

    PointableTrait.prototype.rev = 0;

    PointableTrait.prototype.initialize = function() {
      return this.__defineGetter__("version", (function(_this) {
        return function() {
          var ref;
          return _this.rev + ":" + (((ref = _this.anchor) != null ? ref.rev : void 0) || "");
        };
      })(this));
    };

    PointableTrait.prototype.pointAtRune = function(rune) {
      var anchor, parent, ref;
      if (!rune) {
        return false;
      }
      parent = rune.parent;
      anchor = (ref = parent.anchor) != null ? ref.clone() : void 0;
      if (!anchor) {
        return false;
      }
      anchor.pointAt(rune);
      return this.pointAtAnchor(anchor);
    };

    PointableTrait.prototype.pointAtAnchor = function(anchor) {
      return this.pointAt(anchor.node, {
        anchor: anchor.toJSON()
      });
    };

    PointableTrait.prototype.pointAt = function(node, option) {
      var action, actionResult, i, len, ref, ref1, ref2, ref3, result, walker;
      if (option == null) {
        option = {};
      }
      if (node.context !== this.context) {
        throw new Error("can't point at node not belongs to cursor.context");
      }
      if (this.isDestroyed) {
        throw new Error("the cursor is already destroyed");
      }
      if (!node.anchor) {
        if (option.trapTarget) {
          Logger.error("trap out to a non pointable node", node);
          return false;
        }
        walker = new WalkerRootFirst(this.context);
        walker.setTop(node);
        walker.setNode(node);
        result = walker.next(function(item) {
          return item.anchor;
        });
        if (!result) {
          Logger.error("can't point to target", node, "without anchor");
          return false;
        }
        node = walker.node;
        if (option.anchor) {
          Logger.error("indirect point at, ignore anchor option");
          option.anchor = null;
        }
      }
      this.walkerRootFirst.setTop(this.getTrapTop(node));
      if ((ref = this.anchor) != null) {
        ref.deactivate({
          replacementCursor: this,
          replacementAnchor: node.anchor
        });
      }
      if (this.anchor) {
        this.anchor.stopListenBy(this);
      }
      this.target = node;
      this.anchor = this.target.anchor.clone();
      if (option.index) {
        this.anchor.index = option.index;
      }
      if ((ref1 = this.anchor) != null) {
        ref1.listenBy(this, "move", (function(_this) {
          return function() {
            if (_this.isTeleporting) {
              return;
            }
            return _this.emit("move");
          };
        })(this));
      }
      if ((ref2 = this.anchor) != null) {
        ref2.activate(this);
      }
      if (option.anchor) {
        this.anchor.fromJSON(option.anchor);
      }
      if (option.trapTarget) {
        this.anchor.trapRecover(option.trapTarget, option.trapOutDirection);
      }
      if (option.actions) {
        ref3 = option.actions;
        for (i = 0, len = ref3.length; i < len; i++) {
          action = ref3[i];
          if (typeof action === "string") {
            actionResult = this.conduct(action);
          } else {
            actionResult = this.conduct(action.name, action.value);
          }
        }
      }
      if (!this.isTeleporting) {
        this.emit("move");
      }
      this.rev += 1;
      if (typeof actionResult === "boolean") {
        return actionResult;
      }
      return true;
    };

    return PointableTrait;

  })(Trait);

  WalkableTrait = (function(superClass) {
    extend(WalkableTrait, superClass);

    function WalkableTrait() {
      return WalkableTrait.__super__.constructor.apply(this, arguments);
    }

    WalkableTrait.prototype.initialize = function() {
      this.walkerRootFirst = new WalkerRootFirst(this.context);
      return this.walker = new Walker(this.context);
    };

    WalkableTrait.prototype.begin = function() {
      var has;
      this.walkerRootFirst.setNode(this.context.root);
      has = this.walkerRootFirst.next(function(node) {
        return node.anchor;
      });
      if (!has) {
        return false;
      }
      return this.pointAt(this.walkerRootFirst.node, {
        actions: ["head"]
      });
    };

    WalkableTrait.prototype.end = function() {
      var has;
      this.walkerRootFirst.setNode(this.context.root);
      has = this.walkerRootFirst.previous(function(node) {
        return node.anchor;
      });
      if (!has) {
        return false;
      }
      return this.pointAt(this.walkerRootFirst.node, {
        actions: ["tail"]
      });
    };

    WalkableTrait.prototype.next = function(option) {
      var top;
      this.walkerRootFirst.setNode(this.target);
      this.walkerRootFirst.skipChildOnce = true;
      if (this.walkerRootFirst.next(function(node) {
        return node.anchor;
      })) {
        this.walkerRootFirst.skipChildOnce = false;
        return this.pointAt(this.walkerRootFirst.node, option);
      }
      top = this.getTrapTop(this.target);
      if (top) {
        this.walkerRootFirst.setTop(this.getTrapTop(top.parent) || null);
        if (option == null) {
          option = {};
        }
        option.actions = [];
        option.trapOutDirection = "right";
        option.trapTarget = top;
        return this.pointAt(top.parent, option);
      }
      return false;
    };

    WalkableTrait.prototype.previous = function(option) {
      var top;
      this.walkerRootFirst.setNode(this.target);
      this.walkerRootFirst.skipChildOnce = true;
      if (this.walkerRootFirst.previous(function(node) {
        return node.anchor;
      })) {
        this.walkerRootFirst.skipChildOnce = false;
        return this.pointAt(this.walkerRootFirst.node, option);
      }
      top = this.getTrapTop();
      if (top) {
        this.walkerRootFirst.setTop(this.getTrapTop(top.parent) || null);
        if (option == null) {
          option = {};
        }
        option.actions = [];
        option.trapOutDirection = "left";
        option.trapTarget = top;
        return this.pointAt(top.parent, option);
      }
      return false;
    };

    return WalkableTrait;

  })(Trait);

  CaretUISuggesterTrait = (function(superClass) {
    extend(CaretUISuggesterTrait, superClass);

    function CaretUISuggesterTrait() {
      return CaretUISuggesterTrait.__super__.constructor.apply(this, arguments);
    }

    CaretUISuggesterTrait.prototype.getBoundary = function() {
      var boundary, ref;
      boundary = ((ref = this.anchor) != null ? ref.getCorrespondingBoundary() : void 0) || null;
      return boundary;
    };

    CaretUISuggesterTrait.prototype.getVisualPosition = function() {
      var ref;
      return ((ref = this.anchor) != null ? ref.getVisualPosition() : void 0) || null;
    };

    CaretUISuggesterTrait.prototype.getStyle = function() {
      var ref;
      return ((ref = this.anchor) != null ? ref.getCaretStyle() : void 0) || null;
    };

    return CaretUISuggesterTrait;

  })(Trait);

  InputSuggesterTrait = (function(superClass) {
    extend(InputSuggesterTrait, superClass);

    function InputSuggesterTrait() {
      return InputSuggesterTrait.__super__.constructor.apply(this, arguments);
    }

    InputSuggesterTrait.prototype.getSurroundingText = function(count) {
      var ref;
      return ((ref = this.anchor) != null ? typeof ref.getSurroundingText === "function" ? ref.getSurroundingText(count) : void 0 : void 0) || {
        before: "",
        after: ""
      };
    };

    InputSuggesterTrait.prototype.getSurroundingWord = function(count) {
      var ref;
      return ((ref = this.anchor) != null ? ref.getSurroundingWord(count) : void 0) || {
        before: "",
        after: ""
      };
    };

    InputSuggesterTrait.prototype.matchingBeforeText = function(string) {
      var ref;
      return (ref = this.anchor) != null ? ref.matchingBeforeText(string) : void 0;
    };

    InputSuggesterTrait.prototype.IMEReplace = function(before, after) {
      var value;
      if (this.context.isReadonly) {
        this.context.emit("editAttemp");
        return false;
      }
      value = false;
      this.context.transact((function(_this) {
        return function() {
          var ref;
          return value = (ref = _this.anchor) != null ? ref.IMEReplace(before, after) : void 0;
        };
      })(this));
      return value;
    };

    return InputSuggesterTrait;

  })(Trait);

  ConductableTrait = (function(superClass) {
    extend(ConductableTrait, superClass);

    function ConductableTrait() {
      return ConductableTrait.__super__.constructor.apply(this, arguments);
    }

    ConductableTrait.prototype.initialize = function() {
      this.state = new COMCursorState(this);
      this.actions = new CursorActions(this);
      return this.commands = new CursorCommands(this);
    };

    ConductableTrait.prototype.conduct = function() {
      var args, ref, ref1, result;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      result = (ref = this.actions).conduct.apply(ref, args);
      if (result) {
        return true;
      }
      return (ref1 = this.commands).exec.apply(ref1, args);
    };

    return ConductableTrait;

  })(Trait);

  CursorActions = (function() {
    function CursorActions(cursor1) {
      this.cursor = cursor1;
      this.defaultPolicy = new COMTravelPolicy();
    }

    CursorActions.prototype.conduct = function(name, value) {
      var anchor, isEditAction, policy, result, target;
      if (name.toLowerCase().indexOf("delete") >= 0) {
        isEditAction = true;
      }
      if (isEditAction) {
        this.cursor.captureIdenticalCursors();
      }
      target = this.cursor.target;
      anchor = this.cursor.anchor;
      if (!name) {
        return false;
      }
      if (!target) {
        return false;
      }
      if (typeof this[name] !== "function") {
        return false;
      }
      if (!anchor) {
        return false;
      }
      policy = target.travelPolicy || this.defaultPolicy;
      if ((!anchor[name] && !this[name]) || policy[name] === "ignore") {
        return false;
      }
      result = this[name](target, anchor, policy, value);
      if (isEditAction) {
        this.cursor.transportIdenticalCursors();
      }
      return result;
    };

    CursorActions.prototype.previous = function() {
      var args, ref;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref = this.cursor).previous.apply(ref, args);
    };

    CursorActions.prototype.next = function() {
      var args, ref;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref = this.cursor).next.apply(ref, args);
    };

    CursorActions.prototype.nextRune = function(target, anchor, policy, option) {
      var result;
      if (option == null) {
        option = {};
      }
      result = anchor.nextRune(option);
      if (result) {
        return true;
      }
      this.cursor.state.save();
      if (this.next({
        actions: [
          "head", {
            name: "nextRune",
            value: {
              fresh: true
            }
          }
        ]
      })) {
        this.cursor.state.discard();
        return true;
      } else {
        this.cursor.state.restore();
        return false;
      }
    };

    CursorActions.prototype.previousRune = function(target, anchor, policy, option) {
      var result;
      result = anchor.previousRune(option);
      if (result) {
        return true;
      }
      this.cursor.state.save();
      if (this.previous({
        actions: [
          "tail", {
            name: "previousRune",
            value: {
              fresh: true
            }
          }
        ]
      })) {
        this.cursor.state.discard();
        return true;
      } else {
        this.cursor.state.restore();
        return false;
      }
    };

    CursorActions.prototype.forwardChar = function(target, anchor, policy) {
      var result;
      result = anchor.forwardChar();
      if (result) {
        if (anchor.isTail() && policy.tailBoundary === "pass") {
          this.next({
            actions: ["head"]
          });
        }
        return true;
      }
      if (anchor.isTail() && policy.tailBoundary === "pass") {
        return this.next({
          actions: ["head"]
        });
      }
      if (policy.forwardBypassed === "handover") {
        return this.next({
          actions: ["head", "forwardChar"]
        });
      } else if (policy.forwardBypassed === "bypass") {
        return this.next({
          actions: ["head"]
        });
      } else {
        return false;
      }
    };

    CursorActions.prototype.applyTailBoundary = function(target, anchor, policy) {
      if (anchor.isTail() && policy.tailBoundary === "pass") {
        this.next({
          actions: ["head", "applyTailBoundary"]
        });
        return true;
      }
      return false;
    };

    CursorActions.prototype.backwardChar = function(target, anchor, policy) {
      var result;
      result = anchor.backwardChar();
      if (result) {
        return true;
      }
      if (policy.backwardBypassed === "handover") {
        return this.previous({
          actions: ["tail", "backwardChar"]
        });
      } else if (policy.backwardBypassed === "bypass") {
        return this.previous({
          actions: ["tail"]
        });
      } else {
        return false;
      }
    };

    CursorActions.prototype.upwardChar = function(target, anchor, policy) {
      return anchor.upwardChar();
    };

    CursorActions.prototype.downwardChar = function(target, anchor, policy) {
      return anchor.downwardChar();
    };

    CursorActions.prototype.forwardWord = function(target, anchor, policy) {
      var result;
      result = anchor.forwardWord();
      if (result) {
        if (anchor.isTail() && policy.tailBoundary === "pass") {
          this.next({
            actions: ["head"]
          });
        }
        return true;
      }
      if (policy.forwardBypassed === "handover") {
        return this.next({
          actions: ["head", "forwardWord"]
        });
      } else if (policy.forwardBypassed === "bypass") {
        return this.next({
          actions: ["head"]
        });
      }
    };

    CursorActions.prototype.backwardWord = function(target, anchor, policy) {
      var result;
      result = anchor.backwardWord();
      if (result) {
        return true;
      }
      if (policy.backwardBypassed === "handover") {
        return this.previous({
          actions: ["tail", "backwardWord"]
        });
      } else if (policy.backwardBypassed === "bypass") {
        return this.previous({
          actions: ["tail"]
        });
      }
    };

    CursorActions.prototype.deleteWord = function(target, anchor, policy) {
      var result;
      result = anchor.backwardWord();
      if (result) {
        return true;
      }
      if (policy.backwardBypassed === "handover") {
        return this.previous({
          actions: ["tail", "backwardWord"]
        });
      } else if (policy.backwardBypassed === "bypass") {
        return this.previous({
          actions: ["tail"]
        });
      }
    };

    CursorActions.prototype.head = function(target, anchor, policy) {
      return anchor.head();
    };

    CursorActions.prototype.tail = function(target, anchor, policy) {
      return anchor.tail();
    };

    CursorActions.prototype.deleteLineBeforeCursor = function(target, anchor, policy, option) {
      var result;
      result = typeof anchor.deleteLineBeforeAnchor === "function" ? anchor.deleteLineBeforeAnchor() : void 0;
      if (result) {
        return true;
      }
      if (policy.deleteBypassed === "handover") {
        return this.previous({
          actions: ["tail", "deleteLineBeforeCursor"]
        });
      } else if (policy.deleteBypassed === "bypass") {
        return this.previous({
          actions: ["tail", "deleteLineBeforeCursor"]
        });
      } else if (policy.deleteBypassed === "merge") {
        if (!this.previous({
          actions: ["tail"]
        })) {
          return false;
        }
        if (this.cursor.target.mergeContentString && target.toContentString) {
          this.cursor.target.mergeContentString(target.toContentString(), target);
          target.remove();
        }
        return false;
      }
      return false;
    };

    CursorActions.prototype.deleteChar = function(target, anchor, policy) {
      var result;
      result = anchor.deleteChar();
      if (result) {
        return true;
      }
      if (policy.deleteBypassed === "handover") {
        return this.previous({
          actions: ["tail", "deleteChar"]
        });
      } else if (policy.deleteBypassed === "bypass") {
        return this.previous({
          actions: ["tail", "deleteChar"]
        });
      } else if (policy.deleteBypassed === "merge") {
        if (!this.previous({
          actions: ["tail"]
        })) {
          return false;
        }
        if (this.cursor.target.mergeContentString && target.toContentString) {
          this.cursor.target.mergeContentString(target.toContentString(), target);
          target.remove();
        }
        return false;
      }
      return false;
    };

    CursorActions.prototype.startOfLine = function(target, anchor, policy) {
      var result;
      result = typeof anchor.startOfLine === "function" ? anchor.startOfLine() : void 0;
      if (result) {
        return true;
      }
      if (policy.startOfLine === "boundary") {
        anchor.index = 0;
        return true;
      }
      if (policy.startOfLine === "handover") {
        if (this.previous({
          actions: ["tail", "startOfLine"]
        })) {
          return true;
        } else {
          return this.cursor.begin();
        }
      }
      return false;
    };

    CursorActions.prototype.endOfLine = function(target, anchor, policy) {
      var result;
      result = typeof anchor.endOfLine === "function" ? anchor.endOfLine() : void 0;
      if (result) {
        return true;
      }
      if (policy.endOfLine === "boundary") {
        anchor.index = target.length;
        return true;
      }
      if (policy.endOfLine === "handover") {
        if (this.next({
          actions: ["endOfLine"]
        })) {
          return true;
        } else {
          return this.cursor.end();
        }
      }
      return false;
    };

    CursorActions.prototype.deleteWord = function(target, anchor, policy) {
      var result;
      result = anchor.deleteWord();
      if (result) {
        return true;
      }
      if (policy.deleteBypassed === "handover") {
        return this.previous({
          actions: ["tail", "deleteWord"]
        });
      } else if (policy.deleteBypassed === "bypass") {
        return this.previous({
          actions: ["tail", "deleteWord"]
        });
      } else if (policy.deleteBypassed === "merge") {
        if (!this.previous({
          actions: ["tail"]
        })) {
          return false;
        }
        if (this.cursor.target.mergeContentString && target.toContentString) {
          this.cursor.target.mergeContentString(target.toContentString(), target);
          target.remove();
        }
        return false;
      }
      return false;
    };

    CursorActions.prototype.trigger = function() {
      var anchor, args, policy, result, target;
      target = arguments[0], anchor = arguments[1], policy = arguments[2], args = 4 <= arguments.length ? slice.call(arguments, 3) : [];
      result = anchor.trigger.apply(anchor, args);
      if (result) {
        this.cursor.emit("trigger");
      }
      return result;
    };

    CursorActions.prototype.write = function(target, anchor, policy, value) {
      return anchor.write(value);
    };

    return CursorActions;

  })();

  CursorCommands = (function() {
    function CursorCommands(cursor1) {
      this.cursor = cursor1;
    }

    CursorCommands.prototype.exec = function() {
      var name, node, params;
      name = arguments[0], params = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (!this.cursor.target) {
        return false;
      }
      node = this.cursor.target;
      while (node) {
        if (typeof node.exec === "function" ? node.exec.apply(node, [name].concat(slice.call(params))) : void 0) {
          return true;
        }
        node = node.parent;
      }
      return false;
    };

    return CursorCommands;

  })();

  COMCursorState = (function() {
    function COMCursorState(cursor1) {
      this.cursor = cursor1;
      this.states = [];
    }

    COMCursorState.prototype.save = function() {
      return this.states.push(this.cursor.clone());
    };

    COMCursorState.prototype.discard = function() {
      var cursor;
      cursor = this.states.pop();
      return cursor.destroy();
    };

    COMCursorState.prototype.restore = function() {
      var cursor;
      cursor = this.states.pop();
      if (cursor && cursor.anchor) {
        this.cursor.pointAtAnchor(cursor.anchor);
      }
      return cursor.destroy();
    };

    return COMCursorState;

  })();

  IdenticalCursorTrasportable = (function(superClass) {
    extend(IdenticalCursorTrasportable, superClass);

    function IdenticalCursorTrasportable() {
      return IdenticalCursorTrasportable.__super__.constructor.apply(this, arguments);
    }

    IdenticalCursorTrasportable.prototype.friendCursors = null;

    IdenticalCursorTrasportable.prototype.initialize = function() {
      return this.friendCursors = [];
    };

    IdenticalCursorTrasportable.prototype.captureIdenticalCursors = function() {
      var cursor, id, ref;
      this.friendCursors.length = 0;
      ref = this.context.cursors;
      for (id in ref) {
        cursor = ref[id];
        if (cursor !== this && cursor.equal(this)) {
          this.friendCursors.push(cursor);
        }
      }
      return true;
    };

    IdenticalCursorTrasportable.prototype.transportIdenticalCursors = function() {
      var cursor, i, len, ref;
      ref = this.friendCursors;
      for (i = 0, len = ref.length; i < len; i++) {
        cursor = ref[i];
        cursor.pointAtAnchor(this.anchor);
      }
      return this.friendCursors.length = 0;
    };

    return IdenticalCursorTrasportable;

  })(Trait);

  module.exports = COMCursor;

}).call(this);

}
GlobalContext.setModule("vincent/com/cursor.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/decoration.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Decoration, DecorationMaintainer, MID, Operation, RegExpDecorationMaintainer, exports,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Operation = require("./operation");

  DecorationMaintainer = (function() {
    function DecorationMaintainer() {}

    DecorationMaintainer.prototype.compute = function() {
      return [];
    };

    DecorationMaintainer.prototype.apply = function() {};

    return DecorationMaintainer;

  })();

  RegExpDecorationMaintainer = (function(superClass) {
    extend(RegExpDecorationMaintainer, superClass);

    function RegExpDecorationMaintainer() {
      RegExpDecorationMaintainer.__super__.constructor.call(this);
      if (this.reg == null) {
        this.reg = null;
      }
      if (this.classes == null) {
        this.classes = [];
      }
      if (this.option == null) {
        this.option = {};
      }
      this.parts = this.option.parts || [];
    }

    RegExpDecorationMaintainer.prototype.getMatchRegion = function(contentString) {
      var backwardFix, forwardFix, match, ref, ref1, results;
      if (!this.reg) {
        return;
      }
      this.reg.lastIndex = 0;
      results = [];
      backwardFix = ((ref = this.option.backwardAssert) != null ? ref.length : void 0) || 0;
      forwardFix = ((ref1 = this.option.forwardAssert) != null ? ref1.length : void 0) || 0;
      while (match = this.reg.exec(contentString)) {
        if (match[0].length === 0) {
          break;
        }
        results.push([match.index + backwardFix, match.index + match[0].length - forwardFix, match[0], match]);
      }
      return results;
    };

    RegExpDecorationMaintainer.prototype.compute = function(contentString) {
      var content, coreResults, i, item, len, results;
      results = [];
      coreResults = (typeof this.getMatchRegion === "function" ? this.getMatchRegion(contentString) : void 0) || [];
      for (i = 0, len = coreResults.length; i < len; i++) {
        item = coreResults[i];
        if (this.parts.length > 0) {
          content = contentString.slice(item[0], item[1]);
          results.push.apply(results, this.computePart(content, item[0]));
        }
        results.push(item);
      }
      return results.map((function(_this) {
        return function(info) {
          return (function(func, args, ctor) {
            ctor.prototype = func.prototype;
            var child = new ctor, result = func.apply(child, args);
            return Object(result) === result ? result : child;
          })(Decoration, [_this].concat(slice.call(info)), function(){});
        };
      })(this));
    };

    RegExpDecorationMaintainer.prototype.apply = function(dec, el) {
      var ref, ref1, ref2, ref3;
      (ref = el.classList).add.apply(ref, this.classes);
      if ((ref1 = dec.detail) != null ? ref1.classes : void 0) {
        return (ref3 = el.classList).add.apply(ref3, (ref2 = dec.detail) != null ? ref2.classes : void 0);
      }
    };

    RegExpDecorationMaintainer.prototype.cancel = function(dec, el) {
      var i, j, len, len1, name, ref, ref1, ref2, ref3, results1;
      ref = this.classes;
      for (i = 0, len = ref.length; i < len; i++) {
        name = ref[i];
        el.classList.remove(name);
      }
      if ((ref1 = dec.detail) != null ? ref1.classes : void 0) {
        ref3 = (ref2 = dec.detail) != null ? ref2.classes : void 0;
        results1 = [];
        for (j = 0, len1 = ref3.length; j < len1; j++) {
          name = ref3[j];
          results1.push(el.classList.remove(name));
        }
        return results1;
      }
    };

    RegExpDecorationMaintainer.prototype.computePart = function(content, offset) {
      var i, len, match, part, ref, results;
      results = [];
      ref = this.parts;
      for (i = 0, len = ref.length; i < len; i++) {
        part = ref[i];
        part.reg.lastIndex = 0;
        while (match = part.reg.exec(content)) {
          if (match[0].length === 0) {
            break;
          }
          results.push([match.index + offset, match.index + offset + match[0].length, part]);
        }
      }
      return results;
    };

    return RegExpDecorationMaintainer;

  })(DecorationMaintainer);

  Decoration = (function() {
    function Decoration(maintainer, start1, end1, detail) {
      var ref;
      this.maintainer = maintainer;
      this.start = start1 != null ? start1 : 0;
      this.end = end1 != null ? end1 : 0;
      this.detail = detail;
      this.length = this.end - this.start;
      this.mid = (ref = this.maintainer) != null ? ref.id : void 0;
    }

    Decoration.prototype.apply = function(el) {
      return this.maintainer.apply(this, el);
    };

    Decoration.prototype.cancel = function(el) {
      return this.maintainer.cancel(this, el);
    };

    Decoration.prototype.clone = function() {
      return new Decoration(this.maintainer, this.start, this.end, this.detail);
    };

    Decoration.prototype.split = function(index) {
      var next;
      next = this.clone();
      next.start = index;
      this.end = index;
      this.length = this.end - this.start;
      return next;
    };

    Decoration.prototype.shift = function(unit) {
      this.start += unit;
      this.end += unit;
      return this;
    };

    Decoration.prototype.equal = function(target) {
      return target.mid === this.mid && target.start === this.start && target.end === this.end;
    };

    return Decoration;

  })();

  Decoration.PairDecorationMaintainer = (function(superClass) {
    extend(PairDecorationMaintainer, superClass);

    function PairDecorationMaintainer() {
      PairDecorationMaintainer.__super__.constructor.call(this);
      this.rules = [];
    }

    PairDecorationMaintainer.prototype.compute = function(cs) {
      var breakChar, char, close, i, index, item, j, len, ref, ref1, ref2, rule, start;
      this.results = [];
      this.stack = [];
      this.offset = 0;
      this.enterCount = 0;
      breakChar = "\uE1F8";
      while (this.offset < cs.length) {
        close = false;
        start = false;
        char = cs[this.offset];
        if (char === breakChar) {
          this.offset += 1;
          this.stack.length = 0;
          continue;
        }
        if (char === "\n") {
          this.enterCount += 1;
          this.offset += 1;
          if (this.enterCount >= 1) {
            this.enterCount = 0;
            this.stack.length = 0;
          }
          continue;
        } else {
          this.enterCount = 0;
        }
        ref = this.stack;
        for (index = i = ref.length - 1; i >= 0; index = i += -1) {
          item = ref[index];
          if (this.strcmp(cs, this.offset, item.right)) {
            this.stack.length = index;
            this.offset += item.right.length;
            item.end = this.offset;
            if (item.end - item.start === item.left.length + item.right.length) {
              continue;
              item.empty = true;
            }
            (ref1 = this.results).push.apply(ref1, this.createMatchingDecoration(cs, item));
            close = true;
            break;
          }
        }
        if (close) {
          continue;
        }
        ref2 = this.rules;
        for (j = 0, len = ref2.length; j < len; j++) {
          rule = ref2[j];
          if (this.strcmp(cs, this.offset, rule.left)) {
            this.stack.push({
              start: this.offset,
              rule: rule,
              right: rule.right,
              left: rule.left
            });
            this.offset += rule.left.length;
            start = true;
            break;
          }
        }
        if (start) {
          continue;
        }
        this.offset += 1;
      }
      return this.results;
    };

    PairDecorationMaintainer.prototype.strcmp = function(string, offset, match) {
      var char, i, index, len;
      if (match.length === 0) {
        return false;
      }
      for (index = i = 0, len = match.length; i < len; index = ++i) {
        char = match[index];
        if (string[offset + index] !== char) {
          return false;
        }
      }
      return true;
    };

    PairDecorationMaintainer.prototype.createMatchingDecoration = function(cs, result) {
      var l1, l2, rule;
      l1 = result.left.length;
      l2 = result.right.length;
      rule = result.rule;
      return [
        new Decoration.PairDecoration(this, result.start, result.start + l1, {
          rule: rule,
          isStart: true,
          empty: result.empty
        }), new Decoration.PairDecoration(this, result.start + l1, result.end - l2, {
          rule: rule,
          empty: result.empty
        }), new Decoration.PairDecoration(this, result.end - l2, result.end, {
          rule: rule,
          isEnd: true,
          empty: result.empty
        })
      ];
    };

    PairDecorationMaintainer.prototype.register = function(left, right, info) {
      var index, rid;
      if (info == null) {
        info = {};
      }
      rid = Decoration.allocateId();
      index = this.rules.length;
      return this.rules.push({
        left: left,
        right: right,
        rid: rid,
        index: index,
        info: info
      });
    };

    return PairDecorationMaintainer;

  })(DecorationMaintainer);

  Decoration.PairDecoration = (function(superClass) {
    extend(PairDecoration, superClass);

    function PairDecoration() {
      return PairDecoration.__super__.constructor.apply(this, arguments);
    }

    PairDecoration.prototype.clone = function() {
      return new Decoration.PairDecoration(this.maintainer, this.start, this.end, this.detail);
    };

    PairDecoration.prototype.apply = function(el) {
      var className, end, i, len, ref, start;
      ref = this.detail.rule.info.classNames || [];
      for (i = 0, len = ref.length; i < len; i++) {
        className = ref[i];
        el.classList.add(className);
      }
      if (this.detail.empty) {
        el.classList.add("com-dec-empty");
      }
      if (this.detail.isStart) {
        if (start = this.detail.rule.startDecorator) {
          return el.classList.add(start);
        } else {
          return el.classList.add("com-dec-pair-start");
        }
      } else if (this.detail.isEnd) {
        if (end = this.detail.rule.endDecorator) {
          return el.classList.add(end);
        } else {
          return el.classList.add("com-dec-pair-end");
        }
      }
    };

    PairDecoration.prototype.cancel = function(el) {
      var className, i, len, ref, results1;
      if (this.detail.empty) {
        el.classList.remove("com-dec-empty");
      }
      ref = this.detail.rule.info.classNames || [];
      results1 = [];
      for (i = 0, len = ref.length; i < len; i++) {
        className = ref[i];
        results1.push(el.classList.remove(className));
      }
      return results1;
    };

    PairDecoration.prototype.equal = function(target) {
      var ref, ref1;
      return this.detail.rule.rid === (target != null ? (ref = target.detail) != null ? (ref1 = ref.rule) != null ? ref1.rid : void 0 : void 0 : void 0) && target.start === this.start && target.end === this.end;
    };

    return PairDecoration;

  })(Decoration);

  Decoration.ChangeDecorationOperation = (function(superClass) {
    extend(ChangeDecorationOperation, superClass);

    function ChangeDecorationOperation() {
      return ChangeDecorationOperation.__super__.constructor.apply(this, arguments);
    }

    ChangeDecorationOperation.prototype.name = "ChangeDecorationOperation";

    ChangeDecorationOperation.prototype.invoke = function() {
      var ref, ref1, ref2, text;
      text = this.target;
      this.option.oldDecorations = ((ref = text.decorations) != null ? typeof ref.slice === "function" ? ref.slice() : void 0 : void 0) || [];
      text.decorations = ((ref1 = this.option.decorations) != null ? typeof ref1.slice === "function" ? ref1.slice() : void 0 : void 0) || [];
      text.dirty = true;
      if ((ref2 = text.parent) != null) {
        ref2.dirty = true;
      }
      return true;
    };

    ChangeDecorationOperation.prototype.revoke = function() {
      var ref, ref1, text;
      text = this.target;
      text.decorations = ((ref = this.option.oldDecorations) != null ? typeof ref.slice === "function" ? ref.slice() : void 0 : void 0) || [];
      text.dirty = true;
      return (ref1 = text.parent) != null ? ref1.dirty = true : void 0;
    };

    ChangeDecorationOperation.prototype.describe = function() {
      return "make a decoration change to " + this.target.type;
    };

    return ChangeDecorationOperation;

  })(Operation.EditOperation);

  exports = Decoration;

  exports.DecorationMaintainer = DecorationMaintainer;

  MID = 0;

  exports.createRegExpMaintainer = function(name, reg, classes, option) {
    var CustomDecoratioMaintainer, Maintainer;
    if (option == null) {
      option = {};
    }
    Maintainer = CustomDecoratioMaintainer = (function(superClass) {
      extend(CustomDecoratioMaintainer, superClass);

      function CustomDecoratioMaintainer() {
        this.option = option || {};
        this.reg = reg;
        this.name = name;
        CustomDecoratioMaintainer.__super__.constructor.call(this);
      }

      return CustomDecoratioMaintainer;

    })(RegExpDecorationMaintainer);
    Maintainer.prototype.id = MID++;
    Maintainer.prototype.name = name;
    Maintainer.prototype.classes = classes;
    return Maintainer;
  };

  exports.allocateId = function() {
    return MID++;
  };

  module.exports = exports;

}).call(this);

}
GlobalContext.setModule("vincent/com/decoration.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/decorationPolicy.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMDecorationPolicy, COMPolicy,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  COMPolicy = require("./policy");

  COMDecorationPolicy = (function(superClass) {
    extend(COMDecorationPolicy, superClass);

    function COMDecorationPolicy(node) {
      this.node = node;
      COMDecorationPolicy.__super__.constructor.call(this, this.node);
    }

    COMDecorationPolicy.prototype.behavior = "default";

    return COMDecorationPolicy;

  })(COMPolicy);

  module.exports = COMDecorationPolicy;

}).call(this);

}
GlobalContext.setModule("vincent/com/decorationPolicy.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/element.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMContainer, COMContext, COMElement, COMRichText,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  COMContext = require("./context");

  COMContainer = require("./container");

  COMRichText = require("./richText");

  COMElement = (function(superClass) {
    extend(COMElement, superClass);

    COMElement.prototype.type = "VoidElement";

    function COMElement(context, data) {
      this.context = context;
      this.data = data;
      COMElement.__super__.constructor.call(this, this.context, this.data);
    }

    return COMElement;

  })(COMContainer);

  module.exports = COMElement;

}).call(this);

}
GlobalContext.setModule("vincent/com/element.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/errors.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  module.exports = require("../common/errors");

}).call(this);

}
GlobalContext.setModule("vincent/com/errors.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/events.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  exports.EventEmitter = Leaf.EventEmitter;

}).call(this);

}
GlobalContext.setModule("vincent/com/events.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/i18n.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  module.exports = {
    UnknownRuneTitle: "No need to worry, your data should be safe. But your software might be outdated or missing some plugin, please contact service provider for help."
  };

}).call(this);

}
GlobalContext.setModule("vincent/com/i18n.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/index.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  module.exports = {
    COMNode: require("./node"),
    COMContainer: require("./container"),
    COMComposer: require("./composer"),
    COMContext: require("./context"),
    COMCursor: require("./cursor"),
    COMDecoration: require("./decoration"),
    COMWalker: require("./helper/walker"),
    COMNamespace: require("./namespace"),
    COMOperation: require("./operation"),
    COMPath: require("./path"),
    COMPolicy: require("./policy"),
    COMRichText: require("./richText"),
    COMAnchor: require("./anchor"),
    COMText: require("./text"),
    COMRoot: require("./root"),
    COMRune: require("./rune"),
    COMSpell: require("./spell"),
    COMSelection: require("./selection"),
    COMTrapPolicy: require("./trapPolicy"),
    COMTravelPolicy: require("./travelPolicy"),
    COMContents: require("./contents"),
    COMNodeList: require("./helper/nodeList"),
    COMIntent: require("./intent"),
    COMVisualPosition: require("./visualPosition")
  };

}).call(this);

}
GlobalContext.setModule("vincent/com/index.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/intent.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMIntent, EventEmitter,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = (require("./events")).EventEmitter;

  COMIntent = (function(superClass) {
    extend(COMIntent, superClass);

    COMIntent.register = function(Intent, name) {
      name = name || Intent.prototype.name || Intent.name;
      return COMIntent.Intents[name] = Intent;
    };

    COMIntent.Intents = {};

    COMIntent.prototype.name = "VoidIntent";

    COMIntent.prototype.isCaptured = false;

    function COMIntent(context, name1, detail) {
      var prop, value;
      this.context = context;
      this.name = name1;
      if (detail == null) {
        detail = {};
      }
      for (prop in detail) {
        value = detail[prop];
        this[prop] = value;
      }
    }

    COMIntent.prototype.capture = function() {
      return this.isCaptured = true;
    };

    return COMIntent;

  })(EventEmitter);

  module.exports = COMIntent;

}).call(this);

}
GlobalContext.setModule("vincent/com/intent.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/namespace.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMComposer, COMNamespace, Errors,
    slice = [].slice;

  Errors = require("./errors");

  COMComposer = require("./composer");

  COMNamespace = (function() {
    function COMNamespace() {
      this.creators = {};
      this.decorations = [];
      this.spells = [];
      return this;
    }

    COMNamespace.prototype.registerDecoration = function() {
      var args, ref;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref = this.decorations).push.apply(ref, args);
    };

    COMNamespace.prototype.registerSpell = function() {
      var args, ref;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref = this.spells).push.apply(ref, args);
    };

    COMNamespace.prototype.registerComposer = function(name, composer) {
      var target;
      if (name instanceof COMComposer) {
        composer = name;
        name = composer.type;
      }
      target = this.creators[name];
      if (!target) {
        Logger.debug(target, name, composer, "///");
        Logger.error("invalid composer target " + name);
        return false;
      }
      if (target.composers == null) {
        target.composers = [];
      }
      return target.composers.push(composer);
    };

    COMNamespace.prototype.initContext = function(context) {
      var base, ctr, name, ref, results;
      ref = this.creators;
      results = [];
      for (name in ref) {
        ctr = ref[name];
        results.push(typeof (base = ctr.creator).initContext === "function" ? base.initContext(context) : void 0);
      }
      return results;
    };

    COMNamespace.prototype.registerNode = function(creator) {
      if (!creator.prototype.type) {
        Logger.error("invalid creator without Ctor::type");
        return false;
      }
      if (this.creators[creator.prototype.type]) {
        Logger.error("fail to register creator " + creator.prototype.type + ",type conflict", creator);
        return false;
      }
      return this.creators[creator.prototype.type] = {
        type: creator.prototype.type,
        creator: creator
      };
    };

    COMNamespace.prototype.sortOf = function(a, type) {
      var creator, ref, ref1;
      creator = (ref = this.creators[type]) != null ? ref.creator : void 0;
      if (typeof a === "string") {
        a = (ref1 = this.creators[a]) != null ? ref1.creator : void 0;
        if (a) {
          return a.prototype instanceof creator || a === creator;
        } else {
          return false;
        }
      }
      return (typeof creator === "function") && a instanceof creator;
    };

    COMNamespace.prototype.create = function() {
      var args, context, result, target, type;
      context = arguments[0], type = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      target = this.creators[type];
      if (!target) {
        Logger.error("Unregistered Node type " + type);
        return null;
      }
      result = (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(target.creator, [context].concat(slice.call(args)), function(){});
      return result;
    };

    COMNamespace.prototype.compose = function(target) {
      var Ctor, composer, composers, i, len, ref, result;
      if (!target.root || target.root !== ((ref = target.context) != null ? ref.root : void 0)) {
        return false;
      }
      Ctor = this.creators[target.type];
      if (!Ctor) {
        throw new Errors.LogicError("compose unregistered element " + target.type);
      }
      composers = Ctor.composers || [];
      if (window.perf == null) {
        window.perf = new Perf();
      }
      for (i = 0, len = composers.length; i < len; i++) {
        composer = composers[i];
        perf.start(composer.constructor.name);
        result = composer.compose(target);
        perf.end(composer.constructor.name);
        if (result) {
          return true;
        }
        if (!target.root) {
          Logger.error("composer should return true if it changes it's target");
          return true;
        }
      }
      return false;
    };

    COMNamespace.prototype.clone = function() {
      var ns, prop;
      ns = new COMNamespace();
      for (prop in this.creators) {
        ns.creators[prop] = this.creators[prop];
      }
      ns.spells = this.spells.slice();
      ns.decorations = this.decorations.slice();
      return ns;
    };

    return COMNamespace;

  })();

  module.exports = COMNamespace;

}).call(this);

}
GlobalContext.setModule("vincent/com/namespace.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/node.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMNode, COMPath, Errors, EventEmitter,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Errors = require("./errors");

  EventEmitter = (require("./events")).EventEmitter;

  COMPath = require("./path");

  COMNode = (function(superClass) {
    extend(COMNode, superClass);

    COMNode.index = 1000;

    COMNode.prototype.type = "Node";

    function COMNode(context) {
      var base, base1;
      this.context = context;
      COMNode.__super__.constructor.call(this);
      this.composerBuffer = {};
      this._id = COMNode.index++;
      this.id = this._id;
      this.type = this.type;
      this.rev = 0;
      this.revisionMarks = {};
      this.parent = null;
      if (this.appearance == null) {
        this.appearance = {};
      }
      if ((base = this.appearance).tagName == null) {
        base.tagName = "div";
      }
      if ((base1 = this.appearance).classList == null) {
        base1.classList = ["com"];
      }
      this.parentAppearance = [];
      this.isCOMObject = true;
      this.pend();
      this.__defineGetter__("dirty", (function(_this) {
        return function() {
          var ref;
          if (!_this.cache) {
            return false;
          }
          return ((ref = _this.cache) != null ? ref.rev : void 0) !== _this.rev || false;
        };
      })(this));
      this.__defineSetter__("dirty", (function(_this) {
        return function(v) {
          var ref;
          if (v) {
            _this.rev += 1;
            if (_this.parent) {
              return _this.parent.dirty = true;
            }
          } else {
            return (ref = _this.cache) != null ? ref.rev = _this.rev : void 0;
          }
        };
      })(this));
      this.__defineGetter__("el", (function(_this) {
        return function() {
          var ref;
          return ((ref = _this.cache) != null ? ref.el : void 0) || null;
        };
      })(this));
      this.__defineSetter__("el", (function(_this) {
        return function(el) {
          if (el != null) {
            el.com = _this;
          }
          return _this.cache.el = el;
        };
      })(this));
      this.__defineGetter__("elAfter", (function(_this) {
        return function() {
          var ref;
          return ((ref = _this.cache) != null ? ref.elAfter : void 0) || null;
        };
      })(this));
      this.__defineSetter__("elAfter", (function(_this) {
        return function(elAfter) {
          if (elAfter != null) {
            elAfter.com = _this;
          }
          return _this.cache.elAfter = elAfter;
        };
      })(this));
      this.__defineGetter__("elBefore", (function(_this) {
        return function() {
          var ref;
          return ((ref = _this.cache) != null ? ref.elBefore : void 0) || null;
        };
      })(this));
      this.__defineSetter__("elBefore", (function(_this) {
        return function(elBefore) {
          if (elBefore != null) {
            elBefore.com = _this;
          }
          return _this.cache.elBefore = elBefore;
        };
      })(this));
      this.__defineGetter__("root", (function(_this) {
        return function() {
          return _this._root || null;
        };
      })(this));
      this.__defineSetter__("root", (function(_this) {
        return function(root) {
          var old;
          old = _this._root;
          _this._root = root;
          if ((!old || !old.withContext) && root && root.withContext) {
            if (typeof _this.onRootAvailable === "function") {
              _this.onRootAvailable();
            }
            return _this.emit("rootAvailable");
          } else if (!root && old && old.withContext) {
            if (typeof _this.onRootDispel === "function") {
              _this.onRootDispel();
            }
            return _this.emit("rootDispel");
          }
        };
      })(this));
      this.commands = {};
      this.anchors = [];
    }

    COMNode.prototype.setRevisionMark = function(mark) {
      return this.revisionMarks[mark] = this.rev;
    };

    COMNode.prototype.beforeMark = function(mark) {
      var ref;
      if (!((ref = this.cache) != null ? ref.rev : void 0)) {
        return true;
      }
      return this.cache.rev < this.revisionMarks[mark];
    };

    COMNode.prototype.setRenderContext = function(rc) {
      this.rc = rc;
      return this.cache = this.rc.cache(this.id);
    };

    COMNode.prototype.sortOf = function(type) {
      return this.context.namespace.sortOf(this, type);
    };

    COMNode.prototype.exec = function() {
      var base, name, params;
      name = arguments[0], params = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      return typeof (base = this.commands)[name] === "function" ? base[name].apply(base, params) : void 0;
    };

    COMNode.prototype.registerCommand = function(name, fn) {
      return this.commands[name] = fn;
    };

    COMNode.prototype.getPath = function() {
      return COMPath.fromNode(this);
    };

    COMNode.prototype.customBaseRender = function() {
      return false;
    };

    COMNode.prototype.afterRender = function() {
      return this.cache.rev = this.rev;
    };

    COMNode.prototype.render = function(rc, option) {
      var _el;
      if (option == null) {
        option = {};
      }
      if (this.el && !option.force) {
        this.el.com = this;
        return;
      }
      _el = this.el;
      if (this.customBaseRender()) {
        this.el.com = this;
        return true;
      } else {
        this.el = document.createElement(this.appearance.tagName || "div");
        this.appearance.classList.filter(function(item) {
          return item;
        }).map((function(_this) {
          return function(name) {
            if (name) {
              return _this.el.classList.add(name);
            }
          };
        })(this));
      }
      if (_el && _el.parentElement) {
        _el.parentElement.replaceChild(this.el, _el);
      }
      return this.el.com = this;
    };

    COMNode.prototype.before = function(node) {
      var index;
      if (!this.parent) {
        return;
      }
      index = this.parent.indexOf(this);
      return this.parent.insert(index, node);
    };

    COMNode.prototype.after = function(node) {
      var index;
      if (!this.parent) {
        return;
      }
      index = this.parent.indexOf(this);
      return this.parent.insert(index + 1, node);
    };

    COMNode.prototype.previous = function(count) {
      var index;
      if (count == null) {
        count = 1;
      }
      if (!this.parent) {
        return null;
      }
      if (count === 0) {
        return this;
      }
      if (!count) {
        return null;
      }
      index = this.parent.indexOf(this);
      index -= count;
      if (index >= 0) {
        return this.parent.child(index);
      }
      return null;
    };

    COMNode.prototype.replaceBy = function(node) {
      var index, parent;
      if (!this.parent) {
        throw new Errors.LogicError("can't replace orphan node");
      }
      parent = this.parent;
      if (node.parent) {
        node.parent.removeChild(node);
      }
      index = parent.indexOf(this);
      parent.insert(index, node);
      return parent.removeChild(this);
    };

    COMNode.prototype.next = function(count) {
      var index;
      if (count == null) {
        count = 1;
      }
      if (!this.parent) {
        return null;
      }
      if (count === 0) {
        return this;
      }
      if (!count) {
        return null;
      }
      index = this.parent.indexOf(this);
      index += count;
      if (index < this.parent.children.length) {
        return this.parent.child(index);
      }
      return null;
    };

    COMNode.prototype.remove = function() {
      if (this.parent) {
        return this.parent.removeChild(this);
      }
    };

    COMNode.prototype.toJSON = function() {
      var result;
      result = {};
      result.type = this.type || "Void";
      return result;
    };

    COMNode.prototype.compose = function() {
      if (this.context.namespace.compose(this)) {
        return true;
      }
      if (typeof this.acknowledge === "function") {
        this.acknowledge();
      }
      return false;
    };

    COMNode.prototype.onRootDispel = function() {
      return this.context.handleNodeDetach(this);
    };

    COMNode.prototype.onRootAvailable = function() {
      this.context.requestCompose(this);
      if (this.root.rc) {
        this.setRenderContext(this.root.rc);
      }
      return this.context.handleNodeAttach(this);
    };

    COMNode.prototype.forceChange = function() {
      return this.context.forceChange();
    };

    COMNode.prototype.pend = function() {
      this.dirty = true;
      if (this.root) {
        this.context.requestCompose(this);
      }
      this.composerBuffer = {};
      return this.emit("pend");
    };

    COMNode.prototype.acknowledge = function() {
      return false;
    };

    COMNode.prototype.slice = function(option) {
      if (option == null) {
        option = {};
      }
      return this.clone();
    };

    COMNode.prototype.clone = function() {
      var result;
      result = this.context.createElement(this.type, this.toJSON());
      result.isPartial = false;
      return result;
    };

    COMNode.prototype.compareNodePosition = function(b) {
      if (!this.parent && !this.isRoot) {
        return null;
      }
      return this.getPath().compare(b.getPath());
    };

    COMNode.prototype.toHumanString = function() {
      return "";
    };

    COMNode.prototype.toPlainString = function() {
      return this.toHumanString();
    };

    COMNode.prototype.transactTrigger = function() {
      var args, result;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (!this.trigger) {
        return false;
      }
      result = false;
      this.context.transact((function(_this) {
        return function() {
          return result = _this.trigger.apply(_this, args);
        };
      })(this));
      return result;
    };

    COMNode.prototype.toMarkdown = function() {
      return this.toHumanString();
    };

    return COMNode;

  })(EventEmitter);

  module.exports = COMNode;

}).call(this);

}
GlobalContext.setModule("vincent/com/node.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/operation.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMNode, ChangePropertyOperation, EditOperation, Errors, OpIndex, TreeOperation,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Errors = require("./errors");

  COMNode = require("./node");

  OpIndex = 0;

  EditOperation = (function() {
    EditOperation.prototype.name = "VoidEditOperation";

    function EditOperation(context, target, option) {
      this.context = context;
      this.target = target;
      this.option = option != null ? option : {};
      this._index = OpIndex++;
      if (this.target instanceof COMNode) {
        this.path = this.target.getPath();
      } else if (this.target.type === "COMPath") {
        this.path = this.target;
        this.target = null;
      }
    }

    EditOperation.prototype.error = function(message, meta) {
      var error;
      error = new Errors.OperationError("Edit->" + this.name + " Error: " + message, meta);
      Logger.error(error, this);
      return error;
    };

    EditOperation.prototype.invoke = function() {};

    EditOperation.prototype.revoke = function() {};

    EditOperation.prototype.toJSON = function() {
      return {
        path: this.path,
        option: this.option
      };
    };

    EditOperation.prototype.describe = function() {
      return this.name;
    };

    return EditOperation;

  })();

  ChangePropertyOperation = (function(superClass) {
    extend(ChangePropertyOperation, superClass);

    ChangePropertyOperation.prototype.name = "ChangePropertyOperation";

    ChangePropertyOperation.prototype.describe = function() {
      return "change prop:" + JSON.stringify(this.option, null, 4);
    };

    function ChangePropertyOperation(context, target, option) {
      var base;
      this.context = context;
      this.target = target;
      this.option = option != null ? option : {};
      ChangePropertyOperation.__super__.constructor.call(this, this.context, this.target, this.option);
      if ((base = this.option).property == null) {
        base.property = {};
      }
    }

    ChangePropertyOperation.prototype.invoke = function() {
      var base, prop;
      if ((base = this.option).oldProperty == null) {
        base.oldProperty = {};
      }
      for (prop in this.option.property) {
        this.option.oldProperty[prop] = this.target[prop];
        this.target[prop] = this.option.property[prop];
      }
      return this.target.pend();
    };

    ChangePropertyOperation.prototype.revoke = function() {
      var prop;
      if (this.option.immutable) {
        return false;
      }
      for (prop in this.option.oldProperty) {
        this.target[prop] = this.option.oldProperty[prop];
      }
      return this.target.pend();
    };

    return ChangePropertyOperation;

  })(EditOperation);

  TreeOperation = (function() {
    TreeOperation.prototype.name = "TreeOperation";

    function TreeOperation(context, target, option) {
      this.context = context;
      this.target = target;
      this.option = option != null ? option : {};
      this.path = this.target.getPath();
      this._index = OpIndex++;
    }

    TreeOperation.prototype.error = function(message, meta) {
      var error;
      error = new Errors.OperationError("Tree->" + this.name + " Error: " + message, meta);
      Logger.error(error, this, this.describe());
      return error;
    };

    TreeOperation.prototype.toJSON = function() {
      return {
        path: this.path,
        option: this.option
      };
    };

    TreeOperation.prototype.describe = function() {
      return this.name;
    };

    return TreeOperation;

  })();

  exports.EditOperation = EditOperation;

  exports.TreeOperation = TreeOperation;

  exports.ChangePropertyOperation = ChangePropertyOperation;

}).call(this);

}
GlobalContext.setModule("vincent/com/operation.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/path.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMPath;

  COMPath = (function() {
    COMPath.fromNode = function(node) {
      var path, ref, routes;
      routes = [];
      while (node.parent) {
        routes.push(node.parent.indexOf(node));
        node = node.parent;
      }
      path = new COMPath({
        type: "COMPath",
        routes: routes
      });
      path.anchor = ((ref = node.anchor) != null ? typeof ref.toJSON === "function" ? ref.toJSON() : void 0 : void 0) || null;
      return path;
    };

    COMPath.prototype.type = "COMPath";

    function COMPath(node) {
      var base;
      if (node == null) {
        node = {};
      }
      if (node.leftMost) {
        this.leftMost = true;
      } else if (node.rightMost) {
        this.rightMost = true;
      }
      this.routes = [];
      if (node.isCOMObject) {
        while (node.parent) {
          this.routes.push(node.parent.indexOf(node));
          node = node.parent;
        }
        if (node.anchor) {
          this.anchor = (typeof (base = node.anchor).toJSON === "function" ? base.toJSON() : void 0) || null;
        }
      } else if (node instanceof COMPath) {
        this.routes = node.getRoutes();
        this.anchor = node.anchor;
      } else if (node.type === "COMPath") {
        this.routes = node.routes || [];
        this.anchor = node.anchor || null;
      } else {
        this.routes = [];
        this.anchor = null;
      }
    }

    COMPath.prototype.getRoutes = function() {
      return this.routes.slice();
    };

    COMPath.prototype.toJSON = function() {
      return {
        routes: this.routes,
        type: "COMPath",
        leftMost: this.leftMost,
        rightMost: this.rightMost
      };
    };

    COMPath.prototype.compare = function(b) {
      var a, asub, bsub, pa, pb;
      if (this.leftMost) {
        if (b.leftMost) {
          return "identical";
        } else {
          return "before";
        }
      } else if (this.rightMost) {
        if (b.rightMost) {
          return "identical";
        } else {
          return "after";
        }
      }
      a = this;
      if (a === b) {
        return "identical";
      }
      pa = a.getRoutes();
      pb = b.getRoutes();
      while (typeof (asub = pa.pop()) === "number") {
        bsub = pb.pop();
        if (asub === bsub) {
          continue;
        } else if (typeof bsub !== "number") {
          return "under";
        } else if (asub > bsub) {
          return "after";
        } else if (asub < bsub) {
          return "before";
        }
      }
      if (typeof pb.pop() === "number") {
        return "contain";
      }
      return "identical";
    };

    return COMPath;

  })();

  module.exports = COMPath;

}).call(this);

}
GlobalContext.setModule("vincent/com/path.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/policy.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMPolicy;

  COMPolicy = (function() {
    function COMPolicy(node) {
      this.node = node;
    }

    COMPolicy.prototype.behave = function(behavior) {
      var prop;
      for (prop in behavior) {
        if (behavior.hasOwnProperty(prop)) {
          this[prop] = behavior[prop];
        }
      }
      return this;
    };

    return COMPolicy;

  })();

  module.exports = COMPolicy;

}).call(this);

}
GlobalContext.setModule("vincent/com/policy.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/richText.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMComposePolicy, COMComposer, COMContainer, COMPath, COMRichText, COMRichTextAnchor, COMRune, COMSpell, COMText, COMTravelPolicy, Errors, Operation,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  COMContainer = require("./container");

  COMPath = require("./path");

  COMRune = require("./rune");

  COMSpell = require("./spell");

  COMText = require("./text");

  Operation = require("./operation");

  COMTravelPolicy = require("./travelPolicy");

  COMComposePolicy = require("./composePolicy");

  COMComposer = require("./composer");

  Errors = require("./errors");

  COMRichTextAnchor = null;

  COMRichText = (function(superClass) {
    extend(COMRichText, superClass);

    COMRichText.packs = [];

    COMRichText.prototype.type = "RichText";

    COMRichText.prototype.mime = "text/com-rich-text";

    COMRichText.prototype.isSingleLine = false;

    function COMRichText(context, option1) {
      var i, item, j, len, len1, ref, ref1, ref2;
      this.context = context;
      this.option = option1 != null ? option1 : {};
      if (this.appearance == null) {
        this.appearance = {
          tagName: "span",
          classList: ["com", "com-rich-text"]
        };
      }
      this.decorationMaintainers = [];
      if (this.availableSpells == null) {
        this.availableSpells = [];
      }
      this.disableTextHolder = false;
      ref = this.context.namespace.decorations;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        this.decorationMaintainers.push(item);
      }
      ref1 = this.context.namespace.spells;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        item = ref1[j];
        this.availableSpells.push(item);
      }
      if (this.privateSpells) {
        (ref2 = this.availableSpells).push.apply(ref2, this.privateSpells);
      }
      this.placeholder = this.option.placeholder;
      this.__defineGetter__("contentString", (function(_this) {
        return function() {
          if (_this._contentString !== null) {
            return _this._contentString;
          }
          _this._contentString = (_this.children.map(function(item) {
            return item.contentString || "";
          })).join("");
          return _this._contentString;
        };
      })(this));
      this.__defineSetter__("contentString", (function(_this) {
        return function(cs) {
          _this.empty();
          _this.append(new COMText(_this.context, {
            contentString: cs,
            passive: true
          }));
          return _this.pend();
        };
      })(this));
      this.__defineGetter__("length", (function(_this) {
        return function() {
          if (_this._length >= 0) {
            return _this._length;
          }
          return _this.reflow();
        };
      })(this));
      COMRichText.__super__.constructor.call(this, this.context, this.option);
      if (this.option.contentString || this.children.length === 0) {
        this.contentString = this.option.contentString || "";
      }
      this.__defineGetter__("holder", function() {
        if (!this.cache) {
          return null;
        }
        if (!this.cache.holder) {
          this.cache.holder = document.createElement("span");
          this.cache.holder.textNode = document.createTextNode("");
          this.cache.holder.appendChild(this.cache.holder.textNode);
          this.cache.holder.classList.add("com-holder");
          this.cache.holder.com = this;
        }
        return this.cache.holder;
      });
      this.travelPolicy = new COMTravelPolicy(this).behave({
        write: "enable",
        forwardChar: "enable",
        backwardChar: "enable",
        deleteChar: "enable",
        forwardBypassed: "handover",
        backwardBypassed: "handover",
        deleteBypassed: "handover",
        head: "enable",
        tail: "enable",
        startOfLine: "boundary",
        endOfLine: "handover",
        tailBoundary: "pass"
      });
      this.layout = "block";
      this.composePolicy = new COMComposePolicy(this).behave({
        newlineSplitHead: true,
        newlineSplitTail: true,
        tailingNewline: false,
        headingNewline: false,
        borrow: false,
        lend: true
      });
      if (!COMRichTextAnchor) {
        COMRichTextAnchor = require("./richTextAnchor");
      }
      this.anchor = new COMRichTextAnchor(this);
    }

    COMRichText.prototype.cutOut = function(offset) {
      var children, i, index, item, j, len, len1, ref, result, target;
      this.reflow();
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (item.endOffset >= offset) {
          target = item;
          break;
        }
      }
      if (!target) {
        return null;
      }
      if (item.sortOf("Rune") || item.endOffset === offset) {
        offset = item.endOffset;
      } else {
        item.splitInPlace(offset - item.startOffset);
      }
      index = this.indexOf(item);
      children = this.children.slice(index + 1);
      this.removeChildren(children);
      result = this.context.createElement("RichText", {});
      for (j = 0, len1 = children.length; j < len1; j++) {
        item = children[j];
        result.append(item);
      }
      return result;
    };

    COMRichText.prototype.pend = function() {
      this._contentString = null;
      this._length = -1;
      return COMRichText.__super__.pend.call(this);
    };

    COMRichText.prototype.getRunes = function() {
      return this.children.filter(function(item) {
        return item.sortOf("Rune");
      });
    };

    COMRichText.prototype.isStartOfChar = function(char) {
      var first;
      first = this.children[0];
      if (!first || !first.sortOf("Text")) {
        return false;
      }
      return first.contentString.slice(0, 1) === char;
    };

    COMRichText.prototype.isEndOfChar = function(char) {
      var last;
      last = this.last();
      if (!last || !last.sortOf("Text")) {
        return false;
      }
      return last.contentString.slice(-1) === char;
    };

    COMRichText.prototype.isEmpty = function() {
      return this.children.length === 0 || (this.children.length === 1 && this.children[0].isEmpty()) && true;
    };

    COMRichText.prototype.append = function(item) {
      if (!(item instanceof COMText) && !(item instanceof COMRune)) {
        throw new Errors.LogicError("COMRichText only support COMSpell or COMText as child");
      }
      return COMRichText.__super__.append.call(this, item);
    };

    COMRichText.prototype.reflow = function() {
      var i, index, item, len, offset, ref;
      offset = 0;
      ref = this.children;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        item = ref[index];
        item.startOffset = offset;
        offset += item.length;
        item.endOffset = offset;
      }
      this._length = offset;
      return offset;
    };

    COMRichText.prototype.borrowFirstLine = function() {
      var cs, index;
      if (!this.composePolicy.lend) {
        return "";
      }
      cs = this.contentString;
      index = cs.indexOf("\n");
      if (index < 0) {
        return "";
      }
      this.removeText(0, index + 1);
      return cs.slice(0, index + 1);
    };

    COMRichText.prototype.borrowHeadingNewline = function() {
      if (!this.composePolicy.lend) {
        return false;
      }
      if (this.contentString[0] === "\n") {
        this.removeText(0, 1);
        return true;
      }
      return false;
    };

    COMRichText.prototype.borrowTailingNewline = function() {
      if (!this.composePolicy.lend) {
        return false;
      }
      if (this.contentString.slice(-1) === "\n") {
        this.removeText(this.contentString.length - 1);
        return true;
      }
      return false;
    };

    COMRichText.prototype.render = function(rc) {
      var child, ctail, el, hasCorrectParent, i, index, item, j, k, l, len, len1, len2, len3, len4, len5, len6, m, modified, n, neAnchor, nes, nesShould, next, o, p, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, removes, solved;
      solved = false;
      modified = this.beforeMark("hasDetachedChild") || this.beforeMark("hasAttachedChild");
      next = this.next();
      if (this.children.length === 0 || (this.children.length === 1 && this.children[0].length === 0) || this.forceHolder) {
        this.holder.textNode.textContent = this.placeholder || "";
        if (this.trigger && !this.holder.withClick) {
          this.holder.withClick = true;
          this.holder.onclick = (function(_this) {
            return function() {
              return _this.context.transact(function() {
                return typeof _this.trigger === "function" ? _this.trigger({
                  via: "holder"
                }) : void 0;
              });
            };
          })(this);
        }
      } else {
        this.holder.textNode.textContent = "";
      }
      if (this.layout === "block") {
        ref = this.children;
        for (index = i = 0, len = ref.length; i < len; index = ++i) {
          item = ref[index];
          item.blockTail = false;
          if (index === this.children.length - 1 && item.sortOf("Text") && next) {
            item.blockTail = true;
          }
        }
      }
      if (!this.beforeMark("hasAttachedChild")) {
        ref1 = this.children;
        for (index = j = 0, len1 = ref1.length; j < len1; index = ++j) {
          item = ref1[index];
          if (item.richTextIndex !== index) {
            modified = true;
            item.richTextIndex = index;
          }
        }
      }
      if (this.beforeMark("hasDetachedChild") && this.domContainer) {
        removes = [];
        ref2 = this.domContainer.children;
        for (k = 0, len2 = ref2.length; k < len2; k++) {
          item = ref2[k];
          if ((ref3 = item.com, indexOf.call(this.children, ref3) < 0) && item !== this.holder) {
            removes.push(item);
          }
        }
        for (l = 0, len3 = removes.length; l < len3; l++) {
          item = removes[l];
          this.domContainer.removeChild(item);
        }
      }
      if (modified && this.domContainer) {
        ref4 = this.children;
        for (m = 0, len4 = ref4.length; m < len4; m++) {
          child = ref4[m];
          if (child.dirty) {
            child.render(rc);
            child.afterRender();
          }
        }
        ref5 = this.children;
        for (index = n = ref5.length - 1; n >= 0; index = n += -1) {
          child = ref5[index];
          next = this.children[index + 1];
          if (!next) {
            if (!child.elAfter) {
              nes = child.el.nextElementSibling;
            } else {
              nes = child.elAfter.nextElementSibling;
            }
            hasCorrectParent = true;
            ref6 = [child.el, child.elBefore, child.elAfter];
            for (o = 0, len5 = ref6.length; o < len5; o++) {
              el = ref6[o];
              if (!el) {
                continue;
              }
              if (el && el.parentElement !== this.domContainer) {
                hasCorrectParent = false;
                break;
              }
            }
            if (!hasCorrectParent || (nes && nes !== this.holder)) {
              if (child.elBefore) {
                this.domContainer.appendChild(child.elBefore);
              }
              this.domContainer.appendChild(child.el);
              if (child.elAfter) {
                this.domContainer.appendChild(child.elAfter);
              }
            }
            continue;
          }
          if (next.elBefore) {
            neAnchor = next.elBefore;
            nesShould = next.elBefore.previousElementSibling;
          } else {
            neAnchor = next.el;
            nesShould = next.el.previousElementSibling;
          }
          hasCorrectParent = true;
          ref7 = [child.el, child.elBefore, child.elAfter];
          for (p = 0, len6 = ref7.length; p < len6; p++) {
            el = ref7[p];
            if (!el) {
              continue;
            }
            if (el && el.parentElement !== this.domContainer) {
              hasCorrectParent = false;
              break;
            }
          }
          if (child.elAfter) {
            ctail = child.elAfter;
          } else {
            ctail = child.el;
          }
          if (!hasCorrectParent || nesShould !== ctail) {
            if (child.elBefore) {
              this.domContainer.insertBefore(child.elBefore, neAnchor);
            }
            if (child.el) {
              this.domContainer.insertBefore(child.el, neAnchor);
            }
            if (child.elAfter) {
              this.domContainer.insertBefore(child.elAfter, neAnchor);
            }
          } else if (child.elAfter) {
            Logger.error("cel pass");
          }
        }
        solved = true;
      }
      COMRichText.__super__.render.call(this, rc, {
        recursive: true,
        selfless: !modified || solved
      });
      if (this.holder.parentElement !== this.domContainer || this.holder.nextSibling) {
        return this.domContainer.appendChild(this.holder);
      }
    };

    COMRichText.prototype.compose = function() {
      var casted, changed, hasRunes, i, index, item, len, normalized, ref, retained;
      if (COMRichText.__super__.compose.call(this)) {
        return true;
      }
      retained = this.retainSpells();
      normalized = this.normalizeTexts();
      casted = this.castSpells();
      normalized = this.normalizeTexts();
      hasRunes = this.recoverRunes();
      this.computeDecoration();
      if (!this.disableTextHolder) {
        ref = this.children;
        for (index = i = 0, len = ref.length; i < len; index = ++i) {
          item = ref[index];
          if (index !== this.children.length - 1) {
            item.withHolder = false;
          } else {
            item.withHolder = true;
          }
        }
      }
      changed = retained || normalized || casted;
      if (changed) {
        return true;
      }
      if (typeof this.acknowledge === "function") {
        this.acknowledge();
      }
      return false;
    };

    COMRichText.prototype.recoverRunes = function() {
      var after, children, i, item, len, once, reg, result, rune;
      children = this.children.slice();
      reg = new RegExp(COMRune.RunePlaceBegin + "([0-9]+)" + COMRune.RunePlaceEnd);
      for (i = 0, len = children.length; i < len; i++) {
        item = children[i];
        if (item.type !== "Text") {
          continue;
        }
        while (true) {
          result = item.contentString.match(reg);
          if (!result) {
            break;
          }
          if (this.mime !== "text/com-rich-text") {
            item.removeText(result.index, result[0].length);
            once = true;
            continue;
          }
          rune = this.context.runeCache.cloneByCid(result[1]);
          if (!rune) {
            break;
          }
          item.removeText(result.index, result[0].length);
          after = item.splitInPlace(result.index);
          if (result.index === 0) {
            item.before(rune);
          } else {
            item.after(rune);
          }
          if (!after) {
            break;
          }
          item = after;
          once = true;
        }
      }
      return once || false;
    };

    COMRichText.prototype.retainSpells = function() {
      var i, item, len, ref, result;
      result = false;
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (item instanceof COMSpell) {
          result = item.compose() || result;
        }
      }
      return result;
    };

    COMRichText.prototype.castSpells = function() {
      var Spell, after, before, candidate, content, cs, i, index, item, j, k, l, len, len1, len2, match, nexts, offsetStart, parts, ref, ref1, result, results, spell, spells, start, text, texts;
      this.reflow();
      cs = this.contentString;
      texts = [];
      start = 0;
      text = "";
      ref = this.children.slice(0);
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (item.sortOf("Text")) {
          if (!text) {
            start = item.startOffset;
          }
          text += item.contentString;
        } else {
          texts.push({
            content: text,
            start: start
          });
          text = "";
        }
      }
      if (text) {
        texts.push({
          content: text,
          start: start
        });
      }
      results = [];
      ref1 = this.availableSpells;
      for (j = ref1.length - 1; j >= 0; j += -1) {
        Spell = ref1[j];
        nexts = [];
        offsetStart = 0;
        for (index = k = 0, len1 = texts.length; k < len1; index = ++k) {
          text = texts[index];
          start = text.start;
          candidate = text.content;
          parts = [];
          while (candidate && (match = Spell.prototype.test(candidate, start, cs))) {
            if (match.start === match.end) {
              throw new Error("parse empty spell content");
            }
            before = candidate.slice(0, match.start);
            content = candidate.slice(match.start, match.end);
            after = candidate.slice(match.end);
            if (before) {
              parts.push({
                start: start,
                content: before
              });
            }
            start += before.length;
            results.push({
              Spell: Spell,
              start: start,
              content: content
            });
            start += content.length;
            candidate = after;
          }
          if (candidate) {
            parts.push({
              start: start,
              content: candidate
            });
          }
          nexts.push.apply(nexts, parts);
        }
        texts = nexts;
      }
      results.sort(function(a, b) {
        return a.start - b.start;
      });
      spells = this.children.slice(0).filter(function(item) {
        return item.sortOf("Spell");
      });
      if (results.length !== spells.length) {
        this.castAllSpells(results);
        return true;
      }
      for (index = l = 0, len2 = results.length; l < len2; index = ++l) {
        result = results[index];
        spell = spells[index];
        if (result.start === spell.startOffset && result.content.length === spell.length) {
          continue;
        }
        this.castAllSpells(results);
        return true;
      }
      return false;
    };

    COMRichText.prototype.castAllSpells = function(spells) {
      var end, endOffset, i, index, info, len, next, results1, spell, startOffset, target;
      if (spells.length === 0) {
        return;
      }
      this.reflow();
      results1 = [];
      for (i = 0, len = spells.length; i < len; i++) {
        info = spells[i];
        index = this.getChildTextIndexByOffset(info.start);
        target = this.children[index];
        end = info.start + info.content.length;
        while (end > target.endOffset) {
          next = this.children[index + 1];
          if (!next) {
            break;
          }
          target.mergeInPlace(next);
          target.endOffset += next.length;
        }
        spell = new info.Spell(this.context, {});
        startOffset = info.start - target.startOffset;
        endOffset = startOffset + info.content.length;
        results1.push(spell.castToText(target, startOffset, endOffset));
      }
      return results1;
    };

    COMRichText.prototype.castSpellsOld = function() {
      var Spell, contentString, i, j, len, ref, result, text, texts;
      contentString = this.contentString;
      result = null;
      ref = this.availableSpells;
      for (i = ref.length - 1; i >= 0; i += -1) {
        Spell = ref[i];
        texts = this.children.slice().filter(function(item) {
          return item.type === "Text";
        });
        for (j = 0, len = texts.length; j < len; j++) {
          text = texts[j];
          result = this.castSpellOn(Spell, text, contentString) || result;
          if (result) {
            Logger.error("cast spell on", [text.toString()], Spell, texts.length);
          }
        }
      }
      return result;
    };

    COMRichText.prototype.castSpellOnOld = function(Spell, text, contentString) {
      var last, result, spell, success;
      contentString = contentString || this.contentString;
      while (text && (result = Spell.prototype.test(text.contentString, text.startOffset, contentString))) {
        spell = new Spell(this.context, {
          match: result.match
        });
        last = spell.castToText(text, result.start, result.end);
        text = last;
        success = true;
      }
      return success;
    };

    COMRichText.prototype.normalizeTexts = function() {
      var canMerge, hasMerge, i, index, item, len, prev, retain, texts;
      if (this.noAutoMerge) {
        return false;
      }
      canMerge = function(a, b) {
        return a.type === "Text" && b.type === "Text";
      };
      if (this.children.length === 1) {
        return;
      }
      texts = this.children.slice();
      retain = false;
      prev = null;
      for (index = i = 0, len = texts.length; i < len; index = ++i) {
        item = texts[index];
        if (item.length === 0 && index !== texts.length - 1) {
          hasMerge = true;
          item.remove();
          continue;
        }
        if (!prev) {
          prev = item;
          continue;
        }
        if (canMerge(prev, item)) {
          prev.mergeInPlace(item);
          hasMerge = true;
        } else {
          prev = item;
        }
      }
      return hasMerge || false;
    };

    COMRichText.prototype.getBreakString = function(count, breakChar) {
      var pattern, result;
      if (breakChar == null) {
        breakChar = "\uE1F8";
      }
      pattern = breakChar;
      if (count < 1) {
        return "";
      }
      result = "";
      while (count > 1) {
        if (count & 1) {
          result += pattern;
        }
        count >>= 1;
        pattern += pattern;
      }
      return result + pattern;
    };

    COMRichText.prototype.getDecorationString = function() {
      var behavior, i, item, len, ref, str;
      str = "";
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        behavior = item.decorationPolicy.behavior;
        if (behavior === "break") {
          str += this.getBreakString(item.length);
        } else if (behavior === "singular") {
          str += this.getBreakString(item.length, "X");
        } else {
          str += item.contentString || "";
        }
      }
      return str;
    };

    COMRichText.prototype.computeDecoration = function() {
      var backup, content, counter, dc, dec, decIndex, decorations, disIndex, disItem, disableRegions, fpdec, i, index, item, j, k, l, len, len1, len2, len3, maintainer, next, nextRound, ref, results1, targets, text, valid, validDecs;
      content = this.getDecorationString();
      decorations = [];
      ref = this.decorationMaintainers;
      for (i = 0, len = ref.length; i < len; i++) {
        maintainer = ref[i];
        decorations.push.apply(decorations, maintainer.compute(content));
      }
      decorations.sort(function(a, b) {
        var MAX_TEXTCOUNT;
        MAX_TEXTCOUNT = 1000001;
        return a.start - b.start + (a.end - b.end) / MAX_TEXTCOUNT;
      });
      valid = [];
      this.reflow();
      disableRegions = [];
      decIndex = 0;
      validDecs = decorations.slice();
      for (disIndex = j = 0, len1 = disableRegions.length; j < len1; disIndex = ++j) {
        disItem = disableRegions[disIndex];
        while (true) {
          dec = validDecs[decIndex];
          if (!dec) {
            break;
          }
          if (dec.start > disItem.end) {
            decIndex = decIndex;
            break;
          }
          if (dec.end < disItem.start) {
            decIndex += 1;
            continue;
          }
          if (dec.start <= disItem.start && dec.end > disItem.start) {
            if (disItem.allowWrapping) {
              decIndex += 1;
            } else {
              validDecs.splice(decIndex, 1);
            }
            continue;
          }
          if (dec.start >= disItem.start && dec.end <= disItem.end) {
            validDecs.splice(decIndex, 1);
            continue;
          }
          if (dec.start >= disItem.start && dec.start < disItem.end) {
            validDecs.splice(decIndex, 1);
            continue;
          }
          if (dec.start <= disItem.start && dec.end >= disItem.end) {
            validDecs.splice(decIndex, 1);
            continue;
          }
          break;
        }
      }
      decorations = validDecs;
      targets = this.children.slice();
      this.reflow();
      targets.forEach(function(item) {
        return item._decs = [];
      });
      backup = targets.slice();
      counter = 0;
      for (k = 0, len2 = decorations.length; k < len2; k++) {
        dec = decorations[k];
        nextRound = [];
        index = 0;
        while (true) {
          if (index >= targets.length) {
            break;
          }
          text = targets[index];
          if (text.startOffset >= dec.end) {
            break;
          }
          if (text.endOffset <= dec.start) {
            targets.splice(index, 1);
            continue;
          }
          if (dec.end <= text.endOffset) {
            text._decs.push(dec.shift(-text.startOffset));
            if (dec.start < 0) {
              Logger.error("INVALID DEC", dec, text.startOffset, text.contentString);
            }
          } else {
            next = dec.split(text.endOffset);
            text._decs.push(dec.shift(-text.startOffset));
            if (dec.start < 0) {
              Logger.error("INVALID DEC AFTER", dec);
            }
            dec = next;
          }
          index += 1;
        }
      }
      fpdec = function(decs) {
        return (decs.map(function(item) {
          return "" + item.mid + ":" + item.start + "~" + item.end;
        })).join("|");
      };
      dc = 0;
      results1 = [];
      for (l = 0, len3 = backup.length; l < len3; l++) {
        item = backup[l];
        if (item.ignoreDecoration && !item.allowWrapping) {
          item.setDecorations();
          continue;
        }
        if (item._decs.length !== item.decorations.length) {
          if (typeof item.setDecorations === "function") {
            item.setDecorations(item._decs);
          }
          dc += 1;
          continue;
        }
        results1.push((function() {
          var len4, m, ref1, results2;
          ref1 = item._decs;
          results2 = [];
          for (index = m = 0, len4 = ref1.length; m < len4; index = ++m) {
            dec = ref1[index];
            if (dec.equal(item.decorations[index])) {
              continue;
            } else {
              if (typeof item.setDecorations === "function") {
                item.setDecorations(item._decs);
              }
              dc += 1;
              break;
            }
          }
          return results2;
        })());
      }
      return results1;
    };

    COMRichText.prototype.insertText = function(start, value) {
      var anchor, i, inside, len, ref;
      if (!this._insertText(start, value)) {
        return false;
      }
      ref = this.anchors;
      for (i = 0, len = ref.length; i < len; i++) {
        anchor = ref[i];
        if (anchor.index >= start) {
          inside = anchor.inside;
          anchor.index += value.length;
          anchor.inside = inside;
        }
      }
      return true;
    };

    COMRichText.prototype._insertText = function(start, value) {
      var i, index, last, len, next, ref, text;
      this.reflow();
      ref = this.children;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        text = ref[index];
        last = text;
        next = this.children[index + 1];
        if (start >= text.startOffset && start < text.endOffset) {
          if (text.insertText(start - text.startOffset, value)) {
            this.pend();
            return true;
          } else {
            return false;
          }
        } else if (start === text.endOffset && text.sortOf("Text") && next && next.sortOf("Rune")) {
          if (text.insertText(start - text.startOffset, value)) {
            this.pend();
            return true;
          } else {
            return false;
          }
        } else if (start >= text.startOffset && start === text.endOffset && text instanceof COMSpell) {
          if (text.insertText(start - text.startOffset, value)) {
            this.pend();
            return true;
          } else {
            return false;
          }
        }
      }
      if (last && start === last.endOffset) {
        if (last.insertText(start - last.startOffset, value)) {
          this.pend();
          return true;
        }
      } else if (start === 0) {
        if (this.append(new COMText(this.context, {
          contentString: value
        }))) {
          this.pend();
          return true;
        }
      }
      return false;
    };

    COMRichText.prototype.insertRune = function(start, rune) {
      var anchor, i, inside, len, ref;
      if (!this._insertRune(start, rune)) {
        return false;
      }
      ref = this.anchors;
      for (i = 0, len = ref.length; i < len; i++) {
        anchor = ref[i];
        if (anchor.index === start) {
          anchor.index += rune.length;
        } else if (anchor.index >= start) {
          inside = anchor.inside;
          anchor.index += rune.length;
          anchor.inside = inside;
        }
      }
      return true;
    };

    COMRichText.prototype._insertRune = function(start, rune) {
      var anchor, i, inside, j, len, len1, offset, ref, ref1, text;
      offset = 0;
      this.reflow();
      if (start === this.contentString.length) {
        this.pend();
        return this.append(rune);
      }
      if (start === 0) {
        this.pend();
        return this.insert(0, rune);
      }
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        text = ref[i];
        if (text.endOffset < start) {
          continue;
        }
        if (text.startOffset === start) {
          text.before(rune);
        } else if (text.endOffset === start) {
          text.after(rune);
        } else if (text instanceof COMText) {
          text.splitInPlace(start - text.startOffset);
          text.after(rune);
        } else {
          text.after(rune);
        }
        this.pend();
        return true;
      }
      return false;
      ref1 = this.anchors;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        anchor = ref1[j];
        inside = anchor.inside;
        if (anchor.index < start) {
          return;
        }
        if (anchor.index >= start + length) {
          anchor.index -= length;
          anchor.inside = inside;
          continue;
        }
        if (anchor.index >= start) {
          anchor.index = start;
          anchor.inside = inside;
          continue;
        }
      }
      return true;
    };

    COMRichText.prototype.removeRune = function(rune) {
      if (rune.parent !== this) {
        return false;
      }
      return this.removeText(rune.startOffset, rune.length);
    };

    COMRichText.prototype.removeText = function(start, length) {
      var action, actions, anchor, cs, end, i, index, inside, j, k, len, len1, len2, offset, ref, ref1, text, textEnd, textStart;
      cs = this.contentString;
      if (length == null) {
        length = cs.length - start;
      }
      actions = [];
      offset = start;
      end = start + length;
      if (start > cs.length || start + length > cs.length) {
        return false;
      }
      this.reflow();
      ref = this.children;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        text = ref[index];
        if (text.startOffset >= end) {
          break;
        } else if (text.endOffset <= start) {
          continue;
        }
        textStart = offset - text.startOffset;
        textEnd = end - text.startOffset;
        if (textEnd >= text.length) {
          textEnd = text.length;
          if (textStart === 0) {
            actions.push({
              remove: true,
              text: text
            });
          } else {
            actions.push({
              start: textStart,
              text: text
            });
          }
          offset = text.endOffset;
        } else {
          actions.push({
            start: textStart,
            length: textEnd - textStart,
            text: text
          });
          break;
        }
      }
      for (index = j = 0, len1 = actions.length; j < len1; index = ++j) {
        action = actions[index];
        if (action.remove) {
          action.text.remove();
        } else {
          action.text.removeText(action.start, action.length || null);
        }
        if (index === 0 && action.text.sortOf("Rune")) {
          start = action.text.startOffset;
        }
        if (index === actions.length - 1 && action.text.sortOf("Rune")) {
          end = action.text.endOffset;
        }
      }
      length = end - start;
      ref1 = this.anchors;
      for (k = 0, len2 = ref1.length; k < len2; k++) {
        anchor = ref1[k];
        inside = anchor.inside;
        if (anchor.index < start) {
          continue;
        }
        if (anchor.index >= start + length) {
          anchor.index -= length;
          anchor.inside = inside;
          continue;
        }
        if (anchor.index >= start) {
          anchor.index = start;
          anchor.inside = inside;
          continue;
        }
      }
      if (this.children.length === 0) {
        this.contentString = "";
        this.pend();
        return;
      }
      if (actions.length > 0) {
        this.pend();
        return true;
      }
      return false;
    };

    COMRichText.prototype.getOffsetByDOM = function(node, offset) {
      var i, item, len, ref, result;
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (item.isSpell) {
          result = item != null ? typeof item.getOffsetByDOM === "function" ? item.getOffsetByDOM(node, offset) : void 0 : void 0;
          if (result) {
            result.index += item.startOffset;
            return result;
          }
        }
      }
      return null;
    };

    COMRichText.prototype.getChildTextIndexByOffset = function(offset) {
      var i, index, len, ref, text;
      this.reflow();
      if (this.last() && this.last().endOffset === offset) {
        return this.last();
      }
      ref = this.children;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        text = ref[index];
        if (text.startOffset <= offset && text.endOffset > offset) {
          return index;
        }
      }
    };

    COMRichText.prototype.getChildTextByOffset = function(offset) {
      var i, index, len, ref, text;
      this.reflow();
      if (this.last() && this.last().endOffset === offset) {
        return this.last();
      }
      ref = this.children;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        text = ref[index];
        if (text.startOffset <= offset && text.endOffset > offset) {
          return text;
        }
      }
      return null;
    };

    COMRichText.prototype.mergeContentString = function(content) {
      if (!content) {
        return true;
      }
      return this.insertText(this.length, content);
    };

    COMRichText.prototype.toContentString = function(option) {
      if (option == null) {
        option = {};
      }
      if (!option.purify) {
        return this.contentString;
      } else {
        return COMRune.purifyContentString(this.contentString, option);
      }
    };

    COMRichText.prototype.hasRune = function(handler) {
      var i, item, len, ref;
      if (handler == null) {
        handler = function() {};
      }
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (item.sortOf("Rune")) {
          if (handler(item)) {
            return true;
          }
        }
      }
      return false;
    };

    COMRichText.prototype.filterRunes = function(handler) {
      var i, item, len, ref, result;
      if (handler == null) {
        handler = function() {};
      }
      result = [];
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (item.sortOf("Rune")) {
          if (handler(item)) {
            result.push(item);
          }
        }
      }
      return result;
    };

    COMRichText.prototype.fromJSON = function(option) {
      var child, find, i, len, ref, results1;
      if (option.children) {
        this.empty();
        ref = option.children;
        results1 = [];
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          if (!child) {
            continue;
          }
          if (child instanceof COMText) {
            results1.push(this.append(child));
          } else if (child.type === "Text") {
            results1.push(this.append(new COMText(this.context, child)));
          } else if (child.spell === true) {
            find = this.availableSpells.some((function(_this) {
              return function(Spell) {
                if (Spell.prototype.type === child.type) {
                  _this.append(new Spell(_this.context, child));
                  return true;
                }
                return false;
              };
            })(this));
            if (!find) {
              Logger.error("RichText:fail to build spell from json for ", child);
              Logger.error("fallback into normal texts.");
              results1.push(this.append(new COMText(this.context, child)));
            } else {
              results1.push(void 0);
            }
          } else if (child.sortOf && child.sortOf("Rune")) {
            results1.push(this.append(child));
          } else if (child.type && this.context.namespace.sortOf(child.type, "Rune")) {
            results1.push(this.append(this.context.createElement(child)));
          } else {
            this.append(this.context.createElement({
              type: "UnknownRune",
              detail: child
            }));
            results1.push(Logger.error("RichText: unsupported typeof child", child, this.context));
          }
        }
        return results1;
      }
    };

    COMRichText.prototype.runeAtIndex = function(index) {
      var child;
      this.reflow();
      if (typeof index !== "number") {
        return null;
      }
      child = this.getChildTextByOffset(index);
      if (child instanceof COMRune) {
        return child;
      }
      return null;
    };

    COMRichText.prototype.isRuneAt = function(index, option) {
      var child;
      if (option == null) {
        option = {};
      }
      this.reflow();
      child = this.getChildTextByOffset(index);
      if (option.strict) {
        return child instanceof COMRune && child.startOffset === index;
      }
      return child instanceof COMRune;
    };

    COMRichText.prototype.spellAtIndex = function(index) {
      var child;
      this.reflow();
      child = this.getChildTextByOffset(index);
      if (!child) {
        return null;
      }
      if (child instanceof COMSpell) {
        return child;
      }
      return null;
    };

    COMRichText.prototype.clone = function() {
      var children, i, item, len, ref;
      children = [];
      ref = this.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        children.push(item.toJSON());
      }
      return this.context.createElement(this.type, {
        children: children
      });
    };

    COMRichText.prototype.slice = function(option) {
      var child, children, clone, cs, end, i, index, isPartial, item, j, last, lastCs, left, leftAnchor, leftOffset, len, len1, ll, looseComplete, pointAt, ref, ref1, ref2, ref3, right, rightAnchor, rightOffset, rr, start, target, text;
      if (option == null) {
        option = {};
      }
      if (option.left) {
        left = option.left;
      } else {
        left = {
          leftMost: true
        };
      }
      if (option.right) {
        right = option.right;
      } else {
        right = {
          rightMost: true
        };
      }
      leftAnchor = this.anchor.clone();
      leftAnchor.head();
      rightAnchor = this.anchor.clone();
      rightAnchor.tail();
      if (leftAnchor.compare(right) === "after") {
        return null;
      }
      if (rightAnchor.compare(left) === "before") {
        return null;
      }
      if (((ref = leftAnchor.compare(left)) === "after" || ref === "identical") && ((ref1 = rightAnchor.compare(right)) === "before" || ref1 === "identical")) {
        return this.clone();
      }
      children = [];
      this.reflow();
      ll = leftAnchor.compare(left);
      rr = rightAnchor.compare(right);
      if (ll === "before") {
        if (left.node === leftAnchor.node) {
          leftAnchor.fromJSON(left.toJSON());
        } else {
          target = left.node;
          while (target && (target !== leftAnchor.node)) {
            pointAt = target;
            target = target.parent;
          }
          if (!pointAt) {
            throw new Errors.LogicError("since leftAnchor is before leftEdge and rightAnchor is after rightEdge, leftAnchor and leftEdge should have same ancester");
          }
          leftAnchor.pointAt(pointAt);
        }
      }
      pointAt = null;
      if (rr === "after") {
        if (right.node === rightAnchor.node) {
          rightAnchor.fromJSON(right.toJSON());
        } else {
          target = right.node;
          while (target && (target !== rightAnchor.node)) {
            pointAt = target;
            target = target.parent;
          }
          if (!pointAt) {
            throw new Errors.LogicError("since rightAnchor is before rightEdge and rightAnchor is after rightEdge, rightAnchor and rightEdge should have same ancester");
          }
          rightAnchor.pointAt(pointAt);
        }
      }
      if (leftAnchor.index === 0 && rightAnchor.index === this.contentString.length) {
        return this.clone();
      }
      ref2 = this.children;
      for (i = 0, len = ref2.length; i < len; i++) {
        item = ref2[i];
        if (item.endOffset <= leftAnchor.index) {
          continue;
        }
        if (item.startOffset >= rightAnchor.index && !rightAnchor.inside) {
          break;
        }
        if (item.sortOf("Rune")) {
          child = item.slice(option);
          if (child) {
            children.push(child);
          }
          continue;
        }
        leftOffset = Math.max(item.startOffset, leftAnchor.index);
        rightOffset = Math.min(item.endOffset, rightAnchor.index);
        if (rightOffset <= leftOffset) {
          continue;
        }
        start = leftOffset - item.startOffset;
        end = rightOffset - item.startOffset;
        cs = item.contentString.slice(start, end);
        text = new COMText(this.context, {
          contentString: cs
        });
        if (leftOffset !== item.startOffset || rightOffset !== item.endOffset && option.selection) {
          text.isPartial = true;
        }
        children.push(text);
      }
      isPartial = false;
      if (children.length !== this.children.length) {
        isPartial = true;
      }
      clone = this.context.createElement(this.type);
      clone.empty();
      last = this.last();
      lastCs = last.contentString;
      looseComplete = false;
      for (index = j = 0, len1 = children.length; j < len1; index = ++j) {
        item = children[index];
        if (item.isPartial) {
          if (index === this.children.length - 1 && (lastCs != null ? lastCs.length : void 0) - 1 === ((ref3 = item.contentString) != null ? ref3.length : void 0) && (lastCs != null ? lastCs[(lastCs != null ? lastCs.length : void 0) - 1] : void 0) === "\n") {
            isPartial = true;
            looseComplete = true;
          } else {
            isPartial = true;
          }
        }
        clone.append(item);
      }
      clone.isPartial = this.isPartial || isPartial;
      clone.looseComplete = looseComplete;
      return clone;
    };

    COMRichText.prototype.toJSON = function() {
      var json;
      json = COMRichText.__super__.toJSON.call(this);
      delete json.contentString;
      return json;
    };

    return COMRichText;

  })(COMContainer);

  module.exports = COMRichText;

}).call(this);

}
GlobalContext.setModule("vincent/com/richText.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/richTextAnchor.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMAnchor, COMNode, COMRichText, COMRichTextAnchor, COMVisualPosition, Errors, StringHelper,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  COMNode = require("./node");

  COMRichText = require("./richText");

  StringHelper = require("./helper/string");

  COMAnchor = require("./anchor");

  Errors = require("./errors");

  COMVisualPosition = require("./visualPosition");

  COMRichTextAnchor = (function(superClass) {
    extend(COMRichTextAnchor, superClass);

    function COMRichTextAnchor(node1) {
      this.node = node1;
      COMRichTextAnchor.__super__.constructor.call(this);
      this.index = 0;
      this.rev = 0;
      this.__defineGetter__("index", (function(_this) {
        return function() {
          return _this._index;
        };
      })(this));
      this.__defineSetter__("index", (function(_this) {
        return function(value) {
          var change, length;
          if (value !== _this._index) {
            change = true;
          }
          if (value < 0) {
            value = 0;
          }
          length = _this.node.contentString.length;
          if (value > length) {
            value = length;
          }
          _this.rev += 1;
          _this._index = value;
          _this._inside = false;
          if (change) {
            _this.emit("move");
          }
          return _this._index;
        };
      })(this));
      this.__defineGetter__("inside", (function(_this) {
        return function() {
          return _this._inside;
        };
      })(this));
      this.__defineSetter__("inside", (function(_this) {
        return function(value) {
          var move;
          if (value !== _this._inside) {
            move = true;
          }
          _this._inside = value;
          if (move) {
            _this.emit("move");
          }
          return _this._inside;
        };
      })(this));
      this.index = 0;
      this.inside = false;
      return;
    }

    COMRichTextAnchor.prototype.getPath = function() {
      var path;
      path = this.node.getPath();
      path.anchor = this.toJSON();
      return path;
    };

    COMRichTextAnchor.prototype.activate = function(cursor) {
      var ref, target;
      this.cursor = cursor;
      if (indexOf.call(this.node.anchors, this) < 0) {
        this.node.anchors.push(this);
      }
      if (this.cursor.name) {
        target = "cursor-over-" + this.cursor.name;
        if (indexOf.call(this.node.appearance.classList, target) < 0) {
          this.node.appearance.classList.push(target);
        }
        return (ref = this.node.el) != null ? ref.classList.add(target) : void 0;
      }
    };

    COMRichTextAnchor.prototype.deactivate = function(arg) {
      var ref, ref1, replacementAnchor, replacementCursor, target;
      ref = arg != null ? arg : {}, replacementCursor = ref.replacementCursor, replacementAnchor = ref.replacementAnchor;
      if (this.cursor && this.cursor.name && (replacementCursor !== this.cursor || !this.equal(replacementAnchor))) {
        target = "cursor-over-" + this.cursor.name;
        if (indexOf.call(this.node.appearance.classList, target) >= 0) {
          this.node.appearance.classList = this.node.appearance.classList.filter(function(item) {
            return item !== target;
          });
        }
        if ((ref1 = this.node.el) != null) {
          ref1.classList.remove(target);
        }
      }
      this.cursor = null;
      return this.node.anchors = this.node.anchors.filter((function(_this) {
        return function(item) {
          return item !== _this;
        };
      })(this));
    };

    COMRichTextAnchor.prototype.toJSON = function() {
      return {
        index: this.index,
        inside: this.inside
      };
    };

    COMRichTextAnchor.prototype.fromJSON = function(json) {
      this.index = json.index;
      return this.inside = json.inside;
    };

    COMRichTextAnchor.prototype.forwardChar = function() {
      var rune;
      if (this.index < this.node.length) {
        rune = this.node.runeAtIndex(this.index);
        if (rune && this.cursor.trapIn(rune, {
          direction: "left"
        })) {
          return true;
        }
        if (rune) {
          if (rune.trigger && !this.inside) {
            this.inside = true;
          } else {
            this.index += rune.length;
          }
        } else {
          this.index += 1;
        }
        return true;
      }
      return false;
    };

    COMRichTextAnchor.prototype.backwardChar = function() {
      var rune;
      if (this.inside) {
        this.inside = false;
        return true;
      }
      if (this.index > 0) {
        rune = this.node.runeAtIndex(this.index - 1);
        if (rune && this.cursor.trapIn(rune, {
          direction: "right"
        })) {
          return true;
        }
        if (rune) {
          this.index -= rune.length;
          if (rune.trigger) {
            this.inside = true;
          }
        } else {
          this.index -= 1;
        }
        return true;
      }
      return false;
    };

    COMRichTextAnchor.prototype.trapRecover = function(rune, direction) {
      var i, len, ref, text;
      if (direction == null) {
        direction = "left";
      }
      this.node.reflow();
      ref = this.node.children;
      for (i = 0, len = ref.length; i < len; i++) {
        text = ref[i];
        if (text === rune) {
          if (direction === "left") {
            this.index = rune.startOffset;
          } else {
            this.index = rune.endOffset;
          }
          return true;
        }
      }
      return false;
    };

    COMRichTextAnchor.prototype.backwardWord = function() {
      var contentString, find, last, length, maybe, results, rune, start;
      if (this.index === 0) {
        return false;
      }
      this.node.reflow();
      if (this.node.isRuneAt(this.index)) {
        rune = this.node.runeAtIndex(this.index);
        if (rune.startOffset === this.index) {
          rune = null;
        }
      } else if (this.node.isRuneAt(this.index - 1)) {
        rune = this.node.runeAtIndex(this.index - 1);
      }
      if (rune) {
        this.index = rune.startOffset;
        if (this.index !== 0) {
          return true;
        }
      }
      contentString = this.node.contentString;
      find = StringHelper.findJumpBreakBackward(contentString, this.index);
      if (find.index === this.index) {
        return false;
      }
      if (rune = this.node.runeAtIndex(find)) {
        if (rune.index !== find) {
          find = rune.endOffset;
        }
      }
      this.index = find;
      return true;
      contentString = this.node.contentString;
      maybe = contentString.slice(0, this.index);
      results = maybe.split(/\b/);
      last = results.pop() || "";
      if (/^\s+$/.test(last)) {
        last = (results.pop() || "") + last;
      }
      length = last.length;
      start = maybe.length - length;
      this.index = start;
      return true;
    };

    COMRichTextAnchor.prototype.forwardWord = function() {
      var MAX, contentString, find, first, maybe, results, rune, start;
      if (this.index > this.node.length) {
        return false;
      }
      this.node.reflow();
      if (this.node.isRuneAt(this.index)) {
        rune = this.node.runeAtIndex(this.index);
      }
      if (rune) {
        this.index = rune.endOffset;
        return true;
      }
      contentString = this.node.contentString;
      find = StringHelper.findJumpBreakForward(contentString, this.index);
      if (find.index === this.index) {
        return false;
      }
      if (rune = this.node.runeAtIndex(find)) {
        if (rune.index !== find) {
          find = rune.endOffset;
        }
      }
      this.index = find;
      return true;
      MAX = null;
      contentString = this.node.contentString;
      maybe = contentString.slice(this.index);
      if (maybe.length === 0) {
        return false;
      }
      results = maybe.split(/\b/);
      first = results.shift() || "";
      while (/^\s+$/.test(first)) {
        first = (results.shift() || "") + first;
        if (results.length === 0) {
          break;
        }
      }
      start = first.length;
      if (start === 0) {
        start = maybe.length;
      }
      this.index += start;
      return true;
    };

    COMRichTextAnchor.prototype.deleteLineBeforeAnchor = function() {
      var cs, hasNewLine, index;
      cs = this.node.contentString;
      index = this.index;
      if (cs[this.index] === "\n") {
        this.index -= 1;
      }
      while (cs[this.index] !== "\n" && this.index > 0) {
        this.index -= 1;
      }
      hasNewLine = cs[this.index] === "\n";
      if (this.index === 0) {
        this.node.removeText(0, index);
      } else {
        this.node.removeText(this.index, index - this.index);
      }
      if (this.index === 0 && !hasNewLine) {
        return false;
      } else {
        return true;
      }
      return true;
    };

    COMRichTextAnchor.prototype.deleteChar = function() {
      var rune;
      if (this.inside && (rune = this.node.runeAtIndex(this.index))) {
        rune.remove();
        this.inside = false;
        return true;
      }
      if (this.index === 0) {
        return false;
      }
      this.node.removeText(this.index - 1, 1);
      return true;
    };

    COMRichTextAnchor.prototype.deleteWord = function() {
      var contentString, index, rune, targetIndex;
      if (this.inside && (rune = this.node.runeAtIndex(this.index))) {
        rune.remove();
        this.inside = false;
        return true;
      }
      if (this.index === 0) {
        return false;
      }
      contentString = this.node.contentString;
      index = this.index;
      targetIndex = StringHelper.findJumpBreakBackward(this.node.contentString, index);
      if (targetIndex === index) {
        return false;
      }
      this.node.removeText(targetIndex, index - targetIndex);
      return true;
    };

    COMRichTextAnchor.prototype.startOfLine = function(option) {
      var contentString, index;
      if (option == null) {
        option = {};
      }
      index = this.index;
      contentString = this.node.contentString;
      if (contentString[this.index - 1] === "\n") {
        this.inside = false;
        return true;
      }
      while (index > 0) {
        if (contentString[index - 1] === "\n" && !this.node.isRuneAt(index - 1)) {
          this.index = index;
          return true;
        }
        index -= 1;
      }
      if (option.begin) {
        this.index = 0;
        return true;
      }
      return false;
    };

    COMRichTextAnchor.prototype.endOfLine = function() {
      var contentString, index, length;
      index = this.index;
      length = this.node.length;
      contentString = this.node.contentString;
      if (contentString[this.index] === "\n") {
        return true;
      }
      while (index < length) {
        if (contentString[index + 1] === "\n" && !this.node.isRuneAt(index + 1)) {
          this.index = index + 1;
          return true;
        }
        index += 1;
      }
      return false;
    };

    COMRichTextAnchor.prototype.isTail = function() {
      return this.index === this.node.length;
    };

    COMRichTextAnchor.prototype.isHead = function() {
      return this.index === 0;
    };

    COMRichTextAnchor.prototype.head = function() {
      this.index = 0;
      return true;
    };

    COMRichTextAnchor.prototype.tail = function() {
      this.index = this.node.length;
      return true;
    };

    COMRichTextAnchor.prototype.trigger = function(option) {
      if (this.triggerChild(option)) {
        return true;
      }
      if (this.triggerSelf(option)) {
        return true;
      }
      return false;
    };

    COMRichTextAnchor.prototype.triggerSelf = function(option) {
      var base;
      if (typeof (base = this.node).trigger === "function" ? base.trigger(option) : void 0) {
        return true;
      }
    };

    COMRichTextAnchor.prototype.triggerChild = function(option) {
      var item, result;
      if (option == null) {
        option = {};
      }
      item = this.node.getChildTextByOffset(this.index);
      if (!item) {
        return false;
      }
      if (item.sortOf("Rune")) {
        if (this.inside) {
          return typeof item.trigger === "function" ? item.trigger() : void 0;
        } else {
          return false;
        }
      }
      if (item.startOffset === this.index && !option.force) {
        return false;
      }
      if (item.endOffset === this.index && !option.force) {
        return false;
      }
      if (item.startOffset === this.index && !item.trigger) {
        item = item.previous();
        if (!item || !option.force) {
          return false;
        }
      }
      return result = (typeof item.trigger === "function" ? item.trigger() : void 0) || false;
    };

    COMRichTextAnchor.prototype.getVisualPosition = function() {
      var centerBorder, cs, end, i, index, item, itemIndex, lastChar, leftBorder, len, next, offset, only, previous, ref, ref1, ref2, rightBorder, start;
      index = this.index;
      previous = null;
      offset = 0;
      cs = this.node.contentString;
      if (index === 0 && cs.length === 0) {
        if ((only = this.node.children[0]) && only.getEmptyBorder) {
          return {
            left: only.getEmptyBorder(),
            right: only.getEmptyBorder(),
            center: null
          };
        } else {
          offset = ((ref = this.node.el) != null ? (ref1 = ref.children) != null ? ref1.length : void 0 : void 0) - 1;
          return {
            left: new COMVisualPosition.COMVisualBorder({
              node: this.node.holder.parentElement,
              offset: offset,
              position: "left"
            }),
            right: new COMVisualPosition.COMVisualBorder({
              node: this.node.holder.parentElement,
              offset: offset,
              position: "right"
            }),
            center: null
          };
        }
      }
      cs = this.node.contentString;
      lastChar = cs[cs.length - 1];
      ref2 = this.node.children || [];
      for (itemIndex = i = 0, len = ref2.length; i < len; itemIndex = ++i) {
        item = ref2[itemIndex];
        previous = this.node.children[itemIndex - 1];
        next = this.node.children[itemIndex + 1];
        start = offset;
        end = offset + item.length;
        if (this.inside && item.sortOf("Rune") && index >= start && index < end) {
          leftBorder = previous != null ? previous.getVisualBorder(previous != null ? previous.length : void 0, "left") : void 0;
          centerBorder = item != null ? item.getVisualBorder(index - start, "inside") : void 0;
          rightBorder = next != null ? next.getVisualBorder(0, "right") : void 0;
          break;
        }
        if (index === 0 && start === 0) {
          leftBorder = null;
          centerBorder = null;
          rightBorder = item.getVisualBorder(0, "right");
          break;
        }
        if (index === start && index === end && item.getEmptyBorder) {
          return {
            left: only.getEmptyBorder(),
            right: only.getEmptyBorder(),
            center: null
          };
        }
        if (index >= start && index < end) {
          leftBorder = item != null ? item.getVisualBorder(index - start, "left") : void 0;
          centerBorder = null;
          rightBorder = item != null ? item.getVisualBorder(index - start, "right") : void 0;
          break;
        }
        if (index === end && !this.inside) {
          if (next && next.isEmpty() && next.getEmptyBorder) {
            leftBorder = next.getEmptyBorder();
            rightBorder = next.getEmptyBorder();
            centerBorder = null;
          } else {
            leftBorder = item.getVisualBorder(item.length, "left");
            centerBorder = null;
            rightBorder = next != null ? next.getVisualBorder(0, "right") : void 0;
          }
          break;
        }
        offset += item.length;
      }
      return new COMVisualPosition({
        left: leftBorder,
        center: centerBorder,
        right: rightBorder
      });
    };

    COMRichTextAnchor.prototype.getCorrespondingBoundary = function() {
      var i, index, item, len, offset, ref, result;
      offset = this.index;
      ref = this.node.children;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        item = ref[index];
        if (offset > item.length) {
          offset -= item.length;
        } else if (offset === item.length) {
          if (item.sortOf("Rune") || this.inside) {
            offset -= item.length;
          } else if (item.noTailingBoundary || this.node.childNoTailingBoundary) {
            offset -= item.length;
          } else {
            result = item.getCorrespondingBoundaryByOffset(offset, {
              right: true
            });
            if (result) {
              return result;
            } else {
              offset -= item.length;
            }
          }
        } else {
          if (offset === 0 && item.sortOf("Rune") && this.inside) {
            return {
              node: item.el,
              type: "include"
            };
          }
          return item.getCorrespondingBoundaryByOffset(offset, {
            right: true
          });
        }
      }
      if (offset === 0) {
        return {
          node: this.node.holder.textNode,
          offset: 0,
          type: "left"
        };
      }
      return null;
    };

    COMRichTextAnchor.prototype.IMEReplace = function(before, after) {
      var cs, index, offset, rune, shouldBe;
      if (this.inside && (rune = this.node.runeAtIndex(this.index))) {
        this.index += rune.contentString.length;
      }
      cs = this.node.contentString;
      shouldBe = cs.slice(this.index - before.length, this.index);
      if (shouldBe !== before) {
        return false;
      }
      offset = 0;
      while (before[offset] && before[offset] === after[offset]) {
        offset += 1;
        continue;
      }
      before = before.slice(offset);
      after = after.slice(offset);
      index = this.index;
      if (before) {
        this.node.removeText(index - before.length, before.length);
      }
      if (after) {
        this.node.insertText(index - before.length, after);
      }
      return true;
    };

    COMRichTextAnchor.prototype.getIMEAnchor = function(string) {
      var cs, end, start;
      cs = this.node.contentString;
      if (cs.slice(this.index - string.length, this.index) === string) {
        start = this.clone();
        start.index = this.index - string.length;
        end = this.clone();
        return {
          start: start,
          end: end
        };
      }
      return {};
    };

    COMRichTextAnchor.prototype.write = function(value) {
      var rune;
      if (value == null) {
        value = null;
      }
      if (!value) {
        return false;
      }
      this.node.reflow();
      if (this.inside && (rune = this.node.runeAtIndex(this.index))) {
        this.index = rune.endOffset;
      }
      if (value instanceof COMNode && value.sortOf("Rune")) {
        this.node.insertRune(this.index, value);
        return true;
      }
      if (typeof value === "string") {
        value = value.replace(/\t/g, "").replace(/\r\n/g, "\n").replace(/[\r\b\f\v\0]/g, "");
      }
      this.node.insertText(this.index, value);
      return true;
    };

    COMRichTextAnchor.prototype.setByDOM = function(node, offset) {
      var fix, i, last, len, ref, ref1, ref2, result, text;
      if (!(typeof node instanceof Text)) {
        node = node.childNodes[offset] || node;
      }
      if (!this.node.el.contains(node)) {
        return null;
      }
      this.node.reflow();
      if (result = (ref = this.node) != null ? ref.getOffsetByDOM(node, offset) : void 0) {
        if (result) {
          this.index = result.index;
          this.inside = result.inside;
          return true;
        }
      }
      if (node === this.node.holder.textNode) {
        last = this.node.last();
        if (last != null ? last.blockTail : void 0) {
          fix = -1;
        } else {
          fix = 0;
        }
        this.index = (((ref1 = this.node.last()) != null ? ref1.endOffset : void 0) || 0) + fix;
        return true;
      }
      ref2 = this.node.children;
      for (i = 0, len = ref2.length; i < len; i++) {
        text = ref2[i];
        result = text.detectTextOffset(node, offset);
        if (result) {
          if (text.sortOf("Rune")) {
            this.index = text.startOffset;
            this.inside = true;
            return true;
          }
          this.index = text.startOffset + result.offset;
          return true;
        }
      }
      return false;
    };

    COMRichTextAnchor.prototype.deleteBetween = function(anchor) {
      var end, endInside, position, rune, start, startInside;
      if (!anchor) {
        return false;
      }
      if (anchor.node !== this.node) {
        return false;
      }
      position = this.compare(anchor);
      if (position === "after") {
        return anchor.deleteBetween(this);
      }
      if (position === "identical") {
        return false;
      }
      if (position === "under") {
        return false;
      }
      if (position === "contain") {
        return false;
      }
      if (position !== "before") {
        throw new Errors.LogicError("position should be before");
      }
      start = this.index;
      end = anchor.index;
      startInside = this.inside;
      endInside = anchor.inside;
      anchor.index = this.index;
      if (endInside) {
        rune = this.node.runeAtIndex(end);
        if (rune) {
          this.node.removeText(end, 1);
        }
      }
      if (end !== start) {
        this.node.removeText(start, end - start);
      }
      if (startInside) {
        rune = this.node.runeAtIndex(start);
        if (rune) {
          this.node.removeText(start, 1);
          this.index -= rune.contentString.length;
          anchor.index -= rune.contentString.length;
        }
      }
      return true;
    };

    COMRichTextAnchor.prototype.equal = function(target) {
      if (!target) {
        return false;
      }
      return target.node === this.node && target.index === this.index && target.inside === this.inside;
    };

    COMRichTextAnchor.prototype.clone = function() {
      var anchor;
      anchor = new COMRichTextAnchor(this.node);
      anchor.index = this.index;
      anchor.inside = this.inside;
      return anchor;
    };

    COMRichTextAnchor.prototype.split = function() {
      var after;
      if (this.index === this.node.length || this.index === 0) {
        return false;
      }
      after = this.node.contentString.slice(this.index);
      this.node.removeText(this.index, this.node.length - this.index);
      this.node.after(new COMRichText(this.node.context, {
        contentString: after
      }));
      return true;
    };

    COMRichTextAnchor.prototype.previousRune = function() {
      var i, item, ref, target;
      this.node.reflow();
      target = null;
      ref = this.node.children;
      for (i = ref.length - 1; i >= 0; i += -1) {
        item = ref[i];
        if (!item.sortOf("Rune")) {
          continue;
        }
        if (item.startOffset < this.index) {
          target = item;
          this.index = item.startOffset;
          this.inside = true;
          return true;
        }
      }
      return false;
    };

    COMRichTextAnchor.prototype.nextRune = function(option) {
      var i, item, len, ref;
      this.node.reflow();
      ref = this.node.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (!item.trigger || item.noTriggerFocus) {
          continue;
        }
        if (item.startOffset > this.index || (item.startOffset === this.index && option.fresh)) {
          this.index = item.startOffset;
          if (item.sortOf("Rune")) {
            this.inside = true;
          }
          return true;
        } else if (item.startOffset === this.index && !this.inside && item.sortOf("Rune")) {
          this.inside = true;
          return true;
        }
      }
      return false;
    };

    COMRichTextAnchor.prototype.previousRune = function() {
      var i, item, ref, target;
      this.node.reflow();
      target = null;
      ref = this.node.children;
      for (i = ref.length - 1; i >= 0; i += -1) {
        item = ref[i];
        if (!item.trigger || item.noTriggerFocus) {
          continue;
        }
        if (item.startOffset < this.index) {
          target = item;
          this.index = item.startOffset;
          if (item.sortOf("Rune")) {
            this.inside = true;
          }
          return true;
        }
      }
      return false;
    };

    COMRichTextAnchor.prototype.afterRune = function(rune) {
      if (rune.parent !== this.node) {
        return false;
      }
      this.node.reflow();
      this.index = rune.startOffset + rune.length;
      return true;
    };

    COMRichTextAnchor.prototype.atRune = function(rune) {
      if (rune.parent !== this.node) {
        return false;
      }
      this.node.reflow();
      this.index = rune.startOffset;
      return this.inside = true;
    };

    COMRichTextAnchor.prototype.beforeRune = function(rune) {
      if (rune.parent !== this.node) {
        return false;
      }
      this.node.reflow();
      this.index = rune.startOffset;
      return true;
    };

    COMRichTextAnchor.prototype.compare = function(anchor) {
      var parentAnchor, position, target, targetAnchor;
      if (anchor instanceof COMAnchor && anchor.node === this.node) {
        if (this.index > anchor.index) {
          return "after";
        } else if (this.index < anchor.index) {
          return "before";
        } else if (this.index === anchor.index) {
          return "identical";
        }
        return null;
      } else if (!(anchor instanceof COMAnchor)) {
        if (anchor.leftMost) {
          if (this.leftMost) {
            return "identical";
          } else {
            return "after";
          }
        } else if (anchor.rightMost) {
          if (this.rightMost) {
            return "identical";
          } else {
            return "before";
          }
        }
        return null;
      }
      position = this.node.compareNodePosition(anchor.node);
      if (!position) {
        return null;
      }
      if (position === "before") {
        return "before";
      }
      if (position === "after") {
        return "after";
      }
      if (position === "identical") {
        throw new Errors.LogicError("can't have anchor has identical path but point to different node");
      }
      if (position === "under") {
        target = this.node;
        while (target.parent !== anchor.node && target) {
          target = target.parent;
        }
        if (!target) {
          throw new Errors.Logic("node.compare returns under but find no common parent");
        }
        parentAnchor = target.parent.anchor.clone();
        parentAnchor.pointAt(target);
        parentAnchor.inside = true;
        if (parentAnchor.index > anchor.index) {
          return "after";
        } else if (parentAnchor.index < anchor.index) {
          return "before";
        } else if (parentAnchor.inside && !anchor.index) {
          return "after";
        } else if (!parentAnchor.inside && anchor.inside) {
          return "before";
        } else {
          return "under";
        }
      }
      if (position === "contain") {
        target = anchor.node;
        while (target && target.parent !== this.node) {
          target = target.parent;
        }
        if (!target) {
          throw new Errors.LogicError("node.compare returns contain but find no common parent");
        }
        targetAnchor = target.parent.anchor.clone();
        targetAnchor.pointAt(target);
        targetAnchor.inside = true;
        if (this.index > targetAnchor.index) {
          return "after";
        } else if (this.index < targetAnchor.index) {
          return "before";
        } else if (this.inside && !targetAnchor.index) {
          return "after";
        } else if (!this.inside && targetAnchor.inside) {
          return "before";
        } else {
          return "contain";
        }
      } else {
        throw new Errros.LogicError("unexpected node compare turn " + position);
      }
    };

    COMRichTextAnchor.prototype.pointAt = function(target) {
      var i, item, len, ref;
      this.node.reflow();
      ref = this.node.children;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (target === item) {
          this.index = target.startOffset;
          if (target.sortOf("Rune")) {
            this.inside = true;
          }
          return true;
        }
      }
      return false;
    };

    COMRichTextAnchor.prototype.getCaretStyle = function() {
      return this.node.caretStyle || null;
    };

    COMRichTextAnchor.prototype.matchingBeforeText = function(string) {
      var cs;
      cs = this.node.contentString;
      return cs.slice(this.index - string.length, this.index) === string;
    };

    COMRichTextAnchor.prototype.getSurroundingWord = function(count) {
      var afterContent, afterCount, beforeContent, beforeCount, char, charReg, cs, index;
      if (count == null) {
        count = 5;
      }
      if (this.inside) {
        return null;
      }
      cs = this.node.contentString;
      index = this.index;
      beforeCount = count;
      afterCount = count;
      charReg = /[a-z'"]/i;
      while (beforeCount > 0) {
        char = cs[index - 1];
        if (char === " ") {
          while (cs[index - 1] === " ") {
            index -= 1;
          }
          beforeCount -= 1;
          continue;
        }
        if (!char || !charReg.test(char)) {
          break;
        }
        index -= 1;
      }
      if (index < 0) {
        index = 0;
      }
      beforeContent = cs.slice(index, this.index);
      index = this.index;
      while (afterCount > 0) {
        char = cs[index];
        if (char === " ") {
          while (cs[index] === " ") {
            index -= 1;
          }
          afterCount -= 1;
          continue;
        }
        if (!char || !charReg.test(char)) {
          break;
        }
        index += 1;
      }
      afterContent = cs.slice(this.index, index);
      return {
        before: beforeContent,
        after: afterContent
      };
    };

    COMRichTextAnchor.prototype.getSurroundingText = function(count) {
      var after, before, cs, start;
      if (count == null) {
        count = 5;
      }
      if (this.inside) {
        return null;
      }
      cs = this.node.contentString;
      start = this.index - count;
      if (start < 0) {
        start = 0;
      }
      before = cs.slice(start, this.index);
      after = cs.slice(this.index, this.index + count);
      return {
        before: before,
        after: after
      };
    };

    return COMRichTextAnchor;

  })(COMAnchor);

  module.exports = COMRichTextAnchor;

}).call(this);

}
GlobalContext.setModule("vincent/com/richTextAnchor.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/root.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMComposer, COMContainer, COMRoot, RootAvoidEmpty,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  COMComposer = require("./composer");

  COMContainer = require("./container");

  COMRoot = (function(superClass) {
    extend(COMRoot, superClass);

    COMRoot.prototype.type = "Root";

    function COMRoot(context, data) {
      var ref;
      this.context = context;
      this.data = data;
      this.appearance = {
        tagName: "div",
        classList: ["com", "com-root"]
      };
      this.withContext = ((ref = this.data) != null ? ref.withContext : void 0) || false;
      this.isRoot = true;
      COMRoot.__super__.constructor.call(this, this.context);
      this.pend();
      this.root = this;
      this.fromJSON(this.data);
    }

    COMRoot.prototype.pend = function() {
      return COMRoot.__super__.pend.call(this);
    };

    COMRoot.prototype.contains = function(node) {
      return Util.topLevel(node) === this;
    };

    COMRoot.prototype.getChildByPath = function(path) {
      var index, node, routes;
      if (path == null) {
        path = null;
      }
      if (!path) {
        return null;
      }
      routes = path.getRoutes();
      if (routes.length === 0) {
        return this;
      }
      routes = routes.slice(0);
      node = this;
      while (true) {
        if (routes.length === 0) {
          return node;
        }
        index = routes.pop();
        if (node && node.children && node.children[index]) {
          node = node.children[index];
          continue;
        } else {
          return null;
        }
      }
    };

    COMRoot.prototype.render = function(rc) {
      COMRoot.__super__.render.call(this, rc, {
        recursive: true,
        selfless: true
      });
      rc.el = this.el;
      this.afterRender();
      if (!this.rc.interactive) {
        return this.el.classList.add("readonly");
      } else {
        return this.el.classList.remove("readonly");
      }
    };

    COMRoot.prototype._attach = function(node) {
      COMRoot.__super__._attach.call(this, node);
      return node.root = this;
    };

    COMRoot.prototype.toJSON = function(option) {
      var json;
      json = COMRoot.__super__.toJSON.call(this, option);
      if (!json) {
        return null;
      }
      json.type = "Root";
      return json;
    };

    COMRoot.prototype.fromJSON = function(json) {
      var result;
      if (json == null) {
        json = {};
      }
      if (json.type !== "Root") {
        return;
      }
      result = COMRoot.__super__.fromJSON.call(this, json);
      return result;
    };

    return COMRoot;

  })(COMContainer);

  RootAvoidEmpty = (function(superClass) {
    extend(RootAvoidEmpty, superClass);

    function RootAvoidEmpty() {
      return RootAvoidEmpty.__super__.constructor.apply(this, arguments);
    }

    RootAvoidEmpty.prototype.type = "Root";

    RootAvoidEmpty.prototype.exec = function() {
      var ct, ref;
      if (((ref = this.target.children) != null ? ref.length : void 0) > 0) {
        return false;
      }
      ct = this.context.createElement("Contents", {
        children: [
          this.context.createElement("RichText", {
            contentString: ""
          })
        ]
      });
      this.target.append(ct);
      return true;
    };

    return RootAvoidEmpty;

  })(COMComposer);

  COMRoot.RootAvoidEmpty = RootAvoidEmpty;

  module.exports = COMRoot;

}).call(this);

}
GlobalContext.setModule("vincent/com/root.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/rune.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMContainer, COMDecorationPolicy, COMRune, COMText, COMTrapPolicy, COMVisualPosition, Decoration, DraggableTrait, Trait,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  COMContainer = require("./container");

  COMTrapPolicy = require("./trapPolicy");

  COMDecorationPolicy = require("./decorationPolicy");

  Decoration = require("./decoration");

  Trait = require("./helper/trait");

  COMVisualPosition = require("./visualPosition");

  COMText = require("./text");

  COMRune = (function(superClass) {
    extend(COMRune, superClass);

    COMRune.RunePlaceBegin = "\uE1F5";

    COMRune.RunePlaceEnd = "\uE1F6";

    COMRune.RunePurifyHolder = "\uE1F7";

    COMRune.purifyContentString = function(string, option) {
      var replacement;
      if (option == null) {
        option = {};
      }
      replacement = " ";
      if (option.useHolder) {
        replacement = this.RunePurifyHolder;
      }
      return string.replace(new RegExp("\uE1F5[^\uE1F5\uE1F6]*\uE1F6", "g"), function(content) {
        return content.replace(/(?:.|\n)/ig, replacement);
      });
    };

    COMRune.prototype.type = "Rune";

    COMRune.prototype.isEmpty = function() {
      return false;
    };

    function COMRune(context, data) {
      this.context = context;
      this.data = data;
      COMRune.__super__.constructor.call(this, this.context, this.data);
      this.editor = this.context.editor;
      this.rightCaretPriority = 0;
      this.leftCaretPriority = 0;
      this.parentAppearance = [];
      this.decorations = [];
      this.trapPolicy = new COMTrapPolicy(this).behave({
        trap: "ignore"
      });
      this.decorationPolicy = new COMDecorationPolicy(this).behave({
        behavior: "singular"
      });
      this.context.runeCache.assign(this);
      this.__defineGetter__("length", function() {
        return this.cid.toString().length + 2;
      });
      this.__defineGetter__("contentString", function() {
        return COMRune.RunePlaceBegin + this.cid + COMRune.RunePlaceEnd;
      });
      this.triggerByClick = this.triggerByClick.bind(this);
      this.layout = "inline";
      new DraggableTrait(this);
    }

    COMRune.prototype.onRootDispel = function() {
      this.context.runeCache.release(this);
      return COMRune.__super__.onRootDispel.call(this);
    };

    COMRune.prototype.onRootAvailable = function() {
      this.context.runeCache.reuse(this);
      return COMRune.__super__.onRootAvailable.call(this);
    };

    COMRune.prototype.render = function(rc, option) {
      var dec, i, j, len, len1, ref, ref1;
      COMRune.__super__.render.call(this, rc, option);
      ref = this.previousDecorations || [];
      for (i = 0, len = ref.length; i < len; i++) {
        dec = ref[i];
        dec.cancel(this.el);
      }
      ref1 = this.decorations;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        dec = ref1[j];
        dec.apply(this.el);
      }
      return this.handleDragElement(this.el);
    };

    COMRune.prototype.triggerByClick = function(e) {
      if (this.trigger) {
        if (this.trigger()) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }
    };

    COMRune.prototype.toProtocolDatas = function() {
      return [
        {
          type: this.type,
          data: this
        }
      ];
    };

    COMRune.prototype.setDecorations = function(decorations) {
      var ref;
      if (this.previousDecorations == null) {
        this.previousDecorations = [];
      }
      (ref = this.previousDecorations).push.apply(ref, this.decorations || []);
      return this.context.operate(new Decoration.ChangeDecorationOperation(this.context, this, {
        decorations: decorations
      }));
    };

    COMRune.prototype.detectTextOffset = function(el) {
      if (this.el.contains(el || this.el === el)) {
        return {
          offset: 0,
          part: this.el
        };
      }
    };

    COMRune.prototype.getVisualBorder = function(offset, relativeToCursor) {
      var i, index, item, len, position, priority, ref, targetIndex;
      targetIndex = 0;
      ref = this.el.parentElement.childNodes;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        item = ref[index];
        if (item === this.el) {
          targetIndex = index;
          break;
        }
      }
      position = "left";
      if (offset === this.length || relativeToCursor === "left") {
        position = "right";
      }
      if (relativeToCursor === "inside") {
        position = "contain";
      }
      if (relativeToCursor === "right") {
        priority = this.leftCaretPriority || 0;
      } else if (relativeToCursor === "left") {
        priority = this.rightCaretPriority || 0;
      } else {
        priority = 0;
      }
      return new COMVisualPosition.COMVisualBorder({
        node: this.el.parentElement,
        offset: targetIndex,
        position: position,
        priority: priority
      });
    };

    COMRune.prototype.getCorrespondingBoundaryByOffset = function(offset, inside) {
      var i, index, item, len, ref, targetIndex;
      ref = this.el.parentElement.childNodes;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        item = ref[index];
        if (item === this.el) {
          targetIndex = index;
          break;
        }
      }
      if (offset === 0) {
        return {
          node: this.el.parentElement,
          offset: targetIndex,
          via: "RuneBefore"
        };
      } else if (offset < this.length || inside) {
        return {
          node: this.el,
          type: "include",
          via: "RuneInclude"
        };
      } else {
        return {
          node: this.el.parentElement,
          offset: targetIndex + 1,
          via: "RuneAfter"
        };
      }
      return null;
    };

    COMRune.prototype.slice = function() {
      return this.clone();
    };

    COMRune.prototype.clone = function() {
      return this.context.createElement(this.type, this.toJSON());
    };

    COMRune.prototype.insertText = function(start, value) {
      if (start === 0) {
        return this.before(new COMText(this.context, {
          contentString: value
        }));
      }
      if (start > 0) {
        return this.after(new COMText(this.context, {
          contentString: value
        }));
      }
      return false;
    };

    COMRune.prototype.toHumanString = function() {
      return "";
    };

    COMRune.prototype.removeText = function(start, length) {
      this.remove();
      return true;
    };

    COMRune.prototype.toHumanString = function() {
      return "<Rune " + this.type + ">";
    };

    return COMRune;

  })(COMContainer);

  DraggableTrait = (function(superClass) {
    extend(DraggableTrait, superClass);

    function DraggableTrait() {
      return DraggableTrait.__super__.constructor.apply(this, arguments);
    }

    DraggableTrait.prototype.enableDragBehavior = function(option) {
      if (option == null) {
        option = {};
      }
      if (this.dragBehaviorRegistered) {
        return;
      }
      this.dragBehaviorRegistered = true;
      return this.dragOption = option;
    };

    DraggableTrait.prototype.handleDragElement = function(el) {
      if (!this.dragBehaviorRegistered) {
        return;
      }
      if (el.runeDragAdded) {
        return;
      }
      el.runeDragAdded = true;
      el.dragSupport = "support";
      el.dragBehavior = "auto";
      return el.addEventListener("user-draginit", (function(_this) {
        return function(e) {
          var i, item, len, ref, ref1, results;
          ref = _this.getDragProtocols();
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            item = ref[i];
            results.push((ref1 = e.detail) != null ? typeof ref1.addProtocol === "function" ? ref1.addProtocol(item.type, item.data) : void 0 : void 0);
          }
          return results;
        };
      })(this));
    };

    DraggableTrait.prototype.getDragProtocols = function() {
      var base, extra, result;
      result = [
        {
          type: "Rune",
          data: this
        }
      ];
      extra = (typeof (base = this.dragOption).getDragProtocol === "function" ? base.getDragProtocol(this) : void 0) || [];
      return extra.concat(result);
    };

    return DraggableTrait;

  })(Trait);

  module.exports = COMRune;

}).call(this);

}
GlobalContext.setModule("vincent/com/rune.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/runeCache.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMRuneCache;

  COMRuneCache = (function() {
    function COMRuneCache(context) {
      var i, index, ref, zeros;
      this.context = context;
      this.cid = 0;
      this.cidWidth = 8;
      this.instances = {};
      this.prefixMap = {};
      zeros = "";
      for (index = i = 0, ref = this.cidWidth; 0 <= ref ? i < ref : i > ref; index = 0 <= ref ? ++i : --i) {
        this.prefixMap[index] = zeros;
        zeros += "0";
      }
      this.trashes = {};
    }

    COMRuneCache.prototype.release = function(rune) {
      if (!this.trashes[rune.cid]) {
        return this.trashes[rune.cid] = rune;
      }
    };

    COMRuneCache.prototype.reuse = function(rune) {
      delete this.trashes[rune.cid];
      if (!this.instances[rune.cid]) {
        return this.instances[rune.cid] = rune;
      }
    };

    COMRuneCache.prototype.gc = function() {
      var prop, ref, results, rune;
      ref = this.trashes;
      results = [];
      for (prop in ref) {
        rune = ref[prop];
        delete this.instances[rune.cid];
        results.push(delete this.trashes[rune.cid]);
      }
      return results;
    };

    COMRuneCache.prototype.allocate = function() {
      var append, id;
      id = this.cid++;
      id = id.toString();
      append = this.cidWidth - 2 - id.length;
      id = this.prefixMap[append] + id;
      return id;
    };

    COMRuneCache.prototype.assign = function(node) {
      if (typeof node.cid !== "number") {
        node.cid = this.allocate();
      }
      this.instances[node.cid] = node;
      return node.cid;
    };

    COMRuneCache.prototype.cloneByCid = function(cid) {
      var item;
      if (!this.instances[cid]) {
        return null;
      }
      item = this.instances[cid];
      return item.clone();
    };

    return COMRuneCache;

  })();

  module.exports = COMRuneCache;

}).call(this);

}
GlobalContext.setModule("vincent/com/runeCache.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/selection.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMCursor, COMSelection, Errors, WalkerRootFirst,
    slice = [].slice;

  COMCursor = require("./cursor");

  WalkerRootFirst = (require("./helper/walker")).WalkerRootFirst;

  Errors = require("./errors");

  COMSelection = (function() {
    function COMSelection(context, cursor) {
      this.context = context;
      this.baseCursor = this.context.createCursor({
        isShadow: true,
        name: "baseCursor"
      });
      this.extentCursor = cursor;
      this.__defineGetter__("baseAnchor", function() {
        return this.baseCursor.anchor;
      });
      this.__defineGetter__("extentAnchor", function() {
        return this.extentCursor.anchor;
      });
    }

    COMSelection.prototype.fromAnchor = function(baseAnchor, extentAnchor) {
      this.baseCursor.pointAtAnchor(baseAnchor);
      this.extentCursor.pointAtAnchor(extentAnchor);
      if (!this.isActive) {
        this.collapseToCursor();
      }
      return true;
    };

    COMSelection.prototype.fromDOMRegion = function(base, extent) {
      if (!this.baseCursor.setCursorByDOMRegion(base)) {
        return false;
      }
      if (!this.extentCursor.setCursorByDOMRegion(extent)) {
        return false;
      }
      if (!this.isActive) {
        this.collapseToCursor();
      }
      return true;
    };

    COMSelection.prototype.activate = function() {
      if (this.isActive) {
        return;
      }
      this.isActive = true;
      return this.collapseToCursor();
    };

    COMSelection.prototype.deactivate = function() {
      if (!this.isActive) {
        return;
      }
      return this.isActive = false;
    };

    COMSelection.prototype.cancel = function() {
      this.collapseToCursor();
      return this.deactivate();
    };

    COMSelection.prototype.collapseToBegin = function() {
      var position, ref, swap;
      position = (ref = this.baseAnchor) != null ? ref.compare(this.extentAnchor) : void 0;
      if (!position) {
        return false;
      }
      if (position === "after") {
        swap = true;
      }
      if (swap) {
        return this.collapseToCursor(this.extentCursor);
      } else {
        return this.collapseToCursor(this.baseCursor);
      }
    };

    COMSelection.prototype.collapseToEnd = function() {
      var position, ref, swap;
      position = (ref = this.baseAnchor) != null ? ref.compare(this.extentAnchor) : void 0;
      if (!position) {
        return false;
      }
      if (position === "after") {
        swap = true;
      }
      if (swap) {
        return this.collapseToCursor(this.baseCursor);
      } else {
        return this.collapseToCursor(this.extentCursor);
      }
    };

    COMSelection.prototype.collapseToCursor = function(cursor) {
      if (cursor == null) {
        cursor = this.extentCursor;
      }
      if (!cursor || !cursor.anchor) {
        return false;
      }
      this.baseCursor.pointAtAnchor(cursor.anchor);
      if (cursor !== this.extentCursor) {
        this.extentCursor.pointAtAnchor(cursor.anchor);
      }
      return true;
    };

    COMSelection.prototype.baseAction = function() {
      var args, ref;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref = this.baseCursor).conduct.apply(ref, args);
    };

    COMSelection.prototype.extentAction = function() {
      var args, ref;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref = this.extentCursor).conduct.apply(ref, args);
    };

    COMSelection.prototype.clear = function() {
      this.baseAnchor = null;
      return this.extentAnchor = null;
    };

    COMSelection.prototype.isValid = function() {
      var ref, ref1;
      return (((ref = this.baseAnchor) != null ? ref.node.root : void 0) != null) && (((ref1 = this.extentAnchor) != null ? ref1.node.root : void 0) != null);
    };

    COMSelection.prototype.isCollapsed = function() {
      if (!this.baseAnchor || !this.extentAnchor) {
        return true;
      }
      return this.baseAnchor.node === this.extentAnchor.node && this.baseAnchor.index === this.extentAnchor.index && (this.baseAnchor.inside != null) === (this.extentAnchor.inside != null);
    };

    COMSelection.prototype.debug = function() {
      return this.baseAnchor.node.type + ":" + this.baseAnchor.index + "~" + this.extentAnchor.node.type + ":" + this.extentAnchor.index;
    };

    COMSelection.prototype.selectAll = function() {
      var first, last, walker;
      this.activate();
      walker = new WalkerRootFirst(this.context);
      if (!walker.first(function(item) {
        return item.anchor;
      })) {
        return false;
      }
      first = walker.node;
      if (!walker.last(function(item) {
        return item.anchor;
      })) {
        return false;
      }
      last = walker.node;
      this.fromAnchor(first.anchor, last.anchor);
      this.baseCursor.conduct("head");
      return this.extentCursor.conduct("tail");
    };

    COMSelection.prototype.getSelectedCollection = function() {
      var anchor, beginAnchor, beginAnchorOrigin, beginNode, beginPosition, endAnchor, endAnchorOrigin, endNode, endPosition, position, result, results, swap, walker;
      if (!this.isValid()) {
        return null;
      }
      position = this.baseAnchor.compare(this.extentAnchor);
      if (position === "after") {
        swap = true;
      }
      if (!swap) {
        beginNode = this.baseAnchor.node;
        endNode = this.extentAnchor.node;
        beginAnchor = this.baseAnchor.clone();
        endAnchor = this.extentAnchor.clone();
        beginAnchorOrigin = this.baseAnchor;
        endAnchorOrigin = this.extentAnchor;
      } else {
        beginNode = this.extentAnchor.node;
        endNode = this.baseAnchor.node;
        beginAnchor = this.extentAnchor.clone();
        endAnchor = this.baseAnchor.clone();
        beginAnchorOrigin = this.extentAnchor;
        endAnchorOrigin = this.baseAnchor;
      }
      walker = new WalkerRootFirst(this.context);
      walker.setNode(beginNode);
      results = [];
      while (true) {
        if (!walker.node) {
          break;
        }
        anchor = walker.node.anchor.clone();
        anchor.head();
        beginPosition = anchor.compare(endAnchor);
        anchor.tail();
        endPosition = anchor.compare(endAnchor);
        position = walker.node.compareNodePosition(endNode);
        if (beginPosition === "identical" || beginPosition === "after") {
          if (beginPosition === "identical") {
            results.push(walker.node);
          }
          break;
        }
        if (endPosition === "before") {
          results.push(walker.node);
          walker.skipChildOnce = true;
          if (!walker.next((function(item) {
            return item.anchor;
          }))) {
            break;
          }
          continue;
        }
        if (endPosition === "identical") {
          results.push(walker.node);
          break;
        }
        if (endPosition === "after") {
          results.push(walker.node);
          break;
        }
        if (endPosition === "under" || endPosition === "contain") {
          results.push(walker.node);
          break;
        }
        throw new Errors.LogicError("anchor compare returns unexpected value " + beginPosition + " " + endPosition);
      }
      result = {
        beginNode: beginNode,
        endNode: endNode,
        beginAnchor: beginAnchor,
        endAnchor: endAnchor,
        nodes: results,
        beginAnchorOrigin: beginAnchorOrigin,
        endAnchorOrigin: endAnchorOrigin
      };
      return result;
    };

    COMSelection.prototype.copySelectedNodes = function() {
      var collection, result;
      collection = this.getSelectedCollection();
      result = this.context.root.slice({
        left: collection.beginAnchor,
        right: collection.endAnchor,
        selection: true
      });
      return result;
    };

    COMSelection.prototype.cutSelectedNodes = function() {
      var result;
      result = this.copySelectedNodes();
      this.removeSelectedNodes();
      return result;
    };

    COMSelection.prototype.removeSelectedNodes = function() {
      var collection, head, i, len, node, ref, tail;
      collection = this.getSelectedCollection();
      if (collection.beginNode === collection.endNode) {
        collection.beginAnchor.deleteBetween(collection.endAnchor);
      } else {
        ref = collection.nodes;
        for (i = 0, len = ref.length; i < len; i++) {
          node = ref[i];
          if (node === collection.beginNode) {
            tail = collection.beginAnchor.clone();
            tail.tail();
            collection.beginAnchor.deleteBetween(tail);
          } else if (node === collection.endNode) {
            head = collection.endAnchor.clone();
            head.head();
            head.deleteBetween(collection.endAnchor);
          } else {
            node.remove();
          }
        }
      }
      collection.beginNode.anchor.fromJSON(collection.beginAnchor.toJSON());
      this.extentCursor.pointAtAnchor(collection.beginAnchor);
      this.collapseToCursor();
      this.cancel();
      return collection;
    };

    return COMSelection;

  })();

  module.exports = COMSelection;

}).call(this);

}
GlobalContext.setModule("vincent/com/selection.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/spell.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMSpell, COMText, Errors,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  COMText = require("./text");

  Errors = require("./errors");

  COMSpell = (function(superClass) {
    extend(COMSpell, superClass);

    COMSpell.prototype.test = function() {
      return false;
    };

    COMSpell.prototype.type = "Spell";

    COMSpell.prototype.isSpell = true;

    function COMSpell(context, option1) {
      this.context = context;
      this.option = option1 != null ? option1 : {};
      this.decorationMaintainers = [];
      COMSpell.__super__.constructor.call(this, this.context, this.option);
      this.decorationPolicy.behave({
        behavior: "singular"
      });
    }

    COMSpell.prototype.addDecorationMaintainer = function(maintainer) {
      return this.decorationMaintainers.push(maintainer);
    };

    COMSpell.prototype.toNormalTextInPlace = function() {
      return this.replaceBy(new COMText(this.context, {
        contentString: this.contentString
      }));
    };

    COMSpell.prototype.render = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return COMSpell.__super__.render.apply(this, args);
    };

    COMSpell.prototype.setDecorations = function(decs) {
      var _decs, cs, dm, i, len, ref;
      if (this.decorationPolicy.behavior === "break") {
        decs = [];
      }
      if (decs == null) {
        decs = [];
      }
      cs = this.contentString;
      ref = this.decorationMaintainers;
      for (i = 0, len = ref.length; i < len; i++) {
        dm = ref[i];
        _decs = dm.compute(cs);
        decs.push.apply(decs, _decs);
      }
      return COMSpell.__super__.setDecorations.call(this, decs);
    };

    COMSpell.prototype.castToText = function(text, start, end) {
      var last, middle, ref;
      if (end < start) {
        throw new Errors.LogicError("end should larger that start");
      }
      middle = text.splitInPlace(start);
      if (!middle) {
        middle = text;
      }
      last = middle.splitInPlace(end - start) || null;
      middle.replaceBy(this);
      this.contentString = middle.contentString;
      this.compose();
      this.dirty = true;
      if ((ref = this.parent) != null) {
        ref.dirty = true;
      }
      return last;
    };

    COMSpell.prototype.compose = function() {
      this.setDecorations();
      return false;
    };

    COMSpell.prototype.toJSON = function(option) {
      var json;
      json = COMSpell.__super__.toJSON.call(this, option);
      if (!json) {
        return null;
      }
      json.spell = true;
      return json;
    };

    return COMSpell;

  })(COMText);

  module.exports = COMSpell;

}).call(this);

}
GlobalContext.setModule("vincent/com/spell.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/text.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMDecorationPolicy, COMNode, COMText, COMVisualPosition, Decoration, InsertTextOperation, Operation, RemoveTextOperation,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  COMNode = require("./node");

  COMVisualPosition = require("./visualPosition");

  COMDecorationPolicy = require("./decorationPolicy");

  Decoration = require("./decoration");

  Operation = require("./operation");

  COMText = (function(superClass) {
    extend(COMText, superClass);

    COMText.prototype.type = "Text";

    COMText.prototype.toString = function() {
      return this.contentString;
    };

    COMText.prototype.isEmpty = function() {
      return this.contentString.length === 0;
    };

    COMText.prototype.toHumanString = function() {
      return this.toString();
    };

    function COMText(context, data) {
      var ref;
      this.context = context;
      this.data = data != null ? data : {};
      this.skipDirtyCheck = true;
      this.contentString = ((ref = this.data.contentString) != null ? typeof ref.toString === "function" ? ref.toString() : void 0 : void 0) || "";
      this.decorationPolicy = new COMDecorationPolicy(this).behave({
        behavior: "default"
      });
      this.decorationMaintainers = [];
      this.decorations = [];
      this.editIndex = 0;
      this.__defineGetter__("holder", function() {
        if (!this.cache) {
          return null;
        }
        if (!this.cache.holder) {
          this.cache.holder = document.createElement("span");
          this.cache.holder.innerHTML = " ";
          this.cache.holder.classList.add("com-text-holder");
        }
        return this.cache.holder;
      });
      this.__defineGetter__("partials", function() {
        return this.cache.partial || [];
      });
      this.__defineSetter__("partials", function(value) {
        return this.cache.partial = value;
      });
      if (this.appearance == null) {
        this.appearance = {
          tagName: "span",
          classList: ["com", "com-text"]
        };
      }
      this.__defineGetter__("withHolder", (function(_this) {
        return function() {
          return _this._withHolder;
        };
      })(this));
      this.__defineSetter__("withHolder", (function(_this) {
        return function(v) {
          if (v !== _this._withHolder) {
            _this.dirty = true;
          }
          _this._withHolder = v;
          return _this._withHolder;
        };
      })(this));
      this.withHolder = this.data.withHolder;
      COMText.__super__.constructor.call(this, this.context);
      this.__defineGetter__("length", function() {
        return this.contentString.length;
      });
    }

    COMText.prototype.mergeInPlace = function(target) {
      target.remove();
      this.insertText(this.contentString.length, target.contentString);
      return true;
    };

    COMText.prototype.splitInPlace = function(index, option) {
      var next;
      if (option == null) {
        option = {};
      }
      if (index >= this.contentString.length) {
        return null;
      }
      if (index === 0) {
        return null;
      }
      next = this.contentString.slice(index);
      this.removeText(index);
      next = new COMText(this.context, {
        contentString: next
      });
      this.after(next);
      return next;
    };

    COMText.prototype.render = function(rc) {
      var container, content, dec, frag, i, index, j, len, len1, partial, property, ref, ref1, ref2, ref3, value;
      COMText.__super__.render.call(this, rc, {
        force: true
      });
      this.computePartials();
      frag = document.createDocumentFragment();
      ref = this.partials;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        partial = ref[index];
        partial.el = document.createElement("span");
        partial.el.classList.add("com-text-part");
        partial.el.com = this;
        partial.el.comText = this;
        partial.el.comPartial = partial;
        content = partial.content;
        if (index === this.partials.length - 1 && this.blockTail && content.slice(-1) === "\n") {
          if (this.keepNewlineSpace) {
            content = content.slice(0, -1) + " ";
          } else {
            content = content.slice(0, -1) + "";
          }
        }
        partial.textNode = document.createTextNode(content.toString());
        partial.el.appendChild(partial.textNode);
        ref1 = partial.decorations;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          dec = ref1[j];
          dec.apply(partial.el);
        }
        frag.appendChild(partial.el);
      }
      if (this.withHolder) {
        frag.appendChild(this.holder);
      }
      ref2 = this.domProperty || {};
      for (property in ref2) {
        value = ref2[property];
        if ((ref3 = this.el) != null) {
          ref3.setAttribute(property, value);
        }
      }
      container = this.specifyTextContainer();
      container.innerHTML = "";
      return container.appendChild(frag);
    };

    COMText.prototype.specifyTextContainer = function() {
      return this.el;
    };

    COMText.prototype.computePartials = function() {
      var cut, cuts, dec, decorations, i, index, item, j, k, l, len, len1, len2, len3, len4, m, nextCut, nextDec, part, partials, ref;
      partials = [];
      cuts = [0, this.contentString.length];
      ref = this.decorations;
      for (i = 0, len = ref.length; i < len; i++) {
        dec = ref[i];
        for (index = j = 0, len1 = cuts.length; j < len1; index = ++j) {
          item = cuts[index];
          if (item === dec.start) {
            break;
          }
          if (item < dec.start) {
            continue;
          } else {
            cuts.splice(index, 0, dec.start);
            break;
          }
        }
        for (index = k = 0, len2 = cuts.length; k < len2; index = ++k) {
          item = cuts[index];
          if (item === dec.end) {
            break;
          }
          if (item < dec.end) {
            continue;
          } else {
            cuts.splice(index, 0, dec.end);
          }
        }
      }
      decorations = this.decorations.slice();
      for (index = l = 0, len3 = cuts.length; l < len3; index = ++l) {
        cut = cuts[index];
        nextCut = cuts[index + 1];
        if (!nextCut) {
          break;
        }
        part = {
          decorations: [],
          content: this.contentString.slice(cut, nextCut)
        };
        nextDec = [];
        for (m = 0, len4 = decorations.length; m < len4; m++) {
          dec = decorations[m];
          if (dec.end <= cut) {
            continue;
          }
          nextDec.push(dec);
          if (dec.start >= nextCut) {
            continue;
          }
          part.decorations.push(dec);
        }
        decorations = nextDec;
        partials.push(part);
      }
      this.partials = partials;
      return this.partials;
    };

    COMText.prototype.computePartialsBad = function() {
      var c, combination, decDirty, decRef, decorations, i, index, lastCombination, lastDecRef, partStart, partials, ref;
      partials = [];
      partStart = 0;
      decorations = this.decorations.slice();
      lastCombination = "";
      lastDecRef = [];
      for (index = i = 0, ref = this.contentString.length; 0 <= ref ? i < ref : i > ref; index = 0 <= ref ? ++i : --i) {
        combination = "";
        decDirty = false;
        decRef = [];
        decorations = decorations.filter(function(dec, decIndex) {
          if (index < dec.start) {
            return true;
          } else if (index >= dec.end) {
            return false;
          }
          combination += dec.mid + "-";
          return decRef.push(dec);
        });
        if (combination !== lastCombination && index > 0) {
          c = this.contentString.slice(partStart, index);
          partials.push({
            content: this.contentString.slice(partStart, index),
            decorations: lastDecRef
          });
          partStart = index;
        }
        lastCombination = combination;
        lastDecRef = decRef;
      }
      if (partStart < this.contentString.length) {
        partials.push({
          content: this.contentString.slice(partStart, this.contentString.length),
          decorations: lastDecRef || []
        });
      }
      this.partials = partials;
      return this.partials;
    };

    COMText.prototype.insertText = function(start, value) {
      var result;
      if (typeof start !== "number") {
        Logger.error("cant insert text at " + start);
        return false;
      }
      if (!value) {
        Logger.error("insert text request value provided");
        return false;
      }
      result = this.context.operate(new InsertTextOperation(this.context, this, {
        start: start,
        value: value
      }));
      if (result) {
        this.pend();
        return true;
      }
      return false;
    };

    COMText.prototype.setDecorations = function(decorations) {
      return this.context.operate(new Decoration.ChangeDecorationOperation(this.context, this, {
        decorations: decorations
      }));
    };

    COMText.prototype.removeText = function(start, length) {
      var result;
      if (typeof start !== "number") {
        return false;
      }
      if (typeof length !== "number") {
        length = this.contentString.length - start;
      }
      if (start >= this.contentString.length) {
        return false;
      }
      if (start + length > this.contentString.length) {
        return false;
      }
      result = this.context.operate(new RemoveTextOperation(this.context, this, {
        start: start,
        length: length
      }));
      if (result) {
        this.pend();
        return true;
      }
      return false;
    };

    COMText.prototype.getVisualBorder = function(index, relativeToCursor) {
      var content, holderIndex, i, last, lastChar, len, nodes, offset, part, partIndex, partialOffset, position, previous, priority, ref, target;
      if (this.dirty && !this.skipDirtyCheck) {
        Logger.error("dirty query", this.root, this, this.dirty, this.context, this.rc.id, this.cache.rev, this.rev);
        throw new Error("shouldn't get caret position when dirty");
      }
      if (relativeToCursor !== "left" && relativeToCursor !== "right") {
        relativeToCursor = "left";
      }
      offset = 0;
      target = null;
      if (relativeToCursor !== "left" && relativeToCursor !== "right") {
        return true;
      }
      if (this.blockTail && index === this.contentString.length - 1) {
        part = this.partials[this.partials.length - 1];
        content = part.content;
        lastChar = content[content.length - 1];
        if (lastChar === "\n" && this.blockTail && this.withHolder) {
          if (relativeToCursor === "right") {
            nodes = [].slice.call(this.holder.parentElement.childNodes);
            holderIndex = nodes.indexOf(this.holder);
            return new COMVisualPosition.COMVisualBorder({
              node: this.holder.parentElement,
              offset: holderIndex,
              position: "left",
              priority: this.leftCaretPriority
            });
          }
        }
      }
      ref = this.partials;
      for (partIndex = i = 0, len = ref.length; i < len; partIndex = ++i) {
        part = ref[partIndex];
        if (offset === index) {
          if (relativeToCursor === "left") {
            previous = this.partials[partIndex - 1];
            if (previous) {
              target = previous;
              partialOffset = target.content.length - 1;
              position = "right";
              break;
            } else {
              target = part;
              partialOffset = 0;
              position = "left";
              break;
            }
          } else {
            target = part;
            partialOffset = 0;
            position = "left";
            break;
          }
        }
        if (offset + part.content.length > index) {
          partialOffset = index - offset;
          target = part;
          position = "left";
          break;
        }
        offset += part.content.length;
      }
      if (offset === index && !target) {
        if (offset === 0) {
          if (this.withHolder && this.holder && this.holder.parentElement) {
            nodes = [].slice.call(this.holder.parentElement.childNodes);
            holderIndex = nodes.indexOf(this.holder);
            return new COMVisualPosition.COMVisualBorder({
              node: this.holder.parentElement,
              offset: holderIndex,
              position: "left",
              priority: this.leftCaretPriority || 0
            });
          }
        }
        target = this.partials[this.partials.length - 1];
        if (relativeToCursor === "right") {
          if (target) {
            partialOffset = target.content.length - 1;
            position = "right";
          }
        } else if (relativeToCursor === "left") {
          if (this.holder && this.holder.parentElement && this.withHolder) {
            nodes = [].slice.call(this.holder.parentElement.childNodes);
            holderIndex = nodes.indexOf(this.holder);
            return new COMVisualPosition.COMVisualBorder({
              node: this.holder.parentElement,
              offset: holderIndex,
              position: "left",
              priority: this.leftCaretPriority || 0
            });
          } else {
            last = this.partials[this.partials.length - 1];
            return new COMVisualPosition.COMVisualBorder({
              node: last.textNode,
              offset: last.textNode.length - 1,
              position: "right",
              priority: this.leftCaretPriority || 0
            });
          }
        } else if (target) {
          partialOffset = target.content.length - 1;
          position = "right";
        }
      }
      if (!target) {
        return null;
      }
      if (position === "left") {
        priority = this.leftCaretPriority || 0;
      } else {
        priority = this.rightCaretPriority || 0;
      }
      return new COMVisualPosition.COMVisualBorder({
        node: target.textNode,
        offset: partialOffset,
        position: position,
        priority: priority
      });
    };

    COMText.prototype.getCorrespondingBoundaryByOffset = function(index, option) {
      var char, i, len, offset, part, partialOffset, ref, target;
      if (option == null) {
        option = {};
      }
      if (this.dirty && !this.skipDirtyCheck) {
        Logger.error("dirty query", this.root, this, this.dirty, this.context, this.rc.id, this.cache.rev, this.rev);
        throw new Error("shouldn't get caret position when dirty");
      }
      offset = 0;
      ref = this.partials;
      for (i = 0, len = ref.length; i < len; i++) {
        part = ref[i];
        offset += part.content.length;
        if (index < offset) {
          target = part;
          partialOffset = index - (offset - part.content.length);
          break;
        }
      }
      if (index === offset) {
        target = this.partials[this.partials.length - 1] || null;
        if (!target) {
          return null;
        }
        partialOffset = target.content.length;
        return {
          node: target.textNode,
          offset: partialOffset,
          via: "Text"
        };
      }
      if (!target) {
        return null;
      }
      char = target.textNode.textContent[partialOffset - 1];
      if (partialOffset > 0 && option.right && char !== "\n") {
        return {
          node: target.textNode,
          offset: partialOffset - 1,
          via: "Text",
          type: "right"
        };
      } else {
        return {
          node: target.textNode,
          offset: partialOffset,
          via: "Text"
        };
      }
      return null;
    };

    COMText.prototype.detectTextOffset = function(textNode, index) {
      var fix, i, len, offset, part, partIndex, ref, ref1;
      if (this.dirty && !this.skipDirtyCheck) {
        throw new Error("shouldn't detect textoffset when dirty");
      }
      offset = 0;
      if (textNode === ((ref = this.holder) != null ? ref.childNodes[0] : void 0)) {
        if (this.blockTail && this.contentString.slice(-1) === "\n") {
          return {
            offset: this.length - 1
          };
        } else {
          return {
            offset: this.length
          };
        }
      }
      ref1 = this.partials;
      for (partIndex = i = 0, len = ref1.length; i < len; partIndex = ++i) {
        part = ref1[partIndex];
        if (part.el.contains(textNode)) {
          fix = 0;
          if (this.blockTail && this.keepNewlineSpace && index === (textNode != null ? textNode.length : void 0) && part.content.slice(-1) === "\n" && partIndex === this.partials.length - 1) {
            fix -= 1;
          }
          return {
            offset: offset + index + fix,
            part: part
          };
        }
        offset += part.content.length;
      }
      if (this.el.contains(textNode)) {
        return {
          offset: this.length
        };
      }
      return null;
    };

    COMText.prototype.toJSON = function(option) {
      var json;
      json = COMText.__super__.toJSON.call(this, option);
      if (!json) {
        return null;
      }
      json.contentString = this.contentString;
      return json;
    };

    COMText.prototype.toHumanString = function() {
      return this.contentString;
    };

    return COMText;

  })(COMNode);

  InsertTextOperation = (function(superClass) {
    extend(InsertTextOperation, superClass);

    function InsertTextOperation() {
      return InsertTextOperation.__super__.constructor.apply(this, arguments);
    }

    InsertTextOperation.prototype.name = "InsertTextOperation";

    InsertTextOperation.prototype.invoke = function() {
      var ref, text;
      text = this.target || this.context.root.getChildByPath(this.path);
      if (typeof this.option.start !== "number" || this.option.start > text.length) {
        this.error("insert at " + this.option.start + " of text with length " + text.length);
        return false;
      }
      if (!this.option.value || typeof this.option.value !== "string") {
        this.error("insert value of " + this.option.value);
        return false;
      }
      if (!(text instanceof COMText)) {
        this.error("target not instanceof COMText");
        return;
      }
      text.contentString = text.contentString.slice(0, this.option.start) + this.option.value + text.contentString.slice(this.option.start);
      text.dirty = true;
      if ((ref = text.parent) != null) {
        ref.pend();
      }
      return true;
    };

    InsertTextOperation.prototype.revoke = function() {
      var ref, text;
      text = this.target || this.context.root.getChildByPath(this.path);
      if (!(text instanceof COMText)) {
        this.error("target not instanceof COMText");
        return;
      }
      if (typeof this.option.start !== "number" || this.option.start + this.option.value.length > text.length) {
        this.error("revoke insert at " + this.option.start + " of text with length " + text.length);
        return false;
      }
      if (!this.option.value) {
        this.error("revoke insert value of " + this.option.value);
        return false;
      }
      if (text.contentString.slice(this.option.start, this.option.start + this.option.value.length) !== this.option.value) {
        this.error("revoke insert value of " + this.option.value + " but the text in the corresponding area is " + (text.contentString.slice(this.option.start, this.option.start + this.option.value.length)));
        return false;
      }
      text.contentString = text.contentString.slice(0, this.option.start) + text.contentString.slice(this.option.start + this.option.value.length);
      text.dirty = true;
      if ((ref = text.parent) != null) {
        ref.pend();
      }
      return true;
    };

    InsertTextOperation.prototype.describe = function() {
      return this.name + ": insert text \"" + this.option.value + "\" at " + this.option.start;
    };

    return InsertTextOperation;

  })(Operation.EditOperation);

  RemoveTextOperation = (function(superClass) {
    extend(RemoveTextOperation, superClass);

    function RemoveTextOperation() {
      return RemoveTextOperation.__super__.constructor.apply(this, arguments);
    }

    RemoveTextOperation.prototype.name = "RemoveTextOperation";

    RemoveTextOperation.prototype.invoke = function() {
      var ref, text;
      text = this.target || this.context.root.getChildByPath(this.path);
      if (!(text instanceof COMText)) {
        this.error("target not instanceof COMText");
        return;
      }
      if (typeof this.option.start !== "number" || this.option.start > text.length) {
        this.error("remove at " + this.option.start + " of text with length " + text.length);
        return false;
      }
      if (!this.option.length) {
        this.option.length = text.contentString.length - this.option.start;
        return false;
      }
      if (this.option.start + this.option.length > text.length) {
        this.error("remove at " + this.option.start + " length " + this.option.length + " exceed the contentString length of " + text.length);
        return false;
      }
      this.option.removed = text.contentString.slice(this.option.start, this.option.start + this.option.length);
      text.contentString = text.contentString.slice(0, this.option.start) + text.contentString.slice(this.option.start + this.option.length);
      text.dirty = true;
      if ((ref = text.parent) != null) {
        ref.pend();
      }
      return true;
    };

    RemoveTextOperation.prototype.revoke = function() {
      var ref, text;
      text = this.target || this.context.root.getChildByPath(this.path);
      if (!(text instanceof COMText)) {
        this.error("target not instanceof COMText");
        return;
      }
      if (typeof this.option.start !== "number" || this.option.start > text.length) {
        this.error("revoke at start " + this.option.start + " but with text with length " + text.length);
        return false;
      }
      if (!this.option.removed) {
        this.error("revoke value of " + this.option.value);
        return false;
      }
      text.contentString = text.contentString.slice(0, this.option.start) + this.option.removed + text.contentString.slice(this.option.start);
      text.dirty = true;
      if ((ref = text.parent) != null) {
        ref.pend();
      }
      return true;
    };

    RemoveTextOperation.prototype.describe = function() {
      return this.name + ": remove text at " + this.option.start + "~" + (this.option.start + this.option.length);
    };

    return RemoveTextOperation;

  })(Operation.EditOperation);

  module.exports = COMText;

}).call(this);

}
GlobalContext.setModule("vincent/com/text.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/trapPolicy.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMPolicy, COMTrapPolicy,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  COMPolicy = require("./policy");

  COMTrapPolicy = (function(superClass) {
    extend(COMTrapPolicy, superClass);

    function COMTrapPolicy(node) {
      this.node = node;
      COMTrapPolicy.__super__.constructor.call(this, this.node);
    }

    COMTrapPolicy.prototype.trap = "ignore";

    COMTrapPolicy.prototype.trapOut = "ignore";

    COMTrapPolicy.prototype.trapIn = "ignore";

    COMTrapPolicy.prototype.behave = function(behavior) {
      var prop;
      for (prop in behavior) {
        if (behavior.hasOwnProperty(prop)) {
          this[prop] = behavior[prop];
        }
      }
      return this;
    };

    return COMTrapPolicy;

  })(COMPolicy);

  module.exports = COMTrapPolicy;

}).call(this);

}
GlobalContext.setModule("vincent/com/trapPolicy.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/travelPolicy.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMPolicy, COMTravelPolicy,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  COMPolicy = require("./policy");

  COMTravelPolicy = (function(superClass) {
    extend(COMTravelPolicy, superClass);

    function COMTravelPolicy(node) {
      this.node = node;
      COMTravelPolicy.__super__.constructor.call(this, this.node);
    }

    COMTravelPolicy.prototype.write = "ignore";

    COMTravelPolicy.prototype.forwardChar = "ignore";

    COMTravelPolicy.prototype.backwardChar = "ignore";

    COMTravelPolicy.prototype.deleteChar = "ignore";

    COMTravelPolicy.prototype.upwardChar = "ignore";

    COMTravelPolicy.prototype.downwardChar = "ignore";

    COMTravelPolicy.prototype.head = "ignore";

    COMTravelPolicy.prototype.tail = "ignore";

    COMTravelPolicy.prototype.startOfLine = "ignore";

    COMTravelPolicy.prototype.endOfLine = "ignore";

    COMTravelPolicy.prototype.forwardBypassed = "ignore";

    COMTravelPolicy.prototype.backwardBypassed = "ignore";

    COMTravelPolicy.prototype.deleteBypassed = "ignore";

    COMTravelPolicy.prototype.tailBoundary = "ignore";

    return COMTravelPolicy;

  })(COMPolicy);

  module.exports = COMTravelPolicy;

}).call(this);

}
GlobalContext.setModule("vincent/com/travelPolicy.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/unknownRune.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMRune, COMUnknownRune, i18n,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  i18n = require("./i18n");

  COMRune = require("./rune");

  COMUnknownRune = (function(superClass) {
    extend(COMUnknownRune, superClass);

    COMUnknownRune.prototype.type = "UnknownRune";

    function COMUnknownRune(context, data) {
      var ref;
      this.context = context;
      this.data = data != null ? data : {
        detail: null
      };
      COMUnknownRune.__super__.constructor.call(this, this.context, this.data);
      if ((ref = this.appearance.classList) != null) {
        ref.push("com-unknown-rune");
      }
    }

    COMUnknownRune.prototype.render = function() {
      var ref, ref1, ref2, title;
      COMUnknownRune.__super__.render.call(this);
      title = i18n.UnknownRuneTitle;
      if ((ref = this.el) != null) {
        ref.title = title;
      }
      if ((ref1 = this.el) != null) {
        ref1.setAttribute("title", title);
      }
      return (ref2 = this.el) != null ? ref2.onclick = (function(_this) {
        return function() {
          var ref3;
          return Logger.error("UnknownRuneDetail", JSON.stringify((ref3 = _this.data) != null ? ref3.detail : void 0, null, 4));
        };
      })(this) : void 0;
    };

    COMUnknownRune.prototype.toJSON = function() {
      return this.data.detail;
    };

    return COMUnknownRune;

  })(COMRune);

  module.exports = COMUnknownRune;

}).call(this);

}
GlobalContext.setModule("vincent/com/unknownRune.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/visualPosition.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMVisualBorder, COMVisualPosition;

  COMVisualPosition = (function() {
    function COMVisualPosition(option) {
      var pl, pr, ref, ref1;
      if (option == null) {
        option = {};
      }
      this.left = option.left || null;
      this.right = option.right || null;
      this.center = option.center || null;
      this.priority = "right";
      pl = ((ref = this.left) != null ? ref.priority : void 0) || 0;
      pr = ((ref1 = this.right) != null ? ref1.priority : void 0) || 0;
      if (pl > pr) {
        this.priority = "left";
      }
      return;
    }

    return COMVisualPosition;

  })();

  COMVisualBorder = (function() {
    function COMVisualBorder(option) {
      this.node = option.node || null;
      this.offset = option.offset || 0;
      this.position = option.position;
      this.priority = option.priority || 0;
      return;
    }

    COMVisualBorder.prototype.isElementBoundary = function() {
      return this.node && this.node.nodeType !== this.node.TEXT_NODE;
    };

    return COMVisualBorder;

  })();

  COMVisualPosition.COMVisualBorder = COMVisualBorder;

  module.exports = COMVisualPosition;

}).call(this);

}
GlobalContext.setModule("vincent/com/visualPosition.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/helper/compressor.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var compressMap, prop, reverseMap, value;

  compressMap = {
    "children": "$c",
    "contentString": "$s",
    "type": "$t",
    "spell": "$p",
    "state": "$t",
    "doneAt": "$a"
  };

  reverseMap = {};

  for (prop in compressMap) {
    value = compressMap[prop];
    reverseMap[value] = prop;
  }

  exports._compress = function(obj) {
    var result;
    if (obj instanceof Array) {
      return obj.map(this._compress.bind(this));
    }
    if (typeof obj === "object") {
      result = {};
      for (prop in obj) {
        value = obj[prop];
        if (value instanceof Array && value.length === 0) {
          continue;
        }
        if (compressMap[prop]) {
          result[compressMap[prop]] = this._compress(value);
        } else {
          result[prop] = this._compress(value);
        }
      }
      return result;
    }
    return obj;
  };

  exports.compress = function(obj) {
    var result;
    result = this._compress(obj);
    result.$v = 0;
    return result;
  };

  exports.extract = function(obj) {
    if (obj.$v !== 0) {
      return obj;
    }
    return this._extract(obj);
  };

  exports._extract = function(obj) {
    var result;
    if (obj instanceof Array) {
      return obj.map(this._extract.bind(this));
    }
    if (typeof obj === "object") {
      result = {};
      for (prop in obj) {
        value = obj[prop];
        if (prop[0] === "$") {
          result[reverseMap[prop]] = this._extract(value);
        } else {
          result[prop] = this._extract(value);
        }
      }
      return result;
    }
    return obj;
  };

}).call(this);

}
GlobalContext.setModule("vincent/com/helper/compressor.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/helper/nodeList.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMNodeList, EventEmitter,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  EventEmitter = (require("../events")).EventEmitter;

  COMNodeList = (function(superClass) {
    extend(COMNodeList, superClass);

    function COMNodeList() {
      COMNodeList.__super__.constructor.call(this);
      this.nodes = [];
      this.__defineGetter__("length", (function(_this) {
        return function() {
          return _this.nodes.length;
        };
      })(this));
    }

    COMNodeList.prototype.add = function() {
      var change, i, len, node, nodes;
      nodes = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      change = false;
      for (i = 0, len = nodes.length; i < len; i++) {
        node = nodes[i];
        if (indexOf.call(this.nodes, node) < 0) {
          (function(_this) {
            return (function(node) {
              _this.nodes.push(node);
              change = true;
              node.stopListenBy(_this);
              return node.listenBy(_this, "pend", function() {
                return _this.emit("pend", node);
              });
            });
          })(this)(node);
        }
      }
      if (change) {
        return this.emit("change");
      }
    };

    COMNodeList.prototype.remove = function() {
      var change, nodes;
      nodes = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      change = false;
      this.nodes = this.nodes.filter(function(item) {
        if (indexOf.call(nodes, item) >= 0) {
          change = true;
          item.stopListenBy(this);
          return false;
        }
        return true;
      });
      if (change) {
        return this.emit("change");
      }
    };

    COMNodeList.prototype.at = function(index) {
      return this.nodes[index];
    };

    COMNodeList.prototype.first = function() {
      return this.nodes[0] || null;
    };

    COMNodeList.prototype.sort = function() {
      return this.nodes.sort(function(a, b) {
        var position;
        position = a.compareNodePosition(b);
        if (position === "under" || position === "contain" || position === "identical") {
          return 0;
        } else if (position === "before") {
          return -1;
        } else {
          return 1;
        }
      });
    };

    COMNodeList.prototype.toArray = function() {
      return this.nodes.slice();
    };

    return COMNodeList;

  })(EventEmitter);

  module.exports = COMNodeList;

}).call(this);

}
GlobalContext.setModule("vincent/com/helper/nodeList.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/helper/sharedCallbacks.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  module.exports = require("/component/sharedCallbacks");

}).call(this);

}
GlobalContext.setModule("vincent/com/helper/sharedCallbacks.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/helper/string.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  module.exports = {
    ignorePhaseTypes: [],
    ignoreChar: [" "],
    findJumpBreakForward: function(string, index) {
      return this.findJumpBreak(string, index, 1, 0);
    },
    findJumpBreakBackward: function(string, index) {
      return this.findJumpBreak(string, index, -1, -1);
    },
    findJumpBreak: function(string, index, step, fix) {
      var char, phase, phase2Type, regret, type;
      phase = 0;
      type = null;
      index += fix;
      phase2Type = null;
      if (step < 0) {
        regret = 1;
      } else {
        regret = 0;
      }
      while (index < string.length && index >= 0) {
        char = string[index];
        type = this.detectCharType(char);
        if (phase === 0) {
          if (indexOf.call(this.ignorePhaseTypes, type) >= 0 || indexOf.call(this.ignoreChar, char) >= 0) {
            index += step;
            continue;
          } else {
            phase = 1;
          }
        }
        if (phase === 1) {
          if (type === phase2Type || !phase2Type) {
            index += step;
            phase2Type = type;
            continue;
          }
          index += regret;
          break;
        }
      }
      if (index < 0) {
        return 0;
      }
      if (index > string.length) {
        return string.length;
      }
      return index;
    },
    detectCharType: function(char) {
      if (/\s/.test(char)) {
        return "space";
      } else if (/[`\*~\s\.";\[\]\{\}:<>,\\\/\?`~!@#\$%\^&\(\)\|]/.test(char)) {
        return "delimeter";
      } else if (/[a-z_]/i.test(char)) {
        return "alphabet";
      } else {
        return "other";
      }
    }
  };

}).call(this);

}
GlobalContext.setModule("vincent/com/helper/string.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/helper/trait.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  module.exports = Leaf.Trait;

}).call(this);

}
GlobalContext.setModule("vincent/com/helper/trait.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/com/helper/walker.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Walker, WalkerRootFirst;

  Walker = (function() {
    function Walker(context) {
      this.context = context;
      this.MAX = 1000 * 100;
      this.top = this.context.root;
      this.node = this.context.root;
    }

    Walker.prototype.setTop = function(top) {
      this.top = top;
    };

    Walker.prototype.setNode = function(node1) {
      this.node = node1;
    };

    Walker.prototype.stepIn = function() {
      var ref;
      if ((ref = this.node.children) != null ? ref[0] : void 0) {
        this.node = this.node.children[0];
        return true;
      }
      return false;
    };

    Walker.prototype.stepOver = function() {
      var node;
      node = this.node.next();
      if (node) {
        this.node = node;
        return true;
      }
      return false;
    };

    Walker.prototype.stepBack = function() {
      var node;
      node = this.node.previous();
      if (node) {
        this.node = node;
        return true;
      }
      return false;
    };

    Walker.prototype.stepOut = function() {
      if (this.top && this.node === this.top) {
        return false;
      }
      if (this.node.parent) {
        this.node = this.node.parent;
        return true;
      }
      return false;
    };

    return Walker;

  })();

  WalkerRootFirst = (function() {
    function WalkerRootFirst(context) {
      this.context = context;
      this.MAX = 1000 * 100;
      this.top = this.context.root;
    }

    WalkerRootFirst.prototype.isTop = function() {
      return this.node.isRoot;
    };

    WalkerRootFirst.prototype.setNode = function(node1) {
      this.node = node1;
    };

    WalkerRootFirst.prototype.setTop = function(top) {
      this.top = top;
    };

    WalkerRootFirst.prototype.next = function(judge) {
      var counter, next, node, parent, pnext;
      if (judge == null) {
        judge = function() {
          return true;
        };
      }
      counter = 0;
      while (true) {
        counter++;
        if (counter > this.MAX) {
          throw new Error("like to be recursive walking! walked node exceed max " + this.MAX);
        }
        if (this.node.children && this.node.children.length > 0 && this.node.child && !this.skipChildOnce) {
          this.node = this.node.child(0);
          if (judge(this.node)) {
            return true;
          }
          continue;
        }
        this.skipChildOnce = false;
        if (this.top && this.node === this.top) {
          this.skipBrotherOnce = false;
          return false;
        }
        next = this.node.next();
        if (next && !this.skipBrotherOnce) {
          this.node = next;
          if (judge(this.node)) {
            return true;
          }
          continue;
        }
        this.skipBrotherOnce = false;
        node = this.node;
        while (true) {
          parent = node.parent;
          if (!parent || parent === this.top) {
            return false;
          }
          pnext = parent.next();
          if (pnext) {
            this.node = pnext;
            if (judge(this.node)) {
              return true;
            }
            break;
          }
          node = parent;
        }
        continue;
      }
    };

    WalkerRootFirst.prototype.previous = function(judge) {
      var node, parent, pprevious, previous;
      if (judge == null) {
        judge = function() {
          return true;
        };
      }
      while (true) {
        if (this.node.children && this.node.children.length > 0 && this.node.last() && !this.skipChildOnce) {
          this.node = this.node.last();
          if (judge(this.node)) {
            return true;
          }
          continue;
        }
        this.skipChildOnce = false;
        if (this.top && this.node === this.top) {
          this.skipBrotherOnce = false;
          return false;
        }
        previous = this.node.previous();
        if (previous && !this.skipBrotherOnce) {
          this.node = previous;
          if (judge(this.node)) {
            return true;
          }
          continue;
        }
        this.skipBrotherOnce = false;
        node = this.node;
        while (true) {
          parent = node.parent;
          if (!parent || parent === this.top) {
            return false;
          }
          pprevious = parent.previous();
          if (pprevious) {
            this.node = pprevious;
            if (judge(this.node)) {
              return true;
            }
            break;
          }
          node = parent;
        }
        continue;
      }
    };

    WalkerRootFirst.prototype.last = function(judge) {
      if (judge == null) {
        judge = function() {
          return true;
        };
      }
      this.setNode(this.top || this.context.root);
      return this.previous(judge);
    };

    WalkerRootFirst.prototype.first = function(judge) {
      if (judge == null) {
        judge = function() {
          return true;
        };
      }
      this.setNode(this.top || this.context.root);
      return this.next(judge);
    };

    return WalkerRootFirst;

  })();

  module.exports = Walker;

  module.exports.WalkerRootFirst = WalkerRootFirst;

}).call(this);

}
GlobalContext.setModule("vincent/com/helper/walker.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/common/boundary.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var DOMBoundary;

  DOMBoundary = (function() {
    DOMBoundary.createRangeBetween = function(b1, b2) {
      var b, fix, position, range, ref, startIndex, startTarget;
      b1 = new DOMBoundary(b1);
      b2 = new DOMBoundary(b2);
      range = document.createRange();
      position = b1.compare(b2);
      if (position === "identical") {
        if (b1.include || b2.include) {
          range.setStart(b1.getTargetParent(), b1.getTargetIndex());
          range.setEnd(b1.getTargetParent(), b1.getTargetIndex() + 1);
        } else {
          range.setStart(b1.getTargetParent(), b1.getTargetIndex());
          range.setEnd(b1.getTargetParent(), b1.getTargetIndex());
        }
        return range;
      }
      if (position === "after") {
        b = b2;
        b2 = b1;
        b1 = b;
      }
      startTarget = b1.getTargetParent();
      if (!startTarget) {
        Logger.error("no start target", b1);
        return null;
      }
      startIndex = Math.min(startTarget.length || ((ref = startTarget.children) != null ? ref.length : void 0) || 0, b1.getTargetIndex());
      range.setStart(startTarget, startIndex);
      if (b2.include) {
        fix = 1;
      } else {
        fix = 0;
      }
      range.setEnd(b2.getTargetParent(), b2.getTargetIndex() + fix);
      return range;
    };

    function DOMBoundary(option) {
      if (option == null) {
        option = {};
      }
      this.node = option.node;
      this.offset = option.offset || 0;
      this.type = option.type || "left";
      this.include = this.type === "include";
    }

    DOMBoundary.prototype.getAdjacentElement = function() {
      var result, target;
      result = {};
      if (!this.include) {
        if (this.offset === 0 && this.type === "left") {
          result.left = this.getPreviousElement(this.node.parentElement);
        }
        if (this.offset === this.node.length || (this.offset === this.node.length - 1 && this.type === "right")) {
          result.right = this.getNextElement(this.node.parentElement);
        }
      } else {
        target = this.node.childNodes[this.offset];
        result.left = this.getPreviousElement(target);
        result.right = this.getNextElement(target);
      }
      return result;
    };

    DOMBoundary.prototype.getNextElement = function(el) {
      while (el) {
        if (el.nextElementSibling) {
          return el.nextElementSibling;
        } else {
          el = el.parentElement;
        }
      }
      return null;
    };

    DOMBoundary.prototype.getPreviousElement = function(el) {
      while (el) {
        if (el.previousElementSibling) {
          return el.previousElementSibling;
        } else {
          el = el.parentElement;
        }
      }
      return null;
    };

    DOMBoundary.prototype.getTargetElement = function() {
      if (this.type === "include") {
        return this.node;
      }
      return this.node.childNodes && this.node.childNodes[this.offset || 0] || null;
    };

    DOMBoundary.prototype.getTargetParent = function() {
      if (this.type === "include") {
        return this.node.parentElement;
      } else {
        return this.node;
      }
    };

    DOMBoundary.prototype.getTargetIndex = function() {
      var child, fix, i, index, len, ref;
      if (this.type === "right") {
        fix = 1;
      } else {
        fix = 0;
      }
      if (this.type === "include") {
        ref = this.node.parentElement.childNodes;
        for (index = i = 0, len = ref.length; i < len; index = ++i) {
          child = ref[index];
          if (child === this.node) {
            return index + fix;
          }
        }
      } else {
        return this.offset + fix;
      }
      return null;
    };

    DOMBoundary.prototype.compare = function(boundary) {
      var o1, o2, ref, ref1, ref2, result, subResult;
      result = (ref = this.getTargetParent()) != null ? ref.compareDocumentPosition(boundary.getTargetParent()) : void 0;
      o1 = this.getTargetIndex() || 0;
      o2 = boundary.getTargetIndex() || 0;
      if (result === 0) {
        if (o1 > o2) {
          return "after";
        } else if (o1 < o2) {
          return "before";
        } else {
          return "identical";
        }
      } else if ((result & 8) === 8) {
        subResult = (ref1 = this.getTargetParent()) != null ? ref1.compareDocumentPosition(boundary.getTargetElement()) : void 0;
        if ((subResult & 8) === 8) {
          return "after";
        } else if ((subResult & 2) === 2) {
          return "after";
        } else {
          return "before";
        }
      } else if ((result & 16) === 16) {
        subResult = (ref2 = this.getTargetElement()) != null ? ref2.compareDocumentPosition(boundary.getTargetParent()) : void 0;
        if ((subResult & 16) === 16) {
          return "before";
        } else if ((subResult & 2) === 2) {
          return "after";
        } else {
          return "before";
        }
      } else if ((result & 2) === 2) {
        return "after";
      } else {
        return "before";
      }
    };

    return DOMBoundary;

  })();

  module.exports = DOMBoundary;

}).call(this);

}
GlobalContext.setModule("vincent/common/boundary.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/common/char.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var DOMChar;

  DOMChar = (function() {
    DOMChar.fromClientPoint = function(x, y) {
      var range, startOffset;
      range = document.caretRangeFromPoint(x, y);
      if (!range) {
        return null;
      }
      if (!(range.startContainer instanceof Text)) {
        startOffset = 0;
      } else {
        startOffset = range.startOffset;
      }
      return new DOMChar(range.startContainer, startOffset);
    };

    function DOMChar(textNode, index1) {
      var child, i, len, ref, target;
      this.textNode = textNode;
      this.index = index1;
      if ((!(this.textNode instanceof Text)) && (this.textNode instanceof HTMLElement) && typeof index === "number") {
        target = this.textNode;
        while (!(target instanceof Text)) {
          ref = target.childNodes;
          for (i = 0, len = ref.length; i < len; i++) {
            child = ref[i];
            target = child;
            continue;
          }
          if (child.nextSibling) {
            target = child.nextSibling;
            continue;
          }
          while (child.parentElement !== this.textNode) {
            child = child.parentElement;
            if (child.nextSibling) {
              target = child.nextSibling;
              break;
            }
          }
        }
        if (target instanceof Text) {
          this.textNode = target;
          this.index = 0;
        } else {
          this.invalid = true;
        }
      }
      return;
    }

    DOMChar.prototype.isVisible = function() {
      var char;
      char = this.textNode.textContent[this.index];
      return (char !== "\n" && char !== " " && char !== "\r" && char !== "\t") && !this.isTailing();
    };

    DOMChar.prototype.isTailing = function() {
      return this.textNode.length <= this.index;
    };

    DOMChar.prototype.isChar = function() {
      return this.textNode instanceof Text;
    };

    DOMChar.prototype.getClientRect = function() {
      var content, e, error, holder, range, rect;
      if (!this.isChar()) {
        return this.textNode.getBoundingClientRect();
      }
      content = this.textNode.textContent;
      if (!this.isVisible()) {
        holder = "p";
        this.textNode.textContent = content.slice(0, this.index) + holder + content.slice(this.index);
      }
      range = document.createRange();
      if (!this.textNode || this.textNode.textContent.length < this.index) {
        Logger.error("invalid DOM char", this.textNode, this.index);
        return null;
      }
      try {
        range.setStart(this.textNode, this.index);
        range.setEnd(this.textNode, this.index + 1);
      } catch (error) {
        e = error;
        Logger.error("invalid DOM char", this.textNode, this.index, this.describe());
        return null;
      }
      rect = range.getBoundingClientRect();
      if (holder) {
        this.textNode.textContent = content;
      }
      return rect;
    };

    DOMChar.prototype.getRect = function(option) {
      var fix, rect, resolveScrollTopFix;
      if (option == null) {
        option = {};
      }
      rect = this.getClientRect();
      rect = {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
        height: rect.height,
        width: rect.width
      };
      resolveScrollTopFix = function(el) {
        var fix;
        fix = 0;
        while (el) {
          fix += el.scrollTop || 0;
          if (el === option.top) {
            break;
          }
          el = el.parentElement;
        }
        return fix;
      };
      fix = resolveScrollTopFix(this.textNode);
      rect.top += fix;
      rect.bottom += fix;
      return rect;
    };

    DOMChar.prototype.describe = function() {
      var contentString, extending;
      if (this.textNode instanceof Text) {
        contentString = this.textNode.textContent;
        extending = 20;
        if (contentString.length === this.index) {
          return "Char: " + contentString + "[ ]";
        }
        return "Char: " + (contentString.slice(this.index - extending, this.index)) + "[" + contentString[this.index] + "]" + (contentString.slice(this.index + 1, this.index + extending));
      }
      return "Char: Element " + this.textNode + "," + this.index;
    };

    return DOMChar;

  })();

  module.exports = DOMChar;

}).call(this);

}
GlobalContext.setModule("vincent/common/char.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/common/errors.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  module.exports = Leaf.ErrorDoc.create().define("UnexpectedInput").define("LogicError").define("OperationError").generate();

}).call(this);

}
GlobalContext.setModule("vincent/common/errors.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/common/events.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  exports.EventEmitter = Leaf.EventEmitter;

}).call(this);

}
GlobalContext.setModule("vincent/common/events.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/common/keyEvent.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var KeyEvent, clearCmdTimer, code, hasCommandKey, i, isMac, outputMap, ref, ref1,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Leaf.Key.home = 36;

  Leaf.Key.end = 35;

  Leaf.Key.quote = 222;

  Leaf.Key.openBracket = 219;

  Leaf.Key.closeBracket = 221;

  Leaf.Key.backSlash = 220;

  Leaf.Key.slash = 191;

  Leaf.Key.comma = 188;

  Leaf.Key.period = 190;

  Leaf.Key.dash = 189;

  Leaf.Key.semiColon = 186;

  Leaf.Key.graveAccent = 192;

  hasCommandKey = false;

  window.hasCommandKey = false;

  outputMap = {};

  for (code = i = 65; i < 90; code = ++i) {
    outputMap[code] = String.fromCharCode(code);
  }

  isMac = ((ref = window.navigator.platform) != null ? (ref1 = ref.toLowerCase()) != null ? ref1.indexOf("mac") : void 0 : void 0) >= 0;

  clearCmdTimer = null;

  window.addEventListener("keydown", function(e) {
    var ref2;
    if (((ref2 = e.which) === 224 || ref2 === 91 || ref2 === 93) && isMac) {
      hasCommandKey = true;
      window.hasCommandKey = true;
      clearTimeout(clearCmdTimer);
      return setTimeout((function(_this) {
        return function() {
          hasCommandKey = false;
          return window.hasCommandKey = false;
        };
      })(this), 5000);
    }
  });

  window.addEventListener("keyup", function(e) {
    var ref2;
    if (((ref2 = e.which) === 224 || ref2 === 91 || ref2 === 93) && isMac) {
      hasCommandKey = false;
      return window.hasCommandKey = false;
    }
  });

  window.addEventListener("blur", function(e) {
    hasCommandKey = false;
    return window.hasCommandKey = false;
  });

  window.addEventListener("focus", function(e) {
    hasCommandKey = false;
    return window.hasCommandKey = false;
  });

  module.exports = KeyEvent = (function() {
    function KeyEvent(raw) {
      var ref2;
      this.raw = raw;
      this.code = (ref2 = this.raw) != null ? ref2.which : void 0;
      this.ctrlKey = this.raw.ctrlKey;
      this.shiftKey = this.raw.shiftKey;
      this.altKey = this.raw.altKey;
      this.commandKey = hasCommandKey;
      this.simulateName = this.raw.simulateName;
      if (this.raw.type === "keydown") {
        this.keyDown = true;
      } else if (this.raw.type === "keyup") {
        this.keyUp = true;
      } else {
        this.keyDown = true;
      }
    }

    KeyEvent.prototype.capture = function() {
      var ref2, ref3;
      this.defaultPrevented = true;
      this.propagationStoped = true;
      if ((ref2 = this.raw) != null) {
        if (typeof ref2.preventDefault === "function") {
          ref2.preventDefault();
        }
      }
      return (ref3 = this.raw) != null ? typeof ref3.stopImmediatePropagation === "function" ? ref3.stopImmediatePropagation() : void 0 : void 0;
    };

    KeyEvent.prototype.isValid = function() {
      return !this.defaultPrevented && !this.propagationStoped;
    };

    KeyEvent.prototype.canOutput = function() {
      var j, ref2, results;
      return ref2 = this.code, indexOf.call([48, 49, 50, 51, 52, 53, 54, 55, 56, 57].concat((function() {
        results = [];
        for (j = 65; j <= 90; j++){ results.push(j); }
        return results;
      }).apply(this), [Leaf.Key.space, Leaf.Key.enter, Leaf.Key.quote, Leaf.Key.openBracket, Leaf.Key.closeBracket, Leaf.Key.backSlash, Leaf.Key.slash, Leaf.Key.comma, Leaf.Key.period, Leaf.Key.dash, Leaf.Key.graveAccent]), ref2) >= 0;
    };

    KeyEvent.prototype.getInputText = function() {
      var char;
      char = outputMap[this.code] || "";
      if (!this.shiftKey) {
        return char.toLowerCase();
      } else {
        return char.toUpperCase();
      }
    };

    KeyEvent.prototype.isKey = function(name) {
      if (this.simulateName === name) {
        return true;
      }
      return this.code && Leaf.Key[name] === this.code;
    };

    KeyEvent.prototype.isModified = function() {
      return this.ctrlKey || this.altKey;
    };

    KeyEvent.prototype.isMod = function() {
      return hasCommandKey || this.ctrlKey;
    };

    KeyEvent.prototype.isModMatch = function(ctrl, command, mod) {
      if (this.ctrlKey) {
        if (!ctrl && (isMac || mod !== true)) {
          return false;
        }
      } else {
        if (ctrl || (!isMac && (mod === true))) {
          return false;
        }
      }
      if (hasCommandKey) {
        if (!command && mod !== true) {
          return false;
        }
      } else {
        if (command || (isMac && mod === true)) {
          return false;
        }
      }
      return true;
      if (ctrl !== this.ctrlKey && (!isMac || mod !== this.ctrlKey)) {
        return false;
      }
      if (command !== hasCommandKey) {
        return false;
      }
      if (isMac && mod !== hasCommandKey) {
        if (command !== hasCommandKey) {
          return false;
        }
      }
      if (!isMac && mod !== this.ctrlKey) {
        if (ctrl !== this.ctrlKey) {
          return false;
        }
      }
      return true;
    };

    return KeyEvent;

  })();

}).call(this);

}
GlobalContext.setModule("vincent/common/keyEvent.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/common/range.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var DOMRange;

  DOMRange = (function() {
    function DOMRange(range) {
      this.range = range;
    }

    return DOMRange;

  })();

  module.exports = DOMRange;

}).call(this);

}
GlobalContext.setModule("vincent/common/range.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/common/region.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var DOMRegion;

  DOMRegion = (function() {
    DOMRegion.rangeFromPoint = function(x, y) {
      var position, range;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(x, y);
        return range;
      } else if (document.caretPositionFromPoint) {
        position = document.caretPositionFromPoint(x, y);
        if (!position) {
          return null;
        }
        range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
        range.setEnd(position.offsetNode, position.offset);
        return range;
      }
      return null;
    };

    DOMRegion.fromClientPoint = function(x, y) {
      var range;
      range = this.rangeFromPoint(x, y);
      if (!range) {
        return null;
      }
      return new DOMRegion(range.startContainer, range.startOffset);
    };

    DOMRegion.fromBoundary = function(b) {
      var i, index, len, node, ref;
      if (b.type === "include") {
        ref = b.node.parentElement.childNodes;
        for (index = i = 0, len = ref.length; i < len; index = ++i) {
          node = ref[index];
          if (b.node === node) {
            return new DOMRegion(b.node.parentElement, index);
          }
        }
      } else {
        return new DOMRegion(b.node, b.offset);
      }
    };

    function DOMRegion(node1, index1) {
      this.node = node1;
      this.index = index1;
    }

    DOMRegion.prototype.isChar = function() {
      return this.node instanceof Text;
    };

    DOMRegion.prototype.isVisibleText = function() {
      var char;
      char = this.node.textContent[this.index];
      return char !== "\n";
    };

    DOMRegion.prototype.isNewLine = function() {
      var char;
      char = this.node.textContent[this.index];
      return char === "\n";
    };

    DOMRegion.prototype.char = function() {
      var char;
      return char = this.node.textContent[this.index];
    };

    DOMRegion.prototype.nextChar = function() {
      return this.node.textContent[this.index + 1];
    };

    DOMRegion.prototype.previousChar = function() {
      return this.node.textContent[this.index - 1];
    };

    DOMRegion.prototype.selectRectByChar = function(rects) {
      if (rects.length === 1) {
        return rects[0];
      }
      if (this.previousChar() === "\n") {
        return rects[1];
      }
      if (rects.length > 1 && rects[0].width === 0 && rects[1].top === rects[0].top && rects[1]) {
        return rects[1];
      }
      return rects[0];
    };

    DOMRegion.prototype.isTailing = function() {
      return this.node.length <= this.index;
    };

    DOMRegion.prototype.getContainerElement = function() {
      if (this.node.type === this.node.ELEMENT_NODE) {
        return this.node;
      } else {
        return this.node.parentElement;
      }
    };

    DOMRegion.prototype.getIncludeElement = function() {
      var ref;
      if (((ref = this.node.childNodes[this.index]) != null ? ref.type : void 0) === this.node.ELEMENT_NODE) {
        return this.node.childNodes[this.index];
      }
      return null;
    };

    DOMRegion.prototype.getClientRect = function() {
      var el, rect;
      if (this.isChar()) {
        rect = this.getCharClientRect();
        return rect;
      } else {
        el = this.node.childNodes[this.index];
        if (!el) {
          return null;
        }
        if (el.innerRegionElement) {
          return el.innerRegionElement.getBoundingClientRect();
        }
        return el.getBoundingClientRect();
      }
    };

    DOMRegion.prototype.getRect = function(option) {
      var fix, fixRect, rect, resolveScrollTopFix;
      rect = this.getClientRect();
      if (!rect) {
        return null;
      }
      rect = {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
        height: rect.height,
        width: rect.width
      };
      resolveScrollTopFix = function(el) {
        var fix;
        fix = 0;
        while (el) {
          fix += el.scrollTop || 0;
          if (el === option.top) {
            break;
          }
          el = el.parentElement;
        }
        return fix;
      };
      if (option.top) {
        fixRect = option.top.getBoundingClientRect();
      }
      if (this.isChar()) {
        fix = resolveScrollTopFix(this.node);
      } else {
        fix = resolveScrollTopFix(this.node.childNodes[this.index]);
      }
      rect.top += fix;
      rect.bottom += fix;
      if (fixRect) {
        rect.left -= fixRect.left;
        rect.right -= fixRect.left;
        rect.top -= fixRect.top;
        rect.bottom -= fixRect.top;
      }
      return rect;
    };

    DOMRegion.prototype.tryGetLeftCharClientRect = function() {
      var leftOne, range, rect;
      if (this.index < 1) {
        return null;
      }
      leftOne = this.node.textContent[this.index - 1];
      if (leftOne === "\n") {
        return null;
      }
      range = document.createRange();
      range.setStart(this.node, this.index - 1);
      range.setEnd(this.node, this.index);
      rect = range.getBoundingClientRect();
      if (!rect) {
        return null;
      }
      return Object.seal({
        left: rect.right,
        right: rect.right,
        width: 0,
        height: rect.height,
        top: rect.top,
        bottom: rect.bottom
      });
    };

    DOMRegion.prototype.getCharClientRect = function() {
      var content, holder, range, rect, rects, useHolder;
      content = this.node.textContent;
      range = document.createRange();
      if (!this.node || this.node.textContent.length < this.index) {
        return null;
      }
      if (this.node.textContent.length === 0 || this.isTailing()) {
        useHolder = true;
      }
      if (this.node.textContent[this.index] === "\n" && this.node.textContent.length - 1 === this.index && this.previousChar() === "\n") {
        useHolder = true;
      }
      if (useHolder) {
        holder = " ";
        this.node.textContent = content.slice(0, this.index) + holder + content.slice(this.index);
      }
      if (!this.node) {
        return null;
      }
      range.setStart(this.node, this.index);
      range.setEnd(this.node, this.index + 1);
      rects = range.getClientRects();
      rect = this.selectRectByChar(rects);
      if (useHolder) {
        this.node.textContent = content;
      }
      return rect;
    };

    DOMRegion.prototype.describe = function() {
      if (this.isChar()) {
        return this.describeChar();
      } else {
        return this.describeElement();
      }
    };

    DOMRegion.prototype.describeElement = function() {
      return this.node.childNodes[this.index];
    };

    DOMRegion.prototype.describeChar = function() {
      var contentString, extending;
      contentString = this.node.textContent;
      extending = 20;
      if (contentString.length === this.index) {
        return "Char: " + contentString + "[ ]";
      }
      return "Char: " + (contentString.slice(this.index - extending, this.index)) + "[" + contentString[this.index] + "]" + (contentString.slice(this.index + 1, this.index + extending));
    };

    return DOMRegion;

  })();

  module.exports = DOMRegion;

}).call(this);

}
GlobalContext.setModule("vincent/common/region.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/common/states.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  module.exports = Leaf.States;

}).call(this);

}
GlobalContext.setModule("vincent/common/states.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/common/traverse.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var DOMWalker;

  DOMWalker = (function() {
    function DOMWalker(node1, begin1, end1) {
      this.node = node1;
      this.begin = begin1;
      this.end = end1;
    }

    DOMWalker.prototype.traverse = function(handler) {
      var next, node, pn, results, top;
      top = this.node;
      if (!top.childNodes || top.childNodes.length === 0) {
        if (top && this.begin === top || this.end === top) {
          handler(top);
        }
        return;
      }
      node = this.begin || top.childNodes[0];
      results = [];
      while (true) {
        if (!node) {
          break;
        }
        if (handler(node)) {
          break;
        }
        if (node === top) {
          break;
        }
        if (node === this.end) {
          break;
        }
        if (node.childNodes && node.childNodes.length > 0) {
          node = node.childNodes[0];
          continue;
        }
        next = node.nextSibling;
        if (next) {
          node = next;
          continue;
        }
        results.push((function() {
          var results1;
          results1 = [];
          while (node = node.parentElement) {
            pn = node.nextSibling;
            if (node === top) {
              break;
            }
            if (pn) {
              node = pn;
              break;
            } else {
              results1.push(void 0);
            }
          }
          return results1;
        })());
      }
      return results;
    };

    return DOMWalker;

  })();

  exports.traverse = function(node, handler) {
    var walker;
    walker = new DOMWalker(node);
    return walker.traverse(handler);
  };

  exports.traverseRange = function(range, handler) {
    var begin, end, top, walker;
    top = range.commonAncestorContainer;
    if (range.startContainer instanceof window.Text) {
      begin = range.startContainer;
    } else {
      begin = range.startContainer.children[range.startOffset];
    }
    if (range.endContainer instanceof window.Text) {
      end = range.endContainer;
    } else {
      end = range.endContainer.children[range.endOffset];
    }
    walker = new DOMWalker(top, begin, end);
    return walker.traverse(handler);
  };

}).call(this);

}
GlobalContext.setModule("vincent/common/traverse.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/DNDProtocol.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var DNDProtocol;

  DNDProtocol = (function() {
    DNDProtocol.prototype.type = "Void";

    DNDProtocol.prototype.data = null;

    function DNDProtocol(type, data, event) {
      this.type = type;
      this.data = data;
      this.event = event;
    }

    return DNDProtocol;

  })();

  module.exports = DNDProtocol;

}).call(this);

}
GlobalContext.setModule("vincent/facility/DNDProtocol.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/buffer.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Buffer, BufferDropHandler, BufferHintManager, BufferManager, COMContext, COMCursor, COMSelection, DOMSelection, EventEmitter, Highlighter, IMEHint, ManagerDragCapableTrait, Properties, RichBuffer, SearchSession, SelectSession, SelectionHighlight, SharedCallbacks, Trait, ViewPort,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  COMContext = require("../com/context");

  Trait = require("../com/helper/trait");

  COMSelection = require("../com/selection");

  COMCursor = require("../com/cursor");

  DOMSelection = require("./selection");

  ViewPort = require("./viewPort");

  SelectSession = require("./selectSession");

  SelectionHighlight = require("./selectionHighlight");

  Highlighter = require("./highlighter");

  SearchSession = require("./searchSession");

  EventEmitter = (require("../common/events")).EventEmitter;

  BufferHintManager = require("/view/bufferHintManager");

  IMEHint = require("./imeHint");

  Properties = require("/component/properties");

  SharedCallbacks = require("/component/sharedCallbacks");

  Buffer = (function(superClass) {
    extend(Buffer, superClass);

    Buffer.index = 0;

    Buffer.prototype.type = "Buffer";

    function Buffer(editor, option) {
      this.editor = editor;
      if (option == null) {
        option = {};
      }
      this.id = (Buffer.index++).toString();
      Buffer.__super__.constructor.call(this);
      this.hintManager = new BufferHintManager(this.editor, this);
      this.isActive = false;
      this.name = option.name || ("<buffer " + this.id + ">");
      this.properties = new Properties(this);
    }

    Buffer.prototype.focus = function() {
      if (this.isFocusing) {
        return;
      }
      if (!this.isActive) {
        return false;
      }
      this.isFocusing = true;
      return this.emit("focus");
    };

    Buffer.prototype.blur = function() {
      if (!this.isFocusing) {
        return;
      }
      if (!this.isActive) {
        return false;
      }
      this.isFocusing = false;
      return this.emit("blur");
    };

    Buffer.prototype.activate = function() {
      if (this.isActive) {
        return;
      }
      this.isActive = true;
      return this.emit("active");
    };

    Buffer.prototype.deactivate = function() {
      if (!this.isActive) {
        return;
      }
      this.blur();
      this.isActive = false;
      return this.emit("deactive");
    };

    Buffer.prototype.render = function() {
      return false;
    };

    Buffer.prototype.destroy = function() {
      this.emit("destroy");
    };

    return Buffer;

  })(Leaf.Widget);

  RichBuffer = (function(superClass) {
    extend(RichBuffer, superClass);

    RichBuffer.renderConfig = {};

    RichBuffer.setRenderConfig = function(config) {
      var prop, results, value;
      results = [];
      for (prop in config) {
        value = config[prop];
        results.push(this.renderConfig[prop] = value);
      }
      return results;
    };

    RichBuffer.prototype.type = "RichBuffer";

    function RichBuffer(editor, option) {
      var prop, ref1, value;
      this.editor = editor;
      if (option == null) {
        option = {};
      }
      if (this.template == null) {
        this.template = "<div class=\"buffer\" data-class=\"focusState\">\n  <div data-id=\"viewPort\" class=\"com-view-port needsclick\">\n      <div data-id=\"wrapper\" class=\"wrapper\"></div>\n  </div>\n</div>";
      }
      RichBuffer.__super__.constructor.call(this, this.editor, option);
      this.viewPort = new ViewPort(this, this.UI.viewPort);
      this.context = option.context;
      this.cursor = this.context.createCursor({
        name: "master"
      });
      this.selection = new COMSelection(this.context, this.cursor);
      this.selectSession = new SelectSession(this);
      this.selectionHighlight = new SelectionHighlight(this);
      this.nextRenderCallback = SharedCallbacks.create();
      this.dropHandler = new BufferDropHandler(this);
      this.imeHint = new IMEHint(this);
      this.viewPort.listenBy(this, "scroll", (function(_this) {
        return function() {
          return _this.emit("reflow");
        };
      })(this));
      if (this.highlighter == null) {
        this.highlighter = new Highlighter(this);
      }
      this.searchSession = new SearchSession(this);
      if (this.renderContext == null) {
        this.renderContext = this.context.allocateRenderContext();
      }
      this.__defineGetter__("rootElement", (function(_this) {
        return function() {
          return _this.renderContext.rootElement;
        };
      })(this));
      this.renderContext.buffer = this;
      ref1 = RichBuffer.renderConfig;
      for (prop in ref1) {
        value = ref1[prop];
        this.renderContext.renderConfig[prop] = value;
      }
      this.renderContext.listenBy(this, "resize", (function(_this) {
        return function() {
          return _this.emit("resize");
        };
      })(this));
      this.interactive = false;
      this.lockUserInput = false;
      this.node.addEventListener("click", (function(_this) {
        return function() {
          return _this.ensureFocus();
        };
      })(this));
      this.node.addEventListener("touchend", (function(_this) {
        return function() {
          return _this.ensureFocus();
        };
      })(this));
      this.renderContext.buffer = this;
      this.renderContext.cursor = this.cursor;
      this.__defineGetter__("interactive", (function(_this) {
        return function() {
          return _this.renderContext.interactive;
        };
      })(this));
      this.__defineSetter__("interactive", (function(_this) {
        return function(value) {
          _this.renderContext.interactive = value;
          return _this.emit("interactiveChange", value);
        };
      })(this));
      this.__defineGetter__("renderOption", (function(_this) {
        return function(value) {
          return _this.renderContext.renderConfig;
        };
      })(this));
      this.viewPort.init();
    }

    RichBuffer.prototype.activate = function() {
      return RichBuffer.__super__.activate.call(this);
    };

    RichBuffer.prototype.deactivate = function() {
      return RichBuffer.__super__.deactivate.call(this);
    };

    RichBuffer.prototype.ensureFocus = function() {
      if (this.lockUserInput) {
        return;
      }
      return this.editor.bufferManager.focusAt(this);
    };

    RichBuffer.prototype.ensureRenderContext = function() {
      if (this.context.currentRenderContext !== this.renderContext) {
        return this.context.setRenderContext(this.renderContext);
      }
    };

    RichBuffer.prototype.focus = function() {
      RichBuffer.__super__.focus.call(this);
      this.selectSession.activate();
      return this.VM.focusState = "buffer-focus";
    };

    RichBuffer.prototype.blur = function() {
      RichBuffer.__super__.blur.call(this);
      this.selectSession.deactivate();
      return this.VM.focusState = "buffer-blur";
    };

    RichBuffer.prototype.nextRender = function(callback) {
      return this.nextRenderCallback.push(callback);
    };

    RichBuffer.prototype.render = function() {
      this.context.render(this.renderContext);
      if (this.name === "debug") {
        Logger.debug("render debug", this);
      }
      this.viewPort.setRoot(this.renderContext.el);
      this.selectionHighlight.render();
      return this.nextRenderCallback();
    };

    RichBuffer.prototype.setContentString = function(contentString) {
      this.context.transact((function(_this) {
        return function() {
          var p;
          _this.context.root.empty();
          p = _this.context.createElement("Contents", {
            children: [
              (_this.context.createElement("RichText", {
                contentString: contentString
              })).toJSON()
            ]
          });
          _this.context.root.append(p);
          _this.cursor.pointAt(p.children[0]);
          return _this.context.history.fromNow();
        };
      })(this));
      return true;
    };

    RichBuffer.prototype.markAsReadonly = function() {
      this.emit("readonly");
      return this.context.isReadonly = true;
    };

    RichBuffer.prototype.unmarkAsReadonly = function() {
      this.emit("readwrite");
      return this.context.isReadonly = false;
    };

    RichBuffer.prototype.destroy = function() {
      var ref1;
      if ((ref1 = this.context) != null) {
        ref1.destroyRenderContext(this.renderContext);
      }
      this.selectionHighlight.destroy();
      return RichBuffer.__super__.destroy.call(this);
    };

    return RichBuffer;

  })(Buffer);

  BufferManager = (function(superClass) {
    extend(BufferManager, superClass);

    function BufferManager(editor) {
      this.editor = editor;
      BufferManager.__super__.constructor.call(this);
      this.buffers = [];
      this.focusStack = [];
      new ManagerDragCapableTrait(this);
    }

    BufferManager.prototype.render = function() {
      var SLOW_RENDER, buffer, endRender, i, len, ref1, start;
      SLOW_RENDER = 10;
      start = Date.now();
      ref1 = this.buffers;
      for (i = 0, len = ref1.length; i < len; i++) {
        buffer = ref1[i];
        if (!buffer.isActive || !buffer.interactive) {
          continue;
        }
        buffer.render();
        buffer.emit("afterRender");
        if (buffer.isFocusing) {
          buffer.selectSession.syncSelection();
        }
      }
      endRender = Date.now();
      if (endRender - start > SLOW_RENDER) {
        return Logger.debug("SLOW_RENDER", endRender - start, "ms", ">", SLOW_RENDER, "ms");
      }
    };

    BufferManager.prototype.allocate = function(context, option) {
      var buffer;
      if (option == null) {
        option = {};
      }
      if (context instanceof Buffer) {
        buffer = context;
      } else {
        option.context = context;
        buffer = new RichBuffer(this.editor, option);
      }
      buffer.manager = this;
      this.buffers.push(buffer);
      buffer.listenBy(this, "active", (function(_this) {
        return function() {
          return _this.emit("active", buffer);
        };
      })(this));
      buffer.listenBy(this, "deactive", (function(_this) {
        return function() {
          return _this.emit("deactive", buffer);
        };
      })(this));
      return buffer;
    };

    BufferManager.prototype.recover = function(buffer) {
      buffer.stopListenBy(this);
      return buffer.destroy();
    };

    BufferManager.prototype.focusAt = function(buffer) {
      if (this.currentFocus) {
        this.currentFocus.blur();
      }
      this.currentFocus = buffer;
      buffer.focus();
      if (!buffer.isActive) {
        Logger.warn("Focus at none active buffer doesn't make sense.", buffer);
      }
      return this.emit("focus", buffer);
    };

    BufferManager.prototype.pushFocus = function(buffer) {
      if (this.currentFocus) {
        this.focusStack.push(this.currentFocus);
      }
      return this.focusAt(buffer);
    };

    BufferManager.prototype.popFocus = function(buffer) {
      if (this.currentFocus === buffer) {
        if (this.focusStack.length > 0) {
          return this.focusAt(this.focusStack.pop());
        }
      } else {
        return this.focusStack = this.focusStack.filter(function(item) {
          return item === buffer;
        });
      }
    };

    return BufferManager;

  })(EventEmitter);

  ManagerDragCapableTrait = (function(superClass) {
    extend(ManagerDragCapableTrait, superClass);

    function ManagerDragCapableTrait() {
      return ManagerDragCapableTrait.__super__.constructor.apply(this, arguments);
    }

    ManagerDragCapableTrait.prototype.initialize = function() {
      return this.registerDropHandler((function(_this) {
        return function(e, buffer) {
          var i, len, protocol, ref1, results;
          ref1 = e.detail.protocols;
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            protocol = ref1[i];
            if (protocol.type === "Rune") {
              _this.transferRune(buffer, protocol.data);
              e.preventDefault();
              results.push(e.stopImmediatePropagation());
            } else {
              results.push(void 0);
            }
          }
          return results;
        };
      })(this));
    };

    ManagerDragCapableTrait.prototype.transferRune = function(buffer, origin) {
      var ref, ref1;
      if (buffer.cursor.target.mime !== "text/com-rich-text") {
        return false;
      }
      if (origin.context !== buffer.context) {
        ref = buffer.context.createElement(origin.type, origin.toJSON());
      } else {
        ref = origin;
      }
      if (origin === buffer.cursor.target.runeAtIndex(buffer.cursor.anchor.index)) {
        return true;
      }
      origin.context.transact((function(_this) {
        return function() {
          if (origin.parent) {
            origin.parent.reflow();
            return origin.parent.removeText(origin.startOffset, origin.length);
          }
        };
      })(this));
      buffer.context.transact((function(_this) {
        return function() {
          buffer.cursor.conduct("write", ref);
          return ref.dirty = true;
        };
      })(this));
      return (ref1 = buffer.viewPort.controller) != null ? ref1.reform() : void 0;
    };

    ManagerDragCapableTrait.prototype.registerDropHandler = function(handler) {
      if (handler == null) {
        handler = function() {};
      }
      if (this.dropHandlers == null) {
        this.dropHandlers = [];
      }
      return this.dropHandlers.push(handler);
    };

    return ManagerDragCapableTrait;

  })(Trait);

  BufferDropHandler = (function() {
    function BufferDropHandler(buffer1) {
      this.buffer = buffer1;
      this.editor = this.buffer.editor;
      this.viewPort = this.buffer.viewPort;
      this.viewPort.el.addEventListener("user-drop", (function(_this) {
        return function(e) {
          var handler, i, j, len, len1, ref1, ref2;
          ref1 = _this.dropHandlers || [];
          for (i = 0, len = ref1.length; i < len; i++) {
            handler = ref1[i];
            handler(e);
            if (e.defaultPrevented) {
              return;
            }
          }
          ref2 = _this.editor.bufferManager.dropHandlers;
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            handler = ref2[j];
            handler(e, _this.buffer);
            if (e.defaultPrevented) {
              return;
            }
          }
        };
      })(this));
    }

    BufferDropHandler.prototype.registerDropHandler = function(handler) {
      if (handler == null) {
        handler = function() {};
      }
      if (this.dropHandlers == null) {
        this.dropHandlers = [];
      }
      return this.dropHandlers.push(handler);
    };

    return BufferDropHandler;

  })();

  Buffer.RichBuffer = RichBuffer;

  Buffer.BufferManager = BufferManager;

  module.exports = Buffer;

}).call(this);

}
GlobalContext.setModule("vincent/facility/buffer.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/cancelStack.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var CancelEvent, CancelStack,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CancelStack = (function(superClass) {
    extend(CancelStack, superClass);

    function CancelStack(editor) {
      this.editor = editor;
      CancelStack.__super__.constructor.call(this);
      this.stack = [];
      this.emptyHandlers = [];
      this.editor.commands.register({
        name: "cancel-stack-cancel-top",
        handler: (function(_this) {
          return function() {
            return _this.cancelTop();
          };
        })(this)
      });
      this.editor.hotkeys.registerCommandHotkey("editor:escape", "cancel-stack-cancel-top");
      this.historyHandler = this.historyHandler.bind(this);
    }

    CancelStack.prototype.handleEmpty = function() {
      var callback, e, i, len, ref;
      ref = this.emptyHandlers;
      for (i = 0, len = ref.length; i < len; i++) {
        callback = ref[i];
        callback(e = new CancelEvent);
        if (e.isCaptured) {
          return true;
        }
      }
      return false;
    };

    CancelStack.prototype.registerEmptyHandler = function(handlers) {
      return this.emptyHandlers.push(handlers);
    };

    CancelStack.prototype.bindHistory = function(history) {
      this.history = history;
      return this.registerHistory();
    };

    CancelStack.prototype.registerHistory = function() {
      if (!this.history) {
        return;
      }
      this.history.remove(this);
      return this.history.unshift(this, this.historyHandler);
    };

    CancelStack.prototype.historyHandler = function() {
      this.cancelTop();
      return this.registerHistory();
    };

    CancelStack.prototype.cancelTop = function() {
      var item;
      if (this.stack.length > 0) {
        item = this.stack.pop();
        item.callback();
        if (this.stack.length === 0) {
          this.emit("empty");
        }
        return true;
      } else if (this.handleEmpty()) {
        return true;
      } else {
        this.history.remove(this);
      }
      return false;
    };

    CancelStack.prototype.push = function(id, callback) {
      this.registerHistory();
      this.stack.push({
        id: id,
        callback: callback
      });
      if (this.stack.length === 1) {
        return this.emit("occupied");
      }
    };

    CancelStack.prototype.isEmpty = function() {
      return this.stack.length === 0;
    };

    CancelStack.prototype.remove = function(id) {
      var change;
      change = false;
      this.stack = this.stack.filter(function(item) {
        if (item.id === id) {
          change = true;
          return false;
        }
        return true;
      });
      if (this.stack.length === 0 && change) {
        return this.emit("empty");
      }
    };

    return CancelStack;

  })(Leaf.EventEmitter);

  CancelEvent = (function() {
    function CancelEvent() {}

    CancelEvent.prototype.capture = function() {
      return this.isCaptured = true;
    };

    return CancelEvent;

  })();

  module.exports = CancelStack;

}).call(this);

}
GlobalContext.setModule("vincent/facility/cancelStack.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/caret.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var BoundaryEffectTracer, Caret, CaretActionTrait, CaretBlinkableTrait, CaretLayout, CaretPosition, CaretViewPortPoserTrait, CaretWritableTrait, DOMBoundary, DOMRegion, EventEmitter,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  DOMRegion = require("../common/region");

  DOMBoundary = require("../common/boundary");

  EventEmitter = (require("../common/events")).EventEmitter;

  Caret = (function(superClass) {
    extend(Caret, superClass);

    function Caret(editor, option) {
      this.editor = editor;
      if (option == null) {
        option = {};
      }
      this.template = "<div class=\"caret\" data-class=\"caretName,visibleState\"><div data-id=\"shape\" class=\"shape\"></div></div>";
      Caret.__super__.constructor.call(this);
      this.name = option.name || "master";
      this.VM.caretName = "caret-" + this.name;
      this.shape = this.UI.shape;
      this.shape$ = this.UI.shape$;
      this.__defineGetter__("dirty", (function(_this) {
        return function() {
          return _this._dirty;
        };
      })(this));
      this.__defineSetter__("dirty", (function(_this) {
        return function(value) {
          return _this._dirty = value;
        };
      })(this));
      this.boundaryEffectTracer = new BoundaryEffectTracer(this);
    }

    Caret.prototype.init = function() {
      window.addEventListener("resize", (function(_this) {
        return function() {
          return _this.dirty = true;
        };
      })(this));
      this.node.addEventListener("mousedown", (function(_this) {
        return function(e) {
          return _this.onClick(e);
        };
      })(this));
      if (this.editor.platform.isMobile()) {
        this.editor.inputMethod.listenBy(this, "key", (function(_this) {
          return function(e) {
            if (e.simulateName) {
              return setTimeout(function() {
                _this.isScrolling = false;
                return _this.dirty = true;
              }, 0);
            }
          };
        })(this));
      }
      this.keyHandlers = {};
      new CaretViewPortPoserTrait(this);
      new CaretActionTrait(this);
      return new CaretBlinkableTrait(this);
    };

    Caret.prototype.destroy = function() {
      var ref, ref1, ref2, ref3;
      this.editor.inputMethod.stopListenBy(this);
      if ((ref = this.cursor) != null) {
        ref.stopListenBy(this);
      }
      if ((ref1 = this.context) != null) {
        ref1.stopListenBy(this);
      }
      if ((ref2 = this.currentBuffer) != null) {
        ref2.stopListenBy(this);
      }
      return (ref3 = this.node.parentElement) != null ? ref3.removeChild(this.node) : void 0;
    };

    Caret.prototype.dirtyConfirm = function() {
      clearTimeout(this.dirtyConfirmTimer);
      return this.dirtyConfirmTimer = setTimeout((function(_this) {
        return function() {
          return _this.dirty = true;
        };
      })(this), 10);
    };

    Caret.prototype.attachTo = function(buffer, cursor) {
      if (!buffer.interactive) {
        return false;
      }
      if (this.cursor) {
        this.cursor.stopListenBy(this);
      }
      if (this.context) {
        this.context.stopListenBy(this);
      }
      if (this.currentBuffer) {
        this.currentBuffer.stopListenBy(this);
      }
      this.dirty = true;
      this.viewPort = buffer.viewPort;
      this.currentBuffer = buffer;
      buffer.ensureRenderContext();
      this.cursor = cursor || buffer.cursor;
      this.cursor.listenBy(this, "move", (function(_this) {
        return function() {
          _this.currentBuffer.disableSaveBestPosition = false;
          _this.isScrolling = false;
          if (_this.name === "master") {
            _this.requestScroll = true;
          }
          return _this.dirty = true;
        };
      })(this));
      this.cursor.listenBy(this, "trigger", (function(_this) {
        return function() {
          return _this.forceBump = true;
        };
      })(this));
      this.context = buffer.context;
      this.context.listenBy(this, "change", (function(_this) {
        return function() {
          _this.dirty = true;
          if (_this.name === "master") {
            _this.requestScroll = true;
          }
          if (_this.node.parentElement !== _this.currentBuffer.viewPort.el) {
            _this.currentBuffer.viewPort.el.appendChild(_this.node);
          }
          return _this.dirtyConfirm();
        };
      })(this));
      this.currentBuffer.listenBy(this, "interactiveChange", function(change) {
        return this.update();
      });
      this.currentBuffer.listenBy(this, "resize", (function(_this) {
        return function() {
          return _this.dirty = true;
        };
      })(this));
      this.currentBuffer.listenBy(this, "reflow", (function(_this) {
        return function() {
          _this.emit("bufferReflow");
          if (!_this.editor.platform.isMobile()) {
            return;
          }
          _this.isScrolling = true;
          clearTimeout(_this._scrollTimer);
          return _this._scrollTimer = setTimeout(function() {
            return _this.isScrolling = false;
          }, 350);
        };
      })(this));
      this.switchingBuffer = true;
      if (this.isShow) {
        this.isShow = false;
        this.show();
        return this.update();
      }
    };

    Caret.prototype.onClick = function(e) {
      if (e.which !== 1) {
        return;
      }
      if (this.editor.conduct("trigger")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      return false;
    };

    Caret.prototype.compareRect = function(a, b) {
      var i, len, prop, props;
      props = ["left", "right", "top", "bottom"];
      for (i = 0, len = props.length; i < len; i++) {
        prop = props[i];
        if (parseInt(a[prop]) !== parseInt(b[prop])) {
          return false;
        }
      }
      return true;
    };

    Caret.prototype.bump = function() {
      this.forceBump = true;
      return this.update();
    };

    Caret.prototype.update = function(option) {
      var e, error;
      if (option == null) {
        option = {};
      }
      if (this.isScrolling) {
        return;
      }
      this._update();
      this.applyBlink();
      return;
      try {
        return this._update();
      } catch (error) {
        e = error;
        Logger.error("fail to update caret");
        return Logger.error(e);
      }
    };

    Caret.prototype._update = function(option) {
      var boudnary, boundary, caretLayout, ref, ref1, style, visualPosition;
      if (option == null) {
        option = {};
      }
      if (!this.cursor) {
        return;
      }
      if (!this.currentBuffer.isActive) {
        this.lastActive = false;
        return;
      }
      if (!this.currentBuffer.interactive) {
        this.hide();
        return;
      } else {
        this.show();
      }
      if (!((ref = this.currentBuffer) != null ? ref.selection.isCollapsed() : void 0) && ((ref1 = this.currentBuffer) != null ? ref1.selection.isActive : void 0)) {
        this.node.classList.add("selecting");
      } else {
        this.node.classList.remove("selecting");
      }
      if (this.currentBuffer.lockUserInput) {
        this.shape.classList.add("lock");
      } else {
        this.shape.classList.remove("lock");
      }
      if (this.lastBuffer !== this.currentBuffer || !this.lastActive || this.forceBump) {
        clearTimeout(this.bumpTimer);
        clearTimeout(this.clearTimer);
        this.shape.classList.remove("bump");
        this.shape.classList.remove("bump-minor");
        this.bumpTimer = setTimeout((function(_this) {
          return function() {
            var ref2;
            if (_this.lastRenderDetail && ((ref2 = _this.lastRenderDetail) != null ? ref2.height : void 0) > 48) {
              _this.shape.classList.add("bump-minor");
            } else {
              _this.shape.classList.add("bump");
            }
            return _this.clearTimer = setTimeout(function() {
              _this.shape.classList.remove("bump");
              return _this.shape.classList.remove("bump-minor");
            }, 100);
          };
        })(this), 10);
      }
      this.forceBump = false;
      this.lastBuffer = this.currentBuffer;
      this.lastActive = true;
      if (this.animating) {
        this.animateFrame();
      }
      if (!option.force && !this.dirty) {
        return false;
      }
      this.currentBuffer.ensureRenderContext();
      boundary = this.cursor.getBoundary();
      visualPosition = this.cursor.getVisualPosition();
      if (visualPosition) {
        while (this.dirty) {
          caretLayout = new CaretLayout(this, visualPosition);
          boudnary = caretLayout.toBoundary();
          if (boundary) {
            this.boundaryEffectTracer.updateEffect(boundary);
          }
          this.updatePosition(caretLayout);
          this.dirty = false;
        }
      }
      style = this.cursor.getStyle();
      this.applyStyle(style);
      if (this.animating) {
        return this.animateFrame();
      }
    };

    Caret.prototype.updatePosition = function(layout) {
      var renderDetail, visualPosition;
      if (!this.isActive) {
        return false;
      }
      if (!layout) {
        this.hide();
        return;
      } else {
        this.show();
      }
      visualPosition = layout.visualPosition;
      renderDetail = layout.getRenderDetail();
      if (!renderDetail) {
        return;
      }
      this.lastRenderDetail = renderDetail;
      this.currentBuffer.lastCaretRenderDetail = this.lastRenderDetail;
      if (renderDetail.type === "cover") {
        this.shape.classList.add("cover");
      } else {
        this.shape.classList.remove("cover");
      }
      this.showType = renderDetail.type;
      this.setAnimateTo(renderDetail);
      this.emit("move", renderDetail);
      this.saveBestPosition(layout);
      if (this.requestScroll && !this.editor.platform.isMobile()) {
        this.scrollViewPortToComfortable();
        this.requestScroll = false;
      }
      return this.switchingBuffer = false;
    };

    Caret.prototype.applyNodePosition = function() {
      var ps;
      ps = this.nodePosition;
      this.shape$.css({
        width: ps.width,
        height: ps.height
      });
      return this.node$.css({
        transform: "translateX(" + (Math.round(ps.left)) + "px) translateY(" + (Math.round(ps.top)) + "px)"
      });
    };

    Caret.prototype.setAnimateTo = function(targetPosition) {
      var distance, type, x, y;
      type = targetPosition.type;
      if (type === "cover@disable") {
        this.node.classList.remove("jump");
      } else {
        if (!this.nodePosition) {
          this.node.classList.add("jump");
        } else {
          x = Math.abs(targetPosition.left - this.nodePosition.left);
          y = Math.abs(targetPosition.top - this.nodePosition.top);
          distance = Math.sqrt(x * x + y * y);
          if (distance > 100 || this.switchingBuffer) {
            this.node.classList.add("jump");
          } else {
            this.node.classList.remove("jump");
          }
        }
      }
      this.nodePosition = targetPosition;
      this.applyNodePosition();
    };

    Caret.prototype.saveBestPosition = function(layout) {
      var bestX;
      if (this.currentBuffer.disableSaveBestPosition) {
        return;
      }
      bestX = layout.getCenterX();
      if (this.lastBestX !== bestX) {
        this.currentBuffer.bestCaretOffset = bestX;
        return this.lastBestX = bestX;
      }
    };

    Caret.prototype.show = function() {
      var ref;
      if (this.isShow) {
        return;
      }
      this.isShow = true;
      if (((ref = this.currentBuffer) != null ? ref.viewPort : void 0) && this.node.parentElement !== this.currentBuffer.viewPort.el) {
        this.currentBuffer.viewPort.el.appendChild(this.node);
      }
      this.VM.visibleState = "shown";
      return this.activate();
    };

    Caret.prototype.cloak = function() {
      this.show();
      return this.VM.visibleState = "cloaked";
    };

    Caret.prototype.hide = function() {
      if (!this.isShow) {
        return;
      }
      this.isShow = false;
      this.deactivate();
      return this.VM.visibleState = "hidden";
    };

    Caret.prototype.activate = function() {
      if (this.isActive) {
        return;
      }
      this.isActive = true;
      return this.applyBlink();
    };

    Caret.prototype.deactivate = function() {
      if (!this.isActive) {
        return;
      }
      this.isActive = false;
      return clearTimeout(this.blinkTimer);
    };

    Caret.prototype.applyStyle = function(style) {
      var className;
      if (style == null) {
        style = {};
      }
      className = style.className;
      if (className === this.currentClassName) {
        return false;
      }
      this.shape.classList.remove(this.currentClassName);
      this.shape.classList.add(className);
      this.currentClassName = className;
      return true;
    };

    return Caret;

  })(Leaf.Widget);

  CaretBlinkableTrait = (function(superClass) {
    extend(CaretBlinkableTrait, superClass);

    function CaretBlinkableTrait() {
      return CaretBlinkableTrait.__super__.constructor.apply(this, arguments);
    }

    CaretBlinkableTrait.prototype.initialize = function() {
      this.blinkStart = Date.now();
      return this.listenBy(CaretBlinkableTrait, "move", (function(_this) {
        return function() {
          return _this.resetBlink();
        };
      })(this));
    };

    CaretBlinkableTrait.prototype.resetBlink = function() {
      return this.blinkStart = Date.now();
    };

    CaretBlinkableTrait.prototype.shouldBlinkShow = function() {
      var hideTime, left, showTime;
      showTime = 800;
      hideTime = 500;
      left = (Date.now() - this.blinkStart) % (showTime + hideTime);
      if (left > showTime) {
        return false;
      }
      return true;
    };

    CaretBlinkableTrait.prototype.applyBlink = function() {
      if (!this.shouldBlinkShow()) {
        return this.shape.classList.add("blink-off");
      } else {
        return this.shape.classList.remove("blink-off");
      }
    };

    return CaretBlinkableTrait;

  })(Leaf.Trait);

  CaretWritableTrait = (function(superClass) {
    extend(CaretWritableTrait, superClass);

    function CaretWritableTrait() {
      return CaretWritableTrait.__super__.constructor.apply(this, arguments);
    }

    CaretWritableTrait.prototype.initialize = function() {
      return this.applyWritableListener();
    };

    CaretWritableTrait.prototype.markAsWritable = function() {
      this.unwritable = false;
      return this.shape.classList.remove("unwritable");
    };

    CaretWritableTrait.prototype.unmarkAsWritable = function() {
      this.unwritable = true;
      return this.shape.classList.add("unwritable");
    };

    CaretWritableTrait.prototype.applyWritableListener = function() {
      return this.editor.bufferManager.listenBy(this, "focus", (function(_this) {
        return function(buffer) {
          var Buffer;
          Buffer = require("./buffer");
          if (buffer instanceof Buffer.RichBuffer) {
            return _this.markAsWritable();
          } else {
            return _this.unmarkAsWritable();
          }
        };
      })(this));
    };

    return CaretWritableTrait;

  })(Leaf.Trait);

  CaretActionTrait = (function(superClass) {
    extend(CaretActionTrait, superClass);

    function CaretActionTrait() {
      return CaretActionTrait.__super__.constructor.apply(this, arguments);
    }

    CaretActionTrait.prototype.forwardChar = function() {
      var ref;
      if (!this.isActive) {
        return false;
      }
      return (ref = this.cursor) != null ? ref.conduct("forwardChar") : void 0;
    };

    CaretActionTrait.prototype.backwardChar = function() {
      var ref;
      if (!this.isActive) {
        return false;
      }
      return (ref = this.cursor) != null ? ref.conduct("backwardChar") : void 0;
    };

    CaretActionTrait.prototype.vertical = function(step) {
      var MAX, bestCursorData, bestRegion, bestX, breakDy, canBreak, counter, currentPoint, cursor, dx, dy, lastDx, moveOnce, next, previous, rd, result, startPoint, topStart, vp;
      if (!this.isActive) {
        return false;
      }
      this.currentBuffer.render();
      if (step > 0) {
        next = this.forwardChar.bind(this);
        previous = this.backwardChar.bind(this);
      } else {
        previous = this.forwardChar.bind(this);
        next = this.backwardChar.bind(this);
      }
      cursor = this.cursor;
      bestRegion = null;
      bestX = this.currentBuffer.bestCaretOffset;
      vp = this.cursor.getVisualPosition();
      if (!vp) {
        return false;
      }
      rd = CaretLayout.getRenderDetail(this, vp);
      topStart = rd.top;
      startPoint = rd.center;
      if (typeof bestX === "number") {
        startPoint.x = bestX;
      }
      lastDx = null;
      counter = 0;
      MAX = 1000;
      this.cursor.startTeleport();
      while (true) {
        if (counter > MAX) {
          Logger.error("Unlimited caret move");
          return true;
        }
        result = next();
        if (!result) {
          break;
        }
        counter += 1;
        moveOnce = true;
        vp = this.cursor.getVisualPosition();
        if (!vp) {
          continue;
        }
        rd = CaretLayout.getRenderDetail(this, vp);
        if (!rd) {
          continue;
        }
        if ((rd.top - topStart) * step <= 0) {
          continue;
        }
        currentPoint = rd.center;
        dy = currentPoint.y - startPoint.y;
        if (dy * step > 0 && Math.abs(dy) - Math.abs(step) > 0) {
          if (!canBreak) {
            breakDy = dy;
            canBreak = true;
          } else {
            if (Math.abs(dy - breakDy) > Math.abs(step) && bestCursorData) {
              break;
            }
          }
        }
        if (canBreak) {
          dx = Math.abs(currentPoint.x - startPoint.x);
          if (typeof lastDx !== "number") {
            bestCursorData = this.cursor.getData();
            lastDx = dx;
          } else if (dx <= lastDx) {
            bestCursorData = this.cursor.getData();
            lastDx = dx;
          } else if (dx > lastDx) {
            break;
          }
        }
      }
      if (!bestCursorData) {
        this.cursor.endTeleport();
        return moveOnce;
      }
      this.cursor.pointAtAnchor(bestCursorData.anchor);
      this.cursor.endTeleport();
      return true;
    };

    CaretActionTrait.prototype.verticalJump = function(step) {
      var bestRegion, bestX, boundary, charCount, counter, currentPoint, cursor, dy, estimate, estimation, getDist, greedy, greedyLimit, lastDy, lastEstimation, method, minVerticalChange, moveOnce, rect, ref, region, startPoint, topStart;
      if (!this.isActive) {
        return false;
      }
      if (step > 0) {
        method = "forwardChar";
      } else {
        method = "backwardChar";
      }
      cursor = this.cursor;
      boundary = cursor.getBoundary();
      region = DOMRegion.fromBoundary(boundary);
      rect = region.getClientRect();
      topStart = rect.top;
      bestRegion = null;
      greedy = true;
      greedyLimit = 10;
      minVerticalChange = 12;
      lastEstimation = 9999999;
      bestX = this.currentBuffer.bestCaretOffset;
      if (boundary.type === "include") {
        startPoint = {
          x: typeof bestX === "number" && bestX || (rect.left + rect.right) / 2,
          y: (rect.top + rect.bottom) / 2
        };
      } else {
        startPoint = {
          x: typeof bestX === "number" && bestX || rect.left,
          y: (rect.top + rect.bottom) / 2
        };
      }
      counter = 0;
      estimate = function(base, current) {
        var dx, dy;
        dx = current.x - base.x;
        dy = current.y - base.y;
        if (Math.abs(dy) < minVerticalChange) {
          return 999999999;
        }
        return dx * dx + dy * dy;
      };
      charCount = 0;
      while (this[method]()) {
        moveOnce = true;
        boundary = this.cursor.getBoundary();
        if (!boundary) {
          break;
        }
        region = DOMRegion.fromBoundary(boundary);
        rect = region.getRect({
          top: (ref = this.viewPort) != null ? ref.el : void 0
        });
        if (!rect) {
          break;
        }
        if ((rect.top - topStart) * step <= 0) {
          continue;
        }
        getDist = function(x, y) {
          return x * x + y * y;
        };
        if (boundary.type === "include") {
          currentPoint = {
            x: (rect.left + rect.right) / 2,
            y: (rect.top + rect.bottom) / 2
          };
        } else {
          currentPoint = {
            x: rect.left,
            y: (rect.top + rect.bottom) / 2
          };
        }
        estimation = estimate(startPoint, currentPoint);
        if (estimation < lastEstimation) {
          bestRegion = region;
          lastEstimation = estimation;
          continue;
        }
        dy = currentPoint.y - startPoint.y;
        if (typeof lastDy === "number") {
          charCount += 1;
          if (charCount > 80 && bestRegion) {
            break;
          }
        }
        if (typeof lastDy !== "number") {
          if ((dy - lastDy) * step > 0) {
            counter += 1;
            lastDy = dy;
          }
        }
        if (counter > greedyLimit) {
          greedy = false;
        }
        if (!greedy && bestRegion) {
          break;
        }
      }
      if (!bestRegion) {
        return moveOnce;
      }
      cursor.setCursorByDOMRegion(bestRegion);
      return true;
    };

    CaretActionTrait.prototype.downwardChar = function() {
      var ref, result;
      if (!this.isActive) {
        return false;
      }
      if ((ref = this.cursor) != null ? ref.conduct("downwardChar") : void 0) {
        return true;
      }
      result = this.vertical(12);
      this.currentBuffer.disableSaveBestPosition = true;
      return result;
    };

    CaretActionTrait.prototype.upwardChar = function() {
      var ref, result;
      if (!this.isActive) {
        return false;
      }
      if ((ref = this.cursor) != null ? ref.conduct("upwardChar") : void 0) {
        return true;
      }
      result = this.vertical(-12);
      return this.currentBuffer.disableSaveBestPosition = true;
    };

    CaretActionTrait.prototype.write = function(value) {
      var ref, result;
      if (!this.isActive) {
        return false;
      }
      if (!this.lastWrite) {
        this.lastWrite = Date.now();
      }
      if (this.historyInterval == null) {
        this.historyInterval = 1000 * 5;
      }
      this.lastWrite = Date.now();
      result = (ref = this.cursor) != null ? ref.conduct("write", value) : void 0;
      return result;
    };

    CaretActionTrait.prototype.begin = function() {
      return this.cursor.begin();
    };

    CaretActionTrait.prototype.end = function() {
      return this.cursor.end();
    };

    return CaretActionTrait;

  })(Leaf.Trait);

  CaretViewPortPoserTrait = (function(superClass) {
    extend(CaretViewPortPoserTrait, superClass);

    function CaretViewPortPoserTrait() {
      return CaretViewPortPoserTrait.__super__.constructor.apply(this, arguments);
    }

    CaretViewPortPoserTrait.prototype.getViewPortComfortableRelation = function() {
      var bottom, rd, top;
      rd = this.currentBuffer.lastCaretRenderDetail;
      if (!rd) {
        return 0;
      }
      top = this.viewPort.scrollable.scrollTop;
      bottom = top + this.viewPort.height;
      if (rd.top - this.viewPort.comfortableMargin < top && top > 0) {
        return rd.top - this.viewPort.comfortableMargin - this.viewPort.scrollable.scrollTop;
      }
      if (rd.bottom + this.viewPort.comfortableMargin > bottom) {
        return rd.bottom + this.viewPort.comfortableMargin - this.viewPort.height - this.viewPort.scrollable.scrollTop;
      }
      return 0;
    };

    CaretViewPortPoserTrait.prototype.inViewPortComfortableZone = function() {
      var bottom, rd, top;
      rd = this.currentBuffer.lastCaretRenderDetail;
      if (!rd) {
        return false;
      }
      top = this.viewPort.scrollable.scrollTop;
      bottom = top + this.viewPort.height;
      return rd.top - this.viewPort.comfortableMargin < top && rd.bottom + this.viewPort.comfortableMargin > bottom;
    };

    CaretViewPortPoserTrait.prototype.moveToViewPortCenter = function(option) {
      var center, change, left, lr, notIncludeCenter, rect, scrollTop, top;
      if (option == null) {
        option = {};
      }
      rect = this.viewPort.el.getBoundingClientRect();
      if (!rect) {
        return;
      }
      left = (this.viewPort.buffer.bestCaretOffset || 0) + rect.left;
      top = this.viewPort.height / 2;
      change = false;
      notIncludeCenter = false;
      scrollTop = this.viewPort.scrollable.scrollTop;
      if (!this.viewPort.buffer.lastCaretRenderDetail) {
        change = true;
        notIncludeCenter = true;
      } else {
        lr = this.viewPort.buffer.lastCaretRenderDetail;
        center = scrollTop + rect.height / 2;
        if (lr.bottom < center || lr.top > center) {
          notIncludeCenter = true;
        } else {
          notIncludeCenter = false;
        }
        if (Math.abs(this.viewPort.buffer.lastCaretRenderDetail.top - (top + scrollTop)) > 30) {
          change = true;
        }
      }
      if ((notIncludeCenter && change) || option.force) {
        this.viewPort.setCursorByClientPoint(left, top);
      }
      return this.viewPort.buffer.disableSaveBestPosition = true;
    };

    CaretViewPortPoserTrait.prototype.moveToViewPortComfortableZoneLazy = function() {
      var left, move, top;
      move = this.getViewPortComfortableRelation();
      if (move === 0) {
        return false;
      }
      left = this.currentBuffer.bestCaretOffset || 0;
      if (move > 0) {
        top = this.viewPort.height - this.viewPort.comfortableMargin;
      } else {
        top = this.viewPort.comfortableMargin;
      }
      this.viewPort.setCursorByClientPoint(left, top + 10);
      return true;
    };

    CaretViewPortPoserTrait.prototype.scrollViewPortToComfortable = function(arg) {
      var center, rd, rect, ref;
      center = (arg != null ? arg : {}).center;
      rd = (ref = this.currentBuffer) != null ? ref.lastCaretRenderDetail : void 0;
      if (!rd) {
        return;
      }
      rect = {
        width: rd.width,
        height: rd.height,
        left: rd.left,
        top: rd.top,
        right: rd.left + rd.width,
        bottom: rd.top + rd.height
      };
      return this.viewPort.scrollToRectComfortableZone(rect, {
        forceCenter: rd.height > this.viewPort.height / 2 || center
      });
    };

    return CaretViewPortPoserTrait;

  })(Leaf.Trait);

  BoundaryEffectTracer = (function() {
    function BoundaryEffectTracer(caret1) {
      this.caret = caret1;
      this.name = this.caret.name || "master";
      this.affected = [];
      this.__defineSetter__("dirty", function(value) {
        if (this.caret.dirty !== value) {
          this.caret.dirty = value;
        }
        if (value) {
          return this.sessionDirty = true;
        }
      });
      this.__defineGetter__("dirty", function() {
        return this.caret.dirty;
      });
    }

    BoundaryEffectTracer.prototype.getAffectedNode = function(boundary) {
      var cDecPart, cDecs, cText, className, i, j, left, len, len1, match, next, oldAffected, prev, previous, ref, ref1, result, right;
      if (boundary.type === "include") {
        return oldAffected = [boundary.node];
      } else if (boundary.node.nodeType === boundary.node.TEXT_NODE) {
        cDecPart = boundary.node.parentElement;
        cDecs = [cDecPart];
        if (boundary.offset === 0 && (boundary.type === "left" || !boundary.type)) {
          prev = cDecPart.previousElementSibling;
          if (prev) {
            cDecs.unshift(prev);
          }
        } else if ((boundary.offset === boundary.node.length && boundary.type === "left") || (boundary.offset === boundary.node.length - 1 && boundary.type === "right")) {
          next = cDecPart.nextElementSibling;
          if (next) {
            cDecs.push(next);
          }
        }
        cText = cDecPart != null ? cDecPart.parentElement : void 0;
        if (cDecPart != null ? cDecPart.classList.contains("com-holder") : void 0) {
          return [];
        }
        if (!cText || !cText.classList.contains("com-text")) {
          return [];
        }
        result = [cDecPart];
        previous = cDecPart;
        left = cDecs[0];
        right = cDecs[cDecs.length - 1];
        while (previous = previous.previousElementSibling) {
          match = false;
          ref = previous.classList;
          for (i = 0, len = ref.length; i < len; i++) {
            className = ref[i];
            if (className.indexOf("com-inline") !== 0 && className.indexOf("com-group") !== 0) {
              continue;
            }
            if (left.classList.contains(className)) {
              match = true;
              break;
            }
            if (match) {
              break;
            }
          }
          if (!match) {
            break;
          }
          result.unshift(previous);
        }
        next = cDecPart;
        while (next = next.nextElementSibling) {
          match = false;
          ref1 = next.classList;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            className = ref1[j];
            if (className.indexOf("com-inline") !== 0) {
              continue;
            }
            if (right.classList.contains(className)) {
              match = true;
              break;
            }
            if (match) {
              break;
            }
          }
          if (!match) {
            break;
          }
          result.push(next);
        }
        return result;
      } else {
        return [];
      }
    };

    BoundaryEffectTracer.prototype.updateEffect = function(boundary) {
      var d1, d2, d3, d4, ref;
      this.sessionDirty = false;
      this.updateOverEffect(boundary);
      d1 = this.dirty;
      this.updateAdjacentEffect(boundary);
      d2 = this.dirty;
      this.updateNearbyEffect(boundary);
      d3 = this.dirty;
      this.updateKeyPathEffect(boundary);
      d4 = this.dirty;
      if (this.sessionDirty) {
        return (ref = this.caret.currentBuffer) != null ? ref.emit("resize") : void 0;
      }
    };

    BoundaryEffectTracer.prototype.updateKeyPathEffect = function(b) {
      var drop, el, i, index, item, j, k, kps, len, len1, len2, offset, ref, ref1;
      if (this.keyPathElements == null) {
        this.keyPathElements = [];
      }
      kps = [];
      b = new DOMBoundary(b);
      el = b.getTargetParent();
      while (el && el.parentElement && el.parentElement !== this.caret.currentBuffer.viewPort.el) {
        if (el.classList) {
          kps.unshift(el);
        }
        el = el.parentElement;
      }
      index = -1;
      ref = this.keyPathElements;
      for (offset = i = 0, len = ref.length; i < len; offset = ++i) {
        item = ref[offset];
        if (kps[offset] !== item) {
          break;
        }
        index = offset;
      }
      index += 1;
      drop = this.keyPathElements.splice(index);
      for (j = 0, len1 = drop.length; j < len1; j++) {
        item = drop[j];
        item.classList.remove(this.name + "-caret-key-path");
        this.dirty = true;
      }
      kps = kps.slice(index);
      for (k = 0, len2 = kps.length; k < len2; k++) {
        item = kps[k];
        this.dirty = true;
        item.classList.add(this.name + "-caret-key-path");
      }
      (ref1 = this.keyPathElements).push.apply(ref1, kps);
      return true;
    };

    BoundaryEffectTracer.prototype.updateAdjacentEffect = function(b) {
      var adjacent, ref, ref1, ref2, ref3;
      b = new DOMBoundary(b);
      adjacent = b.getAdjacentElement();
      if (adjacent.left !== this.leftAdjacent) {
        if ((ref = this.leftAdjacent) != null) {
          ref.classList.remove(this.name + "-caret-right");
        }
        if ((ref1 = adjacent.left) != null) {
          ref1.classList.add(this.name + "-caret-right");
        }
        this.leftAdjacent = adjacent.left;
        this.dirty = true;
      }
      if (adjacent.right !== this.rightAdjacent) {
        if ((ref2 = this.rightAdjacent) != null) {
          ref2.classList.remove(this.name + "-caret-left");
        }
        if ((ref3 = adjacent.right) != null) {
          ref3.classList.add(this.name + "-caret-left");
        }
        this.rightAdjacent = adjacent.right;
        return this.dirty = true;
      }
    };

    BoundaryEffectTracer.prototype.updateOverEffect = function(b) {
      var base1, base2, maxParent, node, ref, ref1, ref2, ref3;
      maxParent = 5;
      node = b.node;
      while ((node = node.parentElement) && maxParent > 0) {
        maxParent -= 1;
        if (((ref = node.classList) != null ? typeof ref.contains === "function" ? ref.contains("com-text") : void 0 : void 0) || ((ref1 = node.classList) != null ? typeof ref1.contains === "function" ? ref1.contains("com-holder") : void 0 : void 0)) {
          break;
        }
      }
      if (typeof (base1 = node.classList).contains === "function" ? base1.contains("com-holder") : void 0) {
        node = node.previousElementSibling || null;
      }
      if (!node || !(typeof (base2 = node.classList).contains === "function" ? base2.contains("com-text") : void 0)) {
        if (this.overText) {
          if ((ref2 = this.overText) != null) {
            ref2.classList.remove(this.name + "-caret-over");
          }
          this.overText = null;
          this.dirty = true;
        }
        return;
      }
      if (node === this.overText && this.overText) {
        return;
      }
      this.dirty = true;
      if ((ref3 = this.overText) != null) {
        ref3.classList.remove(this.name + "-caret-over");
      }
      this.overText = node;
      return this.overText.classList.add(this.name + "-caret-over");
    };

    BoundaryEffectTracer.prototype.updateNearbyEffect = function(boundary) {
      var i, index, item, j, k, len, len1, len2, modified, newAffected, oldAffected, results;
      oldAffected = this.affected.slice(0);
      newAffected = this.getAffectedNode(boundary);
      modified = true;
      if (oldAffected.length === newAffected.length) {
        modified = false;
        for (index = i = 0, len = newAffected.length; i < len; index = ++i) {
          item = newAffected[index];
          if (item !== oldAffected[index]) {
            modified = true;
            break;
          }
        }
      }
      this.affected = newAffected;
      if (!modified) {
        return false;
      }
      this.dirty = true;
      for (j = 0, len1 = oldAffected.length; j < len1; j++) {
        item = oldAffected[j];
        item.classList.remove(this.name + "-caret-nearby");
      }
      results = [];
      for (k = 0, len2 = newAffected.length; k < len2; k++) {
        item = newAffected[k];
        results.push(item.classList.add(this.name + "-caret-nearby"));
      }
      return results;
    };

    return BoundaryEffectTracer;

  })();

  CaretPosition = (function() {
    function CaretPosition(caret1, boundary) {
      this.caret = caret1;
      this.editor = this.caret.editor;
      this.node = boundary != null ? boundary.node : void 0;
      this.index = (boundary != null ? boundary.index : void 0) || (boundary != null ? boundary.offset : void 0);
      this.char = boundary != null ? boundary.char : void 0;
      this.boundary = boundary;
      this.type = this.boundary.type;
      this.viewPort = this.caret.viewPort || null;
    }

    CaretPosition.prototype.getRect = function(right) {
      var rect, ref;
      if (this.region == null) {
        this.region = DOMRegion.fromBoundary(this.boundary);
      }
      rect = this.region.getRect({
        top: (ref = this.viewPort) != null ? ref.el : void 0
      });
      this.caret.viewPort.resolveRect(rect);
      return rect;
    };

    return CaretPosition;

  })();

  CaretLayout = (function() {
    CaretLayout.getRenderDetail = function(caret, vp) {
      var layout;
      layout = new CaretLayout(caret, vp);
      return layout.getRenderDetail();
    };

    function CaretLayout(caret1, visualPosition1) {
      var heightExpand, widthExpand;
      this.caret = caret1;
      this.visualPosition = visualPosition1;
      widthExpand = 0;
      heightExpand = 0;
    }

    CaretLayout.prototype.getRenderDetail = function() {
      var height, heightExpand, i, item, left, leftFix, len, orders, rd, rect, top, topFix, type, valid, vp, width, widthExpand;
      vp = this.visualPosition;
      widthExpand = 0;
      heightExpand = 0;
      topFix = 0;
      leftFix = 0;
      width = 2;
      if (vp.center) {
        orders = ["center"];
      } else if (vp.right && vp.priority === "right") {
        orders = ["right", "left"];
      } else {
        orders = ["left", "right"];
      }
      valid = false;
      for (i = 0, len = orders.length; i < len; i++) {
        item = orders[i];
        if (item === "center") {
          if (!vp.center) {
            continue;
          }
          rect = this.getCenterRect();
          if (!rect) {
            continue;
          }
          width = rect.width;
          height = rect.height;
          top = rect.top;
          left = rect.left;
          heightExpand = 4;
          widthExpand = 4;
          type = "cover";
          valid = true;
          break;
        } else if (item === "right") {
          if (!vp.right) {
            continue;
          }
          rect = this.getRightRect();
          if (!rect) {
            continue;
          }
          height = rect.height;
          heightExpand = Math.min(height * 0.3, 4);
          if (vp.right.position === "right") {
            left = rect.right;
          } else {
            left = rect.left;
          }
          top = rect.top;
          type = "caret";
          valid = true;
          break;
        } else if (item === "left") {
          if (!vp.left) {
            continue;
          }
          rect = this.getLeftRect();
          if (!rect) {
            continue;
          }
          height = rect.height;
          heightExpand = Math.min(height * 0.3, 4);
          if (vp.left.position === "right") {
            left = rect.right;
          } else {
            left = rect.left;
          }
          top = rect.top;
          type = "caret";
          valid = true;
          break;
        }
      }
      if (!valid) {
        return null;
      }
      leftFix = -widthExpand / 2;
      topFix = -heightExpand / 2;
      rd = {
        height: height + heightExpand,
        width: width + widthExpand,
        top: top + topFix,
        left: left + leftFix,
        type: type
      };
      rd.bottom = rd.top + rd.height;
      rd.right = rd.left + rd.width;
      rd.__defineGetter__("center", (function(_this) {
        return function() {
          return rd.center = {
            y: (rd.top + rd.bottom) / 2,
            x: (rd.left + rd.right) / 2
          };
        };
      })(this));
      return rd;
    };

    CaretLayout.prototype.getCenterX = function() {
      var ref, ref1;
      return (ref = this.getRenderDetail()) != null ? (ref1 = ref.center) != null ? ref1.x : void 0 : void 0;
    };

    CaretLayout.prototype.equalTo = function(target) {
      return this.rectIdentical(this.getCenterRect(), target.getCenterRect()) && this.rectIdentical(this.getLeftRect(), target.getLeftRect()) && this.rectIdentical(this.getRightRect(), target.getRightRect());
    };

    CaretLayout.prototype.rectIdentical = function(a, b) {
      var i, len, prop, props;
      if (!a && !b) {
        return true;
      }
      if (a && b) {
        props = ["left", "right", "top", "bottom"];
        for (i = 0, len = props.length; i < len; i++) {
          prop = props[i];
          if (parseInt(a[prop]) !== parseInt(b[prop])) {
            return false;
          }
        }
        return true;
      }
      return false;
    };

    CaretLayout.prototype.getCenterRect = function() {
      var vp;
      vp = this.visualPosition;
      if (!vp.center) {
        return null;
      }
      return this.centerRect || (this.centerRect = this._getBorderRect(vp.center));
    };

    CaretLayout.prototype.getLeftRect = function() {
      var vp;
      vp = this.visualPosition;
      if (!vp.left) {
        return null;
      }
      return this.leftRect || (this.leftRect = this._getBorderRect(vp.left));
    };

    CaretLayout.prototype.getRightRect = function() {
      var vp;
      vp = this.visualPosition;
      if (!vp.right) {
        return null;
      }
      return this.rightRect || (this.rightRect = this._getBorderRect(vp.right));
    };

    CaretLayout.prototype._getBorderRect = function(border) {
      var rect, ref, region;
      region = new DOMRegion(border.node, border.offset);
      rect = region.getRect({
        top: (ref = this.caret.viewPort) != null ? ref.el : void 0
      });
      if (!rect) {
        return null;
      }
      return rect;
    };

    CaretLayout.prototype.toBoundary = function() {
      var vp;
      vp = this.visualPosition;
      if (vp.center) {
        return new DOMBoundary({
          node: vp.center.node,
          offset: vp.center.offset,
          type: "include"
        });
      } else if (vp.left) {
        return new DOMBoundary({
          node: vp.left.node,
          offset: vp.left.offset,
          type: "right"
        });
      } else if (vp.right) {
        return new DOMBoundary({
          node: vp.right.node,
          offset: vp.right.offset,
          type: "left"
        });
      }
    };

    return CaretLayout;

  })();

  Caret.CaretPosition = CaretPosition;

  module.exports = Caret;

}).call(this);

}
GlobalContext.setModule("vincent/facility/caret.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/clipboard.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMConverter, COMFlattenLevel1, Clip, Clipboard, html2markdown,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  html2markdown = require("/component/html2markdown");

  COMConverter = require("./comConverter");

  Clipboard = (function() {
    function Clipboard(editor) {
      this.editor = editor;
      this.mime = "application/json";
      window.addEventListener("paste", (function(_this) {
        return function(e) {
          var error, i, item, len, ref, type;
          ref = e.clipboardData.items || {};
          for (i = 0, len = ref.length; i < len; i++) {
            item = ref[i];
            type = item.type || "";
          }
          if (!_this.editor.buffer || !_this.editor.buffer.selection) {
            return;
          }
          if (_this.editor.buffer.selection.isActive && !_this.editor.buffer.selection.isCollapsed()) {
            _this.editor.context.transact(function() {
              return _this.editor.buffer.selection.removeSelectedNodes();
            });
          }
          if (!_this.isActive) {
            return;
          }
          _this.editor.userIsWriting = true;
          try {
            _this.pasteClipboardData(e);
          } catch (error) {
            e = error;
            Logger.error("past failure");
            Logger.error(e);
          }
          return _this.editor.userIsWriting = false;
        };
      })(this), true);
      window.addEventListener("copy", (function(_this) {
        return function(e) {
          var com, cursor, err, error, readonly, ref, ref1, ref2, ref3, ref4, ref5, result, rune, text, wrapper;
          _this.context = _this.editor.context;
          readonly = (ref = _this.context) != null ? ref.isReadonly : void 0;
          try {
            if ((ref1 = _this.context) != null) {
              ref1.isReadonly = false;
            }
            if (!_this.isActive) {
              return;
            }
            cursor = _this.editor.buffer.cursor;
            if (((ref2 = _this.editor.buffer.selection) != null ? ref2.isActive : void 0) && !_this.editor.buffer.selection.isCollapsed()) {
              com = _this.editor.buffer.selection.copySelectedNodes();
              result = _this.extractPasteCOM(com);
              text = com.toHumanString();
              _this.setClipboardData(e, {
                com: result,
                text: text
              });
            } else if ((cursor != null ? cursor.anchor.inside : void 0) && (rune = cursor.target.runeAtIndex(cursor.anchor.index))) {
              wrapper = _this.editor.context.createElement("RichText", {
                contentString: ""
              });
              wrapper.insertRune(0, rune.clone());
              result = _this.extractPasteCOM(wrapper);
              _this.setClipboardData(e, {
                com: result,
                text: (typeof rune.toHumanString === "function" ? rune.toHumanString() : void 0) || ""
              });
            } else {

            }
            _this.context.isReadonly = readonly;
          } catch (error) {
            err = error;
            Logger.error(e, err, "fail to copy things");
          }
          if (_this.editor.platform.isMobile() && ((ref3 = (ref4 = document.activeElement) != null ? ref4.type : void 0) !== "textarea" && ref3 !== "input")) {
            if ((ref5 = document.activeElement) != null) {
              if (typeof ref5.blur === "function") {
                ref5.blur();
              }
            }
            return _this.editor.inputMethod.showVirtualKeyboard();
          }
        };
      })(this), true);
      window.addEventListener("cut", (function(_this) {
        return function(e) {
          var clone, cursor, error, readonly, ref, ref1, ref2, ref3, ref4, ref5, result, rune, wrapper;
          if (!_this.isActive) {
            return;
          }
          _this.context = _this.editor.context;
          readonly = (ref = _this.context) != null ? ref.isReadonly : void 0;
          if (readonly) {
            return;
          }
          _this.editor.userIsWriting = true;
          try {
            if ((ref1 = _this.context) != null) {
              ref1.isReadonly = false;
            }
            cursor = _this.editor.buffer.cursor;
            if (((ref2 = _this.editor.buffer.selection) != null ? ref2.isActive : void 0) && !_this.editor.buffer.selection.isCollapsed()) {
              _this.editor.context.transact(function() {
                var com, result, text;
                com = _this.editor.buffer.selection.cutSelectedNodes();
                result = _this.extractPasteCOM(com);
                text = com.toHumanString();
                return _this.setClipboardData(e, {
                  com: result,
                  text: text
                });
              });
            } else if ((cursor != null ? cursor.anchor.inside : void 0) && (rune = cursor.target.runeAtIndex(cursor.anchor.index))) {
              clone = rune.clone();
              _this.editor.context.transact(function() {
                rune.parent.reflow();
                cursor.anchor.index = rune.startOffset;
                return rune.parent.removeText(rune.startOffset, rune.length);
              });
              wrapper = _this.editor.context.createElement("RichText", {
                contentString: ""
              });
              wrapper.insertRune(0, clone);
              result = _this.extractPasteCOM(wrapper);
              _this.setClipboardData(e, {
                com: result,
                text: (typeof rune.toHumanString === "function" ? rune.toHumanString() : void 0) || ""
              });
            }
            _this.context.isReadonly = readonly;
          } catch (error) {
            e = error;
            Logger.error(e, "fail to copy things");
          }
          if (_this.editor.platform.isMobile() && ((ref3 = (ref4 = document.activeElement) != null ? ref4.type : void 0) !== "textarea" && ref3 !== "input")) {
            if ((ref5 = document.activeElement) != null) {
              if (typeof ref5.blur === "function") {
                ref5.blur();
              }
            }
            _this.editor.inputMethod.showVirtualKeyboard();
          }
          return _this.editor.userIsWriting = false;
        };
      })(this), true);
    }

    Clipboard.prototype.extractPasteCOM = function(value) {
      var results, target;
      value = value.toJSON();
      results = [];
      target = value;
      return value;
    };

    Clipboard.prototype.enable = function() {
      return this.isActive = true;
    };

    Clipboard.prototype.disable = function() {
      return this.isActive = false;
    };

    Clipboard.prototype.extractPasteCOM = function(value) {
      var parser;
      parser = new COMFlattenLevel1(this.editor, value);
      parser.parse();
      if (parser.results.length === 0) {
        return null;
      }
      if (parser.results) {
        return {
          version: "v1",
          type: "com",
          contents: parser.results
        };
      }
      return null;
    };

    Clipboard.prototype.setClipboardData = function(e, json) {
      var clip;
      clip = new Clip(e);
      return clip.setClipboardData({
        text: json.text,
        com: json.com
      });
    };

    Clipboard.prototype.insertCOM = function(value) {
      if (value.version === "v0" || !value.version) {
        return this.pasteCOMV0(value);
      } else if (value.version === "v1") {
        return this.pasteCOMV1(value);
      }
    };

    Clipboard.prototype.insertText = function(text) {
      return this.editor.conduct("write", text);
    };

    Clipboard.prototype.pasteClipboardData = function(e) {
      var clip, data, ref, target, url;
      if ((ref = this.editor.buffer.selection) != null ? ref.isActive : void 0) {
        this.editor.buffer.selection.cancel();
      }
      if (this.editor.buffer.type !== "RichBuffer") {
        return;
      }
      clip = new Clip(e);
      data = clip.getClipboardData();
      target = this.editor.buffer.cursor.target;
      if (!target || !target.mime) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      if (data.image) {
        this.editor.inputMethod.emit("image", data.image);
        return;
      }
      if (data.com) {
        if (target.mime === "text/com-rich-text") {
          this.insertCOM(data.com);
          return;
        } else {
          this.insertText(data.text);
          return;
        }
      } else if (data.html && !data.com && (!html2markdown.isHTMLSimple(data.html) || window.forcePasteHTML)) {
        this.editor.conduct("write", this.editor.buffer.context.createElement("HTMLPortion", {
          html: data.html
        }));
        return;
      } else if (data.markdown) {
        this.editor.conduct("write", data.markdown);
        return;
      }
      if (!data.text) {
        return;
      }
      if (data.text && (url = this.extractAppUrl(data.text))) {
        e.preventDefault();
        this.editor.conduct("write", url);
        return true;
      } else if (data.text) {
        return this.editor.conduct("write", data.text);
      }
    };

    Clipboard.prototype.extractAppUrl = function(text) {
      var _, currentMatch, currentUser, domain, domains, match, path, protocol, protocols, reg, reservedKeyword, username;
      if (!text) {
        return null;
      }
      protocols = ["https", "http"];
      domains = ["miku\\.jitaku\\.io", "jitaku\\.io", "vuvu:9999"];
      reg = new RegExp("^\\s*(" + (protocols.join("|")) + ")://(" + (domains.join("|")) + ")/([a-z0-9_-]*)/(.*)$", "i");
      match = text.trim().match(reg);
      if (!match) {
        return null;
      }
      _ = match[0], protocol = match[1], domain = match[2], username = match[3], path = match[4];
      reservedKeyword = ["s", "share"];
      if (indexOf.call(reservedKeyword, username) >= 0) {
        return null;
      }
      currentMatch = window.location.toString().match(reg);
      currentUser = (currentMatch != null ? currentMatch[3] : void 0) || null;
      if (currentUser === username) {
        return "jtk://" + path;
      } else {
        return "jtk:///" + username + "/" + path;
      }
    };

    Clipboard.prototype.pasteCOMV0 = function(value) {
      return this.editor.context.transact((function(_this) {
        return function() {
          var node, ref, split, temp;
          split = (ref = _this.editor.buffer.cursor.anchor) != null ? ref.split() : void 0;
          temp = _this.editor.context.createElement("RichText", {
            contentString: ""
          });
          node = _this.editor.context.createElement(value);
          if (split || _this.editor.buffer.cursor.anchor.isTail()) {
            _this.editor.buffer.cursor.target.after(temp);
            _this.editor.buffer.cursor.target.after(node);
          } else {
            _this.editor.buffer.cursor.target.before(node);
            _this.editor.buffer.cursor.target.before(temp);
          }
          _this.editor.buffer.cursor.pointAt(temp);
          _this.editor.buffer.cursor.anchor.head();
          return _this.editor.caret.scrollViewPortToComfortable();
        };
      })(this));
    };

    Clipboard.prototype.pasteCOMV1_2 = function(value) {
      return this.editor.context.transact((function(_this) {
        return function() {
          var contents, cs, cursor, i, item, len, ref, rt, rune, split, target;
          contents = value.contents.slice();
          cursor = _this.editor.buffer.cursor;
          target = cursor.target;
          target.reflow();
          if (rune = target.runeAtIndex(cursor.anchor.index)) {
            cursor.anchor.index = rune.endOffset;
          }
          split = (ref = _this.editor.buffer.cursor.anchor) != null ? ref.split() : void 0;
          cs = "";
          for (i = 0, len = contents.length; i < len; i++) {
            item = contents[i];
            rt = _this.editor.context.createElement(item);
            if (!rt.sortOf("RichText")) {
              Logger.error("Unexpected clip item", rt);
              continue;
            }
            cs += rt.contentString;
          }
          _this.editor.buffer.cursor.target.insertText(_this.editor.buffer.cursor.anchor.index, cs);
          _this.editor.buffer.cursor.anchor.index += cs.length;
          return _this.editor.caret.scrollViewPortToComfortable();
        };
      })(this));
    };

    Clipboard.prototype.pasteCOMV1 = function(value) {
      return this.editor.context.transact((function(_this) {
        return function() {
          var contents, cs, cursor, i, index, item, j, last, len, len1, node, ref, rt, rune, split, target, temp;
          contents = value.contents.slice();
          cursor = _this.editor.buffer.cursor;
          target = cursor.target;
          target.reflow();
          if (rune = target.runeAtIndex(cursor.anchor.index)) {
            if (target.anchor.inside) {
              cursor.anchor.index = rune.endOffset;
            }
          }
          split = (ref = _this.editor.buffer.cursor.anchor) != null ? ref.split() : void 0;
          if (contents.length !== 1 || contents[0].collapseListItems || contents[0].collapseHeadContents) {
            temp = _this.editor.context.createElement("RichText", {
              contentString: ""
            });
            if (split || _this.editor.buffer.cursor.anchor.isTail()) {
              _this.editor.buffer.cursor.target.after(temp);
              contents.reverse();
              for (index = i = 0, len = contents.length; i < len; index = ++i) {
                item = contents[index];
                node = _this.editor.context.createElement(item);
                _this.editor.buffer.cursor.target.after(node);
                if (index === 0) {
                  last = node;
                }
              }
            } else {
              for (index = j = 0, len1 = contents.length; j < len1; index = ++j) {
                item = contents[index];
                node = _this.editor.context.createElement(item);
                _this.editor.buffer.cursor.target.before(node);
                last = node;
              }
              _this.editor.buffer.cursor.target.before(temp);
            }
            _this.editor.buffer.cursor.pointAt(last);
            _this.editor.buffer.cursor.anchor.tail();
          } else {
            rt = _this.editor.context.createElement(contents[0]);
            cs = rt.contentString;
            _this.editor.buffer.cursor.target.insertText(_this.editor.buffer.cursor.anchor.index, cs);
            _this.editor.buffer.cursor.anchor.index += cs.length;
          }
          cursor = _this.editor.buffer.cursor;
          return _this.editor.caret.scrollViewPortToComfortable();
        };
      })(this));
    };

    return Clipboard;

  })();

  COMFlattenLevel1 = (function() {
    function COMFlattenLevel1(editor, value1) {
      this.editor = editor;
      this.value = value1;
      this.context = this.editor.context;
      this.version = 1;
    }

    COMFlattenLevel1.prototype.parse = function() {
      this.target = this.value;
      this.parents = [];
      this.results = [];
      return this.findTopRichText();
    };

    COMFlattenLevel1.prototype.father = function() {
      return this.parents[this.parents.length - 1];
    };

    COMFlattenLevel1.prototype.findTopRichText = function() {
      var parser, ref, ref1, results1, rt;
      if (!this.target) {
        return;
      }
      if (this.context.namespace.sortOf(this.target.type, "RichText")) {
        this.results.push(this.target);
        return;
      }
      if (!this.target.children || this.target.children.length === 0) {
        this.skipChildOnce = true;
        return this.stepOver();
      }
      if (this.context.namespace.sortOf(this.target.children[0].type, "RichText")) {
        this.skipChildOnce = true;
        if (this.target.children.length > 1) {
          (ref = this.results).push.apply(ref, this.target.children);
          return;
        }
        rt = this.target.children[0];
        if (!rt.isPartial) {
          this.results.push(rt);
          return;
        }
        if (rt.children && (rt.children.length > 1 || rt.children.length === 0)) {
          this.results.push(rt);
          return;
        }
        if (this.context.namespace.sortOf(rt.children[0].type, "Text")) {
          this.results.push(rt);
          return;
        }
        if (!rt.children[0].isPartial) {
          this.results.push(rt);
          return;
        }
        parser = new COMFlattenLevel1(this.editor, rt.children[0]);
        parser.parse();
        if (parser.results.length > 0) {
          (ref1 = this.results).push.apply(ref1, parser.results);
        }
        return;
      }
      results1 = [];
      while (this.stepOver()) {
        results1.push(this.findTopRichText());
      }
      return results1;
    };

    COMFlattenLevel1.prototype.stepOver = function() {
      var father, grand, index;
      if (this.target.children && this.target.children[0] && !this.skipChildOnce) {
        this.parents.push(this.target);
        this.target = this.target.children[0];
        return true;
      }
      this.skipChildOnce = false;
      father = this.father();
      if (!father) {
        return false;
      }
      index = father.children.indexOf(this.target);
      if (index < father.children.length - 1) {
        this.target = father.children[index + 1];
        return true;
      }
      while (father = this.parents.pop()) {
        grand = this.father();
        if (!grand) {
          return false;
        }
        index = grand.children.indexOf(father);
        if (index < grand.children.length - 1) {
          this.target = grand.children[index + 1];
          return true;
        }
      }
      return false;
    };

    return COMFlattenLevel1;

  })();

  Clip = (function() {
    function Clip(e1) {
      this.e = e1;
    }

    Clip.prototype.setClipboardData = function(data) {
      var comString, e;
      e = this.e;
      if (data.text) {
        e.clipboardData.setData("text/plain", data.text);
      }
      if (data.com) {
        comString = JSON.stringify(data.com);
        e.clipboardData.setData("application/json", comString);
        e.clipboardData.setData("text/html", this.encodeHTMLCOM(comString, data.text));
      }
      return e.preventDefault();
    };

    Clip.prototype.getClipboardData = function() {
      var blob, e, error, error1, error2, html, i, item, json, len, markdown, ref, result, text, type;
      e = this.e;
      text = e.clipboardData.getData("text/plain");
      json = e.clipboardData.getData("application/json");
      html = e.clipboardData.getData("text/html");
      result = {
        text: text
      };
      ref = e.clipboardData.items || {};
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        type = item.type || "";
        if (type.indexOf("image/") === 0) {
          blob = item.getAsFile();
          if (blob instanceof Blob) {
            result.image = {
              blob: blob,
              related: {
                text: text,
                json: json,
                html: html
              }
            };
            e.preventDefault();
            e.stopImmediatePropagation();
          }
        }
      }
      e.preventDefault();
      if (json) {
        try {
          result.com = JSON.parse(json);
        } catch (error) {
          e = error;
          result.com = null;
        }
      }
      if (html) {
        result.html = html;
      }
      if (html && !result.com) {
        try {
          result.com = JSON.parse(this.decodeHTMLCOM(html));
        } catch (error1) {
          e = error1;
          result.com = null;
        }
      }
      if (html && !result.com) {
        try {
          markdown = html2markdown(html);
          result.markdown = markdown;
        } catch (error2) {
          e = error2;
          Logger.error(e);
        }
      }
      return result;
    };

    Clip.prototype.decodeHTMLCOM = function(htmlComString) {
      var content, div, pre;
      div = document.createElement("div");
      div.innerHTML = htmlComString;
      pre = div.querySelector("[com]");
      content = decodeURIComponent((pre != null ? pre.getAttribute("com") : void 0) || "");
      return content || null;
    };

    Clip.prototype.encodeHTMLCOM = function(comString, text) {
      return "<pre com=\"" + (encodeURIComponent(comString)) + "\" style=\"\">" + text + "</pre>";
    };

    return Clip;

  })();

  module.exports = Clipboard;

}).call(this);

}
GlobalContext.setModule("vincent/facility/clipboard.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/comConverter.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMConverter, HTMLEntity, HTMLTag, HTMLTag2Flatten, HTMLTagParser, Property, TableRuneParser, UlFlatter,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  HTMLEntity = require("/component/htmlEntity");

  Property = require("/component/property");

  HTMLTag = require("./htmlTag");

  COMConverter = (function() {
    function COMConverter() {}

    COMConverter.prototype.html2com = function(context, html) {
      var com, flatten, i, item, j, len, len1, parser, ref, results, richText;
      parser = new HTMLTagParser(html);
      flatten = new HTMLTag2Flatten(parser.contents);
      results = [];
      ref = flatten.result;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (typeof item === "string") {
          results.push(context.createElement("Text", {
            contentString: item
          }));
        } else {
          com = context.createElement(item);
          if (com) {
            results.push(com);
          }
        }
      }
      richText = context.createElement("RichText", {});
      for (j = 0, len1 = results.length; j < len1; j++) {
        item = results[j];
        richText.append(item);
      }
      return richText;
    };

    return COMConverter;

  })();

  HTMLTagParser = (function() {
    function HTMLTagParser(html) {
      var doc, parser;
      this.contents = new HTMLTag("!contents", [], {});
      this.tagStack = [this.contents];
      new Property(this, "currentTag").atGet((function(_this) {
        return function() {
          return _this.tagStack[_this.tagStack.length - 1] || null;
        };
      })(this));
      parser = new DOMParser();
      doc = parser.parseFromString(html, "text/html");
      this.contents.addChild(this.parse(doc));
    }

    HTMLTagParser.prototype.parse = function(el) {
      var child, i, item, j, len, len1, node, props, ref, ref1, tag;
      if (el.nodeType === el.TEXT_NODE) {
        return new HTMLTag("TEXT", el.textContent);
      }
      props = {};
      if (el.attributes) {
        ref = el.attributes;
        for (i = 0, len = ref.length; i < len; i++) {
          item = ref[i];
          props[item.name] = item.value;
        }
      }
      tag = new HTMLTag((el.tagName || "Unknown").toLowerCase(), [], props);
      if (el.childNodes) {
        ref1 = el.childNodes;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          node = ref1[j];
          child = this.parse(node);
          if (child) {
            tag.addChild(child);
          }
        }
      }
      return tag;
    };

    return HTMLTagParser;

  })();

  HTMLTag2Flatten = (function() {
    function HTMLTag2Flatten(htmlTag) {
      var fn, heading, i, level;
      this.htmlTag = htmlTag;
      this.acceptTags = ["h1", "h2", "h3", "h4", "h5", "h6", "code", "a", "img", "ul", "ol", "li", "table", "tbody", "tr", "td", "th", "strong", "pre", "b"];
      this.inlineTags = ["a", "img", "table", "strong", "bold", "b"];
      this.blockTag = ["p", "br"];
      this.elementType = ["headline", "list"];
      this.inlines = {};
      this.inlineId = 1000;
      this.inlineReg = new RegExp("\{\{\{\{[0-9]{4,8}\}\}\}\}");
      this.inlineRegG = new RegExp("\{\{\{\{[0-9]{4,8}\}\}\}\}", "g");
      heading = "";
      fn = (function(_this) {
        return function(level, heading) {
          return _this["h" + level + "Flatten"] = function(tag) {
            return "\n" + heading + " " + _this.getChildrenTextStream(tag) + "\n";
          };
        };
      })(this);
      for (level = i = 1; i <= 6; level = ++i) {
        heading += "#";
        fn(level, heading);
      }
      this.flatText = this.toFlatten(this.normalize(this.htmlTag));
      this.result = this.resolveInlineResource(this.flatText);
    }

    HTMLTag2Flatten.prototype.createTagInlineText = function(tag) {
      var id;
      id = this.inlineId++;
      this.inlines[id] = {
        id: id,
        detail: tag
      };
      return "{{{{" + id + "}}}}";
    };

    HTMLTag2Flatten.prototype.mergeTextArray = function(children) {
      var child, currentText, i, len, result;
      result = [];
      currentText = null;
      for (i = 0, len = children.length; i < len; i++) {
        child = children[i];
        if (child.isText()) {
          if (currentText) {
            currentText.text += child.text;
          } else {
            currentText = child;
          }
        } else {
          if (currentText) {
            currentText = this.normalizeText(currentText);
            if (currentText.text.length !== 0) {
              result.push(currentText);
            }
            result.push(child);
            currentText = null;
          } else {
            result.push(child);
          }
        }
      }
      if (currentText) {
        result.push(currentText);
      }
      return result;
    };

    HTMLTag2Flatten.prototype.normalizeText = function(tag) {
      tag.text = tag.text.replace(/\s*\n\s*\n\s*/g, "\n\n").replace(/\n\n+/g, "\n\n");
      return tag;
    };

    HTMLTag2Flatten.prototype.getChildrenTextStream = function(tag, plain) {
      var child, i, j, len, len1, plainText, ref, ref1, ref2, ref3, text;
      if (plain == null) {
        plain = false;
      }
      if (!tag.isText) {
        return "";
      }
      if (tag.isText()) {
        return tag.text;
      }
      if (ref = tag.name, indexOf.call(this.inlineTags, ref) >= 0) {
        if (plain) {
          plainText = "";
          ref1 = tag.children;
          for (i = 0, len = ref1.length; i < len; i++) {
            child = ref1[i];
            plainText += this.getChildrenTextStream(child, true);
          }
          return plainText;
        }
        return this.createTagInlineText(tag);
      }
      text = "";
      ref2 = tag.children;
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        child = ref2[j];
        if (child.isText()) {
          text += child.text;
        } else if (ref3 = child.name, indexOf.call(this.inlineTags, ref3) >= 0) {
          if (plain) {
            return this.getChildrenTextStream(child, plain);
          }
          text += this.createTagInlineText(tag);
        } else {
          text += this.getChildrenTextStream(child, plain);
        }
      }
      return text;
    };

    HTMLTag2Flatten.prototype.normalize = function(tag) {
      var child, i, item, j, k, len, len1, len2, ref, ref1, ref2, ref3, ref4, result;
      result = [];
      if (!(tag.children instanceof Array)) {
        return tag;
      }
      if (ref = tag.name, indexOf.call(this.acceptTags, ref) < 0) {
        ref1 = tag.children;
        for (i = 0, len = ref1.length; i < len; i++) {
          item = ref1[i];
          child = this.normalize(item);
          if (child instanceof Array) {
            result.push.apply(result, child);
          } else {
            result.push(child);
          }
        }
        if (ref2 = tag.name, indexOf.call(this.blockTag, ref2) >= 0) {
          result.push(new HTMLTag("TEXT", "\n\n"));
        }
        return this.mergeTextArray(result);
      } else if (ref3 = tag.name, indexOf.call(this.acceptTags, ref3) >= 0) {
        ref4 = tag.children;
        for (j = 0, len1 = ref4.length; j < len1; j++) {
          item = ref4[j];
          child = this.normalize(item);
          if (child instanceof Array) {
            result.push.apply(result, child);
          } else {
            result.push(child);
          }
        }
        result = this.mergeTextArray(result);
        tag.children.length = 0;
        for (k = 0, len2 = result.length; k < len2; k++) {
          child = result[k];
          tag.addChild(child);
        }
        return tag;
      }
    };

    HTMLTag2Flatten.prototype.toFlatten = function(arr) {
      var child, flatter, i, len, text;
      if (arr instanceof HTMLTag) {
        arr = [arr];
      }
      text = "";
      for (i = 0, len = arr.length; i < len; i++) {
        child = arr[i];
        if (flatter = this[child.name + "Flatten"]) {
          text += flatter.call(this, child);
        } else {
          text += this.getChildrenTextStream(child);
        }
      }
      return text;
    };

    HTMLTag2Flatten.prototype.ulFlatten = function(tag) {
      return new UlFlatter(this, tag).text;
    };

    HTMLTag2Flatten.prototype.olFlatten = function(tag) {
      return new UlFlatter(this, tag).text;
    };

    HTMLTag2Flatten.prototype.codeFlatten = function(tag) {
      return "\n```\n" + (this.escapeChar(this.getChildrenTextStream(tag), "`")) + "\n```\n";
    };

    HTMLTag2Flatten.prototype.preFlatten = function(tag) {
      return "\n```\n" + (this.escapeChar(this.getChildrenTextStream(tag), "`")) + "\n```\n";
    };

    HTMLTag2Flatten.prototype.escapeChar = function(text, char, replacement) {
      return text.replace(new RegExp(char, "g"), replacement || ("\\" + char));
    };

    HTMLTag2Flatten.prototype.resolveInlineResource = function(text) {
      var code, l, left, match, result, rune, solver, tag;
      this.inlineReg.lastIndex = 0;
      left = text;
      result = [];
      while (match = left.match(this.inlineReg)) {
        result.push(left.slice(0, match.index));
        left = left.slice(match.index + match[0].length);
        code = match[0].slice(4).slice(0, -4);
        l = this.inlines[code];
        tag = l.detail;
        if (solver = this[tag.name + "InlineSolve"]) {
          rune = solver.call(this, tag);
          if (rune) {
            result.push(rune);
            continue;
          }
        }
        result.push(this.getChildrenTextStream(tag, true));
      }
      result.push(left);
      return this.mergeSolvedResult(result);
    };

    HTMLTag2Flatten.prototype.escapeMarkdownUrl = function(string) {
      var _map, result;
      if (string == null) {
        string = "";
      }
      _map = {
        "(": "\\(",
        ")": "\\)",
        "\\": "\\\\"
      };
      result = string.replace(/\(|\)|\\/g, function(match) {
        return _map[match] || match;
      });
      return result;
    };

    HTMLTag2Flatten.prototype.mergeSolvedResult = function(arr) {
      var i, item, len, results, text;
      results = [];
      text = null;
      for (i = 0, len = arr.length; i < len; i++) {
        item = arr[i];
        if (typeof item === "string") {
          if (text) {
            text += item;
          } else {
            text = item;
          }
        } else {
          if (text) {
            results.push(text);
            text = null;
          }
          results.push(item);
        }
      }
      if (text) {
        results.push(text);
      }
      return results;
    };

    HTMLTag2Flatten.prototype.tableInlineSolve = function(tag) {
      return new TableRuneParser(this, tag).rune;
    };

    HTMLTag2Flatten.prototype.imgInlineSolve = function(tag) {
      var ref;
      return "![](" + (this.escapeMarkdownUrl((ref = tag.props) != null ? ref.src : void 0)) + ")";
    };

    HTMLTag2Flatten.prototype.bInlineSolve = function(tag) {
      return "**" + (this.getChildrenTextStream(tag, true)) + "**";
    };

    HTMLTag2Flatten.prototype.boldInlineSolve = function(tag) {
      return "**" + (this.getChildrenTextStream(tag, true)) + "**";
    };

    HTMLTag2Flatten.prototype.strongInlineSolve = function(tag) {
      return "**" + (this.getChildrenTextStream(tag, true)) + "**";
    };

    HTMLTag2Flatten.prototype.aInlineSolve = function(tag) {
      var link, title;
      link = tag.props.href;
      title = this.getChildrenTextStream(tag, true);
      return {
        type: "LinkRune",
        link: link,
        title: title
      };
    };

    return HTMLTag2Flatten;

  })();

  UlFlatter = (function() {
    function UlFlatter(flatter1, tag1) {
      var normalizedTag;
      this.flatter = flatter1;
      this.tag = tag1;
      this.items = [];
      this.acceptTags = ["ul", "li", "ol"];
      this.inlineTags = ["a", "img", "table", "strong", "bold"];
      this.blockTag = [];
      this.indentStep = 4;
      normalizedTag = this.normalize(this.tag);
      this.text = this.flatten(normalizedTag) + "\n";
    }

    UlFlatter.prototype.normalize = function(tag) {
      var child, i, item, j, k, len, len1, len2, ref, ref1, ref2, ref3, ref4, ref5, ref6, result, t;
      result = [];
      if (!(tag.children instanceof Array)) {
        return tag;
      }
      if ((ref = tag.name, indexOf.call(this.acceptTags, ref) < 0) && (ref1 = tag.name, indexOf.call(this.inlineTags, ref1) < 0)) {
        ref2 = tag.children;
        for (i = 0, len = ref2.length; i < len; i++) {
          item = ref2[i];
          child = this.normalize(item);
          if (child instanceof Array) {
            result.push.apply(result, child);
          } else {
            result.push(child);
          }
        }
        if (ref3 = tag.name, indexOf.call(this.blockTag, ref3) >= 0) {
          result.push(new HTMLTag("TEXT", "\n"));
        }
        return this.flatter.mergeTextArray(result);
      } else if (ref4 = tag.name, indexOf.call(this.acceptTags, ref4) >= 0) {
        ref5 = tag.children;
        for (j = 0, len1 = ref5.length; j < len1; j++) {
          item = ref5[j];
          child = this.normalize(item);
          if (child instanceof Array) {
            result.push.apply(result, child);
          } else {
            result.push(child);
          }
        }
        result = this.flatter.mergeTextArray(result);
        tag.children.length = 0;
        for (k = 0, len2 = result.length; k < len2; k++) {
          child = result[k];
          tag.addChild(child);
        }
        return tag;
      } else if (ref6 = tag.name, indexOf.call(this.inlineTags, ref6) >= 0) {
        t = new HTMLTag("TEXT", this.flatter.createTagInlineText(tag));
        return t;
      }
    };

    UlFlatter.prototype.flatten = function(tag, indent) {
      var child, i, index, j, k, len, len1, previousText, ref, ref1, ref2, ref3, ref4, space, t, tailing, text;
      if (indent == null) {
        indent = 0;
      }
      space = "";
      for (index = i = 0, ref = indent; 0 <= ref ? i < ref : i > ref; index = 0 <= ref ? ++i : --i) {
        space += " ";
      }
      if (tag.name === "li") {
        text = space + " * ";
        tailing = true;
        ref1 = tag.children;
        for (j = 0, len = ref1.length; j < len; j++) {
          child = ref1[j];
          if (child.isText()) {
            text += this.singleline(child.text);
          } else if ((ref2 = child.name) === "ul" || ref2 === "ol") {
            tailing = false;
            text += "\n" + this.flatten(child, indent + this.indentStep);
          } else if (child.name === "li") {
            text += this.flatter.getChildrenTextStream(child);
          } else {
            Logger.error("Unexpected tag(" + tag.name + ")", tag);
            continue;
          }
        }
        return text + (tailing && "\n" || "");
      } else if ((ref3 = tag.name) === "ul" || ref3 === "ol") {
        text = "";
        previousText = false;
        tailing = true;
        ref4 = tag.children;
        for (k = 0, len1 = ref4.length; k < len1; k++) {
          child = ref4[k];
          if (child.isText()) {
            if (t = child.text.trim()) {
              previousText = true;
              text += t;
            } else {
              continue;
            }
          } else if (child.name === ["ul", "ol"]) {
            text += this.flatter.getChildrenTextStream(child);
          } else if (child.name === "li") {
            tailing = false;
            if (previousText) {
              previousText = false;
              text += "\n";
            }
            text += this.flatten(child, indent);
          }
        }
        return text + (tailing && "\n" || "");
      } else if (tag.isText()) {
        return tag.text;
      }
    };

    UlFlatter.prototype.singleline = function(text) {
      return text.replace(/\s*\n\s*/g, " ");
    };

    return UlFlatter;

  })();

  TableRuneParser = (function() {
    function TableRuneParser(flatter1, tag1) {
      var ref, ref1;
      this.flatter = flatter1;
      this.tag = tag1;
      this.rune = null;
      if (((ref = this.tag.children[0]) != null ? ref.name : void 0) === "tbody") {
        this.parseTableContent(this.tag.children[0]);
      } else if (((ref1 = this.tag.children[0]) != null ? ref1.name : void 0) === "tr") {
        this.parseTableContent(this.tag);
      } else {
        return this;
      }
    }

    TableRuneParser.prototype.normalize = function(tag) {
      var c, child, children, i, j, k, len, len1, len2, len3, m, ref, ref1, ref2, results;
      if ((ref = tag.name) === "th" || ref === "td") {
        return tag;
      }
      if (tag.name === "tbody" || tag.name === "table") {
        children = tag.children.slice();
        results = [];
        for (i = 0, len = children.length; i < len; i++) {
          child = children[i];
          if ((ref1 = child.name) !== "tr") {
            continue;
          }
          if (c = this.normalize(child)) {
            results.push(c);
          }
        }
        tag.children.length = 0;
        for (j = 0, len1 = results.length; j < len1; j++) {
          child = results[j];
          tag.addChild(child);
        }
        return tag;
      }
      if (tag.name === "tr") {
        children = tag.children.slice();
        results = [];
        for (k = 0, len2 = children.length; k < len2; k++) {
          child = children[k];
          if ((ref2 = child.name) !== "td" && ref2 !== "th") {
            continue;
          }
          if (c = this.normalize(child)) {
            results.push(c);
          }
        }
        tag.children.length = 0;
        for (m = 0, len3 = results.length; m < len3; m++) {
          child = results[m];
          tag.addChild(child);
        }
        return tag;
      }
      return null;
    };

    TableRuneParser.prototype.parseTableContent = function(tag) {
      var cells, child, colCount, i, j, k, len, len1, len2, ref, ref1, ref2, ref3, ref4, row, rowCount;
      tag = this.normalize(tag);
      ref = tag.children;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        if (child.name !== "tr") {
          return null;
        }
      }
      colCount = tag.children.length;
      rowCount = (ref1 = tag.children[0]) != null ? (ref2 = ref1.children) != null ? ref2.length : void 0 : void 0;
      if (!colCount || !rowCount) {
        return null;
      }
      cells = [];
      ref3 = tag.children;
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        row = ref3[j];
        ref4 = row.children;
        for (k = 0, len2 = ref4.length; k < len2; k++) {
          child = ref4[k];
          cells.push({
            type: "TableCell",
            contentString: this.flatter.getChildrenTextStream(child, "plain")
          });
        }
      }
      return this.rune = {
        type: "Table",
        col: colCount,
        row: rowCount,
        children: cells
      };
    };

    return TableRuneParser;

  })();

  COMConverter.HTMLTagParser = HTMLTagParser;

  COMConverter.HTMLTag2Flatten = HTMLTag2Flatten;

  module.exports = COMConverter;

}).call(this);

}
GlobalContext.setModule("vincent/facility/comConverter.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/commandManager.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Buffer, CommandManager,
    slice = [].slice;

  Buffer = require("./buffer");

  CommandManager = (function() {
    function CommandManager(editor) {
      this.editor = editor;
      this.entries = {};
    }

    CommandManager.prototype.register = function(cmd) {
      if (!cmd) {
        Logger.error("register command request a object like {name,description,handler}");
        return false;
      }
      if (!cmd.name) {
        Logger.error("invalid command name provided");
        return false;
      }
      if (!cmd.handler) {
        Logger.error("invalid command handler provided");
        return false;
      }
      if (this.entries[cmd.name]) {
        Logger.error("duplicate command name " + cmd.name);
        return false;
      }
      this.entries[cmd.name] = {
        name: cmd.name,
        description: cmd.description,
        invoke: cmd.handler,
        option: cmd.option || null,
        global: cmd.global || false
      };
      return true;
    };

    CommandManager.prototype.conduct = function() {
      var args, cmd, name, ref, result, transact;
      name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      result = false;
      cmd = this.entries[name];
      if (!cmd) {
        return false;
      }
      if (cmd.context && (!this.editor.context || this.editor.context.isReadonly)) {
        return false;
      }
      transact = ((ref = this.editor.context) != null ? ref.transact.bind(this.editor.context) : void 0) || function(handler) {
        return handler();
      };
      transact((function(_this) {
        return function() {
          return result = cmd.invoke.apply(cmd, [_this.editor].concat(slice.call(args))) || false;
        };
      })(this));
      return result;
    };

    CommandManager.prototype.has = function(name) {
      return this.entries[name] && true || false;
    };

    CommandManager.prototype.getCommandDescription = function(name) {
      if (!this.has(name)) {
        return null;
      }
      return this.entries[name].description || ("<CMD " + name + "> has no description");
    };

    return CommandManager;

  })();

  module.exports = CommandManager;

}).call(this);

}
GlobalContext.setModule("vincent/facility/commandManager.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/contextManager.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMContext, ContextManager, EventEmitter,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = (require("../common/events")).EventEmitter;

  COMContext = require("../com/context");

  ContextManager = (function(superClass) {
    extend(ContextManager, superClass);

    function ContextManager(editor) {
      this.editor = editor;
      ContextManager.__super__.constructor.call(this);
      this.contexts = [];
    }

    ContextManager.prototype.setDefaultAttachmentManager = function(defaultAttachmentManager) {
      this.defaultAttachmentManager = defaultAttachmentManager;
    };

    ContextManager.prototype.create = function(option) {
      var context;
      if (option == null) {
        option = {};
      }
      context = new COMContext();
      context.editor = this.editor;
      this.contexts.push(context);
      context.attachments = option.attachments || this.defaultAttachmentManager;
      this.emit("context/create", context);
      return context;
    };

    ContextManager.prototype.destroy = function(context) {
      this.contexts = this.contexts.filter(function(item) {
        return item !== context;
      });
      return this.emit("context/destroy", context);
    };

    return ContextManager;

  })(EventEmitter);

  module.exports = ContextManager;

}).call(this);

}
GlobalContext.setModule("vincent/facility/contextManager.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/debugger.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Debugger;

  Debugger = (function() {
    function Debugger() {
      var i, len, prop, ref;
      this.saves = {};
      this.debugFunctions = ["time", "timeEnd", "debug", "log"];
      ref = this.debugFunctions;
      for (i = 0, len = ref.length; i < len; i++) {
        prop = ref[i];
        this.saves[prop] = console[prop];
      }
    }

    Debugger.prototype.enable = function(prop) {
      var results;
      if (prop && this.saves[prop]) {
        return console[prop] = this.saves[prop];
      } else {
        results = [];
        for (prop in this.saves) {
          results.push(console[prop] = this.saves[prop]);
        }
        return results;
      }
    };

    Debugger.prototype.disable = function(prop) {
      var results;
      if (prop && this.saves[prop]) {
        return console[prop] = function() {};
      } else {
        results = [];
        for (prop in this.debugFunctions) {
          results.push(console[prop] = function() {});
        }
        return results;
      }
    };

    return Debugger;

  })();

  module.exports = Debugger;

}).call(this);

}
GlobalContext.setModule("vincent/facility/debugger.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/documentFocus.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var DocumentFocus, EventEmitter, FocusManager,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  EventEmitter = (require("../common/events")).EventEmitter;

  DocumentFocus = (function(superClass) {
    extend(DocumentFocus, superClass);

    function DocumentFocus(name) {
      this.name = name;
      DocumentFocus.__super__.constructor.call(this);
      this.usedBy = [];
    }

    DocumentFocus.prototype.isAvailable = function() {
      return this.usedBy.length === 0;
    };

    DocumentFocus.prototype.obtain = function(who) {
      var length;
      length = this.usedBy.length;
      if (indexOf.call(this.usedBy, who) < 0) {
        this.usedBy.push(who);
      }
      if (length === 0) {
        return this.emit("change");
      }
    };

    DocumentFocus.prototype.release = function(who) {
      var length;
      length = this.usedBy.length;
      this.usedBy = this.usedBy.filter(function(item) {
        return item !== who;
      });
      if (this.usedBy.length === 0 && length !== 0) {
        return this.emit("change");
      }
    };

    return DocumentFocus;

  })(EventEmitter);

  FocusManager = (function(superClass) {
    extend(FocusManager, superClass);

    function FocusManager(editor) {
      var focuses, i, item, len;
      this.editor = editor;
      this.inputFocus = new DocumentFocus("input");
      this.bufferFocus = new DocumentFocus("buffer");
      this.editorFocus = new DocumentFocus("editor");
      focuses = [this.inputFocus, this.bufferFocus, this.editorFocus];
      for (i = 0, len = focuses.length; i < len; i++) {
        item = focuses[i];
        item.listenBy(this, "change", (function(_this) {
          return function() {
            return _this.apply();
          };
        })(this));
      }
    }

    FocusManager.prototype.debug = function() {
      return Logger.debug("focus input:" + (this.inputFocus.isAvailable()) + ",buffer:" + (this.bufferFocus.isAvailable()) + ",editor:" + (this.editorFocus.isAvailable()) + ",");
    };

    FocusManager.prototype.apply = function() {
      if (!this.editorFocus.isAvailable()) {
        return this.disableAll();
      } else if (!this.bufferFocus.isAvailable()) {
        return this.toEditorLevel();
      } else if (!this.inputFocus.isAvailable()) {
        return this.toBufferLevel();
      } else {
        return this.allowAll();
      }
    };

    FocusManager.prototype.allowAll = function() {
      this.editor.inputMethod.obtainDocumentFocus();
      this.editor.inputMethod.activate();
      this.editor.domSelection.enable();
      this.editor.clipboard.enable();
      this.editor.activate();
      this.editor.hotkeys.enableAll();
      return this.level = "all";
    };

    FocusManager.prototype.toBufferLevel = function() {
      this.editor.inputMethod.releaseDocumentFocus();
      this.editor.inputMethod.activate();
      this.editor.domSelection.enable();
      this.editor.clipboard.enable();
      this.editor.activate();
      this.editor.hotkeys.enableAll();
      this.editor.hotkeys.disableInput();
      return this.level = "buffer";
    };

    FocusManager.prototype.toEditorLevel = function() {
      this.editor.inputMethod.releaseDocumentFocus();
      this.editor.inputMethod.activate();
      this.editor.clipboard.disable();
      this.editor.activate();
      this.editor.domSelection.disable();
      this.editor.hotkeys.enableAll();
      this.editor.hotkeys.disableInput();
      this.editor.hotkeys.disableBuffer();
      return this.level = "editor";
    };

    FocusManager.prototype.disableAll = function() {
      this.editor.inputMethod.deactivate();
      this.editor.clipboard.disable();
      this.editor.domSelection.disable();
      this.editor.hotkeys.disableInput();
      this.editor.hotkeys.disableBuffer();
      this.editor.hotkeys.disableEditor();
      return this.level = "none";
    };

    return FocusManager;

  })(EventEmitter);

  DocumentFocus.FocusManager = FocusManager;

  module.exports = DocumentFocus;

}).call(this);

}
GlobalContext.setModule("vincent/facility/documentFocus.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/dragManager.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  module.exports = require("/component/dragManager");

}).call(this);

}
GlobalContext.setModule("vincent/facility/dragManager.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/dropManager.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var DropManager,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  DropManager = (function(superClass) {
    extend(DropManager, superClass);

    function DropManager(editor) {
      this.editor = editor;
      DropManager.__super__.constructor.call(this);
      this.initEvent(document.body);
    }

    DropManager.prototype.initEvent = function(target) {
      target.addEventListener("dragstart", (function(_this) {
        return function(e) {
          return e.preventDefault();
        };
      })(this));
      target.addEventListener("dragover", (function(_this) {
        return function(e) {
          var transfer;
          e.preventDefault();
          transfer = e.dataTransfer;
          if (!transfer) {
            return;
          }
          if (transfer.items.length > 0) {
            return _this.emit("files", e, transfer.items.length);
          }
        };
      })(this));
      target.addEventListener("dragleave", (function(_this) {
        return function(e) {
          return _this.emit("leave");
        };
      })(this));
      return target.addEventListener("drop", (function(_this) {
        return function(e) {
          var blob, i, item, len, ref, transfer, type;
          transfer = e.dataTransfer;
          if (!transfer) {
            return;
          }
          if (!e.defaultPrevented) {
            ref = transfer.items || {};
            for (i = 0, len = ref.length; i < len; i++) {
              item = ref[i];
              type = item.type || "";
              if (type.indexOf("image/") === 0) {
                blob = item.getAsFile();
                if (blob instanceof Blob) {
                  _this.emit("image", {
                    blob: blob
                  });
                  Logger.debug("image", blob, "at drop");
                }
              }
            }
          }
          e.preventDefault();
          e.stopImmediatePropagation();
          return _this.emit("leave");
        };
      })(this));
    };

    return DropManager;

  })(Leaf.EventEmitter);

  module.exports = DropManager;

}).call(this);

}
GlobalContext.setModule("vincent/facility/dropManager.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/highlighter.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var COMCursor, DOMBoundary, DOMTraverse, Debounce, Highlight, HighlightRect, HighlightSession, Highlighter, ReflowProcedure,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  DOMBoundary = require("../common/boundary");

  Debounce = require("/component/debounce");

  COMCursor = require("../com/cursor");

  DOMTraverse = require("../common/traverse");

  Highlighter = (function() {
    function Highlighter(buffer) {
      this.buffer = buffer;
    }

    Highlighter.prototype.createSession = function() {
      return new HighlightSession(this.buffer);
    };

    return Highlighter;

  })();

  HighlightSession = (function() {
    function HighlightSession(buffer) {
      this.buffer = buffer;
      this.lights = [];
      this.reflowDebouncer = new Debounce({
        time: 10
      }, (function(_this) {
        return function() {
          return _this._reflow();
        };
      })(this));
      this.reflowProcedure = new ReflowProcedure(this);
    }

    HighlightSession.prototype.clear = function() {
      var i, len, light, ref;
      ref = this.lights;
      for (i = 0, len = ref.length; i < len; i++) {
        light = ref[i];
        light.clear();
        light.destroy();
      }
      this.lights.length = 0;
      return this.buffer.stopListenBy(this);
    };

    HighlightSession.prototype.addHighlight = function(start, end, option) {
      var light;
      light = new Highlight(this.buffer, start, end, option);
      this.lights.push(light);
      return light;
    };

    HighlightSession.prototype.applyAll = function(option) {
      var i, len, light, ref;
      if (option == null) {
        option = {};
      }
      if (!this.buffer.isActive) {
        return;
      }
      ref = this.lights;
      for (i = 0, len = ref.length; i < len; i++) {
        light = ref[i];
        light.apply();
      }
      this.buffer.stopListenBy(this);
      this.buffer.listenBy(this, "reflow", this.reflow.bind(this));
      this.buffer.listenBy(this, "resize", this.reflow.bind(this));
      if (this.buffer.isActive) {
        if (option.force) {
          return this.forceReflow();
        } else {
          return this.reflow();
        }
      }
    };

    HighlightSession.prototype.reflow = function() {
      if (!this.buffer.isActive) {
        return;
      }
      return this.reflowDebouncer.trigger();
    };

    HighlightSession.prototype.forceReflow = function() {
      return this._reflow();
    };

    HighlightSession.prototype._reflow = function() {
      if (!this.buffer.isActive) {
        return;
      }
      this.reflowProcedure.reset();
      return this.reflowProcedure.start();
    };

    return HighlightSession;

  })();

  Highlight = (function() {
    function Highlight(buffer, startAnchor, endAnchor, option1) {
      this.buffer = buffer;
      this.startAnchor = startAnchor;
      this.endAnchor = endAnchor;
      this.option = option1 != null ? option1 : {};
      this.rects = [];
      this.startCursor = this.buffer.context.createCursor();
      this.endCursor = this.buffer.context.createCursor();
      this.startCursor.pointAtAnchor(this.startAnchor);
      this.endCursor.pointAtAnchor(this.endAnchor);
      this.startCursor.name = "STName";
      this.endCursor.name = "ECName";
      this.startCursor.listenBy(this, "move", (function(_this) {
        return function() {
          return _this.buffer.nextRender(function() {
            return _this.delayReshow();
          });
        };
      })(this));
      this.endCursor.listenBy(this, "move", (function(_this) {
        return function() {
          return _this.buffer.nextRender(function() {
            return _this.delayReshow();
          });
        };
      })(this));
    }

    Highlight.prototype.delayReshow = function(time) {
      var trigger;
      return;
      trigger = Debounce.debounce({
        time: 0
      }, (function(_this) {
        return function() {
          if (_this.isDestroyed) {
            return;
          }
          if (!_this.isShow) {
            return false;
          }
          _this.apply();
          return _this.show();
        };
      })(this));
      trigger();
      return window.doTrigger = trigger;
    };

    Highlight.prototype.setOption = function(option) {
      var i, len, prop, rect, ref, results;
      if (option == null) {
        option = {};
      }
      for (prop in option) {
        this.option[prop] = option[prop];
      }
      ref = this.rects;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        rect = ref[i];
        results.push(rect.setOption(option));
      }
      return results;
    };

    Highlight.prototype.apply = function() {
      var TextType, area, clientRects, e, end, error, i, item, j, k, len, len1, len2, range, rect, rects, results, start, texts;
      this.clear();
      start = this.startCursor.getBoundary();
      end = this.endCursor.getBoundary();
      try {
        range = DOMBoundary.createRangeBetween(start, end);
      } catch (error) {
        e = error;
        Logger.error("fail to create highlight range", start, end);
        return;
      }
      TextType = 3;
      texts = [];
      this.rects.length = 0;
      DOMTraverse.traverseRange(range, function(node) {
        if (node.nodeType === TextType) {
          texts.push(node);
        }
        return false;
      });
      rects = [];
      for (i = 0, len = texts.length; i < len; i++) {
        item = texts[i];
        if (item === range.startContainer) {
          start = range.startOffset;
        } else {
          start = 0;
        }
        if (item === range.endContainer) {
          end = range.endOffset;
        } else {
          end = item.length;
        }
        if (start >= end) {
          continue;
        }
        area = document.createRange();
        area.setStart(item, start);
        area.setEnd(item, end);
        clientRects = area.getClientRects();
        for (j = 0, len1 = clientRects.length; j < len1; j++) {
          rect = clientRects[j];
          rects.push(rect);
        }
      }
      this.clear();
      this.buffer.viewPort.baseRect = null;
      results = [];
      for (k = 0, len2 = rects.length; k < len2; k++) {
        item = rects[k];
        if (item.left === item.right) {
          continue;
        }
        item = this.buffer.viewPort.resolveRectWithTop(item);
        rect = new HighlightRect(this.buffer, item, this.option);
        results.push(this.rects.push(rect));
      }
      return results;
    };

    Highlight.prototype.show = function() {
      var i, item, len, ref, results;
      this.isShow = true;
      ref = this.rects || [];
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        results.push(item.show());
      }
      return results;
    };

    Highlight.prototype.hide = function() {
      var i, item, len, ref, results;
      this.isShow = false;
      ref = this.rects || [];
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        results.push(item.remove());
      }
      return results;
    };

    Highlight.prototype.clear = function() {
      var i, len, rect, ref;
      ref = this.rects;
      for (i = 0, len = ref.length; i < len; i++) {
        rect = ref[i];
        rect.remove();
      }
      return this.rects.length = 0;
    };

    Highlight.prototype.destroy = function() {
      this.isDestroyed = true;
      this.startCursor.destroy();
      return this.endCursor.destroy();
    };

    Highlight.prototype.blink = function() {
      var i, len, rect, ref, results;
      ref = this.rects;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        rect = ref[i];
        results.push(rect.blink());
      }
      return results;
    };

    return Highlight;

  })();

  HighlightRect = (function() {
    function HighlightRect(buffer, rect, option1) {
      this.buffer = buffer;
      this.option = option1 != null ? option1 : {};
      this.el = document.createElement("div");
      this.el.style.zIndex = 10;
      this.rect = rect;
      this.top = rect.top;
      this.bottom = rect.bottom;
    }

    HighlightRect.prototype.setOption = function(option) {
      var prop;
      if (option == null) {
        option = {};
      }
      for (prop in option) {
        this.option[prop] = option[prop];
      }
      return this.render();
    };

    HighlightRect.prototype.blink = function() {
      this.el.classList.add("blink");
      return setTimeout((function(_this) {
        return function() {
          return _this.el.classList.remove("blink");
        };
      })(this), 200);
    };

    HighlightRect.prototype.render = function() {
      var rect;
      rect = this.rect;
      this.el.style.left = rect.left + "px";
      this.el.style.top = rect.top + "px";
      this.el.style.width = rect.width + "px";
      this.el.style.height = rect.height + "px";
      this.el.style.position = "absolute";
      if (this.option.customClass) {
        this.el.classList.add(this.option.customClass);
        return;
      }
      if (this.option.useBorder) {
        this.el.style.borderBottom = "2px solid " + this.option.color;
      } else {
        this.el.style.backgroundColor = this.option.color || "yellow";
      }
      return this.el.classList.add("com-global-highlight");
    };

    HighlightRect.prototype.show = function() {
      if (this.isShow) {
        return;
      }
      this.isShow = true;
      this.buffer.viewPort.el.appendChild(this.el);
      return this.render();
    };

    HighlightRect.prototype.remove = function() {
      if (!this.isShow) {
        return;
      }
      this.isShow = false;
      if (this.el.parentElement) {
        return this.el.parentElement.removeChild(this.el);
      }
    };

    return HighlightRect;

  })();

  ReflowProcedure = (function(superClass) {
    extend(ReflowProcedure, superClass);

    function ReflowProcedure(session) {
      this.session = session;
      ReflowProcedure.__super__.constructor.call(this);
    }

    ReflowProcedure.prototype.start = function() {
      return this.setState("init");
    };

    ReflowProcedure.prototype.atInit = function() {
      var bottom, height, top;
      top = this.session.buffer.UI.viewPort.scrollTop;
      height = this.session.buffer.UI.viewPort.offsetHeight;
      bottom = top + height;
      this.data.top = top;
      this.data.height = height;
      this.data.bottom = bottom;
      return this.setState("traverse");
    };

    ReflowProcedure.prototype.atTraverse = function(stale) {
      var begin, end, i, len, light, ref;
      ref = this.session.lights;
      for (i = 0, len = ref.length; i < len; i++) {
        light = ref[i];
        if (stale()) {
          return;
        }
        light.apply();
        begin = light.rects[0];
        end = light.rects[light.rects.length - 1];
        if (!begin || !end) {
          light.hide();
        } else if (begin.top >= this.data.bottom) {
          light.hide();
        } else if (end.bottom <= this.data.top) {
          light.hide();
        } else {
          light.show();
        }
      }
      return this.setState("done");
    };

    ReflowProcedure.prototype.atDone = function() {};

    return ReflowProcedure;

  })(Leaf.States);

  module.exports = Highlighter;

  Highlighter.HighlightSession = HighlightSession;

  Highlighter.Highlight = Highlight;

}).call(this);

}
GlobalContext.setModule("vincent/facility/highlighter.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/history.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {


}).call(this);

}
GlobalContext.setModule("vincent/facility/history.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/hotkeyManager.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Hotkey, HotkeyManager,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  HotkeyManager = (function() {
    function HotkeyManager(editor1) {
      this.editor = editor1;
      this.candidates = [];
      this.disables = [];
      this.isOSX = this.editor.platform.isMac();
      this.isLinux = this.editor.platform.isLinux();
      this.isWindows = this.editor.platform.isWindows();
      this.traces = null;
      HotkeyManager.isOSX = this.isOSX;
    }

    HotkeyManager.prototype.trace = function(name) {
      if (this.traces == null) {
        this.traces = [];
      }
      return this.traces.push(name);
    };

    HotkeyManager.prototype.debug = function() {
      return this.isDebug = true;
    };

    HotkeyManager.prototype.getHotkeyStatistics = function() {
      var can, i, len, ref, results;
      ref = this.candidates;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        can = ref[i];
        results.push({
          name: can.commandName || "(CODE)",
          keyString: can.keyString
        });
      }
      return results;
    };

    HotkeyManager.prototype.handleKeyEvent = function(event) {
      var i, item, ref, ref1, ref2;
      if (this.isDebug) {
        Logger.debug("Disables", this.disables);
      }
      ref = this.candidates;
      for (i = ref.length - 1; i >= 0; i += -1) {
        item = ref[i];
        if (item.type && (ref1 = item.type, indexOf.call(this.disables, ref1) >= 0)) {
          continue;
        }
        if (this.isDebug) {
          if (item.test(event)) {
            Logger.debug("test pass", item.commandName, item);
          } else {
            Logger.debug("no pass", item.commandName);
          }
        }
        if (this.traces && (ref2 = item.commandName, indexOf.call(this.traces, ref2) >= 0)) {
          Logger.debug("test", item.commandName);
          Logger.debug(event, item.keyString);
        }
        if (item.exec(event, this.editor)) {
          if (this.isDebug) {
            Logger.debug("exec finally", item.commandName, item);
          }
          if (typeof event.capture === "function") {
            event.capture();
          }
          return true;
        }
      }
      return false;
    };

    HotkeyManager.prototype.registerCommandHotkey = function() {
      var args, commandName, hk, keyString, match, prop, value;
      keyString = arguments[0], commandName = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      if (typeof keyString === "object") {
        match = false;
        for (prop in keyString) {
          value = keyString[prop];
          if (prop === "win") {
            if (this.isWindows) {
              match = true;
              this.registerCommandHotkey.apply(this, [value, commandName].concat(slice.call(args)));
            }
          } else if (prop === "osx") {
            if (this.isOSX) {
              match = true;
              this.registerCommandHotkey.apply(this, [value, commandName].concat(slice.call(args)));
            }
          } else if (prop === "linux") {
            if (this.isLinux) {
              match = true;
              this.registerCommandHotkey.apply(this, [value, commandName].concat(slice.call(args)));
            }
          } else if (prop === "default") {
            if (!match) {
              this.registerCommandHotkey.apply(this, [value, commandName].concat(slice.call(args)));
            }
          }
        }
        return;
      }
      hk = new Hotkey(keyString, {
        description: this.editor.commands.getCommandDescription(commandName),
        handler: this.editor.conduct.bind(this.editor, commandName),
        commandName: commandName,
        args: args
      });
      return this.register(hk);
    };

    HotkeyManager.prototype.getCommandHotkey = function(command) {
      var cand, cmd, hks, i, len, ref;
      cmd = command.toLowerCase();
      hks = [];
      ref = this.candidates;
      for (i = 0, len = ref.length; i < len; i++) {
        cand = ref[i];
        if (cand.commandName === cmd) {
          hks.push(cand);
        }
      }
      return hks;
    };

    HotkeyManager.prototype.registerHotkey = function(keyString, handler) {
      return this.register(new Hotkey(keyString, handler));
    };

    HotkeyManager.prototype.register = function(hotkey) {
      if (!hotkey.isValid) {
        Logger.error("will to register a invalid hotkey", hotkey);
      }
      return this.candidates.push(hotkey);
    };

    HotkeyManager.prototype.enableAll = function() {
      return this.disables = [];
    };

    HotkeyManager.prototype.disableInput = function() {
      return this.disables.push("input");
    };

    HotkeyManager.prototype.disableBuffer = function() {
      return this.disables.push("buffer");
    };

    HotkeyManager.prototype.disableEditor = function() {
      return this.disables.push("editor");
    };

    return HotkeyManager;

  })();

  Hotkey = (function() {
    var keyStringReg, modifierReg;

    Hotkey.normalize = function(keyString) {
      return keyString.replace(/\s/g, "").replace(/>/g, "> ");
    };

    keyStringReg = /^(input:|buffer:|editor:)?((<[^<>]+>\s*)*)([a-z0-9A-Z]+)(\s*@down)?(\s*@up)?$/;

    modifierReg = /<([^<]+)>/gi;

    function Hotkey(keyString, handler1) {
      var keyName, matches, modifiers, ref, ref1, ref2, ref3, result;
      if (keyString == null) {
        keyString = "";
      }
      this.handler = handler1;
      matches = keyString.match(keyStringReg);
      this.isValid = true;
      if (!matches) {
        Logger.error("invalid hotkey string " + keyString);
        this.isValid = false;
        return;
      }
      this.commandName = this.handler.commandName;
      this.type = ((ref = matches[1]) != null ? ref.replace(":", "") : void 0) || "buffer";
      if ((ref1 = this.type) !== "buffer" && ref1 !== "editor" && ref1 !== "input") {
        Logger.error("invalid hotkey type", this.type);
        this.isValid = false;
        return false;
      }
      modifiers = matches[2];
      modifierReg.lastIndex = 0;
      while (result = modifierReg.exec(modifiers)) {
        keyName = (ref2 = result[1]) != null ? (ref3 = ref2.trim()) != null ? ref3.toLowerCase() : void 0 : void 0;
        if (keyName === "ctrl") {
          this.ctrlKey = true;
        }
        if (keyName === "alt") {
          this.altKey = true;
        }
        if (keyName === "shift") {
          this.shiftKey = true;
        }
        if (keyName === "meta") {
          this.metaKey = true;
        }
        if (keyName === "mod") {
          this.modKey = true;
        }
        if (keyName === "command") {
          this.commandKey = true;
        }
      }
      this.keyName = matches[4];
      this.keyDown = matches[5] && true || false;
      this.keyUp = matches[6] && true || false;
      if (!this.keyDown && !this.keyUp) {
        this.keyDown = true;
      }
      this.keyString = Hotkey.normalize(keyString);
      this.description = this.handler.description || "unkown hotkey description";
    }

    Hotkey.prototype.testKeyString = function(string) {
      var hk, i, len, name, prop;
      hk = new Hotkey(string, {});
      prop = ["keyName", "ctrlKey", "altKey", "metaKey", "shiftKey", "modKey", "commandKey", "keyUp", "keyDown"];
      for (i = 0, len = prop.length; i < len; i++) {
        name = prop[i];
        if (hk[name] !== this[name]) {
          return false;
        }
      }
      return true;
    };

    Hotkey.prototype.test = function(event) {
      var result;
      if (typeof event === "string") {
        return this.testKeyString(event);
      }
      result = false;
      if (event.isKey(this.keyName) && (event.shiftKey ^ this.shiftKey) === 0 && (event.altKey ^ this.altKey) === 0 && (event.keyUp ^ this.keyUp) === 0 && (event.keyDown ^ this.keyDown) === 0 && event.isModMatch(this.ctrlKey, this.commandKey, this.modKey)) {
        result = true;
      }
      return result;
    };

    Hotkey.prototype.exec = function(event, editor) {
      var ref, result, transact;
      if (!this.test(event)) {
        return false;
      }
      result = null;
      transact = ((ref = editor.context) != null ? ref.transact.bind(editor.context) : void 0) || (function(_this) {
        return function(handler) {
          return handler();
        };
      })(this);
      transact((function(_this) {
        return function() {
          return result = _this.invoke(editor, event);
        };
      })(this));
      return result;
    };

    Hotkey.prototype.invoke = function(editor, event) {
      var args, ref;
      if (typeof this.handler === "function") {
        args = this.args || [];
        return this.handler.apply(this, [editor].concat(slice.call(args)));
      } else if (typeof this.handler.handler === "function") {
        args = this.handler.args || this.args || [];
        return (ref = this.handler).handler.apply(ref, args);
      }
    };

    Hotkey.prototype.prettifyHTML = function() {
      var arr, command, ctrl, key, ks, map, mod, opt, shift, value;
      command = "⌘";
      if (HotkeyManager.isOSX) {
        mod = command;
        opt = "⌥";
        shift = "⇧";
        shift = "Shift";
        ctrl = "Ctrl";
      } else {
        mod = "Ctrl";
        opt = "Alt";
        shift = "Shift";
        ctrl = "Ctrl";
      }
      map = {
        "<mod>": mod,
        "<ctrl>": ctrl,
        "<alt>": opt,
        "<shift>": shift,
        "<command>": command,
        left: "←",
        right: "→",
        up: "↑",
        down: "↓",
        slash: "/",
        equal: "=",
        comma: ",",
        period: ".",
        escape: "esc"
      };
      ks = this.keyString;
      ks = ks.replace(/^.+:/, "");
      for (key in map) {
        value = map[key];
        ks = ks.replace(key, value);
      }
      arr = ks.split(/\s/).filter(function(item) {
        return item;
      });
      arr = arr.map(function(item) {
        return "<key>" + item[0].toUpperCase() + item.slice(1) + "</key>";
      });
      return arr.join("+");
    };

    Hotkey.prototype.prettify = function() {
      var arr, command, ctrl, key, ks, map, mod, opt, shift, value;
      command = "⌘";
      if (HotkeyManager.isOSX) {
        mod = command;
        opt = "⌥";
        shift = "⇧";
        shift = "Shift";
        ctrl = "Ctrl";
      } else {
        mod = "Ctrl";
        opt = "Alt";
        shift = "Shift";
        ctrl = "Ctrl";
      }
      map = {
        "<mod>": mod,
        "<ctrl>": ctrl,
        "<alt>": opt,
        "<shift>": shift,
        "<command>": command,
        left: "←",
        right: "→",
        up: "↑",
        down: "↓",
        slash: "/",
        equal: "=",
        comma: ",",
        period: ".",
        escape: "esc"
      };
      ks = this.keyString;
      ks = ks.replace(/^.+:/, "");
      for (key in map) {
        value = map[key];
        ks = ks.replace(key, value);
      }
      arr = ks.split(/\s/).filter(function(item) {
        return item;
      });
      arr = arr.map(function(item) {
        return item[0].toUpperCase() + item.slice(1);
      });
      return arr.join(" + ");
    };

    Hotkey.prototype.toString = function() {
      return "[Hotkey " + this.keyString + "]";
    };

    return Hotkey;

  })();

  module.exports = HotkeyManager;

  HotkeyManager.Hotkey = Hotkey;

}).call(this);

}
GlobalContext.setModule("vincent/facility/hotkeyManager.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/htmlTag.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var HTMLTag;

  HTMLTag = (function() {
    function HTMLTag(name, children, props) {
      this.name = name;
      this.children = children;
      this.props = props;
      if (typeof this.children === "string") {
        this.name = "TEXT";
        this.text = this.children;
        this.children = null;
        this.props = null;
      } else {
        this.name = this.name.toLowerCase();
      }
    }

    HTMLTag.prototype.isText = function() {
      return this.name === "TEXT";
    };

    HTMLTag.prototype.addChild = function(child) {
      if (this.children instanceof Array) {
        this.children.push(child);
        return child.parent = this;
      } else {
        return Logger.error("Can add child to Text element");
      }
    };

    return HTMLTag;

  })();

  module.exports = HTMLTag;

}).call(this);

}
GlobalContext.setModule("vincent/facility/htmlTag.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/imeHint.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Highlighter, IMEHint;

  Highlighter = require("./highlighter");

  IMEHint = (function() {
    function IMEHint(buffer) {
      this.buffer = buffer;
      this.cursor = this.buffer.cursor;
      this.highlighter = new Highlighter(this.buffer);
      this.lightSession = this.highlighter.createSession();
    }

    IMEHint.prototype.clear = function() {
      return this.lightSession.clear();
    };

    IMEHint.prototype.hint = function(hint) {
      var end, ref, ref1, ref2, start;
      this.clear();
      ref2 = (ref = this.cursor) != null ? (ref1 = ref.anchor) != null ? ref1.getIMEAnchor(hint) : void 0 : void 0, start = ref2.start, end = ref2.end;
      if (start && end) {
        this.lightSession.addHighlight(start, end, {
          customClass: "ime-hint-highlight"
        });
        return this.lightSession.applyAll({
          force: true
        });
      }
    };

    return IMEHint;

  })();

  module.exports = IMEHint;

}).call(this);

}
GlobalContext.setModule("vincent/facility/imeHint.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/inputMethod.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var ActivableTrait, BackupInputMethod, BrowserDefaultKeyBehaviorPreventor, CompositeSession, ContentEditableHacker, Errors, EventEmitter, FocusableTrait, GeneralInputMethod, InputMethodChrome, InputMethodMaster, KeyEvent, KeyEventHandler, States, Trait,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  KeyEvent = require("../common/keyEvent");

  States = require("../common/states");

  Errors = require("../common/errors");

  EventEmitter = (require("../common/events")).EventEmitter;

  Trait = require("../com/helper/trait");

  InputMethodMaster = (function(superClass) {
    extend(InputMethodMaster, superClass);

    function InputMethodMaster(editor) {
      this.editor = editor;
      InputMethodMaster.__super__.constructor.call(this);
    }

    InputMethodMaster.prototype.init = function() {
      this.coreInputMethod = new GeneralInputMethod(this.editor, this);
      this.backupInputMethod = new BackupInputMethod(this.editor, this);
      this.inputMethods = [this.coreInputMethod, this.backupInputMethod];
      new BrowserDefaultKeyBehaviorPreventor();
      this.coreInputMethod.on("workingStateChange", (function(_this) {
        return function() {
          return _this.emit("workingStateChange");
        };
      })(this));
      this.backupInputMethod.on("interactive", (function(_this) {
        return function() {
          return _this.ensureInputStateWithoutVirtualKeyboard();
        };
      })(this));
      this.currentInputMethod = this.coreInputMethod;
      this.hasFocus = true;
      this.editor.bufferManager.listenBy(this, "focus", (function(_this) {
        return function(buffer) {
          return _this.attachTo(buffer);
        };
      })(this));
      return this.editor.caret.listenBy(this, "move", (function(_this) {
        return function() {
          return _this.updatePosition();
        };
      })(this));
    };

    InputMethodMaster.prototype.isMobileKeyboardShow = function() {
      var _, h, keyboardMinSize, sh, sw, w;
      if (!this.editor.platform.isMobile()) {
        return false;
      }
      h = document.body.clientHeight;
      w = document.body.clientWidth;
      sw = window.screen.width;
      sh = window.screen.height;
      keyboardMinSize = sh / 4;
      if ((h - w) * (sh - sw) < 0) {
        _ = sw;
        sw = sh;
        sh = _;
      }
      return sh - h > keyboardMinSize;
    };

    InputMethodMaster.prototype.attachTo = function(buffer) {
      var i, len, method, ref, ref1, ref2, ref3, ref4;
      if (!buffer.interactive) {
        return false;
      }
      if (buffer === this.buffer) {
        return;
      }
      if ((ref = this.buffer) != null) {
        ref.stopListenBy(this);
      }
      if ((ref1 = this.buffer) != null) {
        if ((ref2 = ref1.viewPort) != null) {
          ref2.stopListenBy(this);
        }
      }
      if ((ref3 = this.cursor) != null) {
        ref3.stopListenBy(this);
      }
      this.buffer = buffer;
      this.cursor = this.buffer.cursor;
      ref4 = this.inputMethods;
      for (i = 0, len = ref4.length; i < len; i++) {
        method = ref4[i];
        method.attachTo(buffer);
      }
      this.cursor.listenBy(this, "move", (function(_this) {
        return function() {
          return _this.editor.inputMethod.flush();
        };
      })(this));
      if (this.viewPort) {
        this.viewPort.stopListenBy(this);
      }
      this.viewPort = buffer.viewPort;
      this.viewPort.listenBy(this, "hasInteraction", (function(_this) {
        return function() {
          return _this.ensureInputStateWithoutVirtualKeyboard();
        };
      })(this));
      this.ensureInputStateWithoutVirtualKeyboard();
      this.attachRootElement(this.buffer.viewPort.rootElement);
      return this.buffer.viewPort.listenBy(this, "rootElement", (function(_this) {
        return function() {
          return _this.attachRootElement(_this.buffer.viewPort.rootElement);
        };
      })(this));
    };

    InputMethodMaster.prototype.attachRootElement = function(rootEl) {};

    InputMethodMaster.prototype.updatePosition = function() {
      var bl, fix, ref;
      bl = this.editor.caret.node.getBoundingClientRect();
      fix = document.body.getBoundingClientRect();
      return (ref = this.currentInputMethod) != null ? ref.updatePosition((bl.right + bl.left - fix.left * 2) / 2, bl.bottom - fix.top + 2, fix.bottom, fix.right) : void 0;
    };

    InputMethodMaster.prototype.releaseDocumentFocus = function() {
      if (!this.hasDocumentFocus) {
        return;
      }
      this.hasDocumentFocus = false;
      this.ensureInputStateWithoutVirtualKeyboard();
      return this.emit("workingStateChange");
    };

    InputMethodMaster.prototype.obtainDocumentFocus = function() {
      if (this.hasDocumentFocus) {
        return;
      }
      this.hasDocumentFocus = true;
      this.ensureInputStateWithoutVirtualKeyboard();
      return this.emit("workingStateChange");
    };

    InputMethodMaster.prototype.activate = function() {
      if (this.isActive) {
        return;
      }
      this.isActive = true;
      this.ensureInputStateWithoutVirtualKeyboard();
      return this.emit("workingStateChange");
    };

    InputMethodMaster.prototype.deactivate = function() {
      if (!this.isActive) {
        return;
      }
      this.isActive = false;
      this.ensureInputStateWithoutVirtualKeyboard();
      return this.emit("workingStateChange");
    };

    InputMethodMaster.prototype.flush = function() {
      var ref;
      return (ref = this.currentInputMethod) != null ? typeof ref.flush === "function" ? ref.flush() : void 0 : void 0;
    };

    InputMethodMaster.prototype.blur = function() {
      var ref;
      return (ref = this.currentInputMethod) != null ? typeof ref.blur === "function" ? ref.blur() : void 0 : void 0;
    };

    InputMethodMaster.prototype.focus = function() {
      var ref;
      return (ref = this.currentInputMethod) != null ? typeof ref.focus === "function" ? ref.focus() : void 0 : void 0;
    };

    InputMethodMaster.prototype.showVirtualKeyboard = function() {
      if (!this.editor.platform.isVirtualKeyboard()) {
        return;
      }
      this.activate();
      return this.applyState();
    };

    InputMethodMaster.prototype.hideVirtualKeyboard = function() {
      if (!this.editor.platform.isVirtualKeyboard()) {
        return;
      }
      this.deactivate();
      return this.applyState();
    };

    InputMethodMaster.prototype.ensureInputStateWithoutVirtualKeyboard = function() {
      if (this.editor.platform.isVirtualKeyboard()) {
        return;
      }
      this.updatePosition();
      return this.applyState();
    };

    InputMethodMaster.prototype.applyState = function() {
      var i, im, j, len, len1, ref, ref1, results;
      if (this.isActive) {
        if (this.hasDocumentFocus) {
          this.currentInputMethod = this.coreInputMethod;
        } else {
          this.currentInputMethod = this.backupInputMethod;
        }
        ref = this.inputMethods;
        for (i = 0, len = ref.length; i < len; i++) {
          im = ref[i];
          if (im !== this.currentInputMethod) {
            if (im.isActive) {
              im.deactivate();
            }
            im.ensureFocusState();
          }
        }
        if (!this.currentInputMethod.isActive) {
          this.currentInputMethod.activate();
        }
        this.currentInputMethod.ensureFocusState();
        return this.listenTo(this.currentInputMethod);
      } else {
        ref1 = this.inputMethods;
        results = [];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          im = ref1[j];
          im.deactivate();
          results.push(im.ensureFocusState());
        }
        return results;
      }
    };

    InputMethodMaster.prototype.listenTo = function(item) {
      if (this.lastListenTarget) {
        this.lastListenTarget.stopListenBy(this);
      }
      item.listenBy(this, "input", (function(_this) {
        return function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return _this.emit.apply(_this, ["input"].concat(slice.call(args)));
        };
      })(this));
      item.listenBy(this, "key", (function(_this) {
        return function(key) {
          return _this.emit("key", key);
        };
      })(this));
      item.listenBy(this, "image", (function(_this) {
        return function(image) {
          return _this.emit("image", image);
        };
      })(this));
      return this.lastListenTarget = item;
    };

    return InputMethodMaster;

  })(EventEmitter);

  BackupInputMethod = (function(superClass) {
    extend(BackupInputMethod, superClass);

    function BackupInputMethod(context, master) {
      this.context = context;
      this.master = master;
      BackupInputMethod.__super__.constructor.call(this);
      this.canWrite = true;
      window.addEventListener("keydown", (function(_this) {
        return function(e) {
          var ke;
          _this.emit("interactive");
          if (!_this.isActive) {
            return;
          }
          if (!_this.hasFocus) {
            return;
          }
          ke = new KeyEvent(e);
          return _this.emit("key", ke);
        };
      })(this), true);
      window.addEventListener("keyup", (function(_this) {
        return function(e) {
          var ke;
          if (!_this.isActive) {
            return;
          }
          if (!_this.hasFocus) {
            return;
          }
          ke = new KeyEvent(e);
          return _this.emit("key", ke);
        };
      })(this), true);
      this.hasFocus = true;
    }

    BackupInputMethod.prototype.ensureFocusState = function() {
      return this.hasFocus = this.isActive;
    };

    BackupInputMethod.prototype.updatePosition = function(x, y) {
      return true;
    };

    BackupInputMethod.prototype.activate = function() {
      this.isActive = true;
      return this.hasFocus = true;
    };

    BackupInputMethod.prototype.deactivate = function() {
      this.isActive = false;
      return this.hasFocus = false;
    };

    BackupInputMethod.prototype.attachTo = function() {};

    return BackupInputMethod;

  })(Leaf.EventEmitter);

  InputMethodChrome = (function(superClass) {
    extend(InputMethodChrome, superClass);

    InputMethodChrome.prototype.attachTo = function(buffer) {
      var ref;
      this.buffer = buffer;
      if ((ref = this.cursor) != null) {
        ref.stopListenBy(this);
      }
      this.cursor = this.buffer.cursor;
      return this.cursor.listenBy(this, "move", (function(_this) {
        return function() {
          return _this.flush();
        };
      })(this));
    };

    function InputMethodChrome(editor, master) {
      this.editor = editor;
      this.master = master;
      InputMethodChrome.__super__.constructor.call(this);
      this.input = document.createElement("textarea");
      this.input$ = $(this.input);
      this.input.classList.add("input-method");
      this.input.addEventListener("keydown", this.onkeydown.bind(this), true);
      this.input.addEventListener("keyup", this.onkeyup.bind(this), true);
      this.input.addEventListener("compositionstart", this.oncompositionstart.bind(this));
      this.input.addEventListener("compositionupdate", this.oncompositionupdate.bind(this));
      this.input.addEventListener("compositionend", this.oncompositionend.bind(this));
      this.checkResize = this.checkResize.bind(this);
      this.input.addEventListener("focus", (function(_this) {
        return function() {
          _this._canWrite = true;
          return _this.emit("workingStateChange");
        };
      })(this));
      this.input.addEventListener("blur", (function(_this) {
        return function() {
          _this._canWrite = false;
          return _this.emit("workingStateChange");
        };
      })(this));
      this.__defineGetter__("canWrite", (function(_this) {
        return function() {
          return _this._canWrite && document.activeElement === _this.input;
        };
      })(this));
      this.input.raws = 1;
      this.__defineGetter__("shouldUseRealHolder", (function(_this) {
        return function() {
          if (_this.editor.platform.isMobile()) {
            return true;
          }
          return false;
        };
      })(this));
      document.body.appendChild(this.input);
      this.data.keys = {};
    }

    InputMethodChrome.prototype.delayCheck = function() {
      clearTimeout(this.checkTimer);
      return this.checkTimer = setTimeout((function(_this) {
        return function() {
          return _this.check();
        };
      })(this), 0);
    };

    InputMethodChrome.prototype.updatePosition = function(x, y, maxBottom, maxRight) {
      var args, change, css, i, index, item, len;
      args = [x, y, maxBottom, maxRight];
      change = false;
      if (this.positionCache) {
        for (index = i = 0, len = args.length; i < len; index = ++i) {
          item = args[index];
          if (item === this.positionCache[index]) {
            continue;
          } else {
            change = true;
            break;
          }
        }
        if (!change) {
          return false;
        }
      }
      this.positionCache = args;
      if (x < 0) {
        x = 0;
      }
      if (y < 0) {
        y = 0;
      }
      css = {};
      if (maxBottom && maxBottom < y) {
        css.bottom = 0;
      } else {
        css.top = y;
      }
      if (maxRight && maxRight < x) {
        css.right = 0;
      } else {
        css.left = x;
      }
      if (this.editor.platform.isMobile() && !this.data.isComposing) {
        css.left = 0;
        css.right = "auto";
        css.bottom = 10;
      }
      if (this.editor.platform.isMobile() && false) {
        css.left = "auto";
        css.right = "-30px";
        css.bottom = "0";
        css.top = "auto";
        css.width = "100%";
        return this.input$.css(css);
      } else {
        css.position = "absolute";
        return this.input$.css(css);
      }
    };

    InputMethodChrome.prototype.reset = function() {
      InputMethodChrome.__super__.reset.call(this);
      this.lastHolder = " ";
      this.input.value = this.lastHolder;
      return this.data.keys = {};
    };

    InputMethodChrome.prototype.activate = function() {
      if (this.isActive) {
        return;
      }
      this.focus();
      this.reset();
      this.setState("wait");
      return this.isActive = true;
    };

    InputMethodChrome.prototype.deactivate = function() {
      if (!this.isActive) {
        return;
      }
      this.blur();
      if (this.editor.platform.isMobile()) {
        window.removeEventListener("resize", this.checkResize);
      }
      return this.isActive = false;
    };

    InputMethodChrome.prototype.ensureFocusState = function(option) {
      if (option == null) {
        option = {};
      }
      this.data.keys = {};
      if (this.isActive && document.activeElement !== this.input && (option.forceFocus || !this.editor.platform.isMobile())) {
        return this.focus();
      } else if (!this.isActive && document.activeElement === this.input) {
        return this.blur();
      }
    };

    InputMethodChrome.prototype.focus = function() {
      if (this.editor.platform.isMobile()) {
        this.input.blur();
      }
      return this.input.focus();
    };

    InputMethodChrome.prototype.blur = function() {
      return this.input.blur();
    };

    InputMethodChrome.prototype.flush = function() {
      var contents, cursor, period, period2, period3, period4, value;
      value = this.input.value;
      if (this.holder == null) {
        this.holder = " ";
      }
      if (this.shouldUseRealHolder && this.cursor) {
        cursor = this.cursor;
        if (cursor && cursor.version !== this.cursorVersion) {
          contents = cursor != null ? typeof cursor.getSurroundingText === "function" ? cursor.getSurroundingText(15) : void 0 : void 0;
          period = contents.before.lastIndexOf(".");
          period2 = contents.before.lastIndexOf("?");
          period3 = contents.before.lastIndexOf("!");
          period4 = contents.before.lastIndexOf("\n");
          period = Math.max(period, period2, period3, period4);
          if (period >= 0) {
            contents.before = contents.before.slice(period + 1);
          }
          contents.before = contents.before.replace(/\n/g, " ");
          if (contents.before.length === 0) {
            contents.before = " ";
          }
          this.holder = contents.before;
          this.cursorVersion = cursor.version;
        }
      } else {
        this.holder = " ";
      }
      if (value !== this.holder) {
        this.input.value = this.holder;
      }
      if (value !== this.lastHolder && (value === this.lastHolder.slice(0, -1) || (value.length === 0))) {
        this.emit("key", new KeyEvent({
          which: 8
        }));
      } else if (value !== this.lastHolder) {
        value = value.slice(this.lastHolder.length);
        if (value && value.length > 0) {
          this.emit("input", value);
        }
      }
      return this.lastHolder = this.holder;
    };

    InputMethodChrome.prototype.check = function() {
      var Key, event, keys, prop, results;
      if (!this.isActive) {
        return;
      }
      Key = Leaf.Key;
      if (this.state !== "composition" && (this.input.value.length > 0 || this.editor.platform.isMobile())) {
        this.data.canFlush = true;
      }
      if (this.data.canFlush) {
        this.data.canFlush = false;
        this.flush();
      }
      keys = this.data.keys;
      results = [];
      for (prop in keys || {}) {
        event = keys != null ? keys[prop] : void 0;
        if (event && !event.defaultPrevented) {
          if (keys != null) {
            delete keys[prop];
          }
          results.push(this.emit("key", new KeyEvent(event)));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    InputMethodChrome.prototype.onkeydown = function(e) {
      this.delayCheck();
      if (this.isWaitingFor("input")) {
        return this.give("input", {
          type: "keyboard",
          event: e
        });
      }
    };

    InputMethodChrome.prototype.onkeyup = function(e) {
      this.delayCheck();
      if (this.isWaitingFor("input")) {
        return this.give("input", {
          type: "keyboard",
          event: e
        });
      }
    };

    InputMethodChrome.prototype.oncompositionstart = function(e) {
      if (this.isWaitingFor("input")) {
        return this.give("input", {
          type: "ime",
          event: e,
          action: "start"
        });
      }
    };

    InputMethodChrome.prototype.oncompositionupdate = function(e) {
      this.delayCheck();
      if (this.isWaitingFor("input")) {
        return this.give("input", {
          type: "ime",
          event: e,
          action: "update"
        });
      }
    };

    InputMethodChrome.prototype.oncompositionend = function(e) {
      this.delayCheck();
      if (this.isWaitingFor("input")) {
        return this.give("input", {
          type: "ime",
          event: e,
          action: "end"
        });
      }
    };

    InputMethodChrome.prototype.onpaste = function(e) {
      var blob, cdata, i, item, len, ref, results, type;
      cdata = e.clipboardData;
      ref = e.clipboardData.items || {};
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        type = item.type || "";
        if (type.indexOf("image/") === 0) {
          blob = item.getAsFile();
          if (blob instanceof Blob) {
            this.emit("image", {
              blob: blob
            });
            e.preventDefault();
            results.push(e.stopImmediatePropagation());
          } else {
            results.push(void 0);
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    InputMethodChrome.prototype.handleKeyboard = function(e) {
      if (e.type === "keyup") {
        this.data.canFlush = true;
      } else if (e.type === "keydown") {
        this.data.canFlush = true;
      }
      this.data.keys[e.which] = e;
      return this.check();
    };

    InputMethodChrome.prototype.atWait = function(sole) {
      return this.waitFor("input", (function(_this) {
        return function(input) {
          if (input.type === "keyboard") {
            _this.handleKeyboard(input.event);
            if (_this.stale(sole)) {
              return;
            }
            _this.setState("wait");
            return;
          }
          if (input.type === "ime" && input.action === "start") {
            _this.setState("composition");
            return;
          }
          _this.error(new Errors.UnexpectedInput("unexpected input at wait", {
            input: info
          }));
        };
      })(this));
    };

    InputMethodChrome.prototype.atPanic = function() {
      return Logger.error(this.panicState, this.panicError);
    };

    InputMethodChrome.prototype.atComposition = function() {
      this.input.classList.add("compose");
      this.data.isComposing = true;
      this.data.canFlush = false;
      return this.waitFor("input", (function(_this) {
        return function(input) {
          if (input.type !== "ime") {
            _this.setState("composition");
            return;
          }
          if (input.action === "update") {
            _this.setState("composition");
            return;
          }
          if (input.action === "end") {
            _this.data.canFlush = true;
            _this.data.isComposing = false;
            _this.input.classList.remove("compose");
            _this.setState("wait");
            return;
          }
          return _this.setState("composition");
        };
      })(this));
    };

    return InputMethodChrome;

  })(States);

  CompositeSession = (function() {
    function CompositeSession(fullText, compositePart) {
      this.fullText = fullText;
      this.compositePart = compositePart;
    }

    CompositeSession.prototype.isValid = function() {
      var ref;
      return ((ref = this.fullText) != null ? typeof ref.slice === "function" ? ref.slice(-this.compositePart.length) : void 0 : void 0) === this.compositePart;
    };

    return CompositeSession;

  })();

  GeneralInputMethod = (function(superClass) {
    extend(GeneralInputMethod, superClass);

    function GeneralInputMethod(editor, master) {
      var Key;
      this.editor = editor;
      this.master = master;
      GeneralInputMethod.__super__.constructor.call(this);
      new FocusableTrait(this);
      new ActivableTrait(this);
      new KeyEventHandler(this);
      this.input = document.createElement("textarea");
      this.input$ = $(this.input);
      this.input.classList.add("general-input-method");
      this.input.addEventListener("keydown", this.onkeydown.bind(this), true);
      this.input.addEventListener("keyup", this.onkeyup.bind(this), true);
      this.input.addEventListener("input", this.oninput.bind(this));
      this.input.addEventListener("compositionstart", this.oncompositionstart.bind(this));
      this.input.addEventListener("compositionupdate", this.oncompositionupdate.bind(this));
      if (this.editor.platform.isMobile()) {
        this.requestIMEComplete = true;
      }
      this.inputHolder = "  ";
      this.input.addEventListener("compositionend", this.oncompositionend.bind(this));
      this.sessionId = 0;
      document.body.appendChild(this.input);
      this.checkResize = this.checkResize.bind(this);
      window.addEventListener("resize", this.checkResize);
      this.input.addEventListener("blur", (function(_this) {
        return function() {
          return _this.reform();
        };
      })(this));
      Key = Leaf.Key;
      this.charKeys = {
        " ": {
          which: Key.space,
          shiftKey: true
        },
        "!": {
          which: Key["1"],
          shiftKey: true
        },
        "@": {
          which: Key["2"],
          shiftKey: true
        },
        "#": {
          which: Key["3"],
          shiftKey: true
        },
        "$": {
          which: Key["4"],
          shiftKey: true
        },
        "%": {
          which: Key["5"],
          shiftKey: true
        },
        "^": {
          which: Key["6"],
          shiftKey: true
        },
        "&": {
          which: Key["7"],
          shiftKey: true
        },
        "*": {
          which: Key["8"],
          shiftKey: true
        },
        "(": {
          which: Key["9"],
          shiftKey: true
        },
        ")": {
          which: Key["0"],
          shiftKey: true
        },
        "_": {
          which: Key.dash,
          shiftKey: true
        },
        "+": {
          which: Key.equal,
          shiftKey: true
        },
        "~": {
          which: Key.graveAccent,
          shiftKey: true
        },
        "`": {
          which: Key.graveAccent
        }
      };
      this.forceDisplay = false;
    }

    GeneralInputMethod.prototype.checkResize = function() {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout((function(_this) {
        return function() {
          var height, keyboardHeightMin;
          height = $(window).height();
          keyboardHeightMin = height / 4;
          if (Math.abs(height - _this.editor.initHeight) < keyboardHeightMin) {
            return window.document.activeElement.blur();
          }
        };
      })(this), 500);
      return setTimeout((function(_this) {
        return function() {
          var height, keyboardHeightMin;
          height = $(window).height();
          keyboardHeightMin = 150;
          if (!Math.abs(height - _this.editorn.initHeight) < keyboardHeightMin) {
            return _this.editor.caret.scrollViewPortToComfortable();
          }
        };
      })(this), 10);
    };

    GeneralInputMethod.prototype.atPanic = function() {
      return Logger.error(this.panicError, this.panicState);
    };

    GeneralInputMethod.prototype.sync = function(input) {
      var charKey, content, e, error, error1, holderLength, ke, prevContent, ref, ref1, ref2, ref3, ref4, ref5, suggestedContent, withEnter;
      if (this.input.value === this.data.base.slice(0, -1)) {
        try {
          this.emit("key", new KeyEvent({
            which: 8
          }));
          this.reform();
        } catch (error) {
          e = error;
          Logger.error(e);
        }
        return false;
      } else if (this.input.value === this.data.base.slice(0, this.input.value.length) && this.data.base.length - this.inputHolder.length >= ((ref = this.input.value) != null ? ref.length : void 0)) {
        try {
          this.editor.conduct("delete-word");
          this.reform();
        } catch (error1) {
          e = error1;
          Logger.error(e);
        }
        return false;
      }
      holderLength = this.inputHolder.length;
      withEnter = false;
      charKey = null;
      prevContent = this.data.previousContent || this.data.base.slice(this.inputHolder.length);
      if (((ref1 = this.input.value) != null ? ref1.slice(-1) : void 0) === "\n") {
        ke = new KeyEvent({
          which: 13
        });
        this.emit("key", ke);
        if (ke.defaultPrevented) {
          content = this.input.value.slice(holderLength, -1);
          this.input.value = this.input.value.slice(0, holderLength);
          withEnter = true;
        } else {
          content = this.input.value.slice(holderLength);
        }
      } else if (charKey = this.charKeys[(ref2 = this.input.value) != null ? ref2.slice(-1) : void 0]) {
        ke = new KeyEvent(charKey);
        this.emit("key", ke);
        if (ke.defaultPrevented) {
          content = this.input.value.slice(holderLength, -1);
          this.input.value = this.input.value.slice(0, holderLength);
        } else {
          content = this.input.value.slice(holderLength);
        }
      } else {
        content = this.input.value.slice(holderLength);
      }
      if (prevContent === content) {
        return true;
      }
      this.isReplacingIME = true;
      if (!this.editor.buffer.selection.isCollapsed() && this.editor.buffer.selection.isActive) {
        this.editor.buffer.context.transact((function(_this) {
          return function() {
            _this.editor.buffer.selection.removeSelectedNodes();
            _this.editor.buffer.selection.collapseToBegin();
            return _this.editor.buffer.selection.deactivate();
          };
        })(this));
      }
      this.editor.userIsWriting = true;
      this.cursor.IMEReplace(prevContent, content);
      this.editor.userIsWriting = false;
      this.data.previousContent = content;
      this.isReplacingIME = false;
      this.data.previousContent = content;
      if (((ref3 = this.input.value) != null ? ref3.indexOf("\n") : void 0) > 0 || withEnter) {
        this.reform();
        return false;
      }
      if (this.data.suggestedContent) {
        suggestedContent = this.data.suggestedContent;
        if ((ref4 = this.buffer) != null) {
          ref4.nextRender((function(_this) {
            return function() {
              var ref5;
              if (suggestedContent === _this.data.suggestedContent) {
                return (ref5 = _this.buffer) != null ? ref5.imeHint.hint(_this.data.suggestedContent) : void 0;
              }
            };
          })(this));
        }
      } else {
        if ((ref5 = this.buffer) != null) {
          ref5.imeHint.clear();
        }
      }
      return true;
    };

    GeneralInputMethod.prototype.attachTo = function(buffer) {
      var ref, ref1, ref2, ref3;
      if (buffer === this.buffer) {
        return;
      }
      if ((ref = this.buffer) != null) {
        ref.stopListenBy(this);
      }
      if ((ref1 = this.buffer) != null) {
        if ((ref2 = ref1.imeHint) != null) {
          ref2.clear();
        }
      }
      this.buffer = buffer;
      if ((ref3 = this.cursor) != null) {
        ref3.stopListenBy(this);
      }
      this.cursor = this.buffer.cursor;
      this.cursor.listenBy(this, "move", (function(_this) {
        return function() {
          clearTimeout(_this._reformTimer);
          if (!_this.isReplacingIME) {
            return _this._reformTimer = setTimeout(function() {
              if (!_this.isReplacingIME && !_this.master.isMobileKeyboardShow()) {
                return _this.reform();
              }
            }, 5);
          }
        };
      })(this));
      return this.reform();
    };

    GeneralInputMethod.prototype.reform = function() {
      var ref, ref1;
      this.reset();
      if ((ref = this.buffer) != null) {
        if ((ref1 = ref.context) != null) {
          ref1.history.enableCheckPoint();
        }
      }
      return this.setState("init");
    };

    GeneralInputMethod.prototype.getComposingText = function() {
      return GeneralInputMethod.__super__.getComposingText.call(this);
    };

    GeneralInputMethod.prototype.updatePosition = function(x, y, maxBottom, maxRight) {
      var args, change, css, i, index, item, len, minLeft, xFix, yFix;
      minLeft = 0;
      if (this.editor.platform.isMobile() && !this.forceDisplay) {
        x = -500;
        minLeft = -999999;
      }
      args = [x, y, maxBottom, maxRight];
      change = false;
      xFix = 0;
      yFix = 0;
      if (this.editor.platform.isMobile()) {
        yFix = -25;
      }
      if (this.positionCache) {
        for (index = i = 0, len = args.length; i < len; index = ++i) {
          item = args[index];
          if (item === this.positionCache[index]) {
            continue;
          } else {
            change = true;
            break;
          }
        }
        if (!change) {
          return false;
        }
      }
      this.positionCache = args;
      css = {
        top: y + yFix,
        left: x + xFix
      };
      if (maxBottom && maxBottom < y) {
        delete css.top;
        css.bottom = 0;
      } else {
        css.top = y;
      }
      css.position = "absolute";
      return this.input$.css(css);
    };

    GeneralInputMethod.prototype.reset = function() {
      return GeneralInputMethod.__super__.reset.call(this);
    };

    GeneralInputMethod.prototype.onkeydown = function(e) {
      return this.feed("input", {
        type: "keyboard",
        event: e
      });
    };

    GeneralInputMethod.prototype.onkeyup = function(e) {
      return this.feed("input", {
        type: "keyboard",
        event: e
      });
    };

    GeneralInputMethod.prototype.oninput = function(e) {
      return this.feed("input", {
        type: "input",
        event: e
      });
    };

    GeneralInputMethod.prototype.oncompositionstart = function(e) {
      return this.feed("input", {
        type: "ime",
        event: e,
        action: "start"
      });
    };

    GeneralInputMethod.prototype.oncompositionupdate = function(e) {
      return this.feed("input", {
        type: "ime",
        event: e,
        action: "update"
      });
    };

    GeneralInputMethod.prototype.oncompositionend = function(e) {
      return this.feed("input", {
        type: "ime",
        event: e,
        action: "end"
      });
    };

    GeneralInputMethod.prototype.onpaste = function(e) {
      var blob, cdata, i, item, len, ref, results, type;
      this.reform();
      cdata = e.clipboardData;
      ref = e.clipboardData.items || {};
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        type = item.type || "";
        if (type.indexOf("image/") === 0) {
          blob = item.getAsFile();
          if (blob instanceof Blob) {
            this.emit("image", {
              blob: blob
            });
            e.preventDefault();
            results.push(e.stopImmediatePropagation());
          } else {
            results.push(void 0);
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    GeneralInputMethod.prototype.atPanic = function() {
      return Logger.error(this.panicState, this.panicError);
    };

    GeneralInputMethod.prototype.atHang = function() {};

    GeneralInputMethod.prototype.atInit = function() {
      var ref, ref1, word;
      if (!this.cursor) {
        this.setState("hang");
        return;
      }
      if (this.requestIMEComplete) {
        word = ((ref = this.cursor) != null ? (ref1 = ref.getSurroundingWord(2)) != null ? ref1.before : void 0 : void 0) || "";
        this.data.base = this.inputHolder + word;
      } else {
        this.data.base = this.inputHolder;
      }
      if (this.input.value !== this.data.base) {
        this.input.value = this.data.base;
      }
      return this.setState("waitCompositeUpdate");
    };

    GeneralInputMethod.prototype.atWaitCompositeUpdate = function() {
      return this.consumeWhenAvailable("input", (function(_this) {
        return function(input) {
          var ref, ref1, ref2, ref3, result;
          if (input.type === "keyboard") {
            if (_this.ignoreKeyEvent || input.event.which === 229) {
              _this.setState("waitCompositeUpdate");
              return;
            }
            result = _this.handleKeyboard(input.event);
            if (result.defaultPrevented) {
              _this.reform();
              return;
            } else {
              _this.setState("waitCompositeUpdate");
              return;
            }
          }
          if (input.type === "input") {
            if (!_this.sync()) {
              return;
            }
            _this.setState("waitCompositeUpdate");
            return;
          }
          if (input.type !== "ime") {
            _this.reform();
            return;
          }
          if (input.action === "update") {
            _this.data.suggestedContent = input.event.data;
            _this.setState("waitCompositeUpdate");
            return;
          }
          if (input.action === "start") {
            if ((ref = _this.buffer.context) != null) {
              ref.history.disableCheckPoint();
            }
            _this.data.suggestedContent = "";
            _this.setState("waitCompositeUpdate");
            return;
          }
          if (input.action === "end") {
            if ((ref1 = _this.buffer.context) != null) {
              ref1.history.enableCheckPoint();
            }
            if ((ref2 = _this.buffer.context) != null) {
              ref2.history.addCheckPoint();
            }
            _this.data.onceEnd = true;
            _this.data.suggestedContent = "";
            if ((ref3 = _this.buffer.imeHint) != null) {
              ref3.clear();
            }
            _this.setState("waitCompositeUpdate");
            return;
          }
          return _this.reform();
        };
      })(this));
    };

    return GeneralInputMethod;

  })(Leaf.States);

  KeyEventHandler = (function(superClass) {
    extend(KeyEventHandler, superClass);

    function KeyEventHandler() {
      return KeyEventHandler.__super__.constructor.apply(this, arguments);
    }

    KeyEventHandler.prototype.handleKeyboard = function(event) {
      var e, error, ke;
      try {
        this.emit("key", ke = new KeyEvent(event));
      } catch (error) {
        e = error;
        Logger.error(e);
      }
      return ke;
    };

    return KeyEventHandler;

  })(Trait);

  FocusableTrait = (function(superClass) {
    extend(FocusableTrait, superClass);

    function FocusableTrait() {
      return FocusableTrait.__super__.constructor.apply(this, arguments);
    }

    FocusableTrait.prototype.ensureFocusState = function(option) {
      if (option == null) {
        option = {};
      }
      if (this.isActive) {
        this.isFocusing = true;
      }
      return this._applyFocusToElement();
    };

    FocusableTrait.prototype.focus = function() {
      this.isFocusing = true;
      return this._applyFocusToElement();
    };

    FocusableTrait.prototype.blur = function() {
      this.isFocusing = false;
      return this._applyFocusToElement();
    };

    FocusableTrait.prototype._applyFocusToElement = function() {
      if (this.editor.platform.isMobile() && this.isFocusing) {
        this.input.blur();
        this.input.focus();
        this.reform();
        return;
      }
      if (this.input !== window.document.activeElement && this.isFocusing) {
        this.input.focus();
        return this.reform();
      } else if (this.input === window.document.activeElement && !this.isFocusing) {
        this.input.blur();
        return this.reform();
      }
    };

    return FocusableTrait;

  })(Trait);

  ActivableTrait = (function(superClass) {
    extend(ActivableTrait, superClass);

    function ActivableTrait() {
      return ActivableTrait.__super__.constructor.apply(this, arguments);
    }

    ActivableTrait.prototype.isActive = false;

    ActivableTrait.prototype.activate = function(option) {
      if (option == null) {
        option = {};
      }
      if (this.isActive) {
        return;
      }
      if (option.forceFocus || !this.editor.platform.isMobile()) {
        this.focus();
      }
      if (this.editor.platform.isMobile()) {
        window.addEventListener("resize", this.checkResize);
      }
      this.reset();
      this.setState("init");
      this.isActive = true;
      return this.reform();
    };

    ActivableTrait.prototype.deactivate = function() {
      if (!this.isActive) {
        return;
      }
      this.blur();
      if (this.editor.platform.isMobile()) {
        window.removeEventListener("resize", this.checkResize);
      }
      this.isActive = false;
      return this.reform();
    };

    return ActivableTrait;

  })(Trait);

  ContentEditableHacker = (function() {
    function ContentEditableHacker(inputMethod) {
      this.inputMethod = inputMethod;
    }

    ContentEditableHacker.prototype.setElement = function(el) {
      this.detach(this.el);
      this.attach(el);
      return this.el = el;
    };

    ContentEditableHacker.prototype.detach = function(el) {
      if (!el) {
        return;
      }
      el.removeEventListener("keydown");
      return el.removeEventListener("input");
    };

    ContentEditableHacker.prototype.attach = function(el) {
      el.addEventListener("keydown", function(e) {
        e.preventDefault();
        return e.stopImmediatePropagation();
      });
      el.addEventListener("compositionstart", function(e) {
        e.preventDefault();
        return e.stopImmediatePropagation();
      });
      return el.addEventListener("input", function(e) {
        e.preventDefault();
        return e.stopImmediatePropagation();
      });
    };

    return ContentEditableHacker;

  })();

  BrowserDefaultKeyBehaviorPreventor = (function() {
    BrowserDefaultKeyBehaviorPreventor.preventing = false;

    function BrowserDefaultKeyBehaviorPreventor() {
      if (BrowserDefaultKeyBehaviorPreventor.preventing) {
        return;
      }
      window.addEventListener("keydown", function(e) {
        if (e.altKey && !e.ctrlKey && e.which !== Leaf.Key.d) {
          return e.preventDefault();
        } else if (e.which === Leaf.Key.tab) {
          return e.preventDefault();
        }
      });
      BrowserDefaultKeyBehaviorPreventor.preventing = true;
    }

    return BrowserDefaultKeyBehaviorPreventor;

  })();

  module.exports = InputMethodMaster;

}).call(this);

}
GlobalContext.setModule("vincent/facility/inputMethod.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/platform.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Device, Platform,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Platform = (function(superClass) {
    extend(Platform, superClass);

    Platform.create = function() {
      if (this.instance == null) {
        this.instance = new Platform();
      }
      return this.instance;
    };

    function Platform() {
      var ref, ref1, ref2, ref3, ref4, ref5;
      Platform.__super__.constructor.call(this);
      this.init();
      if (this.isLinux()) {
        if ((ref = document.body) != null) {
          ref.classList.add("linux");
        }
      }
      if (this.isMac()) {
        if ((ref1 = document.body) != null) {
          ref1.classList.add("mac");
        }
      }
      if (this.isIOS()) {
        if ((ref2 = document.body) != null) {
          ref2.classList.add("ios");
        }
      }
      if (this.isWindows()) {
        if ((ref3 = document.body) != null) {
          ref3.classList.add("windows");
        }
      }
      if (!this.isMobile()) {
        window.addEventListener("mousedown", (function(_this) {
          return function(e) {
            _this.isMouseDown = true;
            _this.lastMousePoint = e;
            _this.lastMouseDownDate = new Date;
          };
        })(this), true);
        window.addEventListener("mouseup", (function(_this) {
          return function() {
            _this.isMouseDown = false;
          };
        })(this), true);
        window.addEventListener("keydown", (function(_this) {
          return function(e) {
            if (e.which === 16) {
              _this.isShiftDown = true;
            }
          };
        })(this), true);
        window.addEventListener("keyup", (function(_this) {
          return function(e) {
            if (e.which === 16) {
              _this.isShiftDown = false;
            }
          };
        })(this), true);
      }
      this.device = new Device();
      this.deviceDetail = this.device.init();
      Logger.debug("Platform", (ref4 = this.deviceDetail.os) != null ? ref4.name : void 0, (ref5 = this.deviceDetail.browser) != null ? ref5.name : void 0);
    }

    Platform.prototype.isWindows = function() {
      return navigator.platform.indexOf('Win') > -1;
    };

    Platform.prototype.isSmall = function() {
      if (this.isSmallCheck) {
        return this._isSmall;
      }
      this.isSmallCheck = true;
      if (window.screen.width < 500) {
        this._isSmall = true;
        return true;
      }
      this._isSmall = false;
      return false;
    };

    Platform.prototype.isMeduim = function() {
      if (this.isMediumCheck) {
        return this._isMedium;
      }
      this.isMediumCheck = true;
      if (window.screen.width >= 500 && window.screen.width < 1025) {
        this._isMedium = true;
        return true;
      }
      this._isMedium = false;
      return false;
    };

    Platform.prototype.isMeduim = function() {
      return !this.isMeduim() && !this.isSmall();
    };

    Platform.prototype.isVirtualKeyboard = function() {
      return this.isMobile();
    };

    Platform.prototype.hasKeyboard = function() {
      return !this.isTouch();
    };

    Platform.prototype.isTouch = function() {
      return this.isMobile();
    };

    Platform.prototype.isMobile = function() {
      var check, ua;
      if (this.isMobileCheck) {
        return this._isMobile;
      }
      check = false;
      ua = navigator.userAgent || navigator.vendor || window.opera;
      (function(_this) {
        return (function(ua) {
          if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0, 4)) || _this.isIOS()) {
            return check = true;
          }
        });
      })(this)(ua);
      this.isMobileCheck = true;
      this._isMobile = check;
      return check;
    };

    Platform.prototype.isNative = function() {
      return false;
    };

    Platform.prototype.isLinux = function() {
      var ref, ref1;
      return ((ref = window.navigator.platform) != null ? (ref1 = ref.toLowerCase()) != null ? ref1.indexOf("linux") : void 0 : void 0) >= 0;
    };

    Platform.prototype.isMac = function() {
      var ref, ref1;
      return ((ref = window.navigator.platform) != null ? (ref1 = ref.toLowerCase()) != null ? ref1.indexOf("mac") : void 0 : void 0) >= 0;
    };

    Platform.prototype.isIOS = function() {
      var ref, ref1;
      return (ref = window.navigator) != null ? (ref1 = ref.userAgent) != null ? ref1.match(/iPhone|iPad|iPod/i) : void 0 : void 0;
    };

    Platform.prototype.isSafari = function() {
      var is_chrome, is_explorer, is_firefox, is_opera, is_safari;
      is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
      is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
      is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
      is_safari = navigator.userAgent.indexOf("Safari") > -1;
      is_opera = navigator.userAgent.toLowerCase().indexOf("op") > -1;
      if (!is_chrome && is_safari || this.isIOS()) {
        return true;
      }
      return false;
    };

    Platform.prototype.isAndroid = function() {
      var ref, ref1;
      return (ref = window.navigator) != null ? (ref1 = ref.userAgent) != null ? ref1.match(/Android/i) : void 0 : void 0;
    };

    Platform.prototype.isVisible = function() {
      var hidden, visibilityChange;
      if (typeof document.hidden !== "undefined") {
        hidden = "hidden";
        visibilityChange = "visibilitychange";
      } else if (typeof document.mozHidden !== "undefined") {
        hidden = "mozHidden";
        visibilityChange = "mozvisibilitychange";
      } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
      } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
      }
      return !document[hidden];
    };

    Platform.prototype.isEmbeded = function() {
      return window.top !== window;
    };

    Platform.prototype.emitEmbedEvent = function() {
      var args, message, name;
      name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (!this.isEmbeded()) {
        return false;
      }
      message = {
        type: "event",
        name: name,
        args: args,
        source: "embed"
      };
      return window.top.postMessage(JSON.stringify(message), "*");
    };

    Platform.prototype.init = function() {
      return window.addEventListener("message", (function(_this) {
        return function(e) {
          var data, err, error;
          try {
            Logger.debug(e.data);
            data = JSON.parse(e.data.toString());
            if (data.type === "event") {
              if (data.args == null) {
                data.args = [];
              }
              if (data.source === "embed") {
                return _this.emit.apply(_this, ["embed/" + data.name].concat(slice.call(data.args)));
              } else if (data.source === "parent") {
                return _this.emit.apply(_this, ["parent/" + data.name].concat(slice.call(data.args)));
              }
            }
          } catch (error) {
            err = error;
            Logger.error("msg error", err, e);
          }
        };
      })(this));
    };

    Platform.prototype.getDeviceDescription = function() {
      return this.deviceDetail.os.name + " " + this.deviceDetail.browser.name;
    };

    return Platform;

  })(Leaf.EventEmitter);

  module.exports = Platform;

  Device = (function() {
    function Device() {}

    Device.prototype.options = [];

    Device.prototype.header = [navigator.platform, navigator.userAgent, navigator.appVersion, navigator.vendor, window.opera];

    Device.prototype.dataos = [
      {
        name: 'Windows Phone',
        value: 'Windows Phone',
        version: 'OS'
      }, {
        name: 'Windows',
        value: 'Win',
        version: 'NT'
      }, {
        name: 'iPhone',
        value: 'iPhone',
        version: 'OS'
      }, {
        name: 'iPad',
        value: 'iPad',
        version: 'OS'
      }, {
        name: 'Kindle',
        value: 'Silk',
        version: 'Silk'
      }, {
        name: 'Android',
        value: 'Android',
        version: 'Android'
      }, {
        name: 'PlayBook',
        value: 'PlayBook',
        version: 'OS'
      }, {
        name: 'BlackBerry',
        value: 'BlackBerry',
        version: '/'
      }, {
        name: 'Macintosh',
        value: 'Mac',
        version: 'OS X'
      }, {
        name: 'Linux',
        value: 'Linux',
        version: 'rv'
      }, {
        name: 'Palm',
        value: 'Palm',
        version: 'PalmOS'
      }
    ];

    Device.prototype.databrowser = [
      {
        name: 'Chrome',
        value: 'Chrome',
        version: 'Chrome'
      }, {
        name: 'Firefox',
        value: 'Firefox',
        version: 'Firefox'
      }, {
        name: 'Safari',
        value: 'Safari',
        version: 'Version'
      }, {
        name: 'Internet Explorer',
        value: 'MSIE',
        version: 'MSIE'
      }, {
        name: 'Opera',
        value: 'Opera',
        version: 'Opera'
      }, {
        name: 'BlackBerry',
        value: 'CLDC',
        version: 'CLDC'
      }, {
        name: 'Mozilla',
        value: 'Mozilla',
        version: 'Mozilla'
      }
    ];

    Device.prototype.init = function() {
      var agent, browser, os;
      agent = this.header.join(' ');
      os = this.matchItem(agent, this.dataos);
      browser = this.matchItem(agent, this.databrowser);
      return {
        os: os,
        browser: browser
      };
    };

    Device.prototype.matchItem = function(string, data) {
      var html, i, j, k, l, match, matches, ref, ref1, regex, regexv, version;
      i = 0;
      j = 0;
      html = "";
      for (i = k = 0, ref = data.length; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
        regex = new RegExp(data[i].value, 'i');
        match = regex.test(string);
        if (match) {
          regexv = new RegExp(data[i].version + '[- /:;]([\\d._]+)', 'i');
          matches = string.match(regexv);
          version = '';
          if (matches && matches[1]) {
            matches = matches[1];
          }
          if (matches) {
            matches = matches.split(/[._]+/);
            for (j = l = 0, ref1 = matches.length; 0 <= ref1 ? l < ref1 : l > ref1; j = 0 <= ref1 ? ++l : --l) {
              if (j === 0) {
                version += matches[j] + '.';
              } else {
                version += matches[j];
              }
            }
          } else {
            version = '0';
          }
          return {
            name: data[i].name,
            version: parseFloat(version)
          };
        }
      }
      return {
        name: 'unknown',
        version: 0
      };
    };

    return Device;

  })();

}).call(this);

}
GlobalContext.setModule("vincent/facility/platform.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/pluginManager.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
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

}
GlobalContext.setModule("vincent/facility/pluginManager.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/searchSession.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Rune, SearchSession, Walker;

  Walker = COM.COMWalker;

  Rune = COM.COMRune;

  SearchSession = (function() {
    function SearchSession(buffer1) {
      this.buffer = buffer1;
      this.editor = this.buffer.editor;
      this.modifier = "gi";
      this.lightColor = "yellow";
      this.focusColor = "orange";
    }

    SearchSession.prototype.setKeyword = function(keyword) {
      this.end();
      return this.keyword = keyword;
    };

    SearchSession.prototype.applyCurrent = function(option) {
      var item, selection;
      if (option == null) {
        option = {};
      }
      item = this.currentFocus;
      selection = this.buffer.selection;
      if (!item) {
        selection.deactivate();
      } else if (option.begin) {
        selection.baseCursor.pointAtAnchor(item.startAnchor);
        selection.extentCursor.pointAtAnchor(item.startAnchor);
        return selection.deactivate();
      } else if (option.select) {
        selection.activate();
        selection.baseCursor.pointAtAnchor(item.startAnchor);
        return selection.extentCursor.pointAtAnchor(item.endAnchor);
      } else {
        selection.baseCursor.pointAtAnchor(item.endAnchor);
        selection.extentCursor.pointAtAnchor(item.endAnchor);
        return selection.deactivate();
      }
    };

    SearchSession.prototype.buildReg = function() {
      var mod, word;
      if (this.keyword.indexOf("reg:") === 0) {
        word = this.keyword.slice(4).replace(/\\n/g, "\n");
        mod = "g";
      } else {
        word = this.keyword.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, function(match) {
          return "\\" + match;
        });
        mod = this.modifier;
      }
      return new RegExp(word, mod);
    };

    SearchSession.prototype.search = function() {
      var buffer, context, cs, currentNode, currentNodePass, cursor, end, endAnchor, match, nextHit, node, previousHit, previousHitTarget, ref, ref1, reg, result, results, start, startAnchor, walker;
      buffer = this.buffer;
      context = this.buffer.context;
      walker = new Walker.WalkerRootFirst(context);
      walker.setNode(context.root);
      results = [];
      currentNode = false;
      nextHit = null;
      previousHit = null;
      reg = this.buildReg();
      previousHitTarget = null;
      cursor = this.cursorBackup;
      while (walker.next((function(item) {
          return item.sortOf("RichText");
        }))) {
        reg.lastIndex = 0;
        node = walker.node;
        cs = Rune.purifyContentString(node.contentString, {
          useHolder: true
        });
        if (walker.node === cursor.target) {
          currentNodePass = true;
        }
        while (match = reg.exec(cs)) {
          if (match[0].length === 0) {
            break;
          }
          startAnchor = walker.node.anchor.clone();
          endAnchor = walker.node.anchor.clone();
          start = match.index;
          end = match.index + match[0].length;
          startAnchor.index = start;
          endAnchor.index = end;
          result = {
            target: walker.node,
            content: match[0],
            length: match.length,
            start: start,
            end: end,
            startAnchor: startAnchor,
            endAnchor: endAnchor
          };
          if (currentNodePass && !nextHit && !this.isReverse) {
            if (result.target === cursor.target && result.start >= cursor.anchor.index) {
              nextHit = true;
              result.current = true;
            } else if (result.target !== cursor.target) {
              nextHit = true;
              result.current = true;
            }
          }
          if (this.isReverse && !currentNodePass) {
            previousHit = true;
            previousHitTarget = result;
          } else if (this.isReverse && currentNodePass && result.target === cursor.target && result.end <= cursor.anchor.index) {
            previousHit = true;
            previousHitTarget = result;
          } else if (this.isReverse && !previousHit) {
            previousHit = true;
            previousHitTarget = result;
          }
          results.push(result);
        }
      }
      if (previousHitTarget) {
        previousHitTarget.current = true;
      }
      if (!nextHit && !this.isReverse) {
        if ((ref = results[0]) != null) {
          ref.current = true;
        }
      }
      if (!previousHitTarget && this.isReverse) {
        if ((ref1 = results[results.length - 1]) != null) {
          ref1.current = true;
        }
      }
      return results;
    };

    SearchSession.prototype.start = function() {
      var current, i, item, len, light, ref;
      if (this.isStart) {
        return;
      }
      this.isStart = true;
      this.cursorBackup = this.buffer.cursor.clone();
      this.lightSession = this.buffer.highlighter.createSession();
      this.hits = this.search();
      this.lights = [];
      this.lightSession.clear();
      ref = this.hits;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        light = this.lightSession.addHighlight(item.startAnchor, item.endAnchor, {
          color: this.lightColor
        });
        item.light = light;
        if (item.current) {
          current = item;
        }
      }
      this.lightSession.applyAll();
      if (current) {
        return this.setCurrent(current);
      }
    };

    SearchSession.prototype.end = function(option) {
      var ref;
      if (option == null) {
        option = {};
      }
      if (!this.isStart) {
        return;
      }
      this.isStart = false;
      if (option.apply && this.keyword) {
        this.applyCurrent(option);
      } else if ((ref = this.cursorBackup) != null ? ref.anchor : void 0) {
        this.buffer.selection.deactivate();
        this.buffer.cursor.pointAtAnchor(this.cursorBackup.anchor);
        this.buffer.selection.collapseToCursor();
      }
      if (this.lightSession) {
        this.lightSession.clear();
        return this.lightSession = null;
      }
    };

    SearchSession.prototype.replaceAll = function(content) {
      this.buffer.context.transact((function(_this) {
        return function() {
          var hit, i, len, ref, text;
          ref = _this.hits;
          for (i = 0, len = ref.length; i < len; i++) {
            hit = ref[i];
            if (!hit) {
              continue;
            }
            text = hit.light.startCursor.target;
            hit.light.startCursor.anchor.deleteBetween(hit.light.endCursor.anchor);
            text.insertText(hit.light.startCursor.anchor.index, content);
          }
          return _this.hits = [];
        };
      })(this));
      return true;
    };

    SearchSession.prototype.replaceCurrentContentAndNext = function(content) {
      if (!this.currentFocus) {
        return false;
      }
      return this.buffer.context.transact((function(_this) {
        return function() {
          var matchIndex, text;
          text = _this.currentFocus.light.startCursor.target;
          _this.currentFocus.light.startCursor.anchor.deleteBetween(_this.currentFocus.light.endCursor.anchor);
          text.insertText(_this.currentFocus.light.startCursor.anchor.index, content);
          matchIndex = -1;
          _this.currentFocus.light.clear();
          _this.hits = _this.hits.filter(function(item, index) {
            if (item !== _this.currentFocus) {
              return true;
            }
            matchIndex = index;
            return false;
          });
          if (_this.hits[matchIndex]) {
            return _this.setCurrent(_this.hits[matchIndex]);
          } else if (_this.hits[0]) {
            return _this.setCurrent(_this.hits[0]);
          } else {
            return _this.currentFocus = null;
          }
        };
      })(this));
    };

    SearchSession.prototype.setCurrent = function(item) {
      var rect, ref;
      if (!item) {
        return false;
      }
      if (this.currentFocus) {
        this.currentFocus.light.setOption({
          color: this.lightColor
        });
      }
      item.light.setOption({
        color: this.focusColor
      });
      this.currentFocus = item;
      this.buffer.cursor.pointAtAnchor(item.light.startCursor.anchor);
      item.light.blink();
      rect = (ref = item.light.rects[0]) != null ? ref.rect : void 0;
      if (!rect) {
        return;
      }
      this.editor.buffer.viewPort.scrollToRectComfortableZone(rect, {
        forceCenter: true
      });
      return true;
    };

    SearchSession.prototype.next = function() {
      var i, index, item, len, next, ref;
      if (!this.hits) {
        return false;
      }
      if (!this.currentFocus) {
        return this.setCurrent(this.hits[0]);
      }
      ref = this.hits;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        item = ref[index];
        next = this.hits[index + 1];
        if (item === this.currentFocus) {
          if (next) {
            this.setCurrent(next);
            return true;
          } else {
            return this.setCurrent(this.hits[0]);
          }
        }
      }
      return false;
    };

    SearchSession.prototype.previous = function() {
      var i, index, item, len, previous, ref;
      if (!this.hits) {
        return false;
      }
      if (!this.currentFocus) {
        return this.setCurrent(this.hits[0]);
      }
      ref = this.hits;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        item = ref[index];
        previous = this.hits[index - 1];
        if (item === this.currentFocus) {
          if (previous) {
            this.setCurrent(previous);
            return true;
          } else {
            return this.setCurrent(this.hits[this.hits.length - 1]);
          }
        }
      }
      return false;
    };

    return SearchSession;

  })();

  module.exports = SearchSession;

}).call(this);

}
GlobalContext.setModule("vincent/facility/searchSession.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/selectSession.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var DOMBoundary, DOMRegion, DOMSelection, SelectSession, States,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  States = require("../common/states");

  DOMRegion = require("../common/region");

  DOMBoundary = require("../common/boundary");

  DOMSelection = require("../facility/selection");

  SelectSession = (function(superClass) {
    extend(SelectSession, superClass);

    function SelectSession(buffer) {
      this.buffer = buffer;
      SelectSession.__super__.constructor.call(this);
      this.selection = this.buffer.selection;
      this.domSelection = this.buffer.editor.domSelection;
      this.onSelectionChange = this.onSelectionChange.bind(this);
      if (this.buffer.editor.platform.hasKeyboard() || true) {
        this.passive = false;
      } else {
        this.passive = true;
      }
      this.mode = "";
    }

    SelectSession.prototype.clear = function() {
      if (!this.passive) {
        this.clearDomSelection();
        this.selection.deactivate();
        return this.selection.collapseToEnd();
      }
    };

    SelectSession.prototype.syncSelection = function() {
      if (this.passive) {
        return;
      }
      return this.syncFromCOM();
    };

    SelectSession.prototype.selectCurrentWord = function() {
      var selection;
      selection = this.selection;
      selection.activate();
      selection.collapseToCursor();
      selection.baseCursor.conduct("backwardWord");
      return selection.extentCursor.conduct("forwardWord");
    };

    SelectSession.prototype.selectCurrentLine = function() {
      var selection;
      if (this.buffer.editor.platform.isMobile()) {
        return false;
      }
      selection = this.selection;
      selection.activate();
      selection.collapseToCursor();
      selection.baseCursor.conduct("startOfLine");
      return selection.extentCursor.conduct("endOfLine");
    };

    SelectSession.prototype.syncToCOM = function() {
      var base, extent, selection;
      selection = window.getSelection();
      if (selection.isCollapsed) {
        return false;
      }
      base = new DOMRegion(selection.baseNode, selection.baseOffset);
      extent = new DOMRegion(selection.extentNode, selection.extentOffset);
      this.selection.activate();
      this.selection.baseCursor.setCursorByDOMRegion(base);
      this.selection.extentCursor.setCursorByDOMRegion(extent);
      return true;
    };

    SelectSession.prototype.onSelectionChange = function() {
      if (this.passive) {
        return this.syncToCOM();
      }
    };

    SelectSession.prototype.deactivate = function() {
      this.clearDomSelection();
      if (!this.isActive) {
        return;
      }
      this.isActive = false;
      return document.removeEventListener("selectionchange", this.onSelectionChange);
    };

    SelectSession.prototype.activate = function() {
      if (this.isActive) {
        return;
      }
      this.isActive = true;
      return document.addEventListener("selectionchange", this.onSelectionChange);
    };

    SelectSession.prototype.syncFromCOM = function() {
      if (!this.isActive) {
        this.clearDomSelection();
        return false;
      }
      if (!this.selection.isActive) {
        this.clearDomSelection();
        return false;
      }
      if (this.passive) {
        return false;
      }
      if (this.selection.isCollapsed()) {
        this.clearDomSelection();
      } else {
        this.selectionFromCOM();
      }
      return true;
    };

    SelectSession.prototype.clearDomSelection = function() {
      return this.domSelection.clear(this);
    };

    SelectSession.prototype.updateExtentCursor = function(action) {
      if (action.source === "mouse") {
        return this.updateExtentCursorByMouse(action.e);
      } else {
        return this.updateExtentCursorByTouch(action.e);
      }
    };

    SelectSession.prototype.updateExtentCursorByTouch = function(e) {
      var ref, touches, x, y;
      if ((e != null ? (ref = e.touches) != null ? ref.length : void 0 : void 0) < 2) {
        return;
      }
      touches = e.touches;
      e.preventDefault();
      x = (touches[0].clientX + touches[1].clientX) / 2;
      y = (touches[0].clientY + touches[1].clientY) / 2;
      this.buffer.viewPort.setCursorByClientPoint(x, y);
      return this.selection.collapseToCursor();
    };

    SelectSession.prototype.updateExtentCursorByMouse = function(e) {
      return this.buffer.viewPort.setCursorByClientPoint(e.clientX, e.clientY);
    };

    SelectSession.prototype.selectionFromCOM = function() {
      var backup, base, extent, range, selection;
      selection = this.buffer.selection;
      if (!(base = selection.baseAnchor)) {
        return false;
      }
      if (!(extent = selection.extentAnchor)) {
        return false;
      }
      base = base.getCorrespondingBoundary();
      extent = extent.getCorrespondingBoundary();
      range = DOMBoundary.createRangeBetween(base, extent);
      backup = document.createRange();
      backup = range.cloneRange();
      backup.endOffset = 20;
      this.clearDomSelection();
      this.domSelection.use(this, range);
    };

    return SelectSession;

  })(States);

  module.exports = SelectSession;

}).call(this);

}
GlobalContext.setModule("vincent/facility/selectSession.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/selection.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var DOMSelection,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  DOMSelection = (function(superClass) {
    extend(DOMSelection, superClass);

    function DOMSelection(editor) {
      this.editor = editor;
      DOMSelection.__super__.constructor.call(this);
      this.ranges = [];
    }

    DOMSelection.prototype.detect = function() {
      var selection;
      selection = window.getSelection();
      if (selection.isCollapsed) {
        return false;
      } else {
        return true;
      }
    };

    DOMSelection.prototype.use = function(who, range) {
      if (!range) {
        throw new Error("DOMSelection.use should provide a valid range");
      }
      return this.ranges.push({
        who: who,
        range: {
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset
        }
      });
    };

    DOMSelection.prototype.clear = function(who) {
      var length;
      length = this.ranges.length;
      if (length === 0) {
        return false;
      }
      this.ranges = this.ranges.filter(function(item) {
        return item.who !== who;
      });
      if (this.ranges.length === length) {
        return false;
      }
      if (!who) {
        return this.ranges = [];
      }
    };

    DOMSelection.prototype.disable = function() {
      return this.disabled = true;
    };

    DOMSelection.prototype.enable = function() {
      return this.disabled = false;
    };

    DOMSelection.prototype.render = function() {
      var i, item, len, range, ref, results, selection;
      if (this.disabled) {
        return;
      }
      if (this.ranges.length === 0 || (this.ranges.length === 1 && this.ranges[0].range.isCollapsed)) {
        if (this.hasFocus) {
          this.hasFocus = false;
          this.editor.focus.inputFocus.release(this);
        }
        return;
      }
      this.hasFocus = true;
      this.editor.focus.inputFocus.obtain(this);
      selection = window.getSelection();
      selection.removeAllRanges();
      return;
      ref = this.ranges;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        range = document.createRange();
        range.setStart(item.range.startContainer, item.range.startOffset);
        range.setEnd(item.range.endContainer, item.range.endOffset);
        results.push(selection.addRange(range));
      }
      return results;
    };

    return DOMSelection;

  })(Leaf.EventEmitter);

  module.exports = DOMSelection;

}).call(this);

}
GlobalContext.setModule("vincent/facility/selection.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/selectionHighlight.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var Caret, Rect, SelectionHighlight,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Caret = require("./caret");

  SelectionHighlight = (function(superClass) {
    extend(SelectionHighlight, superClass);

    function SelectionHighlight(buffer) {
      this.buffer = buffer;
      this.editor = this.buffer.editor;
      this.buffer.listenBy(this, "resize", (function(_this) {
        return function() {
          return _this.render();
        };
      })(this));
      this.caretBase = new Caret(this.editor, {
        name: "base"
      });
      this.caretExtent = new Caret(this.editor, {
        name: "extent"
      });
      this.caretBase.init();
      this.caretExtent.init();
      this.head = new Rect();
      this.body = new Rect();
      this.foot = new Rect();
      this.buffer.viewPort.el.appendChild(this.head.node);
      this.buffer.viewPort.el.appendChild(this.body.node);
      this.buffer.viewPort.el.appendChild(this.foot.node);
    }

    SelectionHighlight.prototype.destroy = function() {
      this.caretBase.destroy();
      this.caretExtent.destroy();
      return this.buffer.stopListenBy(this);
    };

    SelectionHighlight.prototype.setRange = function(range) {
      this.range = range;
      return this.render();
    };

    SelectionHighlight.prototype.render = function() {
      if (this.buffer.selection.isCollapsed() || !this.buffer.selection.isActive) {
        this.caretBase.hide();
        this.caretExtent.hide();
        this.head.setDimension();
        this.body.setDimension();
        this.foot.setDimension();
        return;
      }
      if (!this.caretBase.isShow) {
        this.caretBase.show();
        this.caretExtent.show();
        if (this.caretBase.currentBuffer !== this.buffer) {
          this.caretBase.attachTo(this.buffer, this.buffer.selection.baseCursor);
          this.caretExtent.attachTo(this.buffer, this.buffer.selection.extentCursor);
        }
      }
      this.caretBase.update();
      this.caretExtent.update();
      return this.updateRects();
    };

    SelectionHighlight.prototype.updateRects = function() {
      var bottomRect, rootRect, topRect;
      rootRect = this.buffer.viewPort.el.getBoundingClientRect();
      topRect = this.caretBase.lastRenderDetail;
      bottomRect = this.caretExtent.lastRenderDetail;
      if (!topRect || !bottomRect) {
        return;
      }
      if (topRect.bottom < bottomRect.top) {
        return this.updateMultiLine(rootRect, topRect, bottomRect);
      } else if (bottomRect.bottom < topRect.top) {
        return this.updateMultiLine(rootRect, bottomRect, topRect);
      } else {
        if (topRect.left < bottomRect.left) {
          this.updateSingleLine(rootRect, topRect, bottomRect);
        } else {
          this.updateSingleLine(rootRect, bottomRect, topRect);
        }
      }
    };

    SelectionHighlight.prototype.updateSingleLine = function(rootRect, leftRect, rightRect) {
      var bottom, height, left, top, width;
      this.head.setDimension();
      this.foot.setDimension();
      top = Math.min(leftRect.top, rightRect.top);
      bottom = Math.max(leftRect.bottom, rightRect.bottom);
      height = bottom - top;
      left = leftRect.left;
      width = rightRect.right - leftRect.left;
      return this.body.setDimension({
        top: top,
        left: left,
        height: height,
        width: width
      });
    };

    SelectionHighlight.prototype.updateMultiLine = function(rootRect, topRect, bottomRect) {
      var bodyRect, footRect, headRect, scrollWidthFix;
      scrollWidthFix = 6;
      headRect = {
        left: topRect.left,
        top: topRect.top,
        width: rootRect.right - topRect.left - rootRect.left - scrollWidthFix,
        height: topRect.height
      };
      bodyRect = {
        left: 0,
        top: topRect.bottom,
        width: rootRect.width - scrollWidthFix,
        height: bottomRect.top - topRect.top - topRect.height
      };
      footRect = {
        left: 0,
        top: bottomRect.top,
        width: bottomRect.right,
        height: bottomRect.height
      };
      this.head.setDimension(headRect);
      this.body.setDimension(bodyRect);
      return this.foot.setDimension(footRect);
    };

    return SelectionHighlight;

  })(Leaf.EventEmitter);

  Rect = (function(superClass) {
    extend(Rect, superClass);

    function Rect() {
      Rect.__super__.constructor.call(this);
      this.node.classList.add("selection-rect");
    }

    Rect.prototype.setDimension = function(rect) {
      var ref, ref1;
      if (!rect || rect.height <= 6) {
        this.node.style.display = "none";
        return;
      } else {
        this.node.style.display = "block";
      }
      if (((ref = this.lastRect) != null ? ref.left : void 0) === rect.left && ((ref1 = this.lastRect) != null ? ref1.top : void 0) === rect.top && this.lastRect.width === rect.width && this.lastRect.height === rect.height) {
        return;
      }
      this.lastRect = rect;
      this.node$.css(rect);
      return this.node$.css({
        position: "absolute"
      });
    };

    return Rect;

  })(Leaf.Widget);

  module.exports = SelectionHighlight;

}).call(this);

}
GlobalContext.setModule("vincent/facility/selectionHighlight.js",module,exec);
})();
(function(){
var require = GlobalContext.requireModule.bind(GlobalContext,"vincent/facility/viewPort.js");
var module = {};
module.exports = {};
var exports = module.exports;
function exec(){
    // Generated by CoffeeScript 1.10.0
(function() {
  var DOMRegion, KeyEvent, PathTracer, PointerEvent, States, ThumbControlSession, TimeFeed, TriggerStack, Vibration, ViewPort, ViewPortPointerController, ViewPortTouchController,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  DOMRegion = require("../common/region");

  States = require("../common/states");

  KeyEvent = require("../common/keyEvent");

  Vibration = require("/component/vibration");

  ViewPort = (function(superClass) {
    extend(ViewPort, superClass);

    function ViewPort(buffer, el1) {
      this.buffer = buffer;
      this.el = el1;
      ViewPort.__super__.constructor.call(this);
      this.editor = this.buffer.editor;
      this.selectSession = this.buffer.selectSession;
      this.el.viewPort = this;
      this.el.buffer = this.buffer;
      this.comfortableMargin = $("body").height() / 8 || 30;
      this.__defineGetter__("isActive", (function(_this) {
        return function() {
          return _this.buffer.isActive;
        };
      })(this));
      this.__defineGetter__("height", (function(_this) {
        return function() {
          var ref;
          return ((ref = _this.el) != null ? ref.offsetHeight : void 0) || 0;
        };
      })(this));
      this.el.addEventListener("scroll", (function(_this) {
        return function() {
          return _this.emit("scroll");
        };
      })(this));
    }

    ViewPort.prototype.setRoot = function(rootElement) {
      var ref, ref1, ref2;
      if (this.rootElement === rootElement) {
        return;
      }
      if (((ref = this.rootElement) != null ? ref.parentElement : void 0) === this.el) {
        if ((ref1 = this.rootElement) != null) {
          if ((ref2 = ref1.parentElement) != null) {
            ref2.removeChild(this.rootElement);
          }
        }
      }
      if (rootElement.parentElement !== this.el) {
        this.el.appendChild(rootElement);
      }
      this.rootElement = rootElement;
      this.rootElement.classList.add("no-select");
      return this.emit("rootElement", this.rootElement);
    };

    ViewPort.prototype.init = function() {
      this.scrollable = this.el;
      if (!this.editor.platform.isMobile()) {
        return this.controller = new ViewPortPointerController(this.buffer, this);
      } else {
        return this.controller = new ViewPortTouchController(this.buffer, this);
      }
    };

    ViewPort.prototype.scrollToRectComfortableZone = function(rect, option) {
      var bottom, center, setScroll, top;
      if (option == null) {
        option = {};
      }
      if (!rect) {
        return false;
      }
      top = this.scrollable.scrollTop;
      bottom = top + this.height;
      center = (rect.top + rect.bottom) / 2;
      setScroll = (function(_this) {
        return function(v) {
          if (_this.scrollable.scrollTop !== v) {
            return _this.scrollable.scrollTop = v;
          }
        };
      })(this);
      if (option.forceCenter) {
        this.scrollable.scrollTop = center - this.height / 2;
        return true;
      }
      if (rect.top - this.comfortableMargin < top && top > 0) {
        if (option.center) {
          setScroll(center - this.height / 2);
        } else {
          setScroll(rect.top - this.comfortableMargin);
        }
      }
      if (rect.bottom + this.comfortableMargin > bottom) {
        if (option.center) {
          setScroll(center - this.height / 2);
        } else {
          setScroll(rect.bottom + this.comfortableMargin - this.height);
        }
      }
      return true;
    };

    ViewPort.prototype.nextPage = function() {
      this.scrollable.scrollTop += this.height * 3 / 4;
      return true;
    };

    ViewPort.prototype.previousPage = function() {
      this.scrollable.scrollTop -= this.height * 3 / 4;
      return true;
    };

    ViewPort.prototype.goTop = function() {
      return this.scrollable.scrollTop = 0;
    };

    ViewPort.prototype.goBottom = function() {
      return this.scrollable.scrollTop = this.scrollable.scrollHeight;
    };

    ViewPort.prototype.DOMRegionFromPoint = function(x, y) {
      var clientX, clientY, r;
      clientX = x;
      clientY = y;
      if (this.editor.platform.isSafari()) {
        this.rootElement.classList.add("has-select");
        r = DOMRegion.fromClientPoint(x, y);
        this.rootElement.classList.remove("has-select");
      } else {
        r = DOMRegion.fromClientPoint(x, y);
      }
      return r;
    };

    ViewPort.prototype.setCursorByClientPoint = function(x, y, cursor) {
      var el, ref, region;
      if (this.selectSession == null) {
        this.selectSession = this.buffer.selectSession;
      }
      if (this.selectSession.passive && ((ref = this.selectSession.selection) != null ? typeof ref.detect === "function" ? ref.detect() : void 0 : void 0) && !cursor) {
        return;
      }
      region = this.DOMRegionFromPoint(x, y);
      if (!region) {
        return false;
      }
      el = region.getContainerElement();
      while (el && el !== this.el) {
        if (el.getAttribute("comless")) {
          return false;
        }
        el = el.parentElement;
      }
      if (cursor == null) {
        cursor = this.buffer.cursor;
      }
      cursor.setCursorByDOMRegion(region);
      return true;
    };

    ViewPort.prototype.resolveRectWithTop = function(rect) {
      var scrollTop;
      scrollTop = this.el.scrollTop;
      if (!this.baseRect) {
        this.baseRect = this.el.getBoundingClientRect();
      }
      rect = {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
        height: rect.height,
        width: rect.width
      };
      rect.top += scrollTop;
      rect.bottom += scrollTop;
      rect.top -= this.baseRect.top;
      rect.bottom -= this.baseRect.top;
      rect.left -= this.baseRect.left;
      rect.right -= this.baseRect.left;
      return rect;
    };

    ViewPort.prototype.resolveRect = function(rect) {
      var scrollTop;
      scrollTop = this.el.scrollTop;
      if (!this.baseRect) {
        this.baseRect = this.el.getBoundingClientRect();
      }
      rect = {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
        height: rect.height,
        width: rect.width
      };
      rect.top -= this.baseRect.top;
      rect.bottom -= this.baseRect.top;
      rect.left -= this.baseRect.left;
      rect.right -= this.baseRect.left;
      return rect;
    };

    return ViewPort;

  })(Leaf.EventEmitter);

  PointerEvent = (function() {
    function PointerEvent(e, delta1) {
      var dD, dX, dY, i, j, len, len1, name, ref, ref1, ref2, ref3, ref4, ref5, touch, value, x, y;
      this.delta = delta1;
      if (PointerEvent.winHeight == null) {
        PointerEvent.winHeight = $(window).height();
      }
      if (PointerEvent.winWidth == null) {
        PointerEvent.winWidth = $(window).width();
      }
      PointerEvent.maxDimension = Math.max(PointerEvent.winHeight, PointerEvent.winWidth);
      this.raw = e;
      this.type = e.type;
      this.src = e.target || e.srcElement;
      this.fingerCloseDistance = 140;
      this.twoHandDistance = Math.min(PointerEvent.maxDimension / 2, 440);
      this.date = new Date();
      this.shiftKey = e.shiftKey;
      if (typeof e.clientX === "number") {
        this.x = e.clientX;
        this.y = e.clientY;
        this.distance = 0;
        this.sampling = 1;
        if (e.type === "mouseup") {
          this.done = true;
        }
      } else if (typeof e.touches !== "undefined") {
        this.touches = e.touches;
        x = 0;
        y = 0;
        ref = this.touches;
        for (i = 0, len = ref.length; i < len; i++) {
          touch = ref[i];
          x += touch.clientX;
          y += touch.clientY;
        }
        this.x = x / this.touches.length;
        this.y = y / this.touches.length;
        this.indexX = (ref1 = this.touches[0]) != null ? ref1.clientX : void 0;
        this.indexY = (ref2 = this.touches[0]) != null ? ref2.clientY : void 0;
        this.indexId = ((ref3 = this.touches[0]) != null ? ref3.identifier : void 0) || -1;
        dD = 0;
        ref4 = this.touches;
        for (j = 0, len1 = ref4.length; j < len1; j++) {
          touch = ref4[j];
          dX = touch.clientX - this.x;
          dY = touch.clientY - this.y;
          dD += Math.sqrt(dX * dX + dY * dY);
        }
        this.distance = (dD / this.touches.length) * 2;
        this.sampling = this.touches.length;
        if (this.sampling === 2) {
          this.computePointAt();
        }
        if (this.type === "touchend" && this.touches.length === 0) {
          this.done = true;
        }
        if (this.type === "touchstart" && this.touches.length === 1) {
          this.increase = false;
        } else if (this.type === "touchstart") {
          this.increase = true;
        }
      } else if (e.type === "hold" && e.via) {
        ref5 = e.via;
        for (name in ref5) {
          value = ref5[name];
          if (typeof value !== "function" && (name !== "delta" && name !== "type")) {
            this[name] = value;
          }
        }
        return;
      }
    }

    PointerEvent.prototype.noTrigger = function() {
      var el;
      el = this.src;
      while (el) {
        if (el.classList.contains("com-no-trigger")) {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    };

    PointerEvent.prototype.canDrag = function() {
      var el;
      el = this.src;
      while (el) {
        if (el.dragSupport === "support" || el.getAttribute("drag-support") === "support") {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    };

    PointerEvent.prototype.computePointAt = function() {
      var deg, f1, f2, forwardLength, length, p1, p2, ref, unit, v, vector;
      f1 = this.touches[0];
      f2 = this.touches[1];
      p1 = {
        x: f1.clientX,
        y: f1.clientY
      };
      p2 = {
        x: f2.clientX,
        y: f2.clientY
      };
      if (p2.x < p1.x) {
        ref = [p2, p1], p1 = ref[0], p2 = ref[1];
      }
      vector = {
        x: p1.x - p2.x,
        y: p1.y - p2.y
      };
      deg = Math.PI / 2;
      v = {
        x: vector.x * Math.cos(deg) - vector.y * Math.sin(deg),
        y: vector.y * Math.cos(deg) + vector.x * Math.sin(deg)
      };
      length = Math.sqrt(v.x * v.x + v.y * v.y);
      unit = {
        x: v.x / length,
        y: v.y / length
      };
      forwardLength = this.fingerCloseDistance / 2;
      this.pointAtX = unit.x * forwardLength + this.x;
      return this.pointAtY = unit.y * forwardLength + this.y;
    };

    PointerEvent.prototype.isFingerClose = function() {
      var isClose;
      isClose = this.distance < this.fingerCloseDistance;
      return isClose;
    };

    PointerEvent.prototype.isTwoHand = function() {
      var isTwoHand;
      isTwoHand = this.distance > this.twoHandDistance;
      return isTwoHand;
    };

    PointerEvent.prototype.debugString = function() {
      return "x:" + this.x + ",y:" + this.y + ",sample:" + this.sampling + ",done:" + this.done + ",increase:" + this.increase;
    };

    PointerEvent.prototype.deltaTo = function(p) {
      return {
        x: this.x - p.x,
        y: this.y - p.y
      };
    };

    PointerEvent.prototype.distanceTo = function(p, option) {
      var dX, dY;
      if (option == null) {
        option = {};
      }
      if (option.index) {
        dX = p.indexY - this.indexY;
        dY = p.indexY - this.indexY;
      } else {
        dX = p.x - this.x;
        dY = p.y - this.y;
      }
      return Math.sqrt(dX * dX + dY * dY);
    };

    PointerEvent.prototype.capture = function() {
      var base, base1;
      if (typeof (base = this.raw).preventDefault === "function") {
        base.preventDefault();
      }
      return typeof (base1 = this.raw).stopImmediatePropagation === "function" ? base1.stopImmediatePropagation() : void 0;
    };

    return PointerEvent;

  })();

  TriggerStack = (function() {
    function TriggerStack() {
      this.actions = [];
      this.continuousFloor = 300;
    }

    TriggerStack.prototype.clear = function(left) {
      if (left > 0) {
        return this.actions = this.actions.slice(-left);
      } else {
        return this.actions.length = 0;
      }
    };

    TriggerStack.prototype.feed = function(p) {
      var date;
      date = new Date;
      date.p = p;
      if (this.actions.length > 0 && !this.near(p, this.actions[this.actions.length - 1].p)) {
        this.clear();
      }
      return this.actions.push(date);
    };

    TriggerStack.prototype.near = function(p1, p2) {
      return p1.distanceTo(p2) < 20;
    };

    TriggerStack.prototype.consume = function() {
      var current, old, previous;
      if (this.actions.length > 3) {
        this.actions = this.actions.slice(-3);
      }
      while (this.actions.length < 3) {
        this.actions.unshift(0);
      }
      current = this.actions[2];
      previous = this.actions[1];
      old = this.actions[0];
      if (current - previous > this.continuousFloor) {
        return 1;
      } else if (previous - old > this.continuousFloor) {
        return 2;
      } else {
        return 3;
      }
    };

    return TriggerStack;

  })();

  ViewPortPointerController = (function(superClass) {
    extend(ViewPortPointerController, superClass);

    function ViewPortPointerController(buffer, viewPort) {
      var lastPointDate, pt;
      this.buffer = buffer;
      this.viewPort = viewPort;
      ViewPortPointerController.__super__.constructor.call(this);
      this.triggerStack = new TriggerStack();
      this.selectSession = this.buffer.selectSession;
      this.editor = this.buffer.editor;
      lastPointDate = null;
      pt = (function(_this) {
        return function(e) {
          var delta;
          if (e.which !== 1) {
            return;
          }
          if (_this.buffer.lockUserInput) {
            return;
          }
          if (!_this.buffer.interactive) {
            return;
          }
          if (lastPointDate == null) {
            lastPointDate = new Date();
          }
          delta = new Date() - lastPointDate;
          lastPointDate = new Date();
          e = new PointerEvent(e, delta);
          _this.data.currentX = e.x;
          _this.data.currentY = e.y;
          _this.viewPort.emit("hasInteraction", e);
          return _this.give("pointer", e);
        };
      })(this);
      this.viewPort.scrollable.addEventListener("mousedown", pt);
      this.viewPort.scrollable.addEventListener("mouseup", pt);
      this.viewPort.scrollable.addEventListener("mousemove", pt);
      this.setState("idle");
    }

    ViewPortPointerController.prototype.reset = function() {
      ViewPortPointerController.__super__.reset.call(this);
      return this.resetSelection();
    };

    ViewPortPointerController.prototype.resetSelection = function() {
      return this.selectSession.clear();
    };

    ViewPortPointerController.prototype.reform = function() {
      this.reset();
      return this.setState("idle");
    };

    ViewPortPointerController.prototype.atPanic = function() {
      Logger.error(this.panicError, this.panicState);
      this.reset();
      return this.setState("idle");
    };

    ViewPortPointerController.prototype.atIdle = function() {
      var base;
      if ((base = this.data).rev == null) {
        base.rev = 0;
      }
      this.data.dragging = false;
      return this.waitFor("pointer", function(p) {
        this.data.p = p;
        if (p.type === "mousedown") {
          this.data.rev += 1;
          return this.setState("initMousedown");
        } else if (p.type === "mousemove") {
          if (this.editor.platform.isMouseDown) {
            this.selectSession.selection.deactivate();
            return this.setState("initMousemove");
          } else {
            return this.setState("idle");
          }
        } else {
          this.resetSelection();
          return this.setState("idle");
        }
      });
    };

    ViewPortPointerController.prototype.atInitMousedown = function() {
      var el, p, ref, trigger;
      p = this.data.p;
      el = p.src;
      if (p.noTrigger()) {
        this.setState("idle");
        return;
      }
      if (p.canDrag()) {
        this.data.dragging = true;
      }
      if (!this.data.dragging) {
        while (el) {
          if (((ref = el.com) != null ? ref.trigger : void 0) && el.com.transactTrigger({
            via: "mouse"
          })) {
            p.capture();
            this.resetSelection();
            this.selectSession.clearDomSelection();
            this.viewPort.setCursorByClientPoint(p.x, p.y);
            this.selectSession.selection.collapseToCursor();
            this.selectSession.selection.activate();
            this.setState("idle");
            return;
          }
          el = el.parentElement;
        }
      }
      this.triggerStack.feed(p);
      trigger = this.triggerStack.consume();
      p.capture();
      if (trigger === 2) {
        this.setState("handleDoubleDown");
        return;
      } else if (trigger === 3) {
        this.setState("handleTrippleDown");
        return;
      }
      if (!p.shiftKey) {
        this.selectSession.clearDomSelection();
      } else {
        this.selectSession.selection.activate();
      }
      this.viewPort.setCursorByClientPoint(p.x, p.y);
      if (!p.shiftKey) {
        this.selectSession.selection.collapseToCursor();
      }
      this.selectSession.selection.activate();
      return this.setState("waitInitMouseup");
    };

    ViewPortPointerController.prototype.atWaitInitMouseup = function() {
      return this.waitFor("pointer", (function(_this) {
        return function(p) {
          _this.data.p = p;
          if (p.type === "mousemove") {
            return _this.setState("initMousemove");
          } else if (p.type === "mouseup") {
            return _this.setState("initMouseup");
          } else {
            _this.resetSelection();
            return _this.setState("idle");
          }
        };
      })(this));
    };

    ViewPortPointerController.prototype.atInitMousemove = function() {
      var p;
      p = this.data.p;
      this.viewPort.setCursorByClientPoint(p.x, p.y);
      if (this.data.dragging) {
        this.selectSession.selection.collapseToCursor();
        this.selectSession.selection.deactivate();
        this.selectSession.clearDomSelection();
      }
      return this.setState("waitInitMouseup");
    };

    ViewPortPointerController.prototype.atInitMouseup = function() {
      var p;
      p = this.data.p;
      if (p.noTrigger()) {
        this.setState("idle");
      }
      if (!this.buffer.isFocusing) {
        this.buffer.editor.bufferManager.focusAt(this.buffer);
      }
      if (this.data.dragging) {
        this.selectSession.selection.collapseToCursor();
      }
      if (this.selectSession.selection.isCollapsed()) {
        this.selectSession.selection.deactivate();
      }
      p.capture();
      return this.setState("idle");
    };

    ViewPortPointerController.prototype.atHandleDoubleDown = function() {
      if (this.selectSession.selection.isCollapsed() || !this.selectSession.isActive) {
        this.viewPort.setCursorByClientPoint(this.data.p.x, this.data.p.y);
        this.selectSession.selectCurrentWord();
        this.setState("consumeVoidMouseup");
      } else {
        this.setState("consumeVoidMouseup");
      }
      return this.previousDoubleRev = this.data.rev;
    };

    ViewPortPointerController.prototype.atHandleTrippleDown = function() {
      var pt;
      pt = this.data.previousTrippleRev;
      this.data.previousTrippleRev = this.data.rev;
      if (this.data.rev - 1 === pt && !this.data.multiTripple) {
        this.viewPort.setCursorByClientPoint(this.data.p.x, this.data.p.y);
        this.selectSession.selectCurrentWord();
        this.data.multiTripple = true;
      } else {
        this.viewPort.setCursorByClientPoint(this.data.p.x, this.data.p.y);
        this.selectSession.selectCurrentLine();
        this.data.multiTripple = false;
      }
      return this.setState("consumeVoidMouseup");
    };

    ViewPortPointerController.prototype.atConsumeVoidMouseup = function() {
      return this.waitFor("pointer", (function(_this) {
        return function(p) {
          if (p.type === "mouseup") {
            return _this.setState("idle");
          } else if (p.type === "mousemove") {
            return _this.setState("consumeVoidMouseup");
          } else {
            _this.resetSelection();
            return _this.setState("idle");
          }
        };
      })(this));
    };

    return ViewPortPointerController;

  })(Leaf.States);

  TimeFeed = (function() {
    function TimeFeed(controller) {
      this.controller = controller;
      this.feedInterval = 100;
    }

    TimeFeed.prototype.start = function(template) {
      if (this.isStart) {
        return;
      }
      this.template = template;
      this.isStart = true;
      this.lastDate = new Date();
      if (this.rev == null) {
        this.rev = 0;
      }
      return this.timer = setInterval((function(_this) {
        return function() {
          var delta, hp;
          if (!_this.isStart) {
            _this.stop();
            return;
          }
          delta = new Date() - _this.lastDate;
          hp = new PointerEvent({
            type: "hold",
            via: _this.template
          }, delta);
          hp.rev = _this.rev;
          _this.controller.give("pointer", hp);
          _this.lastDate = new Date();
          return _this.rev += 1;
        };
      })(this), this.feedInterval);
    };

    TimeFeed.prototype.stop = function() {
      this.isStart = false;
      return clearTimeout(this.timer);
    };

    return TimeFeed;

  })();

  PathTracer = (function() {
    function PathTracer() {
      this.path = [];
      this.__defineGetter__("length", (function(_this) {
        return function() {
          return _this.path.length;
        };
      })(this));
      this.__defineGetter__("duration", (function(_this) {
        return function() {
          return _this.last.date.getTime() - _this.first.date.getTime();
        };
      })(this));
      this.__defineGetter__("maxFinger", (function(_this) {
        return function() {
          var i, item, len, ref, sampling;
          sampling = 0;
          ref = _this.path;
          for (i = 0, len = ref.length; i < len; i++) {
            item = ref[i];
            if (item.sampling > sampling) {
              sampling = item.sampling;
            }
          }
          return sampling;
        };
      })(this));
      this.__defineGetter__("finalVector", (function(_this) {
        return function() {
          var x, y;
          x = _this.last.indexX - _this.first.indexX;
          y = _this.last.indexY - _this.first.indexY;
          return {
            x: x,
            y: y
          };
        };
      })(this));
      this.__defineGetter__("monotonicX", (function(_this) {
        return function() {
          var _diff, diff, i, index, item, len, prev, ref;
          diff = 0;
          ref = _this.path;
          for (index = i = 0, len = ref.length; i < len; index = ++i) {
            item = ref[index];
            prev = _this.path[index - 1];
            if (!prev) {
              continue;
            }
            _diff = item.indexX - diff.indexX;
            if (diff === 0) {
              diff = _diff;
            } else if (diff * _diff < 0) {
              return false;
            }
          }
          return true;
        };
      })(this));
      this.__defineGetter__("monotonicY", (function(_this) {
        return function() {
          var _diff, diff, i, index, item, len, prev, ref;
          diff = 0;
          ref = _this.path;
          for (index = i = 0, len = ref.length; i < len; index = ++i) {
            item = ref[index];
            prev = _this.path[index - 1];
            if (!prev) {
              continue;
            }
            _diff = item.indexY - diff.indexY;
            if (diff === 0) {
              diff = _diff;
            } else if (diff * _diff < 0) {
              return false;
            }
          }
          return true;
        };
      })(this));
      this.__defineGetter__("monotonic", (function(_this) {
        return function() {
          return _this.monoticX && _this.monoticY;
        };
      })(this));
      this.__defineGetter__("first", (function(_this) {
        return function() {
          return _this.path[0];
        };
      })(this));
      this.__defineGetter__("last", (function(_this) {
        return function() {
          return _this.path[_this.path.length - 1];
        };
      })(this));
    }

    PathTracer.prototype.push = function(p) {
      return this.path.push(p);
    };

    PathTracer.prototype.clear = function() {
      return this.path.length = 0;
    };

    return PathTracer;

  })();

  ViewPortTouchController = (function(superClass) {
    extend(ViewPortTouchController, superClass);

    function ViewPortTouchController(buffer, viewPort) {
      var lastPointDate, pt;
      this.buffer = buffer;
      this.viewPort = viewPort;
      ViewPortTouchController.__super__.constructor.call(this);
      this.editor = this.buffer.editor;
      this.pathTracer = new PathTracer();
      this.triggerStack = new TriggerStack();
      this.selectSession = this.buffer.selectSession;
      this.timeFeed = new TimeFeed(this);
      this.antiShakeDistance = 5;
      this.holdLimit = 800;
      this.maxSwipeDuration = 500;
      lastPointDate = null;
      pt = (function(_this) {
        return function(e) {
          var delta;
          if (_this.buffer.lockUserInput) {
            return;
          }
          if (!_this.buffer.interactive) {
            return;
          }
          if (lastPointDate == null) {
            lastPointDate = new Date();
          }
          delta = new Date() - lastPointDate;
          lastPointDate = new Date();
          e = new PointerEvent(e, delta);
          _this.data.currentX = e.x;
          _this.data.currentY = e.y;
          if (_this.data.touchSession) {
            if (_this.data.touchSession.maxSampling < e.sampling || !_this.data.touchSession.maxSampling) {
              _this.data.touchSession.maxSampling = e.sampling;
            }
            _this.data.touchSession.currentSampling = e.sampling;
          }
          _this.viewPort.emit("hasInteraction", e);
          return _this.give("pointer", e);
        };
      })(this);
      this.thumbControlSession = new ThumbControlSession(this.viewPort);
      this.viewPort.scrollable.addEventListener("touchstart", pt);
      this.viewPort.scrollable.addEventListener("touchend", pt);
      this.viewPort.scrollable.addEventListener("touchmove", pt);
      this.viewPort.scrollable.addEventListener("touchcancel", pt);
      this.setState("idle");
    }

    ViewPortTouchController.prototype.reform = function() {
      this.reset();
      return this.setState("idle");
    };

    ViewPortTouchController.prototype.atPanic = function() {
      this.reset();
      this.setState("idle");
      return Logger.error("ERROR " + this.panicState + " " + (this.panicError.toString()));
    };

    ViewPortTouchController.prototype.reset = function() {
      ViewPortTouchController.__super__.reset.call(this);
      this.thumbControlSession.reset();
      return this.resetSelection();
    };

    ViewPortTouchController.prototype.resetSelection = function() {
      return this.selectSession.clear();
    };

    ViewPortTouchController.prototype.handleTouchmove = function() {
      var antiShakeX, antiShakeY, deltaLimitLeft, deltaLimitTop, p, ref, sp;
      p = this.data.movePoint;
      sp = ((ref = p.touches) != null ? ref.length : void 0) || 0;
      if (this.data.touchSession.maxSampling > 1) {
        p.capture();
      }
      if (this.data.touchSession.maxSampling > 2) {
        return;
      }
      if (!sp || sp < 2) {
        return;
      }
      if (sp === 2 || true) {
        p.capture();
        deltaLimitTop = 1500;
        deltaLimitLeft = 220;
        antiShakeX = 20;
        antiShakeY = 40;
        if (p.isFingerClose()) {
          this.data.baseTwoHandPoint = null;
          this.viewPort.setCursorByClientPoint(p.pointAtX, p.pointAtY);
        } else if (p.isTwoHand() || true) {
          this.thumbControlSession.feed("point", p);
          return;
        } else {
          this.data.baseTwoHandPoint = null;
          this.viewPort.setCursorByClientPoint(p.x, p.y);
        }
        this.thumbControlSession.reset();
      } else if (sp === 3) {

      }
    };

    ViewPortTouchController.prototype.log = function(name, message, time) {
      if (time == null) {
        time = 3000;
      }
      if (typeof message === "undefined") {
        message = name;
        name = "Default";
      }
      if (typeof message === "undefined") {
        return;
      }
      return require("/app").site.editor.plugin("HintManager").hint(name, message, {
        persist: false,
        type: "warning",
        time: time
      });
    };

    ViewPortTouchController.prototype.atIdle = function() {
      var base;
      this.timeFeed.stop();
      if ((base = this.data).rev == null) {
        base.rev = 0;
      }
      this.pathTracer.clear();
      this.thumbControlSession.reset();
      return this.waitFor("pointer", (function(_this) {
        return function(p) {
          _this.data.p = p;
          _this.data.baseTwoHandPoint = null;
          if (p.type === "touchstart" && _this.handleSideTap(p)) {
            _this.setState("idle");
            return;
          }
          if (p.type === "touchstart") {
            _this.data.rev += 1;
            _this.data.holdTime = 0;
            _this.data.touchSession = {};
            return _this.setState("initTouchstart");
          } else {
            p.capture();
            return _this.setState("idle");
          }
        };
      })(this));
    };

    ViewPortTouchController.prototype.atInitTouchstart = function() {
      this.timeFeed.stop();
      this.timeFeed.start(this.data.p);
      return this.waitFor("pointer", (function(_this) {
        return function(p) {
          if (p.type === "hold") {
            _this.data.holdTime += p.delta;
            if (_this.data.holdTime > _this.holdLimit) {
              _this.data.holdTime = 0;
              return _this.setState("longPress");
            } else {
              return _this.setState("initTouchstart");
            }
          } else if (p.type === "touchmove") {
            if ((p.distanceTo(_this.data.p)) < _this.antiShakeDistance) {
              return _this.setState("initTouchstart");
            } else {
              _this.data.movePoint = p;
              _this.data.startPoint = _this.data.p;
              _this.pathTracer.clear();
              return _this.setState("initTouchmove");
            }
          } else if (p.type === "touchend") {
            if (p.done) {
              _this.data.startPoint = _this.data.p;
              _this.data.endPoint = p;
              return _this.setState("tap");
            } else {
              return _this.setState("initTouchstart");
            }
          } else if (p.type === "touchcancel") {
            if (p.done) {
              return _this.setState("idle");
            } else {
              return _this.setState("initTouchstart");
            }
          } else if (p.type === "touchstart") {
            if (!p.increase) {
              _this.data.p = p;
              return _this.setState("initTouchstart");
            } else {
              _this.data.startPoint = _this.data.p;
              _this.data.movePoint = p;
              return _this.setState("initTouchmove");
            }
          } else {
            return _this.setState("idle");
          }
        };
      })(this));
    };

    ViewPortTouchController.prototype.atInitTouchmove = function() {
      if (this.data.movePoint) {
        this.pathTracer.push(this.data.movePoint);
      }
      this.timeFeed.stop();
      if (this.data.movePoint) {
        this.timeFeed.start(this.data.movePoint);
      }
      this.handleTouchmove();
      return this.waitFor("pointer", (function(_this) {
        return function(p) {
          if (p.type === "touchmove" || (p.type === "touchstart" && p.increase)) {
            if (_this.data.touchSession.maxSampling > 1) {
              p.capture();
            }
            _this.data.movePoint = p;
            return _this.setState("initTouchmove");
          } else if (p.type === "touchcancel") {
            if (p.done) {
              return _this.setState("idle");
            } else {
              return _this.setState("idle");
            }
          } else if (p.type === "touchend") {
            if (p.done && _this.data.movePoint.distanceTo(_this.data.startPoint, {
              index: true
            }) < _this.antiShakeDistance) {
              _this.data.endPoint = p;
              return _this.setState("tap");
            } else if (p.done && _this.pathTracer.maxFinger === 1 && _this.pathTracer.length > 2 && _this.pathTracer.duration < _this.maxSwipeDuration) {
              _this.data.endPoint = p;
              return _this.setState("swipe");
            } else if (p.done) {
              return _this.setState("idle");
            } else {
              _this.data.movePoint = p;
              return _this.setState("initTouchmove");
            }
          } else if (p.type === "hold") {
            _this.data.movePoint = p;
            return _this.setState("initTouchmove");
          } else if (p.type === "touchstart") {
            _this.data.p = p;
            return _this.setState("initTouchstart");
          } else {
            return _this.setState("idle");
          }
        };
      })(this));
    };

    ViewPortTouchController.prototype.atTap = function() {
      var e, el, error, ref, ref1, ref2, ref3, trigger;
      el = this.data.startPoint.src;
      if (((ref = this.data.touchSession.maxSampling) !== 1 && ref !== 3) && this.data.touchSession.maxSampling) {
        this.setState("idle");
        return;
      }
      if ((ref1 = this.data.endPoint) != null) {
        ref1.capture();
      }
      if (this.data.touchSession.maxSampling === 3) {
        this.resetSelection();
        this.setState("idle");
        return;
      }
      this.triggerStack.feed(this.data.startPoint);
      trigger = this.triggerStack.consume();
      if (trigger === 1 && this.handleSideTap(this.data.startPoint)) {
        this.triggerStack.clear(0);
        this.setState("idle");
        return;
      }
      if (trigger === 1) {
        this.selectSession.selection.deactivate();
        this.viewPort.setCursorByClientPoint(this.data.startPoint.x, this.data.startPoint.y);
        return this.setState("idle");
      } else if (trigger === 2) {
        try {
          if (!this.data.startPoint.noTrigger()) {
            while (el && !(this.data.touchSession.maxSampling > 1)) {
              if ((ref2 = el.com) != null ? ref2.trigger : void 0) {
                Vibration.feedback();
                if (el.com.transactTrigger({
                  via: "tap"
                })) {
                  if ((ref3 = this.data.endPoint) != null) {
                    ref3.capture();
                  }
                  this.resetSelection();
                  this.setState("idle");
                  return;
                }
              }
              el = el.parentElement;
            }
          }
        } catch (error) {
          e = error;
          this.log("ERROR " + (e.toString()));
        }
        return this.setState("idle");
      } else if (trigger === 3) {
        this.triggerStack.clear(0);
        return this.setState("idle");
      }
    };

    ViewPortTouchController.prototype.atSwipe = function() {
      var e, error;
      this.minSwipeX = 100;
      this.minSwipeY = 100;
      try {
        if (this.pathTracer.finalVector.x > this.minSwipeX) {
          this.editor.inputMethod.emit("key", new KeyEvent({
            simulateName: "swipeRight"
          }));
        } else if (this.pathTracer.finalVector.x < -this.minSwipeX) {
          this.editor.inputMethod.emit("key", new KeyEvent({
            simulateName: "swipeLeft"
          }));
        }
        if (this.pathTracer.finalVector.y > this.minSwipeY) {
          this.editor.inputMethod.emit("key", new KeyEvent({
            simulateName: "swipeDown"
          }));
        } else if (this.pathTracer.finalVector.y < -this.minSwipeY) {
          this.editor.inputMethod.emit("key", new KeyEvent({
            simulateName: "swipeUp"
          }));
        }
      } catch (error) {
        e = error;
        this.log(Math.random(), "error " + (JSON.stringify(e.message)), 1000);
      }
      this.pathTracer.clear();
      return this.setState("idle");
    };

    ViewPortTouchController.prototype.atLongPress = function() {
      if (!this.selectSession.selection.isActive) {
        this.viewPort.setCursorByClientPoint(this.data.p.x, this.data.p.y);
        this.selectSession.selectCurrentWord();
      } else {
        this.selectSession.selection.deactivate();
      }
      Vibration.feedback();
      return this.setState("idle");
    };

    ViewPortTouchController.prototype.handleSideTap = function(p) {
      var e, error;
      if (this.clientWidth == null) {
        this.clientWidth = $(window).width();
      }
      if (this.sideTapLimit == null) {
        this.sideTapLimit = 30;
      }
      try {
        if (p.x < this.sideTapLimit) {
          this.editor.conduct("backward-char");
          return true;
        }
        if (p.x > this.clientWidth - this.sideTapLimit) {
          this.editor.conduct("forward-char");
          return true;
        }
      } catch (error) {
        e = error;
        Logger.error("error " + e.message + " " + e.name);
      }
      return false;
    };

    return ViewPortTouchController;

  })(Leaf.States);

  ThumbControlSession = (function(superClass) {
    extend(ThumbControlSession, superClass);

    function ThumbControlSession(viewPort) {
      this.viewPort = viewPort;
      ThumbControlSession.__super__.constructor.call(this);
      this.editor = this.viewPort.editor;
      this.stepX = 5;
      this.stepY = 10;
      this.xFloor = 4;
      this.yFloor = 12;
      this.offsetXScale = 1.7;
      this.offsetYScale = 2.2;
      this.offsetXAtiShake = 0;
      this.offsetYAtiShake = 0;
    }

    ThumbControlSession.prototype.reset = function() {
      ThumbControlSession.__super__.reset.call(this);
      return this.setState("waitFirstPoint");
    };

    ThumbControlSession.prototype.atWaitFirstPoint = function() {
      return this.consumeWhenAvailable("point", (function(_this) {
        return function(p) {
          _this.data.startPoint = p;
          _this.viewPort.setCursorByClientPoint(p.x, p.y);
          _this.lastPointDate = new Date();
          return _this.setState("waitMovePoint");
        };
      })(this));
    };

    ThumbControlSession.prototype.atWaitMovePoint = function() {
      return this.consumeWhenAvailable("point", (function(_this) {
        return function(p) {
          _this.distributeCommandByPoint(p);
          return _this.setState("waitMovePoint");
        };
      })(this));
    };

    ThumbControlSession.prototype.distributeCommandByPoint = function(p) {
      var dx, dy, fdx, fdy, fx, fy, px, py;
      dx = p.x - this.data.startPoint.x;
      dy = p.y - this.data.startPoint.y;
      if (dx >= 0) {
        fx = 1;
      } else {
        fx = -1;
      }
      if (dy >= 0) {
        fy = 1;
      } else {
        fy = -1;
      }
      fdx = (dx - this.offsetXAtiShake * fx) * this.offsetXScale;
      fdy = (dy - this.offsetYAtiShake * fy) * this.offsetYScale;
      if (fdx * fx > 0) {
        px = fdx + this.data.startPoint.x;
      } else {
        px = this.data.startPoint.x;
      }
      if (fdy * fy > 0) {
        py = fdy + this.data.startPoint.y;
      } else {
        py = this.data.startPoint.y;
      }
      if (px !== this.data.startPoint.x || py !== this.data.startPoint.y) {
        return this.viewPort.setCursorByClientPoint(px, py);
      }
    };

    ThumbControlSession.prototype.distributeCommandByPointVelocity = function(p) {
      var dT, dvx, dvy, dx, dy;
      if (!this.data.lastPoint) {
        this.data.lastPoint = this.data.startPoint;
        this.data.lastDate = this.data.lastPoint.date;
      }
      if (p.type === "hold") {
        p = this.data.lastPoint;
      }
      dT = Date.now() - this.data.lastDate.getTime();
      if (dT === 0) {
        return;
      }
      dx = (p.x + this.data.lastPoint.x) / 2 - this.data.startPoint.x;
      dy = (p.y + this.data.lastPoint.y) / 2 - this.data.startPoint.y;
      dvx = dx * dT / 1000;
      dvy = dy * dT / 1000;
      this.accumulateX(dvx);
      this.accumulateY(dvy);
      this.data.lastPoint = p;
      return this.data.lastDate = new Date;
    };

    ThumbControlSession.prototype.distributeCommandByPointAboluste = function() {
      var countX, countY, dx, dy;
      dx = p.x - this.data.startPoint.x;
      dy = p.y - this.data.startPoint.y;
      countX = Math.round(dx / this.stepX);
      countY = Math.round(dy / this.stepY);
      this.applyVerticle(countY);
      return this.applyHorizental(countX);
    };

    ThumbControlSession.prototype.accumulateX = function(value) {
      var base, results;
      if ((base = this.data).xValue == null) {
        base.xValue = 0;
      }
      this.data.xValue += value;
      while (this.data.xValue > this.xFloor) {
        this.data.xValue -= this.xFloor;
        this.right();
      }
      results = [];
      while (this.data.xValue < -this.xFloor) {
        this.data.xValue += this.xFloor;
        results.push(this.left());
      }
      return results;
    };

    ThumbControlSession.prototype.accumulateY = function(value) {
      var base, results;
      if ((base = this.data).yValue == null) {
        base.yValue = 0;
      }
      this.data.yValue += value;
      while (this.data.yValue > this.yFloor) {
        this.data.yValue -= this.yFloor;
        this.down();
      }
      results = [];
      while (this.data.yValue < -this.yFloor) {
        this.data.yValue += this.yFloor;
        results.push(this.up());
      }
      return results;
    };

    ThumbControlSession.prototype.applyVerticle = function(count) {
      var base, down, results;
      if ((base = this.data).currentVertical == null) {
        base.currentVertical = 0;
      }
      down = count - this.data.currentVertical;
      while (down > this.data.currentVertical) {
        this.down();
        this.data.currentVertical += 1;
      }
      results = [];
      while (down < this.data.currentVertical) {
        this.up();
        results.push(this.data.currentVertical -= 1);
      }
      return results;
    };

    ThumbControlSession.prototype.applyHorizental = function(count) {
      var base, results, right;
      if ((base = this.data).currentHorizental == null) {
        base.currentHorizental = 0;
      }
      right = count - this.data.currentHorizental;
      while (right > this.data.currentHorizental) {
        this.right();
        this.data.currentHorizental += 1;
      }
      results = [];
      while (right < this.data.currentHorizental) {
        this.left();
        results.push(this.data.currentHorizental -= 1);
      }
      return results;
    };

    ThumbControlSession.prototype.down = function() {
      return this.editor.conduct("downward-char");
    };

    ThumbControlSession.prototype.up = function() {
      return this.editor.conduct("upward-char");
    };

    ThumbControlSession.prototype.right = function() {
      return this.editor.conduct("forward-char");
    };

    ThumbControlSession.prototype.left = function() {
      return this.editor.conduct("backward-char");
    };

    return ThumbControlSession;

  })(Leaf.States);

  module.exports = ViewPort;

}).call(this);

}
GlobalContext.setModule("vincent/facility/viewPort.js",module,exec);
})();
})();
(function(){GlobalContext.require("index")})();
