const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        name: "vpn",
        path: "vpn",
        component: () => import("pages/vpnStatus.vue"),
      },
      {
        name: "ns",
        path: "ns",
        component: () => import("pages/nsStatus.vue"),
      },
    ],
  },
  //{ path: "/vpn", component: () => import("pages/vpnStatus.vue") },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
