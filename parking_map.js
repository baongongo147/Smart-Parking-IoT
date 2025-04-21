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

// Reference to the vehicle slots in the database
const vehicleRef = ref(database, 'parking/vehicle');

// Hàm để cập nhật cho chỗ để xe có người hay không
function updateSlotColor(slotId, value) {
    //document.getElementById() tìm kiếm phần tử HTML có id trùng với slotId và gán nó vào slotElement.
    const slotElement = document.getElementById(slotId);

    if (slotElement) {
        // Nếu tồn tại id thì làm
        if (value === 1) {
            slotElement.style.backgroundColor = 'red'; // Có người đỗ
        } else if (value === 0) {
            slotElement.style.backgroundColor = 'green'; // còn trống
        }
    }
}
// Listen for changes in vehicle data and update slot colors

// onValue để lắng nghe dữ liệu từ Firebase và đối tượng ở đây là vehicleRef một tham chiếu đến parking/vehicle
// (snapshot) => { ... } là một hàm callback nhận tham số snapshot chứa dữ liệu hiện tại của vehicleRef.
onValue(vehicleRef, (snapshot) => {
    // Lấy giá trị { A1: 0, A2: 1, ... } gắn vào vehicleData
    const vehicleData = snapshot.val();

    if (vehicleData) {
        // Object.keys(vehicleData) lấy tất cả các key trong vehicleData dưới dạng một mảng["A1", "A2", "A3", ... "B5"]
        // .forEach((slotId) => { ... }) sẽ lặp qua từng phần tử của mảng này và mỗi lần lặp, slotId sẽ nhận giá trị tương ứng với phần tử hiện tại trong mảng
        Object.keys(vehicleData).forEach((slotId) => {
            updateSlotColor(slotId, vehicleData[slotId]);
        });
    }
});
