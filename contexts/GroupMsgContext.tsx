import { GROUP_MSG_CONTRACT_ADDRESS } from 'contracts/contractAddresses';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  useContractRead,
  useContractReads,
  useNetwork,
  useSigner,
  useWaitForTransaction,
} from 'wagmi';
import GroupMsgArtifact from 'contracts/GroupMsg.json';
import { BigNumber, Contract } from 'ethers';
import { GroupMsg } from 'types/GroupMsg.type';

const testArgs = [
  [
    '0x185faadde16459e1f033b96fc1a4d9490b06f8e625185627b84f67b5798c83b9',
    '0x18bae9ca58d5d5a5b1b571cd3194b5576368152bef14a3f9b87b3a05c9be6ab2',
  ],
  [
    [
      '0x17b7739b44bcec21a8d905e1988667ac84f21d8e658c54b1ea48563a34e9a030',
      '0x0f03f0e8c4217fdadf1f470ae7e7420c27c00793693946b8477fb92efcae99d0',
    ],
    [
      '0x173b0501fe4b528ddf30d4d151c4b5a6b09228d0efccc4b96a612d2c7a76172c',
      '0x213f753b1d56aa1a9abfd26da6a8d8bec1b708235527cea33ba0b67e278d53b9',
    ],
  ],
  [
    '0x02261c69e45323774c34d34be09bd101323695817b1dcdc94433b32eb6fd5c62',
    '0x304d3979895d54aea4992545b19e41cbf47368a3bfb796a4173047b22def20c5',
  ],
  [
    '0x065478b6cf333085277768f8de9d67f1e575c4fcd04f6ac21baa7b904391ab11',
    '0x000000000000000000000000000000000000000048656c6c6f20576f726c6421',
    '0x23e4b60e69e9f413d73b80253449c50da5635a3373892e23a42bc075b9250493',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  ],
];

interface GroupMsgContextInterface {
  allMsg: GroupMsg[];

  sendGroupMsgTx: () => Promise<void>;
  isLoadingSendMsgTx: boolean;
  isErrorSendMsgTx: boolean;
  isSuccessSendMsgTx: boolean;
}

const GroupMsgContext = createContext<GroupMsgContextInterface | undefined>(
  undefined
);

export const GroupMsgContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { chain } = useNetwork();
  const { data: signer, isSuccess: isSuccessSigner } = useSigner();

  // Messages are paginated
  const [msgPerPage, setMsgPerPage] = useState(10);
  const [msgPageNum, setMsgPageNum] = useState(0);

  // Total num msg
  const [bnTotalNumMsg, setBnTotalNumMsg] = useState<BigNumber>(
    BigNumber.from('0')
  );

  // Msg data
  const [allMsg, setAllMsg] = useState<GroupMsg[]>([]);

  // Msg hashes are used to track the status of transactions
  const [sendMsgTxHash, setSendMsgTxHash] = useState<`0x${string}`>();
  const {
    isLoading: isLoadingSendMsgTx,
    isError: isErrorSendMsgTx,
    isSuccess: isSuccessSendMsgTx,
  } = useWaitForTransaction({
    hash: sendMsgTxHash,
  });

  console.log('allMsg:', allMsg);

  // Get the initial total num msg
  useEffect(() => {
    getTotalNumMsg();
  }, [signer]);

  // Get the initial batch of msg
  useEffect(() => {
    if (bnTotalNumMsg.gt('0')) {
      getMsgBatch();
    }
  }, [bnTotalNumMsg]);

  const GroupMsgContract = new Contract(
    GROUP_MSG_CONTRACT_ADDRESS,
    GroupMsgArtifact.abi,
    signer || undefined
  );

  // Get the total number of msg
  async function getTotalNumMsg() {
    try {
      console.log('Getting total num msg');
      const getTotalNumMsgResponse =
        (await GroupMsgContract.getNumMsg()) as BigNumber;
      setBnTotalNumMsg(getTotalNumMsgResponse);
    } catch (error) {
      console.log(error);
    }
  }

  // Get the 10 msg corresponding to the current page
  async function getMsgBatch() {
    // There must be at least 1 msg
    if (bnTotalNumMsg.lt('1')) return;
    try {
      console.log('Getting msg for page ', msgPageNum);
      const getBatchMsgResponse = (await GroupMsgContract.getMsgBatch(
        msgPerPage,
        msgPageNum
      )) as GroupMsg[];
      const fetchedBatchMsg: GroupMsg[] = getBatchMsgResponse
        // Remove placeholder msg
        .filter((msg) => !msg.secret_msg_hash.eq('0'))
        // Convert array => object
        .map((msg) => ({
          sent_msg: msg.sent_msg,
          group: msg.group,
          secret_msg_hash: msg.secret_msg_hash,
          sender: msg.sender,
          denied: msg.denied,
        }));
      setAllMsg([...allMsg, ...fetchedBatchMsg]);
    } catch (error) {
      console.log(error);
    }
  }

  async function sendGroupMsgTx() {
    try {
      console.log('Sending group msg...');
      const sendMsgReceipt = await GroupMsgContract.sendMsg(...testArgs);
      setSendMsgTxHash(sendMsgReceipt.hash);

      console.log('Group msg sent!');
    } catch (error) {
      console.log(error);
      console.log('Failed to load group msg');
    }
  }

  return (
    <GroupMsgContext.Provider
      value={{
        allMsg,

        sendGroupMsgTx,
        isLoadingSendMsgTx,
        isErrorSendMsgTx,
        isSuccessSendMsgTx,
      }}
    >
      {children}
    </GroupMsgContext.Provider>
  );
};

export const useGroupMsgContext = (): GroupMsgContextInterface => {
  const context = useContext(GroupMsgContext);
  if (context === undefined) {
    throw new Error('GroupMsgContext must be within GroupMsgContextProvider');
  }

  return context;
};
