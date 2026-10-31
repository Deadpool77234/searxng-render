"""
ECE & Engineering Calculation Suite for MySearch
Provides Instant Answer detection and interactive computation for:
- Ohm's Law and Power (V, I, R, P)
- RC Low-Pass / High-Pass Cutoff Frequency & Time Constant
- Resistor 4-Band & 5-Band Color Code Calculation
- Decibels & Power/Voltage Ratios (dB, dBm)
- Programmer Number Base Conversion (Bin, Oct, Dec, Hex)
- Quick Math Expression Evaluation
"""

import math
import re
from typing import Any

# Color code tables
RESISTOR_DIGITS = [
    ("black", 0, 1, "None"),
    ("brown", 1, 10, "±1% (F)"),
    ("red", 2, 100, "±2% (G)"),
    ("orange", 3, 1_000, "None"),
    ("yellow", 4, 10_000, "None"),
    ("green", 5, 100_000, "±0.5% (D)"),
    ("blue", 6, 1_000_000, "±0.25% (C)"),
    ("violet", 7, 10_000_000, "±0.1% (B)"),
    ("gray", 8, 100_000_000, "±0.05%"),
    ("white", 9, 1_000_000_000, "None"),
]
COLOR_TO_DIGIT = {color: digit for color, digit, _, _ in RESISTOR_DIGITS}


def parse_si_val(text: str) -> float | None:
    """Parse string with engineering metric prefix (e.g. 10k, 100n, 4.7M, 20u) to float."""
    clean = text.strip().lower().replace("ω", "").replace("ohm", "").replace("ohms", "").replace("hz", "").replace("f", "").replace("v", "").replace("a", "").replace("w", "")
    m = re.match(r"^([\d\.]+)\s*([a-zμ]*)$", clean)
    if not m:
        return None
    try:
        num = float(m.group(1))
    except ValueError:
        return None
    unit = m.group(2)

    multipliers = {
        "": 1.0,
        "k": 1e3,
        "m": 1e6 if ("meg" in unit or "m" in unit and unit != "m") else (1e-3 if unit == "m" else 1e6),
        "meg": 1e6,
        "g": 1e9,
        "u": 1e-6,
        "μ": 1e-6,
        "n": 1e-9,
        "p": 1e-12,
    }
    # Check exact prefix
    if unit in multipliers:
        return num * multipliers[unit]
    if unit.startswith("meg"):
        return num * 1e6
    if unit.startswith("k"):
        return num * 1e3
    if unit.startswith("u") or unit.startswith("μ"):
        return num * 1e-6
    if unit.startswith("n"):
        return num * 1e-9
    if unit.startswith("p"):
        return num * 1e-12
    if unit.startswith("m"):
        return num * 1e-3
    return num


def format_si(val: float, unit: str = "") -> str:
    """Format float with appropriate engineering SI unit prefix."""
    if val is None or math.isnan(val) or math.isinf(val):
        return "N/A"
    abs_val = abs(val)
    if abs_val == 0:
        return f"0 {unit}".strip()

    if abs_val >= 1e9:
        return f"{val / 1e9:.2f} G{unit}".strip()
    elif abs_val >= 1e6:
        return f"{val / 1e6:.2f} M{unit}".strip()
    elif abs_val >= 1e3:
        return f"{val / 1e3:.2f} k{unit}".strip()
    elif abs_val >= 1.0:
        return f"{val:.2f} {unit}".strip()
    elif abs_val >= 1e-3:
        return f"{val * 1e3:.2f} m{unit}".strip()
    elif abs_val >= 1e-6:
        return f"{val * 1e6:.2f} µ{unit}".strip()
    elif abs_val >= 1e-9:
        return f"{val * 1e9:.2f} n{unit}".strip()
    else:
        return f"{val * 1e12:.2f} p{unit}".strip()


def calculate_ohms_law(
    v: float | None = None,
    i: float | None = None,
    r: float | None = None,
    p: float | None = None,
) -> dict[str, Any] | None:
    """Calculate missing Ohm's Law and Power variables from any 2 known values."""
    knowns = sum(1 for val in (v, i, r, p) if val is not None)
    if knowns < 2:
        return None

    try:
        if v is not None and i is not None:
            r = v / i if i != 0 else float("inf")
            p = v * i
        elif v is not None and r is not None:
            i = v / r if r != 0 else float("inf")
            p = (v**2) / r if r != 0 else float("inf")
        elif v is not None and p is not None:
            i = p / v if v != 0 else float("inf")
            r = (v**2) / p if p != 0 else float("inf")
        elif i is not None and r is not None:
            v = i * r
            p = (i**2) * r
        elif i is not None and p is not None:
            v = p / i if i != 0 else float("inf")
            r = p / (i**2) if i != 0 else float("inf")
        elif r is not None and p is not None:
            v = math.sqrt(p * r)
            i = math.sqrt(p / r) if r != 0 else float("inf")

        return {
            "type": "ohm",
            "title": "Ohm's Law & Power Instant Answer",
            "voltage": format_si(v, "V"),
            "current": format_si(i, "A"),
            "resistance": format_si(r, "Ω"),
            "power": format_si(p, "W"),
            "raw": {"v": v, "i": i, "r": r, "p": p},
            "formula": "V = I · R  |  P = V · I = I²R = V²/R",
        }
    except Exception:
        return None


def calculate_rc_filter(r: float, c: float) -> dict[str, Any] | None:
    """Calculate RC low-pass/high-pass cutoff frequency and time constant."""
    if not r or not c or r <= 0 or c <= 0:
        return None
    try:
        fc = 1.0 / (2.0 * math.pi * r * c)
        tau = r * c
        t_settle = 5.0 * tau
        return {
            "type": "rc_filter",
            "title": "RC Filter Cutoff Frequency",
            "cutoff_frequency": format_si(fc, "Hz"),
            "time_constant": format_si(tau, "s") + " (τ = RC)",
            "settling_time": format_si(t_settle, "s") + " (5τ, 99.3%)",
            "resistance": format_si(r, "Ω"),
            "capacitance": format_si(c, "F"),
            "formula": "fc = 1 / (2π · R · C)",
        }
    except Exception:
        return None


def calculate_resistor_color_code(val: float) -> dict[str, Any] | None:
    """Generate 4-band and 5-band color sequences for a given resistance value."""
    if not val or val <= 0:
        return None
    try:
        # Standardize value
        str_val = f"{val:.0f}" if val >= 10 else f"{val:.2f}".rstrip("0").rstrip(".")
        exponent = math.floor(math.log10(val))
        mantissa = val / (10**exponent)

        # 4-band calculation (2 digits + multiplier)
        first_two = round(mantissa * 10)
        d1 = first_two // 10
        d2 = first_two % 10
        mult_exp = exponent - 1

        color_names = ["black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "gray", "white"]

        if 0 <= d1 <= 9 and 0 <= d2 <= 9:
            b1 = color_names[d1]
            b2 = color_names[d2]
            if mult_exp >= 0 and mult_exp <= 9:
                b3 = color_names[mult_exp]
            elif mult_exp == -1:
                b3 = "gold"
            elif mult_exp == -2:
                b3 = "silver"
            else:
                b3 = "black"

            return {
                "type": "resistor_color",
                "title": f"Resistor Color Code: {format_si(val, 'Ω')}",
                "resistance": format_si(val, "Ω"),
                "raw_value": val,
                "bands_4": [b1, b2, b3, "gold"],
                "tolerance": "±5% (Standard Gold)",
                "formula": f"Band 1 ({b1.title()}: {d1}) · Band 2 ({b2.title()}: {d2}) · 10^{mult_exp} ({b3.title()})",
            }
    except Exception:
        return None
    return None


def calculate_decibels(
    v1: float | None = None,
    v2: float | None = None,
    p1: float | None = None,
    p2: float | None = None,
    db: float | None = None,
    dbm: float | None = None,
) -> dict[str, Any] | None:
    """Calculate decibel gains, linear ratios, and dBm conversions."""
    try:
        if v1 is not None and v2 is not None and v1 > 0 and v2 > 0:
            db_val = 20.0 * math.log10(v2 / v1)
            ratio = v2 / v1
            return {
                "type": "decibel",
                "title": "Voltage Decibel Gain (dB)",
                "db_value": f"{db_val:.2f} dB",
                "voltage_ratio": f"{ratio:.2f}x ({v2}V / {v1}V)",
                "power_ratio": f"{ratio**2:.2f}x",
                "formula": "dB = 20 · log10(V2 / V1)",
            }
        elif p1 is not None and p2 is not None and p1 > 0 and p2 > 0:
            db_val = 10.0 * math.log10(p2 / p1)
            ratio = p2 / p1
            return {
                "type": "decibel",
                "title": "Power Decibel Gain (dB)",
                "db_value": f"{db_val:.2f} dB",
                "power_ratio": f"{ratio:.2f}x ({p2}W / {p1}W)",
                "voltage_ratio": f"{math.sqrt(ratio):.2f}x",
                "formula": "dB = 10 · log10(P2 / P1)",
            }
        elif db is not None:
            v_ratio = 10.0 ** (db / 20.0)
            p_ratio = 10.0 ** (db / 10.0)
            return {
                "type": "decibel",
                "title": f"Decibel Ratio for {db} dB",
                "db_value": f"{db:.2f} dB",
                "voltage_ratio": f"{v_ratio:.2f}x (V_out / V_in)",
                "power_ratio": f"{p_ratio:.2f}x (P_out / P_in)",
                "formula": "Ratio_voltage = 10^(dB/20)  |  Ratio_power = 10^(dB/10)",
            }
        elif dbm is not None:
            mw = 10.0 ** (dbm / 10.0)
            w = mw / 1000.0
            return {
                "type": "decibel",
                "title": f"dBm Power: {dbm} dBm",
                "db_value": f"{dbm:.2f} dBm",
                "power_mw": format_si(mw, "W") if mw >= 1000 else f"{mw:.2f} mW",
                "power_watts": format_si(w, "W"),
                "formula": "P(mW) = 10^(dBm / 10)",
            }
    except Exception:
        return None
    return None


def convert_number_base(query: str) -> dict[str, Any] | None:
    """Convert number between decimal, hex, binary, and octal."""
    q = query.strip().lower()
    val = None

    if q.startswith("0x") or q.startswith("hex "):
        val_str = q.replace("0x", "").replace("hex", "").strip()
        try:
            val = int(val_str, 16)
        except ValueError:
            return None
    elif q.startswith("0b") or q.startswith("bin "):
        val_str = q.replace("0b", "").replace("bin", "").strip()
        try:
            val = int(val_str, 2)
        except ValueError:
            return None
    elif q.startswith("0o") or q.startswith("oct "):
        val_str = q.replace("0o", "").replace("oct", "").strip()
        try:
            val = int(val_str, 8)
        except ValueError:
            return None
    elif q.startswith("dec ") or q.startswith("base "):
        val_str = q.replace("dec", "").replace("base", "").strip()
        try:
            val = int(val_str)
        except ValueError:
            return None

    if val is not None and 0 <= val <= 0xFFFFFFFF:
        bin_str = bin(val)[2:]
        # Group binary into nibbles
        grouped_bin = " ".join([bin_str[max(i - 4, 0):i] for i in range(len(bin_str), 0, -4)][::-1])
        ascii_char = chr(val) if 32 <= val <= 126 else "Non-printable"

        return {
            "type": "base_converter",
            "title": f"Base Converter: {val}",
            "decimal": f"{val:,}",
            "hexadecimal": f"0x{val:X}",
            "binary": f"0b{grouped_bin} ({len(bin_str)} bits)",
            "octal": f"0o{val:o}",
            "ascii": ascii_char,
            "formula": "Radix: Dec (10) · Hex (16) · Bin (2) · Oct (8)",
        }
    return None


def evaluate_math_expression(expr: str) -> dict[str, Any] | None:
    """Safely evaluate basic arithmetic math expressions."""
    clean = expr.strip().lower().replace("×", "*").replace("÷", "/")
    # Reject dangerous keywords
    if any(k in clean for k in ["import", "open", "exec", "eval", "__", "os", "sys"]):
        return None

    # Check if string looks like math (digits, operators, sqrt, pow)
    if not re.search(r"[\d\.]+\s*[\+\-\*\/\^]\s*[\d\.]+", clean) and not clean.startswith("sqrt(") and not clean.startswith("log("):
        return None

    # Replace ^ with **
    sanitized = clean.replace("^", "**")

    # Safe math namespace
    safe_env = {
        "sqrt": math.sqrt,
        "sin": math.sin,
        "cos": math.cos,
        "tan": math.tan,
        "log": math.log10,
        "ln": math.log,
        "pi": math.pi,
        "e": math.e,
        "abs": abs,
    }

    try:
        # Verify tokens are allowed
        if not re.match(r"^[0-9\.\+\-\*\/\(\)\s\^a-z_]+$", sanitized):
            return None
        res = eval(sanitized, {"__builtins__": None}, safe_env)
        if isinstance(res, (int, float)) and not math.isnan(res) and not math.isinf(res):
            fmt_res = f"{res:.4f}".rstrip("0").rstrip(".") if isinstance(res, float) else f"{res:,}"
            return {
                "type": "math",
                "title": "Calculator Result",
                "expression": expr,
                "result": fmt_res,
                "formula": f"{expr} = {fmt_res}",
            }
    except Exception:
        pass
    return None


def detect_instant_answer(query: str) -> dict[str, Any] | None:
    """Top-level classifier that detects whether user query requests an instant ECE or Math answer."""
    q = query.strip()
    if not q:
        return None

    # 1. Number base conversion (hex, bin, dec, oct, 0x...)
    base_res = convert_number_base(q)
    if base_res:
        return base_res

    # 2. Resistor color code: "resistor 4.7k", "resistor 10k", "resistor 220"
    m_res = re.match(r"^(?:resistor|res)\s+([\d\.]+[a-zμΩ]*)$", q, re.IGNORECASE)
    if m_res:
        val = parse_si_val(m_res.group(1))
        if val:
            calc = calculate_resistor_color_code(val)
            if calc:
                return calc

    # 3. RC Filter cutoff: "rc 10k 100nf", "cutoff 1k 0.1uf", "rc filter 4.7k 10uf"
    m_rc = re.match(r"^(?:rc|cutoff|rc filter)\s+([\d\.]+[a-zμΩ]*)\s+([\d\.]+[a-zμf]*)$", q, re.IGNORECASE)
    if m_rc:
        r_val = parse_si_val(m_rc.group(1))
        c_val = parse_si_val(m_rc.group(2))
        if r_val and c_val:
            calc = calculate_rc_filter(r_val, c_val)
            if calc:
                return calc

    # 4. Decibel calculation: "db 10v 1v", "20db", "30dbm", "db 100w 1w"
    m_db_v = re.match(r"^db\s+([\d\.]+)v\s+([\d\.]+)v$", q, re.IGNORECASE)
    if m_db_v:
        return calculate_decibels(v1=float(m_db_v.group(2)), v2=float(m_db_v.group(1)))

    m_db_p = re.match(r"^db\s+([\d\.]+)w\s+([\d\.]+)w$", q, re.IGNORECASE)
    if m_db_p:
        return calculate_decibels(p1=float(m_db_p.group(2)), p2=float(m_db_p.group(1)))

    m_dbm = re.match(r"^([\d\.\-]+)\s*dbm$", q, re.IGNORECASE)
    if m_dbm:
        return calculate_decibels(dbm=float(m_dbm.group(1)))

    m_db_ratio = re.match(r"^([\d\.\-]+)\s*db(?:\s+to\s+ratio)?$", q, re.IGNORECASE)
    if m_db_ratio:
        return calculate_decibels(db=float(m_db_ratio.group(1)))

    # 5. Ohm's Law: "ohm 12v 100", "5v 20ma", "v=12 r=100", "ohm 3.3v 10k"
    # Case A: Explicit key-values like v=12 r=100
    v_m = re.search(r"\bv\s*=\s*([\d\.]+[a-z]*)", q, re.IGNORECASE)
    i_m = re.search(r"\bi\s*=\s*([\d\.]+[a-z]*)", q, re.IGNORECASE)
    r_m = re.search(r"\br\s*=\s*([\d\.]+[a-z]*)", q, re.IGNORECASE)
    p_m = re.search(r"\bp\s*=\s*([\d\.]+[a-z]*)", q, re.IGNORECASE)
    if sum(1 for item in (v_m, i_m, r_m, p_m) if item) >= 2:
        return calculate_ohms_law(
            v=parse_si_val(v_m.group(1)) if v_m else None,
            i=parse_si_val(i_m.group(1)) if i_m else None,
            r=parse_si_val(r_m.group(1)) if r_m else None,
            p=parse_si_val(p_m.group(1)) if p_m else None,
        )

    # Case B: Pattern like "ohm 12v 100" or "12v 2a"
    m_ohm_pos = re.match(r"^(?:ohm\s+)?([\d\.]+\s*v)\s+([\d\.]+\s*(?:ma|a|k?ohm|k?ω|\d+))$", q, re.IGNORECASE)
    if m_ohm_pos:
        v_val = parse_si_val(m_ohm_pos.group(1))
        second_str = m_ohm_pos.group(2).lower()
        if "a" in second_str:
            i_val = parse_si_val(second_str)
            return calculate_ohms_law(v=v_val, i=i_val)
        else:
            r_val = parse_si_val(second_str)
            return calculate_ohms_law(v=v_val, r=r_val)

    # 6. Math expression evaluation (e.g. 25 * 4, sqrt(144), 2^16)
    math_res = evaluate_math_expression(q)
    if math_res:
        return math_res

    return None
