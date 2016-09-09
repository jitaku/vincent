COMContext = require "./context"
COMContainer = require "./container"
COMRichText = require "./richText"
class COMElement extends COMContainer
    type:"VoidElement"
    constructor:(@context,@data)->
        super(@context,@data)
module.exports = COMElement
