export enum ZKCircuit {
  SEND_GROUP_MSG,
  DENY,
}

export interface ZKProof {
  curve: string;
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
}

export type ZKVerifierInput = (string[] | string[][])[];
