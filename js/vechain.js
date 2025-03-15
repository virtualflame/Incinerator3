let connex = null;
let currentAccount = null;

// TestNet Genesis ID
const TESTNET_GENESIS = '0x00000000851caf3cfdb6e899cf5958bfb1ac3413d346d43539627e6be7ec1b4a';
const TESTNET_VTHO = '0x0000000000000000000000000000456E65726779';

async function checkWallet() {
    return new Promise((resolve) => {
        if (typeof window.vechain !== 'undefined') {
            resolve(true);
            return;
        }

        window.addEventListener('vechainConnect', () => {
            resolve(true);
        }, { once: true });

        setTimeout(() => {
            resolve(false);
        }, 3000);
    });
}

async function initVeChain() {
    try {
        const walletAvailable = await checkWallet();
        
        if (!walletAvailable) {
            console.log('VeWorld wallet not found');
            return false;
        }

        if (typeof window.vechain !== 'undefined') {
            try {
                const accounts = await window.vechain.request({
                    method: 'eth_requestAccounts'
                });
                
                if (accounts && accounts.length > 0) {
                    connex = window.connex;
                    
                    // Verify we're on TestNet
                    const network = connex.thor.genesis.id;
                    if (network !== TESTNET_GENESIS) {
                        console.log('Please switch to TestNet in VeWorld');
                        return false;
                    }
                    
                    console.log('VeWorld TestNet wallet enabled');
                    return true;
                }
            } catch (error) {
                console.log('Failed to enable TestNet wallet:', error);
                return false;
            }
        }

        return false;
    } catch (error) {
        console.error('TestNet initialization error:', error);
        return false;
    }
}

async function connectVeChainWallet() {
    try {
        if (!connex) {
            const initialized = await initVeChain();
            if (!initialized) {
                throw new Error('Please connect to VeChain TestNet in VeWorld');
            }
        }

        // Verify TestNet connection
        const chainTag = connex.thor.genesis.id;
        if (chainTag !== TESTNET_GENESIS) {
            throw new Error('Please switch to TestNet in VeWorld');
        }

        try {
            const certResponse = await connex.vendor
                .sign('cert', {
                    purpose: 'identification',
                    payload: {
                        type: 'text',
                        content: 'Connect to Incinerator TestNet'
                    }
                })
                .request();

            if (!certResponse?.annex?.signer) {
                throw new Error('TestNet wallet connection failed');
            }

            currentAccount = certResponse.annex.signer;
            return {
                success: true,
                address: currentAccount,
                network: 'TestNet'
            };
        } catch (certError) {
            throw new Error('Please unlock your VeWorld wallet and ensure TestNet is selected');
        }
    } catch (error) {
        console.error('TestNet wallet connection error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function getBalances() {
    if (!currentAccount || !connex) {
        throw new Error('TestNet wallet not connected');
    }

    try {
        // Get TestNet VET balance
        const vetAccount = await connex.thor.account(currentAccount).get();
        if (!vetAccount) {
            throw new Error('Failed to fetch TestNet VET balance');
        }

        // Get TestNet VTHO balance
        const vthoMethod = connex.thor.account(TESTNET_VTHO).method({
            "constant": true,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function"
        });

        const vthoBalance = await vthoMethod.call(currentAccount);

        if (!vthoBalance?.decoded?.[0]) {
            throw new Error('Failed to fetch TestNet VTHO balance');
        }

        return {
            vet: formatBalance(vetAccount.balance),
            vtho: formatBalance(vthoBalance.decoded[0])
        };
    } catch (error) {
        console.error('TestNet balance fetch error:', error);
        throw error;
    }
}

function formatBalance(balance) {
    return (parseInt(balance) / 1e18).toFixed(2);
} 