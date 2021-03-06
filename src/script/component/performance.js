// Generated by CoffeeScript 1.10.0
(function() {
  var Performance;

  Performance = (function() {
    Performance.anonymouseIndex = 0;

    Performance.perf = function(name, fn) {
      var perf;
      perf = new Performance();
      perf.start(name);
      fn(perf);
      perf.end(name);
      return perf.reportAll();
    };

    function Performance() {
      this.cache = {};
    }

    Performance.prototype.silent = function(isSilent) {
      this.isSilent = isSilent;
    };

    Performance.prototype.time = function(name) {
      var ref;
      return ((ref = this.cache[name]) != null ? ref.total : void 0) || 0;
    };

    Performance.prototype.start = function(name) {
      var item;
      if (!(item = this.cache[name])) {
        item = this.cache[name] = {
          total: 0
        };
      }
      return this.cache[name].start = performance.now();
    };

    Performance.prototype.end = function(name) {
      var d, item;
      if (!(item = this.cache[name])) {
        return;
      }
      if (!item.start) {
        return;
      }
      d = performance.now() - item.start;
      item.start = null;
      return item.total += d;
    };

    Performance.prototype.clear = function(name) {
      delete this.cache[name];
      if (!name) {
        return this.cache = {};
      }
    };

    Performance.prototype.report = function(name) {
      var ref;
      if (this.isSilent) {
        return;
      }
      return Logger.debug(name + ":" + (((ref = this.cache[name]) != null ? ref.total : void 0) || "unset") + "ms");
    };

    Performance.prototype.reportAll = function() {
      var prop, results;
      if (this.isSilent) {
        return;
      }
      results = [];
      for (prop in this.cache) {
        results.push(this.report(prop));
      }
      return results;
    };

    return Performance;

  })();

  module.exports = Performance;

  window.Perf = Performance;

}).call(this);
