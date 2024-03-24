import { Readable, Writable, pipeline } from "stream";

export function concatStreams(
  stream1: Readable,
  stream2: Readable,
  output: Writable
): void {
  pipeline(stream1, output, (err) => {
    if (err) {
      console.error("Error in pipeline with stream1:", err);
      output.destroy(err);
      return;
    }
    // stream1の終了後にstream2を追加
    pipeline(stream2, output, (err) => {
      if (err) {
        console.error("Error in pipeline with stream2:", err);
        output.destroy(err);
        return;
      }
    });
  });
}
