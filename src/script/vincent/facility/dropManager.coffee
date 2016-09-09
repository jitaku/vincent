class DropManager extends Leaf.EventEmitter
    constructor:(@editor)->
        super()
        @initEvent(document.body)
    initEvent:(target)->
        target.addEventListener "dragstart",(e)=>
            e.preventDefault()
        target.addEventListener "dragover",(e)=>
            e.preventDefault()
            transfer = e.dataTransfer
            if not transfer
                return
            if transfer.items.length > 0
                @emit "files",e,transfer.items.length
        target.addEventListener "dragleave",(e)=>
            @emit "leave"
        target.addEventListener "drop",(e)=>
            transfer = e.dataTransfer
            if not transfer
                return
            if not e.defaultPrevented
                for item in transfer.items or {}
                    type = item.type or ""
                    if type.indexOf("image/") is 0
                        blob = item.getAsFile()
                        if blob instanceof Blob
                            @emit "image",{
                                blob
                            }
                            Logger.debug "image",blob,"at drop"
            # prevent default anyway.
            # We don't accept any default drop behavior.
            e.preventDefault()
            e.stopImmediatePropagation()
            @emit "leave"
module.exports = DropManager
