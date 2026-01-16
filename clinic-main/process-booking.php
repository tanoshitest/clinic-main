<?php
// process-booking.php

// 1. Database Configuration
$host = 'localhost';
$db   = 'clinic_db';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

header('Content-Type: application/json');

try {
    // Connect to Database
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// 2. Handle Form Submission
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Get and Sanitize Inputs
    $firstName = trim($_POST['first_name'] ?? '');
    $lastName  = trim($_POST['last_name'] ?? '');
    $email     = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $phone     = trim($_POST['phone'] ?? '');
    $date      = $_POST['preferred_date'] ?? '';
    $concern   = $_POST['concern'] ?? 'General Checkup';

    // 3. Validation (Server-side)
    $errors = [];
    if (empty($firstName)) { $errors[] = "First Name is required."; }
    if (empty($phone)) { $errors[] = "Phone Number is required."; }
    if (empty($date)) { $errors[] = "Preferred Date is required."; }

    if (!empty($errors)) {
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }

    try {
        // 4. Secure Database Insertion (Prepared Statement)
        $sql = "INSERT INTO appointments (first_name, last_name, email, phone, preferred_date, concern) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$firstName, $lastName, $email, $phone, $date, $concern]);

        // 5. Send Email Notification
        $to = 'admin@mysite.com';
        $subject = "Khách đặt lịch mới: $firstName $lastName - $date";
        $message = "
        <html>
        <head><title>New Appointment Request</title></head>
        <body>
            <h2>Thông tin đặt lịch mới</h2>
            <p><strong>Khách hàng:</strong> $firstName $lastName</p>
            <p><strong>Ngày hẹn:</strong> $date</p>
            <p><strong>Số điện thoại:</strong> $phone</p>
            <p><strong>Email:</strong> $email</p>
            <p><strong>Vấn đề:</strong> $concern</p>
            <hr>
            <p>Vui lòng đăng nhập Admin Dashboard để xử lý.</p>
        </body>
        </html>
        ";

        // Headers for HTML email
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= 'From: <system@mysite.com>' . "\r\n";

        // Attempt to send email (Note: requires mail server configuration)
        @mail($to, $subject, $message, $headers);

        echo json_encode(['success' => true, 'message' => 'Appointment scheduled successfully!']);

    } catch (\PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
}
?>
