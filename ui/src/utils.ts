// @ts-ignore
import WalletConnectProvider from '@walletconnect/web3-provider'
// @ts-ignore
import Fortmatic from 'fortmatic'

export function getProviderOptions() {
  return {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: process.env.REACT_APP_INFURA_ID,
      },
    },
    fortmatic: {
      package: Fortmatic,
      options: {
        key: process.env.REACT_APP_FORTMATIC_KEY,
      },
    },
  }
}
