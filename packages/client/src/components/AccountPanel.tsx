'use client'

import React, { useEffect, useState } from 'react'
import { getMe, type UserProfile } from '../lib/api'

interface AccountPanelProps {
  onClose: () => void
}

function textOrDash(value: unknown): string {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : '—'
}

/** The signed-in shopper's profile, read from the user service each time the panel opens. */
export default function AccountPanel({ onClose }: AccountPanelProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let active = true
    getMe()
      .then((p) => {
        if (active) setProfile(p)
      })
      .catch(() => {
        if (active) setError('Could not load your account details. Please try again.')
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const firstName = textOrDash(profile?.firstName)
  const lastName = textOrDash(profile?.lastName)
  const fullName =
    [profile?.firstName, profile?.lastName]
      .filter((part): part is string => typeof part === 'string' && part.trim() !== '')
      .map((part) => part.trim())
      .join(' ') || '—'
  const verified = profile?.isEmailVerified
  const rows: Array<[string, string]> = profile
    ? [
        ['Email', textOrDash(profile.email)],
        ['First name', firstName],
        ['Last name', lastName],
        ['Full name', fullName],
        ['Role', textOrDash(profile.role)],
        ['Email status', verified === true ? 'Verified' : verified === false ? 'Pending' : '—'],
      ]
    : []

  return (
    <div
      role="dialog"
      aria-label="Account details"
      className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 text-left"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-900">Account details</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close account details"
          className="text-slate-400 hover:text-slate-600 text-sm px-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
        >
          ✕
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
      {!error && !profile && <p className="text-xs text-slate-500">Loading…</p>}
      {profile && (
        <dl className="text-xs divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 py-2">
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-semibold text-slate-800 text-right break-all">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
