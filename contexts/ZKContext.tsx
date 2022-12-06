import { GROUP_MSG_CONTRACT_ADDRESS } from 'contracts/contractAddresses';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react';
import { SendGroupMsgInput, ZKCircuit, ZKProof } from 'types/ZK.type';
import { hashMessage } from 'utils/Mimc';
import {
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
  useWaitForTransaction,
} from 'wagmi';

import GroupMsgArtifact from 'contracts/GroupMsg.json';
import { ethers } from 'ethers';
import { write } from 'fs';

const MAX_GROUP_SIZE = 10;

interface ZKContextInterface {
  isGeneratingProof: ZKCircuit | undefined;
  isLoadingSendMsgTx: boolean;
  isErrorSendMsgTx: boolean;
  isSuccessSendMsgTx: boolean;
  sendGroupMsg: (sendGroupMsgInput: SendGroupMsgInput) => Promise<void>;

  errors: Partial<Record<ZKCircuit, string>>;
}

const ZKContext = createContext<ZKContextInterface | undefined>(undefined);

export const ZKContextProvider = ({ children }: { children: ReactNode }) => {
  const { chain } = useNetwork();

  const [isGeneratingProof, setIsGeneratingProof] = useState<
    ZKCircuit | undefined
  >();
  const [sendMsgArgs, setSendMsgArgs] = useState<(string | string[])[]>([]);

  const [errors, setErrors] = useState<Partial<Record<ZKCircuit, string>>>({});

  const { config: sendMsgConfig } = usePrepareContractWrite({
    address: GROUP_MSG_CONTRACT_ADDRESS,
    abi: GroupMsgArtifact.abi,
    functionName: 'sendMsg',
    args: [
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
    ],
    chainId: chain?.id,
  });

  const { write: writeSendMsg, data: sendMsgData } =
    useContractWrite(sendMsgConfig);

  const {
    isLoading: isLoadingSendMsgTx,
    isError: isErrorSendMsgTx,
    isSuccess: isSuccessSendMsgTx,
  } = useWaitForTransaction({
    hash: sendMsgData?.hash,
  });

  // Generate + verify + send proof for group msg
  async function sendGroupMsg(sendGroupMsgInput: SendGroupMsgInput) {
    setErrors({});

    // Generate the proof for sending a group msg
    setIsGeneratingProof(ZKCircuit.SEND_GROUP_MSG);
    const { msg, senderSecret, groupPubs: chosenGroupPubs } = sendGroupMsgInput;

    if (chosenGroupPubs.length > MAX_GROUP_SIZE) {
      throw new Error('Max group size (10) exceeded');
    }

    // Fix the group pub array to be exactly the max group size
    const groupPubs = [...chosenGroupPubs].concat(
      Array(MAX_GROUP_SIZE - chosenGroupPubs.length).fill('0')
    );

    const proverInput: SendGroupMsgInput = {
      msg: hashMessage(msg).toString(), // Hash the msg string => bigint
      senderSecret,
      groupPubs,
    };

    try {
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        { ...proverInput },
        '/circuits/sendGroupMsg/sendGroupMsg.wasm',
        '/circuits/sendGroupMsg/sendGroupMsg.zkey'
      );
      const sendMsgProof = proof as ZKProof;

      setSendMsgArgs([
        sendMsgProof.pi_a.slice(0, 2),
        sendMsgProof.pi_b.slice(0, 2),
        sendMsgProof.pi_c.slice(0, 2),
        publicSignals,
      ]);

      setIsGeneratingProof(undefined);
    } catch (error) {
      console.log(error);
      setErrors({
        [ZKCircuit.SEND_GROUP_MSG]: 'Something went wrong, please try again',
      });
      setIsGeneratingProof(undefined);
      return;
    }

    // Send the proof to the verifier contract
    writeSendMsg?.();
  }

  return (
    <ZKContext.Provider
      value={{
        isGeneratingProof,
        isLoadingSendMsgTx,
        isErrorSendMsgTx,
        isSuccessSendMsgTx,
        sendGroupMsg,

        errors,
      }}
    >
      {children}
    </ZKContext.Provider>
  );
};

export const useZKContext = (): ZKContextInterface => {
  const context = useContext(ZKContext);

  if (context === undefined) {
    throw new Error('ZKContext must be within ZKContextProvider');
  }

  return context;
};
