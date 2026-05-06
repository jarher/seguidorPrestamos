export const routes = {
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  borrowers: '/borrowers',
  borrowerProfile: '/borrowers/:id',
  loans: '/loans',
  loanDetails: '/loans/:id',
  reports: '/reports',
};

export const publicRoutes = [routes.login, routes.register];

export const protectedRoutes = [
  routes.dashboard,
  routes.borrowers,
  routes.borrowerProfile,
  routes.loans,
  routes.loanDetails,
  routes.reports,
];