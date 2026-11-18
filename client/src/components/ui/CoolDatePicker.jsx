import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useAdminLanguage } from '../../context/AdminLanguageContext';
import { toEthiopianDate } from '../../utils/ethiopianDate';
import './CoolDatePicker.css';

const MONTHS_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAYS_AM = ['እሁ', 'ሰኞ', 'ማክ', 'ረቡ', 'ሐሙ', 'ዓር', 'ቅዳ'];

const toIsoDate = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const parseIsoDate = (iso) => {
    if (!iso) return null;
    const parts = String(iso).split('T')[0].split('-');
    if (parts.length !== 3) return null;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Portal-powered, ultra-clean Calendar Date Picker.
 * - Zero z-index clipping inside modals/cards.
 * - 1-tap presets (Today / Yesterday / Last Week OR Tomorrow / +7 Days / +30 Days).
 * - Quick Month/Year jump view + Live Ethiopian Calendar readout!
 */
const CoolDatePicker = ({
    value = '',
    onChange,
    name = '',
    placeholder,
    allowClear = false,
    presetMode = 'past', // 'past' | 'future'
    disabled = false,
    className = '',
    style = {},
}) => {
    const { isAmharic } = useAdminLanguage();
    const [open, setOpen] = useState(false);
    const [pickingMonth, setPickingMonth] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, flipUp: false });
    const [isDark, setIsDark] = useState(false);

    const parsedSelected = useMemo(() => parseIsoDate(value), [value]);
    const today = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }, []);

    const [viewYear, setViewYear] = useState((parsedSelected || today).getFullYear());
    const [viewMonth, setViewMonth] = useState((parsedSelected || today).getMonth());

    const triggerRef = useRef(null);
    const popoverRef = useRef(null);

    const updatePosition = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const popHeight = 365;
        const popWidth = 312;

        const spaceBelow = window.innerHeight - rect.bottom - 12;
        const spaceAbove = rect.top - 12;
        const flipUp = spaceBelow < popHeight && spaceAbove > spaceBelow;

        const top = flipUp
            ? Math.max(8, rect.top - popHeight - 6)
            : Math.min(window.innerHeight - popHeight - 8, rect.bottom + 6);

        const left = Math.min(
            Math.max(8, rect.left),
            Math.max(8, window.innerWidth - popWidth - 8)
        );

        setPos({ top, left, flipUp });
        setIsDark(Boolean(el.closest('.admin-layout.dark') || document.querySelector('.admin-layout.dark')));
    }, []);

    const emitDate = useCallback(
        (isoStr) => {
            if (onChange) {
                onChange({
                    target: { value: isoStr, name, type: 'date' },
                });
            }
        },
        [onChange, name]
    );

    const handleOpenToggle = () => {
        if (disabled) return;
        if (!open) {
            const base = parsedSelected || today;
            setViewYear(base.getFullYear());
            setViewMonth(base.getMonth());
            setPickingMonth(false);
            updatePosition();
            setOpen(true);
        } else {
            setOpen(false);
        }
    };

    const handleSelectDate = (dateObj) => {
        emitDate(toIsoDate(dateObj));
        setOpen(false);
    };

    const handlePreset = (daysOffset) => {
        const d = new Date(today);
        d.setDate(d.getDate() + daysOffset);
        handleSelectDate(d);
    };

    const shiftMonth = (delta) => {
        if (pickingMonth) {
            setViewYear((y) => y + delta);
            return;
        }
        const next = new Date(viewYear, viewMonth + delta, 1);
        setViewYear(next.getFullYear());
        setViewMonth(next.getMonth());
    };

    // Close on outside click, Escape, or reposition on scroll/resize
    useEffect(() => {
        if (!open) return;

        const onOutside = (e) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(e.target) &&
                popoverRef.current &&
                !popoverRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };

        const onKey = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };

        const onReposition = () => updatePosition();

        document.addEventListener('mousedown', onOutside);
        document.addEventListener('keydown', onKey);
        window.addEventListener('resize', onReposition);
        window.addEventListener('scroll', onReposition, true);

        return () => {
            document.removeEventListener('mousedown', onOutside);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
        };
    }, [open, updatePosition]);

    // Build 42-day calendar grid (6 rows x 7 cols)
    const calendarDays = useMemo(() => {
        const firstOfMonth = new Date(viewYear, viewMonth, 1);
        const startDay = firstOfMonth.getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

        const cells = [];
        for (let i = startDay - 1; i >= 0; i--) {
            cells.push({
                date: new Date(viewYear, viewMonth - 1, prevMonthDays - i),
                outside: true,
            });
        }
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push({
                date: new Date(viewYear, viewMonth, d),
                outside: false,
            });
        }
        while (cells.length < 42) {
            const nextDay = cells.length - (startDay + daysInMonth) + 1;
            cells.push({
                date: new Date(viewYear, viewMonth + 1, nextDay),
                outside: true,
            });
        }
        return cells;
    }, [viewYear, viewMonth]);

    const todayIso = toIsoDate(today);
    const selectedIso = parsedSelected ? toIsoDate(parsedSelected) : '';

    const displayGregorian = parsedSelected
        ? `${MONTHS_SHORT[parsedSelected.getMonth()]} ${parsedSelected.getDate()}, ${parsedSelected.getFullYear()}`
        : '';
    const displayEthiopian = parsedSelected ? toEthiopianDate(parsedSelected, isAmharic) : '';

    const presets =
        presetMode === 'future'
            ? [
                  { label: isAmharic ? 'ነገ' : 'Tomorrow', offset: 1 },
                  { label: isAmharic ? 'በ7 ቀን' : '+7 Days', offset: 7 },
                  { label: isAmharic ? 'በ1 ወር' : '+30 Days', offset: 30 },
              ]
            : [
                  { label: isAmharic ? 'ዛሬ' : 'Today', offset: 0 },
                  { label: isAmharic ? 'ትናንት' : 'Yesterday', offset: -1 },
                  { label: isAmharic ? 'ባለፈው ሳምንት' : '7 Days Ago', offset: -7 },
              ];

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={handleOpenToggle}
                className={`cdp-trigger ${open ? 'open' : ''} ${className}`}
                style={style}
            >
                <div className="cdp-trigger-text">
                    <span className={`cdp-trigger-main ${!displayGregorian ? 'placeholder' : ''}`}>
                        {displayGregorian || placeholder || (isAmharic ? 'ቀን ይምረጡ' : 'Select date')}
                    </span>
                    {displayEthiopian && <span className="cdp-trigger-eth">{displayEthiopian}</span>}
                </div>
                <span className="cdp-trigger-icon">
                    <CalendarIcon size={15} />
                </span>
            </button>

            {open &&
                createPortal(
                    <div
                        ref={popoverRef}
                        className={`cdp-popover ${pos.flipUp ? 'flip-up' : ''} ${isDark ? 'cdp-dark' : ''}`}
                        style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
                    >
                        {/* 1-Tap Quick Presets */}
                        <div className="cdp-presets">
                            {presets.map((p) => (
                                <button
                                    key={p.label}
                                    type="button"
                                    className="cdp-preset-btn"
                                    onClick={() => handlePreset(p.offset)}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* Month / Year Bar */}
                        <div className="cdp-header">
                            <button
                                type="button"
                                className="cdp-nav-btn"
                                onClick={() => shiftMonth(-1)}
                                aria-label="Previous"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <button
                                type="button"
                                className="cdp-month-btn"
                                onClick={() => setPickingMonth((v) => !v)}
                            >
                                <span>
                                    {pickingMonth ? viewYear : `${MONTHS_EN[viewMonth]} ${viewYear}`}
                                </span>
                                <ChevronDown
                                    size={14}
                                    style={{
                                        transform: pickingMonth ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.18s ease',
                                    }}
                                />
                            </button>

                            <button
                                type="button"
                                className="cdp-nav-btn"
                                onClick={() => shiftMonth(1)}
                                aria-label="Next"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {pickingMonth ? (
                            <div className="cdp-months-grid">
                                {MONTHS_SHORT.map((mName, idx) => (
                                    <button
                                        key={mName}
                                        type="button"
                                        className={`cdp-month-cell ${idx === viewMonth ? 'active' : ''}`}
                                        onClick={() => {
                                            setViewMonth(idx);
                                            setPickingMonth(false);
                                        }}
                                    >
                                        {mName}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="cdp-weekdays">
                                    {(isAmharic ? WEEKDAYS_AM : WEEKDAYS_EN).map((w) => (
                                        <div key={w} className="cdp-weekday">
                                            {w}
                                        </div>
                                    ))}
                                </div>

                                <div className="cdp-days">
                                    {calendarDays.map((cell, idx) => {
                                        const iso = toIsoDate(cell.date);
                                        const isToday = iso === todayIso;
                                        const isSelected = iso === selectedIso;
                                        return (
                                            <button
                                                key={`${iso}-${idx}`}
                                                type="button"
                                                className={`cdp-day ${cell.outside ? 'outside' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleSelectDate(cell.date)}
                                            >
                                                {cell.date.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* Footer: Live Ethiopian Date + Optional Clear */}
                        <div className="cdp-footer">
                            <span className="cdp-eth-pill">
                                <CalendarIcon size={12} />
                                <span>
                                    {displayEthiopian || toEthiopianDate(today, isAmharic)}
                                </span>
                            </span>

                            {allowClear && value ? (
                                <button
                                    type="button"
                                    className="cdp-clear-btn"
                                    onClick={() => {
                                        emitDate('');
                                        setOpen(false);
                                    }}
                                >
                                    {isAmharic ? 'አጽዳ' : 'Clear'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="cdp-clear-btn"
                                    style={{ color: '#06b6d4' }}
                                    onClick={() => handleSelectDate(today)}
                                >
                                    {isAmharic ? 'ዛሬ' : 'Today'}
                                </button>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
};

export default CoolDatePicker;
