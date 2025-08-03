<?php
class Database {
    private $host = "localhost";
    private $db_name = "misvord_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new mysqli($this->host, $this->username, $this->password, $this->db_name, 3307);
            $this->conn->set_charset("utf8");
        } catch(Exception $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
?>
