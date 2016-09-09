COMPolicy = require "./policy"
class COMTrapPolicy extends COMPolicy
    constructor:(@node)->
        super @node
    # Should this element get trapped
    # ignore -> not trapped
    # enable -> will be trapped
    trap:"ignore"
    # available value
    # ignore -> don't trap out #Not implemented
    # inherit -> use the travel policy #Not implemented
    # bypass -> overwrite the travel policy to bypass # Current behavior
    # handover -> overwrite the travel policy to handover #Not implemented
    trapOut:"ignore"
    # same as trapOut but from outside to inside.
    trapIn:"ignore"
    behave:(behavior)->
        for prop of behavior
            if behavior.hasOwnProperty prop
                @[prop] = behavior[prop]
        return this
module.exports = COMTrapPolicy
