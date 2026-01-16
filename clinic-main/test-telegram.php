<?php
// test-telegram.php

// CONFIG
$apiToken = "8319802180:AAFiIHtJvWtV2hijtWDircMSljEy6VTgAag";
$chatId = "1031749914";

$text = "🔔 TEST TELEGRAM NOTIFICATION\n--------------------------\nNếu bạn đọc được tin nhắn này thì hệ thống đã hoạt động!";

$url = "https://api.telegram.org/bot$apiToken/sendMessage?chat_id=$chatId&text=" . urlencode($text) . "&parse_mode=HTML";

echo "<h2>Telegram Test Script</h2>";
echo "<p>Sending message to Chat ID: <b>$chatId</b> via Bot Token: <b>...ag</b></p>";

// Use curl if available for better error handling
if (function_exists('curl_init')) {
    echo "<p>Using CURL...</p>";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://api.telegram.org/bot$apiToken/sendMessage");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'chat_id' => $chatId,
        'text' => $text,
        'parse_mode' => 'HTML'
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Disable SSL check for local dev
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        echo "<p style='color:red'>CURL Error: $error</p>";
    } else {
        echo "<p style='color:green'>API Response: $response</p>";
    }
} else {
    // Fallback to file_get_contents
    echo "<p>Using file_get_contents...</p>";
    $response = @file_get_contents($url);
    if ($response === FALSE) {
        echo "<p style='color:red'>file_get_contents failed. Check allow_url_fopen in php.ini</p>";
    } else {
        echo "<p style='color:green'>Response: $response</p>";
    }
}
?>