import { Transform, TransformCallback } from "stream";

export class BufferToStringTransform extends Transform {
  constructor() {
    super({ decodeStrings: false }); // デフォルトでtrue。文字列のデコードを自動的に行わないようにする
  }

  _transform(
    chunk: Buffer,
    _encoding: string,
    callback: TransformCallback
  ): void {
    // chunkはBufferオブジェクト。UTF-8文字列に変換する。
    const transformedChunk = chunk.toString("utf-8");
    // 変換した文字列を次のストリームへ渡す
    this.push(transformedChunk);
    callback();
  }
}
