import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../lib/api", () => ({
  api: { get: vi.fn() },
}));

import { api } from "../lib/api";
import { Health } from "./Health";

const PAYLOAD = {
  status: 'ok',
  timestamp: '2026-08-02T00:00:00.000Z',
  environment: 'development',
  urls: {
    frontend: 'http://frontend.example.com',
    backend: 'http://backend.example.com',
    database: 'postgresql://dbhost:5432/bookkeeping',
  },
};

function renderHealth() {
  return render(
    <MemoryRouter>
      <Health />
    </MemoryRouter>,
  );
}

describe("Health page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading state while the health request is in flight", () => {
    (api.get as Mock).mockReturnValue(new Promise(() => {}));

    renderHealth();

    expect(screen.getByLabelText(/checking services/i)).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/health");
  });

  it("renders the environment, frontend, backend, and database URLs on success", async () => {
    (api.get as Mock).mockResolvedValue({ data: PAYLOAD });

    renderHealth();

    expect(
      await screen.findByText("http://backend.example.com"),
    ).toBeInTheDocument();
    expect(screen.getByText("http://frontend.example.com")).toBeInTheDocument();
    expect(
      screen.getByText("postgresql://dbhost:5432/bookkeeping"),
    ).toBeInTheDocument();
    expect(screen.getByText("development")).toBeInTheDocument();
    expect(screen.getByText(/healthy/i)).toBeInTheDocument();
  });

  it("shows a degraded badge when the database ping fails", async () => {
    (api.get as Mock).mockResolvedValue({
      data: { ...PAYLOAD, status: "degraded" },
    });

    renderHealth();

    expect(await screen.findByText(/degraded/i)).toBeInTheDocument();
  });

  it("shows an error state and recovers on retry", async () => {
    (api.get as Mock)
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({ data: PAYLOAD });

    renderHealth();

    expect(await screen.findByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(
      await screen.findByText("http://backend.example.com"),
    ).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
