// Generated by CoffeeScript 1.10.0
(function() {
  var ListItem, commands, supportActionSelectionExpand;

  ListItem = require("./element.listItem");

  commands = [];

  commands.push({
    name: "indent-forward",
    description: "indent the region or line forward",
    handler: function(editor) {
      return editor.buffer.cursor.conduct("indentForward");
    }
  });

  commands.push({
    name: "indent-backward",
    description: "indent the region or line backward",
    handler: function(editor) {
      return editor.buffer.cursor.conduct("indentBackward");
    }
  });

  commands.push({
    name: "indent-region-forward",
    description: "indent the selected region",
    handler: function(editor) {
      var base, beginFix, beginIndex, beginLength, collection, cursor, endFix, endIndex, endLength, hasOne, i, item, len, ref, selection;
      selection = editor.buffer.selection;
      cursor = editor.buffer.cursor;
      if (!selection.isActive || selection.isCollapsed()) {
        return false;
      }
      collection = selection.getSelectedCollection();
      beginIndex = collection.beginAnchorOrigin.index;
      endIndex = collection.endAnchorOrigin.index;
      beginLength = collection.beginNode.length;
      endLength = collection.endNode.length;
      ref = collection.nodes;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        hasOne = true;
        if (typeof (base = item.commands).indentForward === "function") {
          base.indentForward();
        }
      }
      beginFix = collection.beginNode.length - beginLength;
      endFix = collection.endNode.length - endLength;
      collection.beginAnchorOrigin.index = beginIndex + beginFix;
      collection.endAnchorOrigin.index = endIndex + endFix;
      return hasOne;
    }
  });

  commands.push({
    name: "indent-region-backward",
    description: "indent the selected region",
    handler: function(editor) {
      var base, beginFix, beginIndex, beginLength, collection, cursor, endFix, endIndex, endLength, hasOne, i, item, len, ref, selection;
      selection = editor.buffer.selection;
      cursor = editor.buffer.cursor;
      if (!selection.isActive || selection.isCollapsed()) {
        return false;
      }
      collection = selection.getSelectedCollection();
      beginLength = collection.beginNode.length;
      endLength = collection.endNode.length;
      beginIndex = collection.beginAnchorOrigin.index;
      endIndex = collection.endAnchorOrigin.index;
      ref = collection.nodes;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        hasOne = true;
        if (typeof (base = item.commands).indentBackward === "function") {
          base.indentBackward();
        }
      }
      beginFix = collection.beginNode.length - beginLength;
      endFix = collection.endNode.length - endLength;
      collection.beginAnchorOrigin.index = beginIndex + beginFix;
      collection.endAnchorOrigin.index = endIndex + endFix;
      return hasOne;
    }
  });

  commands.push({
    name: "list-item-swap-up",
    context: true,
    description: "swap the current list item with the previous one if it is a way",
    handler: function(editor) {
      var context, cursor, previous, selection, target;
      context = editor.context;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      selection = editor.buffer.selection;
      if (selection.isActive && !selection.isCollapsed()) {
        return false;
      }
      if (!target || !target.sortOf("ListItem")) {
        return false;
      }
      previous = target.previous();
      if (!previous || !previous.sortOf("ListItem")) {
        return false;
      }
      previous.remove();
      target.after(previous);
      return true;
    }
  });

  commands.push({
    name: "list-item-swap-down",
    context: true,
    description: "swap the current list item with the previous one if it is a way",
    handler: function(editor) {
      var context, cursor, next, selection, target;
      context = editor.context;
      cursor = editor.buffer.cursor;
      selection = editor.buffer.selection;
      if (selection.isActive && !selection.isCollapsed()) {
        return false;
      }
      target = cursor.target;
      if (!target || !target.sortOf("ListItem")) {
        return false;
      }
      next = target.next();
      if (!next || !next.sortOf("ListItem")) {
        return false;
      }
      next.remove();
      target.before(next);
      return true;
    }
  });

  commands.push({
    name: "list-block-swap-up",
    context: true,
    description: "swap the current list item and it's children with the previsous one that has the same level or lower level then the current list",
    handler: function(editor) {
      var context, currentIndent, cursor, i, item, items, j, len, len1, next, previous, selection, target, toSwap;
      context = editor.context;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      selection = editor.buffer.selection;
      if (selection.isActive && !selection.isCollapsed()) {
        return false;
      }
      if (!target || !target.sortOf("ListItem")) {
        return false;
      }
      previous = target.previous();
      if (!previous || !previous.sortOf("ListItem")) {
        return false;
      }
      currentIndent = target.getIndentLevel();
      toSwap = null;
      while (previous) {
        if (!previous.sortOf("ListItem")) {
          break;
        }
        if (previous.getIndentLevel() > currentIndent) {
          previous = previous.previous();
          continue;
        }
        toSwap = previous;
        break;
      }
      if (!toSwap) {
        return false;
      }
      next = target.next();
      items = [];
      while (next) {
        if (!next) {
          break;
        }
        if (!next.sortOf("ListItem")) {
          break;
        }
        if (next.getIndentLevel() <= currentIndent) {
          break;
        }
        items.push(next);
        next = next.next();
      }
      for (i = 0, len = items.length; i < len; i++) {
        item = items[i];
        item.remove();
      }
      target.remove();
      toSwap.before(target);
      for (j = 0, len1 = items.length; j < len1; j++) {
        item = items[j];
        toSwap.before(item);
      }
      return true;
    }
  });

  commands.push({
    name: "list-block-swap-down",
    context: true,
    description: "swap the current list item and it's children with the previsous one that has the same level or lower level then the current list",
    handler: function(editor) {
      var context, currentIndent, cursor, i, item, items, j, len, next, selection, swapIndent, target, toSwap;
      context = editor.context;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      selection = editor.buffer.selection;
      if (selection.isActive && !selection.isCollapsed()) {
        return false;
      }
      if (!target || !target.sortOf("ListItem")) {
        return false;
      }
      next = target.next();
      if (!next || !next.sortOf("ListItem")) {
        return false;
      }
      currentIndent = target.getIndentLevel();
      toSwap = null;
      while (next) {
        if (!next.sortOf("ListItem")) {
          break;
        }
        if (next.getIndentLevel() > currentIndent) {
          next = next.next();
          continue;
        }
        toSwap = next;
        break;
      }
      if (!toSwap) {
        return false;
      }
      next = target.next();
      items = [];
      while (next) {
        if (!next) {
          break;
        }
        if (!next.sortOf("ListItem")) {
          break;
        }
        if (next.getIndentLevel() <= currentIndent) {
          break;
        }
        items.push(next);
        next = next.next();
      }
      for (i = 0, len = items.length; i < len; i++) {
        item = items[i];
        item.remove();
      }
      swapIndent = toSwap.getIndentLevel();
      if (swapIndent >= currentIndent) {
        while (next = toSwap.next()) {
          if (!next.sortOf("ListItem")) {
            break;
          }
          if (next.getIndentLevel() > swapIndent) {
            toSwap = next;
          } else {
            break;
          }
        }
      }
      target.remove();
      for (j = items.length - 1; j >= 0; j += -1) {
        item = items[j];
        toSwap.after(item);
      }
      toSwap.after(target);
      return true;
    }
  });

  commands.push({
    name: "list-item-collapse-or-goto-parent",
    context: true,
    description: "move caret to the parent of the current list item",
    handler: function(editor) {
      var context, current, cursor, parent, previous, ref, target;
      context = editor.context;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      current = target;
      if (!target || !target.sortOf("ListItem")) {
        return false;
      }
      while (true) {
        previous = target.previous();
        if (!previous || !previous.sortOf("ListItem")) {
          break;
        }
        if (previous.getIndentLevel() < current.getIndentLevel()) {
          target = previous;
          break;
        }
        target = previous;
      }
      editor.buffer.selection.deactivate();
      parent = target;
      if (((ref = current.next()) != null ? typeof ref.getIndentLevel === "function" ? ref.getIndentLevel() : void 0 : void 0) > current.getIndentLevel()) {
        editor.conduct("collapse-list-item");
        return true;
      }
      context.pointIdenticalCursorsAnchor(cursor, target.anchorAtBeginText());
      return true;
    }
  });

  supportActionSelectionExpand = true;

  commands.push({
    name: "list-region-swap-up",
    context: true,
    description: "swap the selected list region with the previous list if any",
    handler: function(editor) {
      var base, base1, base2, collection, cursor, previous, selection;
      selection = editor.buffer.selection;
      cursor = editor.buffer.cursor;
      if (!selection.isActive || selection.isCollapsed()) {
        return false;
      }
      collection = selection.getSelectedCollection();
      previous = collection.beginNode.previous();
      if ((previous != null ? previous.sortOf("ListItem") : void 0) && (collection != null ? collection.endNode.sortOf("ListItem") : void 0)) {
        if (supportActionSelectionExpand) {
          if (typeof (base = collection.beginAnchorOrigin).head === "function") {
            base.head();
          }
          if (typeof (base1 = collection.endAnchorOrigin).tail === "function") {
            base1.tail();
          }
          if (typeof (base2 = collection.endAnchorOrigin).backwardChar === "function") {
            base2.backwardChar();
          }
        }
        previous.remove();
        collection.endNode.after(previous);
        return true;
      }
    }
  });

  commands.push({
    name: "list-region-swap-down",
    context: true,
    description: "swap the selected list region with the previous list if any",
    handler: function(editor) {
      var base, base1, base2, collection, cursor, next, selection;
      selection = editor.buffer.selection;
      cursor = editor.buffer.cursor;
      if (!selection.isActive || selection.isCollapsed()) {
        return false;
      }
      collection = selection.getSelectedCollection();
      next = collection.endNode.next();
      if ((next != null ? next.sortOf("ListItem") : void 0) && (collection != null ? collection.beginNode.sortOf("ListItem") : void 0)) {
        if (supportActionSelectionExpand) {
          if (typeof (base = collection.beginAnchorOrigin).head === "function") {
            base.head();
          }
          if (typeof (base1 = collection.endAnchorOrigin).tail === "function") {
            base1.tail();
          }
          if (typeof (base2 = collection.endAnchorOrigin).backwardChar === "function") {
            base2.backwardChar();
          }
        }
        next.remove();
        collection.beginNode.before(next);
        return true;
      }
      return true;
    }
  });

  commands.push({
    name: "make-list-item",
    context: true,
    description: "make a new list item",
    handler: function(editor) {
      var after, char, content, cs, cursor, index, item, newLine, sub, target;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      if (target.mime !== "text/com-rich-text") {
        return false;
      }
      if (target && target.sortOf("ListItem")) {
        content = target.getHead();
      } else {
        content = "- ";
      }
      if (target.type === "RichText") {
        index = cursor.anchor.index;
        char = null;
        cs = cursor.target.contentString;
        while (index >= 0) {
          char = cs[index];
          if (char === "\n") {
            newLine = true;
            break;
          }
          index -= 1;
        }
        sub = cs.slice(index, cursor.anchor.index);
        if (/^\s*$/.test(sub) || (index === 0 && sub.length === 0)) {
          cursor.conduct("write", content);
        } else {
          cursor.conduct("write", "\n" + content);
        }
        return true;
      } else if (target.sortOf("ListItem")) {
        after = target.contentString.slice(cursor.anchor.index);
        target.removeText(cursor.anchor.index);
        target.insertText(cursor.anchor.index, "\n");
        item = editor.context.createElement("ListItem", {
          contentString: content + after
        });
        target.after(item);
        cursor.context.pointIdenticalCursors(cursor, item, {
          index: content.length
        });
        return true;
      } else {
        return false;
      }
    }
  });

  commands.push({
    name: "make-next-list-item",
    description: "make a new list item",
    context: true,
    handler: function(editor) {
      var anchor, content, currentIndent, cursor, head, i, item, len, next, nextIndent, ref, ref1, ref2, result, target;
      cursor = editor.buffer.cursor;
      result = false;
      if (cursor.target.type === "ListItem" && !cursor.anchor.inside) {
        if ((ref = cursor.target) != null ? typeof ref.getChildTextByOffset === "function" ? (ref1 = ref.getChildTextByOffset(cursor.anchor.index)) != null ? ref1.trigger : void 0 : void 0 : void 0) {
          return false;
        }
        target = cursor.target;
        anchor = cursor.anchor.clone();
        if (target.isEmpty()) {
          target.removeText(0);
          target.insertText(0, "\n");
          ref2 = target.anchors;
          for (i = 0, len = ref2.length; i < len; i++) {
            anchor = ref2[i];
            anchor.index = 0;
          }
          return true;
        }
        currentIndent = target.getIndentLevel();
        if (anchor.index <= currentIndent * target.spacePerIndent + 1) {
          return false;
        }
        if ((next = target.next()) && next.sortOf("ListItem")) {
          nextIndent = next.getIndentLevel();
        } else {
          nextIndent = 0;
        }
        if (currentIndent > nextIndent || ((next != null ? next.getHead : void 0) == null)) {
          head = target.getHead();
        } else {
          head = next.getHead();
        }
        if (!head) {
          return false;
        }
        content = target.contentString.slice(anchor.index);
        ListItem = editor.context.getConstructor("ListItem");
        if (ListItem.isContentMatchListItem(content)) {
          return false;
        }
        target.removeText(anchor.index);
        target.insertText(anchor.index, "\n");
        item = editor.context.createElement("ListItem", {
          contentString: head + content
        });
        target.after(item);
        editor.buffer.context.pointIdenticalCursors(cursor, item, {
          index: head.length
        });
        return true;
      }
      return false;
    }
  });

  commands.push({
    name: "collapse-list-item",
    context: true,
    description: "collapse the below list item to target list item",
    handler: function(editor) {
      var cursor, target;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      if (!target.sortOf("ListItem")) {
        return false;
      }
      return target.collapse();
    }
  });

  commands.push({
    name: "expand-list-item",
    context: true,
    description: "expand the current list item if it's collapsed",
    handler: function(editor) {
      var cursor, target;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      if (!target.sortOf("ListItem")) {
        return false;
      }
      return target.expand();
    }
  });

  commands.push({
    name: "expand-list-item-or-tail",
    context: true,
    description: "expand the current list item if it's collapsed",
    handler: function(editor) {
      var cursor, end, indent, next, target;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      if (!target.sortOf("ListItem")) {
        return false;
      }
      if (target.isCollapsed) {
        return target.expand();
      }
      next = target;
      end = null;
      indent = target.getIndentLevel();
      editor.buffer.selection.deactivate();
      while (true) {
        next = next.next();
        if (next && next.sortOf("ListItem") && next.getIndentLevel() > indent) {
          end = next;
          continue;
        }
        break;
      }
      if (end) {
        cursor.context.pointIdenticalCursors(cursor, end, {
          index: end.length - 1
        });
        editor.buffer.selection.deactivate();
        return true;
      }
      next = target;
      while (true) {
        next = next.next();
        if (next && next.sortOf("ListItem") && next.getIndentLevel() === indent) {
          end = next;
          continue;
        }
        break;
      }
      if (end) {
        cursor.context.pointIdenticalCursors(cursor, end, {
          index: end.length - 1
        });
        editor.buffer.selection.deactivate();
        return true;
      }
      return false;
    }
  });

  commands.push({
    name: "toggle-list-item-type",
    context: true,
    description: "toggle the current list item type to orderd or unordered",
    handler: function(editor) {
      var cursor, target;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      if (!target.sortOf("ListItem")) {
        return false;
      }
      return target.toggleOrderType();
    }
  });

  commands.push({
    name: "toggle-list-item-type-in-region",
    context: true,
    description: "toggle the current list item type to orderd or unordered in region",
    handler: function(editor) {
      var changed, collection, cursor, i, item, len, ref, selection;
      selection = editor.buffer.selection;
      cursor = editor.buffer.cursor;
      if (!selection.isActive || selection.isCollapsed()) {
        return false;
      }
      collection = selection.getSelectedCollection();
      changed = false;
      ref = collection.nodes;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (item.sortOf("ListItem")) {
          changed = true;
          item.toggleOrderType();
        }
      }
      return changed;
    }
  });

  commands.push({
    name: "start-of-list-item",
    description: "jump cursor to the start of list item if cursoring is pointing at one",
    handler: function(editor) {
      var cursor, head, indexShouldBe, item, ref, target;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      if (!target.sortOf("ListItem")) {
        return false;
      }
      head = target.getHead();
      indexShouldBe = head.length;
      item = cursor.target.getChildTextByOffset(indexShouldBe);
      if (item.sortOf("Todo")) {
        indexShouldBe += item.length;
      }
      item = cursor.target.getChildTextByOffset(indexShouldBe);
      if (item.sortOf("Text") && ((ref = item.contentString) != null ? ref[indexShouldBe - item.startOffset] : void 0) === " ") {
        indexShouldBe += 1;
      }
      if (cursor.anchor.index !== indexShouldBe) {
        cursor.anchor.index = indexShouldBe;
        return true;
      }
      return false;
    }
  });

  commands.push({
    name: "start-of-headline",
    description: "jump cursor to the start of headline if cursoring is pointing at one",
    handler: function(editor) {
      var cursor, head, target;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      if (!target.sortOf("Headline")) {
        return false;
      }
      head = target.getPrefix();
      if (cursor.anchor.index !== head.length) {
        cursor.anchor.index = head.length;
        return true;
      }
      return false;
    }
  });

  commands.push({
    name: "move-current-list-item-to-block-begin",
    context: true,
    description: "move current list item to begin of the list block",
    handler: function(editor) {
      var cursor, head, indent, left, level, next, offset, previous, ref, target;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      if ((ref = editor.buffer.selection) != null ? ref.isActive : void 0) {
        return false;
      }
      if (!target.sortOf("ListItem")) {
        return false;
      }
      level = target.getIndentLevel();
      left = null;
      head = null;
      previous = target;
      while (previous = previous.previous()) {
        if (!previous || !previous.sortOf("ListItem")) {
          break;
        }
        if (!left) {
          left = previous;
        }
        indent = previous.getIndentLevel();
        if (indent < level) {
          break;
        }
        head = previous;
      }
      if (!head) {
        return;
      }
      next = target.next();
      if (next && next.sortOf("ListItem") && next.getIndentLevel() === level) {
        left = next;
      }
      target.remove();
      head.before(target);
      offset = cursor.anchor.index;
      cursor.context.pointIdenticalCursors(cursor, left, {
        index: Math.min(offset, left.contentString.length - 1)
      });
      return true;
    }
  });

  commands.push({
    name: "move-current-list-item-to-block-end",
    context: true,
    description: "move current list item to end of the list block",
    handler: function(editor) {
      var cursor, indent, left, level, next, offset, ref, tail, target;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      if ((ref = editor.buffer.selection) != null ? ref.isActive : void 0) {
        return false;
      }
      if (!target.sortOf("ListItem")) {
        return false;
      }
      level = target.getIndentLevel();
      left = null;
      tail = null;
      next = target;
      while (next = next.next()) {
        if (!next || !next.sortOf("ListItem")) {
          break;
        }
        if (!left) {
          left = next;
        }
        indent = next.getIndentLevel();
        if (indent < level) {
          break;
        }
        tail = next;
      }
      if (!tail) {
        return;
      }
      target.remove();
      tail.after(target);
      offset = cursor.anchor.index;
      cursor.context.pointIdenticalCursors(cursor, left, {
        index: Math.min(offset, left.contentString.length - 1)
      });
      return true;
    }
  });

  commands.push({
    name: "move-current-list-region-to-block-begin",
    context: true,
    description: "move current list item to begin of the list block",
    handler: function(editor) {
      var begin, collection, cursor, end, head, i, indent, item, j, k, left, len, len1, len2, level, offset, previous, ref, ref1, ref2, selection;
      selection = editor.buffer.selection;
      cursor = editor.buffer.selection.extentCursor;
      if (!selection.isActive || selection.isCollapsed()) {
        return false;
      }
      collection = selection.getSelectedCollection();
      ref = collection.nodes;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (!(item != null ? item.sortOf("ListItem") : void 0)) {
          return;
        }
      }
      cursor = editor.buffer.cursor;
      begin = collection.beginNode;
      end = collection.endNode;
      level = begin.getIndentLevel();
      left = null;
      head = null;
      previous = begin;
      while (previous = previous.previous()) {
        if (!previous || !previous.sortOf("ListItem")) {
          break;
        }
        if (!left) {
          left = previous;
        }
        indent = previous.getIndentLevel();
        if (indent < level) {
          break;
        }
        head = previous;
      }
      if (!head) {
        return;
      }
      ref1 = collection.nodes;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        item = ref1[j];
        item.remove();
      }
      ref2 = collection.nodes;
      for (k = 0, len2 = ref2.length; k < len2; k++) {
        item = ref2[k];
        head.before(item);
      }
      offset = cursor.anchor.index;
      cursor.context.pointIdenticalCursors(cursor, left, {
        index: Math.min(offset, left.contentString.length - 1)
      });
      selection.cancel();
      return true;
    }
  });

  commands.push({
    name: "move-current-list-region-to-block-end",
    context: true,
    description: "move current list item to end of the list block",
    handler: function(editor) {
      var begin, collection, cursor, end, i, indent, item, j, k, left, len, len1, level, next, offset, ref, ref1, ref2, selection, tail;
      cursor = editor.buffer.cursor;
      selection = editor.buffer.selection;
      cursor = editor.buffer.selection.extentCursor;
      if (!selection.isActive || selection.isCollapsed()) {
        return false;
      }
      collection = selection.getSelectedCollection();
      ref = collection.nodes;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (!(item != null ? item.sortOf("ListItem") : void 0)) {
          return;
        }
      }
      begin = collection.beginNode;
      end = collection.endNode;
      level = end.getIndentLevel();
      left = null;
      tail = null;
      next = end;
      while (next = next.next()) {
        if (!next || !next.sortOf("ListItem")) {
          break;
        }
        if (!left) {
          left = next;
        }
        indent = next.getIndentLevel();
        if (indent < level) {
          break;
        }
        tail = next;
      }
      if (!tail) {
        return;
      }
      ref1 = collection.nodes;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        item = ref1[j];
        item.remove();
      }
      ref2 = collection.nodes;
      for (k = ref2.length - 1; k >= 0; k += -1) {
        item = ref2[k];
        tail.after(item);
      }
      offset = cursor.anchor.index;
      cursor.context.pointIdenticalCursors(cursor, left, {
        index: Math.min(offset, left.contentString.length - 1)
      });
      selection.cancel();
      return true;
    }
  });

  commands.push({
    name: "merge-current-line-with-previous",
    context: true,
    description: "merge current list with previous line and join them with a space",
    handler: function(editor) {
      var anchor, cs, cursor, target;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      if (!cursor.target.sortOf("RichText")) {
        return;
      }
      anchor = cursor.anchor.clone();
      cs = cursor.target.contentString;
      while (anchor.index > 0) {
        anchor.index -= 1;
        if (cs[anchor.index] === "\n") {
          target.removeText(anchor.index, 1);
          target.insertText(anchor.index, " ");
          return true;
        }
      }
      return false;
    }
  });

  commands.push({
    name: "swap-current-line-with-previous",
    context: true,
    description: "merge current list with previous line and join them with a space",
    handler: function(editor) {
      var anchor, cs, cursor, firstEnd, firstPart, firstStart, originalIndex, secondEnd, secondPart, secondStart, target;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      if (!cursor.target.sortOf("RichText")) {
        return;
      }
      originalIndex = cursor.anchor.index;
      anchor = cursor.anchor.clone();
      cs = cursor.target.contentString;
      firstStart = -1;
      firstEnd = -1;
      secondStart = -1;
      secondEnd = -1;
      while (anchor.index < cs.length) {
        if (cs[anchor.index] === "\n") {
          break;
        }
        anchor.index += 1;
      }
      secondEnd = anchor.index;
      anchor = cursor.anchor.clone();
      while (anchor.index > 0) {
        if (cs[anchor.index - 1] === "\n") {
          secondStart = anchor.index;
          firstEnd = anchor.index - 1;
          break;
        }
        anchor.index -= 1;
      }
      if (firstEnd < 0 || secondStart < 0) {
        return false;
      }
      anchor.index = firstEnd;
      while (anchor.index > 0) {
        if (cs[anchor.index - 1] === "\n") {
          break;
        }
        anchor.index -= 1;
      }
      firstStart = anchor.index;
      firstPart = cs.slice(firstStart, firstEnd) || "";
      secondPart = cs.slice(secondStart, secondEnd) || "";
      if (secondEnd !== secondStart) {
        target.removeText(secondStart, secondEnd - secondStart);
      }
      if (firstEnd !== firstStart) {
        target.removeText(firstStart, firstEnd - firstStart);
      }
      if (secondPart) {
        target.insertText(firstStart, secondPart);
      }
      if (firstPart) {
        target.insertText(secondPart.length - firstPart.length + secondStart, firstPart);
      }
      cursor.anchor.index = originalIndex - (firstPart.length + 1);
      return true;
    }
  });

  commands.push({
    name: "swap-current-line-with-next",
    context: true,
    description: "merge current list with next line and join them with a space",
    handler: function(editor) {
      var anchor, cs, cursor, firstEnd, firstPart, firstStart, originalIndex, secondEnd, secondPart, secondStart, target;
      cursor = editor.buffer.cursor;
      target = cursor.target;
      if (!cursor.target.sortOf("RichText")) {
        return;
      }
      anchor = cursor.anchor.clone();
      cs = cursor.target.contentString;
      firstStart = -1;
      firstEnd = -1;
      secondStart = -1;
      secondEnd = -1;
      originalIndex = cursor.anchor.index;
      while (anchor.index > 0) {
        if (cs[anchor.index - 1] === "\n") {
          break;
        }
        anchor.index -= 1;
      }
      firstStart = anchor.index;
      anchor = cursor.anchor.clone();
      while (anchor.index < cs.length) {
        if (cs[anchor.index] === "\n") {
          break;
        }
        anchor.index += 1;
      }
      if (anchor.index + 1 >= cs.length) {
        return false;
      }
      firstEnd = anchor.index;
      secondStart = anchor.index + 1;
      anchor.index = secondStart;
      while (anchor.index < cs.length) {
        if (cs[anchor.index] === "\n") {
          break;
        }
        anchor.index += 1;
      }
      secondEnd = anchor.index;
      firstPart = cs.slice(firstStart, firstEnd) || "";
      secondPart = cs.slice(secondStart, secondEnd) || "";
      if (secondEnd !== secondStart) {
        target.removeText(secondStart, secondEnd - secondStart);
      }
      if (firstEnd !== firstStart) {
        target.removeText(firstStart, firstEnd - firstStart);
      }
      if (secondPart) {
        target.insertText(firstStart, secondPart);
      }
      if (firstPart) {
        target.insertText(secondPart.length - firstPart.length + secondStart, firstPart);
      }
      cursor.anchor.index = originalIndex + secondPart.length + 1;
      return true;
    }
  });

  commands.push({
    name: "remove-current-list",
    context: true,
    description: "remove current list item",
    handler: function(editor) {
      var cursor, next, previous, selection, target;
      selection = editor.buffer.selection;
      if (selection.isActive && !selection.isCollapsed()) {
        return false;
      }
      cursor = editor.buffer.cursor;
      target = cursor.target;
      if (!target.sortOf("ListItem")) {
        return false;
      }
      if ((previous = target.previous()) && previous.sortOf("ListItem")) {
        cursor.pointAt(previous);
        cursor.conduct("endOfLine");
      } else if ((next = target.next()) && next.sortOf("ListItem")) {
        cursor.pointAt(next);
        cursor.conduct("endOfLine");
      } else if ((previous = target.previous())) {
        cursor.pointAt(previous);
        cursor.conduct("tail");
      } else if ((next = target.next())) {
        cursor.pointAt(next);
        cursor.conduct("tail");
      } else {
        target.removeText(0);
        return false;
      }
      target.remove();
      return true;
    }
  });

  commands.push({
    name: "remove-region-list",
    context: true,
    description: "remove list item in the selected region",
    handler: function(editor) {
      var collection, cursor, end, i, item, len, next, previous, ref, selection, start, target;
      selection = editor.buffer.selection;
      if (!selection.isActive || selection.isCollapsed()) {
        return false;
      }
      cursor = editor.buffer.cursor;
      target = cursor.target;
      collection = selection.getSelectedCollection();
      start = collection.nodes[0];
      end = collection.nodes[collection.nodes.length - 1];
      if ((previous = start.previous()) && previous.sortOf("ListItem")) {
        cursor.pointAt(previous);
        cursor.conduct("endOfLine");
      } else if ((next = end.next()) && next.sortOf("ListItem")) {
        cursor.pointAt(next);
        cursor.conduct("endOfLine");
      } else if ((previous = start.previous())) {
        cursor.pointAt(previous);
        cursor.conduct("endOfLine");
      } else if ((next = end.next())) {
        cursor.pointAt(next);
        cursor.conduct("endOfLine");
      } else if (end && !end.sortOf("ListItem")) {
        cursor.pointAt(end);
        cursor.conduct("startOfLine");
      } else {
        start.removeText(0);
        editor.buffer.selection.collapseToCursor();
        return false;
      }
      ref = collection.nodes;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (item.sortOf("ListItem")) {
          item.remove();
        }
      }
      editor.buffer.selection.collapseToCursor();
      return true;
    }
  });

  module.exports = commands;

}).call(this);