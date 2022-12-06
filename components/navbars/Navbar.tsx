import { FC } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const Navbar: FC = () => {
  return (
    <nav className="flex flex-row items-center justify-between px-width-clamp border-b-2 border-b-off-black h-24">
      <p className="text-2xl font-bold">zkGroupMsg</p>
      <div>
        <ConnectButton />
      </div>
    </nav>
  );
};
