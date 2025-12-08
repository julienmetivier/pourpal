import React, { useMemo, useState, useRef, useEffect } from "react";
import { Block, Button, Icon } from "framework7-react";

export type PinPadProps = {
  /** Current value (controlled). If omitted, component is uncontrolled */
  value?: string;
  /** Default value for uncontrolled mode */
  defaultValue?: string;
  /** Called on every change */
  onChange?: (pin: string) => void;
  /** Called automatically when pin reaches `length` */
  onComplete?: (pin: string) => void;
  /** Max pin length before auto-complete */
  length?: number; // default 4
  /** Disable all interactions */
  disabled?: boolean;
  /** Show clear/backspace actions */
  actions?: {
    clear?: boolean; // default true
    backspace?: boolean; // default true
    submit?: boolean; // default false (only fires onComplete when pressed)
  };
  /** Custom className for outer wrapper */
  className?: string;
  /** If true, shows each entered digit as •; otherwise shows boxes */
  masked?: boolean; // default true
};

const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

const PinPad: React.FC<PinPadProps> = ({
  value,
  defaultValue = "",
  onChange,
  onComplete,
  length = 4,
  disabled = false,
  actions = { clear: true, backspace: true, submit: false },
  className = "",
  masked = true,
}) => {
  const [internal, setInternal] = useState(defaultValue);
  const pin = value !== undefined ? value : internal;
  const pinRef = useRef(pin);
  
  // Keep ref in sync with pin value
  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);

  const update = (next: string) => {
    if (disabled) return;
    pinRef.current = next;
    if (value === undefined) setInternal(next);
    onChange?.(next);
    if (onComplete && next.length === length) onComplete(next);
  };

  const handleDigit = (d: string) => {
    const currentPin = pinRef.current;
    if (currentPin.length >= length || disabled) return;
    update(currentPin + d);
  };

  const handleBackspace = () => {
    const currentPin = pinRef.current;
    if (currentPin.length === 0 || disabled) return;
    update(currentPin.slice(0, -1));
  };

  const handleClear = () => update("");

  const filledArray = useMemo(() => Array.from({ length }, (_, i) => i < pin.length), [length, pin.length]);

  return (
    <div className={`w-full ${className}`}>
      {/* Display */}
      <Block strong inset className="flex items-center justify-center">
        <div style={{ display: "flex", gap: 12 }}>
          {filledArray.map((filled, i) => (
            <div
              key={i}
              aria-label={`digit ${i + 1}`}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9999,
                border: masked ? "1px solid var(--f7-border-color)" : "2px solid var(--f7-border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: masked && filled ? "var(--f7-theme-color)" : "transparent",
              }}
            >
              {!masked && (
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {filled ? (value ? value[i] : internal[i]) : ""}
                </span>
              )}
            </div>
          ))}
        </div>
      </Block>

      {/* Keypad */}
      <div
        aria-label="pin keypad"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(64px, 1fr))",
          gap: 12,
          width: "100%",
          maxWidth: 420,
          margin: "0 auto",
        }}
      >
        {digits.slice(0, 9).map((d) => (
          <Button
            key={d}
            large
            fill
            disabled={disabled || pin.length >= length}
            onClick={() => handleDigit(d)}
            style={{ minHeight: '64px', paddingTop: '16px', paddingBottom: '16px' }}
          >
            {d}
          </Button>
        ))}

        {/* Bottom row: Clear / 0 / Backspace (or Submit) */}
        {actions.clear ? (
          <Button large outline disabled={disabled} onClick={handleClear} style={{ minHeight: '64px', paddingTop: '16px', paddingBottom: '16px' }}>
            Clear
          </Button>
        ) : (
          <div />
        )}

        <Button
          large
          fill
          disabled={disabled || pin.length >= length}
          onClick={() => handleDigit("0")}
          style={{ minHeight: '64px', paddingTop: '16px', paddingBottom: '16px' }}
        >
          0
        </Button>

        {actions.submit ? (
          <Button large color="green" disabled={disabled || pin.length !== length} onClick={() => onComplete?.(pinRef.current)} style={{ minHeight: '64px', paddingTop: '16px', paddingBottom: '16px' }}>
            Submit
          </Button>
        ) : actions.backspace ? (
          <Button large outline disabled={disabled || pin.length === 0} onClick={handleBackspace} style={{ minHeight: '64px', paddingTop: '16px', paddingBottom: '16px' }}>
            ⌫
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};

export default PinPad;
