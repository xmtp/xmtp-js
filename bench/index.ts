import decodeSuite from './decode'
import encodeSuite from './encode'

const main = async () => {
  await encodeSuite()
  await decodeSuite()
}

main()
