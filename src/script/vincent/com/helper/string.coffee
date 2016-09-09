module.exports = {
    ignorePhaseTypes:[]
    ignoreChar:[" "]
    findJumpBreakForward:(string,index)->
        return @findJumpBreak string,index,1,0
    findJumpBreakBackward:(string,index)->
        return @findJumpBreak string,index,-1,-1
    findJumpBreak:(string,index,step,fix)->
        phase = 0
        type = null
        index += fix
        phase2Type = null
        if step < 0
            regret = 1
        else
            regret = 0
        while index < string.length and index >= 0
            char = string[index]
            type = @detectCharType char
            if phase is 0
                if type in @ignorePhaseTypes or char in @ignoreChar
                    index += step
                    continue
                else
                    phase = 1
            if phase is 1
                if type is phase2Type or not phase2Type
                    index += step
                    phase2Type = type
                    continue
                index += regret
                break
        if index < 0
            return 0
        if index > string.length
            return string.length
        return index
    detectCharType:(char)->
        if /\s/.test char
            return "space"
        else if /[`\*~\s\.";\[\]\{\}:<>,\\\/\?`~!@#\$%\^&\(\)\|]/.test char
            return "delimeter"
        else if /[a-z_]/i.test char
            return "alphabet"
        else
            return "other"
}
