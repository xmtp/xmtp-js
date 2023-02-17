import encodeSuite from './encode'
import decodeSuite from './decode'

const main = async () => {
  await encodeSuite()
  await decodeSuite()
}

main()
