<template>
<div class="header">
      <div class="brand">
        <img :src="seuLogo" alt="SEU Logo" class="logo-small" />
        <h2>Select Dates</h2>
      </div>

      <div class="actions">
        <button class="nav-btn" @click="goToMyReservations">
          My Reservations
        </button>

        <button class="logout-button" @click="logout">
          Logout
        </button>
      </div>
    </div>

    <div v-if="user" class="user-info">
      Hello <strong>{{ user.username }},</strong>
    </div>

    <p>
      Please select dates to see available rooms.
    </p>

    <div class="date-box">
        <div class="date-field">
        <label>Arrival date</label>
        <input
            type="date"
            v-model="checkIn"
            :min="todayStr"

        />
        </div>

        <div class="date-field">
            <label>Departure date</label>
            <input
                type="date"
                ref="checkOutInput"
                v-model="checkOut"
                :min="minCheckOut"
                @change="closeCalendar"
            />
        </div>

      <button
        @click="loadRooms"
        :disabled="!!dateError || !checkIn || !checkOut || isSearching"
      >
        <span v-if="!isSearching">Search</span>
        <span v-else>Searching…</span>
      </button>
    </div>
    <div class="policy-info">
      <div class="policy-text">
        <div>Check-in starts at <strong>14:00</strong> on the arrival day.</div>
        <div>Check-out is before <strong>12:00</strong> on the departure day.</div>
      </div>
    </div>
    <p v-if="dateError" class="date-error">
      {{ dateError }}
    </p>

    <p v-if="dateError" class="date-error">
      {{ dateError }}
    </p>


    <p v-if="hasSearched && rooms.length === 0 && !dateError" class="empty">
      No rooms available for selected dates.
    </p>

    <div class="room-list" v-if="hasSearched && !dateError">
      <div
        v-for="room in rooms"
        :key="room.id"
        class="room-card"
        :class="{ unavailable: !room.available }"
      >
        <h3>Room {{ room.room_number }}</h3>

        <p><strong>Price / night:</strong> ¥{{ formatPrice(room.price) }}</p>

        <p v-if="room.available"><strong>Number of nights:</strong> {{ nights }}</p>

        <p v-if="nights > 0 && room.available" class="total">
            <strong>Total:</strong> ¥{{ formatPrice(room.price * nights) }}
        </p>

        <p v-if="!room.available" class="not-available">
          Not available for selected dates.
        </p>

        <button
          v-if="room.available"
          @click="reserve(room)"
        >
          Reserve
        </button>
      </div>
    </div>
    <div v-if="isReserving || isSearching" class="loading-overlay">
      <div class="spinner"></div>
      <p v-if="isReserving">Preparing reservation...</p>
      <p v-else>Searching available rooms...</p>
    </div>
</template>

<script setup>
// Handles room availability search and reservation flow
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { api } from "../api";
import { useRouter, useRoute } from "vue-router";
import seuLogo from "../assets/seu-logo.png";

const router = useRouter();
const route = useRoute();

const user = JSON.parse(localStorage.getItem("user"));

const checkIn = ref("");
const checkOut = ref("");
const rooms = ref([]);
const hasSearched = ref(false);
const checkOutInput = ref(null);
const isReserving = ref(false);
const isSearching = ref(false);

// Current date formatted as YYYY-MM-DD
const todayStr = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
});

// Computes the minimum allowed check-out date (check-in + 1 day)
const minCheckOut = computed(() => {
  if (!checkIn.value) return todayStr.value;

  const [y, m, d] = checkIn.value.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d + 1);
  const next = new Date(t);

  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
});

if (route.query.check_in) checkIn.value = route.query.check_in;
if (route.query.check_out) checkOut.value = route.query.check_out;

const dateError = computed(() => {
  if (!checkIn.value || !checkOut.value) return "";

  if (checkIn.value < todayStr.value)
    return "Check-in date cannot be in the past.";

  if (checkOut.value <= checkIn.value)
    return "Check-out must be after check-in.";

  return "";
});

onMounted(() => {
  if (
    sessionStorage.getItem("restoreRooms") === "true" &&
    checkIn.value &&
    checkOut.value
  ) {
    loadRooms();
    hasSearched.value = true;
    sessionStorage.removeItem("restoreRooms");
  }
});

// Automatically adjusts check-out date when check-in changes
  watch(checkIn, async (newCheckIn) => {
    rooms.value = [];
    hasSearched.value = false;

    if (!newCheckIn) {
      checkOut.value = "";
      return;
    }

    if (!checkOut.value) {
      checkOut.value = minCheckOut.value;
    }

    else if (checkOut.value <= newCheckIn) {
      checkOut.value = minCheckOut.value;
    }

    await nextTick();
    checkOutInput.value?.focus();
  });

// Fetches available rooms for the selected dates
async function loadRooms() {
  if (dateError.value) return;

  isSearching.value = true;
  rooms.value = [];
  hasSearched.value = false;

  try {
    const [res] = await Promise.all([
      api.get("/rooms/availability", {
        params: {
          check_in: checkIn.value,
          check_out: checkOut.value
        }
      }),
      new Promise(resolve => setTimeout(resolve, 200))
    ]);

    rooms.value = res.data;
    hasSearched.value = true;
  } finally {
    isSearching.value = false;
  }
}

function closeCalendar() {
  checkOutInput.value?.blur();
}

function logout() {
  localStorage.removeItem("user");
  router.push("/");
}

function goToMyReservations() {
  router.push("/myreservations");
}

// Computes number of nights between check-in and check-out
const nights = computed(() => {
  if (!checkIn.value || !checkOut.value) return 0;

  const [y1, m1, d1] = checkIn.value.split("-").map(Number);
  const [y2, m2, d2] = checkOut.value.split("-").map(Number);

  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);

  return Math.max(0, (t2 - t1) / (1000 * 60 * 60 * 24));
});

// Redirects user to reservation summary page
function reserve(room) {
  isReserving.value = true;

  setTimeout(() => {
    sessionStorage.setItem("restoreRooms", "true");

    router.push({
      path: `/reserve/${room.id}`,
      query: {
        price: room.price,
        check_in: checkIn.value,
        check_out: checkOut.value
      }
    });
  }, 500);
}

// Formats price for display using locale settings
function formatPrice(price) {
  return Number(price).toLocaleString("fr-FR");
}
</script>

<style>
.rooms-page {
  max-width: 960px;
  margin: 40px auto;
  font-family: "Segoe UI", Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  border-top: 6px solid #eebf3b;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo-small {
  width: 50px;
  height: auto;
}

.header h2 {
  margin: 0;
  color: #2e5e4e; 
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 1.5rem;
}


.actions {
  display: flex;
  gap: 15px;
}

.actions button {
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
}

.nav-btn {
  background-color: #2e5e4e;
  color: white;
  border: 1px solid #2e5e4e;
}

.nav-btn:hover {
  background-color: #eebf3b;
  color: #2e5e4e;
  border-color: #eebf3b;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(238, 191, 59, 0.25);
}

.logout-button {
  background-color: transparent;
  color: red;
  border: 1px solid red;
}

.logout-button:hover {
  background-color: darkred;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(198, 40, 40, 0.2);
}

.user-info {
  margin-bottom: 10px;
  font-size: 1.1rem;
  color: #333;
}

.user-info strong {
  color: #2e5e4e;
}

.date-box {
  display: flex;
  align-items: flex-end; 
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 30px;
  background-color: #f9fdfb;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.date-field {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.date-field label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
}

input[type="date"] {
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.3s;
}

input[type="date"]:focus {
  outline: none;
  border-color: #2e5e4e;
  box-shadow: 0 0 0 3px rgba(238, 191, 59, 0.2);
}

.date-box button {
  padding: 12px 25px;
  background-color: #2e5e4e;
  color: white;
  font-weight: bold;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  height: 46px; 
  transition: all 0.3s;
}

.date-box button:hover:not(:disabled) {
  background-color: #eebf3b;
  color: #2e5e4e;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(238, 191, 59, 0.3);
}

.date-box button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.date-error {
  color: red;
  background-color: #ffebee;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: inline-block;
}

.empty {
  font-style: italic;
  color: #666;
  text-align: center;
  margin-top: 30px;
}

.room-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 25px;
}

.room-card {
  background: white;
  border: 1px solid #eee;
  padding: 25px;
  border-radius: 10px;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
}

.room-card:not(.unavailable):hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
  border-color: #eebf3b;
}

.room-card h3 {
  margin-top: 0;
  color: #2e5e4e;
  font-size: 1.4rem;
  border-bottom: 2px solid #eebf3b;
  padding-bottom: 10px;
  display: inline-block;
}

.room-card p:not(.not-available) {
  margin: 8px 0;
  color: #555;
  font-size: 0.95rem;
}

.room-card strong {
  color: #333;
}

.total {
  margin-top: 10px;
  background-color: #fff8e1; 
  color: #2e5e4e;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 4px solid #eebf3b;
}

.room-card.unavailable {
  opacity: 0.6;
  background-color: #f9f9f9;
  cursor: not-allowed; 
}

.not-available {
  color: red;
  font-weight: 600;
}

.room-card button {
  margin-top: auto; 
  width: 100%;
  padding: 10px;
  background-color: #fff;
  border: 2px solid #2e5e4e;
  color: #2e5e4e;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  font-size: 0.9rem;
}

.room-card button:hover {
  background-color: #2e5e4e;
  color: white;
}

.policy-info {
  margin-top: 20px;
  margin-bottom: 20px;
  background-color: #f0f7f4;
  color: #2e5e4e;
  padding: 12px 15px;
  border-radius: 6px;
  font-size: 0.9rem;
  border-left: 4px solid #2e5e4e;
}

.policy-text {
  display: flex;
  flex-direction: column;
  gap: 5px;
  line-height: 1.3;
}

.policy-info strong {
  font-weight: 700;
  color: #2e5e4e;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.loading-overlay p {
  margin-top: 20px;
  font-size: 1.2rem;
  color: #2e5e4e;
  font-weight: bold;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #eebf3b;
  border-right: 5px solid #2e5e4e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>