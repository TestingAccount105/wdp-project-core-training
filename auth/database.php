<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'misvord';
    private $username = 'root';
    private $password = '';
    public $conn;

    public function getConnection() {
        $this->conn = new mysqli($this->host, $this->username, $this->password, $this->db_name, 3307);

        // Cek koneksi
        if ($this->conn->connect_error) {
            die("Connection failed: " . $this->conn->connect_error);
        }

        return $this->conn;
    }
}
?>
