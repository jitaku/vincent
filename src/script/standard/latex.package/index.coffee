MathJaxAdapter = require "/component/mathJaxAdapter"
latexKeywords = require "./lib/latexKeywords"
Code = require "../code.package/element.code"
module.exports = class LatexPackage extends Vincent.Package
    name:"Latex"
    Elements:[
        require("./element.latex")
        require("./element.latexCode")
    ]
    Runes:[
        require("./rune.latexRune")
    ]
    Commands:require("./commands")
    Hotkeys:require("./hotkeys")
    Spells:[
        require("./spell.latexBlockHead")
        require("./spell.latexBlockTail")
        require("./spell.latexSpell")
    ]
    Composers:[
        require("./composer.latexRetainer")
        require("./composer.richTextToLatex")
    ]
    requires:["AutoCompleter","RuneTyper","Code","CodeEnhancement","RuneEntryMenu"]
    constructor:()->
        @adapter = new MathJaxAdapter
    onContextCreate:(context)->
        context.facilities.latex = this
    renderTexElement:(el,callback = ->)->
        @adapter.render el,callback
    init:(@editor,@deps)->
        super @editor,@deps
        @deps.RuneEntryMenu.register this,{
            name:"Latex"
            description:"You can also type @latex or $$Math$$ to insert a math block"
            icon:"fa-superscript"
        },(buffer,context)=>
            context.transact ()=>
                latex = context.createElement "LatexRune",{text:""}
                buffer.cursor.target.insertRune buffer.cursor.anchor.index,latex
                latex.trigger()
        @deps.RuneTyper.register {
            content:"@latex"
            type:"rune"
            description:"Add some Math or {$0}"
            descriptionRunes:[{
                type:"LatexRune"
                latex:"\\rm\\LaTeX"
            }]
            create:()=>
                rune = @editor.context.createElement "LatexRune",({latex:""})
                return rune
            postAction:(rune)->
                rune.edit()
                return
        }
        @deps.RuneTyper.register {
            content:"$$latex$$"
            type:"rune"
            description:"Add some Math or {$0}"
            descriptionRunes:[{
                type:"LatexRune"
                latex:"\\rm\\LaTeX"
            }]
            create:()=>
                rune = @editor.context.createElement "LatexRune",({latex:""})
                return rune
            postAction:(rune)->
                rune.edit()
                return
        }
        Code.registerLanguageHighlight "latex",@deps.CodeEnhancement.prepare [{
            type:"math"
            name:"builtin"
            source:"(?:"+ latexKeywords.map((item)->"\\\\"+item).join("|")+")"
        },{
            type:"math"
            name:"symbol"
            source:"[\\^_~&]"
        },{
            type:"math"
            name:"symbol"
            source:"\\\\\\\\"
        }]
