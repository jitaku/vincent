// Generated by CoffeeScript 1.10.0
(function() {
  var COMVisualBorder, COMVisualPosition;

  COMVisualPosition = (function() {
    function COMVisualPosition(option) {
      var pl, pr, ref, ref1;
      if (option == null) {
        option = {};
      }
      this.left = option.left || null;
      this.right = option.right || null;
      this.center = option.center || null;
      this.priority = "right";
      pl = ((ref = this.left) != null ? ref.priority : void 0) || 0;
      pr = ((ref1 = this.right) != null ? ref1.priority : void 0) || 0;
      if (pl > pr) {
        this.priority = "left";
      }
      return;
    }

    return COMVisualPosition;

  })();

  COMVisualBorder = (function() {
    function COMVisualBorder(option) {
      this.node = option.node || null;
      this.offset = option.offset || 0;
      this.position = option.position;
      this.priority = option.priority || 0;
      return;
    }

    COMVisualBorder.prototype.isElementBoundary = function() {
      return this.node && this.node.nodeType !== this.node.TEXT_NODE;
    };

    return COMVisualBorder;

  })();

  COMVisualPosition.COMVisualBorder = COMVisualBorder;

  module.exports = COMVisualPosition;

}).call(this);
