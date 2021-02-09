import { BigNumber, utils } from 'ethers'
import NFT_Tree from './nft-tree'

const { isAddress, getAddress } = utils

// This is the blob that gets distributed and pinned to IPFS.
// It is completely sufficient for recreating the entire merkle tree.
// Anyone can verify that all air drops are included in the tree,
// and the tree has no additional distributions.
interface MerkleDistributorInfo {
  merkleRoot: string
  claims: {
    [account: string]: {
      index: number
      tokenId: string
      proof: string[]
      flags?: {
        [flag: string]: boolean
      }
    }
  }
}

type NFTList = { address: string; tokenId: string; reasons: string }

export function parseNFTMap(balances: NFTList[]): MerkleDistributorInfo {

  const dataByAddress = balances.reduce<{
    [address: string]: { tokenId: BigNumber; flags?: { [flag: string]: boolean } }
  }>((memo, { address: account, tokenId, reasons }) => {
    if (!isAddress(account)) {
      throw new Error(`Found invalid address: ${account}`)
    }
    const parsed = getAddress(account)
    if (memo[parsed]) throw new Error(`Duplicate address: ${parsed}`)
    const parsedNum = BigNumber.from(tokenId)
    if (parsedNum.lte(0)) throw new Error(`Invalid tokenId for account: ${account}`)

    const flags = {
      isNFT: reasons.includes('NFTChallenge')
    }

    memo[parsed] = { tokenId: parsedNum, ...(reasons === '' ? {} : { flags }) }
    return memo
  }, {})

  // const sortedAddresses = Object.keys(dataByAddress).sort()
  // We do not order them, this would allow adding new entries later
  const sortedAddresses = Object.keys(dataByAddress)

  // construct a tree
  const tree = new NFT_Tree(
    sortedAddresses.map((address) => ({ account: address, tokenId: dataByAddress[address].tokenId }))
  )

  // generate claims
  const claims = sortedAddresses.reduce<{
    [address: string]: { tokenId: string; index: number; proof: string[]; flags?: { [flag: string]: boolean } }
  }>((memo, address, index) => {
    const { tokenId, flags } = dataByAddress[address]
    memo[address] = {
      index,
      tokenId: tokenId.toString(),
      proof: tree.getProof(index, address, tokenId),
      ...(flags ? { flags } : {}),
    }
    return memo
  }, {})

  return {
    merkleRoot: tree.getHexRoot(),
    claims,
  }
}
