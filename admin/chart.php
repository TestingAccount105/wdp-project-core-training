<?php
header('Content-Type: application/json');
require_once 'database.php';

class ChartDataAPI {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function getChannelStatistics() {
        $query = "SELECT 
                    c.Type,
                    COUNT(*) as count,
                    CASE 
                        WHEN c.Type = 'text' THEN 'Text Channels'
                        WHEN c.Type = 'voice' THEN 'Voice Channels'
                        ELSE 'Other Channels'
                    END as display_name
                  FROM Channel c 
                  GROUP BY c.Type
                  ORDER BY count DESC";
        
        $result = $this->conn->query($query);
        $data = [];
        
        while($row = $result->fetch_assoc()) {
            $data[] = [
                'type' => $row['Type'],
                'count' => (int)$row['count'],
                'display_name' => $row['display_name']
            ];
        }
        
        // Add categories count (servers)
        $serverQuery = "SELECT COUNT(*) as count FROM Server";
        $serverResult = $this->conn->query($serverQuery);
        $serverCount = $serverResult->fetch_assoc()['count'];
        
        array_unshift($data, [
            'type' => 'categories',
            'count' => (int)$serverCount,
            'display_name' => 'Categories'
        ]);
        
        return $data;
    }
    
    public function getMessageStatistics() {
        // Get total messages
        $totalQuery = "SELECT COUNT(*) as total FROM Message";
        $totalResult = $this->conn->query($totalQuery);
        $totalMessages = (int)$totalResult->fetch_assoc()['total'];
        
        // Get today's messages
        $todayQuery = "SELECT COUNT(*) as today FROM Message WHERE DATE(SentAt) = CURDATE()";
        $todayResult = $this->conn->query($todayQuery);
        $todayMessages = (int)$todayResult->fetch_assoc()['today'];
        
        // Calculate remaining (old messages)
        $remainingMessages = $totalMessages - $todayMessages;
        
        return [
            [
                'type' => 'total',
                'count' => $totalMessages,
                'display_name' => 'Total Messages',
                'description' => 'All messages ever sent'
            ],
            [
                'type' => 'today',
                'count' => $todayMessages,
                'display_name' => 'Today\'s Messages',
                'description' => 'Messages sent today'
            ],
            [
                'type' => 'remaining',
                'count' => $remainingMessages,
                'display_name' => 'Previous Messages',
                'description' => 'Messages from previous days'
            ]
        ];
    }
    
    public function getServerStatistics() {
        $query = "SELECT 
                    CASE 
                        WHEN IsPrivate = 0 THEN 'public'
                        WHEN IsPrivate = 1 THEN 'private'
                    END as server_type,
                    COUNT(*) as count,
                    CASE 
                        WHEN IsPrivate = 0 THEN 'Public Servers'
                        WHEN IsPrivate = 1 THEN 'Private Servers'
                    END as display_name
                  FROM Server 
                  GROUP BY IsPrivate
                  ORDER BY IsPrivate ASC";
        
        $result = $this->conn->query($query);
        $data = [];
        
        while($row = $result->fetch_assoc()) {
            $data[] = [
                'type' => $row['server_type'],
                'count' => (int)$row['count'],
                'display_name' => $row['display_name'],
                'description' => $row['server_type'] === 'public' ? 'Servers accessible to everyone' : 'Invite-only servers'
            ];
        }
        
        return $data;
    }
    
    public function getAllChartData() {
        return [
            'channel_stats' => $this->getChannelStatistics(),
            'message_stats' => $this->getMessageStatistics(),
            'server_stats' => $this->getServerStatistics()
        ];
    }
}

$api = new ChartDataAPI();

if (isset($_GET['type'])) {
    switch ($_GET['type']) {
        case 'channels':
            echo json_encode($api->getChannelStatistics());
            break;
        case 'messages':
            echo json_encode($api->getMessageStatistics());
            break;
        case 'servers':
            echo json_encode($api->getServerStatistics());
            break;
        default:
            echo json_encode(['error' => 'Invalid chart type']);
    }
} else {
    echo json_encode($api->getAllChartData());
}
?>