// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TokenTransfer.sol";

contract DeviceManagement {
    enum OrderStatus {
        PENDING,
        ACCEPTED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        DISPUTED
    }

    struct UserProfile {
        string username;
        string contactInfo;
        bool isRegistered;
        uint256 reputation; // 0-1000 scale
    }

    struct Device {
        string deviceName;
        string metadataURI;
        address owner;
        bool isRegistered;
        bool isActive;
        uint256 pricePerHour;
        string[] capabilities;
        uint256 reputation; // 0-1000 scale
        uint256 totalOrders;
        uint256 completedOrders;
    }

    struct Order {
        uint256 id;
        address user;
        string action; // "data_access" or "compute_lease"
        uint256 deviceId;
        uint256 amount; // Paid amount
        uint256 timestamp;
        OrderStatus status;
        uint256 completionTimestamp;
        uint256 durationHours;
        string taskDetails; // IPFS hash for task specification
    }

    // Contract references
    TokenTransfer public tokenContract;

    // State variables
    address public admin;
    uint256 public nextDeviceId;
    uint256 public nextOrderId;

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
    event DeviceRegistered(uint256 indexed deviceId, address indexed owner, string deviceName, string metadataURI);
    event DeviceStatusUpdated(uint256 indexed deviceId, bool isActive);
    event DevicePriceUpdated(uint256 indexed deviceId, uint256 newPrice);
    event OrderPlaced(uint256 indexed orderId, address indexed user, uint256 indexed deviceId, string action, uint256 amount);
    event OrderAccepted(uint256 indexed orderId, address indexed deviceOwner);
    event OrderStarted(uint256 indexed orderId);
    event OrderCompleted(uint256 indexed orderId);
    event OrderCancelled(uint256 indexed orderId, string reason);
    event OrderDisputed(uint256 indexed orderId, string reason);
    event PaymentReleased(uint256 indexed orderId, address indexed recipient, uint256 amount);
    event ReputationUpdated(address indexed user, uint256 newReputation);
    event DeviceReputationUpdated(uint256 indexed deviceId, uint256 newReputation);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier userExists(address user) {
        require(users[user].isRegistered, "User not registered");
        _;
    }

    modifier deviceExists(uint256 deviceId) {
        require(devices[deviceId].isRegistered, "Device not registered");
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

    constructor(address _tokenContract) {
        admin = msg.sender;
        tokenContract = TokenTransfer(_tokenContract);
    }

    // User Management
    function registerUser(string memory username, string memory contactInfo) external {
        require(!users[msg.sender].isRegistered, "Already registered");
        require(bytes(username).length > 0, "Username cannot be empty");

        users[msg.sender] = UserProfile(username, contactInfo, true, 500); // Start with neutral reputation
        emit UserRegistered(msg.sender, username, contactInfo);
    }

    // Device Management
    function registerDevice(
        string memory deviceName,
        string memory metadataURI,
        uint256 pricePerHour,
        string[] memory capabilities
    ) external userExists(msg.sender) {
        require(bytes(deviceName).length > 0, "Device name cannot be empty");
        require(pricePerHour > 0, "Price must be greater than 0");

        uint256 deviceId = ++nextDeviceId;

        Device storage newDevice = devices[deviceId];
        newDevice.deviceName = deviceName;
        newDevice.metadataURI = metadataURI;
        newDevice.owner = msg.sender;
        newDevice.isRegistered = true;
        newDevice.isActive = true;
        newDevice.pricePerHour = pricePerHour;
        newDevice.capabilities = capabilities;
        newDevice.reputation = 500; // Start with neutral reputation

        userDevices[msg.sender].push(deviceId);

        emit DeviceRegistered(deviceId, msg.sender, deviceName, metadataURI);
    }

    function updateDeviceStatus(uint256 deviceId, bool isActive)
        external
        onlyDeviceOwner(deviceId)
    {
        devices[deviceId].isActive = isActive;
        emit DeviceStatusUpdated(deviceId, isActive);
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
        string memory taskDetails
    ) external userExists(msg.sender) deviceExists(deviceId) {
        require(devices[deviceId].isActive, "Device is not active");
        require(devices[deviceId].owner != msg.sender, "Cannot order from own device");
        require(durationHours > 0, "Duration must be greater than 0");

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
            action: action,
            deviceId: deviceId,
            amount: totalCost,
            timestamp: block.timestamp,
            status: OrderStatus.PENDING,
            completionTimestamp: 0,
            durationHours: durationHours,
            taskDetails: taskDetails
        });

        orderEscrow[orderId] = totalCost;
        deviceOrders[deviceId].push(orderId);
        userOrders[msg.sender].push(orderId);

        emit OrderPlaced(orderId, msg.sender, deviceId, action, totalCost);
    }

    function acceptOrder(uint256 orderId)
        external
        onlyDeviceOwner(orders[orderId].deviceId)
        validOrderStatus(orderId, OrderStatus.PENDING)
    {
        orders[orderId].status = OrderStatus.ACCEPTED;
        emit OrderAccepted(orderId, msg.sender);
    }

    function startOrder(uint256 orderId)
        external
        onlyDeviceOwner(orders[orderId].deviceId)
        validOrderStatus(orderId, OrderStatus.ACCEPTED)
    {
        orders[orderId].status = OrderStatus.IN_PROGRESS;
        emit OrderStarted(orderId);
    }

    function completeOrder(uint256 orderId)
        external
        onlyDeviceOwner(orders[orderId].deviceId)
        validOrderStatus(orderId, OrderStatus.IN_PROGRESS)
    {
        Order storage order = orders[orderId];
        order.status = OrderStatus.COMPLETED;
        order.completionTimestamp = block.timestamp;

        // Calculate payments
        uint256 escrowAmount = orderEscrow[orderId];
        uint256 deviceOwnerPayment = escrowAmount;

        // Release payments
        orderEscrow[orderId] = 0;
        require(tokenContract.transfer(devices[order.deviceId].owner, deviceOwnerPayment), "Payment to device owner failed");

        // Update device statistics
        devices[order.deviceId].totalOrders++;
        devices[order.deviceId].completedOrders++;

        emit OrderCompleted(orderId);
        emit PaymentReleased(orderId, devices[order.deviceId].owner, deviceOwnerPayment);
    }

    function cancelOrder(uint256 orderId, string memory reason)
        external
        onlyOrderParticipant(orderId)
    {
        OrderStatus currentStatus = orders[orderId].status;
        require(
            currentStatus == OrderStatus.PENDING || currentStatus == OrderStatus.ACCEPTED,
            "Cannot cancel order in current status"
        );

        orders[orderId].status = OrderStatus.CANCELLED;

        // Refund the user
        uint256 refundAmount = orderEscrow[orderId];
        orderEscrow[orderId] = 0;
        require(tokenContract.transfer(orders[orderId].user, refundAmount), "Refund failed");

        emit OrderCancelled(orderId, reason);
    }


    // View Functions
    function getUserDevices(address user) external view returns (uint256[] memory) {
        return userDevices[user];
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

    // function getActiveDevices() external view returns (uint256[] memory) {
    //     uint256[] memory activeDevices = new uint256[](nextDeviceId);
    //     uint256 count = 0;

    //     for (uint256 i = 1; i <= nextDeviceId; i++) {
    //         if (devices[i].isRegistered && devices[i].isActive) {
    //             activeDevices[count] = i;
    //             count++;
    //         }
    //     }

    //     // Resize array to actual count
    //     uint256[] memory result = new uint256[](count);
    //     for (uint256 i = 0; i < count; i++) {
    //         result[i] = activeDevices[i];
    //     }

    //     return result;
    // }

    // function getDeviceStats(uint256 deviceId)
    //     external
    //     view
    //     deviceExists(deviceId)
    //     returns (uint256 totalOrders, uint256 completedOrders, uint256 reputation)
    // {
    //     Device memory device = devices[deviceId];
    //     return (device.totalOrders, device.completedOrders, device.reputation);
    // }

    // Admin Functions

    function updateTokenContract(address newTokenContract) external onlyAdmin {
        tokenContract = TokenTransfer(newTokenContract);
    }

    // Emergency function to withdraw stuck tokens
    function emergencyWithdraw(uint256 amount) external onlyAdmin {
        require(tokenContract.transfer(admin, amount), "Emergency withdrawal failed");
    }
}