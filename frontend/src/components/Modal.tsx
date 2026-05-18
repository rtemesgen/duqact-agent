import type { FormEvent, ReactNode } from 'react';

export function Modal({
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  busy = false,
  busyLabel = 'Saving...',
  submitDisabled = false,
  successMessage,
  errorMessage,
  size = 'md',
  headerTone = 'default',
  headerActions
}: {
  title: string;
  children: ReactNode;
  onClose(): void;
  onSubmit(e: FormEvent): void;
  submitLabel?: string;
  busy?: boolean;
  busyLabel?: string;
  submitDisabled?: boolean;
  successMessage?: string;
  errorMessage?: string;
  size?: 'md' | 'lg';
  headerTone?: 'default' | 'accent';
  headerActions?: ReactNode;
}) {
  return (
    <div className="modalShade">
      <form className={`workshopModal workshopModal-${size}`} onSubmit={onSubmit}>
        <div className={`workshopModalHead workshopModalHead-${headerTone}`}>
          <h2>{title}</h2>
          <div className="workshopModalHeadActions">
            {headerActions}
            <button type="button" className="iconButton iconButton-ghost" onClick={onClose} disabled={busy} aria-label="Close modal">X</button>
          </div>
        </div>
        <div className="workshopModalBody">
          {children}
          {successMessage ? <p className="noticeBanner">{successMessage}</p> : null}
          {errorMessage ? <p className="errorBanner">{errorMessage}</p> : null}
        </div>
        <div className="workshopModalActions">
          <button type="button" className="secondaryButton" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="primaryButton" disabled={busy || submitDisabled}>
            {busy ? <span className="buttonBusy"><span className="buttonSpinner" aria-hidden="true" />{busyLabel}</span> : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
