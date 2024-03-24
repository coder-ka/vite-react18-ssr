import { RewritingStream } from "parse5-html-rewriting-stream";
import { Writable, PassThrough } from "stream";
import type { StartTag } from "parse5-sax-parser";

type ShouldRemoveArgument =
  | {
      type: "element";
      content: StartTag;
    }
  | {
      type: "comment";
      content: string;
    };

export function createStreamWithCondition(
  shouldRemove: (
    arg: ShouldRemoveArgument,
    context: { parentElement?: StartTag }
  ) => boolean,
  removedContentStream: Writable = new PassThrough()
): RewritingStream {
  const rewritingStream = new RewritingStream();
  const tagStack: StartTag[] = [];
  const removeTagStack: StartTag[] = [];

  const pushTag = (tag: StartTag, stack: StartTag[]) => {
    if (!tag.selfClosing) {
      stack.push(tag);
    }
  };

  rewritingStream.on("startTag", (startTag, raw) => {
    if (
      removeTagStack.length === 0 &&
      shouldRemove(
        { type: "element", content: startTag },
        { parentElement: tagStack[tagStack.length - 1] }
      )
    ) {
      pushTag(startTag, removeTagStack);
      removedContentStream.write(raw);
    } else {
      rewritingStream.emitRaw(raw);
    }
    pushTag(startTag, tagStack);
  });

  rewritingStream.on("endTag", (endTag, raw) => {
    if (removeTagStack.length > 0) {
      removedContentStream.write(raw);
      if (
        endTag.tagName === removeTagStack[removeTagStack.length - 1].tagName
      ) {
        removeTagStack.pop();
      }
    } else {
      rewritingStream.emitRaw(raw);
    }
    if (
      tagStack.length > 0 &&
      endTag.tagName === tagStack[tagStack.length - 1].tagName
    ) {
      tagStack.pop();
    }
  });

  rewritingStream.on("text", (_, raw) => {
    if (removeTagStack.length > 0) {
      removedContentStream.write(raw);
    } else {
      rewritingStream.emitRaw(raw);
    }
  });

  rewritingStream.on("comment", (_, raw) => {
    if (
      removeTagStack.length > 0 ||
      shouldRemove(
        { type: "comment", content: raw },
        { parentElement: tagStack[tagStack.length - 1] }
      )
    ) {
      removedContentStream.write(raw);
    } else {
      rewritingStream.emitRaw(raw);
    }
  });

  return rewritingStream;
}
