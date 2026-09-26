// ==UserScript==
// @name         Split! (userscript version)
// @namespace    http://github.com/e016/split-mod
// @version      2026-9-26
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
      anyNotRound = parts.some(
        (part) => "alwaysRound" in part && !part.alwaysRound,
      );

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
            (line[0] instanceof MultiArgMorph &&
              line[0].slotSpec.includes("%b"))
              ? 1.1
              : 1.4);
      } else if (
        this instanceof MultiArgMorph ||
        this instanceof ArgLabelMorph
      ) {
        x = this.left();
      } else if (
        isReporter &&
        (line[0] instanceof BlockLabelMorph ||
          line[0].constructor.name == "BlockLabelFragmentPlaceHolderMorph" ||
          line[0].constructor.name == "BlockLabelPlaceHolderMorph")
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
              !(
                part.constructor.name == "BlockLabelFragmentPlaceHolderMorph"
              ) &&
              !(part.constructor.name === "BlockLabelPlaceHolderMorph") &&
              !(part.constructor.name === "BlockLabelFragmentMorph") &&
              !(part instanceof CSlotMorph) &&
              !(part instanceof ArrowMorph) &&
              !(
                part instanceof MultiArgMorph && part.slotSpec.includes("%cs")
              ) &&
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
                .filter(
                  (each) => each.isVisible && !(each instanceof CSlotMorph),
                )
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
          if (
            this.isPredicate &&
            partIndex === 0 &&
            !(part instanceof ArgMorph)
          ) {
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
            part instanceof SymbolMorph &&
              SymbolMorph.prototype.extensionSymbolNames.includes(part.name)
              ? part.height() * (isReporter ? 1 : 1.25)
              : part instanceof StringMorph
                ? part.rawHeight()
                : part.height(),
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
              (part instanceof SymbolMorph &&
              SymbolMorph.prototype.extensionSymbolNames.includes(part.name)
                ? this.scale * (isReporter ? 0 : -2)
                : part instanceof BlockLabelMorph
                  ? 0.2 * this.scale
                  : 0),
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
          space *
            (this.arrows && this.arrows().children[1].isVisible ? 1.5 : 0),
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
      this.alwaysRound = false;
    } else {
      this.alwaysRound = lines.length == 1;
    }
    if (lines.length > 0) {
      if (
        this.isPredicate &&
        lines.length > 0 &&
        !(lines[Math.floor(lines.length / 2)].at(-1) instanceof ArgMorph)
      ) {
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
        part.holes.map((hole) =>
          hole.translateBy(part.position().subtract(pos)),
        ),
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
      ctx.arc(
        this.corner,
        this.corner,
        this.corner,
        radians(-180),
        radians(-90),
      );
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
      ctx.arc(
        this.corner,
        this.corner,
        this.corner,
        radians(-180),
        radians(-90),
      );
      ctx.stroke();
      ctx.fill();
      ctx.restore();
      if (!MorphicPreferences.isFlat) {
        this.drawRectBorder(ctx);
      }
    } else {
      r = Math.max((this.height() - this.edge * 2) / 2, 0);
      ctx.beginPath();
      ctx.arc(
        r + this.edge,
        r + this.edge,
        r,
        radians(90),
        radians(-90),
        false,
      );
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
    return this.value
      ? new Point(t.width(), t.height())
      : new Point(f.width(), f.height());
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

    if (
      (progress < 0 || !this.isEmptySlot() || progress == 1) &&
      !this.isWide()
    ) {
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
      let text, x, y;

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
      // draw the outline
      /*
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
    ctx.arc(
      this.corner,
      this.corner,
      radius,
      radians(-180),
      radians(-90),
      false,
    );

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
      bottomCorner =
        this.height() - this.corner - this.dentPlus * 2 + this.flatEdge / 2,
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
    //console.warn(this instanceof TemplateSlotMorph)
    var h = this.height(),
      w = this.width(),
      r =
        this.constructor.name === "TemplateSlotMorph" ||
        (this?.alwaysRound && !(this instanceof RingMorph))
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
      r = this.alwaysRound
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
    ctx.arc(
      this.width() - this.corner + ox,
      oy,
      radius,
      radians(0),
      radians(90),
    );
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
      ctx.arc(
        r + this.edge,
        r + this.edge,
        r,
        radians(90),
        radians(-90),
        false,
      );
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
          primary: this.customCategories.get(category),
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
      if (this.type === "process") {
        // render a chameleon-colored oval slot around the icon
        let contents = this.icon,
          arrowWidth = 0;
        this.bounds.setWidth(
          Math.max(
            contents.width() +
              arrowWidth +
              this.edge * (arrowWidth > 0 ? 2 : 6) +
              arrowWidth / 6 +
              this.typeInPadding,
            contents.height(),
            this.scale * (true ? 30 : 24), //this.minWidth // for text-type slots
          ),
        );
        this.bounds.setHeight(contents.height() + this.edge * 8);
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
    }
    this.alwaysRound = true;
    BlockMorph.prototype.render.call(this, ctx);
  };

  SymbolMorph.prototype.drawImage = function (ctx, image) {
    let _debug_name;
    if (typeof image === "string") {
      _debug_name = image;
      if (this.supportsBlack.includes(image) && this.color.eq(BLACK)) {
        _debug_name = image + "Black";
        image = this[image + "Black"];
      } else {
        if (this.supportsGrey.includes(image) && this.color.eq(BLACK)) {
          _debug_name = image + "Grey";
          image = this[image + "Grey"];
        } else {
          image = this[image];
        }
      }
    }
    try {
      ctx.drawImage(image, 0, 0, this.width(), this.height());
    } catch (e) {
      console.warn(_debug_name);
      throw new Error(e);
    }
  };
  SymbolMorph.prototype.renderSymbolFlag = function (ctx) {
    this.drawImage(
      ctx,
      this.color.eq(new Color(255, 0, 0))
        ? this.flagSymbolRed
        : this.flagSymbol,
    );
  };
  SymbolMorph.prototype.renderSymbolOctagon = function (ctx) {
    this.drawImage(ctx, this.stopSymbol);
  };
  SymbolMorph.prototype.renderSymbolTurnRight = function (ctx) {
    this.drawImage(ctx, "turnRightImage");
  };
  SymbolMorph.prototype.renderSymbolTurnLeft = function (ctx) {
    this.drawImage(ctx, "turnLeftImage");
  };
  SymbolMorph.prototype.renderSymbolLoop = function (ctx) {
    this.drawImage(ctx, "loopSymbol");
  };
  SymbolMorph.prototype.renderSymbolArrowUp = function (ctx) {
    this.drawImage(ctx, "arrowImage");
  };
  SymbolMorph.prototype.renderSymbolArrowUpOutline = function (ctx) {
    this.drawImage(ctx, "arrowOutImage");
  };
  SymbolMorph.prototype.renderSymbolExtension = function (ctx) {
    this.drawImage(ctx, "extensionSymbol");
  };
  SymbolMorph.prototype.renderSymbolNotes = function (ctx) {
    this.drawImage(ctx, "notesImage");
  };
  SymbolMorph.prototype.renderSymbolFile = function (ctx) {
    this.drawImage(ctx, "fileSymbol");
  };
  let originalSymbolWidth = SymbolMorph.prototype.symbolWidth;
  SymbolMorph.prototype.symbolWidth = function () {
    let result = originalSymbolWidth.call(this),
      size = this.size;
    switch (this.name) {
      case "turnRight":
      case "turnLeft":
      case "file":
        return size;
    }
    return result || 0;
  };

  SymbolMorph.prototype.supportsBlack = [
    "extensionSymbol",
    "notesImage",
    "settingsSymbol",
    "fileSymbol",
    "turnRightImage",
    "turnLeftImage",
    "arrowImage",
    "arrowOutImage",
    "loopSymbol",
    "selectImage",
    "shrinkImage",
    "grow",
    "brush",
    "trash",
    "eraser",
    "paint",
    "horiz",
    "pipette",
  ];

  SymbolMorph.prototype.supportsGrey = [
    "settingsSymbol",
    "fileSymbol",
    "shrinkImage",
    "grow",
    "brush",
    "trash",
  ];

  SymbolMorph.prototype.addSpriteSymbol = new Image();
  SymbolMorph.prototype.addSpriteSymbol.src =
    "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxOS40ODYzMSIgaGVpZ2h0PSIxOS40ODYzMSIgdmlld0JveD0iMCwwLDE5LjQ4NjMxLDE5LjQ4NjMxIj48ZGVmcz48Y2xpcFBhdGggaWQ9ImNsaXAtMSI+PHJlY3QgeD0iMTgzOS41MjI0NiIgeT0iMTMyMi4yNjM4NCIgdHJhbnNmb3JtPSJzY2FsZSgwLjEyNjMyLDAuMTMwMDgpIiB3aWR0aD0iOTUiIGhlaWdodD0iMTIzIiBmaWxsPSJub25lIi8+PC9jbGlwUGF0aD48L2RlZnM+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTIzMC4yNTY4NCwtMTcwLjI1Njg0KSI+PGcgc3Ryb2tlPSJub25lIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiPjxnIGNsaXAtcGF0aD0idXJsKCNjbGlwLTEpIiBmaWxsLXJ1bGU9Im5vbnplcm8iIHN0cm9rZS13aWR0aD0iMSI+PGcgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZD0iTTIzOC4zMzYsMTg1LjU2MTExYzAsLTAuMTY1OTkgMC4wNDUyMiwtMC40MDQ0MyAwLjI5NTMyLC0wLjQ1ODI4YzAuMzYwODgsLTAuMDc3OTIgMC43NzM4MSwwLjI5ODI4IDAuODg1OTgsMC40MDkyNGMtMC4wMDgyMSwwLjA0Mzk2IDAuMTMyMjYsMC45MzMwNyAwLjEzMjI2LDEuMDEwMDhjMCwwLjI2MDY4IC0wLjA2NzU4LDAuMjcwOTUgLTAuMDkzODUsMC4yNzUyNWMtMC4yNDcwNywwLjAzNjk1IC0wLjkwNTU1LC0wLjY3NjAzIC0xLjIwNzgzLC0xLjA5MDk5Yy0wLjAwNDMsLTAuMDIyNzYgLTAuMDExODgsLTAuMDcyNzEgLTAuMDExODgsLTAuMTQ1M3YweiIvPjxwYXRoIGQ9Ik0yMzcuMzM1MzIsMTg2LjgwNjc2Yy0wLjE3OTExLC0wLjIwMDA2IC0wLjIwNDc2LC0wLjc0MjM3IC0wLjIwNDc2LC0wLjk3MzI2YzAsLTAuMDk3ODIgMC4wMDQ5MiwtMC4xNjI5OSAwLjAwNTE4LC0wLjE2NDk0bDAuMDAwMjUsLTAuMDA1MDhjMCwwIC0wLjAwMDUsLTAuMDIwODEgLTAuMDAwNSwtMC4wMjg0OWMwLC0wLjQzNDYgMC4zODg0MiwtMC41ODU0OSAwLjQ1NDM2LC0wLjYwODEzYzAuMjI0OTcsMC4wMDI3MyAwLjYxMzY1LDAuMTEyMzkgMC43MDY0OSwwLjI3Nzg1YzAuMDA5NDgsMC4wMTY2NSAwLjAxODE4LDAuMDM3NiAwLjAxODE4LDAuMDY0MzljMCwwLjAyMzU1IC0wLjAwNjgxLDAuMDUyMDMgLTAuMDI2MjcsMC4wODY2M2MtMC4wMDg5NywwLjAxNTc0IC0wLjE2ODYzLDAuNDA0NDMgLTAuMzAzNzksMC43MDI0NGwtMC4wOTY2MywwLjI3NTY0Yy0wLjA3MjI2LDAuMjQwNzggLTAuMTg2MDcsMC40ODE2OSAtMC4zMDk3MywwLjQ4MTY5Yy0wLjA5Nzc3LDAuMDAwMzkgLTAuMTc3MDksLTAuMDM1MjYgLTAuMjQyNzgsLTAuMTA4NzV2MHoiLz48cGF0aCBkPSJNMjQyLjQwMTk4LDE4My42NTY3MmwtMC4xNzQ3LC0wLjMxNzRjLTAuMTkxNSwtMC4zNDMwMyAtMC40MTI0MiwtMC42NTcxNyAtMC42MDcyLC0wLjkzMzU5Yy0wLjI1MDQ4LC0wLjM1NjE3IC0wLjQ2ODY0LC0wLjcyNDY4IC0wLjU0MDc2LC0wLjk4NDk3Yy0wLjAyNjE1LC0wLjA5Mzc5IC0wLjAxMzUxLC0wLjE4MzQxIDAuMDIzODgsLTAuMjMyODRjMC4wMDM1MywtMC4wMTMyNyAwLjA0MTMsLTAuMDM0NDcgMC4wNjgwOCwtMC4wNDAyYzAuMzIwOTcsLTAuMDcxNTQgMS42NDk2OSwwLjcxNDI4IDEuOTgxMjcsMS4xMzQxOGMwLjQ4NTY4LDAuNjE0ODkgMC42Nzk4MywxLjQ3NzQ3IDAuNTcxNDUsMS45MTIwN2MtMC4wNDQ0NywwLjE3NzQzIC0wLjE0Mzg3LDAuMzAzMzUgLTAuMjg3NzUsMC4zNjMzMmMtMC4zNjc3MSwwLjE1Mjk3IC0wLjYwOTYsLTAuMTIzMzIgLTEuMDM0MjgsLTAuOTAwNTV2MHoiLz48cGF0aCBkPSJNMjM3LjE3MTQ5LDE3Ny41OTQ0MWMwLDAgLTAuMzkyODQsLTEuMjUyNTUgLTAuNzU5MjgsLTEuNzY4ODRjLTAuMjE3MjYsLTAuMzYyOTIgLTAuNTMwNTMsLTAuODE1MjIgLTAuOTQ0NDYsLTAuNzg2ODdjLTAuNTEzNzIsMC4wMTM3OSAtMC43OTM2NCwwLjY0ODMzIC0xLjMwMDkzLDAuODUxMzljLTAuMzI4NjgsMC4xMzA0NyAtMS4xOTUwOCwwLjMwMTAxIC0xLjA2MTgxLDBjMC4zNTUzMiwtMC43NTYyOSAxLjc3MzQ4LC0xLjE4MTAxIDIuMTI3NjcsLTIuMTMwNjFjMC4xNTk1NCwtMC40Mjk5MiAtMC41Mzk2MiwtMC45NDMzNSAtMS4wMDMwNywtMS4wMzMxMWMtMC4zNDY3MywtMC4wNjUxNyAtMC41MTAxOSwwLjU0ODU1IC0wLjgyNjczLDAuNzMwNDFjLTAuMTQ1MzksMC4wODM2NCAtMC41NDgwOSwwLjE2OTc2IC0wLjQ3NDA3LDBjMC4yNjc3OSwtMC41Njc1NCAwLjU3Mzg2LC0xLjMwNDMzIDEuMTc5MjksLTEuNTIxMTdjMC40NTY4OCwtMC4xNjMxMiAwLjk1NTIsMC4zMjE2OSAxLjMwMDkyLDAuNjY1ODljMS4wNjkxMywxLjA2NDcyIDEuOTcyNjgsMi4zMzMzOSAyLjkzNTU4LDMuNDY2NjdsMC41Njk4MSwwLjY2ODQ5YzAsMCAwLjQwNzM3LDAuNTE0NiAwLjcxODk5LDAuODU0MTFjMC4wMDU1NiwwLjAwNTg1IDAuMzAwMzgsLTAuMDQxMjQgMC41MDM4NywtMC4yMTU1NGMwLjE2NTk4LC0wLjE0MjU3IDAuMTQ0MTMsLTAuMzAyMTggMC4xOTY5MiwtMC42Mzc2NWMwLjA0ODUxLC0wLjMwODQyIDAuMTAxMzEsLTAuODY2MjIgMC4yNjE3MywtMC44NjkwOGMwLjI0MjAyLC0wLjAwMzc3IDAuNDAxMTgsMS4wMjM0OCAwLjQ2MzA3LDEuNDAzOTdsMC4wMzQzNiwwLjIwMzU4YzAuMDgxMjIsMC40NTI1NSAwLjUwNTEzLDEuODEzMzMgMC41MjM0NSwxLjg3MTA5YzAuMDA1ODEsMC4wMTQwNSAwLjAxNTI5LDAuMDMyMzkgMC4wMTUyOSwwLjAzMjM5bDAuMDAzNDEsMC4wMDcyOGwwLjAwNDgsMC4wMDYxMWMwLjY1NDk0LDAuODM2MyAxLjE0MTY1LDEuODUwMTQgMS4xNDE2NSwyLjc5OTg3YzAsMi4wMTE1NyAtMS43MTIyMiwzLjQyNzUxIC00LjAwMzg0LDMuNDI3NTFjLTAuNDI1MDUsMCAtMC44NDA4OCwtMC4wNjE1MyAtMS4yMzU3NSwtMC4xODE4NmwtMC4wMjEyMiwtMC4wMDYzN2MwLDAgLTAuNjE5OTYsLTAuMDUzNiAtMS40MTI5NywxLjAxOTg0Yy0wLjE1OTE2LDAuMjE1NTQgLTAuMTQ0ODgsMC40MTYzOSAtMC4zNjkwOSwwLjM1NDZjLTAuMDc0NzgsLTAuMDIwNTYgLTAuMTI5NiwtMC4wNzcxMyAtMC4xNzQ1NywtMC4xNzk5Yy0wLjEwNzExLC0wLjI0NTA4IC0wLjAyODA0LC0wLjgyNTYzIDAuMTAzMDgsLTEuMTk2MzZsMC4wMjA1OSwtMC4wNTgyOGwtMC4wNDczNywtMC4wMzg2M2MtMC4wMTE2MiwtMC4wMDk0OSAtMS4yOTc3NywtMC45NzQ3IC0xLjQyNzc1LC0yLjM1NzcyYy0wLjExMzE4LC0xLjIwNTU5IDAuNDc4MSwtMS44OTIwMyAwLjcyMzUzLC0yLjI2OTE0bDAuMTQxMSwtMC4yNDE2OWMwLjE3Nzk4LC0wLjQ0NTkyIC0wLjE1NzAxLC0xLjA2NjAyIC0wLjQ1MjU5LC0xLjYxMzE0Yy0wLjE3NjQ3LC0wLjMyNjY0IC0wLjQ2MTMxLC0wLjgwMzM4IC0wLjM5NzAxLC0wLjkxNTUxYzAuMDcxMzcsLTAuMTI0MSAwLjMyNjUzLDAuMDA4MDYgMC41ODQyMSwwLjEzNDVjMC4yMDg5MiwwLjEwMjg5IDAuNDA5OSwwLjI0ODIgMC41NDk0OCwwLjE1MjMzYzAuMTQ1MTQsLTAuMDk5NTEgMC4wNTAwMiwtMC4zNDk0IC0wLjA4MTk4LC0wLjY5NTQyYy0wLjEyNDA0LC0wLjMyNDk1IC0wLjM1ODg3LC0wLjgzODExIC0wLjI2ODY4LC0xLjA1MDAyYzAuMDI0ODksLTAuMDU4MTQgMC4wNjg0NywtMC4wOTkxMiAwLjEzMzI2LC0wLjEyNWMwLjIzOTYyLC0wLjA5NTQ4IDAuNTgyMTksMC4zMjAxMiAwLjg1OTU4LDAuNjQ1MzNjMC4zMzgyOCwwLjM5NjQ5IDAuNzIyMDIsMC44NDYzMSAxLjE2NzUzLDAuNTk2NTV2MHoiLz48cGF0aCBkPSJNMjMzLjE2MDIxLDE4NC44NzcyN2MtMC4xMzA4NiwtMC4wODU5OCAtMC4yMDYyOCwtMC4yMjgwMyAtMC4yMTg0LC0wLjQxMTE4Yy0wLjAyOTU2LC0wLjQ0ODEzIDAuMzE0NzgsLTEuMjU5NDUgMC45MDExNCwtMS43NzI0OWMwLjQwMDQyLC0wLjM1MDQ0IDEuODQ2MzUsLTAuODcyNDUgMi4xNDkxNCwtMC43NDE4NWMwLjAyNTAxLDAuMDEwOCAwLjA1ODQ4LDAuMDM4NjMgMC4wNTk2MiwwLjA1MjU1YzAuMDI4MywwLjA1NTU0IDAuMDI0NTEsMC4xNDU1NiAtMC4wMTc2OSwwLjIzMjk4Yy0wLjExNzEsMC4yNDI0NyAtMC4zOTY4OCwwLjU2MzkgLTAuNzA2NjEsMC44NjYzNGMtMC4yNDA3NiwwLjIzNTk2IC0wLjUxMzQ3LDAuNTAyNSAtMC43NjIzMiwwLjgwNDAzbC0wLjIyODI1LDAuMjc4NTFjLTAuNTU1NDEsMC42ODQ0OSAtMC44NDI1MywwLjkxMTA4IC0xLjE3NjY0LDAuNjkxMTJ2MHoiLz48L2c+PC9nPjxwYXRoIGQ9Ik0yNDYuMTQwNzIsMTczLjg0NDg0aDAuNzVjMC40MTQyLDAgMC43NSwwLjMzNTggMC43NSwwLjc1YzAsMC40MTQyIC0wLjMzNTgsMC43NSAtMC43NSwwLjc1aC0wLjc1djAuNzVjMCwwLjQxNDIgLTAuMzM1OCwwLjc1IC0wLjc1LDAuNzVjLTAuNDE0MiwwIC0wLjc1LC0wLjMzNTggLTAuNzUsLTAuNzV2LTAuNzVoLTAuNzVjLTAuNDE0MiwwIC0wLjc1LC0wLjMzNTggLTAuNzUsLTAuNzVjMCwtMC40MTQyIDAuMzM1OCwtMC43NSAwLjc1LC0wLjc1aDAuNzV2LTAuNzVjMCwtMC40MTQyIDAuMzM1OCwtMC43NSAwLjc1LC0wLjc1YzAuNDE0MiwwIDAuNzUsMC4zMzU4IDAuNzUsMC43NXoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMjMwLjI1Njg0LDE4OS43NDMxNnYtMTkuNDg2MzFoMTkuNDg2MzF2MTkuNDg2MzF6IiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9Im5vbnplcm8iIHN0cm9rZS13aWR0aD0iMCIvPjwvZz48L2c+PC9zdmc+PCEtLXJvdGF0aW9uQ2VudGVyOjkuNzQzMTU2MDc5NDcwNzM3OjkuNzQzMTU2MDc5NDcwNzM3LS0+";
  SymbolMorph.prototype.addBackdropSymbol = new Image();
  SymbolMorph.prototype.addBackdropSymbol.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMjBweCIgaGVpZ2h0PSIyMHB4IiB2aWV3Qm94PSIwIDAgMjAgMjAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDQ4LjIgKDQ3MzI3KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5iYWNrZHJvcC1saWJyYXJ5PC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGRlZnM+CiAgICAgICAgPHBhdGggZD0iTTE2Ljg5NzA1ODgsMy45ODUyOTQxMiBMMTcuNTU4ODIzNSwzLjk4NTI5NDEyIEMxNy45MjQzMDYxLDMuOTg1Mjk0MTIgMTguMjIwNTg4Miw0LjI4MTU3NjI3IDE4LjIyMDU4ODIsNC42NDcwNTg4MiBDMTguMjIwNTg4Miw1LjAxMjU0MTM4IDE3LjkyNDMwNjEsNS4zMDg4MjM1MyAxNy41NTg4MjM1LDUuMzA4ODIzNTMgTDE2Ljg5NzA1ODgsNS4zMDg4MjM1MyBMMTYuODk3MDU4OCw1Ljk3MDU4ODI0IEMxNi44OTcwNTg4LDYuMzM2MDcwNzkgMTYuNjAwNzc2Nyw2LjYzMjM1Mjk0IDE2LjIzNTI5NDEsNi42MzIzNTI5NCBDMTUuODY5ODExNiw2LjYzMjM1Mjk0IDE1LjU3MzUyOTQsNi4zMzYwNzA3OSAxNS41NzM1Mjk0LDUuOTcwNTg4MjQgTDE1LjU3MzUyOTQsNS4zMDg4MjM1MyBMMTQuOTExNzY0Nyw1LjMwODgyMzUzIEMxNC41NDYyODIyLDUuMzA4ODIzNTMgMTQuMjUsNS4wMTI1NDEzOCAxNC4yNSw0LjY0NzA1ODgyIEMxNC4yNSw0LjI4MTU3NjI3IDE0LjU0NjI4MjIsMy45ODUyOTQxMiAxNC45MTE3NjQ3LDMuOTg1Mjk0MTIgTDE1LjU3MzUyOTQsMy45ODUyOTQxMiBMMTUuNTczNTI5NCwzLjMyMzUyOTQxIEMxNS41NzM1Mjk0LDIuOTU4MDQ2ODYgMTUuODY5ODExNiwyLjY2MTc2NDcxIDE2LjIzNTI5NDEsMi42NjE3NjQ3MSBDMTYuNjAwNzc2NywyLjY2MTc2NDcxIDE2Ljg5NzA1ODgsMi45NTgwNDY4NiAxNi44OTcwNTg4LDMuMzIzNTI5NDEgTDE2Ljg5NzA1ODgsMy45ODUyOTQxMiBaIiBpZD0icGF0aC0xIi8+CiAgICA8L2RlZnM+CiAgICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iYmFja2Ryb3AtbGlicmFyeSI+CiAgICAgICAgICAgIDxnIGlkPSJiYWNrZHJvcC1saWItaWNvbiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMy44NTAwMDAsIDQuNjUwMDAwKSIgc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMS41Ij4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMi4yOTQzOTY0LDguMTMwNjIwNTQgTDkuODM1NTE3MTUsNS41OTc1NDk3OCBDOS40ODQyNDg2OCw1LjIzNTY4MjUzIDguODk4ODAxMjMsNS4xNzUzNzEzMiA4LjQ4ODk4ODAxLDUuNTM3MjM4NTcgTDUuNDQ0NjYxMjgsOC4wMDk5OTgxMyBDNC45NzYzMDMzMiw4LjM3MTg2NTM4IDQuMzMyMzExMTIsOC4zMTE1NTQxNyAzLjk4MTA0MjY1LDcuODI5MDY0NSBMMy42ODgzMTg5Myw3LjQ2NzE5NzI1IEMzLjMzNzA1MDQ2LDYuOTg0NzA3NTggMi42MzQ1MTM1Miw2LjkyNDM5NjM3IDIuMjI0NzAwMzEsNy4yODYyNjM2MiBMMCw5LjE1NTkxMTA5IEwwLDkuMTU1OTExMDkgQzQuODI2ODM4NDNlLTE2LDEwLjAwNzg3NTcgMC42OTA2NTM3NDcsMTAuNjk4NTI5NCAxLjU0MjYxODMyLDEwLjY5ODUyOTQgTDEwLjM1Mjk0MTIsMTAuNjk4NTI5NCBDMTEuNDU3NTEwNywxMC42OTg1Mjk0IDEyLjM1Mjk0MTIsOS44MDMwOTg5MSAxMi4zNTI5NDEyLDguNjk4NTI5NDEgTDEyLjM1Mjk0MTIsOC4xMzA2MjA1NCBMMTIuMjk0Mzk2NCw4LjEzMDYyMDU0IFoiIGlkPSJTaGFwZSIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTEyLjM1Mjk0MTIsMy41Mjk0MTE3NiBMMTIuMzUyOTQxMiw4LjgyMzUyOTQxIEMxMi4zNTI5NDEyLDkuNzk4MTQ5NTYgMTEuNTYyODU1NCwxMC41ODgyMzUzIDEwLjU4ODIzNTMsMTAuNTg4MjM1MyBMMS43NjQ3MDU4OCwxMC41ODgyMzUzIEMwLjc5MDA4NTczNiwxMC41ODgyMzUzIDEuMTkzNTY1NDRlLTE2LDkuNzk4MTQ5NTYgMCw4LjgyMzUyOTQxIEwwLDEuNzY0NzA1ODggQy0xLjE5MzU2NTQ0ZS0xNiwwLjc5MDA4NTczNiAwLjc5MDA4NTczNiw0LjYxOTkyNjkxZS0xNSAxLjc2NDcwNTg4LDQuNDQwODkyMWUtMTUgTDguODIzNTI5NDEsNC40NDA4OTIxZS0xNSIgaWQ9IlJlY3RhbmdsZSIvPgogICAgICAgICAgICA8L2c+CiAgICAgICAgICAgIDxnIGlkPSJDb21iaW5lZC1TaGFwZSI+CiAgICAgICAgICAgICAgICA8dXNlIGZpbGw9IiNGRkZGRkYiIGZpbGwtcnVsZT0iZXZlbm9kZCIgeGxpbms6aHJlZj0iI3BhdGgtMSIvPgogICAgICAgICAgICAgICAgPHBhdGggc3Ryb2tlPSIjRkZGRkZGIiBzdHJva2Utd2lkdGg9IjAuMSIgZD0iTTE2Ljk0NzA1ODgsMy45MzUyOTQxMiBMMTcuNTU4ODIzNSwzLjkzNTI5NDEyIEMxNy45NTE5MjAzLDMuOTM1Mjk0MTIgMTguMjcwNTg4Miw0LjI1Mzk2MjAzIDE4LjI3MDU4ODIsNC42NDcwNTg4MiBDMTguMjcwNTg4Miw1LjA0MDE1NTYyIDE3Ljk1MTkyMDMsNS4zNTg4MjM1MyAxNy41NTg4MjM1LDUuMzU4ODIzNTMgTDE2Ljk0NzA1ODgsNS4zMDg4MjM1MyBMMTYuOTQ3MDU4OCw1Ljk3MDU4ODI0IEMxNi45NDcwNTg4LDYuMzYzNjg1MDMgMTYuNjI4MzkwOSw2LjY4MjM1Mjk0IDE2LjIzNTI5NDEsNi42ODIzNTI5NCBDMTUuODQyMTk3Myw2LjY4MjM1Mjk0IDE1LjUyMzUyOTQsNi4zNjM2ODUwMyAxNS41MjM1Mjk0LDUuOTcwNTg4MjQgTDE1LjU3MzUyOTQsNS4zNTg4MjM1MyBMMTQuOTExNzY0Nyw1LjM1ODgyMzUzIEMxNC41MTg2Njc5LDUuMzU4ODIzNTMgMTQuMiw1LjA0MDE1NTYyIDE0LjIsNC42NDcwNTg4MiBDMTQuMiw0LjI1Mzk2MjAzIDE0LjUxODY2NzksMy45MzUyOTQxMiAxNC45MTE3NjQ3LDMuOTM1Mjk0MTIgTDE1LjUyMzUyOTQsMy45ODUyOTQxMiBMMTUuNTIzNTI5NCwzLjMyMzUyOTQxIEMxNS41MjM1Mjk0LDIuOTMwNDMyNjIgMTUuODQyMTk3MywyLjYxMTc2NDcxIDE2LjIzNTI5NDEsMi42MTE3NjQ3MSBDMTYuNjI4MzkwOSwyLjYxMTc2NDcxIDE2Ljk0NzA1ODgsMi45MzA0MzI2MiAxNi45NDcwNTg4LDMuMzIzNTI5NDEgTDE2Ljk0NzA1ODgsMy45MzUyOTQxMiBaIi8+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==";
  SymbolMorph.prototype.flagSymbol = new Image();
  SymbolMorph.prototype.flagSymbol.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJMYXllcl8xIiBkYXRhLW5hbWU9IkxheWVyIDEiIHdpZHRoPSIxNi42MyIgaGVpZ2h0PSIxNy41IiB2aWV3Qm94PSIwIDAgMTYuNjMgMTcuNSI+CiAgICA8ZGVmcz4KICAgICAgICA8c3R5bGU+LmNscy0xLC5jbHMtMntmaWxsOiM0Y2JmNTY7c3Ryb2tlOiM0NTk5M2Q7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO30uY2xzLTJ7c3Ryb2tlLXdpZHRoOjEuNXB4O308L3N0eWxlPgogICAgPC9kZWZzPgogICAgPHRpdGxlPmljb24tLWdyZWVuLWZsYWc8L3RpdGxlPgogICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNLjc1LDJBNi40NCw2LjQ0LDAsMCwxLDguNDQsMmgwYTYuNDQsNi40NCwwLDAsMCw3LjY5LDBWMTIuNGE2LjQ0LDYuNDQsMCwwLDEtNy42OSwwaDBhNi40NCw2LjQ0LDAsMCwwLTcuNjksMCIvPgogICAgPGxpbmUgY2xhc3M9ImNscy0yIiB4MT0iMC43NSIgeTE9IjE2Ljc1IiB4Mj0iMC43NSIgeTI9IjAuNzUiLz4KPC9zdmc+";
  SymbolMorph.prototype.flagSymbolRed = new Image();
  SymbolMorph.prototype.flagSymbolRed.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJMYXllcl8xIiBkYXRhLW5hbWU9IkxheWVyIDEiIHdpZHRoPSIxNi42MyIgaGVpZ2h0PSIxNy41IiB2aWV3Qm94PSIwIDAgMTYuNjMgMTcuNSI+CiAgPGRlZnM+CiAgICA8c3R5bGU+LmNscy0xLC5jbHMtMntmaWxsOiM0Y2JmNTY7c3Ryb2tlOiM0NTk5M2Q7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO30uY2xzLTJ7c3Ryb2tlLXdpZHRoOjEuNXB4O308L3N0eWxlPgogIDwvZGVmcz4KICA8dGl0bGU+aWNvbi0tZ3JlZW4tZmxhZzwvdGl0bGU+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNLjc1LDJBNi40NCw2LjQ0LDAsMCwxLDguNDQsMmgwYTYuNDQsNi40NCwwLDAsMCw3LjY5LDBWMTIuNGE2LjQ0LDYuNDQsMCwwLDEtNy42OSwwaDBhNi40NCw2LjQ0LDAsMCwwLTcuNjksMCIgc3R5bGU9ImZpbGw6IHJnYigyMzYsIDg5LCA4OSk7IHN0cm9rZTogcmdiKDE4NCwgNzIsIDcyKTsiLz4KICA8bGluZSBjbGFzcz0iY2xzLTIiIHgxPSIwLjc1IiB5MT0iMTYuNzUiIHgyPSIwLjc1IiB5Mj0iMC43NSIgc3R5bGU9InN0cm9rZTogcmdiKDE4NCwgNzIsIDcyKTsgZmlsbDogcmdiKDIzNiwgODksIDg5KTsiLz4KPC9zdmc+";
  SymbolMorph.prototype.stopSymbol = new Image();
  SymbolMorph.prototype.stopSymbol.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjE0IiBoZWlnaHQ9IjE0IiB2aWV3Qm94PSIwIDAgMTQgMTQiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDE0IDE0OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6I0VDNTk1OTtzdHJva2U6I0I4NDg0ODtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MTA7fQo8L3N0eWxlPgo8cG9seWdvbiBjbGFzcz0ic3QwIiBwb2ludHM9IjQuMywwLjUgOS43LDAuNSAxMy41LDQuMyAxMy41LDkuNyA5LjcsMTMuNSA0LjMsMTMuNSAwLjUsOS43IDAuNSw0LjMgIi8+Cjwvc3ZnPg==";
  SymbolMorph.prototype.extensionSymbol = new Image();
  SymbolMorph.prototype.extensionSymbol.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjgiIGhlaWdodD0iMjgiICB2aWV3Qm94PSIwIDAgMjggMjgiIHZlcnNpb249IjEuMSI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDQzLjIgKDM5MDY5KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5hZGQgZXh0ZW5zaW9uPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGRlZnMvPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9ImFkZC1leHRlbnNpb24iPgogICAgICAgICAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0LjAwMDAwMCwgNS4wMDAwMDApIj4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xOCwxNS41MSBDMTgsMTUuNzg2IDE3Ljc3NiwxNi4wMSAxNy41LDE2LjAxIEw3LjE5NywxNi4wMSBDNy4wNjQsMTYuMDEgNi45MzcsMTYuMDYyIDYuODQ0LDE2LjE1NiBMNi4xNDYsMTYuODU0IEM2LjA1MywxNi45NDcgNS45MjYsMTcgNS43OTMsMTcgTDMuMjA3LDE3IEMzLjA3NCwxNyAyLjk0NywxNi45NDcgMi44NTQsMTYuODU0IEwyLjE1NiwxNi4xNTYgQzIuMDYyLDE2LjA2MiAxLjkzNiwxNi4wMSAxLjgwMywxNi4wMSBMMC41LDE2LjAxIEMwLjIyNCwxNi4wMSAwLDE1Ljc4NiAwLDE1LjUxIEwwLDExLjUgQzAsMTEuMjI0IDAuMjI0LDExIDAuNSwxMSBMMS43OTMsMTEgQzEuOTI2LDExIDIuMDUzLDExLjA1MyAyLjE0NiwxMS4xNDYgTDIuODU0LDExLjg1NCBDMi45NDcsMTEuOTQ3IDMuMDc0LDEyIDMuMjA3LDEyIEw1Ljc5MywxMiBDNS45MjYsMTIgNi4wNTMsMTEuOTQ3IDYuMTQ2LDExLjg1NCBMNi44NTQsMTEuMTQ2IEM2Ljk0NywxMS4wNTMgNy4wNzQsMTEgNy4yMDcsMTEgTDE3LjUsMTEgQzE3Ljc3NiwxMSAxOCwxMS4yMjQgMTgsMTEuNSBMMTgsMTUuNTEgWiBNMTIuOTk2MSw4LjUxIEMxMi45OTYxLDguNzg2IDEyLjc3MjEsOS4wMSAxMi40OTYxLDkuMDEgTDcuMTk3MSw5LjAxIEM3LjA2NDEsOS4wMSA2LjkzNzEsOS4wNjIgNi44NDQxLDkuMTU2IEw2LjE0NjEsOS44NTQgQzYuMDUzMSw5Ljk0NyA1LjkyNjEsMTAgNS43OTMxLDEwIEwzLjIwNzEsMTAgQzMuMDc0MSwxMCAyLjk0NzEsOS45NDcgMi44NTMxLDkuODU0IEwyLjE1NjEsOS4xNTYgQzIuMDYyMSw5LjA2MiAxLjkzNTEsOS4wMSAxLjgwMzEsOS4wMSBMMC41MDAxLDkuMDEgQzAuMjI0MSw5LjAxIDAuMDAwMSw4Ljc4NiAwLjAwMDEsOC41MSBMMC4wMDAxLDQuNSBDMC4wMDAxLDQuMjI0IDAuMjI0MSw0IDAuNTAwMSw0IEwxLjc5MzEsNCBDMS45MjYxLDQgMi4wNTMxLDQuMDUzIDIuMTQ2MSw0LjE0NiBMMi44NTMxLDQuODU0IEMyLjk0NzEsNC45NDcgMy4wNzQxLDUgMy4yMDcxLDUgTDUuNzkzMSw1IEM1LjkyNjEsNSA2LjA1MzEsNC45NDcgNi4xNDYxLDQuODU0IEw2Ljg1MzEsNC4xNDYgQzYuOTQ3MSw0LjA1MyA3LjA3NDEsNCA3LjIwNzEsNCBMMTIuNDk2MSw0IEMxMi43NzIxLDQgMTIuOTk2MSw0LjIyNCAxMi45OTYxLDQuNSBMMTIuOTk2MSw4LjUxIFoiIGlkPSJDb21iaW5lZC1TaGFwZSIgZmlsbD0iI0ZGRkZGRiIvPgogICAgICAgICAgICAgICAgPGcgaWQ9IisiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE2LjAwMDAwMCwgMC4wMDAwMDApIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMiwwIEwyLDQiIGlkPSJTaGFwZSIvPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik00LDIgTDAsMiIgaWQ9IlNoYXBlIi8+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==";
  SymbolMorph.prototype.extensionSymbolBlack = new Image();
  SymbolMorph.prototype.extensionSymbolBlack.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjgiIGhlaWdodD0iMjgiICB2aWV3Qm94PSIwIDAgMjggMjgiIHZlcnNpb249IjEuMSI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDQzLjIgKDM5MDY5KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5hZGQgZXh0ZW5zaW9uPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGRlZnMvPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9ImFkZC1leHRlbnNpb24iPgogICAgICAgICAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0LjAwMDAwMCwgNS4wMDAwMDApIj4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xOCwxNS41MSBDMTgsMTUuNzg2IDE3Ljc3NiwxNi4wMSAxNy41LDE2LjAxIEw3LjE5NywxNi4wMSBDNy4wNjQsMTYuMDEgNi45MzcsMTYuMDYyIDYuODQ0LDE2LjE1NiBMNi4xNDYsMTYuODU0IEM2LjA1MywxNi45NDcgNS45MjYsMTcgNS43OTMsMTcgTDMuMjA3LDE3IEMzLjA3NCwxNyAyLjk0NywxNi45NDcgMi44NTQsMTYuODU0IEwyLjE1NiwxNi4xNTYgQzIuMDYyLDE2LjA2MiAxLjkzNiwxNi4wMSAxLjgwMywxNi4wMSBMMC41LDE2LjAxIEMwLjIyNCwxNi4wMSAwLDE1Ljc4NiAwLDE1LjUxIEwwLDExLjUgQzAsMTEuMjI0IDAuMjI0LDExIDAuNSwxMSBMMS43OTMsMTEgQzEuOTI2LDExIDIuMDUzLDExLjA1MyAyLjE0NiwxMS4xNDYgTDIuODU0LDExLjg1NCBDMi45NDcsMTEuOTQ3IDMuMDc0LDEyIDMuMjA3LDEyIEw1Ljc5MywxMiBDNS45MjYsMTIgNi4wNTMsMTEuOTQ3IDYuMTQ2LDExLjg1NCBMNi44NTQsMTEuMTQ2IEM2Ljk0NywxMS4wNTMgNy4wNzQsMTEgNy4yMDcsMTEgTDE3LjUsMTEgQzE3Ljc3NiwxMSAxOCwxMS4yMjQgMTgsMTEuNSBMMTgsMTUuNTEgWiBNMTIuOTk2MSw4LjUxIEMxMi45OTYxLDguNzg2IDEyLjc3MjEsOS4wMSAxMi40OTYxLDkuMDEgTDcuMTk3MSw5LjAxIEM3LjA2NDEsOS4wMSA2LjkzNzEsOS4wNjIgNi44NDQxLDkuMTU2IEw2LjE0NjEsOS44NTQgQzYuMDUzMSw5Ljk0NyA1LjkyNjEsMTAgNS43OTMxLDEwIEwzLjIwNzEsMTAgQzMuMDc0MSwxMCAyLjk0NzEsOS45NDcgMi44NTMxLDkuODU0IEwyLjE1NjEsOS4xNTYgQzIuMDYyMSw5LjA2MiAxLjkzNTEsOS4wMSAxLjgwMzEsOS4wMSBMMC41MDAxLDkuMDEgQzAuMjI0MSw5LjAxIDAuMDAwMSw4Ljc4NiAwLjAwMDEsOC41MSBMMC4wMDAxLDQuNSBDMC4wMDAxLDQuMjI0IDAuMjI0MSw0IDAuNTAwMSw0IEwxLjc5MzEsNCBDMS45MjYxLDQgMi4wNTMxLDQuMDUzIDIuMTQ2MSw0LjE0NiBMMi44NTMxLDQuODU0IEMyLjk0NzEsNC45NDcgMy4wNzQxLDUgMy4yMDcxLDUgTDUuNzkzMSw1IEM1LjkyNjEsNSA2LjA1MzEsNC45NDcgNi4xNDYxLDQuODU0IEw2Ljg1MzEsNC4xNDYgQzYuOTQ3MSw0LjA1MyA3LjA3NDEsNCA3LjIwNzEsNCBMMTIuNDk2MSw0IEMxMi43NzIxLDQgMTIuOTk2MSw0LjIyNCAxMi45OTYxLDQuNSBMMTIuOTk2MSw4LjUxIFoiIGlkPSJDb21iaW5lZC1TaGFwZSIgZmlsbD0iIzAwMCIvPgogICAgICAgICAgICAgICAgPGcgaWQ9IisiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE2LjAwMDAwMCwgMC4wMDAwMDApIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMiwwIEwyLDQiIGlkPSJTaGFwZSIvPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik00LDIgTDAsMiIgaWQ9IlNoYXBlIi8+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==";
  SymbolMorph.prototype.notesImage = new Image();
  SymbolMorph.prototype.notesImage.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgICB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgNDAgNDAiPgogICAgPHRpdGxlPm11c2ljLWJsb2NrLWljb248L3RpdGxlPgogICAgPGRlZnM+CiAgICAgICAgPHBhdGggZD0iTTMyLjE4IDI1Ljg3NEMzMi42MzYgMjguMTU3IDMwLjUxMiAzMCAyNy40MzMgMzBjLTMuMDcgMC01LjkyMy0xLjg0My02LjM3Mi00LjEyNi0uNDU4LTIuMjg1IDEuNjY1LTQuMTM2IDQuNzQzLTQuMTM2LjY0NyAwIDEuMjgzLjA4NCAxLjg5LjIzNC4zMzguMDg2LjYzNy4xOC45MzguMzAyLjg3LS4wMi0uMTA0LTIuMjk0LTEuODM1LTEyLjIzLTIuMTM0LTEyLjMwMiAzLjA2LTEuODcgOC43NjgtMi43NTIgNS43MDgtLjg4NS4wNzYgNC44Mi0zLjY1IDMuODQ0LTMuNzI0LS45ODctNC42NS03LjE1My4yNjMgMTQuNzM4em0tMTYuOTk4IDUuOTlDMTUuNjMgMzQuMTQ4IDEzLjUwNyAzNiAxMC40NCAzNmMtMy4wNyAwLTUuOTIyLTEuODUyLTYuMzgtNC4xMzYtLjQ0OC0yLjI4NCAxLjY3NC00LjEzNSA0Ljc1LTQuMTM1IDEuMDAzIDAgMS45NzUuMTk2IDIuODU1LjU0My44MjItLjA1NS0uMTUtMi4zNzctMS44NjItMTIuMjI4LTIuMTMzLTEyLjMwMyAzLjA2LTEuODcgOC43NjQtMi43NTMgNS43MDYtLjg5NC4wNzYgNC44Mi0zLjY0OCAzLjgzNC0zLjcyNC0uOTg3LTQuNjUtNy4xNTIuMjYyIDE0LjczOHoiIGlkPSJhIi8+CiAgICA8L2RlZnM+CiAgICA8ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDx1c2UgZmlsbD0iI0ZGRiIgeGxpbms6aHJlZj0iI2EiLz4KICAgICAgICA8cGF0aCBzdHJva2Utb3BhY2l0eT0iLjEiIHN0cm9rZT0iIzAwMCIgZD0iTTI4LjQ1NiAyMS42NzVjLS4wMS0uMzEyLS4wODctLjgyNS0uMjU2LTEuNzAyLS4wOTYtLjQ5NS0uNjEyLTMuMDIyLS43NTMtMy43My0uMzk1LTEuOTgtLjc2LTMuOTItMS4xNDItNi4xMTMtLjczMi00LjIyMy0uNjkzLTYuMDUuMzQ0LTYuNTI3LjUtLjIzIDEuMDYtLjA4IDEuODQuMzUuNDE0LjIyNyAyLjE4MiAxLjM2NSAyLjA3IDEuMjk2IDEuOTk0IDEuMjQyIDMuNDY0IDEuNzc0IDQuOTMgMS41NDggMS41MjYtLjIzNyAyLjUwNC0uMDYgMi44NzYuNjE4LjM0OC42MzUuMDE1IDEuNDE2LS43MyAyLjE4LTEuNDcyIDEuNTE2LTMuOTc1IDIuNTE0LTUuODQ4IDIuMDIzLS44MjItLjIyLTEuMjM4LS40NjUtMi4zOC0xLjI2N2wtLjA5NS0uMDY2Yy4wNDcuNTkzLjI2NCAxLjc0LjcxNyAzLjgwMy4yOTQgMS4zMzYgMi4wOCA5LjE4NyAyLjYzNyAxMS42NzRsLjAwMi4wMTJjLjUyOCAyLjYzNy0xLjg3MyA0LjcyNC01LjIzNiA0LjcyNC0zLjI5IDAtNi4zNjMtMS45ODgtNi44NjItNC41MjgtLjUzLTIuNjQgMS44NzMtNC43MzQgNS4yMzMtNC43MzQuNjcyIDAgMS4zNDcuMDg1IDIuMDE0LjI1LjIyNy4wNTcuNDM2LjExOC42MzYuMTg3em0tMTYuOTk2IDUuOTljLS4wMS0uMzE4LS4wOS0uODM4LS4yNjYtMS43MzctLjA5LS40Ni0uNTk1LTIuOTM3LS43NTMtMy43MjctLjM5LTEuOTYtLjc1LTMuODktMS4xMy02LjA3LS43MzItNC4yMjMtLjY5Mi02LjA1LjM0NC02LjUyNi41MDItLjIzIDEuMDYtLjA4MiAxLjg0LjM1LjQxNS4yMjcgMi4xODIgMS4zNjQgMi4wNyAxLjI5NSAxLjk5MyAxLjI0MiAzLjQ2MiAxLjc3NCA0LjkyNiAxLjU0OCAxLjUyNS0uMjQgMi41MDQtLjA2NCAyLjg3Ni42MTQuMzQ4LjYzNS4wMTUgMS40MTUtLjcyOCAyLjE4LTEuNDc0IDEuNTE3LTMuOTc3IDIuNTEzLTUuODQ3IDIuMDE3LS44Mi0uMjItMS4yMzYtLjQ2NC0yLjM3OC0xLjI2N2wtLjA5NS0uMDY1Yy4wNDcuNTkzLjI2NCAxLjc0LjcxNyAzLjgwMi4yOTQgMS4zMzcgMi4wNzggOS4xOSAyLjYzNiAxMS42NzVsLjAwMy4wMTNjLjUxNyAyLjYzOC0xLjg4NCA0LjczMi01LjIzNCA0LjczMi0zLjI4NyAwLTYuMzYtMS45OTMtNi44Ny00LjU0LS41Mi0yLjY0IDEuODg0LTQuNzMgNS4yNC00LjczLjkwNSAwIDEuODAzLjE1IDIuNjUuNDM2eiIvPgogICAgPC9nPgo8L3N2Zz4=";
  SymbolMorph.prototype.notesImageBlack = new Image();
  SymbolMorph.prototype.notesImageBlack.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgICB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgNDAgNDAiPgogICAgPHRpdGxlPm11c2ljLWJsb2NrLWljb248L3RpdGxlPgogICAgPGRlZnM+CiAgICAgICAgPHBhdGggZD0iTTMyLjE4IDI1Ljg3NEMzMi42MzYgMjguMTU3IDMwLjUxMiAzMCAyNy40MzMgMzBjLTMuMDcgMC01LjkyMy0xLjg0My02LjM3Mi00LjEyNi0uNDU4LTIuMjg1IDEuNjY1LTQuMTM2IDQuNzQzLTQuMTM2LjY0NyAwIDEuMjgzLjA4NCAxLjg5LjIzNC4zMzguMDg2LjYzNy4xOC45MzguMzAyLjg3LS4wMi0uMTA0LTIuMjk0LTEuODM1LTEyLjIzLTIuMTM0LTEyLjMwMiAzLjA2LTEuODcgOC43NjgtMi43NTIgNS43MDgtLjg4NS4wNzYgNC44Mi0zLjY1IDMuODQ0LTMuNzI0LS45ODctNC42NS03LjE1My4yNjMgMTQuNzM4em0tMTYuOTk4IDUuOTlDMTUuNjMgMzQuMTQ4IDEzLjUwNyAzNiAxMC40NCAzNmMtMy4wNyAwLTUuOTIyLTEuODUyLTYuMzgtNC4xMzYtLjQ0OC0yLjI4NCAxLjY3NC00LjEzNSA0Ljc1LTQuMTM1IDEuMDAzIDAgMS45NzUuMTk2IDIuODU1LjU0My44MjItLjA1NS0uMTUtMi4zNzctMS44NjItMTIuMjI4LTIuMTMzLTEyLjMwMyAzLjA2LTEuODcgOC43NjQtMi43NTMgNS43MDYtLjg5NC4wNzYgNC44Mi0zLjY0OCAzLjgzNC0zLjcyNC0uOTg3LTQuNjUtNy4xNTIuMjYyIDE0LjczOHoiIGlkPSJhIi8+CiAgICA8L2RlZnM+CiAgICA8ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDx1c2UgZmlsbD0iIzAwMCIgeGxpbms6aHJlZj0iI2EiLz4KICAgICAgICA8cGF0aCBzdHJva2Utb3BhY2l0eT0iMC4yIiBzdHJva2U9IiMwMDAiIGQ9Ik0yOC40NTYgMjEuNjc1Yy0uMDEtLjMxMi0uMDg3LS44MjUtLjI1Ni0xLjcwMi0uMDk2LS40OTUtLjYxMi0zLjAyMi0uNzUzLTMuNzMtLjM5NS0xLjk4LS43Ni0zLjkyLTEuMTQyLTYuMTEzLS43MzItNC4yMjMtLjY5My02LjA1LjM0NC02LjUyNy41LS4yMyAxLjA2LS4wOCAxLjg0LjM1LjQxNC4yMjcgMi4xODIgMS4zNjUgMi4wNyAxLjI5NiAxLjk5NCAxLjI0MiAzLjQ2NCAxLjc3NCA0LjkzIDEuNTQ4IDEuNTI2LS4yMzcgMi41MDQtLjA2IDIuODc2LjYxOC4zNDguNjM1LjAxNSAxLjQxNi0uNzMgMi4xOC0xLjQ3MiAxLjUxNi0zLjk3NSAyLjUxNC01Ljg0OCAyLjAyMy0uODIyLS4yMi0xLjIzOC0uNDY1LTIuMzgtMS4yNjdsLS4wOTUtLjA2NmMuMDQ3LjU5My4yNjQgMS43NC43MTcgMy44MDMuMjk0IDEuMzM2IDIuMDggOS4xODcgMi42MzcgMTEuNjc0bC4wMDIuMDEyYy41MjggMi42MzctMS44NzMgNC43MjQtNS4yMzYgNC43MjQtMy4yOSAwLTYuMzYzLTEuOTg4LTYuODYyLTQuNTI4LS41My0yLjY0IDEuODczLTQuNzM0IDUuMjMzLTQuNzM0LjY3MiAwIDEuMzQ3LjA4NSAyLjAxNC4yNS4yMjcuMDU3LjQzNi4xMTguNjM2LjE4N3ptLTE2Ljk5NiA1Ljk5Yy0uMDEtLjMxOC0uMDktLjgzOC0uMjY2LTEuNzM3LS4wOS0uNDYtLjU5NS0yLjkzNy0uNzUzLTMuNzI3LS4zOS0xLjk2LS43NS0zLjg5LTEuMTMtNi4wNy0uNzMyLTQuMjIzLS42OTItNi4wNS4zNDQtNi41MjYuNTAyLS4yMyAxLjA2LS4wODIgMS44NC4zNS40MTUuMjI3IDIuMTgyIDEuMzY0IDIuMDcgMS4yOTUgMS45OTMgMS4yNDIgMy40NjIgMS43NzQgNC45MjYgMS41NDggMS41MjUtLjI0IDIuNTA0LS4wNjQgMi44NzYuNjE0LjM0OC42MzUuMDE1IDEuNDE1LS43MjggMi4xOC0xLjQ3NCAxLjUxNy0zLjk3NyAyLjUxMy01Ljg0NyAyLjAxNy0uODItLjIyLTEuMjM2LS40NjQtMi4zNzgtMS4yNjdsLS4wOTUtLjA2NWMuMDQ3LjU5My4yNjQgMS43NC43MTcgMy44MDIuMjk0IDEuMzM3IDIuMDc4IDkuMTkgMi42MzYgMTEuNjc1bC4wMDMuMDEzYy41MTcgMi42MzgtMS44ODQgNC43MzItNS4yMzQgNC43MzItMy4yODcgMC02LjM2LTEuOTkzLTYuODctNC41NC0uNTItMi42NCAxLjg4NC00LjczIDUuMjQtNC43My45MDUgMCAxLjgwMy4xNSAyLjY1LjQzNnoiLz4KICAgIDwvZz4KPC9zdmc+";

  SymbolMorph.prototype.settingsSymbol = new Image();
  SymbolMorph.prototype.settingsSymbol.src =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04LjI3MjA2IDIuNjgzNzdDOC40MDgxOCAyLjI3NTQzIDguNzkwMzIgMiA5LjIyMDc1IDJIMTAuNzc5MkMxMS4yMDk3IDIgMTEuNTkxOCAyLjI3NTQzIDExLjcyNzkgMi42ODM3N0wxMi4zMjE5IDQuNDY1OEMxMi43OTE0IDQuNjYzIDEzLjIzMDQgNC45MTgxOCAxMy42MzAyIDUuMjIyMzhMMTUuNDcyMSA0Ljg0NTQ3QzE1Ljg5MzggNC43NTkxNyAxNi4zMjM0IDQuOTUyNCAxNi41Mzg2IDUuMzI1MTZMMTcuMzE3OCA2LjY3NDg1QzE3LjUzMyA3LjA0NzYxIDE3LjQ4NTYgNy41MTYyNyAxNy4yIDcuODM4MzJMMTUuOTUyOSA5LjI0NDY4QzE1Ljk4NCA5LjQ5MjA4IDE2IDkuNzQ0MTcgMTYgMTBDMTYgMTAuMjU1OCAxNS45ODQgMTAuNTA3OSAxNS45NTI5IDEwLjc1NTNMMTcuMiAxMi4xNjE3QzE3LjQ4NTYgMTIuNDgzNyAxNy41MzMgMTIuOTUyNCAxNy4zMTc4IDEzLjMyNTJMMTYuNTM4NiAxNC42NzQ4QzE2LjMyMzQgMTUuMDQ3NiAxNS44OTM4IDE1LjI0MDggMTUuNDcyMSAxNS4xNTQ1TDEzLjYzMDIgMTQuNzc3NkMxMy4yMzA0IDE1LjA4MTggMTIuNzkxNCAxNS4zMzcgMTIuMzIxOSAxNS41MzQyTDExLjcyNzkgMTcuMzE2MkMxMS41OTE4IDE3LjcyNDYgMTEuMjA5NyAxOCAxMC43NzkyIDE4SDkuMjIwNzVDOC43OTAzMiAxOCA4LjQwODE4IDE3LjcyNDYgOC4yNzIwNiAxNy4zMTYyTDcuNjc4MDUgMTUuNTM0MkM3LjIwODYyIDE1LjMzNyA2Ljc2OTU1IDE1LjA4MTggNi4zNjk4MiAxNC43Nzc2TDQuNTI3OTIgMTUuMTU0NUM0LjEwNjIzIDE1LjI0MDggMy42NzY2MyAxNS4wNDc2IDMuNDYxNDEgMTQuNjc0OEwyLjY4MjE3IDEzLjMyNTJDMi40NjY5NiAxMi45NTI0IDIuNTE0NDIgMTIuNDgzNyAyLjggMTIuMTYxN0w0LjA0NzA4IDEwLjc1NTNDNC4wMTYgMTAuNTA3OSAzLjk5OTk5IDEwLjI1NTggMy45OTk5OSAxMEMzLjk5OTk5IDkuNzQ0MTYgNC4wMTYgOS40OTIwNyA0LjA0NzA3IDkuMjQ0NjZMMi44IDcuODM4MzJDMi41MTQ0MiA3LjUxNjI3IDIuNDY2OTYgNy4wNDc2MSAyLjY4MjE3IDYuNjc0ODVMMy40NjE0MSA1LjMyNTE2QzMuNjc2NjMgNC45NTI0IDQuMTA2MjMgNC43NTkxNyA0LjUyNzkyIDQuODQ1NDdMNi4zNjk4IDUuMjIyMzhDNi43Njk1NCA0LjkxODE4IDcuMjA4NjEgNC42NjMgNy42NzgwNSA0LjQ2NThMOC4yNzIwNiAyLjY4Mzc3Wk05Ljk5OTk5IDhDOC44OTU0MiA4IDcuOTk5OTkgOC44OTU0MyA3Ljk5OTk5IDEwQzcuOTk5OTkgMTEuMTA0NiA4Ljg5NTQyIDEyIDkuOTk5OTkgMTJDMTEuMTA0NiAxMiAxMiAxMS4xMDQ2IDEyIDEwQzEyIDguODk1NDMgMTEuMTA0NiA4IDkuOTk5OTkgOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=";
  SymbolMorph.prototype.settingsSymbolBlack = new Image();
  SymbolMorph.prototype.settingsSymbolBlack.src =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04LjI3MjA2IDIuNjgzNzdDOC40MDgxOCAyLjI3NTQzIDguNzkwMzIgMiA5LjIyMDc1IDJIMTAuNzc5MkMxMS4yMDk3IDIgMTEuNTkxOCAyLjI3NTQzIDExLjcyNzkgMi42ODM3N0wxMi4zMjE5IDQuNDY1OEMxMi43OTE0IDQuNjYzIDEzLjIzMDQgNC45MTgxOCAxMy42MzAyIDUuMjIyMzhMMTUuNDcyMSA0Ljg0NTQ3QzE1Ljg5MzggNC43NTkxNyAxNi4zMjM0IDQuOTUyNCAxNi41Mzg2IDUuMzI1MTZMMTcuMzE3OCA2LjY3NDg1QzE3LjUzMyA3LjA0NzYxIDE3LjQ4NTYgNy41MTYyNyAxNy4yIDcuODM4MzJMMTUuOTUyOSA5LjI0NDY4QzE1Ljk4NCA5LjQ5MjA4IDE2IDkuNzQ0MTcgMTYgMTBDMTYgMTAuMjU1OCAxNS45ODQgMTAuNTA3OSAxNS45NTI5IDEwLjc1NTNMMTcuMiAxMi4xNjE3QzE3LjQ4NTYgMTIuNDgzNyAxNy41MzMgMTIuOTUyNCAxNy4zMTc4IDEzLjMyNTJMMTYuNTM4NiAxNC42NzQ4QzE2LjMyMzQgMTUuMDQ3NiAxNS44OTM4IDE1LjI0MDggMTUuNDcyMSAxNS4xNTQ1TDEzLjYzMDIgMTQuNzc3NkMxMy4yMzA0IDE1LjA4MTggMTIuNzkxNCAxNS4zMzcgMTIuMzIxOSAxNS41MzQyTDExLjcyNzkgMTcuMzE2MkMxMS41OTE4IDE3LjcyNDYgMTEuMjA5NyAxOCAxMC43NzkyIDE4SDkuMjIwNzVDOC43OTAzMiAxOCA4LjQwODE4IDE3LjcyNDYgOC4yNzIwNiAxNy4zMTYyTDcuNjc4MDUgMTUuNTM0MkM3LjIwODYyIDE1LjMzNyA2Ljc2OTU1IDE1LjA4MTggNi4zNjk4MiAxNC43Nzc2TDQuNTI3OTIgMTUuMTU0NUM0LjEwNjIzIDE1LjI0MDggMy42NzY2MyAxNS4wNDc2IDMuNDYxNDEgMTQuNjc0OEwyLjY4MjE3IDEzLjMyNTJDMi40NjY5NiAxMi45NTI0IDIuNTE0NDIgMTIuNDgzNyAyLjggMTIuMTYxN0w0LjA0NzA4IDEwLjc1NTNDNC4wMTYgMTAuNTA3OSAzLjk5OTk5IDEwLjI1NTggMy45OTk5OSAxMEMzLjk5OTk5IDkuNzQ0MTYgNC4wMTYgOS40OTIwNyA0LjA0NzA3IDkuMjQ0NjZMMi44IDcuODM4MzJDMi41MTQ0MiA3LjUxNjI3IDIuNDY2OTYgNy4wNDc2MSAyLjY4MjE3IDYuNjc0ODVMMy40NjE0MSA1LjMyNTE2QzMuNjc2NjMgNC45NTI0IDQuMTA2MjMgNC43NTkxNyA0LjUyNzkyIDQuODQ1NDdMNi4zNjk4IDUuMjIyMzhDNi43Njk1NCA0LjkxODE4IDcuMjA4NjEgNC42NjMgNy42NzgwNSA0LjQ2NThMOC4yNzIwNiAyLjY4Mzc3Wk05Ljk5OTk5IDhDOC44OTU0MiA4IDcuOTk5OTkgOC44OTU0MyA3Ljk5OTk5IDEwQzcuOTk5OTkgMTEuMTA0NiA4Ljg5NTQyIDEyIDkuOTk5OTkgMTJDMTEuMTA0NiAxMiAxMiAxMS4xMDQ2IDEyIDEwQzEyIDguODk1NDMgMTEuMTA0NiA4IDkuOTk5OTkgOFoiIGZpbGw9ImJsYWNrIi8+Cjwvc3ZnPgo=";
  SymbolMorph.prototype.settingsSymbolGrey = new Image();
  SymbolMorph.prototype.settingsSymbolGrey.src =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04LjI3MjA2IDIuNjgzNzdDOC40MDgxOCAyLjI3NTQzIDguNzkwMzIgMiA5LjIyMDc1IDJIMTAuNzc5MkMxMS4yMDk3IDIgMTEuNTkxOCAyLjI3NTQzIDExLjcyNzkgMi42ODM3N0wxMi4zMjE5IDQuNDY1OEMxMi43OTE0IDQuNjYzIDEzLjIzMDQgNC45MTgxOCAxMy42MzAyIDUuMjIyMzhMMTUuNDcyMSA0Ljg0NTQ3QzE1Ljg5MzggNC43NTkxNyAxNi4zMjM0IDQuOTUyNCAxNi41Mzg2IDUuMzI1MTZMMTcuMzE3OCA2LjY3NDg1QzE3LjUzMyA3LjA0NzYxIDE3LjQ4NTYgNy41MTYyNyAxNy4yIDcuODM4MzJMMTUuOTUyOSA5LjI0NDY4QzE1Ljk4NCA5LjQ5MjA4IDE2IDkuNzQ0MTcgMTYgMTBDMTYgMTAuMjU1OCAxNS45ODQgMTAuNTA3OSAxNS45NTI5IDEwLjc1NTNMMTcuMiAxMi4xNjE3QzE3LjQ4NTYgMTIuNDgzNyAxNy41MzMgMTIuOTUyNCAxNy4zMTc4IDEzLjMyNTJMMTYuNTM4NiAxNC42NzQ4QzE2LjMyMzQgMTUuMDQ3NiAxNS44OTM4IDE1LjI0MDggMTUuNDcyMSAxNS4xNTQ1TDEzLjYzMDIgMTQuNzc3NkMxMy4yMzA0IDE1LjA4MTggMTIuNzkxNCAxNS4zMzcgMTIuMzIxOSAxNS41MzQyTDExLjcyNzkgMTcuMzE2MkMxMS41OTE4IDE3LjcyNDYgMTEuMjA5NyAxOCAxMC43NzkyIDE4SDkuMjIwNzVDOC43OTAzMiAxOCA4LjQwODE4IDE3LjcyNDYgOC4yNzIwNiAxNy4zMTYyTDcuNjc4MDUgMTUuNTM0MkM3LjIwODYyIDE1LjMzNyA2Ljc2OTU1IDE1LjA4MTggNi4zNjk4MiAxNC43Nzc2TDQuNTI3OTIgMTUuMTU0NUM0LjEwNjIzIDE1LjI0MDggMy42NzY2MyAxNS4wNDc2IDMuNDYxNDEgMTQuNjc0OEwyLjY4MjE3IDEzLjMyNTJDMi40NjY5NiAxMi45NTI0IDIuNTE0NDIgMTIuNDgzNyAyLjggMTIuMTYxN0w0LjA0NzA4IDEwLjc1NTNDNC4wMTYgMTAuNTA3OSAzLjk5OTk5IDEwLjI1NTggMy45OTk5OSAxMEMzLjk5OTk5IDkuNzQ0MTYgNC4wMTYgOS40OTIwNyA0LjA0NzA3IDkuMjQ0NjZMMi44IDcuODM4MzJDMi41MTQ0MiA3LjUxNjI3IDIuNDY2OTYgNy4wNDc2MSAyLjY4MjE3IDYuNjc0ODVMMy40NjE0MSA1LjMyNTE2QzMuNjc2NjMgNC45NTI0IDQuMTA2MjMgNC43NTkxNyA0LjUyNzkyIDQuODQ1NDdMNi4zNjk4IDUuMjIyMzhDNi43Njk1NCA0LjkxODE4IDcuMjA4NjEgNC42NjMgNy42NzgwNSA0LjQ2NThMOC4yNzIwNiAyLjY4Mzc3Wk05Ljk5OTk5IDhDOC44OTU0MiA4IDcuOTk5OTkgOC44OTU0MyA3Ljk5OTk5IDEwQzcuOTk5OTkgMTEuMTA0NiA4Ljg5NTQyIDEyIDkuOTk5OTkgMTJDMTEuMTA0NiAxMiAxMiAxMS4xMDQ2IDEyIDEwQzEyIDguODk1NDMgMTEuMTA0NiA4IDkuOTk5OTkgOFoiIGZpbGw9IiM1NzVlNzUiLz4KPC9zdmc+Cg==";

  SymbolMorph.prototype.fileSymbol = new Image();
  SymbolMorph.prototype.fileSymbol.src =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiICB2aWV3Qm94PSIwIDAgMjAgMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNC45ODExNiAxSDE1LjAxOTZDMTYuNDA0MiAxIDE3LjYxNTggMi4yMTE1NCAxNy42MTU4IDMuNTk2MTVWMTAuODY1NEgxMy42MzVDMTEuMzg1IDEwLjg2NTQgOS42NTQyNCAxMi43NjkyIDkuNjU0MjQgMTQuODQ2MlYxOC44MjY5SDQuOTgxMTZDMy41OTY1NSAxOC44MjY5IDIuMzg1MDEgMTcuNjE1NCAyLjM4NTAxIDE2LjIzMDhWMy41OTYxNUMyLjM4NTAxIDIuMjExNTQgMy41OTY1NSAxIDQuOTgxMTYgMVpNNi4wMTk2MyA5LjgyNjkySDguNzg4ODZDOS40ODExNiA5LjgyNjkyIDEwLjAwMDQgOS40ODA3NyAxMC4wMDA0IDguNzg4NDZDMTAuMDAwNCA4LjA5NjE1IDkuNDgxMTYgNy43NSA4Ljk2MTkzIDcuNzVINi4wMTk2M0M1LjUwMDM5IDcuNzUgNC45ODExNiA4LjI2OTIzIDQuOTgxMTYgOC43ODg0NkM0Ljk4MTE2IDkuMzA3NjkgNS41MDAzOSA5LjgyNjkyIDYuMDE5NjMgOS44MjY5MlpNMTQuMTU0MiA1Ljg0NjE1SDYuMDE5NjNDNS4zMjczMiA1Ljg0NjE1IDQuOTgxMTYgNS4zMjY5MiA0Ljk4MTE2IDQuODA3NjlDNC45ODExNiA0LjI4ODQ2IDUuNTAwMzkgMy43NjkyMyA2LjAxOTYzIDMuNzY5MjNIMTQuMTU0MkMxNC42NzM1IDMuNzY5MjMgMTUuMTkyNyA0LjI4ODQ2IDE1LjE5MjcgNC44MDc2OUMxNS4wMTk2IDUuMzI2OTIgMTQuNjczNSA1Ljg0NjE1IDE0LjE1NDIgNS44NDYxNVpNMTcuNDQyNyAxMi4yNUgxMy40NjE5QzEyLjA3NzMgMTIuMjUgMTAuODY1OCAxMy40NjE1IDEwLjg2NTggMTUuMDE5MlYxOUwxNy40NDI3IDEyLjI1WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==";
  SymbolMorph.prototype.fileSymbolBlack = new Image();
  SymbolMorph.prototype.fileSymbolBlack.src =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiICB2aWV3Qm94PSIwIDAgMjAgMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNC45ODExNiAxSDE1LjAxOTZDMTYuNDA0MiAxIDE3LjYxNTggMi4yMTE1NCAxNy42MTU4IDMuNTk2MTVWMTAuODY1NEgxMy42MzVDMTEuMzg1IDEwLjg2NTQgOS42NTQyNCAxMi43NjkyIDkuNjU0MjQgMTQuODQ2MlYxOC44MjY5SDQuOTgxMTZDMy41OTY1NSAxOC44MjY5IDIuMzg1MDEgMTcuNjE1NCAyLjM4NTAxIDE2LjIzMDhWMy41OTYxNUMyLjM4NTAxIDIuMjExNTQgMy41OTY1NSAxIDQuOTgxMTYgMVpNNi4wMTk2MyA5LjgyNjkySDguNzg4ODZDOS40ODExNiA5LjgyNjkyIDEwLjAwMDQgOS40ODA3NyAxMC4wMDA0IDguNzg4NDZDMTAuMDAwNCA4LjA5NjE1IDkuNDgxMTYgNy43NSA4Ljk2MTkzIDcuNzVINi4wMTk2M0M1LjUwMDM5IDcuNzUgNC45ODExNiA4LjI2OTIzIDQuOTgxMTYgOC43ODg0NkM0Ljk4MTE2IDkuMzA3NjkgNS41MDAzOSA5LjgyNjkyIDYuMDE5NjMgOS44MjY5MlpNMTQuMTU0MiA1Ljg0NjE1SDYuMDE5NjNDNS4zMjczMiA1Ljg0NjE1IDQuOTgxMTYgNS4zMjY5MiA0Ljk4MTE2IDQuODA3NjlDNC45ODExNiA0LjI4ODQ2IDUuNTAwMzkgMy43NjkyMyA2LjAxOTYzIDMuNzY5MjNIMTQuMTU0MkMxNC42NzM1IDMuNzY5MjMgMTUuMTkyNyA0LjI4ODQ2IDE1LjE5MjcgNC44MDc2OUMxNS4wMTk2IDUuMzI2OTIgMTQuNjczNSA1Ljg0NjE1IDE0LjE1NDIgNS44NDYxNVpNMTcuNDQyNyAxMi4yNUgxMy40NjE5QzEyLjA3NzMgMTIuMjUgMTAuODY1OCAxMy40NjE1IDEwLjg2NTggMTUuMDE5MlYxOUwxNy40NDI3IDEyLjI1WiIgZmlsbD0iIzAwMCIvPgo8L3N2Zz4K";
  SymbolMorph.prototype.fileSymbolGrey = new Image();
  SymbolMorph.prototype.fileSymbolGrey.src =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiICB2aWV3Qm94PSIwIDAgMjAgMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNC45ODExNiAxSDE1LjAxOTZDMTYuNDA0MiAxIDE3LjYxNTggMi4yMTE1NCAxNy42MTU4IDMuNTk2MTVWMTAuODY1NEgxMy42MzVDMTEuMzg1IDEwLjg2NTQgOS42NTQyNCAxMi43NjkyIDkuNjU0MjQgMTQuODQ2MlYxOC44MjY5SDQuOTgxMTZDMy41OTY1NSAxOC44MjY5IDIuMzg1MDEgMTcuNjE1NCAyLjM4NTAxIDE2LjIzMDhWMy41OTYxNUMyLjM4NTAxIDIuMjExNTQgMy41OTY1NSAxIDQuOTgxMTYgMVpNNi4wMTk2MyA5LjgyNjkySDguNzg4ODZDOS40ODExNiA5LjgyNjkyIDEwLjAwMDQgOS40ODA3NyAxMC4wMDA0IDguNzg4NDZDMTAuMDAwNCA4LjA5NjE1IDkuNDgxMTYgNy43NSA4Ljk2MTkzIDcuNzVINi4wMTk2M0M1LjUwMDM5IDcuNzUgNC45ODExNiA4LjI2OTIzIDQuOTgxMTYgOC43ODg0NkM0Ljk4MTE2IDkuMzA3NjkgNS41MDAzOSA5LjgyNjkyIDYuMDE5NjMgOS44MjY5MlpNMTQuMTU0MiA1Ljg0NjE1SDYuMDE5NjNDNS4zMjczMiA1Ljg0NjE1IDQuOTgxMTYgNS4zMjY5MiA0Ljk4MTE2IDQuODA3NjlDNC45ODExNiA0LjI4ODQ2IDUuNTAwMzkgMy43NjkyMyA2LjAxOTYzIDMuNzY5MjNIMTQuMTU0MkMxNC42NzM1IDMuNzY5MjMgMTUuMTkyNyA0LjI4ODQ2IDE1LjE5MjcgNC44MDc2OUMxNS4wMTk2IDUuMzI2OTIgMTQuNjczNSA1Ljg0NjE1IDE0LjE1NDIgNS44NDYxNVpNMTcuNDQyNyAxMi4yNUgxMy40NjE5QzEyLjA3NzMgMTIuMjUgMTAuODY1OCAxMy40NjE1IDEwLjg2NTggMTUuMDE5MlYxOUwxNy40NDI3IDEyLjI1WiIgZmlsbD0iIzU3NWU3NSIvPgo8L3N2Zz4K";

  SymbolMorph.prototype.editSymbol = new Image();
  SymbolMorph.prototype.editSymbol.src =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjEiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMSAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik05LjY0NDY5IDE0LjUwN0M5LjU1ODYxIDE0LjU5MzEgOS40NjE0NSAxNC42NDg0IDkuMzQ1MjUgMTQuNzAwOEw3LjM3ODczIDE1LjUyNjZDNy4zMDcyOCAxNS4yODMgNy4xMzAzNCAxNC45NzM0IDYuODAzMjkgMTQuNjQ2M0M2LjQ4NzIxIDE0LjMzMDIgNi4xODg1MyAxNC4xNjQzIDUuOTUzNzggMTQuMDgxOUw2Ljc2OTc1IDEyLjEyNTNDNi44MTIxNyAxMS45OTkxIDYuODg4MjggMTEuOTAzMSA2Ljk3MzQ3IDExLjgxNzlDNi45OTMzIDExLjgxOCA3LjAxMjEzIDExLjc5OTIgNy4wMjIgMTEuNzg5M0w3LjA0OTc5IDExLjc2MTVDNy4xODI1MSAxMS42Mjg4IDcuMzY4OTYgMTEuNTQ4IDcuNTg3NDMgMTEuNTE5QzguMTQyNzggMTEuNDUwMiA4Ljc4NjU2IDExLjcxMzggOS4yNzIxNSAxMi4xOTk0QzkuNzU3NzMgMTIuNjg1IDEwLjAyMTMgMTMuMzI4OCA5Ljk0MTU4IDEzLjg3MzFDOS45MDk1NSAxNC4wNTI3IDkuODUwNDEgMTQuMjM3NSA5Ljc1NzU3IDE0LjM3NDJDOS43Mjk4OCAxNC40MjE5IDkuNjkyMjIgMTQuNDU5NSA5LjY1MzY2IDE0LjQ5ODFMOS42NDQ2OSAxNC41MDdaTTEyLjg2ODYgNS45NDI3NEMxMy4xNzUyIDUuNjM2MDYgMTMuNjQ1OCA1LjU3MDM2IDE0LjEyNzQgNS43MTQ4NkMxNC40MDY2IDUuNzk4NTkgMTQuNTIzMiA2LjE0NDcgMTQuMzMyMiA2LjMzNTdMOS43NTE3OSAxMC45MTYxQzkuNjQyMzkgMTEuMDI1NSA5LjQ2NDg4IDExLjA0MzUgOS4zMjEyMiAxMC45NTE4QzkuMTcyNzcgMTAuODU5IDkuMDE5MzQgMTAuNzc5MSA4Ljg2NDczIDEwLjcxMjNDOC42MTI1MiAxMC42MDM2IDguNTI0ODkgMTAuMjg2NCA4LjcwMTU0IDEwLjEwOThMMTIuODY4NiA1Ljk0Mjc0Wk0xNS41Mjg4IDguNjAyOTlMMTEuMzYyNyAxMi43NjkxQzExLjE4OTYgMTIuOTQyMiAxMC44NzEyIDEyLjg2NzcgMTAuNzY1NyAxMi42MjIzQzEwLjY5NzYgMTIuNDU5MSAxMC42MTI3IDEyLjMwMDcgMTAuNTE0OCAxMi4xNDcyQzEwLjQxODEgMTEuOTk2NyAxMC40NDIyIDExLjgwOTEgMTAuNTU2IDExLjY5NTJMMTUuMTI1NyA3LjEyNTZDMTUuMzE0OSA2LjkzNjM5IDE1LjY2MDkgNy4wNTEwNCAxNS43NDY1IDcuMzMwMzZDMTUuODk2IDcuODE3MDEgMTUuODM3MyA4LjI5NDUyIDE1LjUyODggOC42MDI5OVpNMTcuMzQ5NyA0LjEyMTgyQzE2LjE3ODEgMi45NTAyMyAxNC40ODgxIDIuNzM5NzkgMTMuNTc2MiAzLjY1MTc0TDYuMjIwNDQgMTEuMDA3NUM2LjA0MDIgMTEuMTg3NyA1Ljg4MDkgMTEuMzg4OSA1Ljc4NDQxIDExLjYzNDlMNC4yMzMxMiAxNS4zNTk5QzQuMDM4MDQgMTUuODMwMiA0LjE4OTA2IDE2LjQxNyA0LjYyMTggMTYuODQ5N0M1LjA1NDU0IDE3LjI4MjUgNS42NDEzNyAxNy40MzM1IDYuMTExNjUgMTcuMjM4NEw5LjgzNjYxIDE1LjY4NzFDMTAuMDgxNyAxNS41ODk2IDEwLjI4MjggMTUuNDMwMyAxMC40NjMxIDE1LjI1MDFMMTcuODE4OCA3Ljg5NDM4QzE4LjczMDggNi45ODI0MyAxOC41MjEzIDUuMjkzNDEgMTcuMzQ5NyA0LjEyMTgyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==";

  SymbolMorph.prototype.turnRightImage = new Image();
  SymbolMorph.prototype.turnRightImage.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMjIuNjggMTIuMmExLjYgMS42IDAgMCAxLTEuMjcuNjNoLTcuNjlhMS41OSAxLjU5IDAgMCAxLTEuMTYtMi41OGwxLjEyLTEuNDFhNC44MiA0LjgyIDAgMCAwLTMuMTQtLjc3IDQuMzEgNC4zMSAwIDAgMC0yIC44QTQuMjUgNC4yNSAwIDAgMCA3LjIgMTAuNmE1LjA2IDUuMDYgMCAwIDAgLjU0IDQuNjJBNS41OCA1LjU4IDAgMCAwIDEyIDE3Ljc0YTIuMjYgMi4yNiAwIDAgMS0uMTYgNC41MkExMC4yNSAxMC4yNSAwIDAgMSAzLjc0IDE4YTEwLjE0IDEwLjE0IDAgMCAxLTEuNDktOS4yMiA5LjcgOS43IDAgMCAxIDIuODMtNC4xNEE5LjkyIDkuOTIgMCAwIDEgOS42NiAyLjVhMTAuNjYgMTAuNjYgMCAwIDEgNy43MiAxLjY4bDEuMDgtMS4zNWExLjU3IDEuNTcgMCAwIDEgMS4yNC0uNiAxLjYgMS42IDAgMCAxIDEuNTQgMS4yMWwxLjcgNy4zN2ExLjU3IDEuNTcgMCAwIDEtLjI2IDEuMzlaIiBzdHlsZT0iZmlsbDojMDAwMyIvPjxwYXRoIGQ9Ik0yMS4zOCAxMS44M2gtNy42MWEuNTkuNTkgMCAwIDEtLjQzLTFsMS43NS0yLjE5YTUuOSA1LjkgMCAwIDAtNC43LTEuNTggNS4wNyA1LjA3IDAgMCAwLTQuMTEgMy4xN0E2IDYgMCAwIDAgNyAxNS43N2E2LjUxIDYuNTEgMCAwIDAgNSAyLjkyIDEuMzEgMS4zMSAwIDAgMS0uMDggMi42MiA5LjMgOS4zIDAgMCAxLTcuMzUtMy44MiA5LjE2IDkuMTYgMCAwIDEtMS40LTguMzdBOC41MSA4LjUxIDAgMCAxIDUuNzEgNS40YTguNzYgOC43NiAwIDAgMSA0LjExLTEuOTIgOS43MSA5LjcxIDAgMCAxIDcuNzUgMi4wN2wxLjY3LTIuMWEuNTkuNTkgMCAwIDEgMSAuMjFMMjIgMTEuMDhhLjU5LjU5IDAgMCAxLS42Mi43NVoiIHN0eWxlPSJmaWxsOiNmZmYiLz48L3N2Zz4=";
  SymbolMorph.prototype.turnRightImageBlack = new Image();
  SymbolMorph.prototype.turnRightImageBlack.src =
    "data:image/svg+xml;base64,PHN2ZyBpZD0icm90YXRlLWNvdW50ZXItY2xvY2t3aXNlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzAwMH08L3N0eWxlPjwvZGVmcz48cGF0aCBkPSJNMjEuMzggMTEuODNoLTcuNjFhLjU5LjU5IDAgMCAxLS40My0xbDEuNzUtMi4xOWE1LjkgNS45IDAgMCAwLTQuNy0xLjU4IDUuMDcgNS4wNyAwIDAgMC00LjExIDMuMTdBNiA2IDAgMCAwIDcgMTUuNzdhNi41MSA2LjUxIDAgMCAwIDUgMi45MiAxLjMxIDEuMzEgMCAwIDEtLjA4IDIuNjIgOS4zIDkuMyAwIDAgMS03LjM1LTMuODIgOS4xNiA5LjE2IDAgMCAxLTEuNC04LjM3QTguNTEgOC41MSAwIDAgMSA1LjcxIDUuNGE4Ljc2IDguNzYgMCAwIDEgNC4xMS0xLjkyIDkuNzEgOS43MSAwIDAgMSA3Ljc1IDIuMDdsMS42Ny0yLjFhLjU5LjU5IDAgMCAxIDEgLjIxTDIyIDExLjA4YS41OS41OSAwIDAgMS0uNjIuNzVaIiBzdHlsZT0iZmlsbDojMDAwIi8+PC9zdmc+";
  SymbolMorph.prototype.turnLeftImage = new Image();
  SymbolMorph.prototype.turnLeftImage.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMjAuMzQgMTguMjFhMTAuMjQgMTAuMjQgMCAwIDEtOC4xIDQuMjIgMi4yNiAyLjI2IDAgMCAxLS4xNi00LjUyIDUuNTggNS41OCAwIDAgMCA0LjI1LTIuNTMgNS4wNiA1LjA2IDAgMCAwIC41NC00LjYyQTQuMjUgNC4yNSAwIDAgMCAxNS41NSA5YTQuMzEgNC4zMSAwIDAgMC0yLS44IDQuODIgNC44MiAwIDAgMC0zLjE1LjhsMS4xMiAxLjQxQTEuNTkgMS41OSAwIDAgMSAxMC4zNiAxM0gyLjY3YTEuNTYgMS41NiAwIDAgMS0xLjI2LS42M0ExLjU0IDEuNTQgMCAwIDEgMS4xMyAxMWwxLjcyLTcuNDNBMS41OSAxLjU5IDAgMCAxIDQuMzggMi40YTEuNTcgMS41NyAwIDAgMSAxLjI0LjZMNi43IDQuMzVhMTAuNjYgMTAuNjYgMCAwIDEgNy43Mi0xLjY4QTkuODggOS44OCAwIDAgMSAxOSA0LjgxIDkuNjEgOS42MSAwIDAgMSAyMS44MyA5YTEwLjA4IDEwLjA4IDAgMCAxLTEuNDkgOS4yMVoiIHN0eWxlPSJmaWxsOiMwMDAzIi8+PHBhdGggZD0iTTE5LjU2IDE3LjY1YTkuMjkgOS4yOSAwIDAgMS03LjM1IDMuODMgMS4zMSAxLjMxIDAgMCAxLS4wOC0yLjYyIDYuNTMgNi41MyAwIDAgMCA1LTIuOTIgNi4wNSA2LjA1IDAgMCAwIC42Ny01LjUxIDUuMzIgNS4zMiAwIDAgMC0xLjY0LTIuMTYgNS4yMSA1LjIxIDAgMCAwLTIuNDgtMUE1Ljg2IDUuODYgMCAwIDAgOSA4Ljg0TDEwLjc0IDExYS41OS41OSAwIDAgMS0uNDMgMUgyLjdhLjYuNiAwIDAgMS0uNi0uNzVsMS43MS03LjQyYS41OS41OSAwIDAgMSAxLS4yMWwxLjY3IDIuMWE5LjcxIDkuNzEgMCAwIDEgNy43NS0yLjA3IDguODQgOC44NCAwIDAgMSA0LjEyIDEuOTIgOC42OCA4LjY4IDAgMCAxIDIuNTQgMy43MiA5LjE0IDkuMTQgMCAwIDEtMS4zMyA4LjM2WiIgc3R5bGU9ImZpbGw6I2ZmZiIvPjwvc3ZnPg==";
  SymbolMorph.prototype.turnLeftImageBlack = new Image();
  SymbolMorph.prototype.turnLeftImageBlack.src =
    "data:image/svg+xml;base64,PHN2ZyBpZD0icm90YXRlLWNsb2Nrd2lzZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiMzZDc5Y2N9PC9zdHlsZT48L2RlZnM+PHBhdGggZD0iTTE5LjU2IDE3LjY1YTkuMjkgOS4yOSAwIDAgMS03LjM1IDMuODMgMS4zMSAxLjMxIDAgMCAxLS4wOC0yLjYyIDYuNTMgNi41MyAwIDAgMCA1LTIuOTIgNi4wNSA2LjA1IDAgMCAwIC42Ny01LjUxIDUuMzIgNS4zMiAwIDAgMC0xLjY0LTIuMTYgNS4yMSA1LjIxIDAgMCAwLTIuNDgtMUE1Ljg2IDUuODYgMCAwIDAgOSA4Ljg0TDEwLjc0IDExYS41OS41OSAwIDAgMS0uNDMgMUgyLjdhLjYuNiAwIDAgMS0uNi0uNzVsMS43MS03LjQyYS41OS41OSAwIDAgMSAxLS4yMWwxLjY3IDIuMWE5LjcxIDkuNzEgMCAwIDEgNy43NS0yLjA3IDguODQgOC44NCAwIDAgMSA0LjEyIDEuOTIgOC42OCA4LjY4IDAgMCAxIDIuNTQgMy43MiA5LjE0IDkuMTQgMCAwIDEtMS4zMyA4LjM2WiIgc3R5bGU9ImZpbGw6IzAwMCIvPjwvc3ZnPg==";
  SymbolMorph.prototype.arrowImage = new Image();
  SymbolMorph.prototype.arrowImage.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTYgMTYiPgogIDxzdHlsZT4uc3Qye2ZpbGw6I2ZmZn08L3N0eWxlPgogIDxnIGlkPSJUdXRvcmlhbHNfeDJGX05hdmlnYXRpb25feDJGX05leHQiIHRyYW5zZm9ybT0ibWF0cml4KDAsIC0xLCAxLCAwLCAtNywgLTcpIiBzdHlsZT0idHJhbnNmb3JtLW9yaWdpbjogMTZweCAxNnB4OyI+CiAgICA8cGF0aCBkPSJNMjIuNiAxNi4zek0xNi4yIDE5bC01LjYtLjhhMi41IDIuNSAwIDAgMS0yLjEtMi40di0uM2MuMi0xLjEgMS0xLjkgMi0ybDUuNi0uOHYtMS4xYzAtLjcuNC0xLjMgMS0xLjYuNi0uMyAxLjMtLjEgMS44LjRsNC4zIDQuM2MuMy4zLjUuNy41IDEuMiAwIC40LS4yLjktLjUgMS4yTDE5IDIxLjRjLS41LjUtMS4yLjYtMS44LjMtLjYtLjMtMS0uOS0xLTEuNVYxOXoiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+CiAgICA8ZGVmcz4KICAgICAgPGZpbHRlciBpZD0iQWRvYmVfT3BhY2l0eU1hc2tGaWx0ZXIiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iNiIgeT0iNiIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIj4KICAgICAgICA8ZmVDb2xvck1hdHJpeCB2YWx1ZXM9IjEgMCAwIDAgMCAwIDEgMCAwIDAgMCAwIDEgMCAwIDAgMCAwIDEgMCIvPgogICAgICA8L2ZpbHRlcj4KICAgIDwvZGVmcz4KICAgIDxtYXNrIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9IjYiIHk9IjYiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgaWQ9Im1hc2stMl8xXyI+CiAgICAgIDxnIGZpbHRlcj0idXJsKCNBZG9iZV9PcGFjaXR5TWFza0ZpbHRlcikiPgogICAgICAgIDxwYXRoIGlkPSJwYXRoLTFfMV8iIGNsYXNzPSJzdDIiIGQ9Ik0yMyAxNi43IDE4LjcgMjFjLS40LjMtLjkuNC0xLjMuMnMtLjctLjYtLjctMS4xdi0xLjZsLTYtLjhjLTEtLjEtMS43LS45LTEuNy0xLjl2LS4yYy4xLS45LjgtMS41IDEuNi0xLjZsNi0uOXYtMS42YzAtLjUuMy0uOS43LTEuMS40LS4yLjktLjEgMS4zLjNMMjMgMTVjLjIuMi4zLjUuMy44bC0uMy45eiIvPgogICAgICA8L2c+CiAgICA8L21hc2s+CiAgICA8ZyBpZD0iQ29sb3JfeDJGX1doaXRlIiBtYXNrPSJ1cmwoI21hc2stMl8xXykiPgogICAgICA8cGF0aCBjbGFzcz0ic3QyIiBkPSJNNiA2aDIwdjIwSDZ6IiBpZD0iQ29sb3IiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==";
  SymbolMorph.prototype.arrowImageBlack = new Image();
  SymbolMorph.prototype.arrowImageBlack.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTYgMTYiPgogIDxzdHlsZT4uc3Qye2ZpbGw6I2ZmZn08L3N0eWxlPgogIDxnIGlkPSJUdXRvcmlhbHNfeDJGX05hdmlnYXRpb25feDJGX05leHQiIHRyYW5zZm9ybT0ibWF0cml4KDAsIC0xLCAxLCAwLCAtNywgLTcpIiBzdHlsZT0idHJhbnNmb3JtLW9yaWdpbjogMTZweCAxNnB4OyI+CiAgICA8cGF0aCBkPSJNMjIuNiAxNi4zek0xNi4yIDE5bC01LjYtLjhhMi41IDIuNSAwIDAgMS0yLjEtMi40di0uM2MuMi0xLjEgMS0xLjkgMi0ybDUuNi0uOHYtMS4xYzAtLjcuNC0xLjMgMS0xLjYuNi0uMyAxLjMtLjEgMS44LjRsNC4zIDQuM2MuMy4zLjUuNy41IDEuMiAwIC40LS4yLjktLjUgMS4yTDE5IDIxLjRjLS41LjUtMS4yLjYtMS44LjMtLjYtLjMtMS0uOS0xLTEuNVYxOXoiIHN0cm9rZS1vcGFjaXR5PSIuMSIgc3R5bGU9InN0cm9rZS1taXRlcmxpbWl0OiA0LjIyOyBzdHJva2Utd2lkdGg6IDBweDsiLz4KICAgIDxkZWZzPgogICAgICA8ZmlsdGVyIGlkPSJBZG9iZV9PcGFjaXR5TWFza0ZpbHRlciIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4PSI2IiB5PSI2IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiPgogICAgICAgIDxmZUNvbG9yTWF0cml4IHZhbHVlcz0iMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIDAgMCAwIDAgMSAwIi8+CiAgICAgIDwvZmlsdGVyPgogICAgPC9kZWZzPgogICAgPG1hc2sgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iNiIgeT0iNiIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBpZD0ibWFzay0yXzFfIj4KICAgICAgPGcgZmlsdGVyPSJ1cmwoI0Fkb2JlX09wYWNpdHlNYXNrRmlsdGVyKSI+CiAgICAgICAgPHBhdGggaWQ9InBhdGgtMV8xXyIgY2xhc3M9InN0MiIgZD0iTTIzIDE2LjcgMTguNyAyMWMtLjQuMy0uOS40LTEuMy4ycy0uNy0uNi0uNy0xLjF2LTEuNmwtNi0uOGMtMS0uMS0xLjctLjktMS43LTEuOXYtLjJjLjEtLjkuOC0xLjUgMS42LTEuNmw2LS45di0xLjZjMC0uNS4zLS45LjctMS4xLjQtLjIuOS0uMSAxLjMuM0wyMyAxNWMuMi4yLjMuNS4zLjhsLS4zLjl6Ii8+CiAgICAgIDwvZz4KICAgIDwvbWFzaz4KICAgIDxnIGlkPSJDb2xvcl94MkZfV2hpdGUiIG1hc2s9InVybCgjbWFzay0yXzFfKSI+CiAgICAgIDxwYXRoIGNsYXNzPSJzdDIiIGQ9Ik02IDZoMjB2MjBINnoiIGlkPSJDb2xvciIgc3R5bGU9InN0cm9rZS1taXRlcmxpbWl0OiA0LjIyOyBzdHJva2Utd2lkdGg6IDBweDsgZmlsbDogcmdiKDAsIDAsIDApOyIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+";
  SymbolMorph.prototype.arrowOutImage = new Image();
  SymbolMorph.prototype.arrowOutImage.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTYgMTYiPgogIDxzdHlsZT4uc3Qye2ZpbGw6I2ZmZn08L3N0eWxlPgogIDxnIGlkPSJUdXRvcmlhbHNfeDJGX05hdmlnYXRpb25feDJGX05leHQiIHRyYW5zZm9ybT0ibWF0cml4KDAsIC0xLCAxLCAwLCAtNywgLTcpIiBzdHlsZT0idHJhbnNmb3JtLW9yaWdpbjogMTZweCAxNnB4OyI+CiAgICA8cGF0aCBkPSJNIDIyLjUgMTYuNDM2IFogTSAxNi4xIDE5LjEzNiBMIDEwLjUgMTguMzM2IEMgOS4zMTUgMTguMTQ0IDguNDMzIDE3LjEzNiA4LjQgMTUuOTM2IEwgOC40IDE1LjYzNiBDIDguNiAxNC41MzYgOS40IDEzLjczNiAxMC40IDEzLjYzNiBMIDE2IDEyLjgzNiBMIDE2IDExLjczNiBDIDE2IDExLjAzNiAxNi40IDEwLjQzNiAxNyAxMC4xMzYgQyAxNy42IDkuODM2IDE4LjMgMTAuMDM2IDE4LjggMTAuNTM2IEwgMjMuMSAxNC44MzYgQyAyMy40IDE1LjEzNiAyMy42IDE1LjUzNiAyMy42IDE2LjAzNiBDIDIzLjYgMTYuNDM2IDIzLjQgMTYuOTM2IDIzLjEgMTcuMjM2IEwgMTguOSAyMS41MzYgQyAxOC40IDIyLjAzNiAxNy43IDIyLjEzNiAxNy4xIDIxLjgzNiBDIDE2LjUgMjEuNTM2IDE2LjEgMjAuOTM2IDE2LjEgMjAuMzM2IEwgMTYuMSAxOS4xMzYgWiIgc3R5bGU9ImZpbGw6IG5vbmU7IHN0cm9rZTogcmdiKDI1NSwgMjU1LCAyNTUpOyIvPgogIDwvZz4KPC9zdmc+";
  SymbolMorph.prototype.arrowOutImageBlack = new Image();
  SymbolMorph.prototype.arrowOutImageBlack.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTYgMTYiPgogIDxzdHlsZT4uc3Qye2ZpbGw6I2ZmZn08L3N0eWxlPgogIDxnIGlkPSJUdXRvcmlhbHNfeDJGX05hdmlnYXRpb25feDJGX05leHQiIHRyYW5zZm9ybT0ibWF0cml4KDAsIC0xLCAxLCAwLCAtNywgLTcpIiBzdHlsZT0idHJhbnNmb3JtLW9yaWdpbjogMTZweCAxNnB4OyI+CiAgICA8cGF0aCBkPSJNIDIyLjUgMTYuNDM2IFogTSAxNi4xIDE5LjEzNiBMIDEwLjUgMTguMzM2IEMgOS4zMTUgMTguMTQ0IDguNDMzIDE3LjEzNiA4LjQgMTUuOTM2IEwgOC40IDE1LjYzNiBDIDguNiAxNC41MzYgOS40IDEzLjczNiAxMC40IDEzLjYzNiBMIDE2IDEyLjgzNiBMIDE2IDExLjczNiBDIDE2IDExLjAzNiAxNi40IDEwLjQzNiAxNyAxMC4xMzYgQyAxNy42IDkuODM2IDE4LjMgMTAuMDM2IDE4LjggMTAuNTM2IEwgMjMuMSAxNC44MzYgQyAyMy40IDE1LjEzNiAyMy42IDE1LjUzNiAyMy42IDE2LjAzNiBDIDIzLjYgMTYuNDM2IDIzLjQgMTYuOTM2IDIzLjEgMTcuMjM2IEwgMTguOSAyMS41MzYgQyAxOC40IDIyLjAzNiAxNy43IDIyLjEzNiAxNy4xIDIxLjgzNiBDIDE2LjUgMjEuNTM2IDE2LjEgMjAuOTM2IDE2LjEgMjAuMzM2IEwgMTYuMSAxOS4xMzYgWiIgc3R5bGU9ImZpbGw6IG5vbmU7IHN0cm9rZTogcmdiKDAsIDAsIDApOyIvPgogIDwvZz4KPC9zdmc+";
  SymbolMorph.prototype.loopSymbol = new Image();
  SymbolMorph.prototype.loopSymbol.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMjQgMjQiIHhtbDpzcGFjZT0icHJlc2VydmUiPgogICAgPHBhdGggZD0iTTIzLjMgMTFjLS4zLjYtLjkgMS0xLjUgMWgtMS42Yy0uMSAxLjMtLjUgMi41LTEuMSAzLjYtLjkgMS43LTIuMyAzLjItNC4xIDQuMS0xLjcuOS0zLjYgMS4yLTUuNS45LTEuOC0uMy0zLjUtMS4xLTQuOS0yLjMtLjctLjctLjctMS45IDAtMi42LjYtLjYgMS42LS43IDIuMy0uMkg3Yy45LjYgMS45LjkgMi45LjlzMS45LS4zIDIuNy0uOWMxLjEtLjggMS44LTIuMSAxLjgtMy41aC0xLjVjLS45IDAtMS43LS43LTEuNy0xLjcgMC0uNC4yLS45LjUtMS4ybDQuNC00LjRjLjctLjYgMS43LS42IDIuNCAwTDIzIDkuMmMuNS41LjYgMS4yLjMgMS44eiIgc3R5bGU9ImZpbGw6IzAwMDMiLz4KICAgIDxwYXRoIGQ9Ik0yMS44IDExaC0yLjZjMCAxLjUtLjMgMi45LTEgNC4yLS44IDEuNi0yLjEgMi44LTMuNyAzLjYtMS41LjgtMy4zIDEuMS00LjkuOC0xLjYtLjItMy4yLTEtNC40LTIuMS0uNC0uMy0uNC0uOS0uMS0xLjIuMy0uNC45LS40IDEuMi0uMSAxIC43IDIuMiAxLjEgMy40IDEuMXMyLjMtLjMgMy4zLTFjLjktLjYgMS42LTEuNSAyLTIuNi4zLS45LjQtMS44LjItMi44aC0yLjRjLS40IDAtLjctLjMtLjctLjcgMC0uMi4xLS4zLjItLjRsNC40LTQuNGMuMy0uMy43LS4zLjkgMEwyMiA5LjhjLjMuMy40LjYuMy45cy0uMy4zLS41LjN6IiBzdHlsZT0iZmlsbDojZmZmIi8+Cjwvc3ZnPg==";
  SymbolMorph.prototype.loopSymbolBlack = new Image();
  SymbolMorph.prototype.loopSymbolBlack.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciICB3aWR0aD0iMjQiIGhlaWdodD0iMjQiICB2aWV3Qm94PSIwIDAgMjQgMjQiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDI0IDI0IiB4bWw6c3BhY2U9InByZXNlcnZlIj48cGF0aCBkPSJNMjEuOCAxMWgtMi42YzAgMS41LS4zIDIuOS0xIDQuMi0uOCAxLjYtMi4xIDIuOC0zLjcgMy42LTEuNS44LTMuMyAxLjEtNC45LjgtMS42LS4yLTMuMi0xLTQuNC0yLjEtLjQtLjMtLjQtLjktLjEtMS4yLjMtLjQuOS0uNCAxLjItLjEgMSAuNyAyLjIgMS4xIDMuNCAxLjFzMi4zLS4zIDMuMy0xYy45LS42IDEuNi0xLjUgMi0yLjYuMy0uOS40LTEuOC4yLTIuOGgtMi40Yy0uNCAwLS43LS4zLS43LS43IDAtLjIuMS0uMy4yLS40bDQuNC00LjRjLjMtLjMuNy0uMy45IDBMMjIgOS44Yy4zLjMuNC42LjMuOXMtLjMuMy0uNS4zeiIgc3R5bGU9ImZpbGw6IzAwMCIvPjwvc3ZnPg==";

  SymbolMorph.prototype.selectImage = new Image();
  SymbolMorph.prototype.selectImage.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAxNCAxNCIgdmVyc2lvbj0iMS4xIj4KICAKICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICA8ZGVmcz48L2RlZnM+CiAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJtYXRyaXgoMSwgMCwgMCwgMSwgLTMuMjg1NzE0LCAtMykiPgogICAgPGcgaWQ9InNlbGVjdCIgZmlsbD0iI0ZGRiI+CiAgICAgIDxwYXRoIGQ9Ik05LjA4NDgwNzA5LDEyLjc1MTkxMzEgTDEwLjI2OTI5MzcsMTUuMzkxMDc1MyBDMTAuNTAyNTI4MSwxNS45MTI4NDggMTEuMTEwNTA5OCwxNi4xNDMyNzU1IDExLjYyNjc3MDEsMTUuOTA3NTUwOCBDMTIuMTQzMDMwNCwxNS42NzA1MDE4IDEyLjM3MTAyMzYsMTUuMDU2MDI4NCAxMi4xMzc3ODkyLDE0LjUzNTU4IEwxMC45NjY5NjI3LDExLjkyNTcyOCBMMTMuOTI1ODUzLDExLjkyNTcyOCBDMTQuNTEzMDQ4NiwxMS45MjU3MjggMTQuNzkzNzY5MywxMS4yMTIxOTQ4IDE0LjM2MjM4NjUsMTAuODE5MDQ5NSBMNy4wNzkxMDA3LDQuMTcwMDQyOTQgQzYuNjY3MDMzNiwzLjc5MzQ5MTQgNiw0LjA4MzI0NDYyIDYsNC42Mzg0OTg1NyBMNiwxNC41MDI4NzIyIEM2LDE1LjA5MDAzNzMgNi43MzAxMzEzOCwxNS4zNjU3NDk2IDcuMTIyODgyODIsMTQuOTI3OTI4NyBMOS4wODQ4MDcwOSwxMi43NTE5MTMxIFoiIGlkPSJzZWxlY3QtaWNvbiI+PC9wYXRoPgogICAgPC9nPgogIDwvZz4KPC9zdmc+";
  SymbolMorph.prototype.selectBlackImage = new Image();
  SymbolMorph.prototype.selectBlackImage.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAxNCAxNCIgdmVyc2lvbj0iMS4xIj4KICAKICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICA8ZGVmcz48L2RlZnM+CiAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJtYXRyaXgoMSwgMCwgMCwgMSwgLTMuMjg1NzE0LCAtMykiPgogICAgPGcgaWQ9InNlbGVjdCIgZmlsbD0iIzAwMCI+CiAgICAgIDxwYXRoIGQ9Ik05LjA4NDgwNzA5LDEyLjc1MTkxMzEgTDEwLjI2OTI5MzcsMTUuMzkxMDc1MyBDMTAuNTAyNTI4MSwxNS45MTI4NDggMTEuMTEwNTA5OCwxNi4xNDMyNzU1IDExLjYyNjc3MDEsMTUuOTA3NTUwOCBDMTIuMTQzMDMwNCwxNS42NzA1MDE4IDEyLjM3MTAyMzYsMTUuMDU2MDI4NCAxMi4xMzc3ODkyLDE0LjUzNTU4IEwxMC45NjY5NjI3LDExLjkyNTcyOCBMMTMuOTI1ODUzLDExLjkyNTcyOCBDMTQuNTEzMDQ4NiwxMS45MjU3MjggMTQuNzkzNzY5MywxMS4yMTIxOTQ4IDE0LjM2MjM4NjUsMTAuODE5MDQ5NSBMNy4wNzkxMDA3LDQuMTcwMDQyOTQgQzYuNjY3MDMzNiwzLjc5MzQ5MTQgNiw0LjA4MzI0NDYyIDYsNC42Mzg0OTg1NyBMNiwxNC41MDI4NzIyIEM2LDE1LjA5MDAzNzMgNi43MzAxMzEzOCwxNS4zNjU3NDk2IDcuMTIyODgyODIsMTQuOTI3OTI4NyBMOS4wODQ4MDcwOSwxMi43NTE5MTMxIFoiIGlkPSJzZWxlY3QtaWNvbiI+PC9wYXRoPgogICAgPC9nPgogIDwvZz4KPC9zdmc+";
  SymbolMorph.prototype.shrink = new Image();
  SymbolMorph.prototype.shrink.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgdmVyc2lvbj0iMS4xIj4KICAgIDwhLS0gR2VuZXJhdG9yOiBTa2V0Y2ggNDguMSAoNDcyNTApIC0gaHR0cDovL3d3dy5ib2hlbWlhbmNvZGluZy5jb20vc2tldGNoIC0tPgogICAgPHRpdGxlPnVuLWZ1bGxzY3JlZW48L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcy8+CiAgICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0idW4tZnVsbHNjcmVlbiIgZmlsbD0iI0ZGRiI+CiAgICAgICAgICAgIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIuMDAwMDAwLCAyLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTE1LjMzODA5Myw0LjM1MDM1MjY0IEwxNC40NDg4NjQ0LDMuNDU4ODMxOTkgTDExLjMxNDgzNTEsNS44MzM0Mjc0MSBDMTAuOTU3MTM3OSw2LjEwODI1NzA4IDEwLjQzODk3ODQsNi4wMzYxOTgwOCAxMC4xNjQ4NTUzLDUuNjY3NTI0MTMgQzkuOTQyNTQ4MTYsNS4zNzA5MDkxOCA5Ljk0NzU2MjYxLDQuOTYyMDE2MjUgMTAuMTY0ODU1Myw0LjY4MjE1OTIgTDEyLjUzMzM0NTcsMS41NDAwNTE2NSBMMTEuNjY1ODQ2NCwwLjY2ODY0MDQ4NyBDMTEuNDE2Nzk1NSwwLjQxODk0NzY3NCAxMS41OTM5NzI3LDAuMDA1MDI3MzcyMDggMTEuOTM0OTU1MSwwLjAwNTAyNzM3MjA4IEwxNS42MTIyMTYxLDAgQzE1LjgyNDQ5NDQsMC4wMDUwMjczNzIwOCAxNiwwLjE4MDk4NTM5NSAxNiwwLjM4ODc4MzQ0MSBMMTYsNC4wODA1NTAzNCBDMTYsNC40MjI0MTE2NCAxNS41ODIxMjk0LDQuNTk1MDE4MDggMTUuMzM4MDkzLDQuMzUwMzUyNjQiIGlkPSJGaWxsLTEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEzLjAwMDAwMCwgMy4wMDAwMDApIHJvdGF0ZSgxODAuMDAwMDAwKSB0cmFuc2xhdGUoLTEzLjAwMDAwMCwgLTMuMDAwMDAwKSAiLz4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0wLjY2MTkwNjk4OSwxMS42NDkyODgzIEwxLjU1MTEzNTU3LDEyLjU0MDg4MjYgTDQuNjg1MTY0ODgsMTAuMTY2MDkxMiBDNS4wNDI4NjIwOSw5Ljg5MTIzODgyIDUuNTYxMDIxNiw5Ljk2NDk3OTcgNS44MzUxNDQ3LDEwLjMzMjAwODEgQzYuMDU3NDUxODQsMTAuNjI4NjQ3NiA2LjA1MjQzNzM5LDExLjAzNzU3NDMgNS44MzUxNDQ3LDExLjMxNzQ1NDQgTDMuNDY0OTgyOCwxNC40NTk4MjEzIEw0LjMzNDE1MzU5LDE1LjMzMTMwNDMgQzQuNTgzMjA0NDYsMTUuNTgxMDE3OCA0LjQwNjAyNzMzLDE1Ljk5NDk3MjIgNC4wNjUwNDQ5NCwxNS45OTQ5NzIyIEwwLjM4Nzc4Mzg5MywxNiBDMC4xNzU1MDU2NDEsMTUuOTk0OTcyMiAwLDE1LjgxODk5OTcgMCwxNS42MTExODQ1IEwwLDExLjkxOTExMjkgQzAsMTEuNTc3MjIzNCAwLjQxNzg3MDU3NCwxMS40MDQ2MDI3IDAuNjYxOTA2OTg5LDExLjY0OTI4ODMiIGlkPSJGaWxsLTMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDMuMDAwMDAwLCAxMy4wMDAwMDApIHJvdGF0ZSgxODAuMDAwMDAwKSB0cmFuc2xhdGUoLTMuMDAwMDAwLCAtMTMuMDAwMDAwKSAiLz4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0wLjY2MTkwNjk4OSw0LjM1MDM1MjY0IEwxLjU1MTEzNTU3LDMuNDU4ODMxOTkgTDQuNjg1MTY0ODgsNS44MzM0Mjc0MSBDNS4wNDI4NjIwOSw2LjEwODI1NzA4IDUuNTYxMDIxNiw2LjAzNjE5ODA4IDUuODM1MTQ0Nyw1LjY2NzUyNDEzIEM2LjA1NzQ1MTg0LDUuMzcwOTA5MTggNi4wNTI0MzczOSw0Ljk2MjAxNjI1IDUuODM1MTQ0Nyw0LjY4MjE1OTIgTDMuNDY0OTgyOCwxLjU0MDA1MTY1IEw0LjMzNDE1MzU5LDAuNjY4NjQwNDg3IEM0LjU4MzIwNDQ2LDAuNDE4OTQ3Njc0IDQuNDA2MDI3MzMsMC4wMDUwMjczNzIwOCA0LjA2NTA0NDk0LDAuMDA1MDI3MzcyMDggTDAuMzg3NzgzODkzLDAgQzAuMTc1NTA1NjQxLDAuMDA1MDI3MzcyMDggMCwwLjE4MDk4NTM5NSAwLDAuMzg4NzgzNDQxIEwwLDQuMDgwNTUwMzQgQzAsNC40MjI0MTE2NCAwLjQxNzg3MDU3NCw0LjU5NTAxODA4IDAuNjYxOTA2OTg5LDQuMzUwMzUyNjQiIGlkPSJGaWxsLTUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDMuMDAwMDAwLCAzLjAwMDAwMCkgcm90YXRlKDE4MC4wMDAwMDApIHRyYW5zbGF0ZSgtMy4wMDAwMDAsIC0zLjAwMDAwMCkgIi8+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUuMzM4MDkzLDExLjY0OTI4ODMgTDE0LjQ0ODg2NDQsMTIuNTQwODgyNiBMMTEuMzE0ODM1MSwxMC4xNjYwOTEyIEMxMC45NTcxMzc5LDkuODkxMjM4ODIgMTAuNDM4OTc4NCw5Ljk2NDk3OTcgMTAuMTY0ODU1MywxMC4zMzIwMDgxIEM5Ljk0MjU0ODE2LDEwLjYyODY0NzYgOS45NDc1NjI2MSwxMS4wMzc1NzQzIDEwLjE2NDg1NTMsMTEuMzE3NDU0NCBMMTIuNTMzMzQ1NywxNC40NTk4MjEzIEwxMS42NjU4NDY0LDE1LjMzMTMwNDMgQzExLjQxNjc5NTUsMTUuNTgxMDE3OCAxMS41OTM5NzI3LDE1Ljk5NDk3MjIgMTEuOTM0OTU1MSwxNS45OTQ5NzIyIEwxNS42MTIyMTYxLDE2IEMxNS44MjQ0OTQ0LDE1Ljk5NDk3MjIgMTYsMTUuODE4OTk5NyAxNiwxNS42MTExODQ1IEwxNiwxMS45MTkxMTI5IEMxNiwxMS41NzcyMjM0IDE1LjU4MjEyOTQsMTEuNDA0NjAyNyAxNS4zMzgwOTMsMTEuNjQ5Mjg4MyIgaWQ9IkZpbGwtNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTMuMDAwMDAwLCAxMy4wMDAwMDApIHJvdGF0ZSgxODAuMDAwMDAwKSB0cmFuc2xhdGUoLTEzLjAwMDAwMCwgLTEzLjAwMDAwMCkgIi8+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==";
  SymbolMorph.prototype.shrinkBlack = new Image();
  SymbolMorph.prototype.shrinkBlack.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgdmVyc2lvbj0iMS4xIj4KICAgIDwhLS0gR2VuZXJhdG9yOiBTa2V0Y2ggNDguMSAoNDcyNTApIC0gaHR0cDovL3d3dy5ib2hlbWlhbmNvZGluZy5jb20vc2tldGNoIC0tPgogICAgPHRpdGxlPnVuLWZ1bGxzY3JlZW48L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcy8+CiAgICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0idW4tZnVsbHNjcmVlbiIgZmlsbD0iIzAwMCI+CiAgICAgICAgICAgIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIuMDAwMDAwLCAyLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTE1LjMzODA5Myw0LjM1MDM1MjY0IEwxNC40NDg4NjQ0LDMuNDU4ODMxOTkgTDExLjMxNDgzNTEsNS44MzM0Mjc0MSBDMTAuOTU3MTM3OSw2LjEwODI1NzA4IDEwLjQzODk3ODQsNi4wMzYxOTgwOCAxMC4xNjQ4NTUzLDUuNjY3NTI0MTMgQzkuOTQyNTQ4MTYsNS4zNzA5MDkxOCA5Ljk0NzU2MjYxLDQuOTYyMDE2MjUgMTAuMTY0ODU1Myw0LjY4MjE1OTIgTDEyLjUzMzM0NTcsMS41NDAwNTE2NSBMMTEuNjY1ODQ2NCwwLjY2ODY0MDQ4NyBDMTEuNDE2Nzk1NSwwLjQxODk0NzY3NCAxMS41OTM5NzI3LDAuMDA1MDI3MzcyMDggMTEuOTM0OTU1MSwwLjAwNTAyNzM3MjA4IEwxNS42MTIyMTYxLDAgQzE1LjgyNDQ5NDQsMC4wMDUwMjczNzIwOCAxNiwwLjE4MDk4NTM5NSAxNiwwLjM4ODc4MzQ0MSBMMTYsNC4wODA1NTAzNCBDMTYsNC40MjI0MTE2NCAxNS41ODIxMjk0LDQuNTk1MDE4MDggMTUuMzM4MDkzLDQuMzUwMzUyNjQiIGlkPSJGaWxsLTEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEzLjAwMDAwMCwgMy4wMDAwMDApIHJvdGF0ZSgxODAuMDAwMDAwKSB0cmFuc2xhdGUoLTEzLjAwMDAwMCwgLTMuMDAwMDAwKSAiLz4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0wLjY2MTkwNjk4OSwxMS42NDkyODgzIEwxLjU1MTEzNTU3LDEyLjU0MDg4MjYgTDQuNjg1MTY0ODgsMTAuMTY2MDkxMiBDNS4wNDI4NjIwOSw5Ljg5MTIzODgyIDUuNTYxMDIxNiw5Ljk2NDk3OTcgNS44MzUxNDQ3LDEwLjMzMjAwODEgQzYuMDU3NDUxODQsMTAuNjI4NjQ3NiA2LjA1MjQzNzM5LDExLjAzNzU3NDMgNS44MzUxNDQ3LDExLjMxNzQ1NDQgTDMuNDY0OTgyOCwxNC40NTk4MjEzIEw0LjMzNDE1MzU5LDE1LjMzMTMwNDMgQzQuNTgzMjA0NDYsMTUuNTgxMDE3OCA0LjQwNjAyNzMzLDE1Ljk5NDk3MjIgNC4wNjUwNDQ5NCwxNS45OTQ5NzIyIEwwLjM4Nzc4Mzg5MywxNiBDMC4xNzU1MDU2NDEsMTUuOTk0OTcyMiAwLDE1LjgxODk5OTcgMCwxNS42MTExODQ1IEwwLDExLjkxOTExMjkgQzAsMTEuNTc3MjIzNCAwLjQxNzg3MDU3NCwxMS40MDQ2MDI3IDAuNjYxOTA2OTg5LDExLjY0OTI4ODMiIGlkPSJGaWxsLTMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDMuMDAwMDAwLCAxMy4wMDAwMDApIHJvdGF0ZSgxODAuMDAwMDAwKSB0cmFuc2xhdGUoLTMuMDAwMDAwLCAtMTMuMDAwMDAwKSAiLz4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0wLjY2MTkwNjk4OSw0LjM1MDM1MjY0IEwxLjU1MTEzNTU3LDMuNDU4ODMxOTkgTDQuNjg1MTY0ODgsNS44MzM0Mjc0MSBDNS4wNDI4NjIwOSw2LjEwODI1NzA4IDUuNTYxMDIxNiw2LjAzNjE5ODA4IDUuODM1MTQ0Nyw1LjY2NzUyNDEzIEM2LjA1NzQ1MTg0LDUuMzcwOTA5MTggNi4wNTI0MzczOSw0Ljk2MjAxNjI1IDUuODM1MTQ0Nyw0LjY4MjE1OTIgTDMuNDY0OTgyOCwxLjU0MDA1MTY1IEw0LjMzNDE1MzU5LDAuNjY4NjQwNDg3IEM0LjU4MzIwNDQ2LDAuNDE4OTQ3Njc0IDQuNDA2MDI3MzMsMC4wMDUwMjczNzIwOCA0LjA2NTA0NDk0LDAuMDA1MDI3MzcyMDggTDAuMzg3NzgzODkzLDAgQzAuMTc1NTA1NjQxLDAuMDA1MDI3MzcyMDggMCwwLjE4MDk4NTM5NSAwLDAuMzg4NzgzNDQxIEwwLDQuMDgwNTUwMzQgQzAsNC40MjI0MTE2NCAwLjQxNzg3MDU3NCw0LjU5NTAxODA4IDAuNjYxOTA2OTg5LDQuMzUwMzUyNjQiIGlkPSJGaWxsLTUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDMuMDAwMDAwLCAzLjAwMDAwMCkgcm90YXRlKDE4MC4wMDAwMDApIHRyYW5zbGF0ZSgtMy4wMDAwMDAsIC0zLjAwMDAwMCkgIi8+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUuMzM4MDkzLDExLjY0OTI4ODMgTDE0LjQ0ODg2NDQsMTIuNTQwODgyNiBMMTEuMzE0ODM1MSwxMC4xNjYwOTEyIEMxMC45NTcxMzc5LDkuODkxMjM4ODIgMTAuNDM4OTc4NCw5Ljk2NDk3OTcgMTAuMTY0ODU1MywxMC4zMzIwMDgxIEM5Ljk0MjU0ODE2LDEwLjYyODY0NzYgOS45NDc1NjI2MSwxMS4wMzc1NzQzIDEwLjE2NDg1NTMsMTEuMzE3NDU0NCBMMTIuNTMzMzQ1NywxNC40NTk4MjEzIEwxMS42NjU4NDY0LDE1LjMzMTMwNDMgQzExLjQxNjc5NTUsMTUuNTgxMDE3OCAxMS41OTM5NzI3LDE1Ljk5NDk3MjIgMTEuOTM0OTU1MSwxNS45OTQ5NzIyIEwxNS42MTIyMTYxLDE2IEMxNS44MjQ0OTQ0LDE1Ljk5NDk3MjIgMTYsMTUuODE4OTk5NyAxNiwxNS42MTExODQ1IEwxNiwxMS45MTkxMTI5IEMxNiwxMS41NzcyMjM0IDE1LjU4MjEyOTQsMTEuNDA0NjAyNyAxNS4zMzgwOTMsMTEuNjQ5Mjg4MyIgaWQ9IkZpbGwtNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTMuMDAwMDAwLCAxMy4wMDAwMDApIHJvdGF0ZSgxODAuMDAwMDAwKSB0cmFuc2xhdGUoLTEzLjAwMDAwMCwgLTEzLjAwMDAwMCkgIi8+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==";
  SymbolMorph.prototype.shrinkGrey = new Image();
  SymbolMorph.prototype.shrinkGrey.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgdmVyc2lvbj0iMS4xIj4KICAgIDwhLS0gR2VuZXJhdG9yOiBTa2V0Y2ggNDguMSAoNDcyNTApIC0gaHR0cDovL3d3dy5ib2hlbWlhbmNvZGluZy5jb20vc2tldGNoIC0tPgogICAgPHRpdGxlPnVuLWZ1bGxzY3JlZW48L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcy8+CiAgICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0idW4tZnVsbHNjcmVlbiIgZmlsbD0iIzU3NUU3NSI+CiAgICAgICAgICAgIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIuMDAwMDAwLCAyLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTE1LjMzODA5Myw0LjM1MDM1MjY0IEwxNC40NDg4NjQ0LDMuNDU4ODMxOTkgTDExLjMxNDgzNTEsNS44MzM0Mjc0MSBDMTAuOTU3MTM3OSw2LjEwODI1NzA4IDEwLjQzODk3ODQsNi4wMzYxOTgwOCAxMC4xNjQ4NTUzLDUuNjY3NTI0MTMgQzkuOTQyNTQ4MTYsNS4zNzA5MDkxOCA5Ljk0NzU2MjYxLDQuOTYyMDE2MjUgMTAuMTY0ODU1Myw0LjY4MjE1OTIgTDEyLjUzMzM0NTcsMS41NDAwNTE2NSBMMTEuNjY1ODQ2NCwwLjY2ODY0MDQ4NyBDMTEuNDE2Nzk1NSwwLjQxODk0NzY3NCAxMS41OTM5NzI3LDAuMDA1MDI3MzcyMDggMTEuOTM0OTU1MSwwLjAwNTAyNzM3MjA4IEwxNS42MTIyMTYxLDAgQzE1LjgyNDQ5NDQsMC4wMDUwMjczNzIwOCAxNiwwLjE4MDk4NTM5NSAxNiwwLjM4ODc4MzQ0MSBMMTYsNC4wODA1NTAzNCBDMTYsNC40MjI0MTE2NCAxNS41ODIxMjk0LDQuNTk1MDE4MDggMTUuMzM4MDkzLDQuMzUwMzUyNjQiIGlkPSJGaWxsLTEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEzLjAwMDAwMCwgMy4wMDAwMDApIHJvdGF0ZSgxODAuMDAwMDAwKSB0cmFuc2xhdGUoLTEzLjAwMDAwMCwgLTMuMDAwMDAwKSAiLz4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0wLjY2MTkwNjk4OSwxMS42NDkyODgzIEwxLjU1MTEzNTU3LDEyLjU0MDg4MjYgTDQuNjg1MTY0ODgsMTAuMTY2MDkxMiBDNS4wNDI4NjIwOSw5Ljg5MTIzODgyIDUuNTYxMDIxNiw5Ljk2NDk3OTcgNS44MzUxNDQ3LDEwLjMzMjAwODEgQzYuMDU3NDUxODQsMTAuNjI4NjQ3NiA2LjA1MjQzNzM5LDExLjAzNzU3NDMgNS44MzUxNDQ3LDExLjMxNzQ1NDQgTDMuNDY0OTgyOCwxNC40NTk4MjEzIEw0LjMzNDE1MzU5LDE1LjMzMTMwNDMgQzQuNTgzMjA0NDYsMTUuNTgxMDE3OCA0LjQwNjAyNzMzLDE1Ljk5NDk3MjIgNC4wNjUwNDQ5NCwxNS45OTQ5NzIyIEwwLjM4Nzc4Mzg5MywxNiBDMC4xNzU1MDU2NDEsMTUuOTk0OTcyMiAwLDE1LjgxODk5OTcgMCwxNS42MTExODQ1IEwwLDExLjkxOTExMjkgQzAsMTEuNTc3MjIzNCAwLjQxNzg3MDU3NCwxMS40MDQ2MDI3IDAuNjYxOTA2OTg5LDExLjY0OTI4ODMiIGlkPSJGaWxsLTMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDMuMDAwMDAwLCAxMy4wMDAwMDApIHJvdGF0ZSgxODAuMDAwMDAwKSB0cmFuc2xhdGUoLTMuMDAwMDAwLCAtMTMuMDAwMDAwKSAiLz4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0wLjY2MTkwNjk4OSw0LjM1MDM1MjY0IEwxLjU1MTEzNTU3LDMuNDU4ODMxOTkgTDQuNjg1MTY0ODgsNS44MzM0Mjc0MSBDNS4wNDI4NjIwOSw2LjEwODI1NzA4IDUuNTYxMDIxNiw2LjAzNjE5ODA4IDUuODM1MTQ0Nyw1LjY2NzUyNDEzIEM2LjA1NzQ1MTg0LDUuMzcwOTA5MTggNi4wNTI0MzczOSw0Ljk2MjAxNjI1IDUuODM1MTQ0Nyw0LjY4MjE1OTIgTDMuNDY0OTgyOCwxLjU0MDA1MTY1IEw0LjMzNDE1MzU5LDAuNjY4NjQwNDg3IEM0LjU4MzIwNDQ2LDAuNDE4OTQ3Njc0IDQuNDA2MDI3MzMsMC4wMDUwMjczNzIwOCA0LjA2NTA0NDk0LDAuMDA1MDI3MzcyMDggTDAuMzg3NzgzODkzLDAgQzAuMTc1NTA1NjQxLDAuMDA1MDI3MzcyMDggMCwwLjE4MDk4NTM5NSAwLDAuMzg4NzgzNDQxIEwwLDQuMDgwNTUwMzQgQzAsNC40MjI0MTE2NCAwLjQxNzg3MDU3NCw0LjU5NTAxODA4IDAuNjYxOTA2OTg5LDQuMzUwMzUyNjQiIGlkPSJGaWxsLTUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDMuMDAwMDAwLCAzLjAwMDAwMCkgcm90YXRlKDE4MC4wMDAwMDApIHRyYW5zbGF0ZSgtMy4wMDAwMDAsIC0zLjAwMDAwMCkgIi8+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUuMzM4MDkzLDExLjY0OTI4ODMgTDE0LjQ0ODg2NDQsMTIuNTQwODgyNiBMMTEuMzE0ODM1MSwxMC4xNjYwOTEyIEMxMC45NTcxMzc5LDkuODkxMjM4ODIgMTAuNDM4OTc4NCw5Ljk2NDk3OTcgMTAuMTY0ODU1MywxMC4zMzIwMDgxIEM5Ljk0MjU0ODE2LDEwLjYyODY0NzYgOS45NDc1NjI2MSwxMS4wMzc1NzQzIDEwLjE2NDg1NTMsMTEuMzE3NDU0NCBMMTIuNTMzMzQ1NywxNC40NTk4MjEzIEwxMS42NjU4NDY0LDE1LjMzMTMwNDMgQzExLjQxNjc5NTUsMTUuNTgxMDE3OCAxMS41OTM5NzI3LDE1Ljk5NDk3MjIgMTEuOTM0OTU1MSwxNS45OTQ5NzIyIEwxNS42MTIyMTYxLDE2IEMxNS44MjQ0OTQ0LDE1Ljk5NDk3MjIgMTYsMTUuODE4OTk5NyAxNiwxNS42MTExODQ1IEwxNiwxMS45MTkxMTI5IEMxNiwxMS41NzcyMjM0IDE1LjU4MjEyOTQsMTEuNDA0NjAyNyAxNS4zMzgwOTMsMTEuNjQ5Mjg4MyIgaWQ9IkZpbGwtNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTMuMDAwMDAwLCAxMy4wMDAwMDApIHJvdGF0ZSgxODAuMDAwMDAwKSB0cmFuc2xhdGUoLTEzLjAwMDAwMCwgLTEzLjAwMDAwMCkgIi8+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==";
  SymbolMorph.prototype.grow = new Image();
  SymbolMorph.prototype.grow.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiICB2aWV3Qm94PSIwIDAgMjAgMjAiIHZlcnNpb249IjEuMSI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDQ3LjEgKDQ1NDIyKSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5GdWxsc2NyZWVuPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGRlZnMvPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9IkZ1bGxzY3JlZW4iIGZpbGw9IiNGRkYiPgogICAgICAgICAgICA8ZyBpZD0iZnVsbHNjcmVlbiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMy4wMDAwMDAsIDMuMDAwMDAwKSI+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTMuMzM4MDkzLDQuMzUwMzUyNjQgTDEyLjQ0ODg2NDQsMy40NTg4MzE5OSBMOS4zMTQ4MzUxMiw1LjgzMzQyNzQxIEM4Ljk1NzEzNzkxLDYuMTA4MjU3MDggOC40Mzg5Nzg0LDYuMDM2MTk4MDggOC4xNjQ4NTUzLDUuNjY3NTI0MTMgQzcuOTQyNTQ4MTYsNS4zNzA5MDkxOCA3Ljk0NzU2MjYxLDQuOTYyMDE2MjUgOC4xNjQ4NTUzLDQuNjgyMTU5MiBMMTAuNTMzMzQ1NywxLjU0MDA1MTY1IEw5LjY2NTg0NjQxLDAuNjY4NjQwNDg3IEM5LjQxNjc5NTU0LDAuNDE4OTQ3Njc0IDkuNTkzOTcyNjcsMC4wMDUwMjczNzIwOCA5LjkzNDk1NTA2LDAuMDA1MDI3MzcyMDggTDEzLjYxMjIxNjEsMCBDMTMuODI0NDk0NCwwLjAwNTAyNzM3MjA4IDE0LDAuMTgwOTg1Mzk1IDE0LDAuMzg4NzgzNDQxIEwxNCw0LjA4MDU1MDM0IEMxNCw0LjQyMjQxMTY0IDEzLjU4MjEyOTQsNC41OTUwMTgwOCAxMy4zMzgwOTMsNC4zNTAzNTI2NCIgaWQ9IkZpbGwtMSIvPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTAuNjYxOTA2OTg5LDkuNjQ5Mjg4MzQgTDEuNTUxMTM1NTcsMTAuNTQwODgyNiBMNC42ODUxNjQ4OCw4LjE2NjA5MTE4IEM1LjA0Mjg2MjA5LDcuODkxMjM4ODIgNS41NjEwMjE2LDcuOTY0OTc5NyA1LjgzNTE0NDcsOC4zMzIwMDgxNSBDNi4wNTc0NTE4NCw4LjYyODY0NzU4IDYuMDUyNDM3MzksOS4wMzc1NzQyNSA1LjgzNTE0NDcsOS4zMTc0NTQ0IEwzLjQ2NDk4MjgsMTIuNDU5ODIxMyBMNC4zMzQxNTM1OSwxMy4zMzEzMDQzIEM0LjU4MzIwNDQ2LDEzLjU4MTAxNzggNC40MDYwMjczMywxMy45OTQ5NzIyIDQuMDY1MDQ0OTQsMTMuOTk0OTcyMiBMMC4zODc3ODM4OTMsMTQgQzAuMTc1NTA1NjQxLDEzLjk5NDk3MjIgMCwxMy44MTg5OTk3IDAsMTMuNjExMTg0NSBMMCw5LjkxOTExMjkgQzAsOS41NzcyMjMzOSAwLjQxNzg3MDU3NCw5LjQwNDYwMjcgMC42NjE5MDY5ODksOS42NDkyODgzNCIgaWQ9IkZpbGwtMyIvPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTAuNjYxOTA2OTg5LDQuMzUwMzUyNjQgTDEuNTUxMTM1NTcsMy40NTg4MzE5OSBMNC42ODUxNjQ4OCw1LjgzMzQyNzQxIEM1LjA0Mjg2MjA5LDYuMTA4MjU3MDggNS41NjEwMjE2LDYuMDM2MTk4MDggNS44MzUxNDQ3LDUuNjY3NTI0MTMgQzYuMDU3NDUxODQsNS4zNzA5MDkxOCA2LjA1MjQzNzM5LDQuOTYyMDE2MjUgNS44MzUxNDQ3LDQuNjgyMTU5MiBMMy40NjQ5ODI4LDEuNTQwMDUxNjUgTDQuMzM0MTUzNTksMC42Njg2NDA0ODcgQzQuNTgzMjA0NDYsMC40MTg5NDc2NzQgNC40MDYwMjczMywwLjAwNTAyNzM3MjA4IDQuMDY1MDQ0OTQsMC4wMDUwMjczNzIwOCBMMC4zODc3ODM4OTMsMCBDMC4xNzU1MDU2NDEsMC4wMDUwMjczNzIwOCAwLDAuMTgwOTg1Mzk1IDAsMC4zODg3ODM0NDEgTDAsNC4wODA1NTAzNCBDMCw0LjQyMjQxMTY0IDAuNDE3ODcwNTc0LDQuNTk1MDE4MDggMC42NjE5MDY5ODksNC4zNTAzNTI2NCIgaWQ9IkZpbGwtNSIvPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTEzLjMzODA5Myw5LjY0OTI4ODM0IEwxMi40NDg4NjQ0LDEwLjU0MDg4MjYgTDkuMzE0ODM1MTIsOC4xNjYwOTExOCBDOC45NTcxMzc5MSw3Ljg5MTIzODgyIDguNDM4OTc4NCw3Ljk2NDk3OTcgOC4xNjQ4NTUzLDguMzMyMDA4MTUgQzcuOTQyNTQ4MTYsOC42Mjg2NDc1OCA3Ljk0NzU2MjYxLDkuMDM3NTc0MjUgOC4xNjQ4NTUzLDkuMzE3NDU0NCBMMTAuNTMzMzQ1NywxMi40NTk4MjEzIEw5LjY2NTg0NjQxLDEzLjMzMTMwNDMgQzkuNDE2Nzk1NTQsMTMuNTgxMDE3OCA5LjU5Mzk3MjY3LDEzLjk5NDk3MjIgOS45MzQ5NTUwNiwxMy45OTQ5NzIyIEwxMy42MTIyMTYxLDE0IEMxMy44MjQ0OTQ0LDEzLjk5NDk3MjIgMTQsMTMuODE4OTk5NyAxNCwxMy42MTExODQ1IEwxNCw5LjkxOTExMjkgQzE0LDkuNTc3MjIzMzkgMTMuNTgyMTI5NCw5LjQwNDYwMjcgMTMuMzM4MDkzLDkuNjQ5Mjg4MzQiIGlkPSJGaWxsLTciLz4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+";
  SymbolMorph.prototype.growBlack = new Image();
  SymbolMorph.prototype.growBlack.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgdmVyc2lvbj0iMS4xIj4KICAgIDwhLS0gR2VuZXJhdG9yOiBTa2V0Y2ggNDcuMSAoNDU0MjIpIC0gaHR0cDovL3d3dy5ib2hlbWlhbmNvZGluZy5jb20vc2tldGNoIC0tPgogICAgPHRpdGxlPkZ1bGxzY3JlZW48L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcy8+CiAgICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iRnVsbHNjcmVlbiIgZmlsbD0iIzAwMCI+CiAgICAgICAgICAgIDxnIGlkPSJmdWxsc2NyZWVuIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzLjAwMDAwMCwgMy4wMDAwMDApIj4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMy4zMzgwOTMsNC4zNTAzNTI2NCBMMTIuNDQ4ODY0NCwzLjQ1ODgzMTk5IEw5LjMxNDgzNTEyLDUuODMzNDI3NDEgQzguOTU3MTM3OTEsNi4xMDgyNTcwOCA4LjQzODk3ODQsNi4wMzYxOTgwOCA4LjE2NDg1NTMsNS42Njc1MjQxMyBDNy45NDI1NDgxNiw1LjM3MDkwOTE4IDcuOTQ3NTYyNjEsNC45NjIwMTYyNSA4LjE2NDg1NTMsNC42ODIxNTkyIEwxMC41MzMzNDU3LDEuNTQwMDUxNjUgTDkuNjY1ODQ2NDEsMC42Njg2NDA0ODcgQzkuNDE2Nzk1NTQsMC40MTg5NDc2NzQgOS41OTM5NzI2NywwLjAwNTAyNzM3MjA4IDkuOTM0OTU1MDYsMC4wMDUwMjczNzIwOCBMMTMuNjEyMjE2MSwwIEMxMy44MjQ0OTQ0LDAuMDA1MDI3MzcyMDggMTQsMC4xODA5ODUzOTUgMTQsMC4zODg3ODM0NDEgTDE0LDQuMDgwNTUwMzQgQzE0LDQuNDIyNDExNjQgMTMuNTgyMTI5NCw0LjU5NTAxODA4IDEzLjMzODA5Myw0LjM1MDM1MjY0IiBpZD0iRmlsbC0xIi8+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMC42NjE5MDY5ODksOS42NDkyODgzNCBMMS41NTExMzU1NywxMC41NDA4ODI2IEw0LjY4NTE2NDg4LDguMTY2MDkxMTggQzUuMDQyODYyMDksNy44OTEyMzg4MiA1LjU2MTAyMTYsNy45NjQ5Nzk3IDUuODM1MTQ0Nyw4LjMzMjAwODE1IEM2LjA1NzQ1MTg0LDguNjI4NjQ3NTggNi4wNTI0MzczOSw5LjAzNzU3NDI1IDUuODM1MTQ0Nyw5LjMxNzQ1NDQgTDMuNDY0OTgyOCwxMi40NTk4MjEzIEw0LjMzNDE1MzU5LDEzLjMzMTMwNDMgQzQuNTgzMjA0NDYsMTMuNTgxMDE3OCA0LjQwNjAyNzMzLDEzLjk5NDk3MjIgNC4wNjUwNDQ5NCwxMy45OTQ5NzIyIEwwLjM4Nzc4Mzg5MywxNCBDMC4xNzU1MDU2NDEsMTMuOTk0OTcyMiAwLDEzLjgxODk5OTcgMCwxMy42MTExODQ1IEwwLDkuOTE5MTEyOSBDMCw5LjU3NzIyMzM5IDAuNDE3ODcwNTc0LDkuNDA0NjAyNyAwLjY2MTkwNjk4OSw5LjY0OTI4ODM0IiBpZD0iRmlsbC0zIi8+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMC42NjE5MDY5ODksNC4zNTAzNTI2NCBMMS41NTExMzU1NywzLjQ1ODgzMTk5IEw0LjY4NTE2NDg4LDUuODMzNDI3NDEgQzUuMDQyODYyMDksNi4xMDgyNTcwOCA1LjU2MTAyMTYsNi4wMzYxOTgwOCA1LjgzNTE0NDcsNS42Njc1MjQxMyBDNi4wNTc0NTE4NCw1LjM3MDkwOTE4IDYuMDUyNDM3MzksNC45NjIwMTYyNSA1LjgzNTE0NDcsNC42ODIxNTkyIEwzLjQ2NDk4MjgsMS41NDAwNTE2NSBMNC4zMzQxNTM1OSwwLjY2ODY0MDQ4NyBDNC41ODMyMDQ0NiwwLjQxODk0NzY3NCA0LjQwNjAyNzMzLDAuMDA1MDI3MzcyMDggNC4wNjUwNDQ5NCwwLjAwNTAyNzM3MjA4IEwwLjM4Nzc4Mzg5MywwIEMwLjE3NTUwNTY0MSwwLjAwNTAyNzM3MjA4IDAsMC4xODA5ODUzOTUgMCwwLjM4ODc4MzQ0MSBMMCw0LjA4MDU1MDM0IEMwLDQuNDIyNDExNjQgMC40MTc4NzA1NzQsNC41OTUwMTgwOCAwLjY2MTkwNjk4OSw0LjM1MDM1MjY0IiBpZD0iRmlsbC01Ii8+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTMuMzM4MDkzLDkuNjQ5Mjg4MzQgTDEyLjQ0ODg2NDQsMTAuNTQwODgyNiBMOS4zMTQ4MzUxMiw4LjE2NjA5MTE4IEM4Ljk1NzEzNzkxLDcuODkxMjM4ODIgOC40Mzg5Nzg0LDcuOTY0OTc5NyA4LjE2NDg1NTMsOC4zMzIwMDgxNSBDNy45NDI1NDgxNiw4LjYyODY0NzU4IDcuOTQ3NTYyNjEsOS4wMzc1NzQyNSA4LjE2NDg1NTMsOS4zMTc0NTQ0IEwxMC41MzMzNDU3LDEyLjQ1OTgyMTMgTDkuNjY1ODQ2NDEsMTMuMzMxMzA0MyBDOS40MTY3OTU1NCwxMy41ODEwMTc4IDkuNTkzOTcyNjcsMTMuOTk0OTcyMiA5LjkzNDk1NTA2LDEzLjk5NDk3MjIgTDEzLjYxMjIxNjEsMTQgQzEzLjgyNDQ5NDQsMTMuOTk0OTcyMiAxNCwxMy44MTg5OTk3IDE0LDEzLjYxMTE4NDUgTDE0LDkuOTE5MTEyOSBDMTQsOS41NzcyMjMzOSAxMy41ODIxMjk0LDkuNDA0NjAyNyAxMy4zMzgwOTMsOS42NDkyODgzNCIgaWQ9IkZpbGwtNyIvPgogICAgICAgICAgICA8L2c+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=";
  SymbolMorph.prototype.growGrey = new Image();
  SymbolMorph.prototype.growGrey.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiICB2aWV3Qm94PSIwIDAgMjAgMjAiIHZlcnNpb249IjEuMSI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDQ3LjEgKDQ1NDIyKSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5GdWxsc2NyZWVuPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGRlZnMvPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9IkZ1bGxzY3JlZW4iIGZpbGw9IiM1NzVFNzUiPgogICAgICAgICAgICA8ZyBpZD0iZnVsbHNjcmVlbiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMy4wMDAwMDAsIDMuMDAwMDAwKSI+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTMuMzM4MDkzLDQuMzUwMzUyNjQgTDEyLjQ0ODg2NDQsMy40NTg4MzE5OSBMOS4zMTQ4MzUxMiw1LjgzMzQyNzQxIEM4Ljk1NzEzNzkxLDYuMTA4MjU3MDggOC40Mzg5Nzg0LDYuMDM2MTk4MDggOC4xNjQ4NTUzLDUuNjY3NTI0MTMgQzcuOTQyNTQ4MTYsNS4zNzA5MDkxOCA3Ljk0NzU2MjYxLDQuOTYyMDE2MjUgOC4xNjQ4NTUzLDQuNjgyMTU5MiBMMTAuNTMzMzQ1NywxLjU0MDA1MTY1IEw5LjY2NTg0NjQxLDAuNjY4NjQwNDg3IEM5LjQxNjc5NTU0LDAuNDE4OTQ3Njc0IDkuNTkzOTcyNjcsMC4wMDUwMjczNzIwOCA5LjkzNDk1NTA2LDAuMDA1MDI3MzcyMDggTDEzLjYxMjIxNjEsMCBDMTMuODI0NDk0NCwwLjAwNTAyNzM3MjA4IDE0LDAuMTgwOTg1Mzk1IDE0LDAuMzg4NzgzNDQxIEwxNCw0LjA4MDU1MDM0IEMxNCw0LjQyMjQxMTY0IDEzLjU4MjEyOTQsNC41OTUwMTgwOCAxMy4zMzgwOTMsNC4zNTAzNTI2NCIgaWQ9IkZpbGwtMSIvPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTAuNjYxOTA2OTg5LDkuNjQ5Mjg4MzQgTDEuNTUxMTM1NTcsMTAuNTQwODgyNiBMNC42ODUxNjQ4OCw4LjE2NjA5MTE4IEM1LjA0Mjg2MjA5LDcuODkxMjM4ODIgNS41NjEwMjE2LDcuOTY0OTc5NyA1LjgzNTE0NDcsOC4zMzIwMDgxNSBDNi4wNTc0NTE4NCw4LjYyODY0NzU4IDYuMDUyNDM3MzksOS4wMzc1NzQyNSA1LjgzNTE0NDcsOS4zMTc0NTQ0IEwzLjQ2NDk4MjgsMTIuNDU5ODIxMyBMNC4zMzQxNTM1OSwxMy4zMzEzMDQzIEM0LjU4MzIwNDQ2LDEzLjU4MTAxNzggNC40MDYwMjczMywxMy45OTQ5NzIyIDQuMDY1MDQ0OTQsMTMuOTk0OTcyMiBMMC4zODc3ODM4OTMsMTQgQzAuMTc1NTA1NjQxLDEzLjk5NDk3MjIgMCwxMy44MTg5OTk3IDAsMTMuNjExMTg0NSBMMCw5LjkxOTExMjkgQzAsOS41NzcyMjMzOSAwLjQxNzg3MDU3NCw5LjQwNDYwMjcgMC42NjE5MDY5ODksOS42NDkyODgzNCIgaWQ9IkZpbGwtMyIvPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTAuNjYxOTA2OTg5LDQuMzUwMzUyNjQgTDEuNTUxMTM1NTcsMy40NTg4MzE5OSBMNC42ODUxNjQ4OCw1LjgzMzQyNzQxIEM1LjA0Mjg2MjA5LDYuMTA4MjU3MDggNS41NjEwMjE2LDYuMDM2MTk4MDggNS44MzUxNDQ3LDUuNjY3NTI0MTMgQzYuMDU3NDUxODQsNS4zNzA5MDkxOCA2LjA1MjQzNzM5LDQuOTYyMDE2MjUgNS44MzUxNDQ3LDQuNjgyMTU5MiBMMy40NjQ5ODI4LDEuNTQwMDUxNjUgTDQuMzM0MTUzNTksMC42Njg2NDA0ODcgQzQuNTgzMjA0NDYsMC40MTg5NDc2NzQgNC40MDYwMjczMywwLjAwNTAyNzM3MjA4IDQuMDY1MDQ0OTQsMC4wMDUwMjczNzIwOCBMMC4zODc3ODM4OTMsMCBDMC4xNzU1MDU2NDEsMC4wMDUwMjczNzIwOCAwLDAuMTgwOTg1Mzk1IDAsMC4zODg3ODM0NDEgTDAsNC4wODA1NTAzNCBDMCw0LjQyMjQxMTY0IDAuNDE3ODcwNTc0LDQuNTk1MDE4MDggMC42NjE5MDY5ODksNC4zNTAzNTI2NCIgaWQ9IkZpbGwtNSIvPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTEzLjMzODA5Myw5LjY0OTI4ODM0IEwxMi40NDg4NjQ0LDEwLjU0MDg4MjYgTDkuMzE0ODM1MTIsOC4xNjYwOTExOCBDOC45NTcxMzc5MSw3Ljg5MTIzODgyIDguNDM4OTc4NCw3Ljk2NDk3OTcgOC4xNjQ4NTUzLDguMzMyMDA4MTUgQzcuOTQyNTQ4MTYsOC42Mjg2NDc1OCA3Ljk0NzU2MjYxLDkuMDM3NTc0MjUgOC4xNjQ4NTUzLDkuMzE3NDU0NCBMMTAuNTMzMzQ1NywxMi40NTk4MjEzIEw5LjY2NTg0NjQxLDEzLjMzMTMwNDMgQzkuNDE2Nzk1NTQsMTMuNTgxMDE3OCA5LjU5Mzk3MjY3LDEzLjk5NDk3MjIgOS45MzQ5NTUwNiwxMy45OTQ5NzIyIEwxMy42MTIyMTYxLDE0IEMxMy44MjQ0OTQ0LDEzLjk5NDk3MjIgMTQsMTMuODE4OTk5NyAxNCwxMy42MTExODQ1IEwxNCw5LjkxOTExMjkgQzE0LDkuNTc3MjIzMzkgMTMuNTgyMTI5NCw5LjQwNDYwMjcgMTMuMzM4MDkzLDkuNjQ5Mjg4MzQiIGlkPSJGaWxsLTciLz4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+";
  SymbolMorph.prototype.brush = new Image();
  SymbolMorph.prototype.brush.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMHB4IiBoZWlnaHQ9IjIwcHgiIHZpZXdCb3g9IjAgMCAxNCAxNCIgdmVyc2lvbj0iMS4xIj4KICA8dGl0bGU+cGFpbnQ8L3RpdGxlPgogIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHRyYW5zZm9ybT0ibWF0cml4KDEsIDAsIDAsIDEsIC0zLCAtMykiPgogICAgPGcgaWQ9InBhaW50IiBmaWxsPSIjRkZGIj4KICAgICAgPHBhdGggZD0iTTE2LjE5OTgyMjYsNi41ODY4NTI3NyBDMTUuNTQxNzI5NCw3Ljk0MjEzNzYzIDE0LjU2NjI2NzgsOS41MDUzOTEwMSAxMy42NDU3NjE3LDEwLjY2Mzg3MzQgQzEyLjg3NTAwOTcsMTEuNjM5NTExIDEyLjI1Njc1OTMsMTIuMjExNzczNCAxMS42NjU5ODY4LDEyLjQ5MDkyNTggQzExLjU5NzI5MjMsMTIuNTM0MTk0NCAxMS41Mjk5NzE3LDEyLjU0ODE1MjEgMTEuNDQ2MTY0NCwxMi41NDgxNTIxIEMxMS4zOTEyMDg5LDEyLjU0ODE1MjEgMTEuMzM2MjUzMywxMi41MzQxOTQ0IDExLjI2NzU1ODgsMTIuNTA0ODgzNCBDMTEuMTQzOTA4NywxMi40NjQ0MDYzIDExLjAzMzk5NzYsMTIuMzY2NzAzIDEwLjk3OTA0MiwxMi4yNDEwODQ0IEMxMC44MTQxNzUyLDExLjg2MjgzMjkgMTAuNTgwNjE0LDExLjU0MzIwMzUgMTAuMjY1OTkzMiwxMS4yOTA1NzA1IEM5Ljk0ODYyNDc0LDExLjA1MzI5MSA5LjU5MTQxMzQ0LDEwLjg3MTg0MiA5LjE4MDYyMDQzLDEwLjc3NDEzODYgQzkuMDU1NTk2NDgsMTAuNzQ2MjIzNCA4LjkzMTk0NjQxLDEwLjY2Mzg3MzQgOC44NjMyNTE5MywxMC41MzY4NTkxIEM4Ljc5NDU1NzQ1LDEwLjQyNTE5ODEgOC43Njg0NTM1NCwxMC4yODU2MjE5IDguNzk0NTU3NDUsMTAuMTQ3NDQxNSBDOC45NTk0MjQyLDkuNTA1MzkxMDEgOS4zODUzMjk5OSw4Ljc1MTY3OTU2IDEwLjEyNzIzMDQsNy44MTY1MTkwNSBDMTEuNTg0OTI3Myw1Ljk0NDgwMjI3IDE0LjQ5NzU3MzMsMy4xNjg2MzE3NSAxNS45MTEzMDU4LDMuMDEzNzAyMTggQzE2LjI5NTk5NDksMi45NTc4NzE3IDE2LjUxNTgxNzIsMy4wODM0OTAyOCAxNi42NTMyMDYyLDMuMTk1MTUxMjMgQzE3LjAxMTc5MTQsMy41MDIyMTg4NiAxNy4zNjkwMDI3LDQuMTczNTgwMzYgMTYuMTk5ODIyNiw2LjU4Njg1Mjc3IFogTTEwLjI2NTQ0MzcsMTMuOTk5MDQ2NiBDMTAuMzQ3ODc3MSwxNC42OTY5Mjc2IDEwLjE2OTI3MTQsMTUuMzgwODUwOSA5Ljc0MTk5MTc0LDE1LjkyNTE5ODEgQzkuMzcyNDE1NDMsMTYuNDEyMzE5IDguODUwMzM3MzcsMTYuNzQ4Njk3NyA4LjI1OTU2NDgyLDE2Ljg4ODI3MzggQzguMjMyMDg3MDMsMTYuOTAyMjMxNSA4LjE5MDg3MDM0LDE2LjkxNjE4OTEgOC4xNjMzOTI1NSwxNi45MTYxODkxIEw4LjAyNDYyOTcsMTYuOTMwMTQ2NyBDNy43NjQ5NjQ1NSwxNi45NzIwMTk2IDcuNTE3NjY0NDIsMTYuOTk5OTM0OCA3LjI2ODk5MDQsMTYuOTk5OTM0OCBDNS4yOTE5NjMyMSwxNi45OTk5MzQ4IDMuOTAyOTYwNzksMTUuNjU4NjA3NiAzLjM1NDc3ODgzLDE0Ljc4MDY3MzMgQzMuMTQ3MzIxNDksMTQuNDMxNzMyOCAyLjgzMjcwMDc2LDEzLjc4OTY4MjMgMy4xMDc0Nzg2OSwxMy4zODQ5MTE0IEMzLjE3NjE3MzE3LDEzLjI4NzIwOCAzLjM2NzE0MzgzLDEzLjA3Nzg0MzcgMy43NzkzMTA3MiwxMy4xNjE1ODk0IEM1LjA4NDUwNTg4LDEzLjQ0MDc0MTggNS41NTE2MjgzNSwxMi44NTQ1MjE4IDUuNjM1NDM1NjIsMTIuNzQyODYwOSBDNi41MTQ3MjQ5OSwxMS41ODQzNzg0IDguMTQ5NjUzNjUsMTEuMzc1MDE0MSA5LjI3NDg2OTI2LDEyLjI0MDM4NjYgQzkuODI1Nzk5MDEsMTIuNjczMDcyOCAxMC4xODE2MzY0LDEzLjMwMTE2NTYgMTAuMjY1NDQzNywxMy45OTkwNDY2IFoiIGlkPSJGaWxsLTQiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==";
  SymbolMorph.prototype.brushBlack = new Image();
  SymbolMorph.prototype.brushBlack.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMHB4IiBoZWlnaHQ9IjIwcHgiIHZpZXdCb3g9IjAgMCAxNCAxNCIgdmVyc2lvbj0iMS4xIj4KICA8dGl0bGU+cGFpbnQ8L3RpdGxlPgogIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHRyYW5zZm9ybT0ibWF0cml4KDEsIDAsIDAsIDEsIC0zLCAtMykiPgogICAgPGcgaWQ9InBhaW50IiBmaWxsPSIjMDAwIj4KICAgICAgPHBhdGggZD0iTTE2LjE5OTgyMjYsNi41ODY4NTI3NyBDMTUuNTQxNzI5NCw3Ljk0MjEzNzYzIDE0LjU2NjI2NzgsOS41MDUzOTEwMSAxMy42NDU3NjE3LDEwLjY2Mzg3MzQgQzEyLjg3NTAwOTcsMTEuNjM5NTExIDEyLjI1Njc1OTMsMTIuMjExNzczNCAxMS42NjU5ODY4LDEyLjQ5MDkyNTggQzExLjU5NzI5MjMsMTIuNTM0MTk0NCAxMS41Mjk5NzE3LDEyLjU0ODE1MjEgMTEuNDQ2MTY0NCwxMi41NDgxNTIxIEMxMS4zOTEyMDg5LDEyLjU0ODE1MjEgMTEuMzM2MjUzMywxMi41MzQxOTQ0IDExLjI2NzU1ODgsMTIuNTA0ODgzNCBDMTEuMTQzOTA4NywxMi40NjQ0MDYzIDExLjAzMzk5NzYsMTIuMzY2NzAzIDEwLjk3OTA0MiwxMi4yNDEwODQ0IEMxMC44MTQxNzUyLDExLjg2MjgzMjkgMTAuNTgwNjE0LDExLjU0MzIwMzUgMTAuMjY1OTkzMiwxMS4yOTA1NzA1IEM5Ljk0ODYyNDc0LDExLjA1MzI5MSA5LjU5MTQxMzQ0LDEwLjg3MTg0MiA5LjE4MDYyMDQzLDEwLjc3NDEzODYgQzkuMDU1NTk2NDgsMTAuNzQ2MjIzNCA4LjkzMTk0NjQxLDEwLjY2Mzg3MzQgOC44NjMyNTE5MywxMC41MzY4NTkxIEM4Ljc5NDU1NzQ1LDEwLjQyNTE5ODEgOC43Njg0NTM1NCwxMC4yODU2MjE5IDguNzk0NTU3NDUsMTAuMTQ3NDQxNSBDOC45NTk0MjQyLDkuNTA1MzkxMDEgOS4zODUzMjk5OSw4Ljc1MTY3OTU2IDEwLjEyNzIzMDQsNy44MTY1MTkwNSBDMTEuNTg0OTI3Myw1Ljk0NDgwMjI3IDE0LjQ5NzU3MzMsMy4xNjg2MzE3NSAxNS45MTEzMDU4LDMuMDEzNzAyMTggQzE2LjI5NTk5NDksMi45NTc4NzE3IDE2LjUxNTgxNzIsMy4wODM0OTAyOCAxNi42NTMyMDYyLDMuMTk1MTUxMjMgQzE3LjAxMTc5MTQsMy41MDIyMTg4NiAxNy4zNjkwMDI3LDQuMTczNTgwMzYgMTYuMTk5ODIyNiw2LjU4Njg1Mjc3IFogTTEwLjI2NTQ0MzcsMTMuOTk5MDQ2NiBDMTAuMzQ3ODc3MSwxNC42OTY5Mjc2IDEwLjE2OTI3MTQsMTUuMzgwODUwOSA5Ljc0MTk5MTc0LDE1LjkyNTE5ODEgQzkuMzcyNDE1NDMsMTYuNDEyMzE5IDguODUwMzM3MzcsMTYuNzQ4Njk3NyA4LjI1OTU2NDgyLDE2Ljg4ODI3MzggQzguMjMyMDg3MDMsMTYuOTAyMjMxNSA4LjE5MDg3MDM0LDE2LjkxNjE4OTEgOC4xNjMzOTI1NSwxNi45MTYxODkxIEw4LjAyNDYyOTcsMTYuOTMwMTQ2NyBDNy43NjQ5NjQ1NSwxNi45NzIwMTk2IDcuNTE3NjY0NDIsMTYuOTk5OTM0OCA3LjI2ODk5MDQsMTYuOTk5OTM0OCBDNS4yOTE5NjMyMSwxNi45OTk5MzQ4IDMuOTAyOTYwNzksMTUuNjU4NjA3NiAzLjM1NDc3ODgzLDE0Ljc4MDY3MzMgQzMuMTQ3MzIxNDksMTQuNDMxNzMyOCAyLjgzMjcwMDc2LDEzLjc4OTY4MjMgMy4xMDc0Nzg2OSwxMy4zODQ5MTE0IEMzLjE3NjE3MzE3LDEzLjI4NzIwOCAzLjM2NzE0MzgzLDEzLjA3Nzg0MzcgMy43NzkzMTA3MiwxMy4xNjE1ODk0IEM1LjA4NDUwNTg4LDEzLjQ0MDc0MTggNS41NTE2MjgzNSwxMi44NTQ1MjE4IDUuNjM1NDM1NjIsMTIuNzQyODYwOSBDNi41MTQ3MjQ5OSwxMS41ODQzNzg0IDguMTQ5NjUzNjUsMTEuMzc1MDE0MSA5LjI3NDg2OTI2LDEyLjI0MDM4NjYgQzkuODI1Nzk5MDEsMTIuNjczMDcyOCAxMC4xODE2MzY0LDEzLjMwMTE2NTYgMTAuMjY1NDQzNywxMy45OTkwNDY2IFoiIGlkPSJGaWxsLTQiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==";
  SymbolMorph.prototype.brushGrey = new Image();
  SymbolMorph.prototype.brushGrey.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMHB4IiBoZWlnaHQ9IjIwcHgiIHZpZXdCb3g9IjAgMCAxNCAxNCIgdmVyc2lvbj0iMS4xIj4KICA8dGl0bGU+cGFpbnQ8L3RpdGxlPgogIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHRyYW5zZm9ybT0ibWF0cml4KDEsIDAsIDAsIDEsIC0zLCAtMykiPgogICAgPGcgaWQ9InBhaW50IiBmaWxsPSIjNTc1ZTc1Ij4KICAgICAgPHBhdGggZD0iTTE2LjE5OTgyMjYsNi41ODY4NTI3NyBDMTUuNTQxNzI5NCw3Ljk0MjEzNzYzIDE0LjU2NjI2NzgsOS41MDUzOTEwMSAxMy42NDU3NjE3LDEwLjY2Mzg3MzQgQzEyLjg3NTAwOTcsMTEuNjM5NTExIDEyLjI1Njc1OTMsMTIuMjExNzczNCAxMS42NjU5ODY4LDEyLjQ5MDkyNTggQzExLjU5NzI5MjMsMTIuNTM0MTk0NCAxMS41Mjk5NzE3LDEyLjU0ODE1MjEgMTEuNDQ2MTY0NCwxMi41NDgxNTIxIEMxMS4zOTEyMDg5LDEyLjU0ODE1MjEgMTEuMzM2MjUzMywxMi41MzQxOTQ0IDExLjI2NzU1ODgsMTIuNTA0ODgzNCBDMTEuMTQzOTA4NywxMi40NjQ0MDYzIDExLjAzMzk5NzYsMTIuMzY2NzAzIDEwLjk3OTA0MiwxMi4yNDEwODQ0IEMxMC44MTQxNzUyLDExLjg2MjgzMjkgMTAuNTgwNjE0LDExLjU0MzIwMzUgMTAuMjY1OTkzMiwxMS4yOTA1NzA1IEM5Ljk0ODYyNDc0LDExLjA1MzI5MSA5LjU5MTQxMzQ0LDEwLjg3MTg0MiA5LjE4MDYyMDQzLDEwLjc3NDEzODYgQzkuMDU1NTk2NDgsMTAuNzQ2MjIzNCA4LjkzMTk0NjQxLDEwLjY2Mzg3MzQgOC44NjMyNTE5MywxMC41MzY4NTkxIEM4Ljc5NDU1NzQ1LDEwLjQyNTE5ODEgOC43Njg0NTM1NCwxMC4yODU2MjE5IDguNzk0NTU3NDUsMTAuMTQ3NDQxNSBDOC45NTk0MjQyLDkuNTA1MzkxMDEgOS4zODUzMjk5OSw4Ljc1MTY3OTU2IDEwLjEyNzIzMDQsNy44MTY1MTkwNSBDMTEuNTg0OTI3Myw1Ljk0NDgwMjI3IDE0LjQ5NzU3MzMsMy4xNjg2MzE3NSAxNS45MTEzMDU4LDMuMDEzNzAyMTggQzE2LjI5NTk5NDksMi45NTc4NzE3IDE2LjUxNTgxNzIsMy4wODM0OTAyOCAxNi42NTMyMDYyLDMuMTk1MTUxMjMgQzE3LjAxMTc5MTQsMy41MDIyMTg4NiAxNy4zNjkwMDI3LDQuMTczNTgwMzYgMTYuMTk5ODIyNiw2LjU4Njg1Mjc3IFogTTEwLjI2NTQ0MzcsMTMuOTk5MDQ2NiBDMTAuMzQ3ODc3MSwxNC42OTY5Mjc2IDEwLjE2OTI3MTQsMTUuMzgwODUwOSA5Ljc0MTk5MTc0LDE1LjkyNTE5ODEgQzkuMzcyNDE1NDMsMTYuNDEyMzE5IDguODUwMzM3MzcsMTYuNzQ4Njk3NyA4LjI1OTU2NDgyLDE2Ljg4ODI3MzggQzguMjMyMDg3MDMsMTYuOTAyMjMxNSA4LjE5MDg3MDM0LDE2LjkxNjE4OTEgOC4xNjMzOTI1NSwxNi45MTYxODkxIEw4LjAyNDYyOTcsMTYuOTMwMTQ2NyBDNy43NjQ5NjQ1NSwxNi45NzIwMTk2IDcuNTE3NjY0NDIsMTYuOTk5OTM0OCA3LjI2ODk5MDQsMTYuOTk5OTM0OCBDNS4yOTE5NjMyMSwxNi45OTk5MzQ4IDMuOTAyOTYwNzksMTUuNjU4NjA3NiAzLjM1NDc3ODgzLDE0Ljc4MDY3MzMgQzMuMTQ3MzIxNDksMTQuNDMxNzMyOCAyLjgzMjcwMDc2LDEzLjc4OTY4MjMgMy4xMDc0Nzg2OSwxMy4zODQ5MTE0IEMzLjE3NjE3MzE3LDEzLjI4NzIwOCAzLjM2NzE0MzgzLDEzLjA3Nzg0MzcgMy43NzkzMTA3MiwxMy4xNjE1ODk0IEM1LjA4NDUwNTg4LDEzLjQ0MDc0MTggNS41NTE2MjgzNSwxMi44NTQ1MjE4IDUuNjM1NDM1NjIsMTIuNzQyODYwOSBDNi41MTQ3MjQ5OSwxMS41ODQzNzg0IDguMTQ5NjUzNjUsMTEuMzc1MDE0MSA5LjI3NDg2OTI2LDEyLjI0MDM4NjYgQzkuODI1Nzk5MDEsMTIuNjczMDcyOCAxMC4xODE2MzY0LDEzLjMwMTE2NTYgMTAuMjY1NDQzNywxMy45OTkwNDY2IFoiIGlkPSJGaWxsLTQiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==";
  SymbolMorph.prototype.trash = new Image();
  SymbolMorph.prototype.trash.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjBweCIgaGVpZ2h0PSIyMHB4IiB2aWV3Qm94PSIwIDAgMjAgMjAiIHZlcnNpb249IjEuMSI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDUwLjIgKDU1MDQ3KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5kZWxldGU8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcy8+CiAgICA8ZyBpZD0iZGVsZXRlIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iRGVsZXRlLUljb24iIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIuMDAwMDAwLCAxLjUwMDAwMCkiIGZpbGw9IiNGRkYiIGZpbGwtcnVsZT0ibm9uemVybyI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0yLDMuMjUgTDE0LDMuMjUgQzE0LjQ0MzcxNjQsMy4yNSAxNC43OTA0MjkzLDMuNjMzMTEzNDMgMTQuNzQ2Mjc3OSw0LjA3NDYyNzc5IEwxMy42MzYzMjc1LDE1LjE3NDEzMTUgQzEzLjU0Njg2NzIsMTYuMDY4NzM0NyAxMi43OTQwNzc1LDE2Ljc1IDExLjg5NTAxMjQsMTYuNzUgTDQuMTA0OTg3NTYsMTYuNzUgQzMuMjA1OTIyNTMsMTYuNzUgMi40NTMxMzI3OSwxNi4wNjg3MzQ3IDIuMzYzNjcyNDgsMTUuMTc0MTMxNSBMMS4yNTM3MjIxMSw0LjA3NDYyNzc5IEMxLjIwOTU3MDY3LDMuNjMzMTEzNDMgMS41NTYyODM1NiwzLjI1IDIsMy4yNSBaIE04Ljc1LDEyIEw4Ljc1LDcgQzguNzUsNi41ODU3ODY0NCA4LjQxNDIxMzU2LDYuMjUgOCw2LjI1IEM3LjU4NTc4NjQ0LDYuMjUgNy4yNSw2LjU4NTc4NjQ0IDcuMjUsNyBMNy4yNSwxMiBDNy4yNSwxMi40MTQyMTM2IDcuNTg1Nzg2NDQsMTIuNzUgOCwxMi43NSBDOC40MTQyMTM1NiwxMi43NSA4Ljc1LDEyLjQxNDIxMzYgOC43NSwxMiBaIE0xMS4yNSwxMiBMMTEuMjUsNyBDMTEuMjUsNi41ODU3ODY0NCAxMC45MTQyMTM2LDYuMjUgMTAuNSw2LjI1IEMxMC4wODU3ODY0LDYuMjUgOS43NSw2LjU4NTc4NjQ0IDkuNzUsNyBMOS43NSwxMiBDOS43NSwxMi40MTQyMTM2IDEwLjA4NTc4NjQsMTIuNzUgMTAuNSwxMi43NSBDMTAuOTE0MjEzNiwxMi43NSAxMS4yNSwxMi40MTQyMTM2IDExLjI1LDEyIFogTTYuMjUsMTIgTDYuMjUsNyBDNi4yNSw2LjU4NTc4NjQ0IDUuOTE0MjEzNTYsNi4yNSA1LjUsNi4yNSBDNS4wODU3ODY0NCw2LjI1IDQuNzUsNi41ODU3ODY0NCA0Ljc1LDcgTDQuNzUsMTIgQzQuNzUsMTIuNDE0MjEzNiA1LjA4NTc4NjQ0LDEyLjc1IDUuNSwxMi43NSBDNS45MTQyMTM1NiwxMi43NSA2LjI1LDEyLjQxNDIxMzYgNi4yNSwxMiBaIE0xLjUsNCBMMTQuNSw0IEwxLjUsNCBaIE0xLjUsMyBMMTQuNSwzIEMxNS4wNTIyODQ3LDMgMTUuNSwzLjQ0NzcxNTI1IDE1LjUsNCBDMTUuNSw0LjU1MjI4NDc1IDE1LjA1MjI4NDcsNSAxNC41LDUgTDEuNSw1IEMwLjk0NzcxNTI1LDUgMC41LDQuNTUyMjg0NzUgMC41LDQgQzAuNSwzLjQ0NzcxNTI1IDAuOTQ3NzE1MjUsMyAxLjUsMyBaIE05LjI1LDMuMjUgTDkuMjUsMiBDOS4yNSwxLjg2MTkyODgxIDkuMTM4MDcxMTksMS43NSA5LDEuNzUgTDcsMS43NSBDNi44NjE5Mjg4MSwxLjc1IDYuNzUsMS44NjE5Mjg4MSA2Ljc1LDIgTDYuNzUsMy4yNSBMOS4yNSwzLjI1IFogTTcsMC4yNSBMOSwwLjI1IEM5Ljk2NjQ5ODMxLDAuMjUgMTAuNzUsMS4wMzM1MDE2OSAxMC43NSwyIEwxMC43NSw0Ljc1IEw1LjI1LDQuNzUgTDUuMjUsMiBDNS4yNSwxLjAzMzUwMTY5IDYuMDMzNTAxNjksMC4yNSA3LDAuMjUgWiIgaWQ9IkNvbWJpbmVkLVNoYXBlIi8+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=";
  SymbolMorph.prototype.trashBlack = new Image();
  SymbolMorph.prototype.trashBlack.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjBweCIgaGVpZ2h0PSIyMHB4IiB2aWV3Qm94PSIwIDAgMjAgMjAiIHZlcnNpb249IjEuMSI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDUwLjIgKDU1MDQ3KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5kZWxldGU8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcy8+CiAgICA8ZyBpZD0iZGVsZXRlIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iRGVsZXRlLUljb24iIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIuMDAwMDAwLCAxLjUwMDAwMCkiIGZpbGw9IiMwMDAiIGZpbGwtcnVsZT0ibm9uemVybyI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0yLDMuMjUgTDE0LDMuMjUgQzE0LjQ0MzcxNjQsMy4yNSAxNC43OTA0MjkzLDMuNjMzMTEzNDMgMTQuNzQ2Mjc3OSw0LjA3NDYyNzc5IEwxMy42MzYzMjc1LDE1LjE3NDEzMTUgQzEzLjU0Njg2NzIsMTYuMDY4NzM0NyAxMi43OTQwNzc1LDE2Ljc1IDExLjg5NTAxMjQsMTYuNzUgTDQuMTA0OTg3NTYsMTYuNzUgQzMuMjA1OTIyNTMsMTYuNzUgMi40NTMxMzI3OSwxNi4wNjg3MzQ3IDIuMzYzNjcyNDgsMTUuMTc0MTMxNSBMMS4yNTM3MjIxMSw0LjA3NDYyNzc5IEMxLjIwOTU3MDY3LDMuNjMzMTEzNDMgMS41NTYyODM1NiwzLjI1IDIsMy4yNSBaIE04Ljc1LDEyIEw4Ljc1LDcgQzguNzUsNi41ODU3ODY0NCA4LjQxNDIxMzU2LDYuMjUgOCw2LjI1IEM3LjU4NTc4NjQ0LDYuMjUgNy4yNSw2LjU4NTc4NjQ0IDcuMjUsNyBMNy4yNSwxMiBDNy4yNSwxMi40MTQyMTM2IDcuNTg1Nzg2NDQsMTIuNzUgOCwxMi43NSBDOC40MTQyMTM1NiwxMi43NSA4Ljc1LDEyLjQxNDIxMzYgOC43NSwxMiBaIE0xMS4yNSwxMiBMMTEuMjUsNyBDMTEuMjUsNi41ODU3ODY0NCAxMC45MTQyMTM2LDYuMjUgMTAuNSw2LjI1IEMxMC4wODU3ODY0LDYuMjUgOS43NSw2LjU4NTc4NjQ0IDkuNzUsNyBMOS43NSwxMiBDOS43NSwxMi40MTQyMTM2IDEwLjA4NTc4NjQsMTIuNzUgMTAuNSwxMi43NSBDMTAuOTE0MjEzNiwxMi43NSAxMS4yNSwxMi40MTQyMTM2IDExLjI1LDEyIFogTTYuMjUsMTIgTDYuMjUsNyBDNi4yNSw2LjU4NTc4NjQ0IDUuOTE0MjEzNTYsNi4yNSA1LjUsNi4yNSBDNS4wODU3ODY0NCw2LjI1IDQuNzUsNi41ODU3ODY0NCA0Ljc1LDcgTDQuNzUsMTIgQzQuNzUsMTIuNDE0MjEzNiA1LjA4NTc4NjQ0LDEyLjc1IDUuNSwxMi43NSBDNS45MTQyMTM1NiwxMi43NSA2LjI1LDEyLjQxNDIxMzYgNi4yNSwxMiBaIE0xLjUsNCBMMTQuNSw0IEwxLjUsNCBaIE0xLjUsMyBMMTQuNSwzIEMxNS4wNTIyODQ3LDMgMTUuNSwzLjQ0NzcxNTI1IDE1LjUsNCBDMTUuNSw0LjU1MjI4NDc1IDE1LjA1MjI4NDcsNSAxNC41LDUgTDEuNSw1IEMwLjk0NzcxNTI1LDUgMC41LDQuNTUyMjg0NzUgMC41LDQgQzAuNSwzLjQ0NzcxNTI1IDAuOTQ3NzE1MjUsMyAxLjUsMyBaIE05LjI1LDMuMjUgTDkuMjUsMiBDOS4yNSwxLjg2MTkyODgxIDkuMTM4MDcxMTksMS43NSA5LDEuNzUgTDcsMS43NSBDNi44NjE5Mjg4MSwxLjc1IDYuNzUsMS44NjE5Mjg4MSA2Ljc1LDIgTDYuNzUsMy4yNSBMOS4yNSwzLjI1IFogTTcsMC4yNSBMOSwwLjI1IEM5Ljk2NjQ5ODMxLDAuMjUgMTAuNzUsMS4wMzM1MDE2OSAxMC43NSwyIEwxMC43NSw0Ljc1IEw1LjI1LDQuNzUgTDUuMjUsMiBDNS4yNSwxLjAzMzUwMTY5IDYuMDMzNTAxNjksMC4yNSA3LDAuMjUgWiIgaWQ9IkNvbWJpbmVkLVNoYXBlIi8+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=";
  SymbolMorph.prototype.trashGrey = new Image();
  SymbolMorph.prototype.trashGrey.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjBweCIgaGVpZ2h0PSIyMHB4IiB2aWV3Qm94PSIwIDAgMjAgMjAiIHZlcnNpb249IjEuMSI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDUwLjIgKDU1MDQ3KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5kZWxldGU8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcy8+CiAgICA8ZyBpZD0iZGVsZXRlIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iRGVsZXRlLUljb24iIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIuMDAwMDAwLCAxLjUwMDAwMCkiIGZpbGw9IiM1NzVlNzUiIGZpbGwtcnVsZT0ibm9uemVybyI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0yLDMuMjUgTDE0LDMuMjUgQzE0LjQ0MzcxNjQsMy4yNSAxNC43OTA0MjkzLDMuNjMzMTEzNDMgMTQuNzQ2Mjc3OSw0LjA3NDYyNzc5IEwxMy42MzYzMjc1LDE1LjE3NDEzMTUgQzEzLjU0Njg2NzIsMTYuMDY4NzM0NyAxMi43OTQwNzc1LDE2Ljc1IDExLjg5NTAxMjQsMTYuNzUgTDQuMTA0OTg3NTYsMTYuNzUgQzMuMjA1OTIyNTMsMTYuNzUgMi40NTMxMzI3OSwxNi4wNjg3MzQ3IDIuMzYzNjcyNDgsMTUuMTc0MTMxNSBMMS4yNTM3MjIxMSw0LjA3NDYyNzc5IEMxLjIwOTU3MDY3LDMuNjMzMTEzNDMgMS41NTYyODM1NiwzLjI1IDIsMy4yNSBaIE04Ljc1LDEyIEw4Ljc1LDcgQzguNzUsNi41ODU3ODY0NCA4LjQxNDIxMzU2LDYuMjUgOCw2LjI1IEM3LjU4NTc4NjQ0LDYuMjUgNy4yNSw2LjU4NTc4NjQ0IDcuMjUsNyBMNy4yNSwxMiBDNy4yNSwxMi40MTQyMTM2IDcuNTg1Nzg2NDQsMTIuNzUgOCwxMi43NSBDOC40MTQyMTM1NiwxMi43NSA4Ljc1LDEyLjQxNDIxMzYgOC43NSwxMiBaIE0xMS4yNSwxMiBMMTEuMjUsNyBDMTEuMjUsNi41ODU3ODY0NCAxMC45MTQyMTM2LDYuMjUgMTAuNSw2LjI1IEMxMC4wODU3ODY0LDYuMjUgOS43NSw2LjU4NTc4NjQ0IDkuNzUsNyBMOS43NSwxMiBDOS43NSwxMi40MTQyMTM2IDEwLjA4NTc4NjQsMTIuNzUgMTAuNSwxMi43NSBDMTAuOTE0MjEzNiwxMi43NSAxMS4yNSwxMi40MTQyMTM2IDExLjI1LDEyIFogTTYuMjUsMTIgTDYuMjUsNyBDNi4yNSw2LjU4NTc4NjQ0IDUuOTE0MjEzNTYsNi4yNSA1LjUsNi4yNSBDNS4wODU3ODY0NCw2LjI1IDQuNzUsNi41ODU3ODY0NCA0Ljc1LDcgTDQuNzUsMTIgQzQuNzUsMTIuNDE0MjEzNiA1LjA4NTc4NjQ0LDEyLjc1IDUuNSwxMi43NSBDNS45MTQyMTM1NiwxMi43NSA2LjI1LDEyLjQxNDIxMzYgNi4yNSwxMiBaIE0xLjUsNCBMMTQuNSw0IEwxLjUsNCBaIE0xLjUsMyBMMTQuNSwzIEMxNS4wNTIyODQ3LDMgMTUuNSwzLjQ0NzcxNTI1IDE1LjUsNCBDMTUuNSw0LjU1MjI4NDc1IDE1LjA1MjI4NDcsNSAxNC41LDUgTDEuNSw1IEMwLjk0NzcxNTI1LDUgMC41LDQuNTUyMjg0NzUgMC41LDQgQzAuNSwzLjQ0NzcxNTI1IDAuOTQ3NzE1MjUsMyAxLjUsMyBaIE05LjI1LDMuMjUgTDkuMjUsMiBDOS4yNSwxLjg2MTkyODgxIDkuMTM4MDcxMTksMS43NSA5LDEuNzUgTDcsMS43NSBDNi44NjE5Mjg4MSwxLjc1IDYuNzUsMS44NjE5Mjg4MSA2Ljc1LDIgTDYuNzUsMy4yNSBMOS4yNSwzLjI1IFogTTcsMC4yNSBMOSwwLjI1IEM5Ljk2NjQ5ODMxLDAuMjUgMTAuNzUsMS4wMzM1MDE2OSAxMC43NSwyIEwxMC43NSw0Ljc1IEw1LjI1LDQuNzUgTDUuMjUsMiBDNS4yNSwxLjAzMzUwMTY5IDYuMDMzNTAxNjksMC4yNSA3LDAuMjUgWiIgaWQ9IkNvbWJpbmVkLVNoYXBlIi8+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4=";

  SymbolMorph.prototype.commentClose = new Image();
  SymbolMorph.prototype.commentClose.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgd2lkdGg9IjgiCiAgIGhlaWdodD0iOCIKICAgdmlld0JveD0iLTE0IC0xMCA4IDgiCiAgIHZlcnNpb249IjEuMSIKICAgaWQ9InN2ZzEiCiAgIHNvZGlwb2RpOmRvY25hbWU9ImNvbW1lbnQtY2xvc2Uuc3ZnIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIxLjQgKGU3YzNmZWIxMDAsIDIwMjQtMTAtMDkpIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyIKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIj4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaWQ9Im5hbWVkdmlldzEiCiAgICAgcGFnZWNvbG9yPSIjNTA1MDUwIgogICAgIGJvcmRlcmNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcm9wYWNpdHk9IjEiCiAgICAgaW5rc2NhcGU6c2hvd3BhZ2VzaGFkb3c9IjAiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiCiAgICAgaW5rc2NhcGU6cGFnZWNoZWNrZXJib2FyZD0iMSIKICAgICBpbmtzY2FwZTpkZXNrY29sb3I9IiM1MDUwNTAiCiAgICAgaW5rc2NhcGU6em9vbT0iMTk5Ljc1IgogICAgIGlua3NjYXBlOmN4PSI2LjA2NTA4MTQiCiAgICAgaW5rc2NhcGU6Y3k9IjUuNzA5NjM3MSIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwOCIKICAgICBpbmtzY2FwZTp3aW5kb3cteD0iMCIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iMCIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9InN2ZzEiIC8+CiAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA1MC4yICg1NTA0NykgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgPHRpdGxlCiAgICAgaWQ9InRpdGxlMSI+ZGVsZXRlLXg8L3RpdGxlPgogIDxkZXNjCiAgICAgaWQ9ImRlc2MxIj5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICA8ZGVmcwogICAgIGlkPSJkZWZzMSIgLz4KICA8ZwogICAgIGlkPSJkZWxldGUteCIKICAgICBzdHJva2U9Im5vbmUiCiAgICAgc3Ryb2tlLXdpZHRoPSIxIgogICAgIGZpbGw9Im5vbmUiCiAgICAgZmlsbC1ydWxlPSJldmVub2RkIgogICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNzM2NjIzNywwLDAsMC43MzY2MTQzNCwtMTQuMzY4MzEyLC0xMC4zNjgzMDgpIj4KICAgIDxwYXRoCiAgICAgICBkPSJtIDEwLjg3NjExMiwxMC44NzgyNSBjIC0wLjYzNCwwLjY0MyAtMS42NzA5OTk3LDAuNjQzIC0yLjMxMzk5OTcsMCBsIC0yLjYzMywtMi42MzMgLTIuNjM0LDIuNjMzIGMgLTAuNjM5LDAuNjM5IC0xLjY3NSwwLjYzOSAtMi4zMTM5OTk5OSwwIC0wLjMxOSwtMC4zMTkgLTAuNDgxLC0wLjc0MSAtMC40ODEsLTEuMTU3IDAsLTAuNDE3IDAuMTYyLC0wLjgzOCAwLjQ4MSwtMS4xNTcgbCAyLjYzMjk5OTk5LC0yLjYzMyAtMi42MzY5OTk5OSwtMi42MzggYyAtMC4zMiwtMC4zMiAtMC40ODIsLTAuNzQxIC0wLjQ3NywtMS4xNjIgMCwtMC40MTcgMC4xNTcsLTAuODMzIDAuNDc3LC0xLjE1MiAwLjYzNzk5OTk5LC0wLjYzOSAxLjY3Mzk5OTk5LC0wLjYzOSAyLjMxMzk5OTk5LDAgbCAyLjYzOCwyLjYzNyAyLjYzNywtMi42MzcgYyAwLjYzOSwtMC42MzkgMS42NzU5OTk3LC0wLjYzOSAyLjMxNDk5OTcsMCAwLjYzOSwwLjYzOCAwLjYzOSwxLjY3NSAwLDIuMzE0IGwgLTIuNjM4OTk5NywyLjYzOCAyLjYzODk5OTcsMi42MzcgYyAwLjYzOSwwLjYzOSAwLjYzOSwxLjY2NiAtMC4wMDUsMi4zMSIKICAgICAgIGlkPSJGaWxsLTEiCiAgICAgICBmaWxsPSIjNTc1ZTc1IiAvPgogIDwvZz4KICA8bWV0YWRhdGEKICAgICBpZD0ibWV0YWRhdGEyIj4KICAgIDxyZGY6UkRGPgogICAgICA8Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+CiAgICAgICAgPGRjOnRpdGxlPmRlbGV0ZS14PC9kYzp0aXRsZT4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+Cjwvc3ZnPgo=";
  SymbolMorph.prototype.eraser = new Image();
  SymbolMorph.prototype.eraser.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNXB4IiBoZWlnaHQ9IjE1cHgiIHZpZXdCb3g9IjAgMCAxNSAxNSIgdmVyc2lvbj0iMS4xIj4KICA8dGl0bGU+ZXJhc2VyPC90aXRsZT4KICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiB0cmFuc2Zvcm09Im1hdHJpeCgxLCAwLCAwLCAxLCAtMi41LCAtMi42OTM2NTYpIj4KICAgIDxnIGlkPSJlcmFzZXIiIGZpbGw9IiNGRkYiPgogICAgICA8cGF0aCBkPSJNMTMuNTM3MDA2MSwxNC44MjkxNTk3IEwxMC45NjYwNTQ1LDE0LjgyOTE1OTcgTDguMzAxNjEzOCwxMi4xNjQ3MTkgTDExLjE2ODYxNDQsOS4yOTc3MTg0MiBMMTUuMTI2MzIxNiwxMy4yNTU0MjU3IEwxMy41MzcwMDYxLDE0LjgyOTE1OTcgWiBNMTYuNzc3OTYzMywxMi42OTQ0OTA4IEwxMS4xNjg2MTQ0LDcuMTAwNzIzNDMgTDguMzAxNjEzOCw0LjIzMzcyMjg3IEM4LjAwNTU2NDgzLDMuOTIyMDkyMzggNy41MDY5NTYwNCwzLjkyMjA5MjM4IDcuMTk1MzI1NTQsNC4yMzM3MjI4NyBMMy4yMjIwMzY3Myw4LjIwNzAxMTY5IEMyLjkyNTk4Nzc2LDguNTAzMDYwNjYgMi45MjU5ODc3Niw5LjAwMTY2OTQ1IDMuMjIyMDM2NzMsOS4yOTc3MTg0MiBMNi4xMDQ2MTg4MSwxMi4xNjQ3MTkgTDEwLjA5MzQ4OTEsMTYuMTUzNTg5MyBDMTAuMjMzNzIyOSwxNi4zMDk0MDQ2IDEwLjQzNjI4MjcsMTYuMzg3MzEyMiAxMC42Mzg4NDI1LDE2LjM4NzMxMjIgTDEzLjg2NDIxODEsMTYuMzg3MzEyMiBDMTQuMDY2Nzc4LDE2LjM4NzMxMjIgMTQuMjY5MzM3OCwxNi4zMDk0MDQ2IDE0LjQwOTU3MTUsMTYuMTUzNTg5MyBMMTYuNzc3OTYzMywxMy44MDA3NzkxIEMxNy4wNzQwMTIyLDEzLjUwNDczMDEgMTcuMDc0MDEyMiwxMy4wMDYxMjEzIDE2Ljc3Nzk2MzMsMTIuNjk0NDkwOCBMMTYuNzc3OTYzMywxMi42OTQ0OTA4IFoiIGlkPSJlcmFzZXItaWNvbiIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+";
  SymbolMorph.prototype.eraserBlack = new Image();
  SymbolMorph.prototype.eraserBlack.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNXB4IiBoZWlnaHQ9IjE1cHgiIHZpZXdCb3g9IjAgMCAxNSAxNSIgdmVyc2lvbj0iMS4xIj4KICA8dGl0bGU+ZXJhc2VyPC90aXRsZT4KICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiB0cmFuc2Zvcm09Im1hdHJpeCgxLCAwLCAwLCAxLCAtMi41LCAtMi42OTM2NTYpIj4KICAgIDxnIGlkPSJlcmFzZXIiIGZpbGw9IiMwMDAiPgogICAgICA8cGF0aCBkPSJNMTMuNTM3MDA2MSwxNC44MjkxNTk3IEwxMC45NjYwNTQ1LDE0LjgyOTE1OTcgTDguMzAxNjEzOCwxMi4xNjQ3MTkgTDExLjE2ODYxNDQsOS4yOTc3MTg0MiBMMTUuMTI2MzIxNiwxMy4yNTU0MjU3IEwxMy41MzcwMDYxLDE0LjgyOTE1OTcgWiBNMTYuNzc3OTYzMywxMi42OTQ0OTA4IEwxMS4xNjg2MTQ0LDcuMTAwNzIzNDMgTDguMzAxNjEzOCw0LjIzMzcyMjg3IEM4LjAwNTU2NDgzLDMuOTIyMDkyMzggNy41MDY5NTYwNCwzLjkyMjA5MjM4IDcuMTk1MzI1NTQsNC4yMzM3MjI4NyBMMy4yMjIwMzY3Myw4LjIwNzAxMTY5IEMyLjkyNTk4Nzc2LDguNTAzMDYwNjYgMi45MjU5ODc3Niw5LjAwMTY2OTQ1IDMuMjIyMDM2NzMsOS4yOTc3MTg0MiBMNi4xMDQ2MTg4MSwxMi4xNjQ3MTkgTDEwLjA5MzQ4OTEsMTYuMTUzNTg5MyBDMTAuMjMzNzIyOSwxNi4zMDk0MDQ2IDEwLjQzNjI4MjcsMTYuMzg3MzEyMiAxMC42Mzg4NDI1LDE2LjM4NzMxMjIgTDEzLjg2NDIxODEsMTYuMzg3MzEyMiBDMTQuMDY2Nzc4LDE2LjM4NzMxMjIgMTQuMjY5MzM3OCwxNi4zMDk0MDQ2IDE0LjQwOTU3MTUsMTYuMTUzNTg5MyBMMTYuNzc3OTYzMywxMy44MDA3NzkxIEMxNy4wNzQwMTIyLDEzLjUwNDczMDEgMTcuMDc0MDEyMiwxMy4wMDYxMjEzIDE2Ljc3Nzk2MzMsMTIuNjk0NDkwOCBMMTYuNzc3OTYzMywxMi42OTQ0OTA4IFoiIGlkPSJlcmFzZXItaWNvbiIvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+";
  SymbolMorph.prototype.paint = new Image();
  SymbolMorph.prototype.paint.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNXB4IiBoZWlnaHQ9IjE1cHgiIHZpZXdCb3g9IjAgMCAxNSAxNSIgdmVyc2lvbj0iMS4xIj4KICA8dGl0bGU+ZXJhc2VyPC90aXRsZT4KICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICA8dGl0bGU+ZmlsbDwvdGl0bGU+CiAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJtYXRyaXgoMSwgMCwgMCwgMSwgLTIuNTAwMDAxLCAtMikiPgogICAgPGcgaWQ9ImZpbGwiIGZpbGw9IiNGRkYiPgogICAgICA8cGF0aCBkPSJNMTQuMDQ1MDk2OSw5LjY5MzQ5NTA0IEwxNC4wMzA2ODE4LDkuNjc5MTYyMDcgQzEzLjQzOTY2MjksOS4zNjM4MzY4MiAxMi41MTcwOTY4LDguNjkwMTg3NDMgMTEuNDIxNTQ5Niw3LjYwMDg4MjAzIEMxMS4wOTAwMDI0LDcuMjcxMjIzODEgMTAuNzg3Mjg1NCw2Ljk1NTg5ODU3IDEwLjU0MjIyODgsNi42NTQ5MDYyOCBDMTAuNzE1MjEsNi40Mzk5MTE4IDEwLjg4ODE5MTEsNi4yMjQ5MTczMSAxMS4wNjExNzIyLDYuMDA5OTIyODIgQzExLjM3ODMwNDMsNi4yNjc5MTYyMSAxMS43MjQyNjY2LDYuNTgzMjQxNDYgMTIuMDg0NjQ0LDYuOTQxNTY1NiBDMTIuMzE1Mjg1NSw3LjE3MDg5MzA1IDEyLjUwMjY4MTcsNy4zNzE1NTQ1OCAxMi42OTAwNzgsNy41NzIyMTYxIEMxMi43MTg5MDgxLDcuNjE1MjE0OTkgMTIuNzYyMTUzNCw3LjY1ODIxMzg5IDEyLjgxOTgxMzgsNy43MDEyMTI3OSBDMTMuNjI3MDU5MSw4LjYxODUyMjYgMTQuMTAyNzU3Myw5LjM2MzgzNjgyIDE0LjMxODk4MzcsOS43OTM4MjU4IEMxNC4zMTg5ODM3LDkuODA4MTU4NzcgMTQuMzMzMzk4OCw5LjgyMjQ5MTczIDE0LjMzMzM5ODgsOS44MzY4MjQ3IEMxNC4yNDY5MDgyLDkuNzkzODI1OCAxNC4xNDYwMDI1LDkuNzUwODI2OSAxNC4wNDUwOTY5LDkuNjkzNDk1MDQgTTEwLjU5OTg4OTIsMTAuMDY2MTUyMSBDOS43MzQ5ODM1LDEwLjUzOTE0IDguOTEzMzIzMDksMTAuOTgzNDYyIDcuNjE1OTY0NTUsMTAuNjgyNDY5NyBDNi4xNzQ0NTUwNiwxMC4zNTI4MTE1IDUuNDgyNTMwNSw5Ljc2NTE1OTg3IDUuMTk0MjI4NjEsOS40MjExNjg2OSBMOC4zMDc4ODkxLDUuNDA3OTM4MjYgQzguNTI0MTE1NTMsNS44Mzc5MjcyMyA4Ljg0MTI0NzYyLDYuMjgyMjQ5MTcgOS4xNzI3OTQ4LDYuNjk3OTA1MTggQzguODI2ODMyNTIsNy4yMTM4OTE5NSA4LjU1Mjk0NTcyLDcuNjQzODgwOTMgOC40MjMyMDk4Niw3Ljg0NDU0MjQ1IEM4LjI3OTA1ODkxLDguMDg4MjAyODcgOC4zNTExMzQzOSw4LjQxNzg2MTA4IDguNjEwNjA2MSw4LjU3NTUyMzcgQzguNjk3MDk2NjcsOC42MzI4NTU1NyA4Ljc5ODAwMjMzLDguNjYxNTIxNSA4Ljg4NDQ5MjksOC42NjE1MjE1IEM5LjA3MTg4OTEzLDguNjYxNTIxNSA5LjI0NDg3MDI3LDguNTYxMTkwNzQgOS4zNDU3NzU5NCw4LjQwMzUyODExIEM5LjUwNDM0MTk4LDguMTMxMjAxNzYgOS42OTE3MzgyMSw3Ljg0NDU0MjQ1IDkuODkzNTQ5NTQsNy41NTc4ODMxMyBDMTAuMTk2MjY2NSw3LjkwMTg3NDMxIDEwLjQ3MDE1MzMsOC4xNzQyMDA2NiAxMC42NTc1NDk2LDguMzYwNTI5MjIgQzExLjA3NTU4NzMsOC43NzYxODUyMyAxMS40OTM2MjUxLDkuMTQ4ODQyMzQgMTEuODk3MjQ3Nyw5LjQ3ODUwMDU1IEMxMS40MjE1NDk2LDkuNjA3NDk3MjQgMTEuMDAzNTExOSw5Ljg1MTE1NzY2IDEwLjU5OTg4OTIsMTAuMDY2MTUyMSBNMTAuMjEwNjgxNiw1LjMzNjI3MzQzIEMxMC4wOTUzNjA5LDUuNDkzOTM2MDUgOS45NjU2MjUwMiw1LjY1MTU5ODY4IDkuODUwMzA0MjYsNS43OTQ5MjgzNCBDOS41MDQzNDE5OCw1LjMzNjI3MzQzIDkuMjg4MTE1NTYsNC45NjM2MTYzMiA5LjE3Mjc5NDgsNC43MDU2MjI5MyBDOS40MTc4NTE0MSw0LjgwNTk1MzY5IDkuNzYzODEzNjksNS4wMjA5NDgxOCAxMC4yMTA2ODE2LDUuMzM2MjczNDMgTTEzLjUxMTczODQsNC4wNzQ5NzI0NCBDMTMuNjcwMzA0NCw0LjA3NDk3MjQ0IDEzLjg0MzI4NTUsNC4xMDM2MzgzNyAxMy44NzIxMTU3LDQuMTc1MzAzMiBDMTQuMDQ1MDk2OSw0LjQ5MDYyODQ1IDEzLjYyNzA1OTEsNS40OTM5MzYwNSAxMy4wNjQ4NzA0LDYuMzk2OTEyOSBMMTIuODQ4NjQ0LDYuMTgxOTE4NDEgQzEyLjYxODAwMjUsNS45NTI1OTA5NiAxMi4yMjg3OTQ5LDUuNTk0MjY2ODEgMTEuNzgxOTI3LDUuMjA3Mjc2NzQgQzEyLjQ0NTAyMTMsNC41MzM2MjczNCAxMy4wNTA0NTUzLDQuMDc0OTcyNDQgMTMuNTExNzM4NCw0LjA3NDk3MjQ0IE0xNi41NTMzMjM0LDEyLjE1ODc2NTIgQzE2LjMzNzA5NywxMS41OTk3Nzk1IDE1Ljk5MTEzNDcsMTEuMDk4MTI1NyAxNS41ODc1MTIsMTAuNjY4MTM2NyBDMTUuNTQ0MjY2NywxMC42MTA4MDQ5IDE1LjQ4NjYwNjQsMTAuNTY3ODA2IDE1LjQyODk0NiwxMC41MjQ4MDcxIEMxNS42NzQwMDI2LDkuOTk0NDg3MzIgMTUuMjcwMzc5OSw5LjIzNDg0MDEzIDE0LjkyNDQxNzcsOC42OTAxODc0MyBDMTQuNjUwNTMwOSw4LjI0NTg2NTQ5IDE0LjI3NTczODQsNy43NDQyMTE2OSAxMy44Mjg4NzA1LDcuMjQyNTU3ODggQzE0LjM5MTA1OTIsNi4zODI1Nzk5MyAxNS4zNTY4NzA1LDQuNjc2OTU3IDE0LjgzNzkyNzEsMy42NzM2NDkzOSBDMTQuNjc5MzYxLDMuMzcyNjU3MTEgMTQuMzE4OTgzNywzIDEzLjUxMTczODQsMyBMMTMuNDk3MzIzMywzIEMxMi42NzU2NjI5LDMgMTEuNzY3NTExOSwzLjY1OTMxNjQzIDEwLjk0NTg1MTUsNC41MTkyOTQzOCBDMTAuMDIzMjg1NCwzLjg0NTY0NDk4IDkuMDE0MjI4NzUsMy4zMTUzMjUyNSA4LjQwODc5NDc3LDMuNjU5MzE2NDMgQzguMzUxMTM0MzksMy42ODc5ODIzNiA4LjI3OTA1ODkxLDMuNzE2NjQ4MjkgOC4yMzU4MTM2MywzLjc3Mzk4MDE1IEM4LjIyMTM5ODUzLDMuNzg4MzEzMTIgOC4xOTI1NjgzNSwzLjgwMjY0NjA5IDguMTc4MTUzMjUsMy44MzEzMTIwMiBDOC4xNjM3MzgxNiwzLjg0NTY0NDk4IDguMTQ5MzIzMDYsMy44NTk5Nzc5NSA4LjEzNDkwNzk3LDMuODg4NjQzODggTDguMTIwNDkyODcsMy45MTczMDk4MSBMNC4xMjc1MTE1OCw5LjA0ODUxMTU4IEM0LjExMzA5NjQ5LDkuMDQ4NTExNTggNC4xMTMwOTY0OSw5LjA0ODUxMTU4IDQuMDk4NjgxMzksOS4wNjI4NDQ1NCBMMy4yMDQ5NDU1MSwxMC4yMjM4MTQ4IEwzLjE2MTcwMDIzLDEwLjI2NjgxMzcgQzMuMTE4NDU0OTQsMTAuMzA5ODEyNiAzLjA4OTYyNDc1LDEwLjM2NzE0NDQgMy4wNzUyMDk2NiwxMC40MTAxNDMzIEwzLjA3NTIwOTY2LDEwLjQyNDQ3NjMgQzIuNjI4MzQxNzEsMTEuMzQxNzg2MSA0LjI4NjA3NzYzLDEzLjEzMzQwNjggNS4wNjQ0OTI3NSwxMy45MjE3MiBDNS43NTY0MTczMSwxNC42MDk3MDIzIDcuMjg0NDE3MzcsMTYgOC4yMzU4MTM2MywxNiBDOC40Mzc2MjQ5NiwxNiA4LjU5NjE5MSwxNS45NDI2NjgxIDguNzQwMzQxOTUsMTUuODEzNjcxNCBMMTQuMjYxMzIzMywxMS41NTY3ODA2IEMxNC4yOTAxNTM1LDExLjU0MjQ0NzYgMTQuMzA0NTY4NiwxMS41MTM3ODE3IDE0LjMzMzM5ODgsMTEuNDg1MTE1OCBDMTQuMzYyMjI5LDExLjUxMzc4MTcgMTQuMzc2NjQ0MSwxMS41NTY3ODA2IDE0LjM5MTA1OTIsMTEuNTg1NDQ2NSBDMTQuNTY0MDQwMywxMS45Mjk0Mzc3IDE0LjY3OTM2MSwxMi4yODc3NjE5IDE0LjY5Mzc3NjEsMTIuNjc0NzUxOSBDMTQuNzM3MDIxNCwxMy4wNjE3NDIgMTQuNzA4MTkxMiwxMy40NjMwNjUgMTQuNjUwNTMwOSwxMy44NTAwNTUxIEwxNC42NTA1MzA5LDEzLjg2NDM4ODEgQzE0LjYzNjExNTgsMTMuOTc5MDUxOCAxNC42MzYxMTU4LDE0LjA3OTM4MjYgMTQuNjUwNTMwOSwxNC4xOTQwNDYzIEMxNC43NTE0MzY1LDE0LjgzOTAyOTggMTUuMzU2ODcwNSwxNS4yODMzNTE3IDE1Ljk5MTEzNDcsMTUuMTgzMDIwOSBDMTYuNjM5ODE0LDE1LjA4MjY5MDIgMTcuMDg2NjgxOSwxNC40ODA3MDU2IDE2Ljk4NTc3NjIsMTMuODM1NzIyMiBDMTYuODk5Mjg1NywxMy4yNzY3MzY1IDE2Ljc4Mzk2NDksMTIuNzAzNDE3OSAxNi41NTMzMjM0LDEyLjE1ODc2NTIiIGlkPSJGaWxsLTEiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==";
  SymbolMorph.prototype.paintBlack = new Image();
  SymbolMorph.prototype.paintBlack.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNXB4IiBoZWlnaHQ9IjE1cHgiIHZpZXdCb3g9IjAgMCAxNSAxNSIgdmVyc2lvbj0iMS4xIj4KICA8dGl0bGU+ZXJhc2VyPC90aXRsZT4KICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICA8dGl0bGU+ZmlsbDwvdGl0bGU+CiAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJtYXRyaXgoMSwgMCwgMCwgMSwgLTIuNTAwMDAxLCAtMikiPgogICAgPGcgaWQ9ImZpbGwiIGZpbGw9IiMwMDAiPgogICAgICA8cGF0aCBkPSJNMTQuMDQ1MDk2OSw5LjY5MzQ5NTA0IEwxNC4wMzA2ODE4LDkuNjc5MTYyMDcgQzEzLjQzOTY2MjksOS4zNjM4MzY4MiAxMi41MTcwOTY4LDguNjkwMTg3NDMgMTEuNDIxNTQ5Niw3LjYwMDg4MjAzIEMxMS4wOTAwMDI0LDcuMjcxMjIzODEgMTAuNzg3Mjg1NCw2Ljk1NTg5ODU3IDEwLjU0MjIyODgsNi42NTQ5MDYyOCBDMTAuNzE1MjEsNi40Mzk5MTE4IDEwLjg4ODE5MTEsNi4yMjQ5MTczMSAxMS4wNjExNzIyLDYuMDA5OTIyODIgQzExLjM3ODMwNDMsNi4yNjc5MTYyMSAxMS43MjQyNjY2LDYuNTgzMjQxNDYgMTIuMDg0NjQ0LDYuOTQxNTY1NiBDMTIuMzE1Mjg1NSw3LjE3MDg5MzA1IDEyLjUwMjY4MTcsNy4zNzE1NTQ1OCAxMi42OTAwNzgsNy41NzIyMTYxIEMxMi43MTg5MDgxLDcuNjE1MjE0OTkgMTIuNzYyMTUzNCw3LjY1ODIxMzg5IDEyLjgxOTgxMzgsNy43MDEyMTI3OSBDMTMuNjI3MDU5MSw4LjYxODUyMjYgMTQuMTAyNzU3Myw5LjM2MzgzNjgyIDE0LjMxODk4MzcsOS43OTM4MjU4IEMxNC4zMTg5ODM3LDkuODA4MTU4NzcgMTQuMzMzMzk4OCw5LjgyMjQ5MTczIDE0LjMzMzM5ODgsOS44MzY4MjQ3IEMxNC4yNDY5MDgyLDkuNzkzODI1OCAxNC4xNDYwMDI1LDkuNzUwODI2OSAxNC4wNDUwOTY5LDkuNjkzNDk1MDQgTTEwLjU5OTg4OTIsMTAuMDY2MTUyMSBDOS43MzQ5ODM1LDEwLjUzOTE0IDguOTEzMzIzMDksMTAuOTgzNDYyIDcuNjE1OTY0NTUsMTAuNjgyNDY5NyBDNi4xNzQ0NTUwNiwxMC4zNTI4MTE1IDUuNDgyNTMwNSw5Ljc2NTE1OTg3IDUuMTk0MjI4NjEsOS40MjExNjg2OSBMOC4zMDc4ODkxLDUuNDA3OTM4MjYgQzguNTI0MTE1NTMsNS44Mzc5MjcyMyA4Ljg0MTI0NzYyLDYuMjgyMjQ5MTcgOS4xNzI3OTQ4LDYuNjk3OTA1MTggQzguODI2ODMyNTIsNy4yMTM4OTE5NSA4LjU1Mjk0NTcyLDcuNjQzODgwOTMgOC40MjMyMDk4Niw3Ljg0NDU0MjQ1IEM4LjI3OTA1ODkxLDguMDg4MjAyODcgOC4zNTExMzQzOSw4LjQxNzg2MTA4IDguNjEwNjA2MSw4LjU3NTUyMzcgQzguNjk3MDk2NjcsOC42MzI4NTU1NyA4Ljc5ODAwMjMzLDguNjYxNTIxNSA4Ljg4NDQ5MjksOC42NjE1MjE1IEM5LjA3MTg4OTEzLDguNjYxNTIxNSA5LjI0NDg3MDI3LDguNTYxMTkwNzQgOS4zNDU3NzU5NCw4LjQwMzUyODExIEM5LjUwNDM0MTk4LDguMTMxMjAxNzYgOS42OTE3MzgyMSw3Ljg0NDU0MjQ1IDkuODkzNTQ5NTQsNy41NTc4ODMxMyBDMTAuMTk2MjY2NSw3LjkwMTg3NDMxIDEwLjQ3MDE1MzMsOC4xNzQyMDA2NiAxMC42NTc1NDk2LDguMzYwNTI5MjIgQzExLjA3NTU4NzMsOC43NzYxODUyMyAxMS40OTM2MjUxLDkuMTQ4ODQyMzQgMTEuODk3MjQ3Nyw5LjQ3ODUwMDU1IEMxMS40MjE1NDk2LDkuNjA3NDk3MjQgMTEuMDAzNTExOSw5Ljg1MTE1NzY2IDEwLjU5OTg4OTIsMTAuMDY2MTUyMSBNMTAuMjEwNjgxNiw1LjMzNjI3MzQzIEMxMC4wOTUzNjA5LDUuNDkzOTM2MDUgOS45NjU2MjUwMiw1LjY1MTU5ODY4IDkuODUwMzA0MjYsNS43OTQ5MjgzNCBDOS41MDQzNDE5OCw1LjMzNjI3MzQzIDkuMjg4MTE1NTYsNC45NjM2MTYzMiA5LjE3Mjc5NDgsNC43MDU2MjI5MyBDOS40MTc4NTE0MSw0LjgwNTk1MzY5IDkuNzYzODEzNjksNS4wMjA5NDgxOCAxMC4yMTA2ODE2LDUuMzM2MjczNDMgTTEzLjUxMTczODQsNC4wNzQ5NzI0NCBDMTMuNjcwMzA0NCw0LjA3NDk3MjQ0IDEzLjg0MzI4NTUsNC4xMDM2MzgzNyAxMy44NzIxMTU3LDQuMTc1MzAzMiBDMTQuMDQ1MDk2OSw0LjQ5MDYyODQ1IDEzLjYyNzA1OTEsNS40OTM5MzYwNSAxMy4wNjQ4NzA0LDYuMzk2OTEyOSBMMTIuODQ4NjQ0LDYuMTgxOTE4NDEgQzEyLjYxODAwMjUsNS45NTI1OTA5NiAxMi4yMjg3OTQ5LDUuNTk0MjY2ODEgMTEuNzgxOTI3LDUuMjA3Mjc2NzQgQzEyLjQ0NTAyMTMsNC41MzM2MjczNCAxMy4wNTA0NTUzLDQuMDc0OTcyNDQgMTMuNTExNzM4NCw0LjA3NDk3MjQ0IE0xNi41NTMzMjM0LDEyLjE1ODc2NTIgQzE2LjMzNzA5NywxMS41OTk3Nzk1IDE1Ljk5MTEzNDcsMTEuMDk4MTI1NyAxNS41ODc1MTIsMTAuNjY4MTM2NyBDMTUuNTQ0MjY2NywxMC42MTA4MDQ5IDE1LjQ4NjYwNjQsMTAuNTY3ODA2IDE1LjQyODk0NiwxMC41MjQ4MDcxIEMxNS42NzQwMDI2LDkuOTk0NDg3MzIgMTUuMjcwMzc5OSw5LjIzNDg0MDEzIDE0LjkyNDQxNzcsOC42OTAxODc0MyBDMTQuNjUwNTMwOSw4LjI0NTg2NTQ5IDE0LjI3NTczODQsNy43NDQyMTE2OSAxMy44Mjg4NzA1LDcuMjQyNTU3ODggQzE0LjM5MTA1OTIsNi4zODI1Nzk5MyAxNS4zNTY4NzA1LDQuNjc2OTU3IDE0LjgzNzkyNzEsMy42NzM2NDkzOSBDMTQuNjc5MzYxLDMuMzcyNjU3MTEgMTQuMzE4OTgzNywzIDEzLjUxMTczODQsMyBMMTMuNDk3MzIzMywzIEMxMi42NzU2NjI5LDMgMTEuNzY3NTExOSwzLjY1OTMxNjQzIDEwLjk0NTg1MTUsNC41MTkyOTQzOCBDMTAuMDIzMjg1NCwzLjg0NTY0NDk4IDkuMDE0MjI4NzUsMy4zMTUzMjUyNSA4LjQwODc5NDc3LDMuNjU5MzE2NDMgQzguMzUxMTM0MzksMy42ODc5ODIzNiA4LjI3OTA1ODkxLDMuNzE2NjQ4MjkgOC4yMzU4MTM2MywzLjc3Mzk4MDE1IEM4LjIyMTM5ODUzLDMuNzg4MzEzMTIgOC4xOTI1NjgzNSwzLjgwMjY0NjA5IDguMTc4MTUzMjUsMy44MzEzMTIwMiBDOC4xNjM3MzgxNiwzLjg0NTY0NDk4IDguMTQ5MzIzMDYsMy44NTk5Nzc5NSA4LjEzNDkwNzk3LDMuODg4NjQzODggTDguMTIwNDkyODcsMy45MTczMDk4MSBMNC4xMjc1MTE1OCw5LjA0ODUxMTU4IEM0LjExMzA5NjQ5LDkuMDQ4NTExNTggNC4xMTMwOTY0OSw5LjA0ODUxMTU4IDQuMDk4NjgxMzksOS4wNjI4NDQ1NCBMMy4yMDQ5NDU1MSwxMC4yMjM4MTQ4IEwzLjE2MTcwMDIzLDEwLjI2NjgxMzcgQzMuMTE4NDU0OTQsMTAuMzA5ODEyNiAzLjA4OTYyNDc1LDEwLjM2NzE0NDQgMy4wNzUyMDk2NiwxMC40MTAxNDMzIEwzLjA3NTIwOTY2LDEwLjQyNDQ3NjMgQzIuNjI4MzQxNzEsMTEuMzQxNzg2MSA0LjI4NjA3NzYzLDEzLjEzMzQwNjggNS4wNjQ0OTI3NSwxMy45MjE3MiBDNS43NTY0MTczMSwxNC42MDk3MDIzIDcuMjg0NDE3MzcsMTYgOC4yMzU4MTM2MywxNiBDOC40Mzc2MjQ5NiwxNiA4LjU5NjE5MSwxNS45NDI2NjgxIDguNzQwMzQxOTUsMTUuODEzNjcxNCBMMTQuMjYxMzIzMywxMS41NTY3ODA2IEMxNC4yOTAxNTM1LDExLjU0MjQ0NzYgMTQuMzA0NTY4NiwxMS41MTM3ODE3IDE0LjMzMzM5ODgsMTEuNDg1MTE1OCBDMTQuMzYyMjI5LDExLjUxMzc4MTcgMTQuMzc2NjQ0MSwxMS41NTY3ODA2IDE0LjM5MTA1OTIsMTEuNTg1NDQ2NSBDMTQuNTY0MDQwMywxMS45Mjk0Mzc3IDE0LjY3OTM2MSwxMi4yODc3NjE5IDE0LjY5Mzc3NjEsMTIuNjc0NzUxOSBDMTQuNzM3MDIxNCwxMy4wNjE3NDIgMTQuNzA4MTkxMiwxMy40NjMwNjUgMTQuNjUwNTMwOSwxMy44NTAwNTUxIEwxNC42NTA1MzA5LDEzLjg2NDM4ODEgQzE0LjYzNjExNTgsMTMuOTc5MDUxOCAxNC42MzYxMTU4LDE0LjA3OTM4MjYgMTQuNjUwNTMwOSwxNC4xOTQwNDYzIEMxNC43NTE0MzY1LDE0LjgzOTAyOTggMTUuMzU2ODcwNSwxNS4yODMzNTE3IDE1Ljk5MTEzNDcsMTUuMTgzMDIwOSBDMTYuNjM5ODE0LDE1LjA4MjY5MDIgMTcuMDg2NjgxOSwxNC40ODA3MDU2IDE2Ljk4NTc3NjIsMTMuODM1NzIyMiBDMTYuODk5Mjg1NywxMy4yNzY3MzY1IDE2Ljc4Mzk2NDksMTIuNzAzNDE3OSAxNi41NTMzMjM0LDEyLjE1ODc2NTIiIGlkPSJGaWxsLTEiLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==";
  SymbolMorph.prototype.penIconSymbol = new Image();
  SymbolMorph.prototype.penIconSymbol.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48dGl0bGU+cGVuLWljb248L3RpdGxlPjxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjNTc1ZTc1IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Im04Ljc1MyAzNC42MDItNC4yNSAxLjc4IDEuNzgzLTQuMjM3YzEuMjE4LTIuODkyIDIuOTA3LTUuNDIzIDUuMDMtNy41MzhMMzEuMDY2IDQuOTNjLjg0Ni0uODQyIDIuNjUtLjQxIDQuMDMyLjk2NyAxLjM4IDEuMzc1IDEuODE2IDMuMTczLjk3IDQuMDE1TDE2LjMxOCAyOS41OWMtMi4xMjMgMi4xMTYtNC42NjQgMy44LTcuNTY1IDUuMDEyIi8+PHBhdGggZD0iTTI5LjQxIDYuMTFzLTQuNDUtMi4zNzgtOC4yMDIgNS43NzJjLTEuNzM0IDMuNzY2LTQuMzUgMS41NDYtNC4zNSAxLjU0NiIvPjxwYXRoIGZpbGw9IiM0Yzk3ZmYiIGQ9Ik0zNi40MiA4LjgyNWMwIC40NjMtLjE0Ljg3My0uNDMyIDEuMTY0bC05LjMzNSA5LjNjLjI4Mi0uMjkuNDEtLjY2OC40MS0xLjEyIDAtLjg3NC0uNTA3LTEuOTYzLTEuNDA2LTIuODY4LTEuMzYyLTEuMzU4LTMuMTQ3LTEuOC00LjAwMi0uOTlMMzAuOTkgNS4wMWMuODQ0LS44NCAyLjY1LS40MSA0LjAzNS45Ni44OTguOTA0IDEuMzk2IDEuOTgyIDEuMzk2IDIuODU1TTEwLjUxNSAzMy43NzRhMjQgMjQgMCAwIDEtMS43NjQuODNMNC41IDM2LjM4MmwxLjc4Ni00LjIzNWMuMjU4LS42MDQuNTMtMS4xODYuODMzLTEuNzU3LjY5LjE4MyAxLjQ0OC42MjUgMi4xMDggMS4yODIuNjYuNjU4IDEuMTAyIDEuNDEyIDEuMjg3IDIuMTAyIi8+PHBhdGggZmlsbD0iIzU3NWU3NSIgZD0iTTM2LjQ5OCA4Ljc0OGMwIC40NjQtLjE0Ljg3NC0uNDMzIDEuMTY1bC0xOS43NDIgMTkuNjhjLTIuMTMgMi4xMS00LjY3MyAzLjc5My03LjU3MiA1LjAxTDQuNSAzNi4zOGwuOTc0LTIuMzE2IDEuOTI1LS44MDhjMi44OTgtMS4yMTggNS40NC0yLjkgNy41Ny01LjAxbDE5Ljc0My0xOS42OGMuMjkyLS4yOTIuNDMyLS43MDIuNDMyLTEuMTY1IDAtLjY0Ni0uMjctMS40LS43OC0yLjEyMi4yNS4xNzIuNS4zNzcuNzM3LjYxNC44OTguOTA1IDEuMzk2IDEuOTgzIDEuMzk2IDIuODU2IiBvcGFjaXR5PSIuMTUiLz48cGF0aCBmaWxsPSIjNTc1ZTc1IiBkPSJNMTguNDUgMTIuODNhLjkwNC45MDQgMCAxIDEtLjkwMy0uOTAyYy41IDAgLjkwNC40MDQuOTA0LjkwNHoiLz48L2c+PC9zdmc+";
  SymbolMorph.prototype.ttsIconSymbol = new Image();
  SymbolMorph.prototype.ttsIconSymbol.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA0MCA0MCIgaGVpZ2h0PSI0MHB4IiB3aWR0aD0iNDBweCI+CiAgICAKICAgIDx0aXRsZT5FeHRlbnNpb25zL1NvZnR3YXJlL1RleHQtdG8tU3BlZWNoLUJsb2NrPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGcgc3Ryb2tlLW9wYWNpdHk9IjAuMTUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2U9Im5vbmUiIGlkPSJFeHRlbnNpb25zL1NvZnR3YXJlL1RleHQtdG8tU3BlZWNoLUJsb2NrIj4KICAgICAgICA8ZyBzdHJva2U9IiMwMDAwMDAiIGZpbGwtcnVsZT0ibm9uemVybyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNC4wMDAwMDAsIDQuMDAwMDAwKSIgaWQ9InRleHQyc3BlZWNoIj4KICAgICAgICAgICAgPHBhdGggZmlsbD0iIzRENEQ0RCIgaWQ9InNwZWFrZXIiIGQ9Ik0xMS41LDE3LjY2OTM0MzUgQzExLjUsMTYuNjUzOTI2OSAxMC4wMDYwMTQ1LDE2LjA4NDQyNzQgOS4xMTI1NjAyNCwxNi44ODgzIEw2LjQxMjU2MDI0LDE5LjA1MDcxNCBDNS4zOTM0Njc1NSwxOS44NjY4OTk0IDQuMDc0OTczNTEsMjAuMzMxNzU3NSAyLjcsMjAuMzMxNzU3NSBMMi4zLDIwLjMzMTc1NzUgQzEuMjY1MTkyMzMsMjAuMzMxNzU3NSAwLjUsMjEuMDIxMjAwMyAwLjUsMjEuOTA0MDcxIEwwLjUsMjYuMTM4Nzk4NiBDMC41LDI3LjAyMTY2OTMgMS4yNjUxOTIzMywyNy43MTExMTIgMi4zLDI3LjcxMTExMiBMMi43LDI3LjcxMTExMiBDNC4xNTc1NTY4MiwyNy43MTExMTIgNS40NTM3MjMyMiwyOC4xMzM1MjcxIDYuNTE5NzIwOTgsMjguOTk4IEw5LjExODQwMjkzLDMxLjE1OTMyMTYgQzEwLjAyNjE4NTUsMzEuOTA5MDc5MyAxMS41LDMxLjM0NzI2ODkgMTEuNSwzMC4yODM0MjU1IEwxMS41LDE3LjY2OTM0MzUgWiI+PC9wYXRoPgogICAgICAgICAgICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBpZD0ic3BlZWNoIiBkPSJNMjEuNjQzNjA2NiwxNi41IEMxOS45NzcwMDk5LDE4LjQzNzAyMzQgMTcuMTA1MDI3NSwxOS45Mjg1NzE0IDE1LjY2NjY2NjcsMTkuOTI4NTcxNCBDMTUuNTEyNjM5NywxOS45Mjg1NzE0IDE1LjMxNjYyOTIsMTkuODk1OTAzIDE1LjEwOTcyNjUsMTkuNzkyNDUxNyBDMTQuNzM3NjAzOSwxOS42MDYzOTA0IDE0LjUsMTkuMjQ5OTg0NiAxNC41LDE4Ljc2MTkwNDggQzE0LjUsMTguNjU2ODA0MSAxNC41MTcwNTU1LDE4LjU1NDUwNzYgMTQuNTQ5NDQ2NywxOC40NTQwODQ0IEMxNC42MjU3NTQ1LDE4LjIxNzUwNjMgMTUuMTczNTcyMSwxNy40Njc1MzEgMTUuMjc3MjA3MSwxNy4yODA5ODgxIEMxNS41NDYzNTI2LDE2Ljc5NjUyNjEgMTUuNzM5MDI1LDE2LjIwNjM1NjEgMTUuODQzMjg5MSwxNS40MTYwMDM0IEMxMy4xODk3MDA1LDEzLjkyNjgzNjkgMTEuNSwxMS4xMTM5NjY4IDExLjUsOCBDMTEuNSwzLjMwNTU3OTYzIDE1LjMwNTU3OTYsLTAuNSAyMCwtMC41IEwyNCwtMC41IEMyOC42OTQ0MjA0LC0wLjUgMzIuNSwzLjMwNTU3OTYzIDMyLjUsOCBDMzIuNSwxMi42OTQ0MjA0IDI4LjY5NDQyMDQsMTYuNSAyNCwxNi41IEwyMS42NDM2MDY2LDE2LjUgWiI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+PCEtLXJvdGF0aW9uQ2VudGVyOjIwOjIwLS0+";
  SymbolMorph.prototype.translateIconSymbol = new Image();
  SymbolMorph.prototype.translateIconSymbol.src = "src/translate-icon.png";
  SymbolMorph.prototype.addonIcon = new Image();
  SymbolMorph.prototype.addonIcon.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgLTk2MCA5NjAgOTYwIiB3aWR0aD0iMjAiPjxwYXRoIGZpbGw9IiNmZmZmZmYiIGQ9Ik0zNTItMTIwSDIwMHEtMzMgMC01Ni41LTIzLjVUMTIwLTIwMHYtMTUycTQ4IDAgODQtMzAuNXQzNi03Ny41cTAtNDctMzYtNzcuNVQxMjAtNTY4di0xNTJxMC0zMyAyMy41LTU2LjVUMjAwLTgwMGgxNjBxMC00MiAyOS03MXQ3MS0yOXE0MiAwIDcxIDI5dDI5IDcxaDE2MHEzMyAwIDU2LjUgMjMuNVQ4MDAtNzIwdjE2MHE0MiAwIDcxIDI5dDI5IDcxcTAgNDItMjkgNzF0LTcxIDI5djE2MHEwIDMzLTIzLjUgNTYuNVQ3MjAtMTIwSDU2OHEwLTUwLTMxLjUtODVUNDYwLTI0MHEtNDUgMC03Ni41IDM1VDM1Mi0xMjBaIi8+PC9zdmc+";
  SymbolMorph.prototype.addonIconBlack = new Image();
  SymbolMorph.prototype.addonIconBlack.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgLTk2MCA5NjAgOTYwIiB3aWR0aD0iMjAiPjxwYXRoIGZpbGw9IiMwMDAiIGQ9Ik0zNTItMTIwSDIwMHEtMzMgMC01Ni41LTIzLjVUMTIwLTIwMHYtMTUycTQ4IDAgODQtMzAuNXQzNi03Ny41cTAtNDctMzYtNzcuNVQxMjAtNTY4di0xNTJxMC0zMyAyMy41LTU2LjVUMjAwLTgwMGgxNjBxMC00MiAyOS03MXQ3MS0yOXE0MiAwIDcxIDI5dDI5IDcxaDE2MHEzMyAwIDU2LjUgMjMuNVQ4MDAtNzIwdjE2MHE0MiAwIDcxIDI5dDI5IDcxcTAgNDItMjkgNzF0LTcxIDI5djE2MHEwIDMzLTIzLjUgNTYuNVQ3MjAtMTIwSDU2OHEwLTUwLTMxLjUtODVUNDYwLTI0MHEtNDUgMC03Ni41IDM1VDM1Mi0xMjBaIi8+PC9zdmc";
  SymbolMorph.prototype.pipette = new Image();
  SymbolMorph.prototype.pipette.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNXB4IiBoZWlnaHQ9IjE1cHgiIHZpZXdCb3g9IjAgMCAxNSAxNSIgdmVyc2lvbj0iMS4xIj4KICA8dGl0bGU+ZXJhc2VyPC90aXRsZT4KICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICA8dGl0bGU+ZmlsbDwvdGl0bGU+CiAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgPHRpdGxlPmV5ZS1kcm9wcGVyPC90aXRsZT4KICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICA8ZyBpZD0iZ3JvdXAtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJtYXRyaXgoMSwgMCwgMCwgMSwgLTIuNTAwMDAxLCAtMi41KSI+CiAgICA8ZyBpZD0iZXllLWRyb3BwZXIiIGZpbGw9IiNGRkYiPgogICAgICA8cGF0aCBkPSJNOS4xNTMzNDYwNSwxMi40ODI0OTYyIEM5LjAzMzk0MDQ0LDEyLjYxODg3MzcgOC44ODA0MTg5NSwxMi43MDQxMDk2IDguNjA3NDkxODYsMTIuNzcyMjk4MyBDNy45MDgxMTYxOCwxMi45MjU3MjMgNy4yNDI4NTYzOSwxMy41NTY0Njg4IDcuMDM4MTYxMDcsMTQuMjU1NDAzMyBDNi45Njk5MjkzLDE0LjQ3NzAxNjcgNi43NDgxNzYwMywxNC43MTU2NzczIDYuNTA5MzY0ODMsMTQuODM1MDA3NiBMNC43MzUzMzg3MSwxNS42NzAzMTk2IEM0LjY1MDA0OSwxNS43MDQ0MTQgNC41ODE4MTcyMiwxNS43MjE0NjEyIDQuNTQ3NzAxMzQsMTUuNzIxNDYxMiBMNC4yNzQ3NzQyNCwxNS40NjU3NTM0IEM0LjI3NDc3NDI0LDE1LjQ0ODcwNjIgNC4yNzQ3NzQyNCwxNS4zODA1MTc1IDQuMzI1OTQ4MDcsMTUuMjYxMTg3MiBMNS4xNjE3ODczLDEzLjQ3MTIzMjkgQzUuMjY0MTM0OTYsMTMuMjQ5NjE5NSA1LjUwMjk0NjE3LDEzLjAyODAwNjEgNS43NDE3NTczNywxMi45NTk4MTc0IEM2LjQ0MTEzMzA1LDEyLjczODIwNCA3LjA3MjI3Njk2LDEyLjA5MDQxMSA3LjI1OTkxNDMzLDExLjIzODA1MTggQzcuMjk0MDMwMjIsMTEuMTAxNjc0MyA3LjM3OTMxOTk0LDEwLjk2NTI5NjggNy40OTg3MjU1NCwxMC44Mjg5MTkzIEwxMS40MzkxMTA1LDYuOTA4MDY2OTcgTDEzLjA5MzczMSw4LjU2MTY0Mzg0IEw5LjE1MzM0NjA1LDEyLjQ4MjQ5NjIgWiBNMTYuNjA3NjY3Myw1LjI4ODU4NDQ3IEMxNi44NjM1MzY1LDUuMDMyODc2NzEgMTcsNC42NzQ4ODU4NCAxNyw0LjMzMzk0MjE2IEMxNywzLjk5Mjk5ODQ4IDE2Ljg2MzUzNjUsMy42NTIwNTQ3OSAxNi42MDc2NjczLDMuMzk2MzQ3MDMgQzE2LjA3ODg3MTEsMi44Njc4ODQzMiAxNS4yNDMwMzE4LDIuODY3ODg0MzIgMTQuNzE0MjM1NiwzLjM5NjM0NzAzIEwxMy4yMzAxOTQ1LDQuODc5NDUyMDUgTDEzLjA1OTYxNTEsNC43MDg5ODAyMSBMMTIuNTEzNzYwOSw0LjE2MzQ3MDMyIEMxMi4xNzI2MDIsMy44MjI1MjY2NCAxMS42MDk2ODk5LDMuODIyNTI2NjQgMTEuMjY4NTMxLDQuMTYzNDcwMzIgTDEwLjYwMzI3MTIsNC44MTEyNjMzMiBDMTAuMjc5MTcwMyw1LjE1MjIwNyAxMC4yNjIxMTI0LDUuNjQ2NTc1MzQgMTAuNTUyMDk3NCw1Ljk4NzUxOTAzIEw2LjU5NDY1NDU0LDkuOTI1NDE4NTcgQzYuMzA0NjY5NTEsMTAuMjMyMjY3OSA2LjA5OTk3NDE4LDEwLjU5MDI1ODggNS45ODA1Njg1OCwxMS4xMDE2NzQzIEM1LjkyOTM5NDc1LDExLjM1NzM4MiA1LjYzOTQwOTcxLDExLjY0NzE4NDIgNS4zNjY0ODI2MiwxMS43MzI0MjAxIEM0LjgwMzU3MDQ5LDExLjkwMjg5MTkgNC4yNTc3MTYzLDEyLjM4MDIxMzEgNC4wMDE4NDcxNSwxMi45NDI3NzAyIEwzLjE2NjAwNzkyLDE0LjcxNTY3NzMgQzIuODkzMDgwODMsMTUuMzEyMzI4OCAyLjk2MTMxMjYsMTUuOTI2MDI3NCAzLjMzNjU4NzM2LDE2LjMxODExMjYgTDMuNjc3NzQ2MjMsMTYuNjU5MDU2MyBDMy44OTk0OTk0OSwxNi44ODA2Njk3IDQuMjA2NTQyNDcsMTcgNC41NDc3MDEzNCwxNyBDNC43Njk0NTQ2LDE3IDUuMDI1MzIzNzUsMTYuOTMxODExMyA1LjI2NDEzNDk2LDE2LjgyOTUyODIgTDcuMDU1MjE5MDEsMTUuOTk0MjE2MSBDNy42MTgxMzExNCwxNS43MjE0NjEyIDguMDk1NzUzNTYsMTUuMTkyOTk4NSA4LjI2NjMzMjk5LDE0LjYzMDQ0MTQgQzguMzM0NTY0NzcsMTQuMzU3Njg2NSA4LjY0MTYwNzc1LDE0LjA2Nzg4NDMgOS4wNTA5OTgzOSwxMy45ODI2NDg0IEM5LjQwOTIxNTIsMTMuODk3NDEyNSA5Ljc2NzQzMjAxLDEzLjY5Mjg0NjMgMTAuMDU3NDE3LDEzLjM4NTk5NyBMMTQuMDE0ODU5OSw5LjQ0ODA5NzQxIEMxNC4zNTYwMTg4LDkuNzM3ODk5NTQgMTQuODY3NzU3MSw5LjcwMzgwNTE4IDE1LjE3NDgwMDEsOS4zNzk5MDg2OCBMMTUuODQwMDU5OSw4LjczMjExNTY4IEMxNi4xODEyMTg3LDguMzkxMTcxOTkgMTYuMTgxMjE4Nyw3LjgyODYxNDkyIDE1Ljg0MDA1OTksNy40ODc2NzEyMyBMMTUuMjYwMDg5OCw2LjkwODA2Njk3IEwxNS4xMjM2MjYyLDYuNzcxNjg5NSBMMTYuNjA3NjY3Myw1LjI4ODU4NDQ3IFoiIGlkPSJleWUtZHJvcHBlci1pY29uIi8+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4";
  SymbolMorph.prototype.pipetteBlack = new Image();
  SymbolMorph.prototype.pipetteBlack.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNXB4IiBoZWlnaHQ9IjE1cHgiIHZpZXdCb3g9IjAgMCAxNSAxNSIgdmVyc2lvbj0iMS4xIj4KICA8dGl0bGU+ZXJhc2VyPC90aXRsZT4KICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICA8dGl0bGU+ZmlsbDwvdGl0bGU+CiAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgPHRpdGxlPmV5ZS1kcm9wcGVyPC90aXRsZT4KICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICA8ZyBpZD0iZ3JvdXAtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJtYXRyaXgoMSwgMCwgMCwgMSwgLTIuNTAwMDAxLCAtMi41KSI+CiAgICA8ZyBpZD0iZXllLWRyb3BwZXIiIGZpbGw9IiMwMDAiPgogICAgICA8cGF0aCBkPSJNOS4xNTMzNDYwNSwxMi40ODI0OTYyIEM5LjAzMzk0MDQ0LDEyLjYxODg3MzcgOC44ODA0MTg5NSwxMi43MDQxMDk2IDguNjA3NDkxODYsMTIuNzcyMjk4MyBDNy45MDgxMTYxOCwxMi45MjU3MjMgNy4yNDI4NTYzOSwxMy41NTY0Njg4IDcuMDM4MTYxMDcsMTQuMjU1NDAzMyBDNi45Njk5MjkzLDE0LjQ3NzAxNjcgNi43NDgxNzYwMywxNC43MTU2NzczIDYuNTA5MzY0ODMsMTQuODM1MDA3NiBMNC43MzUzMzg3MSwxNS42NzAzMTk2IEM0LjY1MDA0OSwxNS43MDQ0MTQgNC41ODE4MTcyMiwxNS43MjE0NjEyIDQuNTQ3NzAxMzQsMTUuNzIxNDYxMiBMNC4yNzQ3NzQyNCwxNS40NjU3NTM0IEM0LjI3NDc3NDI0LDE1LjQ0ODcwNjIgNC4yNzQ3NzQyNCwxNS4zODA1MTc1IDQuMzI1OTQ4MDcsMTUuMjYxMTg3MiBMNS4xNjE3ODczLDEzLjQ3MTIzMjkgQzUuMjY0MTM0OTYsMTMuMjQ5NjE5NSA1LjUwMjk0NjE3LDEzLjAyODAwNjEgNS43NDE3NTczNywxMi45NTk4MTc0IEM2LjQ0MTEzMzA1LDEyLjczODIwNCA3LjA3MjI3Njk2LDEyLjA5MDQxMSA3LjI1OTkxNDMzLDExLjIzODA1MTggQzcuMjk0MDMwMjIsMTEuMTAxNjc0MyA3LjM3OTMxOTk0LDEwLjk2NTI5NjggNy40OTg3MjU1NCwxMC44Mjg5MTkzIEwxMS40MzkxMTA1LDYuOTA4MDY2OTcgTDEzLjA5MzczMSw4LjU2MTY0Mzg0IEw5LjE1MzM0NjA1LDEyLjQ4MjQ5NjIgWiBNMTYuNjA3NjY3Myw1LjI4ODU4NDQ3IEMxNi44NjM1MzY1LDUuMDMyODc2NzEgMTcsNC42NzQ4ODU4NCAxNyw0LjMzMzk0MjE2IEMxNywzLjk5Mjk5ODQ4IDE2Ljg2MzUzNjUsMy42NTIwNTQ3OSAxNi42MDc2NjczLDMuMzk2MzQ3MDMgQzE2LjA3ODg3MTEsMi44Njc4ODQzMiAxNS4yNDMwMzE4LDIuODY3ODg0MzIgMTQuNzE0MjM1NiwzLjM5NjM0NzAzIEwxMy4yMzAxOTQ1LDQuODc5NDUyMDUgTDEzLjA1OTYxNTEsNC43MDg5ODAyMSBMMTIuNTEzNzYwOSw0LjE2MzQ3MDMyIEMxMi4xNzI2MDIsMy44MjI1MjY2NCAxMS42MDk2ODk5LDMuODIyNTI2NjQgMTEuMjY4NTMxLDQuMTYzNDcwMzIgTDEwLjYwMzI3MTIsNC44MTEyNjMzMiBDMTAuMjc5MTcwMyw1LjE1MjIwNyAxMC4yNjIxMTI0LDUuNjQ2NTc1MzQgMTAuNTUyMDk3NCw1Ljk4NzUxOTAzIEw2LjU5NDY1NDU0LDkuOTI1NDE4NTcgQzYuMzA0NjY5NTEsMTAuMjMyMjY3OSA2LjA5OTk3NDE4LDEwLjU5MDI1ODggNS45ODA1Njg1OCwxMS4xMDE2NzQzIEM1LjkyOTM5NDc1LDExLjM1NzM4MiA1LjYzOTQwOTcxLDExLjY0NzE4NDIgNS4zNjY0ODI2MiwxMS43MzI0MjAxIEM0LjgwMzU3MDQ5LDExLjkwMjg5MTkgNC4yNTc3MTYzLDEyLjM4MDIxMzEgNC4wMDE4NDcxNSwxMi45NDI3NzAyIEwzLjE2NjAwNzkyLDE0LjcxNTY3NzMgQzIuODkzMDgwODMsMTUuMzEyMzI4OCAyLjk2MTMxMjYsMTUuOTI2MDI3NCAzLjMzNjU4NzM2LDE2LjMxODExMjYgTDMuNjc3NzQ2MjMsMTYuNjU5MDU2MyBDMy44OTk0OTk0OSwxNi44ODA2Njk3IDQuMjA2NTQyNDcsMTcgNC41NDc3MDEzNCwxNyBDNC43Njk0NTQ2LDE3IDUuMDI1MzIzNzUsMTYuOTMxODExMyA1LjI2NDEzNDk2LDE2LjgyOTUyODIgTDcuMDU1MjE5MDEsMTUuOTk0MjE2MSBDNy42MTgxMzExNCwxNS43MjE0NjEyIDguMDk1NzUzNTYsMTUuMTkyOTk4NSA4LjI2NjMzMjk5LDE0LjYzMDQ0MTQgQzguMzM0NTY0NzcsMTQuMzU3Njg2NSA4LjY0MTYwNzc1LDE0LjA2Nzg4NDMgOS4wNTA5OTgzOSwxMy45ODI2NDg0IEM5LjQwOTIxNTIsMTMuODk3NDEyNSA5Ljc2NzQzMjAxLDEzLjY5Mjg0NjMgMTAuMDU3NDE3LDEzLjM4NTk5NyBMMTQuMDE0ODU5OSw5LjQ0ODA5NzQxIEMxNC4zNTYwMTg4LDkuNzM3ODk5NTQgMTQuODY3NzU3MSw5LjcwMzgwNTE4IDE1LjE3NDgwMDEsOS4zNzk5MDg2OCBMMTUuODQwMDU5OSw4LjczMjExNTY4IEMxNi4xODEyMTg3LDguMzkxMTcxOTkgMTYuMTgxMjE4Nyw3LjgyODYxNDkyIDE1Ljg0MDA1OTksNy40ODc2NzEyMyBMMTUuMjYwMDg5OCw2LjkwODA2Njk3IEwxNS4xMjM2MjYyLDYuNzcxNjg5NSBMMTYuNjA3NjY3Myw1LjI4ODU4NDQ3IFoiIGlkPSJleWUtZHJvcHBlci1pY29uIi8+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4";

  SymbolMorph.prototype.horiz = new Image();
  SymbolMorph.prototype.horiz.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiICB2aWV3Qm94PSIwIDAgMjAgMjAiIHZlcnNpb249IjEuMSI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDQzLjIgKDM5MDY5KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5mbGlwLWhvcml6b250YWw8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcy8+CiAgICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iZmxpcC1ob3Jpem9udGFsIj4KICAgICAgICAgICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMi4wMDAwMDAsIDMuMDAwMDAwKSI+CiAgICAgICAgICAgICAgICA8Y2lyY2xlIGlkPSJPdmFsIiBmaWxsPSIjNTc1RTc1IiBvcGFjaXR5PSIwLjUiIGN4PSI4IiBjeT0iMC43NSIgcj0iMSIvPgogICAgICAgICAgICAgICAgPGNpcmNsZSBpZD0iT3ZhbCIgZmlsbD0iIzU3NUU3NSIgb3BhY2l0eT0iMC41IiBjeD0iOCIgY3k9IjEzLjI1IiByPSIxIi8+CiAgICAgICAgICAgICAgICA8Y2lyY2xlIGlkPSJPdmFsLUNvcHkiIGZpbGw9IiM1NzVFNzUiIG9wYWNpdHk9IjAuNSIgY3g9IjgiIGN5PSIzLjg3NSIgcj0iMSIvPgogICAgICAgICAgICAgICAgPGNpcmNsZSBpZD0iT3ZhbC1Db3B5LTIiIGZpbGw9IiM1NzVFNzUiIG9wYWNpdHk9IjAuNSIgY3g9IjgiIGN5PSI3IiByPSIxIi8+CiAgICAgICAgICAgICAgICA8Y2lyY2xlIGlkPSJPdmFsLUNvcHktMyIgZmlsbD0iIzU3NUU3NSIgb3BhY2l0eT0iMC41IiBjeD0iOCIgY3k9IjEwLjEyNSIgcj0iMSIvPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2LDMuMDg0MjU0MjMgTDE2LDEwLjkxNTc0NTggQzE2LDExLjQzNDI2MjYgMTUuMjU3NDQ5MSwxMS42OTU2OTk2IDE0LjgyMzU3OTgsMTEuMzI4MjM1MyBMMTAuMjAxOTI5Myw3LjQxMTAzNzExIEM5LjkzMjY5MDI1LDcuMTg0NDU4MzUgOS45MzI2OTAyNSw2LjgxNDA4OTIyIDEwLjIwMTkyOTMsNi41ODc1MTA0NiBMMTQuODIzNTc5OCwyLjY3MTc2NDY5IEMxNS4yNTc0NDkxLDIuMzA0MzAwNDIgMTYsMi41NjU3Mzc0NSAxNiwzLjA4NDI1NDIzIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZGRiIgb3BhY2l0eT0iMC41Ii8+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMCwxMC45MTU3NDU4IEwwLDMuMDg0MjU0MjMgQzAsMi41NjU3Mzc0NSAwLjc0MjU1MDkxMSwyLjMwNDMwMDQyIDEuMTc0NzA1MjUsMi42NzE3NjQ2OSBMNS43OTgwNzA3NCw2LjU4ODk2Mjg5IEM2LjA2NzMwOTc1LDYuODE1NTQxNjUgNi4wNjczMDk3NSw3LjE4NTkxMDc4IDUuNzk4MDcwNzQsNy40MTI0ODk1NCBMMS4xNzQ3MDUyNSwxMS4zMjgyMzUzIEMwLjc0MjU1MDkxMSwxMS42OTU2OTk2IDAsMTEuNDM0MjYyNiAwLDEwLjkxNTc0NTgiIGlkPSJGaWxsLTE0IiBmaWxsPSIjRkZGIi8+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg=";
  SymbolMorph.prototype.horizBlack = new Image();
  SymbolMorph.prototype.horizBlack.src =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiICB2aWV3Qm94PSIwIDAgMjAgMjAiIHZlcnNpb249IjEuMSI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDQzLjIgKDM5MDY5KSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5mbGlwLWhvcml6b250YWw8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcy8+CiAgICA8ZyBpZD0iUGFnZS0xIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgICAgICA8ZyBpZD0iZmxpcC1ob3Jpem9udGFsIj4KICAgICAgICAgICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMi4wMDAwMDAsIDMuMDAwMDAwKSI+CiAgICAgICAgICAgICAgICA8Y2lyY2xlIGlkPSJPdmFsIiBmaWxsPSIjNTc1RTc1IiBvcGFjaXR5PSIwLjUiIGN4PSI4IiBjeT0iMC43NSIgcj0iMSIvPgogICAgICAgICAgICAgICAgPGNpcmNsZSBpZD0iT3ZhbCIgZmlsbD0iIzU3NUU3NSIgb3BhY2l0eT0iMC41IiBjeD0iOCIgY3k9IjEzLjI1IiByPSIxIi8+CiAgICAgICAgICAgICAgICA8Y2lyY2xlIGlkPSJPdmFsLUNvcHkiIGZpbGw9IiM1NzVFNzUiIG9wYWNpdHk9IjAuNSIgY3g9IjgiIGN5PSIzLjg3NSIgcj0iMSIvPgogICAgICAgICAgICAgICAgPGNpcmNsZSBpZD0iT3ZhbC1Db3B5LTIiIGZpbGw9IiM1NzVFNzUiIG9wYWNpdHk9IjAuNSIgY3g9IjgiIGN5PSI3IiByPSIxIi8+CiAgICAgICAgICAgICAgICA8Y2lyY2xlIGlkPSJPdmFsLUNvcHktMyIgZmlsbD0iIzU3NUU3NSIgb3BhY2l0eT0iMC41IiBjeD0iOCIgY3k9IjEwLjEyNSIgcj0iMSIvPgogICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2LDMuMDg0MjU0MjMgTDE2LDEwLjkxNTc0NTggQzE2LDExLjQzNDI2MjYgMTUuMjU3NDQ5MSwxMS42OTU2OTk2IDE0LjgyMzU3OTgsMTEuMzI4MjM1MyBMMTAuMjAxOTI5Myw3LjQxMTAzNzExIEM5LjkzMjY5MDI1LDcuMTg0NDU4MzUgOS45MzI2OTAyNSw2LjgxNDA4OTIyIDEwLjIwMTkyOTMsNi41ODc1MTA0NiBMMTQuODIzNTc5OCwyLjY3MTc2NDY5IEMxNS4yNTc0NDkxLDIuMzA0MzAwNDIgMTYsMi41NjU3Mzc0NSAxNiwzLjA4NDI1NDIzIiBpZD0iRmlsbC0xMSIgZmlsbD0iIzAwMCIgb3BhY2l0eT0iMC41Ii8+CiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMCwxMC45MTU3NDU4IEwwLDMuMDg0MjU0MjMgQzAsMi41NjU3Mzc0NSAwLjc0MjU1MDkxMSwyLjMwNDMwMDQyIDEuMTc0NzA1MjUsMi42NzE3NjQ2OSBMNS43OTgwNzA3NCw2LjU4ODk2Mjg5IEM2LjA2NzMwOTc1LDYuODE1NTQxNjUgNi4wNjczMDk3NSw3LjE4NTkxMDc4IDUuNzk4MDcwNzQsNy40MTI0ODk1NCBMMS4xNzQ3MDUyNSwxMS4zMjgyMzUzIEMwLjc0MjU1MDkxMSwxMS42OTU2OTk2IDAsMTEuNDM0MjYyNiAwLDEwLjkxNTc0NTgiIGlkPSJGaWxsLTE0IiBmaWxsPSIjMDAwIi8+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+Cjwvc3ZnPg==";

  // ArrowMorph displaying:
  ArrowMorph.prototype.whiteArrow = new Image();
  ArrowMorph.prototype.whiteArrow.src =
    "data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMi43MSIgaGVpZ2h0PSI4Ljc5IiB2aWV3Qm94PSIwIDAgMTIuNzEgOC43OSI+PHRpdGxlPmRyb3Bkb3duLWFycm93PC90aXRsZT48ZyBvcGFjaXR5PSIwLjEiPjxwYXRoIGQ9Ik0xMi43MSwyLjQ0QTIuNDEsMi40MSwwLDAsMSwxMiw0LjE2TDguMDgsOC4wOGEyLjQ1LDIuNDUsMCwwLDEtMy40NSwwTDAuNzIsNC4xNkEyLjQyLDIuNDIsMCwwLDEsMCwyLjQ0LDIuNDgsMi40OCwwLDAsMSwuNzEuNzFDMSwwLjQ3LDEuNDMsMCw2LjM2LDBTMTEuNzUsMC40NiwxMiwuNzFBMi40NCwyLjQ0LDAsMCwxLDEyLjcxLDIuNDRaIiBmaWxsPSIjMjMxZjIwIi8+PC9nPjxwYXRoIGQ9Ik02LjM2LDcuNzlhMS40MywxLjQzLDAsMCwxLTEtLjQyTDEuNDIsMy40NWExLjQ0LDEuNDQsMCwwLDEsMC0yYzAuNTYtLjU2LDkuMzEtMC41Niw5Ljg3LDBhMS40NCwxLjQ0LDAsMCwxLDAsMkw3LjM3LDcuMzdBMS40MywxLjQzLDAsMCwxLDYuMzYsNy43OVoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=";
  ArrowMorph.prototype.greyArrow = new Image();
  ArrowMorph.prototype.greyArrow.src =
    "data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIgogICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTIuNzEiIGhlaWdodD0iOC43OSIgdmlld0JveD0iMCAwIDEyLjcxIDguNzkiPgogICAgPHRpdGxlPmRyb3Bkb3duLWFycm93PC90aXRsZT4KICAgIDxnIG9wYWNpdHk9IjAuMSI+CiAgICAgICAgPHBhdGggZD0iTTEyLjcxLDIuNDRBMi40MSwyLjQxLDAsMCwxLDEyLDQuMTZMOC4wOCw4LjA4YTIuNDUsMi40NSwwLDAsMS0zLjQ1LDBMMC43Miw0LjE2QTIuNDIsMi40MiwwLDAsMSwwLDIuNDQsMi40OCwyLjQ4LDAsMCwxLC43MS43MUMxLDAuNDcsMS40MywwLDYuMzYsMFMxMS43NSwwLjQ2LDEyLC43MUEyLjQ0LDIuNDQsMCwwLDEsMTIuNzEsMi40NFoiIGZpbGw9IiMyMzFmMjAiLz4KICAgIDwvZz4KICAgIDxwYXRoIGQ9Ik02LjM2LDcuNzlhMS40MywxLjQzLDAsMCwxLTEtLjQyTDEuNDIsMy40NWExLjQ0LDEuNDQsMCwwLDEsMC0yYzAuNTYtLjU2LDkuMzEtMC41Niw5Ljg3LDBhMS40NCwxLjQ0LDAsMCwxLDAsMkw3LjM3LDcuMzdBMS40MywxLjQzLDAsMCwxLDYuMzYsNy43OVoiIGZpbGw9IiM1NzVlNzUiLz4KPC9zdmc+";
  ArrowMorph.prototype.blackArrow = new Image();
  ArrowMorph.prototype.blackArrow.src =
    "data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMi43MSIgaGVpZ2h0PSI4Ljc5IiB2aWV3Qm94PSIwIDAgMTIuNzEgOC43OSI+PHRpdGxlPmRyb3Bkb3duLWFycm93PC90aXRsZT48ZyBvcGFjaXR5PSIwLjEiPjxwYXRoIGQ9Ik0xMi43MSwyLjQ0QTIuNDEsMi40MSwwLDAsMSwxMiw0LjE2TDguMDgsOC4wOGEyLjQ1LDIuNDUsMCwwLDEtMy40NSwwTDAuNzIsNC4xNkEyLjQyLDIuNDIsMCwwLDEsMCwyLjQ0LDIuNDgsMi40OCwwLDAsMSwuNzEuNzFDMSwwLjQ3LDEuNDMsMCw2LjM2LDBTMTEuNzUsMC40NiwxMiwuNzFBMi40NCwyLjQ0LDAsMCwxLDEyLjcxLDIuNDRaIiBmaWxsPSIjMjMxZjIwIi8+PC9nPjxwYXRoIGQ9Ik02LjM2LDcuNzlhMS40MywxLjQzLDAsMCwxLTEtLjQyTDEuNDIsMy40NWExLjQ0LDEuNDQsMCwwLDEsMC0yYzAuNTYtLjU2LDkuMzEtMC41Niw5Ljg3LDBhMS40NCwxLjQ0LDAsMCwxLDAsMkw3LjM3LDcuMzdBMS40MywxLjQzLDAsMCwxLDYuMzYsNy43OVoiIGZpbGw9IiMwMDAiLz48L3N2Zz4=";
  ArrowMorph.prototype.drawImage = function (ctx, image, horiz) {
    // I have a feeling that this might be turning into spagetti code...
    var pr = !isRetinaEnabled() ? 1 : window.devicePixelRatio || 1,
      pad = horiz
        ? 0
        : this.padding +
          (this.parent instanceof InputFieldMorph ? 0 : 2) * this.scale,
      w = this.width(),
      h = this.height(),
      ow = image.width,
      oh = image.height,
      i1 = [pad - (ow / 10) * this.scale, h - h / 1.7],
      i2 = [w - pad - 0.5 * this.scale, h / 2];
    image.width = (ow / pr) * pr;
    image.height = (oh / pr) * pr;
    ctx.drawImage(
      image,
      ...(!horiz ? i1 : [i1[1], i1[0]]),
      ...(!horiz ? i2 : [i2[1], i2[0]]),
    );
    image.width = ow;
    image.height = oh;
    return;
  };
  SyntaxElementMorph.prototype.labelParts["$greenflag"].scale = 1.2;
  /*
ArrowMorph.prototype.render = function (ctx) {
  // initialize my surface property
  var pad = this.padding,
    h = this.height(),
    h2 = h / 2,
    w = this.width(),
    w2 = w / 2;
  if (true) {
    ctx.save();
    var horiz = Math.abs(this.direction) == 90,
      nw = horiz ? h : w,
      nh = horiz ? w : h;
    ctx.translate(nw / 2, nh / 2);
    ctx.rotate(
      radians(
        ((d) => {
          switch (d) {
            case "down":
              return 0;
            case "up":
              return 180;
            case "left":
              return 90;
            case "right":
              return -90;
          }
        })(this.direction),
      ),
    );
    ctx.translate(nw / -2, nh / -2);
    this.drawImage(
      ctx,
      this.getRenderColor().eq(new Color(87, 94, 117))
        ? ArrowMorph.prototype.greyArrow
        : this.getRenderColor().b < 118
          ? ArrowMorph.prototype.blackArrow
          : ArrowMorph.prototype.whiteArrow,
      horiz,
    );

    ctx.restore();
    return;
  }
  ctx.fillStyle = this.getRenderColor().toString();
  ctx.beginPath();
  if (this.direction === "down") {
    ctx.moveTo(pad, h2);
    ctx.lineTo(w - pad, h2);
    ctx.lineTo(w2, h - pad);
  } else if (this.direction === "up") {
    ctx.moveTo(pad, h2);
    ctx.lineTo(w - pad, h2);
    ctx.lineTo(w2, pad);
  } else if (this.direction === "left") {
    ctx.moveTo(pad, h2);
    ctx.lineTo(w2, pad);
    ctx.lineTo(w2, h - pad);
  } else {
    // 'right'
    ctx.moveTo(w2, pad);
    ctx.lineTo(w - pad, h2);
    ctx.lineTo(w2, h - pad);
  }
  ctx.closePath();
  ctx.fill();
};
*/
  ArrowMorph.prototype.getRenderColor = function () {
    if (this.isBlockLabel) {
      if (IDE_Morph.prototype.isBright) {
        return SyntaxElementMorph.prototype.alpha > 0.5 ? this.color : BLACK;
      }
      return SyntaxElementMorph.prototype.alpha > 0.5 ? this.color : WHITE;
    }
    return this.color;
  };

  SyntaxElementMorph.prototype.setScale(SyntaxElementMorph.prototype.scale);
  world.children[0].refreshIDE();
})();
