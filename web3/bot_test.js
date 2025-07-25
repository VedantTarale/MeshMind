const { MeshMindBot } = require('./bot');
const { ethers } = require('ethers');
require('dotenv').config();

class BotTester {
    constructor() {
        this.bot = new MeshMindBot();
    }

    async runTests() {
        console.log('🧪 Starting Bot Tests...\n');

        try {
            // Test 1: Initialization
            console.log('📋 Test 1: Bot Initialization');
            const initialized = await this.bot.initialize();
            console.log(initialized ? '✅ PASSED' : '❌ FAILED');
            
            if (!initialized) {
                console.log('❌ Cannot proceed with other tests');
                return;
            }

            // Test 2: Balance Check
            console.log('\n📋 Test 2: Balance Check');
            await this.bot.checkBalances();
            console.log('✅ COMPLETED');

            // Test 3: Contract Connection
            console.log('\n📋 Test 3: Contract Connection');
            try {
                const expiredOrders = await this.bot.contract.getExpiredOrders();
                console.log(`✅ PASSED - Found ${expiredOrders.length} expired orders`);
            } catch (error) {
                console.log(`❌ FAILED - ${error.message}`);
            }

            // Test 4: Gas Estimation
            console.log('\n📋 Test 4: Gas Price Check');
            try {
                const feeData = await this.bot.provider.getFeeData();
                console.log(`⛽ Current gas price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`);
                console.log('✅ PASSED');
            } catch (error) {
                console.log(`❌ FAILED - ${error.message}`);
            }

            // Test 5: Network Info
            console.log('\n📋 Test 5: Network Information');
            try {
                const network = await this.bot.provider.getNetwork();
                const blockNumber = await this.bot.provider.getBlockNumber();
                console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
                console.log(`📦 Latest block: ${blockNumber}`);
                console.log('✅ PASSED');
            } catch (error) {
                console.log(`❌ FAILED - ${error.message}`);
            }

            console.log('\n🎉 All tests completed!');

        } catch (error) {
            console.error('💥 Test suite failed:', error);
        }
    }

    async monitorOrders() {
        console.log('👁️  Starting Order Monitor...\n');
        
        try {
            await this.bot.initialize();
            
            setInterval(async () => {
                try {
                    console.log(`⏰ ${new Date().toLocaleTimeString()} - Checking orders...`);
                    
                    const expiredOrders = await this.bot.contract.getExpiredOrders();
                    
                    if (expiredOrders.length > 0) {
                        console.log(`📋 Found ${expiredOrders.length} expired orders:`);
                        
                        for (const orderId of expiredOrders) {
                            const order = await this.bot.contract.getOrder(orderId);
                            const expiredTime = new Date(Number(order.completionTimestamp) * 1000);
                            console.log(`  - Order ${orderId}: Expired at ${expiredTime.toLocaleString()}`);
                        }
                    } else {
                        console.log('✅ No expired orders');
                    }
                    
                    console.log('---');
                    
                } catch (error) {
                    console.error('❌ Monitor error:', error.message);
                }
            }, 30000); // Check every 30 seconds
            
        } catch (error) {
            console.error('💥 Monitor initialization failed:', error);
        }
    }

    async simulateOrder() {
        console.log('🎭 Simulating Order Creation (for testing)...\n');
        
        // This would require additional contract functions to create test orders
        // You can implement this based on your specific testing needs
        console.log('⚠️  This requires additional test setup in your contract');
        console.log('💡 Consider adding a test mode to your contract for simulation');
    }

    async checkContractHealth() {
        console.log('🏥 Checking Contract Health...\n');
        
        try {
            await this.bot.initialize();
            
            // Check if contract is responding
            const expiredOrders = await this.bot.contract.getExpiredOrders();
            console.log(`📋 Contract responsive - ${expiredOrders.length} expired orders`);
            
            // Check event logs for recent activity
            const latestBlock = await this.bot.provider.getBlockNumber();
            const fromBlock = latestBlock - 1000; // Last ~1000 blocks
            
            try {
                const filter = this.bot.contract.filters.OrderAutoCompleted();
                const events = await this.bot.contract.queryFilter(filter, fromBlock, latestBlock);
                console.log(`🎉 Found ${events.length} auto-completion events in last 1000 blocks`);
            } catch (error) {
                console.log('⚠️  Could not fetch recent events:', error.message);
            }
            
            console.log('✅ Contract health check completed');
            
        } catch (error) {
            console.error('❌ Contract health check failed:', error);
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const tester = new BotTester();
    
    switch (command) {
        case 'test':
            await tester.runTests();
            break;
            
        case 'monitor':
            await tester.monitorOrders();
            break;
            
        case 'health':
            await tester.checkContractHealth();
            break;
            
        case 'simulate':
            await tester.simulateOrder();
            break;
            
        default:
            console.log('🤖 MeshMind Bot Tester\n');
            console.log('Usage: node test.js <command>\n');
            console.log('Commands:');
            console.log('  test     - Run all tests');
            console.log('  monitor  - Monitor orders in real-time');
            console.log('  health   - Check contract health');
            console.log('  simulate - Simulate order creation');
            console.log('\nExamples:');
            console.log('  node test.js test');
            console.log('  node test.js monitor');
            break;
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Test script error:', error);
        process.exit(1);
    });
}

module.exports = { BotTester };