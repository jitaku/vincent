EventEmitter = (require "../common/events").EventEmitter
COMContext = require "../com/context"
class ContextManager extends EventEmitter
    constructor:(@editor)->
        super()
        @contexts = []
    setDefaultAttachmentManager:(@defaultAttachmentManager)->
    create:(option = {})->
        context = new COMContext()
        context.editor = @editor
        @contexts.push context
        # For web service I use a single attachment manager by @defaultAttachment
        # Manager.
        # For native client I use a file based attachment manager/
        context.attachments = option.attachments or @defaultAttachmentManager
        @emit "context/create",context
        return context
    destroy:(context)->
        @contexts = @contexts.filter (item)->item isnt context
        @emit "context/destroy",context
module.exports = ContextManager
