import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/courts")({
  component: CourtsLayout,
});

function CourtsLayout() {
  return <Outlet />;
}