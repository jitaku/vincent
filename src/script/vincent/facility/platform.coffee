class Platform extends Leaf.EventEmitter
    @create = ()->
        @instance ?= new Platform()
        return @instance
    constructor:()->
        super()
        @init()
        if @isLinux()
            document.body?.classList.add "linux"
        if @isMac()
            document.body?.classList.add "mac"
        if @isIOS()
            document.body?.classList.add "ios"
        if @isWindows()
            document.body?.classList.add "windows"
        if not @isMobile()
            window.addEventListener "mousedown",(e)=>
                @isMouseDown = true
                @lastMousePoint = e
                @lastMouseDownDate = new Date
                return
            ,true
            window.addEventListener "mouseup",()=>
                @isMouseDown = false
                return
            ,true
            window.addEventListener "keydown",(e)=>
                if e.which is 16
                    @isShiftDown = true
                return
            ,true
            window.addEventListener "keyup",(e)=>
                if e.which is 16
                    @isShiftDown = false
                return
            ,true
        @device = new Device()
        @deviceDetail = @device.init()
        Logger.debug "Platform",@deviceDetail.os?.name,@deviceDetail.browser?.name
    isWindows:()->
        if not navigator?
            return false
        return navigator.platform.indexOf('Win') > -1
    isSmall:()->
        if not window?
            return false
        if @isSmallCheck
            return @_isSmall
        @isSmallCheck = true
        if window.screen.width < 500
            @_isSmall = true
            return true
        @_isSmall = false
        return false
    isMeduim:()->
        if not window?
            return false
        if @isMediumCheck
            return @_isMedium
        @isMediumCheck = true
        if window.screen.width >= 500 and window.screen.width < 1025
            @_isMedium = true
            return true
        @_isMedium = false
        return false
    isMeduim:()->
        return not @isMeduim() and not @isSmall()
    isVirtualKeyboard:()->
        return @isMobile()
    hasKeyboard:()->
        return not @isTouch()
    isTouch:()->
        return @isMobile()
    isMobile:()->
        if not window?
            return false
        if @isMobileCheck
            return @_isMobile
        check = false
        # http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
        ua = navigator.userAgent or navigator.vendor or window.opera
        do (ua)=>
            if /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4)) or @isIOS()
                check = true
        @isMobileCheck = true
        @_isMobile = check
        return check;
    isNative:()->
        return false
    isLinux:()->
        if not window?
            return false
        return window.navigator.platform?.toLowerCase()?.indexOf("linux") >= 0
    isMac:()->
        if not window?
            return false
        return window.navigator.platform?.toLowerCase()?.indexOf("mac") >= 0
    isIOS:()->
        if not window?
            return false
        return window.navigator?.userAgent?.match(/iPhone|iPad|iPod/i)
    isSafari:()->
        is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
        is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
        is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
        is_safari = navigator.userAgent.indexOf("Safari") > -1;
        is_opera = navigator.userAgent.toLowerCase().indexOf("op") > -1;
        if not is_chrome and is_safari or @isIOS()
            return true
        return false
    isAndroid:()->
        if not window?
            return false
        return window.navigator?.userAgent?.match(/Android/i)
    isVisible:()->
        if typeof document.hidden isnt "undefined"
            # Opera 12.10 and Firefox 18 and later support
            hidden = "hidden"
            visibilityChange = "visibilitychange"
        else if typeof document.mozHidden isnt "undefined"
            hidden = "mozHidden"
            visibilityChange = "mozvisibilitychange"
        else if typeof document.msHidden isnt "undefined"
            hidden = "msHidden"
            visibilityChange = "msvisibilitychange"
        else if typeof document.webkitHidden isnt "undefined"
            hidden = "webkitHidden"
            visibilityChange = "webkitvisibilitychange"
        return not document[hidden]
    isEmbeded:()->
        if not window?
            return false
        return window.top isnt window
    emitEmbedEvent:(name,args...)->
        if not @isEmbeded()
            return false
        message = {
            type:"event"
            name:name
            args:args
            source:"embed"
        }
        window.top.postMessage JSON.stringify(message),"*"
    init:()->
        if not window?
            return
    getDeviceDescription:()->
        return "#{@deviceDetail.os.name} #{@deviceDetail.browser.name}"
module.exports = Platform


class Device
    options: [],
    header: [navigator.platform, navigator.userAgent, navigator.appVersion, navigator.vendor, window.opera],
    dataos: [
        { name: 'Windows Phone', value: 'Windows Phone', version: 'OS' },
        { name: 'Windows', value: 'Win', version: 'NT' },
        { name: 'iPhone', value: 'iPhone', version: 'OS' },
        { name: 'iPad', value: 'iPad', version: 'OS' },
        { name: 'Kindle', value: 'Silk', version: 'Silk' },
        { name: 'Android', value: 'Android', version: 'Android' },
        { name: 'PlayBook', value: 'PlayBook', version: 'OS' },
        { name: 'BlackBerry', value: 'BlackBerry', version: '/' },
        { name: 'Macintosh', value: 'Mac', version: 'OS X' },
        { name: 'Linux', value: 'Linux', version: 'rv' },
        { name: 'Palm', value: 'Palm', version: 'PalmOS' }
    ],
    databrowser: [
        { name: 'Chrome', value: 'Chrome', version: 'Chrome' },
        { name: 'Firefox', value: 'Firefox', version: 'Firefox' },
        { name: 'Safari', value: 'Safari', version: 'Version' },
        { name: 'Internet Explorer', value: 'MSIE', version: 'MSIE' },
        { name: 'Opera', value: 'Opera', version: 'Opera' },
        { name: 'BlackBerry', value: 'CLDC', version: 'CLDC' },
        { name: 'Mozilla', value: 'Mozilla', version: 'Mozilla' }
    ],
    init: ()->
        agent = @header.join(' ')
        os = @matchItem(agent, @dataos)
        browser = @matchItem(agent, @databrowser)
        return { os: os, browser: browser }
    matchItem: (string, data)->
        i = 0
        j = 0
        html = ""
        for i in [0...data.length]
            regex = new RegExp(data[i].value, 'i');
            match = regex.test(string);
            if match
                regexv = new RegExp(data[i].version + '[- /:;]([\\d._]+)', 'i');
                matches = string.match(regexv);
                version = '';
                if matches and matches[1]
                    matches = matches[1]
                if matches
                    matches = matches.split(/[._]+/);
                    for j in [0...matches.length]
                        if j is 0
                            version += matches[j] + '.'
                        else
                            version += matches[j]
                else
                    version = '0'
                return {
                    name: data[i].name
                    version: parseFloat(version)
                }
        return {
            name: 'unknown'
            version: 0
        }
