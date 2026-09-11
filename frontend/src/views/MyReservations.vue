<template>
  <div class="page">

    <div class="header">
      <button @click="goToRooms" class="back-btn">
        Back to rooms
      </button>

      <img
        :src="seuLogo"
        alt="Southeast University Logo"
        class="logo"
      />

      <button class="logout-button" @click="logout">
        Logout
      </button>
    </div>

    <h2>My Reservations</h2>

    <div v-if="loading">Loading...</div>

    <div v-else>
      <p v-if="reservations.length === 0">
        No paid reservations found.
      </p>

      <ul v-else class="list">
        <li
          v-for="res in reservations"
          :key="res.id"
          class="item"
        >

          <p><strong>Room:</strong> {{ res.room_number }}</p>

          <p :class="['status', res.status]">
            <strong>Status:</strong> {{ res.status }}
          </p>

          <p>
            <strong>Paid at:</strong>
            {{ formatDate(res.created_at) }}
          </p>

          <p class="stay">
            <strong>Stay:</strong>
            {{ formatDate(res.check_in) }}
            →
            {{ formatDate(res.check_out) }}
            ({{ nights(res) }} {{ nights(res) === 1 ? "night" : "nights" }})
          </p>

          <p v-if="res.status === 'checked_out'">
            <strong>Check-out completed</strong>
          </p>

          <p v-else class="hint">
            Check-out not completed yet.
          </p>

          <p>
            <strong>Room price:</strong>
            ¥{{ res.room_amount }}
          </p>

          <p>
            <strong>Extra services:</strong>
            ¥{{ res.services_amount }}
          </p>

          <ul v-if="services[res.id]?.length">
            <li
              v-for="s in services[res.id]"
              :key="s.id"
            >
              {{ s.type }} : ¥{{ s.price }}
            </li>
          </ul>

          <p><strong>Total:</strong> ¥{{ res.total }}</p>

          <p v-if="res.services_amount > 0" class="hint">
            Extra services will be paid at checkout.
          </p>

          <button
            v-if="res.status === 'paid' && getRemainingTime(res.check_in)"
            @click="cancel(res.id)"
            class="cancel-btn"
          >
            Cancel ({{ getRemainingTime(res.check_in) }})
          </button>

          <p
            v-else-if="res.status === 'paid'"
            class="cancel-reason"
          >
            Cancellation period expired.
          </p>

          <p
            v-else-if="res.status === 'checked_in'"
            class="cancel-reason"
          >
            You have checked in — cancellation is no longer possible.
          </p>

          <p
            v-else-if="res.status === 'checked_out'"
            class="hint"
          >
            Stay completed.
          </p>

          <p
            v-else-if="res.status === 'cancelled'"
            class="hint"
          >
            Reservation cancelled.
          </p>

        </li>
      </ul>

      <div class="page-footer">
        * Cancellations are allowed up to 24 hours before the check-in time.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "../api";
import { useRouter } from "vue-router";
import seuLogo from "../assets/seu-logo.png";

const router = useRouter();
const reservations = ref([]);
const loading = ref(true);
const services = ref({});


// Date helper functions (UTC-safe)
function dateOnly(str) {
  return String(str).slice(0, 10);
}

function formatDate(dateStr) {
  return dateOnly(dateStr);
}

// Computes the number of nights between check-in and check-out
function nights(res) {
  const [y1, m1, d1] = dateOnly(res.check_in).split("-").map(Number);
  const [y2, m2, d2] = dateOnly(res.check_out).split("-").map(Number);

  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);

  return Math.max(0, (t2 - t1) / (1000 * 60 * 60 * 24));
}

function logout() {
  localStorage.removeItem("user");
  router.push("/");
}

function goToRooms() {
  sessionStorage.setItem("restoreRooms", "true");

  if (reservations.value.length > 0) {
    const r = reservations.value[0];

    router.push({
      path: "/rooms",
      query: {
        check_in: dateOnly(r.check_in),
        check_out: dateOnly(r.check_out)
      }
    });
  } else {
    router.push("/rooms");
  }
}

const CANCEL_LIMIT_HOURS = 24;

// Returns remaining cancellation time before check-in (check-in at 12:00)
function getRemainingTime(checkInStr) {
  if (!checkInStr) return null;

  const checkInDate = new Date(`${dateOnly(checkInStr)}T12:00:00`);
  const cancelDeadline = new Date(
    checkInDate.getTime() - CANCEL_LIMIT_HOURS * 60 * 60 * 1000
  );

  const diffMs = cancelDeadline - new Date();
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m left`;
  }

  return `${hours}h ${minutes}m left`;
}

// Cancels a paid reservation if within the allowed cancellation period
async function cancel(id) {
  try {
    await api.post(`/reservation/cancel/${id}`);
    await loadReservations();
  } catch (err) {
    alert(err.response?.data?.message || "Cancellation failed");
  }
}

// Loads extra services associated with a reservation
async function loadServices(reservationId) {
  try {
    const res = await api.get(`/reservation/${reservationId}/services`);
    services.value[reservationId] = res.data;
  } catch {
    services.value[reservationId] = [];
  }
}

async function loadReservations() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const res = await api.get(`/reservations/user/${user.id}/details`);
  reservations.value = res.data;

  for (const r of reservations.value) {
    if (r.services_amount > 0) {
      loadServices(r.id);
    }
  }
}

// Loads user reservations with totals and related services on page load
onMounted(async () => {
  try {
    await loadReservations();
  } finally {
    loading.value = false;
  }
});
</script>

<style>
.page {
  max-width: 720px;
  margin: 60px auto;
  background-color: #ffffff;
  padding: 30px 28px 40px;
  border-radius: 14px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  border-top: 6px solid #eebf3b;
}

.header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: 20px;
}

.back-btn {
  justify-self: start;
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

.logo {
  width: 80px;
  justify-self: center;
}

.logout-button {
  justify-self: end;
  background-color: red;
  color: white;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}

.logout-button:hover {
  background-color: darkred;
}

.page h2 {
  text-align: center;
  margin: 20px 0 25px;
  color: #2e5e4e;
  letter-spacing: 1px;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.item {
  width: 100%;
  max-width: 660px;
  margin: 0 auto 18px auto;
  background-color: #fbfdfc;
  border: 1px solid #dcdcdc;
  padding: 20px;
  border-radius: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(46, 94, 78, 0.15);
  border-color: #2e5e4e;
}

.item p {
  margin: 8px 0;
  color: #333;
  line-height: 1.5;
}

.item strong {
  color: #2e5e4e;
  font-weight: 600;
}

.status {
  font-weight: 600;
  text-transform: capitalize;
  display: inline-block;
}

.status::before {
  content: "● ";
  margin-right: 4px;
}

.status.paid { color: #f39c12; }
.status.checked_in { color: #27ae60; }
.status.checked_out { color: #7f8c8d; }

.hint {
  margin-top: 6px;
  font-size: 0.9em;
  color: #7f8c8d;
  font-style: italic;
}

.cancel-btn {
  width: 100%;
  margin-top: 15px;
  padding: 10px 14px;
  cursor: pointer;
  background-color: #fff;
  color: red;
  border: 1px solid red;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: darkred;
  color: white;
}

.item .cancel-reason {
  margin-top: 15px;
  color: red;
  font-style: italic;
  font-size: 0.9em;
  background-color: #fdecea;
  padding: 10px;
  border-radius: 6px;
}

.stay {
  margin-top: 4px;
}

.page-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eaeaea;
  text-align: center;
  color: #888;
  font-size: 0.9rem;
  font-style: italic;
}
</style>