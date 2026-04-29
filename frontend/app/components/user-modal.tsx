import { useEffect, useRef } from "react";
import type { User } from "oidc-client-ts";

interface Props {
  user: User;
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

export function UserModal({ user, open, onClose, onSignOut }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  const { profile } = user;
  const groups = Array.isArray(
    (profile as Record<string, unknown>).groups,
  )
    ? ((profile as Record<string, unknown>).groups as string[])
    : [];

  const displayName = profile.name ?? profile.preferred_username ?? profile.sub;
  const username = profile.preferred_username;
  const email = profile.email;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-0 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-5 p-6"
      >
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xl font-semibold text-white dark:bg-blue-500">
            {(displayName ?? "?")[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
              {displayName}
            </p>
            {username && displayName !== username && (
              <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                @{username}
              </p>
            )}
          </div>
        </div>

        {/* Details */}
        <dl className="flex flex-col gap-2 text-sm">
          {email && (
            <div className="flex items-center gap-2">
              <dt className="w-16 shrink-0 text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="truncate text-gray-900 dark:text-gray-100">{email}</dd>
            </div>
          )}
          {groups.length > 0 && (
            <div className="flex items-start gap-2">
              <dt className="w-16 shrink-0 pt-0.5 text-gray-500 dark:text-gray-400">Groups</dt>
              <dd className="flex flex-wrap gap-1">
                {groups.map((g) => (
                  <span
                    key={g}
                    className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {g}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button type="button" onClick={onSignOut} className="btn-danger">
            Sign out
          </button>
        </div>
      </div>
    </dialog>
  );
}
