// Generated by CoffeeScript 1.10.0
(function() {
  var COMFlattenLevel1, Clip, Clipboard, html2markdown,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  html2markdown = require("/component/html2markdown");

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
        return "jtk://" + (decodeURIComponent(path));
      } else {
        return "jtk:///" + username + "/" + (decodeURIComponent(path));
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
