import { BasicCard } from 'components/cards/BasicCard';
import { useGroupMsgContext } from 'contexts/GroupMsgContext';
import { FC } from 'react';
import { hexToAscii } from 'utils/HexToAscii';

export const MsgList: FC = () => {
  const { allMsg } = useGroupMsgContext();

  return (
    <div>
      {allMsg.map(({ sent_msg, secret_msg_hash }, index) => {
        const msg = hexToAscii(sent_msg.toHexString());

        const key = `${secret_msg_hash.toHexString()}-${index}`;
        return (
          <BasicCard key={key}>
            <p>{msg}</p>
          </BasicCard>
        );
      })}
    </div>
  );
};
