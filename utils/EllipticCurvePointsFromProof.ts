import { ZKProof, ZKVerifierInput } from 'types/ZK.type';

// Build the arguments required for smart contract verifier from snarkjs generated proof
// Taken from:
// https://github.com/BattleZips/battlezip-frontend/blob/master/src/utils/index.tsx
export function getElipticCurvePointsFromProof(
  proof: ZKProof
): ZKVerifierInput {
  return [
    proof.pi_a.slice(0, 2), // pi_a
    // genZKSnarkProof reverses values in the inner arrays of pi_b
    [proof.pi_b[0].slice(0).reverse(), proof.pi_b[1].slice(0).reverse()],
    proof.pi_c.slice(0, 2), // pi_c
  ];
}
