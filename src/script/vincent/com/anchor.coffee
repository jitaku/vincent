# Anchor describe a position in the content.
# This file is only indended for subclass and instance check
# See RichTextAnchor for real anchor implementation
EventEmitter = (require "./events").EventEmitter
class COMAnchor extends EventEmitter
    constructor:()->
        super()
module.exports = COMAnchor
