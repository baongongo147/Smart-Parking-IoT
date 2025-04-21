#include <AdafruitIO.h>            // Thư viện Adafruit IO
#include <AdafruitIO_WiFi.h>       // Thư viện Adafruit IO WiFi
#include <DHT.h>                   // Thư viện DHT

// Thông tin Wi-Fi
#define WLAN_SSID       "Q coffee_tea 1"   // Wi-Fi SSID
#define WLAN_PASS       "250ahoangdieu2"   // Wi-Fi Password

// Thông tin tài khoản Adafruit IO
#define AIO_USERNAME    "NHK"   // Adafruit IO Username
#define AIO_KEY         "aio_BYBh16FYwjjs1r5Ukl3WVA49zLqJ"   // Adafruit IO Key

// Kết nối Adafruit IO
AdafruitIO_WiFi io(AIO_USERNAME, AIO_KEY, WLAN_SSID, WLAN_PASS);

// Thiết lập chân và loại cảm biến DHT
#define DHTPIN 4       // Chân DATA của DHT11 nối với GPIO 4
#define DHTTYPE DHT11  // Sử dụng cảm biến DHT11
DHT dht(DHTPIN, DHTTYPE);

// Thiết lập LED
#define LED_PIN 2  // LED nối với GPIO 2
#define SOS_PIN 5  // LED SOS nối với GPIO 5
AdafruitIO_Feed *led_control = io.feed("LED"); // Feed điều khiển LED
AdafruitIO_Feed *sos_control = io.feed("SOS"); // Feed điều khiển LED SOS

// Thiết lập các feed cảm biến
AdafruitIO_Feed *temperature = io.feed("Temperature"); // Feed nhiệt độ
AdafruitIO_Feed *humidity = io.feed("Humidity");       // Feed độ ẩm

// Lưu trữ giá trị trước đó để kiểm tra thay đổi
float lastTemp = 0;
float lastHum = 0;

void setup() {
  // Khởi tạo Serial Monitor
  Serial.begin(115200);
  while (!Serial);

  // Khởi tạo chân LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW); // LED ban đầu tắt

  // Khởi tạo chân LED SOS
  pinMode(SOS_PIN, OUTPUT);
  digitalWrite(SOS_PIN, LOW); // LED SOS ban đầu tắt

  // Kết nối đến Adafruit IO
  Serial.print("Connecting to Adafruit IO");
  io.connect();

  // Chờ kết nối thành công
  while (io.status() < AIO_CONNECTED) {
    Serial.print(".");
    delay(500);
  }

  // Thông báo kết nối thành công
  Serial.println();
  Serial.println(io.statusText());

  // Đăng ký xử lý trạng thái từ feed điều khiển LED
  led_control->onMessage(handleLEDControl);
  led_control->get();

  // Đăng ký xử lý trạng thái từ feed điều khiển SOS LED
  sos_control->onMessage(handleSOSControl);
  sos_control->get();

  // Khởi động cảm biến DHT
  dht.begin();
}

void loop() {
  // Chạy Adafruit IO
  io.run();

  // Đọc dữ liệu từ cảm biến DHT
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  // Kiểm tra dữ liệu hợp lệ
  if (isnan(temp) || isnan(hum)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // Chỉ gửi dữ liệu khi có sự thay đổi đáng kể
  if (abs(temp - lastTemp) >= 0.5 || abs(hum - lastHum) >= 1) {
    temperature->save(temp); // Gửi nhiệt độ
    humidity->save(hum);     // Gửi độ ẩm

    // Lưu giá trị mới nhất
    lastTemp = temp;
    lastHum = hum;

    // Hiển thị dữ liệu lên Serial Monitor
    Serial.print("Temperature: ");
    Serial.print(temp);
    Serial.println(" °C");

    Serial.print("Humidity: ");
    Serial.print(hum);
    Serial.println(" %");
  }

  // Chờ 0.5 giây trước khi đọc lại
  delay(500);
}

// Xử lý trạng thái điều khiển LED
void handleLEDControl(AdafruitIO_Data *data) {
  Serial.print("LED Control received: ");
  Serial.println(data->toPinLevel() == HIGH ? "ON" : "OFF");
  digitalWrite(LED_PIN, data->toPinLevel());
}

// Xử lý trạng thái điều khiển SOS LED
void handleSOSControl(AdafruitIO_Data *data) {
  Serial.print("SOS LED Control received: ");
  Serial.println(data->toPinLevel() == HIGH ? "ON" : "OFF");
  digitalWrite(SOS_PIN, data->toPinLevel());
}
