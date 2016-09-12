Popup = require "/view/base/popup"
LatexEditPopup = require "./view/latexEditPopup"
module.exports = [{
    name:"latex-edit-popup-apply"
    description:"Apply latex edit popup content to the target latex rune"
    handler:(editor)->
        if Popup.current instanceof LatexEditPopup
            Popup.current.onClickOk()
            return true
        return false
}]
