#include <WiFi.h>
#include <FirebaseESP32.h>
#include <MFRC522.h>
#include <DHT.h>

#define WIFI_SSID "Q coffee_tea 1"
#define WIFI_PASSWORD "250ahoangdieu2"

// Firebase thông tin
#define FIREBASE_HOST "tt-iot-53225-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "TMbRdmVqTckf2gMExJrfT2AVEpCgHjUbEvA8RB7L"

// Pin kết nối RFID
#define SS_PIN 5
#define RST_PIN 0

// Pin kết nối DHT và SRF05
DHT dht(4, DHT11);  // Khai báo chân cho cảm biến DHT
const int trigPin = 13;
const int echoPin = 14;
#define SOUND_SPEED 0.034 // Tốc độ âm thanh trong không khí (cm/us)

long duration;
float distanceCm;

FirebaseData firebaseData;
FirebaseConfig firebaseConfig;
FirebaseAuth firebaseAuth;
MFRC522 rfid(SS_PIN, RST_PIN);  // Khởi tạo đối tượng MFRC522

void setup() {
  Serial.begin(115200);
  
  // Cấu hình chân I/O
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  
  // Kết nối WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.println("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  
  // Cấu hình Firebase
  firebaseConfig.host = FIREBASE_HOST;
  firebaseConfig.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&firebaseConfig, &firebaseAuth);
  Firebase.reconnectWiFi(true);
  
  if (Firebase.ready()) {
    Serial.println("Connected to Firebase!");
  } else {
    Serial.println("Failed to connect to Firebase.");
  }

  // Khởi tạo cảm biến DHT và RFID
  dht.begin();
  SPI.begin();
  rfid.PCD_Init();
}

void loop() {
  // Đọc cảm biến SRF05 (siêu âm)
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  duration = pulseIn(echoPin, HIGH);
  distanceCm = duration * SOUND_SPEED / 2;
  
  Serial.print("Distance (cm): ");
  Serial.println(distanceCm);
  
  // Kiểm tra và cập nhật tình trạng "A1" trên Firebase
  if (distanceCm < 3) {
    if (Firebase.setInt(firebaseData, "/parking/vehicle/A1", 1)) {
      Serial.println("Vehicle A1 status updated to 1 (occupied)");
    } else {
      Serial.print("Failed to update vehicle A1 status ");
      Serial.println(firebaseData.errorReason());
    }
  } else {
    if (Firebase.setInt(firebaseData, "/parking/vehicle/A1", 0)) {
      Serial.println("Vehicle A1 status updated to 0 (vacant)");
    } else {
      Serial.print("Failed to update vehicle A1 status ");
      Serial.println(firebaseData.errorReason());
    }
  }

  // Đọc dữ liệu từ cảm biến DHT11
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  if (!isnan(temperature) && !isnan(humidity)) {
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.print(" °C, Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
    
    if (Firebase.setFloat(firebaseData, "parking/temperature", temperature)) {
      Serial.println("Temperature data sent successfully!");
    } else {
      Serial.println("Failed to send temperature data.");
      Serial.println(firebaseData.errorReason());
    }

    if (Firebase.setFloat(firebaseData, "parking/humidity", humidity)) {
      Serial.println("Humidity data sent successfully!");
    } else {
      Serial.println("Failed to send humidity data.");
      Serial.println(firebaseData.errorReason());
    }
  } else {
    Serial.println("Failed to read from DHT sensor!");
  }

  // Kiểm tra và đọc thẻ RFID
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      uid += String(rfid.uid.uidByte[i], HEX);
    }
    Serial.print("RFID UID: ");
    Serial.println(uid);

    // Kiểm tra entryTime để xác định trạng thái vào/ra
    if (Firebase.getInt(firebaseData, "/cars/" + uid + "/entryTime")) {
      recordExit(uid);
    } else {
      recordEntry(uid);
    }

    rfid.PICC_HaltA();  // Dừng đọc thẻ
  }
  
  delay(2000);  // Chờ 2 giây trước lần lặp tiếp theo
}

// Ghi nhận thời gian vào
void recordEntry(String uid) {
  long entryTime = millis(); // Sử dụng RTC nếu cần thời gian thực
  if (Firebase.setInt(firebaseData, "/cars/" + uid + "/entryTime", entryTime)) {
    Serial.println("Entry time recorded successfully!");
  } else {
    Serial.println("Failed to record entry time.");
  }
}

// Ghi nhận thời gian ra và tính toán thời gian đỗ xe
void recordExit(String uid) {
  if (Firebase.getInt(firebaseData, "/cars/" + uid + "/entryTime")) {
    long entryTime = firebaseData.intData();
    long currentTime = millis();
    long duration = currentTime - entryTime; // Tính toán thời gian đỗ
    
    if (Firebase.setInt(firebaseData, "/cars/" + uid + "/duration", duration)) {
      Serial.println("Duration recorded successfully!");
    } else {
      Serial.println("Failed to record duration.");
    }

    Firebase.deleteNode(firebaseData, "/cars/" + uid + "/entryTime");
  } else {
    Serial.println("Failed to get entry time.");
  }
}
