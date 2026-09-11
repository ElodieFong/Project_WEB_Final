import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Rooms from "../views/Rooms.vue";
import Reservation from "../views/Reservation.vue";
import Payment from "../views/Payment.vue";
import MyReservations from "../views/MyReservations.vue";
import Receptionist from "../views/Receptionist.vue";
import AddRoom from "../views/AddRoom.vue";

const routes = [
  {
    path: "/",
    redirect: "/login"
  },

  {
    path: "/login",
    component: Login
  },

  // VISITOR ROUTES 
  {
    path: "/rooms",
    component: Rooms,
    meta: { role: "visitor" }
  },
  {
    path: "/reserve/:roomId",
    component: Reservation,
    meta: { role: "visitor" }
  },
  {
    path: "/payment",
    component: Payment,
    meta: { role: "visitor" }
  },
  {
    path: "/myreservations",
    component: MyReservations,
    meta: { role: "visitor" }
  },

  // RECEPTIONIST ROUTE
  {
    path: "/reception",
    component: Receptionist,
    meta: { role: "receptionist" }
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    if (to.path === "/login") {
      return next();
    }
    return next("/login");
  }

  if (to.meta?.role) {
    if (user.role !== to.meta.role) {
      return next(
        user.role === "visitor" ? "/rooms" : "/reception"
      );
    }
  }

  next();
});
