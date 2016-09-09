class COMComposer
    type:"VoidComposer"
    compose:(target)->
        if not target.root
            return false
        @context = target.context
        @target = target
        # Use composer buffer to save hint.
        # If hint match then we may not need to recompose it.
        @cache = target.composerBuffer
        result = @exec?() or false
        return result
module.exports = COMComposer
