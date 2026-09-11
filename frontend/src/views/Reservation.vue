<template>
  <div class="page-container">
    <div class="card">
      
      <div v-if="!isLoading">
        <div class="actions-header">
          <button @click="goToRooms" class="back-btn">
            Return
          </button>
        </div>

        <div class="logo-container">
          <img :src="seuLogo" alt="Southeast University Logo" class="logo" />
        </div>

        <h2>Reservation Summary</h2>

        <div class="summary-box">
          <div class="summary-item">
            <span class="label">Room ID:</span>
            <span class="value">{{ roomId }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Check-in:</span>
            <span class="value">{{ checkIn }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Check-out:</span>
            <span class="value">{{ checkOut }}</span>
          </div>
          <div class="summary-item">
            <span class="label">{{ nightsLabel }}:</span>
            <span class="value">{{ nights }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Price / night:</span>
            <span class="value">¥{{ price }}</span>
          </div>

          <div class="total-highlighter">
            <h3>Total to pay:</h3>
            <span class="total-amount">¥{{ total }}</span>
          </div>
        </div>

        <button class="confirm-btn" @click="confirmReservation">
          Go to Payment
        </button>
      </div>

      <div v-else class="loading-state">
        <div class="logo-container">
          <img :src="seuLogo" alt="Southeast University Logo" class="logo animate-pulse" />
        </div>
        
        <div class="spinner"></div>
        
        <h3>Preparing Payment...</h3>
        <p>Redirecting to secure gateway.</p>
      </div>

    </div>
  </div>
</template>

<script setup>
// Displays reservation summary before redirecting to payment
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api";
import seuLogo from "../assets/seu-logo.png";

const route = useRoute();
const useRouterHook = useRouter();

const roomId = route.params.roomId;
const price = Number(route.query.price);
const checkIn = route.query.check_in;
const checkOut = route.query.check_out;

const isLoading = ref(false);

// Returns user to room selection while preserving selected dates
function goToRooms() {
  sessionStorage.setItem("restoreRooms", "true");
  useRouterHook.push({
    path: "/rooms",
    query: {
      check_in: checkIn,
      check_out: checkOut
    }
  });
}

// Calculates number of nights for the reservation
const nights = computed(() => {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  return Math.max(
    0,
    (outDate - inDate) / (1000 * 60 * 60 * 24)
  );
});

const nightsLabel = computed(() =>
  nights.value === 1 ? "Night" : "Nights"
);

// Computes total reservation price
const total = computed(() => nights.value * price);

// Redirects user to secure payment page
function confirmReservation() {
  isLoading.value = true;

  setTimeout(() => {
    useRouterHook.push({
      path: "/payment",
      query: {
        room_id: roomId,
        check_in: checkIn,
        check_out: checkOut,
        amount: total.value
      }
    });
  }, 1000);
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f6f4f9;
  padding: 20px;
  font-family: "Segoe UI", Helvetica, Arial, sans-serif;
}

.card {
  width: 100%;
  max-width: 480px;
  background-color: #ffffff;
  padding: 30px 25px;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  border-top: 6px solid #eebf3b;
  min-height: 500px; 
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.actions-header {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 10px;
}

.back-btn {
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  background-color: #f2f4f3;
  color: #2e5e4e;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #e6e8e7;
}

.logo-container {
  text-align: center;
  margin-bottom: 15px;
}

.logo {
  width: 90px;
  height: auto;
  display: block;
  margin: 0 auto;
}

h2 {
  text-align: center;
  margin: 0 0 25px 0;
  color: #2e5e4e;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 1.4rem;
}

.summary-box {
  background-color: #fbfdfc;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 25px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 15px;
  color: #333;
}

.label {
  font-weight: 600;
  color: #2e5e4e;
}

.total-highlighter {
  margin-top: 20px;
  background-color: #eebf3b;
  padding: 15px 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #2e5e4e;
  box-shadow: 0 4px 10px rgba(238, 191, 59, 0.2);
}

.total-highlighter h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
}

.total-amount {
  font-size: 1.4rem;
  font-weight: 800;
}

.confirm-btn {
  width: 100%;
  padding: 15px;
  background-color: #2e5e4e;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.confirm-btn:hover {
  background-color: #eebf3b;
  color: #2e5e4e;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(238, 191, 59, 0.3);
}

.confirm-btn:active {
  transform: translateY(0);
}


.loading-state {
  text-align: center;
  animation: fadeIn 0.5s ease;
  padding: 40px 0;
}

.loading-state h3 {
  color: #2e5e4e;
  margin-top: 25px;
  font-size: 1.2rem;
  font-weight: 700;
}

.loading-state p {
  color: #666;
  font-size: 0.95rem;
  margin-top: 5px;
}

.spinner {
  width: 55px;
  height: 55px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #eebf3b; 
  border-right: 5px solid #2e5e4e; 
  border-radius: 50%;
  margin: 25px auto;
  animation: spin 1s linear infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .8; transform: scale(0.95); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>