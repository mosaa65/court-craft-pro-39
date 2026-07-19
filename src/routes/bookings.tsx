import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/bookings")({
  component: BookingsLayout,
});

function BookingsLayout() {
  return <Outlet />;
}