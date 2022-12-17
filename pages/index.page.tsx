import { useGroupMsgContext } from 'contexts/GroupMsgContext';
import { useZKContext } from 'contexts/ZKContext';
import { MsgList } from 'pageElements/home/MsgList';
import { NewMsg } from 'pageElements/home/NewMsg';
import { SendGroupMsgInput, ZKCircuit } from 'types/ZK.type';

export default function Home() {
  const { allMsg, isLoadingSendMsgTx, isSuccessSendMsgTx, isErrorSendMsgTx } =
    useGroupMsgContext();
  const { isGeneratingProof, generateSendGroupMsgProof } = useZKContext();

  const textGroupMsgInputs: SendGroupMsgInput = {
    msg: 'test message',
    senderSecret: '0x12345',
    groupPubs: [
      '16235047337612197926017288391687493492064300975883676531982645914091808687251',
      '0',
      '0',
      '0',
      '0',
      '0',
      '0',
      '0',
      '0',
      '0',
    ],
  };

  return (
    <div className="page-container">
      <h2 className="text-5xl underline">zkGM</h2>
      <p className="text-2xl mt-5">zero-knowledge group messaging</p>
      {/* <button
        disabled={isLoadingSendMsgTx}
        onClick={() => {
          generateSendGroupMsgProof(textGroupMsgInputs);
        }}
      >
        {isGeneratingProof === ZKCircuit.SEND_GROUP_MSG
          ? 'Generating proof...'
          : 'Generate Proof'}
      </button>
      {isLoadingSendMsgTx && <p>Loading...</p>}
      {isSuccessSendMsgTx && <p>Success! 🙌</p>} */}
      <div>
        <NewMsg />
      </div>
      <div>
        <MsgList />
      </div>
    </div>
  );
}
