window.onload = ()->
    VC = VincentContext
    Buffer = VC.require("/vincent/facility/buffer")
    Editor = VC.require("/vincent/editor")
    packages = [
        VC.require("/standard/editor.package/index")
    ]
    window.editor = new Editor(document.body)
    for pack in packages
        editor.plugins.register pack
    editor.init()
    context = editor.contextManager.create()
    buffer = editor.bufferManager.allocate(context)
    document.body.appendChild buffer.node
    buffer.activate()
    buffer.setContentString("")
    editor.nextRender ()=>
        editor.bufferManager.focusAt(buffer)
