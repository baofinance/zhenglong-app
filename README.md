# 🛠️ Local Development Setup for Bao Minter

This guide walks you through the local setup process for deploying and configuring the Bao Minter system on a local Anvil testnet using a specific chain ID, setting up a local multisig, and performing admin tasks like updating the price oracle and granting roles.

---

## 📦 Prerequisites

Make sure you have the following installed:

- Node.js (v18+ recommended)
- Yarn
- Foundry (for Anvil)

---

## 🚀 Step-by-Step Setup

### 1. Start Anvil

Launch Anvil with a fixed Chain ID:

```bash
yarn anvil start --chain-id 31337
```

---

### 2. Deploy the Minter Contract

Deploy the minter contract to your local Anvil instance:

```bash
yarn deploy:local:test
```

---

### 3. Setup Local Multisig

Start the local multisig environment:

```bash
yarn multisig:local
```

---

### 4. Update the Price Oracle

#### Update Minter’s Price Feed

Send a transaction to set the price oracle used by the minter:

```bash
yarn anvil -vvv send \
  --sig Minter_v1.updatePriceOracle \
  --as baomultisig \
  --to minter 0xD6b8Eb34413f07a1a67A469345cFEa6633efd58d
```

Make sure the address (`0xD6b8...`) is your new oracle address.

---

### 5. Grant ZERO_FEE_ROLE

Give your address permission to mint pegged and leveraged tokens via the admin interface:

```bash
yarn anvil grant \
  --role ZERO_FEE_ROLE \
  --on minter \
  --to 0xAE7Dbb17bc40D53A6363409c6B1ED88d3cFdc31e \
  --as baomultisig
```

---

### 6. Update Frontend Contract Addresses

After deployment, copy the addresses from:

```bash
bao-minter/deploy-local.log
```

Update them in the `contracts.ts` file.

---

## ✅ Done!

You should now be able to interact with your locally deployed Bao Minter environment, including minting tokens and simulating admin actions.
