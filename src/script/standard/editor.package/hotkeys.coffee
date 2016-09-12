hotkeys = []

addKey = (keyString,handler)->
    hotkeys.push [keyString,handler]

addKey "input:tab","indent-normal-line"
addKey "input:<shift> tab","backindent-normal-line"
addKey "input:swipeRight","indent-normal-line"
addKey "input:swipeLeft","backindent-normal-line"

addKey "buffer:right","forward-char"
addKey "buffer:left","backward-char"
addKey "buffer:right","selection-collapse-to-end"
addKey "buffer:left","selection-collapse-to-begin"
addKey "buffer:escape","selection-collapse-to-end"
addKey "buffer:<mod> enter","selection-collapse-to-end"

addKey "editor:<shift> enter","write-newline"

addKey "buffer:up","upward-char"
addKey "buffer:down","downward-char"
addKey "buffer:backspace","delete-char"
addKey "buffer:<mod><shift>backspace","delete-line-before-cursor"
addKey "buffer:backspace","delete-selection"
addKey "buffer:del","delete-current-char"
addKey "buffer:del","delete-selection"
addKey "buffer:<mod> del","delete-current-word"


addKey "<ctrl> l","forward-char"
addKey "<ctrl> j","backward-char"
addKey "<ctrl> l","selection-collapse-to-end"
addKey "<ctrl> j","selection-collapse-to-begin"
addKey "<ctrl> i","upward-char"
addKey "<ctrl> k","downward-char"

addKey "<ctrl><shift> l","selective-forward-char"
addKey "<ctrl><shift> j","selective-backward-char"
addKey "<ctrl><shift> i","selective-upward-char"
addKey "<ctrl><shift> k","selective-downward-char"

addKey "buffer:pageup","previous-page"
addKey "buffer:pagedown","next-page"
addKey "buffer:<ctrl> home","go-top"
addKey "buffer:<ctrl> end","go-bottom"
addKey "buffer:<mod> backspace","delete-word"
addKey "buffer:enter","trigger"
addKey "buffer:<mod><alt> enter","force-trigger"
addKey {
    osx:"buffer:<alt> right"
    default:"buffer:<ctrl> right"
},"forward-word"
addKey {
    osx:"buffer:<alt> left"
    default:"buffer:<ctrl> left"
},"backward-word"
addKey "buffer:<shift> right","selective-forward-char"
addKey "buffer:<shift> left","selective-backward-char"
addKey "buffer:<shift> up","selective-upward-char"
addKey "buffer:<shift> down","selective-downward-char"

addKey "buffer:<shift> pageup","selective-previous-page"
addKey "buffer:<shift> pagedown","selective-next-page"
addKey "buffer:<shift><ctrl> home","selective-go-top"
addKey "buffer:<shift><ctrl> end","selective-go-bottom"

addKey "buffer:end","end-of-line"
addKey "buffer:home","start-of-line"
addKey "buffer:end","end-of-spell"
addKey "buffer:home","start-of-spell"
addKey "buffer:<shift> end","selective-end-of-line"
addKey "buffer:<shift> home","selective-start-of-line"
addKey "buffer:<shift> end","selective-end-of-spell"
addKey "buffer:<shift> home","selective-start-of-spell"
addKey {
    osx:"buffer:<alt><shift> right"
    default:"buffer:<ctrl><shift> right"
},"selective-forward-word"
addKey {
    osx:"buffer:<alt><shift> left"
    default:"buffer:<ctrl><shift> left"
},"selective-backward-word"

addKey "buffer:<mod> a","select-all"
addKey "buffer:<mod> z","undo"
addKey "buffer:<mod> y","redo"

# debug
# addKey "<mod> s","push-history"

addKey "buffer:space","trigger-rune"
addKey "buffer:<mod> up","previous-rune"
addKey "buffer:<mod> down","next-rune"


addKey {osx:"buffer:<ctrl> f"},"forward-char"
addKey {osx:"buffer:<ctrl> b"},"backward-char"
addKey {osx:"buffer:<ctrl> p"},"upward-char"
addKey {osx:"buffer:<ctrl> n"},"downward-char"
addKey {osx:"buffer:<ctrl><shift> f"},"selective-forward-char"
addKey {osx:"buffer:<ctrl><shift> b"},"selective-backward-char"
addKey {osx:"buffer:<ctrl><shift> p"},"selective-upward-char"
addKey {osx:"buffer:<ctrl><shift> n"},"selective-downward-char"

addKey {osx:"buffer:<ctrl> a"},"start-of-line"
addKey {osx:"buffer:<ctrl> e"},"end-of-line"
addKey {osx:"buffer:<ctrl><shift> a"},"selective-start-of-line"
addKey {osx:"buffer:<ctrl><shift> e"},"selective-end-of-line"

module.exports = hotkeys
