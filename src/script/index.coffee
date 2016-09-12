if typeof global isnt "undefined"
    global.Leaf = require "/lib/leaf"
    COM = require("/vincent/com/index")
    global.$ = require "/lib/jquery.min"
    global.COM = COM
    if not global.Logger
        global.Logger = console
if typeof window isnt "undefined"
    window.Leaf = require "/lib/leaf"
    window.$ = require "/lib/jquery.min"
    COM = require("/vincent/com/index")
    window.COM = COM
    if not window.Logger
        window.Logger = console

Vincent = require("/vincent/index")
module.exports = {
    Vincent
    COM
}
