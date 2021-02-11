import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
// @ts-ignore
import Confetti from 'react-dom-confetti'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import addresses from './result.json'
import logo from './logo.png'
import { merkleDistributorAbi, merkleDistributorAddr } from './merkleDistributor'

const defaultProvider = new ethers.providers.InfuraProvider()

const merkleDistributorInterface = new ethers.utils.Interface(merkleDistributorAbi)

const merkleDistributor = new ethers.Contract(merkleDistributorAddr, merkleDistributorAbi, defaultProvider)

type ClaimState = 'unknown' | 'no-claim' | 'claim-available' | 'claimed'

function App() {
  const [input, setInput] = useState('')
  const [claimState, setClaimState] = useState<ClaimState>('unknown')

  const isValidAddress = ethers.utils.isAddress(input)
  const claim = isValidAddress && addresses.claims[ethers.utils.getAddress(input) as keyof typeof addresses.claims]

  let error: string | null = null
  if (input && !isValidAddress) {
    error = 'Invalid address'
  }

  useEffect(() => {
    async function callIsClaimed() {
      if (!claim) return
      try {
        const isClaimed = await merkleDistributor.isClaimed(claim.index)
        if (isClaimed) setClaimState('claimed')
        else setClaimState('claim-available')
      } catch (e) {
        console.error(e)
      }
    }
    callIsClaimed()
  }, [claim])

  async function executeClaim() {
    try {
      if (!claim || !ethers.utils.isAddress(input)) return

      // @ts-ignore
      const ethereum = window.ethereum
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })
      const account = accounts[0]
      console.log({ account })

      const claimArgs = [claim.index, input, claim.tokenId, claim.proof]
      const data = merkleDistributorInterface.encodeFunctionData('claim', claimArgs)

      const transactionParameters = {
        to: merkleDistributorAddr, // Required except during contract publications.
        from: ethereum.selectedAddress, // must match user's active address.
        data: data,
        chainId: 1, // Used to prevent transaction reuse across blockchains. Auto-filled by MetaMask.
      }

      console.log({ transactionParameters })

      await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      })
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <header>
        <img src={logo} className="logo" alt="logo" />
        <div className="top-menu">
          <a href="https://dappnode.io">Home</a>
          <a href="https://dappnode.io">Source</a>
        </div>
      </header>
      <div className="claim-container">
        <h2>DAppNode NFT claim</h2>

        <p>
          Claim your NFT challenge token. <br></br>
          <a href="https://medium.com/dappnode/dappnode-validator-nft-challenge-40e12748cf9b">Medium post</a> with the
          announcement
        </p>

        <Form className="claim-form">
          <Form.Group controlId="address">
            <Form.Label>Claim address</Form.Label>
            <Form.Control value={input} onChange={(e) => setInput(e.target.value)} isInvalid={Boolean(error)} />

            {error ? (
              <Form.Text className="text-danger">{error}</Form.Text>
            ) : (
              <Form.Text className="text-muted">You can claim for any address</Form.Text>
            )}
          </Form.Group>
        </Form>

        {claimState === 'claim-available' && <h5>🎉🎉 You have an NFT! 🎉🎉</h5>}
        {claimState === 'no-claim' && <h5>Account has no NFT</h5>}
        {claimState === 'claimed' && <h5>Account already claimed NFT</h5>}

        <Button
          className="claim-button"
          variant="dappnode"
          disabled={claimState !== 'claim-available'}
          onClick={() => executeClaim()}
        >
          CLAIM
        </Button>
      </div>

      <div className="confetti">
        {/* @ts-ignore */}
        <Confetti
          active={claimState === 'claim-available'}
          // @ts-ignore
          config={confettiConfig}
        />
      </div>
    </div>
  )
}

const confettiConfig = {
  angle: '90',
  spread: 360,
  startVelocity: 40,
  elementCount: '117',
  dragFriction: '0.09',
  duration: 3000,
  stagger: '8',
  width: '15px',
  height: '15px',
  perspective: '589px',
}

export default App
