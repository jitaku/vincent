(function () {
    // Establish the root object, `window` in the browser, or `global` on the server.
    var root = this;
    // Create a reference to this
    var isNode = false;
    // Export the Underscore object for **CommonJS**, with backwards-compatibility
    // for the old `require()` API. If we're not in CommonJS, add `_` to the
    // global object.
    if (typeof module !== 'undefined' && module.exports) {
        var ef = function(){};
        global.window = {
            navigator:{}
            ,addEventListener:ef
            ,removeEventListener:ef
        }
        var v = VincentContext.require("/index")
        global.Leaf = VincentContext.require("/lib/leaf")
        module.exports = v;
        isNode = true;
    } else {
        var v = VincentContext.require("/index")
        window.Leaf = VincentContext.require("/lib/leaf")
        window.Vincent = v.Vincent
        window.COM = v.COM
    }
})();
