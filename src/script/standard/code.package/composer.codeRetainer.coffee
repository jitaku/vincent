Composer = require "../helper/composerUtils"
PairedElementRetainer = Composer.PairedElementRetainer

class CodeRetainer extends PairedElementRetainer
    type:"Code"
    reg:/^(?: *```.*\n)(?:[^`]|(\\`))*``` *\n?$/
    # Allow ` without \
    reg:/^(?: *```.*\n)[\s\S]*?``` *\n?/
    fastRetain:(cs)->
        if cs.slice(0,3) is "```" and cs.slice(-4) is "```\n"
            return true
        return false
module.exports = CodeRetainer
