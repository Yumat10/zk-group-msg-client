import { FC, ReactNode } from 'react';

type BasicCardProps = {
  children: ReactNode;
};

export const BasicCard: FC<BasicCardProps> = ({ children }) => {
  return <div>{children}</div>;
};
