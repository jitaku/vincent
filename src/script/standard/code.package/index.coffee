module.exports = class CodePackage extends Vincent.Package
    name:"Code"
    Commands:require("./commands")
    Hotkeys:require("./hotkeys")
    Elements:[
        require("./element.code")
    ]
    Spells:[
        require("./spell.codeBlockHead")
        require("./spell.codeBlockTail")
        require("./spell.codeLine")
    ]
    Composers:[
        require("./composer.codeRetainer")
        require("./composer.richTextToCode")
    ]
