class COMPolicy
    constructor:(@node)->
    behave:(behavior)->
        for prop of behavior
            if behavior.hasOwnProperty prop
                @[prop] = behavior[prop]
        return this

module.exports = COMPolicy
