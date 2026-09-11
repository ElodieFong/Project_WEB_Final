<template>
  <div class="page-container">
    <div class="card">
      
      <div v-if="!processing && !isReturning">
        <div class="actions-header">
          <button @click="goToReservation" class="back-btn">
            Return
          </button>
        </div>

        <div class="logo-container">
          <img :src="seuLogo" alt="Southeast University Logo" class="logo" />
        </div>

        <h2>Secure Payment</h2>

        <div class="payment-content">
          <p class="instruction">Please review the amount before proceeding.</p>

          <div class="total-highlighter">
            <h3>Total Amount:</h3>
            <span class="total-amount">¥{{ formatPrice(amount) }}</span>
          </div>

          <button @click="pay" class="pay-btn">
            Pay Now
          </button>

          <p v-if="error" class="error">
            {{ error }}
          </p>
        </div>
      </div>

      <div v-else class="loading-state">
        <div class="logo-container">
          <img :src="seuLogo" alt="Southeast University Logo" class="logo animate-pulse" />
        </div>
        
        <div class="spinner"></div>
        
        <h3 v-if="isReturning">Returning...</h3>
        <h3 v-else>Processing Payment...</h3>

        <p v-if="isReturning">Please wait.</p>
        <p v-else>Please do not close this window.</p>
      </div>

    </div>
  </div>
</template>

<script setup>
// Handles reservation payment process and confirmation
import { ref, onMounted } from "vue";
import { api } from "../api";
import { useRoute, useRouter } from "vue-router";
import seuLogo from "../assets/seu-logo.png";

const route = useRoute();
const router = useRouter();

const roomId = route.query.room_id;
const checkIn = route.query.check_in;
const checkOut = route.query.check_out;
const amount = ref(route.query.amount || 0);
const error = ref("");

const processing = ref(false);
const isReturning = ref(false);

// Formats the payment amount for display
function formatPrice(price) {
  return Number(price).toLocaleString("fr-FR");
}

// Sends payment request and creates a paid reservation
async function pay() {
  error.value = "";
  processing.value = true;

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    processing.value = false;
    error.value = "Not logged in";
    return;
  }

  try {
    await api.post("/reservation/pay", {
      user_id: user.id,
      room_id: roomId,
      check_in: checkIn,
      check_out: checkOut,
      amount: amount.value
    });

    setTimeout(() => {
      router.push("/myreservations");
    }, 2000);

  } catch (err) {
    processing.value = false;
    error.value = err.response?.data?.message || "Payment failed";
  }
}

function goToReservation() {
  if (processing.value || isReturning.value) return;

  isReturning.value = true; 

  setTimeout(() => {
    router.back();
  }, 600); 
}

// Restores payment amount from route parameters
onMounted(() => {
  if (!amount.value) amount.value = route.query.amount;
});
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
  max-width: 420px;
  background-color: #ffffff;
  padding: 30px 25px;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  border-top: 6px solid #eebf3b;
  min-height: 400px;
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
  margin: 0 0 10px 0;
  color: #2e5e4e;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 1.4rem;
}

.instruction {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-bottom: 25px;
}

.payment-content {
  margin-top: 20px;
}

.total-highlighter {
  background-color: #eebf3b;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #2e5e4e;
  box-shadow: 0 4px 10px rgba(238, 191, 59, 0.2);
  margin-bottom: 25px;
}

.total-highlighter h3 {
  margin: 0 0 5px 0;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.9;
}

.total-amount {
  font-size: 2rem;
  font-weight: 800;
}

.pay-btn {
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

.pay-btn:hover {
  background-color: #eebf3b;
  color: #2e5e4e;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(238, 191, 59, 0.3);
}

.error {
  margin-top: 20px;
  color: #d32f2f;
  background-color: #ffebee;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #ffcdd2;
}

.loading-state {
  text-align: center;
  animation: fadeIn 0.5s ease;
}

.loading-state h3 {
  color: #2e5e4e;
  margin-top: 20px;
}

.loading-state p {
  color: #666;
  font-size: 0.9rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #eebf3b;
  border-right: 5px solid #2e5e4e;
  border-radius: 50%;
  margin: 20px auto;
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