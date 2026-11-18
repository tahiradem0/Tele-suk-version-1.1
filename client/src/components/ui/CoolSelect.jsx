import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import './CoolSelect.css';

/**
 * Drop-in replacement for native <select>.
 * - Renders menu via React Portal directly in document.body (z-index: 99999) so it NEVER clips or overflows.
 * - Auto-flips upward when near the bottom of the viewport.
 * - Accepts standard <option> children OR an `options` array, and emits standard `{ target: { value, name } }` to `onChange`.
 */
const CoolSelect = ({
    value,
    onChange,
    name = '',
    options: propOptions,
    children,
    placeholder = 'Select...',
    disabled = false,
    className = '',
    style = {},
    title,
}) => {
    const [open, setOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 200, flipUp: false });
    const [isDark, setIsDark] = useState(false);

    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    // Extract options from either `options` prop or `<option>` JSX children
    const parsedOptions = useMemo(() => {
        if (Array.isArray(propOptions)) {
            return propOptions.map((o) =>
                typeof o === 'object'
                    ? { value: String(o.value ?? ''), label: o.label ?? String(o.value ?? ''), disabled: Boolean(o.disabled) }
                    : { value: String(o), label: String(o), disabled: false }
            );
        }

        const list = [];
        const walk = (nodes) => {
            React.Children.forEach(nodes, (child) => {
                if (!child) return;
                if (Array.isArray(child)) {
                    walk(child);
                } else if (child.type === React.Fragment) {
                    walk(child.props?.children);
                } else if (child.type === 'option') {
                    const optVal = child.props.value !== undefined ? String(child.props.value) : String(child.props.children ?? '');
                    const labelText = Array.isArray(child.props.children)
                        ? child.props.children.map((c) => (c === null || c === undefined ? '' : String(c))).join('')
                        : String(child.props.children ?? optVal);
                    list.push({
                        value: optVal,
                        label: labelText,
                        disabled: Boolean(child.props.disabled),
                    });
                }
            });
        };
        walk(children);
        return list;
    }, [propOptions, children]);

    const currentValue = value !== undefined && value !== null ? String(value) : '';
    const selectedOption = parsedOptions.find((o) => o.value === currentValue);

    const updatePosition = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const estimatedHeight = Math.min(280, parsedOptions.length * 42 + 16);
        const spaceBelow = window.innerHeight - rect.bottom - 12;
        const spaceAbove = rect.top - 12;
        const flipUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

        const width = Math.max(rect.width, 170);
        const left = Math.min(
            Math.max(8, rect.left),
            Math.max(8, window.innerWidth - width - 8)
        );

        const top = flipUp
            ? Math.max(8, rect.top - Math.min(estimatedHeight, spaceAbove) - 6)
            : rect.bottom + 6;

        setMenuPos({ top, left, width, flipUp });

        // Detect Dark Mode from nearest admin layout
        setIsDark(Boolean(el.closest('.admin-layout.dark') || document.querySelector('.admin-layout.dark')));
    }, [parsedOptions.length]);

    const handleToggle = () => {
        if (disabled) return;
        if (!open) {
            updatePosition();
            const idx = parsedOptions.findIndex((o) => o.value === currentValue);
            setHighlightIndex(idx >= 0 ? idx : 0);
            setOpen(true);
        } else {
            setOpen(false);
        }
    };

    const handleSelect = useCallback(
        (opt) => {
            if (opt.disabled) return;
            setOpen(false);
            if (onChange) {
                onChange({
                    target: {
                        value: opt.value,
                        name,
                        type: 'select-one',
                    },
                });
            }
            triggerRef.current?.focus();
        },
        [onChange, name]
    );

    // Close on outside click, Escape, or window scroll/resize
    useEffect(() => {
        if (!open) return;

        const handleOutsideClick = (e) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(e.target) &&
                menuRef.current &&
                !menuRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };

        const handleScrollOrResize = (e) => {
            // Allow scrolling INSIDE the dropdown menu itself
            if (menuRef.current && e.target && menuRef.current.contains(e.target)) return;
            updatePosition();
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setOpen(false);
                triggerRef.current?.focus();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightIndex((prev) => (prev + 1) % Math.max(1, parsedOptions.length));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightIndex((prev) =>
                    prev <= 0 ? Math.max(0, parsedOptions.length - 1) : prev - 1
                );
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const target = parsedOptions[highlightIndex];
                if (target) handleSelect(target);
            } else if (e.key === 'Tab') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        window.addEventListener('resize', handleScrollOrResize);
        window.addEventListener('scroll', handleScrollOrResize, true);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, highlightIndex, parsedOptions, handleSelect, updatePosition]);

    // Clean style forwarding (strip browser-specific select props that shouldn't override CoolSelect)
    const triggerStyle = { ...style };
    delete triggerStyle.appearance;
    delete triggerStyle.WebkitAppearance;

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                title={title}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={handleToggle}
                className={`cool-select-trigger ${open ? 'open' : ''} ${className}`}
                style={triggerStyle}
            >
                <span className={`cool-select-label ${!selectedOption ? 'placeholder' : ''}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className="cool-select-chevron" />
            </button>

            {open &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="listbox"
                        className={`cool-select-menu ${menuPos.flipUp ? 'flip-up' : ''} ${isDark ? 'cool-select-dark' : ''}`}
                        style={{
                            top: `${menuPos.top}px`,
                            left: `${menuPos.left}px`,
                            minWidth: `${menuPos.width}px`,
                        }}
                    >
                        {parsedOptions.map((opt, idx) => {
                            const isSelected = opt.value === currentValue;
                            const isHighlighted = idx === highlightIndex;
                            return (
                                <button
                                    key={`${opt.value}-${idx}`}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    disabled={opt.disabled}
                                    className={`cool-select-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                                    onMouseEnter={() => setHighlightIndex(idx)}
                                    onClick={() => handleSelect(opt)}
                                >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check size={15} className="cool-select-check" />}
                                </button>
                            );
                        })}
                    </div>,
                    document.body
                )}
        </>
    );
};

export default CoolSelect;
