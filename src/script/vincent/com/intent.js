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
