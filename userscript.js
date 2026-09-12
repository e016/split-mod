// ==UserScript==
// @name         Split! (userscript version)
// @namespace    http://github.com/e016/split-mod
// @version      2026-9-12
// @description  Make Snap! look like Scratch
// @author       d016
// @match        https://snap.berkeley.edu/snap/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=snap.berkeley.edu
// @grant        none
// ==/UserScript==

(function () {
  "use strict";
SymbolMorph.prototype.extensionSymbolNames = [];

SyntaxElementMorph.prototype.bright = function () {
  return this.color.lighter(this.contrast).toString();
};

SyntaxElementMorph.prototype.dark = function (base) {
  if (!base) {
    base = this.color;
  }
  let isZebra = this.isZebra;
  let color = this.colors?.tertiary || base.darker(this.contrast);
  return isZebra
    ? color.lighter(this.zebraContrast).toString()
    : color.toString();
};

SyntaxElementMorph.prototype.secondary = function (base) {
  if (!base) {
    base = this.color;
  }
  let isZebra = this.isZebra;
  let color = this.colors?.secondary || base.darker(this.contrast).lighter(5);
  return isZebra
    ? color.lighter(this.zebraContrast).toString()
    : color.toString();
};

InputSlotMorph.prototype.isSquare = function () {
  return this.squareStrings
    ? !this.isNumeric && (!this.isReadOnly || this.isStatic)
    : this.isStatic || this instanceof TextSlotMorph;
};

SyntaxElementMorph.prototype.setScale = function (num) {
  var scale = Math.max(num, 1 / 1.2) * 1.2;

  this.contrast = 20; //65;
  this.scale = scale;
  this.corner = 3 * scale;
  this.rounding = 9 * scale;
  this.edge = scale;
  this.flatEdge = scale * 0.7;
  this.jag = 10 * scale;
  this.dentPlus = 1.5 * scale;
  this.dentCorner = 3.5 * scale;
  this.inset = 6.5 * scale;
  this.hatHeight = 15 * scale;
  this.hatWidth = 60 * scale;
  this.rfBorder = 0 * scale;
  this.minWidth = 6 * scale;
  this.dent = 11 * scale;
  this.bottomPadding = 9 * scale; //7 * scale;
  this.cSlotPadding = 4 * scale;
  this.typeInPadding = 3 * scale;
  this.labelPadding = 4 * scale;
  this.labelFontName = '"Helvetica Neue", "Segoe UI", Helvetica, sans-serif'; //'Verdana';
  this.labelFontStyle = "sans-serif";
  this.fontSize = 9.5 * scale; //10 * scale;
  this.embossing = new Point(
    -1 * Math.max(scale / 2, 1),
    -1 * Math.max(scale / 2, 1),
  );
  this.labelWidth = 450 * scale;
  this.labelWordWrap = true;
  this.dynamicInputLabels = true;
  this.feedbackMinHeight = 5;
  this.minSnapDistance = 20;
  this.reporterDropFeedbackPadding = 10 * scale;
  this.labelContrast = 25;
  this.activeHighlight = new Color(255, 242, 0);
  this.errorHighlight = new Color(255, 0, 0);
  this.activeBlur = 8 * this.scale;
  this.activeBorder = 3 * this.scale;
  this.rfColor = new Color(120, 120, 120);
};

SyntaxElementMorph.prototype.fixLayout = function () {
  var nb,
    parts = this.parts(),
    pos = this.position(),
    x = 0,
    y,
    isReporter = this instanceof ReporterBlockMorph,
    lineHeight = 0,
    maxX = 0,
    blockWidth = this.minWidth,
    blockHeight,
    myself = this,
    l = [],
    lines = [],
    space = this.isPrototype ? 1 : Math.floor(fontHeight(this.fontSize) / 3),
    ico =
      this instanceof BlockMorph && this.hasLocationPin()
        ? this.methodIconExtent().x + space
        : 0,
    bottomCorrection,
    rightCorrection = 0,
    rightMost,
    hasLoopCSlot = false,
    hasLoopArrow = false,
    anyNotRound = parts.some((part) => "alwaysRound" in part && !part.alwaysRound);

  if (this instanceof MultiArgMorph && this.slotSpec !== "%cs") {
    blockWidth += this.arrows().width() / 2;
  } else if (isReporter) {
    blockWidth += this.rounding * 2 + this.edge * 2;
  } else {
    blockWidth +=
      this.corner * 0.9 + this.edge * 2 + this.inset * 2.5 + this.dent;
  }

  if (this.nextBlock) {
    nb = this.nextBlock();
  }

  // determine lines
  parts.forEach((part) => {
    if (
      part instanceof CSlotMorph ||
      (part instanceof MultiArgMorph && part.slotSpec.includes("%cs"))
    ) {
      if (l.length > 0) {
        lines.push(l);
        lines.push([part]);
        l = [];
        x = 0;
      } else {
        lines.push([part]);
      }
    } else if (this.isVertical() && !(part instanceof FrameMorph)) {
      // variadic ring-inputs are arranged vertically
      // except the arrows for expanding and collapsing them
      if (l.length > 0) {
        lines.push(l);
      }
      if (part.isVisible) {
        // ignore hidden collapse labels
        l = [part];
        x = part.fullBounds().width() + space;
      }
    } else {
      if (part.isVisible) {
        x += part.fullBounds().width() + space;
      }
      if (x > this.labelWidth || part.isBlockLabelBreak) {
        if (l.length > 0) {
          lines.push(l);
          l = [];
          x = part.fullBounds().width() + space;
        }
      }
      l.push(part);
      if (part.isBlockLabelBreak) {
        x = 0;
      }
    }
  });
  if (l.length > 0) {
    lines.push(l);
  }

  // distribute parts on lines
  if (this instanceof CommandBlockMorph) {
    y = this.top() + this.corner + this.edge;
    if (this instanceof HatBlockMorph) {
      y += this.hatHeight;
    }
  } else if (isReporter) {
    y = this.top() + this.edge * 2;
  } else if (this instanceof MultiArgMorph || this instanceof ArgLabelMorph) {
    y = this.top();
    if (this.slotSpec === "%cs" && this.inputs().length > 0) {
      y -= this.rounding;
    }
  }

  this.lineCount = lines.length;
  lines.forEach((line, index) => {
    if (hasLoopCSlot) {
      hasLoopArrow = true;
      hasLoopCSlot = false;
    }
    x =
      this.left() +
      ico +
      this.edge +
      this.labelPadding /
        ((line[0] instanceof InputSlotMorph ||
          line[0] instanceof BooleanSlotMorph) &&
        this.constructor.name.includes("ReporterBlockMorph") &&
        !line[0]?.isSquare?.()
          ? 2
          : 1);
    if (this instanceof RingMorph) {
      x = this.left() + space; //this.labelPadding;
    } else if (this?.isPredicate) {
      x =
        this.left() +
        ico +
        this.rounding *
          (line[0] instanceof BlockLabelMorph ||
          line[0].constructor.name == "BlockLabelFragmentPlaceHolderMorph" ||
          line[0].constructor.name == "BlockLabelPlaceHolderMorph" ||
          line[0] instanceof BooleanSlotMorph ||
          (line[0] instanceof MultiArgMorph && line[0].slotSpec.includes("%b"))
            ? 1.1
            : 1.4);
    } else if (this instanceof MultiArgMorph || this instanceof ArgLabelMorph) {
      x = this.left();
    } else if (
      isReporter &&
      (line[0] instanceof BlockLabelMorph ||
        line[0].constructor.name == "BlockLabelFragmentPlaceHolderMorph" || line[0].constructor.name == "BlockLabelPlaceHolderMorph")
    ) {
      x =
        this.left() +
        ico +
        this.edge +
        this.labelPadding *
          (line[0] instanceof InputSlotMorph ||
          line[0] instanceof BooleanSlotMorph
            ? 1
            : 1.5);
    }

    y += lineHeight;

    lineHeight = 0;
    line.forEach((part, partIndex) => {
      if (part.isLoop) {
        hasLoopCSlot = true;
      }
      if (
        index == 0 &&
        !part?.isBlockLabelBreak &&
        (part instanceof InputSlotMorph ||
          part instanceof BooleanSlotMorph ||
          part instanceof ReporterBlockMorph ||
          (!(part instanceof BlockLabelMorph) &&
            !(part.constructor.name == "BlockLabelFragmentPlaceHolderMorph") &&
            !(part.constructor.name === "BlockLabelPlaceHolderMorph") &&
            !(part.constructor.name === "BlockLabelFragmentMorph") &&
            !(part instanceof CSlotMorph) &&
            !(part instanceof ArrowMorph) &&
            !(part instanceof MultiArgMorph && part.slotSpec.includes("%cs")) &&
            !(part instanceof SymbolMorph))) &&
        this.constructor.name.includes("CommandBlockMorph")
      ) {
        if (typeof x == "number") {
          x = Math.max(
            x,
            this.left() + this.dent + this.inset + this.corner * 4,
          );
        }
      }

      if (part instanceof CSlotMorph) {
        x -= this.corner / 2;
        if (this.isPredicate) {
          x = this.left() + ico + this.rounding;
        }
        part.setColor(this.color);
        part.setPosition(new Point(x, y));
        lineHeight = part.height();
      } else if (
        part instanceof MultiArgMorph &&
        part.slotSpec.includes("%cs")
      ) {
        if (this.isPredicate) {
          x += this.corner;
        }
        part.setPosition(new Point(x, y));
        lineHeight = part.height();
        maxX = Math.max(
          maxX,
          Math.max(
            ...part.children
              .filter((each) => each.isVisible && !(each instanceof CSlotMorph))
              .map((each) => each.right()),
          ),
        );
      } else {
        if (part?.name == "loop") {
          y += part.scale * 10;
        }
        if (
          ((!line[0].isVisible && partIndex == 1) || partIndex == 0) &&
          part instanceof BooleanSlotMorph
        ) {
          x -= this.labelPadding * 1.5;
        }
        if (this.isPredicate && partIndex === 0 && !(part instanceof ArgMorph)) {
          x += this.rounding / 4;
        }
        part.setPosition(new Point(x, y));
        if (!part.isBlockLabelBreak) {
          if (part.slotSpec === "%c" || part.slotSpec === "%loop") {
            x += part.width();
          } else if (part.isVisible) {
            let getPartSpace = (i) =>
              line[i] instanceof SymbolMorph ||
              (line[i + 1] || {}) instanceof SymbolMorph
                ? space / 2
                : 0;
            x += part.fullBounds().width() + space + getPartSpace(partIndex);
          }
        }
        maxX = Math.max(maxX, x);
        lineHeight = Math.max(
          lineHeight,
          (part instanceof SymbolMorph) && SymbolMorph.prototype.extensionSymbolNames.includes(part.name) ? part.height() * (isReporter ? 1 : 1.25) : part instanceof StringMorph ? part.rawHeight() : part.height(),
        );
      }
      var i = this instanceof CommandBlockMorph ? -2 : 0,
        isCommand = this instanceof CommandBlockMorph;
      lineHeight =
        Math.max(
          lineHeight - i,
          isCommand && index == 0
            ? this.scale * 22
            : isCommand
              ? this.scale * 15
              : this.scale * 18,
        ) + i;
    });

    // adjust label row below a loop-arrow C-slot to accomodate the loop icon
    if (hasLoopArrow) {
      x += this.fontSize * 1.5;
      maxX = Math.max(maxX, x);
      hasLoopArrow = false;
    }

    // center parts vertically on each line:
    line.forEach((part) => {
      part.moveBy(
        new Point(
          0,
          Math.floor((lineHeight - part.height()) / 2) -
            ((part instanceof SymbolMorph) &&
            SymbolMorph.prototype.extensionSymbolNames.includes(part.name)
            ? this.scale * (isReporter ? 0 : -2)
            : (part instanceof BlockLabelMorph ? 0.2 * this.scale : 0)),
        ),
      );
    });
  });

  // determine my height:
  y += lineHeight;
  if (this.children.some((any) => any instanceof CSlotMorph)) {
    bottomCorrection = this.bottomPadding;
    rightMost = this.inputs()[this.inputs().length - 1];
    if (rightMost instanceof MultiArgMorph) {
      bottomCorrection = -this.bottomPadding;
      if (rightMost.slotSpec.includes("%cs")) {
        if (rightMost.inputs().length) {
          bottomCorrection -= this.bottomPadding / 2;
        } else {
          bottomCorrection += this.bottomPadding / 2;
        }
      }
    }
    if (isReporter && !this.isPredicate) {
      bottomCorrection = Math.max(
        this.bottomPadding,
        this.rounding - this.bottomPadding,
      );
    }
    y += bottomCorrection;
  }
  if (this instanceof CommandBlockMorph) {
    blockHeight = y - this.top() + this.corner * 2;
  } else if (isReporter) {
    blockHeight = y - this.top() + this.edge * 2;
  } else if (this instanceof MultiArgMorph || this instanceof ArgLabelMorph) {
    blockHeight = y - this.top();
  }

  // determine my width:
  if (this.isPredicate) {
    blockWidth = Math.max(blockWidth, maxX - this.left() + this.rounding);
    rightCorrection = space;
  } else if (
    (this instanceof MultiArgMorph && this.slotSpec !== "%cs") ||
    this instanceof ArgLabelMorph
  ) {
    blockWidth = Math.max(
      blockWidth,
      maxX -
        this.left() -
        space * (this.arrows && this.arrows().children[1].isVisible ? 1.5 : 0),
    );
  } else {
    blockWidth = Math.max(
      blockWidth,
      maxX - this.left() + this.labelPadding * 1 - this.edge,
    );
    rightCorrection = space;
  }

  // adjust right padding if rightmost input has arrows
  rightMost = parts[parts.length - 1];
  if (
    rightMost instanceof MultiArgMorph &&
    rightMost.isVisible &&
    lines.length === 1
  ) {
    blockWidth -= rightCorrection;
  }
  // adjust right padding if rightmost input in a reporter is round
  if (
    rightMost instanceof InputSlotMorph &&
    !rightMost?.isSquare() &&
    isReporter &&
    lines.length === 1
  ) {
    blockWidth -= this.labelPadding / 2;
  }
  if (
    rightMost instanceof BooleanSlotMorph &&
    isReporter &&
    lines.length === 1
  ) {
    blockWidth -= this.labelPadding * 1.5;
  }

  // adjust width to hat width
  if (this instanceof HatBlockMorph) {
    blockWidth = Math.max(blockWidth, this.hatWidth * 1.1);
  }
  // adjust CSlotMorphs

  if (
    !(this.constructor.name == "JaggedBlockMorph") &&
    parts.some((part) => part instanceof CSlotMorph)
  ) {
    blockWidth = Math.max(blockWidth, 89 * this.scale);
  }

  // center text in ReporterBlockMorph
  if (lines.length == 1 && isReporter) {
    lines.forEach((line) => {
      if (
        ((line.length == 2 && line[0].isBlockLabelBreak) ||
          line.length === 1) &&
        isReporter &&
        !parts.some((part) => part instanceof CSlotMorph)
      ) {
        line[0].moveBy(
          new Point(
            Math.floor(blockWidth - line[0].width()) / 2 -
              (line[0].left() - this.left()),
            0,
          ),
        );
      }
    });
  }

  // set my extent (silently, because we'll redraw later anyway):
  if (anyNotRound) {
    this.alwaysRound = false
  } else {
    this.alwaysRound = lines.length == 1
  };
  if (lines.length > 0) {
    if (this.isPredicate && lines.length > 0 && !(lines[Math.floor(lines.length / 2)].at(-1) instanceof ArgMorph)) {
      blockWidth += this.rounding / 4;
    }
  }
  this.bounds.setWidth(blockWidth);
  this.bounds.setHeight(
    blockHeight + (this instanceof CommandBlockMorph ? this.dentPlus : 0),
  );

  // adjust CSlots and collect holes
  this.containsCSlot = false;
  this.holes = [];
  parts.forEach((part) => {
    var adjustMultiWidth = 0;
    if (
      part instanceof CSlotMorph ||
      (part.slotSpec && part.slotSpec.includes("%cs"))
    ) {
      this.containsCSlot = true;
      if (this.isPredicate) {
        part.setRight(this.right());
        part.setLeft(this.left() + this.rounding);
        part.bounds.corner.x = part.parent.right();
      } else {
        part.setRight(this.right());
        part.setLeft(this.left() + this.labelPadding);
        part.bounds.corner.x = part.parent.right();
        //part.setWidth(this.width() - this.labelPadding);
        //adjustMultiWidth = this.corner + this.edge;
      }
      if (part.fixLoopLayout) {
        part.fixLoopLayout();
      }
    }
    if (part instanceof MultiArgMorph && part.slotSpec.includes("%cs")) {
      part
        .inputs()
        .filter((each) => each instanceof CSlotMorph)
        .forEach(
          (slot) => (
            !(slot instanceof ArrowMorph) &&
              slot.setLeft(this.left() + this.labelPadding),
            slot.bounds.setWidth(part.right() - slot.left())
          ),
        );
    }
    part.fixHolesLayout();
    this.holes.push.apply(
      this.holes,
      part.holes.map((hole) => hole.translateBy(part.position().subtract(pos))),
    );
  });

  // position next block:
  if (nb) {
    nb.setPosition(
      new Point(
        this.left(),
        this.bottom() - (this.corner + this.dentPlus + this.flatEdge),
      ),
    );
  }

  // find out if one of my parents needs to be fixed
  if (this instanceof BlockMorph && this.parent && this.parent.fixLayout) {
    this.parent.fixLayout();
    this.parent.changed();
    if (this.parent instanceof SyntaxElementMorph) {
      return;
    }
  }

  this.fixHighlight();
};

CommandBlockMorph.prototype.nextBlock = function (block) {
  // set / get the block attached to my bottom
  if (block) {
    var nb = this.nextBlock(),
      affected = this.parentThatIsA(CommandSlotMorph, ReporterSlotMorph);
    this.add(block);
    if (nb) {
      block.bottomBlock().nextBlock(nb);
    }
    block.setPosition(
      new Point(
        this.left(),
        this.bottom() - this.corner - this.dentPlus - this.flatEdge,
      ),
    );
    if (affected) {
      affected.fixLayout();
    }
  } else {
    return detect(
      this.children,
      (child) => child instanceof CommandBlockMorph && !child.isPrototype,
    );
  }
};

InputSlotMorph.prototype.render = function (ctx) {
  var borderColor, r;

  // initialize my surface property
  if (this.cachedNormalColor) {
    // if flashing
    borderColor = this.color;
  } else if (this.parent) {
    borderColor = this.parent.color;
    this.colors = this.parent.colors;
    this.isZebra = this.parent.isZebra;
    this.zebraContrast = this.parent.zebraContrast;
  } else {
    borderColor = new Color(120, 120, 120);
  }
  ctx.fillStyle = this.color.toString();
  if (this.isReadOnly && !this.cachedNormalColor) {
    // unless flashing
    ctx.fillStyle = this.secondary(borderColor);
    if (this.isStatic) {
      ctx.fillStyle = borderColor.toString();
    }
  }

  // cache my border colors
  this.cachedClr = borderColor.toString();
  this.cachedClrBright = borderColor.lighter(this.contrast).toString();
  this.cachedClrDark = this.secondary(borderColor);
  ctx.strokeStyle = this.dark(this.parent.color);
  ctx.lineWidth = this.flatEdge * 2;
  if (this.isSquare()) {
    ctx.beginPath();
    ctx.save();
    ctx.translate(ctx.lineWidth / 1.5, ctx.lineWidth / 1.5);
    ctx.arc(this.corner, this.corner, this.corner, radians(-180), radians(-90));
    ctx.arc(
      this.width() - this.corner * 1.5,
      this.corner,
      this.corner,
      radians(-90),
      radians(0),
    );
    ctx.arc(
      this.width() - this.corner * 1.5,
      this.height() - this.corner * 1.5,
      this.corner,
      radians(0),
      radians(90),
    );
    ctx.arc(
      this.corner,
      this.height() - this.corner * 1.5,
      this.corner,
      radians(90),
      radians(180),
    );
    ctx.arc(this.corner, this.corner, this.corner, radians(-180), radians(-90));
    ctx.stroke();
    ctx.fill();
    ctx.restore();
    if (!MorphicPreferences.isFlat) {
      this.drawRectBorder(ctx);
    }
  } else {
    r = Math.max((this.height() - this.edge * 2) / 2, 0);
    ctx.beginPath();
    ctx.arc(r + this.edge, r + this.edge, r, radians(90), radians(-90), false);
    ctx.arc(
      this.width() - r - this.edge,
      r + this.edge,
      r,
      radians(-90),
      radians(90),
      false,
    );
    ctx.closePath();

    ctx.stroke();
    ctx.fill();
    if (!MorphicPreferences.isFlat) {
      this.drawRoundBorder(ctx);
    }
  }

  // draw my "wish" block, if any
  if (this.selectedBlock) {
    ctx.drawImage(
      this.doWithAlpha(1, () => this.selectedBlock.fullImage()),
      this.edge + this.typeInPadding,
      this.edge,
    );
  }
};

InputSlotMorph.prototype.fixLayout = function () {
  var width,
    height,
    arrowWidth,
    contents = this.contents(),
    arrow = this.arrow(),
    tp = this.topBlock();

  contents.isNumeric = this.isNumeric && !this.isAlphanumeric;
  contents.isEditable = !this.isReadOnly;
  this.hoverCursor = this.isReadOnly ? "pointer" : "text";
  if (this.isReadOnly) {
    contents.disableSelecting();
    contents.color = WHITE;
  } else {
    contents.enableSelecting();
    contents.color = new Color(87, 94, 117);
    //contents.color = new Color(87, 94, 117);
  }
  arrow.color =
    this.isReadOnly || this.isStatic ? WHITE : new Color(87, 94, 117);

  if (this.choices) {
    arrow.setSize(10 * this.scale);
    arrow.show();
  } else {
    arrow.hide();
  }
  arrowWidth = arrow.isVisible ? arrow.width() + 4 * this.scale : 0;
  var arrowWidth0 = arrow.isVisible ? arrow.width() : 0;

  // determine slot dimensions
  if (this.selectedBlock) {
    // a "wish" in the OF-block's left slot
    height = this.selectedBlock.height() + this.edge * 2;
    width =
      this.selectedBlock.width() +
      arrowWidth +
      this.edge * 2 +
      this.typeInPadding * 2;
  } else {
    if (this.symbol) {
      this.symbol.fixLayout();
      this.symbol.setPosition(this.position().add(this.edge * 2));
      height = this.symbol.height() + this.edge * 4;
      width =
        this.symbol.width() +
        arrowWidth +
        this.edge * 4 +
        this.typeInPadding * 2;
    }
    height = contents.height() + this.edge * 8; // + this.typeInPadding * 2
    if (!(this instanceof TextSlotMorph || this.isStatic)) {
      width = Math.max(
        contents.width() +
          Math.floor(arrowWidth * 0.5) +
          height +
          arrowWidth / 6 -
          this.typeInPadding * 1.5,
        this.scale * (this.isReadOnly ? 30 : 24),
      );
    } else {
      width = Math.max(
        contents.width() +
          arrowWidth +
          this.edge * (arrowWidth > 0 ? 2 : 6) +
          arrowWidth / 6 +
          this.typeInPadding,
        contents.rawHeight // single vs. multi-line contents
          ? contents.rawHeight() + arrowWidth
          : fontHeight(contents.fontSize) / 1.3 + arrowWidth,
        this.scale * (this.isReadOnly ? 30 : 24), //this.minWidth // for text-type slots
      );
    }
  }
  this.bounds.setExtent(new Point(width, height));
  //move everything inside
  if (true) {
    //this.isReadOnly || !(this instanceof TextSlotMorph)) {
    //this.isNumeric) {
    contents.setPosition(
      new Point(
        Math.floor(width / 2) -
          contents.width() / 2 -
          this.typeInPadding -
          arrowWidth / 3,
        this.edge + this.typeInPadding * 0.9,
      )
        .add(new Point(this.typeInPadding, 0))
        .add(this.position()),
    );
  } else {
    contents.setPosition(
      new Point(this.edge, this.edge + this.typeInPadding * 0.7)
        .add(new Point(this.typeInPadding, 0))
        .add(this.position()),
    );
  }

  if (arrow.isVisible) {
    arrow.setCenter(this.center());
    arrow.setPosition(
      new Point(
        this.right() - arrowWidth - this.edge,
        arrow.top() - arrowWidth0 / 5,
      ),
    );
  }

  if (this.parent && this.parent.fixLayout) {
    tp.fullChanged();
    this.parent.fixLayout();
    tp.fullChanged();
  }
};

BooleanSlotMorph.prototype.textLabelExtentSpecific = function () {
  var t, f;
  t = new StringMorph(
    localize("true"),
    this.fontSize,
    null,
    true, // bold
  );
  f = new StringMorph(
    localize("false"),
    this.fontSize,
    null,
    true, // bold
  );
  return this.value ? new Point(t.width(), t.height()) : new Point(f.width(), f.height());
};

BooleanSlotMorph.prototype.fixLayout = function () {
  // determine my extent
  var text, h;
  if (this.isWide()) {
    text = this.textLabelExtent();
    h = text.y + this.edge * 3;
    this.bounds.setWidth(text.x + h * 1 + this.edge * 2);
    this.bounds.setHeight(this.fontSize * 1.3 + this.edge * 7);
  } else {
    this.bounds.setWidth((this.fontSize + this.edge * 3) * 2.2);
    this.bounds.setHeight(this.fontSize + this.edge * 8);
  }
};

BooleanSlotMorph.prototype.render = function (ctx) {
  if (!this.cachedNormalColor) {
    // unless flashing
    this.color = this.parent ? this.parent.color : new Color(200, 200, 200);
  }
  this.cachedClr = this.color.toString();
  this.cachedClrBright = this.bright();
  this.cachedClrDark = this.dark();
  this.drawDiamond(ctx, this.progress);
  //this.drawKnob(ctx, this.progress);
};

BooleanSlotMorph.prototype.drawDiamond = function (ctx, progress) {
  var w = this.width(),
    h = this.height(),
    r = h / 2,
    w2 = w / 2,
    shift = this.edge / 2,
    gradient;

  // "tick:"
  var drawTick = () => {
    var w = this.width(),
      r = this.height() / 2 - this.edge,
      r2 = r / 2,
      shift = this.edge / 2,
      text,
      x,
      y = this.height() / 2;
    x = this.width() / 2;
    if (!MorphicPreferences.isFlat && useBlurredShadows) {
      ctx.shadowOffsetX = -shift;
      ctx.shadowOffsetY = -shift;
      ctx.shadowBlur = shift;
      ctx.shadowColor = "rgb(0, 100, 0)";
    }
    ctx.strokeStyle = "white";
    ctx.lineWidth = this.edge + shift;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x - r2, y);
    ctx.lineTo(x, y + r2);
    ctx.lineTo(x + r2, r2 + this.edge);
    ctx.stroke();
  };

  // "cross:"
  var drawCross = () => {
    var w = this.width(),
      r = this.height() / 2 - this.edge,
      r2 = r / 2,
      shift = this.edge / 2,
      text,
      x,
      y = this.height() / 2;
    x = this.width() / 2;
    if (!MorphicPreferences.isFlat && useBlurredShadows) {
      ctx.shadowOffsetX = -shift;
      ctx.shadowOffsetY = -shift;
      ctx.shadowBlur = shift;
      ctx.shadowColor = "rgb(100, 0, 0)";
    }
    ctx.strokeStyle = "white";
    ctx.lineWidth = this.edge + shift;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x - r2, y - r2);
    ctx.lineTo(x + r2, y + r2);
    ctx.moveTo(x - r2, y + r2);
    ctx.lineTo(x + r2, y - r2);
    ctx.stroke();
  };

  // draw the 'flat' shape:
  var clr;
  if (this.cachedNormalColor) {
    // if flashing
    clr = this.color;
  } else {
    switch (this.value) {
      case true:
        clr = new Color(0, 200, 0);
        break;
      case false:
        clr = new Color(200, 0, 0);
        break;
      default:
        clr = this.dark();
    }
  }
  if (progress == -1) {
    clr = this.color.darker(10);
  }
  ctx.fillStyle = clr.toString();

  if (progress > 0) {
    var rightHalf = () => {
        ctx.fillStyle = this.isEmptySlot()
          ? this.color.darker(25).toString()
          : "rgb(200, 0, 0)";
        ctx.beginPath();
        ctx.moveTo(w2, 0);
        ctx.lineTo(w - r, 0);
        ctx.lineTo(w, r);
        ctx.lineTo(w - r, h);
        ctx.lineTo(w2, h);
        ctx.closePath();
        ctx.fill();
      },
      leftHalf = () => {
        ctx.fillStyle = "rgb(0, 200, 0)";
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.lineTo(r, 0);
        ctx.lineTo(w2, 0);
        ctx.lineTo(w2, h);
        ctx.lineTo(r, h);
        ctx.closePath();

        ctx.fill();
      };

    // right half:

    rightHalf();

    // left half:
    leftHalf();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.lineTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.lineTo(w, r);
    ctx.lineTo(w - r, h);
    ctx.lineTo(r, h);
    ctx.closePath();
  }

  ctx.fill();
  if (
    this.parentThatIsA(BlockMorph)?.alpha < 0.6 ||
    !this.isEmptySlot() ||
    progress > 0
  ) {
    var e = this.flatEdge / 2;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = this.flatEdge;
    ctx.beginPath();
    ctx.moveTo(e, r);
    ctx.lineTo(r, e);
    ctx.lineTo(w - r, e);
    ctx.lineTo(w - e, r);
    ctx.lineTo(w - r, h - e);
    ctx.lineTo(r, h - e);
    ctx.closePath();
    ctx.stroke();
  }

  if ((progress < 0 || !this.isEmptySlot() || progress == 1) && !this.isWide()) {
    if (this.value) {
      drawTick();
    } else {
      drawCross();
    }
  }

  /*if (MorphicPreferences.isFlat) {
    return;
  }

  // add 3D-Effect:
  ctx.lineWidth = this.edge;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (useBlurredShadows) {
    ctx.shadowOffsetX = shift;
    ctx.shadowBlur = shift;
    ctx.shadowColor = "black";
  }

  // top edge: left corner
  gradient = ctx.createLinearGradient(
    0,
    r,
    this.edge * 0.6,
    r + this.edge * 0.6
  );
  gradient.addColorStop(1, this.cachedClrDark);
  gradient.addColorStop(0, this.cachedClr);
  ctx.strokeStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(shift, r);
  ctx.lineTo(r, shift);
  ctx.closePath();
  ctx.stroke();

  // top edge: straight line
  if (useBlurredShadows) {
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = shift;
    ctx.shadowBlur = this.edge;
  }

  gradient = ctx.createLinearGradient(0, 0, 0, this.edge);
  gradient.addColorStop(1, this.cachedClrDark);
  gradient.addColorStop(0, this.cachedClr);
  ctx.strokeStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(r, shift);
  ctx.lineTo(w - r, shift);
  ctx.closePath();
  ctx.stroke();

  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;

  // bottom edge: right corner
  gradient = ctx.createLinearGradient(
    w - r - this.edge * 0.6,
    h - this.edge * 0.6,
    w - r,
    h
  );
  gradient.addColorStop(1, this.cachedClr);
  gradient.addColorStop(0, this.cachedClrBright);
  ctx.strokeStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(w - r, h - shift);
  ctx.lineTo(w - shift, r);
  ctx.closePath();
  ctx.stroke();

  // bottom edge: straight line
  gradient = ctx.createLinearGradient(0, h - this.edge, 0, h);
  gradient.addColorStop(1, this.cachedClr);
  gradient.addColorStop(0, this.cachedClrBright);
  ctx.strokeStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(r, h - shift);
  ctx.lineTo(w - r - shift, h - shift);
  ctx.closePath();
  ctx.stroke();*/

  //! drawLabel

  if (this.isEmptySlot()) {
    return;
  }

  if (this.isWide()) {
    // draw the full text label
    let text,
    x,
    y;

    text = this.textLabelExtentSpecific();
    y = this.height() - (this.height() - text.y) / 2;
    x = this.width() / 2;
    ctx.save();
    if (!MorphicPreferences.isFlat && useBlurredShadows) {
      ctx.shadowOffsetX = -shift;
      ctx.shadowOffsetY = -shift;
      ctx.shadowBlur = shift;
      ctx.shadowColor = this.value ? "rgb(0, 100, 0)" : "rgb(100, 0, 0)";
    }
    ctx.font = new StringMorph(null, this.fontSize, null, true).font();
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgb(255, 255, 255";
    ctx.fillText(localize(this.value ? "true" : "false"), x, y);
    ctx.restore();
    return;
  }
};

BlockMorph.prototype.render = function (ctx) {
  this.cachedClr = this.color.toString();
  this.cachedClrBright = this.bright();
  this.cachedClrDark = this.dark();

  if (MorphicPreferences.isFlat) {
    /*// draw the outline
    ctx.fillStyle = this.cachedClrDark;
    ctx.beginPath();
    this.outlinePath(ctx, 0);
    ctx.closePath();
    ctx.fill();*/
    ctx.strokeStyle = this.cachedClrDark;
    ctx.lineWidth = this.flatEdge;

    // draw the inner filled shaped
    ctx.fillStyle = this.cachedClr;
    ctx.beginPath();
    this.outlinePath(ctx, this.flatEdge / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // draw the flat shape
    ctx.fillStyle = this.cachedClr;
    ctx.beginPath();
    this.outlinePath(ctx, 0);
    ctx.closePath();
    ctx.fill();

    // add 3D-Effect:
    this.drawEdges(ctx);
  }

  // draw infinity / chain link icon if applicable
  if (this.isRuleHat()) {
    this.drawRuleIcon(ctx);
  }

  // draw location pin icon if applicable
  if (this.hasLocationPin()) {
    this.drawMethodIcon(ctx);
  }
};
SyntaxElementMorph.prototype.drawRoundedDent = function (
  ctx,
  inset,
  x,
  y,
  reverse,
) {
  var w = this.dent * 1.75 + this.corner / 2,
    h = this.corner + this.dentPlus + inset,
    offset = this.inset + this.corner / 2,
    c = this.dentCorner;
  if (!isNil(x)) {
    ctx.save();
    ctx.translate(x || 0, y || 0);
  }
  if (reverse) {
    ctx.translate(w + offset * 2, 0);
    ctx.scale(-1, 1);
  }
  ctx.lineTo(0 + offset, -h + h + inset);
  ctx.bezierCurveTo(
    c + offset,
    -h + h + inset,
    c + offset,
    -0 + h + inset,
    c * 2 + offset,
    -0 + h + inset / 4,
  );
  ctx.lineTo(w - c * 2 + offset, h + inset / 4);
  ctx.bezierCurveTo(
    w - c + offset,
    0 + h + inset,
    w - c + offset,
    -h + h + inset,
    w + offset,
    -h + h + inset,
  );
  if (!isNil(x)) {
    ctx.restore();
  }
};
CommandBlockMorph.prototype.outlinePath = function (ctx, inset) {
  var indent = this.corner * 2 + this.inset,
    bottom = this.height() - this.corner,
    bottomCorner = this.height() - this.corner * 2,
    radius = Math.max(this.corner - inset, 0),
    pos = this.position();

  // top left:
  ctx.arc(this.corner, this.corner, radius, radians(-180), radians(-90), false);

  // top dent:
  if (false) {
    ctx.lineTo(this.corner + this.inset, inset); //before dent
    ctx.arc(
      this.corner / 2 + this.inset,
      this.corner,
      radius,
      radians(-90),
      radians(-45),
      false,
    );
    ctx.lineTo(indent / 1.1, this.corner / 2 + this.dentPlus + inset); //left edge of dent
    if (false) {
      ctx.arc(
        indent + this.corner / 2,
        (this.corner + this.dentPlus + inset) / 1.5,
        radius,
        radians(45),
        radians(180),
        false,
      );
    }
    ctx.lineTo(indent, this.corner + this.dentPlus + inset);
    ctx.lineTo(indent + this.dent, this.corner + this.dentPlus + inset);
    ctx.lineTo(this.corner * 3 + this.inset + this.deltaPoint, inset); //right edge
    ctx.arc(
      this.corner * 3.5 + this.inset + this.dent,
      this.corner,
      radius,
      radians(-135),
      radians(-90),
      false,
    );
  } else {
    var w = this.dent * 1.75 + this.corner / 2,
      h = this.corner + this.dentPlus + inset / 2,
      offset = this.inset + this.corner / 2,
      c = this.dentCorner;
    this.drawRoundedDent(ctx, inset, 0, 0);
  }

  ctx.lineTo(this.width() - this.corner, inset); // after dent

  // top right:
  ctx.arc(
    this.width() - this.corner,
    this.corner,
    radius,
    radians(-90),
    radians(-0),
    false,
  );

  // C-Slots
  this.cSlots().forEach((slot) => {
    slot.outlinePath(ctx, inset, slot.position().subtract(pos));
  });

  // bottom right:
  ctx.arc(
    this.width() - this.corner,
    bottomCorner - this.dentPlus,
    radius,
    radians(0),
    radians(90),
    false,
  );

  if (!this.isStop()) {
    if (false) {
      ctx.lineTo(this.width() - this.corner, bottom - inset - this.dentPlus);
      ctx.lineTo(
        this.corner * 3 + this.inset + this.dent,
        bottom - inset + 0 - this.dentPlus,
      );
      ctx.lineTo(indent + this.dent, bottom + this.corner - inset + 0);
      ctx.lineTo(indent, bottom + this.corner - inset - 0);
      ctx.arc(
        this.corner / 0.9 + this.inset,
        bottom + inset,
        radius,
        radians(-90),
        radians(-45),
        false,
      );
    } else {
      this.drawRoundedDent(ctx, inset, 0, bottom - this.dentPlus * 1.5, true);
    }
    ctx.lineTo(this.corner + this.inset, bottom - inset - this.dentPlus);
  }

  // bottom left:
  ctx.arc(
    this.corner,
    bottomCorner - this.dentPlus,
    radius,
    radians(90),
    radians(180),
    false,
  );
};

HatBlockMorph.prototype.outlinePath = function (ctx, inset) {
  var indent = this.corner * 2 + this.inset,
    bottom = this.height() - this.corner,
    bottomCorner = this.height() - this.corner - this.dentPlus * 2 + this.flatEdge / 2,
    radius = Math.max(this.corner - inset, 0),
    s = this.hatWidth,
    h = this.hatHeight,
    r = (4 * h * h + s * s) / (8 * h),
    a = degrees(4 * Math.atan((2 * h) / s)),
    sa = a / 2,
    sp = Math.min(s * 1.7, this.width() - this.corner),
    pos = this.position();

  // top arc:
  ctx.moveTo(inset, h + this.corner - radius);
  ctx.ellipse(
    s / 2,
    r / 1.4 + inset + 4 * this.scale,
    r,
    r / 1.4,
    0,
    radians(-sa - 90),
    radians(sa - 90),
    0,
  );
  /*ctx.bezierCurveTo(
        s,
        0,
        s,
        h,
        sp,
        h
    );*/

  // top right:
  ctx.arc(
    this.width() - this.corner,
    h + this.corner,
    radius,
    radians(-90),
    radians(-0),
    false,
  );

  // C-Slots
  this.cSlots().forEach((slot) => {
    slot.outlinePath(ctx, inset, slot.position().subtract(pos));
  });

  // bottom right:
  ctx.arc(
    this.width() - this.corner,
    bottomCorner + inset * 2 - radius,
    radius,
    radians(0),
    radians(90),
    false,
  );

  if (!this.isStop()) {
    var w = this.dent * 1.75 + this.corner / 2,
      h = this.corner + this.dentPlus,
      offset = this.inset + this.corner / 2,
      c = this.dentCorner;
    this.drawRoundedDent(ctx, inset, 0, bottomCorner + inset, true);
  }

  // bottom left:
  ctx.arc(
    this.corner,
    bottomCorner + inset * 2 - radius,
    radius,
    radians(90),
    radians(180),
    false,
  );
};

ReporterBlockMorph.prototype.outlinePathOval = function (ctx, inset) {
  // draw the 'flat' shape
  console.warn(this instanceof TemplateSlotMorph)
  var h = this.height(),
    w = this.width(),
    r =
      (this.constructor.name === "TemplateSlotMorph" ||
      (this?.alwaysRound && !(this instanceof RingMorph)))
        ? Math.min(h / 2, w / 2)
        : Math.min(Math.round(1.5 * this.rounding), h / 2),
    radius = Math.max(r - inset, 0),
    pos = this.position();
  // top left:
  ctx.arc(r, r, radius, radians(-180), radians(-90), false);

  // top right:
  ctx.arc(w - r, r, radius, radians(-90), radians(-0), false);

  // C-Slots
  this.cSlots().forEach((slot) => {
    slot.outlinePath(ctx, inset, slot.position().subtract(pos));
  });

  // bottom right:
  ctx.arc(w - r, h - r, radius, radians(0), radians(90), false);

  // bottom left:
  ctx.arc(r, h - r, radius, radians(90), radians(180), false);

  ctx.lineTo(r - radius, r); // close the path so we can clip it for rings
};

ReporterBlockMorph.prototype.outlinePathDiamond = function (ctx, inset) {
  // draw the 'flat' shape:
  var w = this.width(),
    h = this.height(),
    h2 = Math.floor(h / 2),
    r = (this.alwaysRound)
        ? Math.min(h / 2, w / 2)
        : Math.min(Math.round(1.5 * this.rounding), h / 2),
    corner = this.corner,
    right = w - r,
    pos = this.position(),
    cslots = this.cSlots();

  ctx.moveTo(inset, h2);
  ctx.lineTo(r, inset);
  if (this.containsCSlot) {
    ctx.arc(w - corner, corner, corner, radians(-90), radians(-0), false);
  } else {
    ctx.lineTo(right - inset, inset);
  }

  if (cslots.length) {
    this.cSlots().forEach((slot) => {
      slot.outlinePath(ctx, inset, slot.position().subtract(pos));
    });
  } else {
    ctx.lineTo(w - inset, h2);
  }
  if (this.containsCSlot) {
    ctx.arc(w - corner, h - corner, corner, radians(0), radians(90), false);
  } else {
    ctx.lineTo(right - inset, h - inset);
  }
  ctx.lineTo(r, h - inset);
};

RingCommandSlotMorph.prototype.outlinePath = function (ctx, offset) {
  var ox = offset.x,
    oy = offset.y,
    isFilled = this.nestedBlock() !== null,
    ins = isFilled ? this.inset : this.inset / 2,
    dent = isFilled ? this.dent : this.dent,
    indent = this.corner * 2 + ins,
    edge = this.edge,
    w = this.width(),
    h = this.height(),
    rf = isFilled ? this.rfBorder : 0,
    y = h - this.corner - edge;
  ctx.save();
  ctx.translate(0, edge);
  // top left:
  ctx.arc(
    this.corner + edge + ox,
    this.corner + edge + oy,
    this.corner,
    radians(-180),
    radians(-90),
    false,
  );

  // dent:
  //ctx.lineTo(this.corner + ins + edge + rf * 2 + ox, edge + oy);
  if (false) {
    ctx.lineTo(
      indent + edge + rf * 2 + ox,
      this.corner + edge + oy + this.dentPlus,
    );
    ctx.lineTo(
      indent + edge + rf * 2 + (dent - rf * 2) + ox,
      this.corner + edge + oy + this.dentPlus,
    );
    ctx.lineTo(
      indent + edge + rf * 2 + (dent - rf * 2) + this.corner + ox,
      edge + oy,
    );
  } else {
    (() => {
      const dentW = this.dent * 1.75 + this.corner / 2,
        inset = oy,
        dentH = this.corner + this.dentPlus,
        dentOffset = this.corner / 2 + ins + edge + rf * 2 + ox,
        c = this.dentCorner;
      ctx.save();
      ctx.translate(0, inset + 1);
      ctx.lineTo(0 + dentOffset, -dentH + dentH);
      ctx.bezierCurveTo(
        c + dentOffset,
        -dentH + dentH,
        c + dentOffset,
        -0 + dentH,
        c * 2 + dentOffset,
        -0 + dentH,
      );
      ctx.lineTo(dentW - c * 2 + dentOffset, dentH);
      ctx.bezierCurveTo(
        dentW - c + dentOffset,
        0 + dentH,
        dentW - c + dentOffset,
        -dentH + dentH,
        dentW + dentOffset,
        -dentH + dentH,
      );
      ctx.restore();
    })();
  }
  ctx.lineTo(this.width() - this.corner - edge + ox, edge + oy);

  // top right:
  ctx.arc(
    w - this.corner - edge + ox,
    this.corner + edge + oy,
    this.corner,
    radians(-90),
    radians(-0),
    false,
  );

  // bottom right:
  ctx.arc(
    this.width() - this.corner - edge + ox,
    y + oy - this.dentPlus,
    this.corner,
    radians(0),
    radians(90),
    false,
  );

  // bottom left:
  ctx.arc(
    this.corner + edge + ox,
    y + oy - this.dentPlus,
    this.corner,
    radians(90),
    radians(180),
    false,
  );

  // close the path, so we can clip it:
  ctx.lineTo(
    this.corner + edge + ox - this.corner, // this needs to be adjusted
    this.corner + edge + oy,
  );
  ctx.restore();
};

CSlotMorph.prototype.outlinePath = function (ctx, inset, offset) {
  var ox = offset.x,
    oy = offset.y,
    radius = Math.max(this.corner - inset, 0);

  // top corner:
  ctx.lineTo(this.width() + ox - inset, oy);

  // top right:
  ctx.arc(this.width() - this.corner + ox, oy, radius, radians(0), radians(90));
  // jigsaw shape:
  var w = this.dent * 1.75 + this.corner / 2,
    h = this.corner + this.dentPlus,
    offset = this.inset * 1 + this.dent / 1.6 + ox,
    c = this.dentCorner;
  this.drawRoundedDent(
    ctx,
    inset,
    inset + this.corner * 2 + ox,
    this.corner + oy - inset * 2,
    true,
  );

  ctx.arc(
    this.inset + this.corner + ox,
    this.corner * 2 + oy,
    this.corner + inset,
    radians(270),
    radians(180),
    true,
  );

  // bottom:
  ctx.lineTo(
    this.inset + ox - inset,
    this.height() - this.corner * 2 + oy - this.dentPlus,
  );
  ctx.arc(
    this.inset + this.corner + ox,
    this.height() - this.corner * 2 + oy - this.dentPlus,
    this.corner + inset,
    radians(180),
    radians(90),
    true,
  );
  var block = this.nestedBlock(),
    flatEdge = true;
  if (!isNil(block)) {
    // new fix
    if (block.bottomBlock().isStop()) flatEdge = false;
  }
  if (flatEdge) {
    this.drawRoundedDent(
      ctx,
      inset,
      inset + this.corner * 2 + ox,
      this.height() - this.corner + oy - this.dentPlus,
    );
    ctx.lineTo(
      this.width() - this.corner + ox,
      this.height() - this.corner + oy + inset - this.dentPlus,
    );
  }
  ctx.arc(
    this.width() - this.corner + ox,
    this.height() + oy - this.dentPlus,
    radius,
    radians(-90),
    radians(-0),
    false,
  );
};

RingReporterSlotMorph.prototype.outlinePathDiamond = function (ctx, offset) {
  var ox = offset.x,
    oy = offset.y,
    w = this.width(),
    h = this.height(),
    h2 = Math.floor(h / 2),
    r = Math.min(h2, h2);

  ctx.moveTo(ox + this.edge, h2 + oy);
  ctx.lineTo(r + this.edge + ox, this.edge + oy);
  ctx.lineTo(w - r - this.edge + ox, this.edge + oy);
  ctx.lineTo(w - this.edge + ox, h2 + oy);
  ctx.lineTo(w - r - this.edge + ox, h - this.edge + oy);
  ctx.lineTo(r + this.edge + ox, h - this.edge + oy);
  ctx.lineTo(ox + this.edge, h2 + oy);
};

RingReporterSlotMorph.prototype.outlinePathOval = function (ctx, offset) {
  var ox = offset.x,
    oy = offset.y,
    w = this.width(),
    h = this.height(),
    r = Math.min(h / 2, h / 2);

  // top left:
  ctx.arc(
    r + this.edge + ox,
    r + this.edge + oy,
    r,
    radians(-180),
    radians(-90),
    false,
  );

  // top right:
  ctx.arc(
    w - r - this.edge + ox,
    r + this.edge + oy,
    r,
    radians(-90),
    radians(-0),
    false,
  );

  // bottom right:
  ctx.arc(
    w - r - this.edge + ox,
    h - r - this.edge + oy,
    r,
    radians(0),
    radians(90),
    false,
  );

  // bottom left:
  ctx.arc(
    r + this.edge + ox,
    h - r - this.edge + oy,
    r,
    radians(90),
    radians(180),
    false,
  );

  // "close" the path
  ctx.lineTo(this.edge + ox, r + this.edge + oy);
};

CommandSlotMorph.prototype.fixLayout = function () {
  var nb = this.nestedBlock();
  if (this.parent) {
    if (!this.color.eq(this.parent.color)) {
      this.setColor(this.parent.color);
    }
  }
  if (nb) {
    nb.setPosition(
      new Point(
        this.left() + this.edge + this.rfBorder,
        this.top() + this.edge + this.rfBorder,
      ),
    );
    this.bounds.setWidth(
      nb.fullBounds().width() + (this.edge + this.rfBorder) * 2,
    );
    this.bounds.setHeight(
      nb.fullBounds().height() +
        this.edge +
        this.rfBorder * 2 -
        (this.corner - this.edge),
    );
  } else {
    this.bounds.setHeight(this.corner * 6);
    this.bounds.setWidth(this.corner * 4 + this.inset + this.dent * 1.3);
  }
  if (this.parent && this.parent.fixLayout) {
    this.parent.fixLayout();
  }
};

// CSlotMorph layout:

CSlotMorph.prototype.fixLayout = function () {
  var nb = this.nestedBlock();
  if (nb) {
    nb.setPosition(
      new Point(this.left() + this.inset, this.top() + this.corner),
    );
    this.bounds.setHeight(nb.fullBounds().height() + this.corner);
    this.bounds.setWidth(nb.fullBounds().width() + this.cSlotPadding * 2);
  } else {
    this.bounds.setHeight(this.corner * 6 + this.cSlotPadding); // default
    this.bounds.setWidth(
      this.corner * 4 + this.inset * 2 + this.dent + this.cSlotPadding * 2,
    );
    if (this.parent) {
      this.bounds.corner.x = this.parent.right();
    }
  }

  if (this.parent && this.parent.fixLayout) {
    this.parent.fixLayout();
  }
};

ColorSlotMorph.prototype.fixLayout = function () {
  // determine my extent
  var side = this.fontSize + this.edge * 2 + this.typeInPadding * 2;
  this.bounds.setWidth(side * 1.3);
  this.bounds.setHeight(side * 1.1);
};

ColorSlotMorph.prototype.render = function (ctx) {
  var borderColor;

  if (this.parent) {
    borderColor = this.parent.color;
  } else {
    borderColor = new Color(120, 120, 120);
  }
  ctx.fillStyle = this.color.toString();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = this.flatEdge * 2;
  // cache my border colors
  this.cachedClr = borderColor.toString();
  this.cachedClrBright = borderColor.lighter(this.contrast).toString();

  this.cachedClrDark = borderColor.darker(this.contrast).toString();

  if (false) {
    ctx.fillRect(
      this.edge,
      this.edge,
      this.width() - this.edge * 2,
      this.height() - this.edge * 2,
    );
  } else {
    var r = Math.max((this.height() - this.edge * 2) / 2, 0);
    ctx.beginPath();
    ctx.arc(r + this.edge, r + this.edge, r, radians(90), radians(-90), false);
    ctx.arc(
      this.width() - r - this.edge,
      r + this.edge,
      r,
      radians(-90),
      radians(90),
      false,
    );
    ctx.closePath();

    ctx.stroke();
    ctx.fill();
  }
  if (!MorphicPreferences.isFlat) {
    this.drawRectBorder(ctx);
  }
};

ReporterSlotMorph.prototype.fixLayout = function () {
  var contents = this.contents();
  if (!contents) {
    contents = this.emptySlot();
    this.add(contents);
  }
  this.bounds.setExtent(
    contents.extent().add(this.edge * 2 + this.rfBorder * 2),
  );
  contents.setCenter(this.center());
  if (this.parent) {
    if (this.parent.fixLayout) {
      this.parent.fixLayout();
    }
  }
};

RingReporterSlotMorph.prototype.fixLayout = function () {
  if (this.contents() instanceof CommandBlockMorph) {
    CommandSlotMorph.prototype.fixLayout.call(this);
  } else {
    RingReporterSlotMorph.uber.fixLayout.call(this);
  }
};

SpriteMorph.prototype.blockColor = {
  motion: new Color(76, 151, 255),
  looks: new Color(151, 100, 251),
  sound: new Color(207, 99, 207),
  pen: new Color(15, 189, 140),
  events: new Color(255, 191, 0),
  control: new Color(255, 171, 25),
  sensing: new Color(92, 177, 214),
  operators: new Color(89, 192, 89),
  variables: new Color(255, 140, 26),
  lists: new Color(255, 102, 26),
  other: new Color(170, 170, 170),
};
SpriteMorph.prototype.blockColors = {
  motion: {
    primary: new Color(76, 151, 255),
    secondary: new Color(66, 128, 215),
    tertiary: new Color(51, 115, 204),
    quaternary: new Color(51, 115, 204),
  },
  looks: {
    primary: new Color(153, 102, 255),
    secondary: new Color(133, 92, 214),
    tertiary: new Color(119, 77, 203),
    quaternary: new Color(119, 77, 203),
  },
  sound: {
    primary: new Color(207, 99, 207),
    secondary: new Color(201, 79, 201),
    tertiary: new Color(189, 66, 189),
    quaternary: new Color(189, 66, 189),
  },
  control: {
    primary: new Color(255, 171, 25),
    secondary: new Color(236, 156, 19),
    tertiary: new Color(207, 139, 23),
    quaternary: new Color(207, 139, 23),
  },
  events: {
    primary: new Color(255, 191, 0),
    secondary: new Color(230, 172, 0),
    tertiary: new Color(204, 153, 0),
    quaternary: new Color(204, 153, 0),
  },
  sensing: {
    primary: new Color(92, 177, 214),
    secondary: new Color(71, 168, 209),
    tertiary: new Color(46, 142, 184),
    quaternary: new Color(46, 142, 184),
  },
  pen: {
    primary: new Color(15, 189, 140),
    secondary: new Color(13, 165, 122),
    tertiary: new Color(11, 142, 105),
    quaternary: new Color(11, 142, 105),
  },
  operators: {
    primary: new Color(89, 192, 89),
    secondary: new Color(70, 185, 70),
    tertiary: new Color(56, 148, 56),
    quaternary: new Color(56, 148, 56),
  },
  variables: {
    primary: new Color(255, 140, 26),
    secondary: new Color(255, 128, 0),
    tertiary: new Color(219, 110, 0),
    quaternary: new Color(219, 110, 0),
  },
  lists: {
    primary: new Color(255, 102, 26),
    secondary: new Color(255, 85, 0),
    tertiary: new Color(230, 77, 0),
    quaternary: new Color(230, 77, 0),
  },
  more: {
    primary: new Color(255, 102, 128),
    secondary: new Color(255, 77, 106),
    tertiary: new Color(255, 51, 85),
    quaternary: new Color(255, 51, 85),
  },
  other: {
    primary: new Color(170, 170, 170),
    secondary: new Color(178, 178, 178),
    tertiary: new Color(144, 144, 144),
    quaternary: new Color(144, 144, 144),
  },
  text: new Color(255, 255, 255),
};

SpriteMorph.prototype.blockColorsFor = function (category) {
  return Object.hasOwn(this.blockColor, category)
    ? this.blockColors[category]
    : {
        primary: this.customCategories.get(category)
      } || this.blockColors.other;
};

SpriteMorph.prototype.blockForSelector = function (selector, setDefaults) {
  var migration, info, block, defaults, inputs, i;
  migration = this.blockMigrations[selector];
  info = this.blocks[migration ? migration.selector : selector];
  if (!info) {
    return null;
  }
  if (info.definition instanceof CustomBlockDefinition) {
    // overload primitive with global custom block
    block = info.definition.blockInstance();
    if (setDefaults) {
      block.refreshDefaults(info.definition);
    }
    return block;
  } else {
    block =
      info.type === "command"
        ? new CommandBlockMorph()
        : info.type === "hat"
        ? new HatBlockMorph()
        : info.type === "ring"
        ? new RingMorph()
        : new ReporterBlockMorph(info.type === "predicate");
    block.color = this.blockColorFor(info.category);
    block.colors = this.blockColorsFor(info.category);
    block.category = info.category;
    block.selector = migration ? migration.selector : selector;
    if (contains(["reifyReporter", "reifyPredicate"], block.selector)) {
      block.isStatic = true;
    }
    block.setSpec(block.localizeBlockSpec(info.spec));
  }
  if (migration && migration.expand) {
    if (migration.expand instanceof Array) {
      for (i = 0; i < migration.expand[1]; i += 1) {
        block.inputs()[migration.expand[0]].addInput();
      }
    } else {
      block.inputs()[migration.expand].addInput();
    }
  }
  if (info.defaults || migration?.inputs) {
    defaults = migration?.inputs || info.defaults;
    block.defaults = defaults;
    inputs = block.inputs();
    if (inputs[0] instanceof MultiArgMorph) {
      inputs[0].defaults = defaults;
      if (setDefaults || migration?.inputs) {
        inputs[0].setContents(defaults);
      }
    } else {
      for (i = 0; i < defaults.length; i += 1) {
        if (defaults[i] !== null) {
          if (setDefaults || migration?.inputs) {
            inputs[i].setContents(defaults[i]);
          }
          if (inputs[i] instanceof MultiArgMorph) {
            inputs[i].defaults = defaults[i];
          }
        }
      }
    }
  }
  return block;
};

ArgMorph.prototype.fixLayout = function () {
    if (this.icon) {
        if (this.type === 'process') {
            // render a chameleon-colored oval slot around the icon
            let contents = this.icon,
                arrowWidth = 0;
            this.bounds.setWidth(Math.max(
                contents.width() +
                arrowWidth +
                this.edge * (arrowWidth > 0 ? 2 : 6) +
                arrowWidth / 6 +
                this.typeInPadding,
                contents.height(),
                this.scale * (true ? 30 : 24), //this.minWidth // for text-type slots
            ));
            this.bounds.setHeight(
                contents.height() + this.edge * 8
            );
            this.icon.setCenter(this.center());
        } else {
            this.icon.setPosition(this.position());
            this.bounds.setExtent(this.icon.extent());
        }
    } else {
        ArgMorph.uber.fixLayout.call(this);
    }
};

TemplateSlotMorph.prototype.render = function (ctx) {
    if (this.parent instanceof Morph) {
        this.color = this.parent.color.copy();
    };
    this.alwaysRound = true;
    BlockMorph.prototype.render.call(this, ctx);
};

  SyntaxElementMorph.prototype.setScale(SyntaxElementMorph.prototype.scale);
  world.children[0].refreshIDE();
})();
