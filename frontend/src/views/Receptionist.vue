<template>
  <div class="page">
    <div class="header">
      <div></div>

      <img
        :src="seuLogo"
        alt="Southeast University Logo"
        class="logo"
      />

      <button class="logout-button" @click="logout">
        Logout
      </button>
    </div>

    <h2>Receptionist Panel</h2>

    <p v-if="message" class="message">
      {{ message }}
    </p>

    <div
      v-for="res in reservations"
      :key="res.id"
      class="item"
    >
      <div class="card-header">
        <p class="res-title"><strong>Reservation #:</strong> {{ res.id }}</p>
        
        <button
          v-if="res.status !== 'cancelled'"
          :disabled="res.status !== 'paid'"
          class="cancel-reception-btn"
          @click="cancelReservation(res.id)"
        >
          Cancel
        </button>
      </div>

      <p><strong>User:</strong> {{ res.username }}</p>
      <p><strong>Room:</strong> {{ res.room_number }}</p>

      <p v-if="res.status !== 'cancelled'">
        <strong>Stay:</strong>
        {{ formatDate(res.check_in) }} → {{ formatDate(res.check_out) }}
      </p>

      <p v-else class="hint">
        Reservation cancelled — no stay dates
      </p>

      <p :class="['status', res.status]">
        <strong>Status:</strong> {{ res.status }}
      </p>

      <p v-if="res.status === 'paid'" class="hint">
        Waiting for guest check-in
      </p>

      <p v-else-if="res.status === 'checked_in'" class="hint">
        Guest currently staying
      </p>

      <p v-else-if="res.status === 'checked_out'" class="hint">
        Stay completed
      </p>

      <p>
        <strong>Room price:</strong>
        ¥{{ res.room_amount }}
      </p>

      <p>
        <strong>Extra services:</strong>
        ¥{{ res.services_amount }}
      </p>

      <p>
        <strong>Total:</strong>
        ¥{{ res.total }}
      </p>

      <div class="buttons">
        <button
          @click="checkin(res.id)"
          :disabled="res.status !== 'paid'"
        >
          Check-in
        </button>

        <button
          @click="checkout(res.id)"
          :disabled="res.status !== 'checked_in'"
        >
          Check-out
        </button>

        <button
          @click="addService(res.id, 'meal')"
          :disabled="res.status !== 'checked_in'"
        >
          Add Meal
        </button>

        <button
          @click="addService(res.id, 'laundry')"
          :disabled="res.status !== 'checked_in'"
        >
          Add Laundry
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { api } from "../api";
import seuLogo from "../assets/seu-logo.png";

export default {
  data() {
    return {
      reservations: [],
      message: "",
      seuLogo
    };
  },

  mounted() {
    this.loadReservations();
  },

  methods: {
    logout() {
      localStorage.removeItem("user");
      this.$router.push("/");
    },

    async loadReservations() {
      try {
        const res = await api.get("/reservations");
        this.reservations = res.data;
      } catch {
        this.message = "Failed to load reservations";
      }
    },

    async checkin(id) {
      try {
        await api.post(`/checkin/${id}`);
        this.message = `Reservation #${id} checked-in`;
        this.loadReservations();
      } catch (err) {
        this.message = err.response?.data?.message || "Check-in failed";
      }
    },

    async checkout(id) {
      try {
        await api.post(`/checkout/${id}`);
        this.message = `Reservation #${id} checked-out`;
        this.loadReservations();
      } catch (err) {
        this.message = err.response?.data?.message || "Check-out failed";
      }
    },

    async addService(id, type) {
      try {
        await api.post("/service", {
          reservation_id: id,
          type
        });

        this.message =
          type === "meal"
            ? "Meal added"
            : "Laundry added";

        this.loadReservations();
      } catch (err) {
        this.message =
          err.response?.data?.message || "Service not allowed";
      }
    },

    async cancelReservation(id) {
      try {
        await api.post(`/reservation/cancel/${id}`);
        this.message = `Reservation #${id} cancelled`;
        this.loadReservations();
      } catch (err) {
        this.message =
          err.response?.data?.message || "Cancellation not allowed";
      }
    },

    formatDate(dateStr) {
      return dateStr.split("T")[0];
    }
  }
};
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
}

.page h2 {
  text-align: center;
  margin: 20px 0 25px;
  color: #2e5e4e;
  letter-spacing: 1px;
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #e8f6f3;
  border-left: 4px solid #2e5e4e;
  color: #2e5e4e;
  font-weight: 600;
  border-radius: 4px;
}

.item {
  background-color: #fbfdfc;
  border: 1px solid #dcdcdc;
  padding: 18px;
  margin-bottom: 18px;
  border-radius: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(46, 94, 78, 0.15);
}

.item p {
  margin: 6px 0;
  color: #333;
}

.item strong {
  color: #2e5e4e;
}

.hint {
  font-size: 0.85em;
  color: #7f8c8d;
  font-style: italic;
}

.buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
}

.buttons button {
  padding: 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.buttons button:nth-child(1) {
  background-color: #f39c12;
  color: white;
}

.buttons button:nth-child(2) {
  background-color: #8e44ad;
  color: white;
}

.buttons button:nth-child(3),
.buttons button:nth-child(4) {
  background-color: #2e5e4e;
  color: white;
}

button:disabled {
  background-color: #bdc3c7 !important;
  cursor: not-allowed;
}

.buttons button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(46, 94, 78, 0.25);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.res-title {
  margin: 0 !important;
  font-size: 1.1rem;
  color: #2e5e4e;
}

.cancel-reception-btn {
  background-color: white;
  color: red;
  border: 1px solid red;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-reception-btn:hover:not(:disabled) {
  background-color: darkred;
  color: white;
}

.cancel-reception-btn:disabled {
  border-color: #e0e0e0;
  color: #b0b0b0;
  background-color: #f9f9f9;
  cursor: not-allowed;
  opacity: 0.8;
}
</style>