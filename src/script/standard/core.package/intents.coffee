COMIntent = COM.COMIntent

class OpenIntent extends COMIntent
    name:"OpenIntent"
    constructor:(@context,uri,{})->
        super @context,"OpenIntent",{uri}
class GalleryIntent extends COMIntent
    name:"GalleryIntent"
    constructor:(@context,{srcs,offset})->
        super @context,"GalleryIntent",{srcs,offset}

class RenderIntent extends COMIntent
    name:"RenderIntent"
    constructor:(@context)->
        super @context,"RenderIntent"

module.exports = [OpenIntent,GalleryIntent,RenderIntent]
