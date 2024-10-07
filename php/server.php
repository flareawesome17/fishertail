<?php
// Allow from any origin
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Read the input data
$data = json_decode(file_get_contents('php://input'), true);
$phone = $data['phone'] ?? null; // Use null coalescing operator to avoid undefined index error
$messageBody = $data['message'] ?? null;

// Check if phone and message are set
if (is_null($phone) || is_null($messageBody)) {
    http_response_code(400); // Bad request
    echo json_encode(["status" => 400, "message" => "Phone number or message is missing.", "data" => false]);
    exit();
}

// Prepare the message data
$message = [
    "secret" => "1a9e7234348b40ab2da3309658a30cef4819fdcb",
    "mode" => "devices",
    "device" => "00000000-0000-0000-d692-f0ec7cd73213", // Replace with actual device ID
    "sim" => 1,
    "priority" => 1,
    "phone" => $phone,
    "message" => $messageBody
];

// Initialize cURL and set options
$cURL = curl_init("https://www.cloud.smschef.com/api/send/sms");
curl_setopt($cURL, CURLOPT_RETURNTRANSFER, true);
curl_setopt($cURL, CURLOPT_POSTFIELDS, $message);

// Execute cURL request and close the connection
$response = curl_exec($cURL);
curl_close($cURL);

// Decode response and return as JSON
$result = json_decode($response, true);
header('Content-Type: application/json');
// You might need to check the actual response structure of the SMSChef API
if ($result['status'] == 200) { // Adjust this condition based on actual API response
    echo json_encode(["success" => true, "message" => "SMS sent successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "SMS sending failed."]);
}
?>
