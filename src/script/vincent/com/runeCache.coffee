class COMRuneCache
    constructor:(@context)->
        @cid  = 0
        # make sure cid is fixed length
        # so Rune.contentString is fixed length
        # so I don't need to change anchor every time cid of a rune changes
        @cidWidth = 8 # support 10^(8 - 2) rune, that is million rune.
        @instances = {}
        @prefixMap = {}
        zeros = ""
        for index in [0...@cidWidth]
            @prefixMap[index] = zeros
            zeros += "0"
        @trashes = {}

    release:(rune)->
        if not @trashes[rune.cid]
            @trashes[rune.cid] = rune
    reuse:(rune)->
        delete @trashes[rune.cid]
        if not @instances[rune.cid]
            @instances[rune.cid] = rune
    gc:()->
        for prop,rune of @trashes
            delete @instances[rune.cid]
            delete @trashes[rune.cid]
    allocate:()->
        id = @cid++
        id = id.toString()
        append = @cidWidth - 2 - id.length
        id = @prefixMap[append] + id
        return id
    assign:(node)->
        if typeof node.cid isnt "number"
            node.cid = @allocate()
        @instances[node.cid] = node
        return node.cid
    cloneByCid:(cid)->
        if not @instances[cid]
            return null
        item = @instances[cid]
        return item.clone()
        # Dangerous? though it over!
module.exports = COMRuneCache
