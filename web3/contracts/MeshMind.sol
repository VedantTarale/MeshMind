// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TokenTransfer.sol";

contract MeshMind {
    enum OrderStatus {
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    struct UserProfile {
        string username;
        string contactInfo;
        bool isRegistered;
    }

    struct Device {
        string deviceName;
        string deviceIP;
        address owner;
        bool isActive;
        bool isReady; // New field to track if device is ready to accept orders
        uint256 pricePerHour;
        string[] capabilities;
        string specs;
        uint256 totalOrders;
        uint256 completedOrders;
    }

    struct Order {
        uint256 id;
        address user;
        uint256 deviceId;
        uint256 amount; // Paid amount
        uint256 timestamp;
        string publicKey;
        OrderStatus status;
        uint256 completionTimestamp;
        uint256 durationHours;
        string taskDetails; // IPFS hash for task specification
    }

    // Contract references
    TokenTransfer public tokenContract;

    // State variables
    address public admin;
    address public automationBot; // Bot authorized for automated operations
    uint256 public nextDeviceId;
    uint256 public nextOrderId;
    uint256 public botRewardPercentage = 5; // 5% of order amount as bot reward
    
    // Gas compensation for bot operations
    uint256 public gasCompensation = 0.001 ether; // Fixed gas compensation in ETH

    // Mappings
    mapping(address => UserProfile) public users;
    mapping(uint256 => Device) public devices;
    mapping(address => uint256[]) public userDevices;
    mapping(uint256 => uint256[]) public deviceOrders;
    mapping(address => uint256[]) public userOrders;
    mapping(uint256 => Order) public orders;
    mapping(uint256 => uint256) public orderEscrow; // Order ID -> Escrowed amount
    mapping(uint256 => bool) public disputedOrders;

    // Events
    event UserRegistered(address indexed user, string username, string contactInfo);
    event DeviceRegistered(uint256 indexed deviceId, address indexed owner, string deviceName, string deviceIP);
    event DeviceStatusUpdated(uint256 indexed deviceId, bool isActive);
    event DeviceReadinessUpdated(uint256 indexed deviceId, bool isReady);
    event DevicePriceUpdated(uint256 indexed deviceId, uint256 newPrice);
    event OrderPlaced(uint256 indexed orderId, address indexed user, uint256 indexed deviceId, string action, uint256 amount);
    event OrderAutoAccepted(uint256 indexed orderId, address indexed deviceOwner);
    event OrderStarted(uint256 indexed orderId);
    event OrderCompleted(uint256 indexed orderId, uint256 paymentAmount);
    event OrderAutoCompleted(uint256 indexed orderId, address indexed bot, uint256 botReward);
    event OrderCancelled(uint256 indexed orderId, string reason);
    event OrderDisputed(uint256 indexed orderId, string reason);
    event PaymentReleased(uint256 indexed orderId, address indexed recipient, uint256 amount);
    event ReputationUpdated(address indexed user, uint256 newReputation);
    event DeviceReputationUpdated(uint256 indexed deviceId, uint256 newReputation);
    event BotUpdated(address indexed oldBot, address indexed newBot);
    event BotRewardUpdated(uint256 oldReward, uint256 newReward);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier onlyBot() {
        require(msg.sender == automationBot, "Only automation bot");
        _;
    }
    
    modifier userExists(address user) {
        require(users[user].isRegistered, "User not registered");
        _;
    }

    modifier onlyDeviceOwner(uint256 deviceId) {
        require(devices[deviceId].owner == msg.sender, "Not device owner");
        _;
    }

    modifier onlyOrderParticipant(uint256 orderId) {
        require(
            orders[orderId].user == msg.sender ||
            devices[orders[orderId].deviceId].owner == msg.sender,
            "Not order participant"
        );
        _;
    }

    modifier validOrderStatus(uint256 orderId, OrderStatus requiredStatus) {
        require(orders[orderId].status == requiredStatus, "Invalid order status");
        _;
    }

    constructor(address _tokenContract, address _automationBot) {
        admin = msg.sender;
        tokenContract = TokenTransfer(_tokenContract);
        automationBot = _automationBot;
    }

    // Bot Management Functions
    function setAutomationBot(address _newBot) external onlyAdmin {
        address oldBot = automationBot;
        automationBot = _newBot;
        emit BotUpdated(oldBot, _newBot);
    }

    // User Management
    function registerUser(string memory username, string memory contactInfo) external {
        require(!users[msg.sender].isRegistered, "Already registered");
        require(bytes(username).length > 0, "Username cannot be empty");

        users[msg.sender] = UserProfile(username, contactInfo, true);
        emit UserRegistered(msg.sender, username, contactInfo);
    }

    // Device Management
    function registerDevice(
        string memory deviceName,
        string memory deviceIP,
        uint256 pricePerHour,
        string[] memory capabilities,
        string memory specs
    ) external userExists(msg.sender) {
        require(bytes(deviceName).length > 0, "Device name cannot be empty");
        require(pricePerHour > 0, "Price must be greater than 0");

        uint256 deviceId = ++nextDeviceId;

        Device storage newDevice = devices[deviceId];
        newDevice.deviceName = deviceName;
        newDevice.deviceIP = deviceIP;
        newDevice.owner = msg.sender;
        newDevice.isActive = true;
        newDevice.isReady = true;
        newDevice.pricePerHour = pricePerHour;
        newDevice.capabilities = capabilities;
        newDevice.specs = specs;
        newDevice.totalOrders = 0;
        newDevice.completedOrders = 0;

        userDevices[msg.sender].push(deviceId);

        emit DeviceRegistered(deviceId, msg.sender, deviceName, deviceIP);
    }

    function updateDeviceStatus(uint256 deviceId, bool isActive)
        external
        onlyDeviceOwner(deviceId)
    {
        devices[deviceId].isActive = isActive;
        emit DeviceStatusUpdated(deviceId, isActive);
    }

    function updateDeviceReadiness(uint256 deviceId, bool isReady)
        external
        onlyDeviceOwner(deviceId)
    {
        devices[deviceId].isReady = isReady;
        emit DeviceReadinessUpdated(deviceId, isReady);
    }

    function updateDevicePricing(uint256 deviceId, uint256 newPrice)
        external
        onlyDeviceOwner(deviceId)
    {
        require(newPrice > 0, "Price must be greater than 0");
        devices[deviceId].pricePerHour = newPrice;
        emit DevicePriceUpdated(deviceId, newPrice);
    }

    function updateDeviceCapabilities(uint256 deviceId, string[] memory capabilities)
        external
        onlyDeviceOwner(deviceId)
    {
        devices[deviceId].capabilities = capabilities;
    }

    // Order Management
    function placeOrder(
        uint256 deviceId,
        string memory action,
        uint256 durationHours,
        string memory taskDetails,
        string memory publicKey
    ) external userExists(msg.sender) {
        require(devices[deviceId].isActive, "Device is not active");
        require(devices[deviceId].isReady, "Device is not ready to accept orders");
        require(durationHours > 0, "Duration must be greater than 0");
        require(bytes(publicKey).length > 0, "Public key cannot be empty");

        uint256 totalCost = devices[deviceId].pricePerHour * durationHours;
        require(tokenContract.balanceOf(msg.sender) >= totalCost, "Insufficient token balance");

        // Transfer tokens to this contract for escrow
        require(
            tokenContract.transferFrom(msg.sender, address(this), totalCost),
            "Token transfer failed"
        );

        uint256 orderId = ++nextOrderId;
        orders[orderId] = Order({
            id: orderId,
            user: msg.sender,
            deviceId: deviceId,
            amount: totalCost,
            timestamp: block.timestamp,
            publicKey: publicKey,
            status: OrderStatus.IN_PROGRESS,
            completionTimestamp: block.timestamp + (durationHours * 1 hours),
            durationHours: durationHours,
            taskDetails: taskDetails
        });

        orderEscrow[orderId] = totalCost;
        deviceOrders[deviceId].push(orderId);
        userOrders[msg.sender].push(orderId);
        
        // Update device stats and set device as not ready
        devices[deviceId].totalOrders++;
        devices[deviceId].isReady = false;

        emit OrderPlaced(orderId, msg.sender, deviceId, action, totalCost);
        emit OrderAutoAccepted(orderId, devices[deviceId].owner);
        emit OrderStarted(orderId);
        emit DeviceReadinessUpdated(deviceId, false);
    }

    // Automated completion by bot when time expires
    function autoCompleteOrder(uint256 orderId)
        external
        onlyBot
        validOrderStatus(orderId, OrderStatus.IN_PROGRESS)
    {
        Order storage order = orders[orderId];
        require(block.timestamp >= order.completionTimestamp, "Order not yet expired");

        order.status = OrderStatus.COMPLETED;
        
        uint256 deviceId = order.deviceId;
        devices[deviceId].completedOrders++;

        uint256 totalAmount = orderEscrow[orderId];
        uint256 botReward = (totalAmount * botRewardPercentage) / 100;
        uint256 deviceOwnerPayment = totalAmount - botReward;

        // Clear escrow
        orderEscrow[orderId] = 0;

        // Transfer bot reward
        if (botReward > 0) {
            require(
                tokenContract.transfer(automationBot, botReward),
                "Bot reward transfer failed"
            );
        }

        // Transfer payment to device owner
        require(
            tokenContract.transfer(devices[deviceId].owner, deviceOwnerPayment),
            "Payment to device owner failed"
        );

        // Compensate bot for gas (if contract has ETH balance)
        if (address(this).balance >= gasCompensation) {
            payable(automationBot).transfer(gasCompensation);
        }

        // Set device back to ready state after completion
        devices[deviceId].isReady = true;

        emit OrderAutoCompleted(orderId, automationBot, botReward);
        emit PaymentReleased(orderId, devices[deviceId].owner, deviceOwnerPayment);
        emit DeviceReadinessUpdated(deviceId, true);
    }

    function cancelOrder(uint256 orderId, string memory reason)
        external
        onlyOrderParticipant(orderId)
    {
        OrderStatus currentStatus = orders[orderId].status;
        require(
            currentStatus == OrderStatus.IN_PROGRESS,
            "Cannot cancel order in current status"
        );

        orders[orderId].status = OrderStatus.CANCELLED;

        // Set device back to ready if order was in progress
        if (currentStatus == OrderStatus.IN_PROGRESS) {
            devices[orders[orderId].deviceId].isReady = true;
            emit DeviceReadinessUpdated(orders[orderId].deviceId, true);
        }

        // Refund the user
        uint256 refundAmount = orderEscrow[orderId];
        orderEscrow[orderId] = 0;
        require(tokenContract.transfer(orders[orderId].user, refundAmount), "Refund failed");

        emit OrderCancelled(orderId, reason);
    }

    // Function to get orders that are ready for auto-completion
    function getExpiredOrders() external view returns (uint256[] memory) {
        uint256[] memory expiredOrders = new uint256[](nextOrderId);
        uint256 count = 0;

        for (uint256 i = 1; i <= nextOrderId; i++) {
            if (orders[i].status == OrderStatus.IN_PROGRESS && 
                block.timestamp >= orders[i].completionTimestamp) {
                expiredOrders[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = expiredOrders[i];
        }

        return result;
    }

    // View Functions
    function getUserProfile(address user) external view returns (UserProfile memory) {
        return users[user];
    }

    function getUserDevices(address user) external view returns (Device[] memory) {
        uint256[] memory deviceIds = userDevices[user];
        Device[] memory userDeviceList = new Device[](deviceIds.length);
        
        for (uint256 i = 0; i < deviceIds.length; i++) {
            userDeviceList[i] = devices[deviceIds[i]];
        }
        
        return userDeviceList;
    }
    

    function getDevice(uint256 deviceId) external view returns (Device memory) {
        return devices[deviceId];
    }

    function getUserOrders(address user) external view returns (uint256[] memory) {
        return userOrders[user];
    }

    function getDeviceOrders(uint256 deviceId) external view returns (uint256[] memory) {
        return deviceOrders[deviceId];
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    function getActiveDevices() external view returns (uint256[] memory) {
        uint256[] memory activeDevices = new uint256[](nextDeviceId);
        uint256 count = 0;

        for (uint256 i = 1; i <= nextDeviceId; i++) {
            if (devices[i].isActive) {
                activeDevices[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeDevices[i];
        }

        return result;
    }

    function getReadyDevices() external view returns (uint256[] memory) {
        uint256[] memory readyDevices = new uint256[](nextDeviceId);
        uint256 count = 0;

        for (uint256 i = 1; i <= nextDeviceId; i++) {
            if (devices[i].isActive && devices[i].isReady) {
                readyDevices[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = readyDevices[i];
        }

        return result;
    }

    function getOrderEscrow(uint256 orderId) external view returns (uint256) {
        return orderEscrow[orderId];
    }

    // Function to fund contract with tokens for gas compensation
    receive() external payable {}
}