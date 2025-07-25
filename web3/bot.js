const { ethers } = require('ethers');
const cron = require('node-cron');
require('dotenv').config();

// Configuration
const CONFIG = {
    RPC_URL: process.env.RPC_URL || 'https://sei-testnet.g.alchemy.com/v2/9JqMLujfA_81OhgT9qyQO',
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    CONTRACT_ADDRESS: process.env.MESHMIND_CONTRACT_ADDRESS,
    CHECK_INTERVAL: process.env.CHECK_INTERVAL || '*/5 * * * *', // Every 5 minutes
};

// Contract ABI (only needed functions)
const CONTRACT_ABI = [
    "function getExpiredOrders() external view returns (uint256[] memory)",
    "function autoCompleteOrder(uint256 orderId) external",
    "function getOrder(uint256 orderId) external view returns (tuple(uint256 id, address user, string action, uint256 deviceId, uint256 amount, uint256 timestamp, uint8 status, uint256 completionTimestamp, uint256 durationHours, string taskDetails))",
    "event OrderAutoCompleted(uint256 indexed orderId, address indexed bot, uint256 botReward)",
    "event OrderCompleted(uint256 indexed orderId, uint256 paymentAmount)"
];

// ERC20 ABI for token balance checking
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
];

class MeshMindBot {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
        this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
        this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONTRACT_ABI, this.wallet);
        this.isRunning = false;
        this.stats = {
            ordersProcessed: 0,
            totalRewards: 0,
            errors: 0,
            lastRun: null
        };
        
        console.log(`🤖 MeshMind Bot initialized`);
        console.log(`📍 Bot Address: ${this.wallet.address}`);
        console.log(`🏭 Contract: ${CONFIG.CONTRACT_ADDRESS}`);
    }

    async initialize() {
        try {
            // Check network connection
            const network = await this.provider.getNetwork();
            console.log(`🌐 Connected to network: ${network.name} (chainId: ${network.chainId})`);

            // Check bot balance
            await this.checkBalances();

            // Set up event listeners
            this.setupEventListeners();

            console.log('✅ Bot initialization complete');
            return true;
        } catch (error) {
            console.error('❌ Bot initialization failed:', error);
            return false;
        }
    }

    async checkBalances() {
        try {
            // Check ETH balance for gas
            const ethBalance = await this.provider.getBalance(this.wallet.address);
            console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

            if (ethBalance < ethers.parseEther('0.01')) {
                console.warn('⚠️  Low ETH balance. Consider funding the bot wallet.');
            }

            // If you have a token contract, check token balance too
            // const tokenBalance = await tokenContract.balanceOf(this.wallet.address);
            // console.log(`🪙 Token Balance: ${ethers.formatUnits(tokenBalance, 18)} tokens`);

        } catch (error) {
            console.error('Error checking balances:', error);
        }
    }

    setupEventListeners() {
        // Listen for successful auto-completions
        this.contract.on('OrderAutoCompleted', (orderId, bot, botReward, event) => {
            if (bot.toLowerCase() === this.wallet.address.toLowerCase()) {
                this.stats.ordersProcessed++;
                this.stats.totalRewards += parseFloat(ethers.formatUnits(botReward, 18));
                console.log(`🎉 Successfully auto-completed order ${orderId}, reward: ${ethers.formatUnits(botReward, 18)} tokens`);
            }
        });

        // Listen for any order completions to track network activity
        this.contract.on('OrderCompleted', (orderId, paymentAmount) => {
            console.log(`📋 Order ${orderId} completed manually by device owner`);
        });
    }

    async checkExpiredOrders() {
        try {
            console.log('🔍 Checking for expired orders...');
            
            const expiredOrderIds = await this.contract.getExpiredOrders();
            
            if (expiredOrderIds.length === 0) {
                console.log('✅ No expired orders found');
                return;
            }

            console.log(`📋 Found ${expiredOrderIds.length} expired order(s): [${expiredOrderIds.join(', ')}]`);

            // Process each expired order
            for (const orderId of expiredOrderIds) {
                await this.processExpiredOrder(orderId);
            }

        } catch (error) {
            console.error('Error checking expired orders:', error);
            this.stats.errors++;
        }
    }

    async processExpiredOrder(orderId) {
        try {
            console.log(`⏰ Processing expired order ${orderId}...`);

            // Get order details for logging
            const order = await this.contract.getOrder(orderId);
            console.log(`📋 Order details: User: ${order.user}, Device: ${order.deviceId}, Amount: ${ethers.formatUnits(order.amount, 18)} tokens`);

            // Check current gas price
            const feeData = await this.provider.getFeeData();
            if (feeData.gasPrice > BigInt(CONFIG.MAX_GAS_PRICE)) {
                console.warn(`⛽ Gas price too high: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei. Skipping order ${orderId}`);
                return;
            }

            // Estimate gas for the transaction
            const gasEstimate = await this.contract.autoCompleteOrder.estimateGas(orderId);
            const gasPrice = feeData.gasPrice;
            const txCost = gasEstimate * gasPrice;

            console.log(`⛽ Estimated gas: ${gasEstimate.toString()}, Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
            console.log(`💰 Transaction cost: ${ethers.formatEther(txCost)} ETH`);

            // Execute the auto-completion
            const tx = await this.contract.autoCompleteOrder(orderId, {
                gasLimit: gasEstimate * BigInt(120) / BigInt(100), // 20% buffer
                gasPrice: gasPrice
            });

            console.log(`📤 Transaction sent: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                console.log(`✅ Order ${orderId} auto-completed successfully! Gas used: ${receipt.gasUsed}`);
            } else {
                console.error(`❌ Transaction failed for order ${orderId}`);
                this.stats.errors++;
            }

        } catch (error) {
            console.error(`Error processing order ${orderId}:`, error.message);
            this.stats.errors++;

            // Handle specific error cases
            if (error.message.includes('Order not yet expired')) {
                console.log(`⏰ Order ${orderId} is not yet expired`);
            } else if (error.message.includes('Invalid order status')) {
                console.log(`📋 Order ${orderId} is no longer in progress`);
            }
        }
    }

    startMonitoring() {
        if (this.isRunning) {
            console.log('🔄 Bot is already running');
            return;
        }

        console.log(`🚀 Starting automated monitoring with interval: ${CONFIG.CHECK_INTERVAL}`);
        
        // Schedule the cron job
        this.cronJob = cron.schedule(CONFIG.CHECK_INTERVAL, async () => {
            if (!this.isRunning) return;
            
            this.stats.lastRun = new Date();
            await this.checkExpiredOrders();
        });

        // Run initial check
        this.checkExpiredOrders();
        
        this.isRunning = true;
        console.log('✅ Monitoring started');

        // Log stats periodically
        this.statsInterval = setInterval(() => {
            this.logStats();
        }, 60000); // Every minute
    }

    stopMonitoring() {
        if (!this.isRunning) {
            console.log('🛑 Bot is not running');
            return;
        }

        console.log('🛑 Stopping automated monitoring...');
        
        if (this.cronJob) {
            this.cronJob.destroy();
        }
        
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }

        this.isRunning = false;
        console.log('✅ Monitoring stopped');
    }

    logStats() {
        console.log('\n📊 === BOT STATISTICS ===');
        console.log(`🔢 Orders Processed: ${this.stats.ordersProcessed}`);
        console.log(`💰 Total Rewards Earned: ${this.stats.totalRewards.toFixed(4)} tokens`);
        console.log(`❌ Errors: ${this.stats.errors}`);
        console.log(`⏰ Last Run: ${this.stats.lastRun ? this.stats.lastRun.toLocaleString() : 'Never'}`);
        console.log(`🔄 Status: ${this.isRunning ? 'Running' : 'Stopped'}`);
        console.log('========================\n');
    }

    // Manual order completion (for testing)
    async manualComplete(orderId) {
        console.log(`🔧 Manually completing order ${orderId}...`);
        try {
            await this.processExpiredOrder(orderId);
        } catch (error) {
            console.error('Manual completion failed:', error);
        }
    }

    // Graceful shutdown
    async shutdown() {
        console.log('🔄 Shutting down bot...');
        this.stopMonitoring();
        
        // Remove event listeners
        this.contract.removeAllListeners();
        
        console.log('✅ Bot shutdown complete');
        process.exit(0);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Received SIGINT, shutting down gracefully...');
    if (global.bot) {
        await global.bot.shutdown();
    }
});

process.on('SIGTERM', async () => {
    console.log('\n🔄 Received SIGTERM, shutting down gracefully...');
    if (global.bot) {
        await global.bot.shutdown();
    }
});

// Main execution
async function main() {
    console.log('🚀 Starting MeshMind Automation Bot...');
    
    // Validate required environment variables
    if (!CONFIG.PRIVATE_KEY) {
        console.error('❌ BOT_PRIVATE_KEY environment variable is required');
        process.exit(1);
    }
    
    if (!CONFIG.CONTRACT_ADDRESS) {
        console.error('❌ MESHMIND_CONTRACT_ADDRESS environment variable is required');
        process.exit(1);
    }

    // Create and initialize bot
    const bot = new MeshMindBot();
    global.bot = bot;
    
    const initialized = await bot.initialize();
    if (!initialized) {
        console.error('❌ Failed to initialize bot');
        process.exit(1);
    }

    // Start monitoring
    bot.startMonitoring();
    
    // Keep the process alive
    process.stdin.resume();
}

// Export for testing purposes
module.exports = { MeshMindBot };

// Run if this file is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}