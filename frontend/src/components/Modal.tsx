import type { FormEvent, ReactNode } from 'react';

export function Modal({
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  size = 'md',
  headerTone = 'default'
}: {
  title: string;
  children: ReactNode;
  onClose(): void;
  onSubmit(e: FormEvent): void;
  submitLabel?: string;
  size?: 'md' | 'lg';
  headerTone?: 'default' | 'accent';
}) {
  return (
    <div className="modalShade">
      <form className={`workshopModal workshopModal-${size}`} onSubmit={onSubmit}>
        <div className={`workshopModalHead workshopModalHead-${headerTone}`}>
          <h2>{title}</h2>
          <button type="button" className="iconButton iconButton-ghost" onClick={onClose}>×</button>
        </div>
        <div className="workshopModalBody">{children}</div>
        <div className="workshopModalActions">
          <button type="button" className="secondaryButton" onClick={onClose}>Cancel</button>
          <button className="primaryButton">{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}

