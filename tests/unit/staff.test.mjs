import { describe, it } from "node:test";
import assert from "node:assert/strict";

function getStaffInitials(nameOrEmail) {
  const trimmed = (nameOrEmail || "ST").trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function calculateStaffMetrics(members) {
  const total = members.length;
  const admins = members.filter((m) => m.role === "admin").length;
  const staff = members.filter((m) => m.role === "staff").length;
  return { total, admins, staff };
}

function reconcileStaffMembers(profiles, authUsers) {
  const userMap = new Map();
  for (const u of authUsers || []) {
    const email = u.email?.toLowerCase() || "";
    const role =
      u.user_metadata?.role ||
      (email.startsWith("admin@") ? "admin" : email.startsWith("staff@") ? "staff" : undefined);
    if (role === "admin" || role === "staff") {
      userMap.set(u.id, {
        id: u.id,
        email: u.email,
        fullName: u.user_metadata?.full_name,
        role,
        createdAt: u.created_at,
      });
    }
  }

  const seenIds = new Set();
  const seenEmails = new Set();
  const result = [];

  for (const p of profiles || []) {
    seenIds.add(p.id);
    if (p.email) seenEmails.add(p.email.toLowerCase());
    const authUser = userMap.get(p.id);

    let name = p.full_name?.trim() || null;
    if (!name || name.toLowerCase() === "admin" || name.toLowerCase() === "staff") {
      if (authUser?.fullName) {
        name = authUser.fullName;
      } else if (p.role === "admin" || p.email?.toLowerCase().startsWith("admin@")) {
        name = "System Administrator";
      } else if (p.role === "staff") {
        name = "Staff Operator";
      }
    }

    result.push({
      id: p.id,
      email: p.email || authUser?.email,
      fullName: name,
      role: p.role,
      createdAt: p.created_at || authUser?.createdAt,
    });
  }

  for (const [id, u] of Array.from(userMap.entries())) {
    if (!seenIds.has(id) && u.email && !seenEmails.has(u.email.toLowerCase())) {
      const name =
        u.fullName || (u.role === "admin" ? "System Administrator" : "Staff Operator");
      result.push({
        id,
        email: u.email,
        fullName: name,
        role: u.role,
        createdAt: u.createdAt,
      });
    }
  }

  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

describe("Staff Management & Personnel Directory", () => {
  it("accurately extracts initials for single-word, multi-word, and emails", () => {
    assert.equal(getStaffInitials("Lenna"), "LE");
    assert.equal(getStaffInitials("System Administrator"), "SA");
    assert.equal(getStaffInitials("Admin User"), "AU");
    assert.equal(getStaffInitials("Staff Operator"), "SO");
    assert.equal(getStaffInitials("staff@subscriptiq.com"), "ST");
  });

  it("calculates team metrics breakdown correctly", () => {
    const list = [
      { id: "1", role: "admin" },
      { id: "2", role: "staff" },
      { id: "3", role: "staff" },
    ];
    const metrics = calculateStaffMetrics(list);
    assert.equal(metrics.total, 3);
    assert.equal(metrics.admins, 1);
    assert.equal(metrics.staff, 2);
  });

  it("reconciles profiles and auth users without duplicating or dropping accounts", () => {
    const profiles = [
      {
        id: "p1",
        email: "admin@subscriptiq.com",
        full_name: "Admin",
        role: "admin",
        created_at: "2026-10-31T05:00:00Z",
      },
      {
        id: "p2",
        email: "leena@gmail.com",
        full_name: "Lenna",
        role: "staff",
        created_at: "2026-10-31T11:00:00Z",
      },
    ];

    const authUsers = [
      {
        id: "p1",
        email: "admin@subscriptiq.com",
        user_metadata: { full_name: "Admin User", role: "admin" },
        created_at: "2026-10-31T05:00:00Z",
      },
      {
        id: "p2",
        email: "leena@gmail.com",
        user_metadata: { full_name: "Lenna", role: "staff" },
        created_at: "2026-10-31T11:00:00Z",
      },
      {
        id: "p3",
        email: "staff@subscriptiq.com",
        user_metadata: { role: "staff" },
        created_at: "2026-10-31T06:00:00Z",
      },
    ];

    const reconciled = reconcileStaffMembers(profiles, authUsers);
    assert.equal(reconciled.length, 3);

    // Verify ordering is descending by creation date
    assert.equal(reconciled[0].id, "p2"); // 11:00
    assert.equal(reconciled[1].id, "p3"); // 06:00 (reconciled from Auth)
    assert.equal(reconciled[2].id, "p1"); // 05:00

    // Verify full names are properly sanitized
    assert.equal(reconciled[0].fullName, "Lenna");
    assert.equal(reconciled[1].fullName, "Staff Operator");
    assert.equal(reconciled[2].fullName, "Admin User");
  });
});
