import { GROUP_MSG_CONTRACT_ADDRESS } from 'contracts/contractAddresses';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react';
import { useContractRead, useContractReads, useNetwork } from 'wagmi';
import GroupMsgArtifact from 'contracts/GroupMsg.json';
import { BigNumber } from 'ethers';

const PAGE_SIZE = 10;

interface GroupMsgContextInterface {}

const GroupMsgContext = createContext<GroupMsgContextInterface | undefined>(
  undefined
);

export const GroupMsgContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { chain } = useNetwork();

  const [msgPageNum, setMsgPageNum] = useState(0);

  // Get the total number of msg
  const {
    data: bnTotalNumMsg,
    isLoading,
    error,
  } = useContractRead({
    address: GROUP_MSG_CONTRACT_ADDRESS,
    abi: GroupMsgArtifact.abi,
    functionName: 'getNumMsg',
    chainId: chain?.id,
  });

  const { data: batchedMsg } = useContractRead({
    enabled: bnTotalNumMsg !== undefined && (bnTotalNumMsg as BigNumber).gt(0),
    address: GROUP_MSG_CONTRACT_ADDRESS,
    abi: GroupMsgArtifact.abi,
    functionName: 'getMsgBatch',
    args: [10, 0],
    onError: (e) => {
      console.log('Error getting batched msg', bnTotalNumMsg?.toString());
    },
    onSuccess: (e) => {
      console.log('Successful getting batched msg!');
    },
    chainId: chain?.id,
  });

  console.log('bnTotalNumMsg: ', bnTotalNumMsg?.toString());
  console.log(
    'batchedMsg: ',
    batchedMsg?.filter((e) => !e.secret_msg_hash.eq(0))
    // batchedMsg?.filter(({ sender }) => !(sender as BigNumber).(0))
  );

  return (
    <GroupMsgContext.Provider value={{}}>{children}</GroupMsgContext.Provider>
  );
};

export const useGroupMsgContext = (): GroupMsgContextInterface => {
  const context = useContext(GroupMsgContext);
  if (context === undefined) {
    throw new Error('GroupMsgContext must be within GroupMsgContextProvider');
  }

  return context;
};
