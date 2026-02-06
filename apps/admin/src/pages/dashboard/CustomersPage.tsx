// Customers Page - Shows users with role 'user' (customers)
import UsersPage from "./UsersPage";

export default function CustomersPage() {
  // This page reuses UsersPage but with customer-specific context
  // The filtering is done in the UsersPage component based on the route
  return <UsersPage />;
}
