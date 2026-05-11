#!/usr/bin/env python3
"""生成简单的 PNG 图标文件"""
import struct, zlib, os

def make_png(size, out_path):
    # 绿色背景 #22c55e = rgb(34,197,94)，圆角用纯色块
    r, g, b = 34, 197, 94
    # RGBA 行数据
    rows = []
    for y in range(size):
        row = [0]  # filter type
        for x in range(size):
            # 圆角：角落外设为透明
            rx = min(x, size - 1 - x)
            ry = min(y, size - 1 - y)
            radius = size // 5
            if rx < radius and ry < radius:
                dist = ((rx - radius) ** 2 + (ry - radius) ** 2) ** 0.5
                alpha = 255 if dist <= radius else 0
            else:
                alpha = 255
            row += [r, g, b, alpha]
        rows.append(bytes(row))

    raw = b''.join(rows)
    compressed = zlib.compress(raw, 9)

    def chunk(name, data):
        c = name + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

    ihdr_data = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    png = (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', ihdr_data)
        + chunk(b'IDAT', compressed)
        + chunk(b'IEND', b'')
    )
    with open(out_path, 'wb') as f:
        f.write(png)
    print(f"生成 {out_path} ({size}x{size})")

base = os.path.dirname(os.path.abspath(__file__))
make_png(192, os.path.join(base, 'public', 'icon-192.png'))
make_png(512, os.path.join(base, 'public', 'icon-512.png'))
