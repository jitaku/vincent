EventEmitter = (require "../common/events").EventEmitter
class DocumentFocus extends EventEmitter
    constructor:(@name)->
        super()
        @usedBy = []
    isAvailable:()->
        return @usedBy.length is 0
    obtain:(who)->
        length = @usedBy.length
        if who not in @usedBy
            @usedBy.push who
        if length is 0
            @emit "change"
    release:(who)->
        length = @usedBy.length
        @usedBy = @usedBy.filter (item)->item isnt who
        if @usedBy.length is 0 and length isnt 0
            @emit "change"
class FocusManager extends EventEmitter
    constructor:(@editor)->
        @inputFocus = new DocumentFocus("input")
        @bufferFocus = new DocumentFocus("buffer")
        @editorFocus = new DocumentFocus("editor")
        focuses = [@inputFocus,@bufferFocus,@editorFocus]
        for item in focuses
            item.listenBy this,"change",()=>
                @apply()
        #@debug()
    debug:()->
        Logger.debug "focus input:#{@inputFocus.isAvailable()},buffer:#{@bufferFocus.isAvailable()},editor:#{@editorFocus.isAvailable()},"
    apply:()->
        #@debug()
        if not @editorFocus.isAvailable()
            @disableAll()
        else if not @bufferFocus.isAvailable()
            @toEditorLevel()
        else if not @inputFocus.isAvailable()
            @toBufferLevel()
        else
            @allowAll()
    allowAll:()->
        @editor.inputMethod.obtainDocumentFocus()
        @editor.inputMethod.activate()
        @editor.domSelection.enable()
        @editor.clipboard.enable()
        @editor.activate()
        @editor.hotkeys.enableAll()
        @level = "all"
    toBufferLevel:()->
        @editor.inputMethod.releaseDocumentFocus()
        @editor.inputMethod.activate()
        @editor.domSelection.enable()
        @editor.clipboard.enable()
        @editor.activate()
        @editor.hotkeys.enableAll()
        @editor.hotkeys.disableInput()
        @level = "buffer"
    toEditorLevel:()->
        @editor.inputMethod.releaseDocumentFocus()
        @editor.inputMethod.activate()
        @editor.clipboard.disable()
        @editor.activate()
        @editor.domSelection.disable()
        @editor.hotkeys.enableAll()
        @editor.hotkeys.disableInput()
        @editor.hotkeys.disableBuffer()
        @level = "editor"
    disableAll:()->
        @editor.inputMethod.deactivate()
        @editor.clipboard.disable()
        @editor.domSelection.disable()
        @editor.hotkeys.disableInput()
        @editor.hotkeys.disableBuffer()
        @editor.hotkeys.disableEditor()
        @level = "none"
DocumentFocus.FocusManager = FocusManager
module.exports = DocumentFocus
