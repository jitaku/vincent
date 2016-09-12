App.tm.use "package/latex/latexEditPopup"
FloatView = require "/view/base/floatView"
Debounce = require "/component/debounce"
MathJaxAdapter = require "/component/mathJaxAdapter"
class LatexEditPopup extends FloatView
    constructor:()->
        super App.templates.package.latex.latexEditPopup
        @shareFocus = true
        @renderDebounce = new Debounce({time:500},@renderLatex.bind(this))
        @UI.textarea.listenBy this,"change",()=>
            @renderDebounce.trigger()
        @mask$.css {
            backgroundColor:"rgba(0,0,0,.3)"
        }
    renderLatex:(latex)->
        latex ?= @UI.textarea.value?.trim()
        latex = latex or "\\rm\\LaTeX"
        if @cache is latex
            return
        @cache = latex
        @VM.rendering = true
        @UI.renderer.innerHTML = ""
        @UI.renderer.textContent = "$#{latex}$"
        new MathJaxAdapter().render @UI.renderer,()=>
            @VM.rendering = false
    onClickCancel:()->
        @hide()
    onClickOk:()->
        @done(null,@UI.textarea.value)
        @hide()
    done:(args...)->
        callback  = @callback
        @callback = null
        callback? args...
    show:()->
        super()
        @UI.textarea.focus()
    edit:(content,callback = ()->)->
        @show()
        @UI.textarea.value = content?.trim() or ""
        @renderLatex(content?.trim())
        @callback = callback
    hide:()->
        @UI.textarea.blur()
        @done(new Error("Abort"))
        super()


module.exports = LatexEditPopup
