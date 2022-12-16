import { BigNumber } from 'ethers';

export interface GroupMsg {
  sent_msg: BigNumber; // Hex representation of msg string
  group: BigNumber[]; // Addresses of members of group
  // Placeholder msg <= not enough msg to fill msg page but still need to send back constant num msg from contract
  secret_msg_hash: BigNumber; // Hash of sender secret + msg, 0x00 if placeholder msg
  sender: BigNumber; // Address of sender (if revealed), 0x00 otherwise
  denied: BigNumber[]; // Addresses of group members that have denied
}
