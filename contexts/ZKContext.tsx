import { GROUP_MSG_CONTRACT_ADDRESS } from 'contracts/contractAddresses';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react';
import { SendGroupMsgInput } from 'types/GroupMsg.type';
import { ZKCircuit, ZKProof } from 'types/ZK.type';
import { hashMessage } from 'utils/Mimc';
import { useNetwork, useSigner, useWaitForTransaction } from 'wagmi';

import GroupMsgArtifact from 'contracts/GroupMsg.json';
import { Contract, ethers } from 'ethers';
import { write } from 'fs';
import { useGroupMsgContext } from './GroupMsgContext';

import SendGroupMsgVKey from '../public/circuits/sendGroupMsg/sendGroupMsg.vkey.json';
import { getElipticCurvePointsFromProof } from 'utils/EllipticCurvePointsFromProof';
import { asciiToHex } from 'utils/HexToAscii';

const MAX_GROUP_SIZE = 10;

interface ZKContextInterface {
  isGeneratingProof: ZKCircuit | undefined;
  generateSendGroupMsgProof: (
    sendGroupMsgInput: SendGroupMsgInput
  ) => Promise<void>;

  zkErrors: Partial<Record<ZKCircuit, string>>;
}

const ZKContext = createContext<ZKContextInterface | undefined>(undefined);

export const ZKContextProvider = ({ children }: { children: ReactNode }) => {
  const { chain } = useNetwork();
  const { sendGroupMsgTx } = useGroupMsgContext();

  const [isGeneratingProof, setIsGeneratingProof] = useState<
    ZKCircuit | undefined
  >();
  const [sendMsgArgs, setSendMsgArgs] = useState<(string | string[])[]>([]);

  const [zkErrors, setZkErrors] = useState<Partial<Record<ZKCircuit, string>>>(
    {}
  );

  // Generate + verify + send proof for group msg
  async function generateSendGroupMsgProof(
    sendGroupMsgInput: SendGroupMsgInput
  ) {
    setZkErrors({});

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
      msg: asciiToHex(msg),
      senderSecret: '0x12345',
      groupPubs: groupPubs,
    };

    console.log('---proverInput---');
    // console.log(proverInput);

    try {
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        { ...proverInput },
        '/circuits/sendGroupMsg/sendGroupMsg.wasm',
        '/circuits/sendGroupMsg/sendGroupMsg.zkey'
      );

      const elipticCurvePoints = getElipticCurvePointsFromProof(
        proof as ZKProof
      );
      const sendGroupMsgArgs = [...elipticCurvePoints, publicSignals];

      console.log('---sendGroupMsgArgs---', sendGroupMsgArgs);

      // Verify proof
      const isValidProof = await snarkjs.groth16.verify(
        SendGroupMsgVKey,
        publicSignals,
        proof
      );
      console.log('Is valid proof? ', isValidProof);

      setIsGeneratingProof(undefined);

      console.log('---sendGroupMsgArgs---');
      console.log(sendGroupMsgArgs);

      // // Send the proof to the verifier contract
      await sendGroupMsgTx(sendGroupMsgArgs);
    } catch (error) {
      console.log(error);
      setZkErrors({
        [ZKCircuit.SEND_GROUP_MSG]: 'Something went wrong, please try again',
      });
      setIsGeneratingProof(undefined);
      return;
    }
  }

  return (
    <ZKContext.Provider
      value={{
        isGeneratingProof,
        generateSendGroupMsgProof,
        zkErrors,
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
