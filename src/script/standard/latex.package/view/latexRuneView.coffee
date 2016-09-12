App.tm.use "package/latex/latexRuneView"
class LatexRuneView extends Leaf.Widget
    constructor:(@latexRune)->
        super App.templates.package.latex.latexRuneView
    render:()->
        content = @latexRune.latex or "\\rm\\LaTeX"
        if @cacheTex is content
            return
        @UI.renderer.textContent = "$#{content}$"
        @VM.rendering = true
        @latexRune.context.facilities.latex.renderTexElement @UI.renderer,()=>
            @VM.rendering = false
            @cacheTex = content
            @latexRune.context.castIntent "RenderIntent"

module.exports = LatexRuneView
