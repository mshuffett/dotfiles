"use client";

import React, { useState, useEffect } from "react";
import { isValidEmail } from "@/lib/utils";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarUrl?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    website?: string;
  };
  joinedAt: string;
}

interface UserProfileProps {
  userId: string;
}

const DEFAULT_AVATAR = "/default-avatar.png";

export function UserProfile({ userId }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", bio: "" });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(
          `/api/profile?userId=${encodeURIComponent(userId)}`
        );
        if (!res.ok) {
          setError("Failed to load profile");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setProfile(data);
        setFormData({ name: data.name, email: data.email, bio: data.bio });
      } catch {
        if (cancelled) return;
        setError("Failed to load profile");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  function validateForm(): string | null {
    if (!formData.name.trim()) {
      return "Name is required";
    }
    if (!formData.email.trim()) {
      return "Email is required";
    }
    if (!isValidEmail(formData.email)) {
      return "Please enter a valid email address";
    }
    return null;
  }

  async function handleSave() {
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...formData }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to update profile");
        return;
      }
      const updated = await res.json();
      setProfile(updated);
      setIsEditing(false);
    } catch {
      setError("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        bio: profile.bio,
      });
    }
    setError(null);
    setIsEditing(false);
  }

  if (isLoading) {
    return <div className="animate-pulse p-6">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="p-6">
        {error ? (
          <div className="rounded bg-red-50 p-3 text-red-700" role="alert">
            {error}
          </div>
        ) : (
          <p>Profile not found.</p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-start gap-4">
        <img
          src={profile.avatarUrl || DEFAULT_AVATAR}
          alt={`${profile.name}'s avatar`}
          className="h-20 w-20 rounded-full"
        />
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="profile-name" className="sr-only">
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded border px-3 py-2"
                  placeholder="Name"
                />
              </div>
              <div>
                <label htmlFor="profile-email" className="sr-only">
                  Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded border px-3 py-2"
                  placeholder="Email"
                />
              </div>
              <div>
                <label htmlFor="profile-bio" className="sr-only">
                  Bio
                </label>
                <textarea
                  id="profile-bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  className="w-full rounded border px-3 py-2"
                  rows={4}
                  placeholder="Bio"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="rounded border px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <p className="text-gray-600">{profile.email}</p>
              {/* Render bio as plain text -- no dangerouslySetInnerHTML needed */}
              <p className="mt-3 whitespace-pre-wrap">{profile.bio}</p>
              {profile.socialLinks && (
                <div className="mt-4 flex gap-3">
                  {profile.socialLinks.twitter && (
                    <a
                      href={profile.socialLinks.twitter}
                      className="text-blue-500 hover:underline"
                      rel="noopener noreferrer"
                    >
                      Twitter
                    </a>
                  )}
                  {profile.socialLinks.github && (
                    <a
                      href={profile.socialLinks.github}
                      className="text-blue-500 hover:underline"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                  )}
                  {profile.socialLinks.website && (
                    <a
                      href={profile.socialLinks.website}
                      className="text-blue-500 hover:underline"
                      rel="noopener noreferrer"
                    >
                      Website
                    </a>
                  )}
                </div>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 rounded border px-4 py-2 text-sm"
              >
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-4 rounded bg-red-50 p-3 text-red-700" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
