compressMap = {
    "children":"$c"
    "contentString":"$s"
    "type":"$t"
    "spell":"$p"
    "state":"$t"
    "doneAt":"$a"
}
reverseMap = {
}
for prop,value of compressMap
    reverseMap[value] = prop
exports._compress = (obj)->
    if obj instanceof Array
        return obj.map @_compress.bind(this)
    if typeof obj is "object"
        result = {}
        for prop,value of obj
            if value instanceof Array and value.length is 0
                # skip empty array
                continue
            if compressMap[prop]
                result[compressMap[prop]] = @_compress value
            else
                result[prop] = @_compress value
        return result
    return obj
exports.compress = (obj)->
    result = @_compress obj
    result.$v = 0
    return result
exports.extract = (obj)->
    if obj.$v isnt 0
        return obj
    return @_extract(obj)
exports._extract = (obj)->
    if obj instanceof Array
        return obj.map @_extract.bind(this)
    if typeof obj is "object"
        result = {}
        for prop,value of obj
            if prop[0] is "$"
                result[reverseMap[prop]] = @_extract value
            else
                result[prop] = @_extract value
        return result
    return obj
