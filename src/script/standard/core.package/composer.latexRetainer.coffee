Composer = require "../helper/composerUtils"
PairedElementRetainer = Composer.PairedElementRetainer
module.exports = class LatexRetainer extends PairedElementRetainer
    type:"Latex"
    reg:/^(?:\$\$\s*\n)(?:.|\n)*\$\$ *\n?$/
