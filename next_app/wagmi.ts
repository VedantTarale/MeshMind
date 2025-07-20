import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  seiTestnet,
  sepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Your App Name',
  projectId: '70f8bd156c034f629c49ab4a2aee769d',
  chains: [
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    seiTestnet,
    sepolia,
  ],
  ssr: true,
});