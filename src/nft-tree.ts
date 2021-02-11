import MerkleTree from './merkle-tree'
import { BigNumber, utils } from 'ethers'

export default class BalanceTree {
  private readonly tree: MerkleTree

  constructor(ids: { account: string; tokenId: BigNumber }[]) {
    this.tree = new MerkleTree(
      ids.map(({ account, tokenId }, index) => {
        return BalanceTree.toNode(index, account, tokenId)
      })
    )
  }

  public static verifyProof(
    index: number | BigNumber,
    account: string,
    amount: BigNumber,
    proof: Buffer[],
    root: Buffer
  ): boolean {
    let pair = BalanceTree.toNode(index, account, amount)
    for (const item of proof) {
      pair = MerkleTree.combinedHash(pair, item)
    }

    return pair.equals(root)
  }

  // keccak256(abi.encode(index, account, tokenId))
  public static toNode(index: number | BigNumber, account: string, tokenId: BigNumber): Buffer {
    return Buffer.from(
      utils.solidityKeccak256(['uint256', 'address', 'uint256'], [index, account, tokenId]).substr(2),
      'hex'
    )
  }

  public getHexRoot(): string {
    return this.tree.getHexRoot()
  }

  // returns the hex bytes32 values of the proof
  public getProof(index: number | BigNumber, account: string, amount: BigNumber): string[] {
    return this.tree.getHexProof(BalanceTree.toNode(index, account, amount))
  }
}
