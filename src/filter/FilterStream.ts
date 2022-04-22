import lp from 'it-length-prefixed'
import { MuxedStream } from 'libp2p'
import { WakuMessage } from 'js-waku/build/main/lib/waku_message'
import FilterRPC from './FilterRPC'
import debug from 'debug'
import { pipe } from 'it-pipe'

const log = debug('waku:filter')

/**
 * FilterStream converts a MuxedStream into an async iterable of WakuMessages
 */
export default class FilterStream {
  stream: MuxedStream
  iter: AsyncGenerator<WakuMessage>

  constructor(stream: MuxedStream) {
    this.stream = stream
    // Iterator will run until the iterator is closed

    // I'm having frustrating problems with the typing here
    this.iter = pipe(
      stream.source,
      lp.decode(),
      (source: AsyncIterable<Uint8Array>): AsyncGenerator<WakuMessage> => {
        return (async function* () {
          for await (const bytes of source) {
            try {
              const res = FilterRPC.decode(bytes.slice())
              if (res.push?.messages?.length) {
                for (const message of res.push.messages) {
                  const wakuMsg = await WakuMessage.decodeProto(message, [])
                  if (!wakuMsg || !wakuMsg.payload) {
                    continue
                  }
                  log('Yielding message')
                  yield wakuMsg
                }
              }
            } catch (e) {
              console.error(e)
            }
          }
        })()
      }
    )
  }

  static async create(
    stream: MuxedStream,
    request: FilterRPC
  ): Promise<FilterStream> {
    // First we send the request so that the stream is already listening when we return.
    // Admittedly, this doesn't work perfectly, since it just waits for the request to be sent but not for it to be read by the server
    // One possibility to make this better would be some sort of ack from the server
    await pipe([request.encode()], lp.encode(), stream.sink)
    return new FilterStream(stream)
  }

  async return(): Promise<IteratorResult<WakuMessage>> {
    await this.stream.close()
    await this.iter.return(undefined)
    log('Closed stream')
    return { value: undefined, done: true }
  }

  async next(): Promise<IteratorResult<WakuMessage, WakuMessage>> {
    log('Calling next')
    return this.iter.next()
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<WakuMessage> {
    return this
  }
}
