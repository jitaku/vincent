COMPolicy = require "./policy"
class COMDecorationPolicy extends COMPolicy
    constructor:(@node)->
        super @node

    # possible value
    # default -> accept the decoration even it's partially nested into the current text
    # singular -> can only be completely include by a decoration
    #            (decoration inside should be maintained by it self not by RichText)
    # break -> consider this part to be a breaker, no decoration should be include this one.
    behavior:"default"

module.exports = COMDecorationPolicy
