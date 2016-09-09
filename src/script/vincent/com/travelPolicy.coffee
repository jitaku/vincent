COMPolicy = require "./policy"
class COMTravelPolicy extends COMPolicy
    constructor:(@node)->
        super(@node)
    write:"ignore"
    forwardChar:"ignore"
    backwardChar:"ignore"
    deleteChar:"ignore"
    upwardChar:"ignore"
    downwardChar:"ignore"
    head:"ignore"
    tail:"ignore"

    # possible value
    # ignore -> just ignore
    # handover -> give the action to previous/next of the line
    # boundary -> just stop at boundary
    startOfLine:"ignore"
    endOfLine:"ignore"

    # possible value for [forward/backward]Bypassed
    # handover -> give the command to previous/next element
    # bypass -> only point to the beginning/end of the next element but don't move
    # ignore -> just do nothing
    forwardBypassed:"ignore"
    backwardBypassed:"ignore"

    # possible value
    # handover -> back to previous elem and delete a char
    # bypass -> back to previous elem but not delete a char
    # merge -> try to merge the current content with prev item
    # ignore -> just do nothing
    # When merge the current node.toString() is called
    # and the mergeText is called with the current node.
    # We always assume before.mergeContentString(after)
    deleteBypassed:"ignore"

    # posible value for tail booundary
    # ignore -> just do nothing
    # hold -> when at boundary it still belongs to current element
    # pass -> move the cursor the next el if has any
    tailBoundary:"ignore"
module.exports = COMTravelPolicy
