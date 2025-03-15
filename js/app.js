async function handleWalletConnect() {
    const walletStatus = document.getElementById('wallet-status');
    const networkStatus = document.getElementById('network-status');
    const balanceContainer = document.getElementById('balance-container');
    const balanceError = document.getElementById('balance-error');
    
    try {
        // Reset any previous error states
        document.getElementById('connection-status').classList.remove('error');
        
        // Show connecting status
        walletStatus.textContent = 'Checking for VeWorld wallet...';
        networkStatus.textContent = 'Network: Checking...';
        
        // Try to initialize if not already done
        if (!window.connex) {
            await initVeChain();
            // Give a small delay for wallet to be ready
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const result = await connectVeChainWallet();
        
        if (result.success) {
            walletStatus.textContent = `Connected: ${formatAddress(result.address)}`;
            networkStatus.textContent = `Network: ${result.network}`;
            balanceContainer.classList.remove('hidden');
            await updateBalanceDisplay();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Connection error:', error);
        walletStatus.textContent = `Error: ${error.message}`;
        networkStatus.textContent = 'Network: Not Connected';
        document.getElementById('connection-status').classList.add('error');
        balanceContainer.classList.add('hidden');
    }
}

async function updateBalanceDisplay() {
    const balanceError = document.getElementById('balance-error');
    
    try {
        const balances = await getBalances();
        if (balances) {
            // Update main token displays
            document.getElementById('vet-balance').textContent = `${balances.vet}`;
            document.getElementById('vtho-balance').textContent = `${balances.vtho}`;
            
            // Update detailed balance displays
            document.getElementById('vet-balance-detail').textContent = `${balances.vet} VET`;
            document.getElementById('vtho-balance-detail').textContent = `${balances.vtho} VTHO`;
            
            balanceError.classList.add('hidden');
        } else {
            throw new Error('Could not fetch balances');
        }
    } catch (error) {
        console.error('Balance error:', error);
        balanceError.classList.remove('hidden');
    }
}

function formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
} 