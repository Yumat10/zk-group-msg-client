import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';

import type { AppProps } from 'next/app';
import { ZKContextProvider } from 'contexts/ZKContext';
import { configureChains, chain, createClient, WagmiConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Navbar } from 'components/navbars/Navbar';
import Script from 'next/script';
import { GroupMsgContextProvider } from 'contexts/GroupMsgContext';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || '0xkey';

const { chains, provider } = configureChains(
  [chain.goerli, chain.hardhat],
  [
    // Public provider is prioritized in dev
    // Alchemy provider is prioritized in prod
    publicProvider({
      priority: process.env.NODE_ENV === 'production' ? 1 : 0,
    }),
    alchemyProvider({
      apiKey: ALCHEMY_API_KEY,
      priority: process.env.NODE_ENV === 'production' ? 0 : 1,
    }),
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'zkGroupMsg',
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  provider,
  connectors,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script src="/snarkjs.min.js" />
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains}>
          <ZKContextProvider>
            <GroupMsgContextProvider>
              <Navbar />
              <Component {...pageProps} />
            </GroupMsgContextProvider>
          </ZKContextProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </>
  );
}
