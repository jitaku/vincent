Decoration = require "/vincent/com/decoration"
decorations = []
Bold = Decoration.createRegExpMaintainer "Bold",/\*\*[^\s][^*`]*\*\*/g,["com-inline-important"],{
    parts:[
        {
            reg:/\*/g
            classes:["edit-decorator"]
        }
    ]
}
FakeTable = Decoration.createRegExpMaintainer "Bold",/(?:^|\n)\|.*/g,["com-inline-fake-table"]
Italic = Decoration.createRegExpMaintainer "Italic",/_[^\s*~`]*[^\s*~`\\]_/g,["com-inline-italic"],{
    parts:[
        {
            reg:/_/g
            classes:["com-inline-italic-underline","edit-decorator-hold"]
        }
        {
            reg:/^_/g
            classes:["com-inline-italic-underline-begin","edit-decorator"]
        }
        {
            reg:/_$/g
            classes:["com-inline-italic-underline-end","edit-decorator"]
        }
    ]
}
AstroItalic = Decoration.createRegExpMaintainer "AstroItalic",/(?=\*)\*[^*`\s][^`*\n]*\*(?!\*)/g,["com-inline-bold"],
    parts:[
        {
            reg:/\*/g
            classes:["edit-decorator"]
        }
    ]
Delete = Decoration.createRegExpMaintainer "Delete",/~~[^~]+~~/g,["com-inline-delete"]
DeleteEverything = Decoration.createRegExpMaintainer "DeleteEverything",/~~~(.|\n)+~~~/g,["com-inline-delete"]

#InlineCode = Decoration.createRegExpMaintainer "InlineCode",/`([^`\n\r]|\\`)*[^\\]`/g,["com-inline-code"],
#    parts:[
#        {
#            reg:/^`/g
#            classes:["com-inline-code-decorator"]
#        }
#        {
#            reg:/`$/g
#            classes:["com-inline-code-decorator"]
#        }
#    ]
#
#ThirdInlineCode = Decoration.createRegExpMaintainer "InlineCode",/```([^`\n\r]|\\`)*[^\\]```/g,["com-inline-code"]
#decorations.push InlineCode
#decorations.push ThirdInlineCode
#Defination = Decoration.createRegExpMaintainer "Defination",/[^:\n]*[^:\n\\]:(\n|$)/g,["com-inline-defination"]
#MetaText = Decoration.createRegExpMaintainer "MetaText",/\(([^\n\r]|\\`)*?[^\\]\)/g,["com-inline-meta-text"]
#decorations.push Defination
#decorations.push MetaText


#MultilineCode = Decoration.createRegExpMaintainer "MultilineCode",/\n```(.|\n)*?```/g,["com-multiline-code"],{backwardAssert:"\n"}
#decorations.push MultilineCode
#Header = Decoration.createRegExpMaintainer "Header",/^#{1,5} .*$/mg,["com-headline"]
#decorations.push Header

addClass = (classNames)->
    return (el)->
        for className in classNames
            el.classList.add className

MarkdownStandardMaintainer = new Decoration.PairDecorationMaintainer()
MarkdownStandardMaintainer.register "**","**",{classNames:["com-inline-important"]}
MarkdownStandardMaintainer.register "*","*",{classNames:["com-inline-bold"]}
MarkdownStandardMaintainer.register "~~","~~",{classNames:["com-inline-delete"]}
decorations.push MarkdownStandardMaintainer

#decorations.push Bold
decorations.push Italic
#decorations.push Delete
#decorations.push AstroItalic
#decorations.push DeleteEverything
#decorations.push FakeTable

module.exports = decorations
