import { createStreamWithCondition } from "./createStreamWithCondition";
import { Writable, PassThrough } from "stream";

export function createStreamToRemoveScriptsOutsideCommentsInHeadAndBody(
  startComment: string,
  endComment: string,
  removedContentStream: Writable = new PassThrough()
) {
  let isWithinCommentRange = false;
  return createStreamWithCondition((arg, context) => {
    if (arg.type === "comment") {
      if (arg.content === startComment) {
        isWithinCommentRange = true;
        return true;
      } else if (arg.content === endComment) {
        isWithinCommentRange = false;
        return true;
      }
    }

    const isScript = arg.type === "element" && arg.content.tagName === "script";

    const isDirectChildOfHeadOrBody =
      context.parentElement !== undefined &&
      (context.parentElement.tagName === "head" ||
        context.parentElement.tagName === "body");

    return isDirectChildOfHeadOrBody && !isWithinCommentRange && isScript;
  }, removedContentStream);
}
