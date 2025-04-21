// FIREBASE
// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import {
    getDatabase,
    ref,
    onValue,
    set,
    update
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js';

const firebaseConfig = {
    apiKey: 'AIzaSyAlohi4QVYTA4XYCD2surFbbaj7QRpAdQM',
    authDomain: 'tt-iot-53225.firebaseapp.com',
    databaseURL: 'https://tt-iot-53225-default-rtdb.firebaseio.com',
    projectId: 'tt-iot-53225',
    storageBucket: 'tt-iot-53225.appspot.com',
    messagingSenderId: '330672870777',
    appId: '1:330672870777:web:8e35905b50f75b80620ba8',
    measurementId: 'G-FE6Y7K2ZS8'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Real-time Clock Update
setInterval(() => {
    const now = new Date();
    let hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    document.getElementById('time').innerText = `${hours}:${minutes} ${ampm}`;
}, 1000);

let selectedArea = null; // Store the selected area

// Function to set the selected area when an area button is clicked
window.selectArea = function (area) {
    selectedArea = area;
    console.log('Selected Area:', selectedArea);

    // Update the lightButton appearance to show it's ready to control this area
    const lightButton = document.getElementById('lightButton');
    lightButton.style.cursor = 'pointer';
    lightButton.style.backgroundColor = 'gray'; // Reset to off color

    // Fetch the current light status for the selected area from Firebase
    onValue(ref(database, `parking/light/${selectedArea}`), (snapshot) => {
        const lightStatus = snapshot.val();
        lightButton.style.backgroundColor = lightStatus === 1 ? 'yellow' : 'gray';
    });
};

// Function to toggle the light for the selected area
window.toggleLight = function () {
    if (!selectedArea) {
        alert('Please select an area before toggling the light!');
        return; // Stop if no area is selected
    }

    const lightButton = document.getElementById('lightButton');
    const isOn = lightButton.style.backgroundColor === 'yellow';
    const lightStatus = isOn ? 0 : 1; // 1: ON, 0: OFF

    // Update Firebase for the selected area
    set(ref(database, `parking/light/${selectedArea}`), lightStatus)
        .then(() => {
            console.log(`Light status updated for ${selectedArea} in Firebase:`, lightStatus);
            // Update button appearance after successful Firebase update
            lightButton.style.backgroundColor = lightStatus === 1 ? 'yellow' : 'gray';
        })
        .catch((error) => {
            console.error(`Failed to update light status for ${selectedArea}:`, error);
        });
};

window.callSOS = function () {
    alert('SOS button clicked! Emergency services have been notified.');
};

// Hàm cập nhật giá trị nhiệt độ
function updateTemperature(temperature) {
    const temp = document.getElementById('temperature');
    if (temp) {
        temp.textContent = `${temperature}°C`;
    }
}

onValue(ref(database, 'parking/temperature'), (snapshot) => {
    const temperature = snapshot.val();
    if (temperature !== null) {
        updateTemperature(temperature);
    }
});

// Hàm cập nhật giá trị độ ẩm
function updateHumidity(humidity) {
    const temp = document.getElementById('humidity');
    if (temp) {
        temp.textContent = `${humidity}%`;
    }
}

onValue(ref(database, 'parking/humidity'), (snapshot) => {
    const humidity = snapshot.val();
    if (humidity !== null) {
        updateHumidity(humidity);
    }
});

// Mức phí cố định (ví dụ 100 VND/phút)
const FEE_PER_MINUTE = 100;

// Hàm cập nhật biển số xe
function updateLicensePlate(licensePlates) {
    const plateElement = document.getElementById('license-plate');
    if (plateElement) {
        plateElement.innerHTML = licensePlates; // Sử dụng innerHTML để hiển thị <br> cho dòng mới
    }
}

// Hàm cập nhật tổng tiền
function updateTotalFee(totalFee) {
    const feeElement = document.getElementById('total-fee');
    if (feeElement) {
        feeElement.innerHTML = totalFee; // Sử dụng innerHTML để hiển thị <br> cho dòng mới
    }
}

// Lấy dữ liệu từ Firebase và cập nhật biển số xe và tổng tiền
onValue(ref(database, 'cars'), (snapshot) => {
    const carsData = snapshot.val();
    if (carsData) {
        let licensePlates = '';
        let totalFee = '';

        for (const carId in carsData) {
            const car = carsData[carId];

            // Thêm carId vào danh sách biển số xe
            licensePlates += carId + '<br>';

            // Tính tiền cho từng xe dựa trên duration và thêm vào danh sách
            if (car.duration) {
                const fee = (car.duration * FEE_PER_MINUTE) / 60;
                totalFee += fee.toLocaleString() + ' VND<br>'; // Format số tiền với dấu phẩy và xuống dòng
            } else {
                totalFee += '<br>'; // Format số tiền với dấu phẩy và xuống dòng
            }
        }

        // Cập nhật biển số xe vào phần tử
        updateLicensePlate(licensePlates);

        // Cập nhật tổng tiền vào phần tử
        updateTotalFee(totalFee);
    }
});

// Xem số lượng xe còn trống
onValue(ref(database, 'parking/vehicle'), (snapshot) => {
    const vehicleData = snapshot.val();
    if (vehicleData) {
        let zeroCount = 0;

        // Đếm số lượng xe có giá trị bằng 0 trong vehicle
        for (const key in vehicleData) {
            if (vehicleData[key] === 0) {
                zeroCount++;
            }
        }

        // Cập nhật giá trị của vacant_spot trong Firebase
        update(ref(database, 'parking'), {
            vacant_spot: zeroCount
        });
    }
});

// Hàm lấy dữ liệu chỗ đỗ còn trống và hiển thị lên giao diện
function getAvailableSpots() {
    const availableSpotsRef = ref(database, 'parking/vacant_spot');
    onValue(availableSpotsRef, (snapshot) => {
        const availableSpots = snapshot.val();
        document.getElementById('available-spots').innerText = availableSpots;
    });
}
getAvailableSpots();

// CHART
// Dynamic chart to display real-time data updates

// Chart configuration
var options = {
    series: [
        {
            name: 'Occupied space',
            type: 'column',
            data: []
        },
        {
            name: 'Temperature',
            type: 'line',
            data: []
        }
    ],
    chart: {
        height: 350,
        type: 'line'
    },
    stroke: {
        width: [0, 4]
    },
    title: {
        text: 'Real-Time Parking Data'
    },
    dataLabels: {
        enabled: true,
        enabledOnSeries: [1]
    },
    xaxis: {
        type: 'category',
        categories: [] // Dynamic time labels
    },
    yaxis: [
        {
            title: {
                text: 'Occupied space'
            }
        },
        {
            opposite: true,
            title: {
                text: 'Temperature'
            }
        }
    ]
};

var chart = new ApexCharts(document.querySelector('#chart'), options);
chart.render();

// Variables to track real-time data
const maxDataPoints = 10; // Maximum number of data points to display
const timeSeries = [];
const occupiedSpaceData = [];
const temperatureData = [];

// Function to update the chart with new data
function updateChart(timeLabel, occupiedSpace, temperature) {
    // Push new data
    timeSeries.push(timeLabel);
    occupiedSpaceData.push(occupiedSpace);
    temperatureData.push(temperature);

    // Remove old data if exceeding maxDataPoints
    if (timeSeries.length > maxDataPoints) {
        timeSeries.shift();
        occupiedSpaceData.shift();
        temperatureData.shift();
    }

    // Update the chart options
    chart.updateOptions({
        xaxis: {
            categories: timeSeries
        },
        series: [
            { name: 'Occupied space', data: occupiedSpaceData },
            { name: 'Temperature', data: temperatureData }
        ]
    });
}

// Lắng nghe thay đổi trong Firebase
onValue(ref(database, 'parking'), (snapshot) => {
    const data = snapshot.val();

    if (data) {
        // Trích xuất dữ liệu từ Firebase
        const totalSpots = Object.keys(data.vehicle).length; // Tổng số chỗ đỗ
        const occupiedSpace = Object.values(data.vehicle).filter((value) => value === 1).length; // Đếm số lượng chỗ đỗ đã chiếm (giá trị = 1)
        const temperature = data.temperature || 0;

        // Lấy thời gian hiện tại
        const now = new Date();
        const dateLabel = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeLabel = now.toTimeString().split(' ')[0]; // HH:mm:ss
        const dateTimeLabel = `${dateLabel} ${timeLabel}`; // Kết hợp ngày và giờ

        // Cập nhật biểu đồ với dữ liệu mới
        updateChart(dateTimeLabel, occupiedSpace, temperature);
    }
});
