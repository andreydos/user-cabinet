import Vue from 'vue';
import VueRouter from 'vue-router';
// https://github.com/declandewet/vue-meta
import VueMeta from 'vue-meta';
// Adds a loading bar at the top during page loads.
import NProgress from 'nprogress/nprogress';
import store from '@/store';
import routes from './routes';

Vue.use(VueRouter);
Vue.use(VueMeta);

const router = new VueRouter({
  mode: 'history',
  routes,
  // Simulate native-like scroll behavior when navigating to a new
  // route and using back/forward buttons.
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { x: 0, y: 0 };
  },
});

// Before each route evaluates...
// eslint-disable-next-line
router.beforeEach((routeTo, routeFrom, next) => {
  // Check if auth is required on this route
  // (including nested routes).
  const authRequired = routeTo.matched.some(route => route.meta.authRequired);

  // If auth isn't required for the route, just continue.
  if (!authRequired) return next();

  function redirectToLogin() {
    // Pass the original route to the login component
    next({ name: 'login', query: { redirectFrom: routeTo.fullPath } });
  }

  // If auth is required and the user is logged in...
  if (!store.getters['auth/loggedIn']) {
    // Validate the local user token...
    return store.dispatch('auth/validate').then((validUser) => {
      // Then continue if the token still represents a valid user,
      // otherwise redirect to login.
      if (validUser) {
        next();
      } else {
        redirectToLogin();
      }
    });
  }

  // If auth is required and the user is NOT currently logged in,
  // redirect to login.
  redirectToLogin();
});

// After navigation is confirmed, but before resolving...
router.beforeResolve((routeTo, routeFrom, next) => {
  // If this isn't an initial page load...
  if (routeFrom.name) {
    // Start the route progress bar.
    NProgress.start();
  }
  next();
});

// When each route is finished evaluating...
router.afterEach(() => {
  // Complete the animation of the route progress bar.
  NProgress.done();
});

export default router;
