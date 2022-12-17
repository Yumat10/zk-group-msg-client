import { useGroupMsgContext } from 'contexts/GroupMsgContext';
import { useZKContext } from 'contexts/ZKContext';
import { FC, useState } from 'react';
import { ZKCircuit } from 'types/ZK.type';

export const NewMsg: FC = () => {
  const { isLoadingSendMsgTx, isSuccessSendMsgTx, isErrorSendMsgTx } =
    useGroupMsgContext();
  const { generateSendGroupMsgProof, isGeneratingProof, zkErrors } =
    useZKContext();

  const [newMsg, setNewMsg] = useState<string>('');

  return (
    <div>
      <p>New Msg:</p>
      <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} />
      <button
        disabled={isGeneratingProof ? true : false}
        onClick={async () => {
          await generateSendGroupMsgProof({
            msg: newMsg,
            senderSecret: '0x12345',
            groupPubs: [
              '0x23e4b60e69e9f413d73b80253449c50da5635a3373892e23a42bc075b9250493',
            ],
          });
        }}
      >
        {isGeneratingProof === ZKCircuit.SEND_GROUP_MSG
          ? 'Generating proof...'
          : 'Send Msg'}
      </button>
      {zkErrors[ZKCircuit.SEND_GROUP_MSG] && (
        <p>{zkErrors[ZKCircuit.SEND_GROUP_MSG]}</p>
      )}
      {isLoadingSendMsgTx && <p>Sending msg tx...</p>}
      {isSuccessSendMsgTx && <p>Successfully sent tx! 🙌</p>}
      {isErrorSendMsgTx && (
        <p>⚠️ An error occured while sending tx. Please try again</p>
      )}
    </div>
  );
};
