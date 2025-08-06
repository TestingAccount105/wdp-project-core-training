<?php
require_once 'database.php';

class AdminStats {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function getTotalUsers() {
        $query = "SELECT COUNT(*) as total FROM Users";
        $result = $this->conn->query($query);
        return $result->fetch_assoc()['total'];
    }
    
    public function getOnlineUsers() {
        $query = "SELECT COUNT(*) as total FROM Users WHERE Status = 'online'";
        $result = $this->conn->query($query);
        return $result->fetch_assoc()['total'];
    }
    
    public function getNewUsers() {
        $query = "SELECT COUNT(*) as total FROM Users WHERE CreatedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $result = $this->conn->query($query);
        return $result->fetch_assoc()['total'];
    }
    
    public function getTotalServers() {
        $query = "SELECT COUNT(*) as total FROM Server";
        $result = $this->conn->query($query);
        return $result->fetch_assoc()['total'];
    }
    
    public function getTotalMessages() {
        $query = "SELECT COUNT(*) as total FROM Message";
        $result = $this->conn->query($query);
        return $result->fetch_assoc()['total'];
    }
    
    public function getTodayMessages() {
        $query = "SELECT COUNT(*) as total FROM Message WHERE DATE(SentAt) = CURDATE()";
        $result = $this->conn->query($query);
        return $result->fetch_assoc()['total'];
    }
    
    public function getChannelStats() {
        $query = "SELECT c.Type, COUNT(*) as count FROM Channel c GROUP BY c.Type";
        $result = $this->conn->query($query);
        $stats = [];
        while($row = $result->fetch_assoc()) {
            $stats[] = $row;
        }
        return $stats;
    }
    
    public function getServerStats() {
        $query = "SELECT 
                    SUM(CASE WHEN IsPrivate = 0 THEN 1 ELSE 0 END) as public_servers,
                    SUM(CASE WHEN IsPrivate = 1 THEN 1 ELSE 0 END) as private_servers
                  FROM Server";
        $result = $this->conn->query($query);
        return $result->fetch_assoc();
    }
}
?>