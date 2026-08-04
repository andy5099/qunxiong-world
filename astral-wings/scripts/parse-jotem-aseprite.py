"""Read animation tags from the bundled Jotem Aseprite source."""

from __future__ import annotations

import json
import struct
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "third_party" / "jotem-old-hero" / "Jotem.aseprite"
OUTPUT = ROOT / "reports" / "jotem-aseprite-tags.json"


def u16(data: bytes, offset: int) -> int:
    return struct.unpack_from("<H", data, offset)[0]


def u32(data: bytes, offset: int) -> int:
    return struct.unpack_from("<I", data, offset)[0]


def main() -> None:
    data = SOURCE.read_bytes()
    if len(data) < 128 or u16(data, 4) != 0xA5E0:
        raise ValueError("Not a valid Aseprite file")
    frame_count = u16(data, 6)
    width, height = u16(data, 8), u16(data, 10)
    offset = 128
    tags = []
    durations = []
    for frame_index in range(frame_count):
        frame_start = offset
        frame_bytes = u32(data, offset)
        if u16(data, offset + 4) != 0xF1FA:
            raise ValueError(f"Invalid frame magic at frame {frame_index}")
        old_count = u16(data, offset + 6)
        durations.append(u16(data, offset + 8))
        new_count = u32(data, offset + 12)
        chunk_count = new_count if new_count else old_count
        chunk_offset = offset + 16
        for _ in range(chunk_count):
            chunk_size = u32(data, chunk_offset)
            chunk_type = u16(data, chunk_offset + 4)
            if chunk_type == 0x2018:
                cursor = chunk_offset + 6
                tag_count = u16(data, cursor)
                cursor += 10
                for _ in range(tag_count):
                    from_frame, to_frame = u16(data, cursor), u16(data, cursor + 2)
                    direction = data[cursor + 4]
                    repeat = u16(data, cursor + 5)
                    color = list(data[cursor + 13:cursor + 16])
                    name_length = u16(data, cursor + 17)
                    name = data[cursor + 19:cursor + 19 + name_length].decode("utf-8")
                    cursor += 19 + name_length
                    tags.append({
                        "name": name,
                        "from": from_frame,
                        "to": to_frame,
                        "frameCount": to_frame - from_frame + 1,
                        "direction": direction,
                        "repeat": repeat,
                        "color": color,
                    })
            chunk_offset += chunk_size
        offset = frame_start + frame_bytes
    result = {
        "source": SOURCE.relative_to(ROOT).as_posix(),
        "sheetSize": [width, height],
        "frameCount": frame_count,
        "durationsMs": durations,
        "tags": tags,
    }
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
