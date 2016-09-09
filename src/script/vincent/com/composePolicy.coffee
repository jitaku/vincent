COMPolicy = require "./policy"
class COMComposePolicy extends COMPolicy
    constructor:(@node)->
        super(@node)
    # To retain, the first char of the node
    # , or the last char of the previous node should be \n
    # , or not previous node
    newlineSplitHead: false
    # To retain, the last char of the node
    # , or the first char of the next node should be \n
    # , or no previous node
    newlineSplitTail: false
    # Should headed with \n in content
    tailingNewline: false
    # Should tailed with \n in content
    headingNewline: false
    # Allow borrow \n from other adjacent nodes
    borrows: false
    # Allow to lend \n to adjacent nodes.
    lend: false
module.exports = COMComposePolicy
