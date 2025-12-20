#!/usr/bin/env python3

import argparse
import sys

def string_to_decimal_little_endian(s: str) -> int:
    padded = s.ljust(4, ' ')[:4]
    hex_bytes = [format(ord(c), "02x") for c in padded]
    little_endian_hex = "".join(reversed(hex_bytes))
    return int(little_endian_hex, 16)

def decimal_to_string_little_endian(value: int) -> str:
    hex_str = format(value, "08x")
    bytes_be = [hex_str[i:i+2] for i in range(0, 8, 2)]
    bytes_le = list(reversed(bytes_be))
    chars = [chr(int(b, 16)) for b in bytes_le]
    return "".join(chars).rstrip(" ")

def main():
    parser = argparse.ArgumentParser(
        description="Convert 4-character strings to decimal (little-endian) and back"
    )
    parser.add_argument("value", help="Input string (max 4 chars) or decimal value")
    parser.add_argument(
        "-reverse",
        action="store_true",
        help="Convert decimal back to string"
    )
    args = parser.parse_args()

    try:
        if args.reverse:
            num = int(args.value)
            print(decimal_to_string_little_endian(num))
        else:
            print(string_to_decimal_little_endian(args.value))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
