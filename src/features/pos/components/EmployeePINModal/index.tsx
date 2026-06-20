import { useState } from 'react';
import { Delete, Lock, Check } from 'lucide-react';

import { COPY } from '@shared/copy/ui.copy';

interface EmployeePINModalProps {
  readonly isValidating: boolean;
  readonly error: string | null;
  readonly onSubmit: (pin: string) => void;
}

const KEYPAD_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

/** Teclado numérico fullscreen para desbloquear el POS con PIN de 4 a 6 dígitos. */
export function EmployeePINModal({ isValidating, error, onSubmit }: EmployeePINModalProps) {
  const [pin, setPin] = useState('');

  function handleDigit(digit: string) {
    if (isValidating) return;
    setPin((prev) => prev.length < 8 ? prev + digit : prev);
  }

  function handleDelete() {
    if (isValidating) return;
    setPin((prev) => prev.slice(0, -1));
  }

  function handleSubmit() {
    if (isValidating || pin.length < 4) return;
    onSubmit(pin);
    setPin('');
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.07)' }}>
        
        <Lock size={22} className="text-white" />
      </div>

      <div className="text-center">
        <h1 className="text-lg font-black text-white">{COPY.pos.pin.title}</h1>
        <p className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {isValidating ? COPY.pos.pin.validating : COPY.pos.pin.subtitle}
        </p>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-3 h-4" aria-label="PIN">
        {Array.from({ length: Math.max(4, pin.length) }, (_, i) => (
          <span
            key={i}
            className="h-3.5 w-3.5 rounded-full transition-all"
            style={{
              background: i < pin.length ? '#f5b520' : 'rgba(255,255,255,0.12)',
              transform: i < pin.length ? 'scale(1.1)' : 'scale(1)'
            }} 
          />
        ))}
      </div>

      {error && (
        <p className="text-[12.5px] font-bold text-red-400" role="alert">
          {error}
        </p>
      )}
      {!error && <div className="h-[18px]" />}

      {/* Keypad */}
      <div className="grid w-full max-w-[260px] grid-cols-3 gap-2.5">
        {KEYPAD_DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            disabled={isValidating}
            className="flex h-16 items-center justify-center rounded-2xl text-xl font-black text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isValidating || pin.length < 4}
          className="flex h-16 items-center justify-center rounded-2xl transition-all active:scale-95 disabled:opacity-30"
          style={{ background: pin.length >= 4 ? '#f5b520' : 'rgba(255,255,255,0.04)' }}>
          <Check size={24} className={pin.length >= 4 ? 'text-amber-950' : 'text-white'} />
        </button>
        <button
          type="button"
          onClick={() => handleDigit('0')}
          disabled={isValidating}
          className="flex h-16 items-center justify-center rounded-2xl text-xl font-black text-white transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          0
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isValidating || pin.length === 0}
          aria-label={COPY.pos.pin.clear}
          className="flex h-16 items-center justify-center rounded-2xl text-white transition-all active:scale-95 disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
}