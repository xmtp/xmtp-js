import BrowserStoragePersistence from './BrowserStoragePersistence'
import LocalStoragePonyfill from './LocalStoragePonyfill'

export default class InMemoryPersistence extends BrowserStoragePersistence {
  static create() {
    return new BrowserStoragePersistence(new LocalStoragePonyfill())
  }
}
