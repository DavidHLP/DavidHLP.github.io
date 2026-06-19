import sys
from PIL import Image

def get_binary_grid(img, thresh=128):
    grid = []
    for y in range(img.height):
        row = []
        for x in range(img.width):
            val = img.getpixel((x, y))
            row.append(1 if val < thresh else 0)
        grid.append(row)
    return grid

# Moore-Neighbor Tracing Algorithm to find the contour of a component
def trace_contour(grid, start_x, start_y):
    height = len(grid)
    width = len(grid[0])

    # Directions: Up, Up-Right, Right, Down-Right, Down, Down-Left, Left, Up-Left
    dirs = [(0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1)]

    # Find start pixel
    cx, cy = start_x, start_y
    # Backtrack direction index (start from Up-Left relative to start pixel)
    b_idx = 7

    contour = []

    # Safety counter to prevent infinite loop
    max_steps = width * height
    steps = 0

    while steps < max_steps:
        # Search clockwise from the backtrack direction
        found = False
        for i in range(8):
            d_idx = (b_idx + i) % 8
            dx, dy = dirs[d_idx]
            nx, ny = cx + dx, cy + dy

            if 0 <= nx < width and 0 <= ny < height and grid[ny][nx] == 1:
                # Found next contour pixel
                cx, cy = nx, ny
                contour.append((cx, cy))

                # The next backtrack direction is the opposite of where we came from, clockwise
                # If we entered from direction d_idx, the opposite is (d_idx + 4) % 8
                # We start searching from (opposite + 1) % 8 -> (d_idx + 5) % 8
                b_idx = (d_idx + 5) % 8
                found = True
                break

        if not found:
            # Isolated pixel
            contour.append((cx, cy))
            break

        # Check termination condition: Moore's termination condition
        if len(contour) >= 2:
            if contour[-2] == (start_x, start_y) and contour[-1] == contour[0]:
                contour = contour[:-1] # remove duplicate start
                break

        steps += 1

    return contour

# Ramer-Douglas-Peucker algorithm to simplify a path
def rdp(points, epsilon):
    if len(points) < 3:
        return points

    # Find point with max distance from the line segment between start and end
    start_p = points[0]
    end_p = points[-1]

    max_d = 0
    max_idx = 0

    x1, y1 = start_p
    x2, y2 = end_p
    dx = x2 - x1
    dy = y2 - y1
    denom = (dx**2 + dy**2) ** 0.5

    for i in range(1, len(points) - 1):
        x, y = points[i]
        if denom == 0:
            d = ((x - x1)**2 + (y - y1)**2) ** 0.5
        else:
            d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / denom
        if d > max_d:
            max_d = d
            max_idx = i

    if max_d > epsilon:
        # Recursive simplify
        left = rdp(points[:max_idx + 1], epsilon)
        right = rdp(points[max_idx:], epsilon)
        return left[:-1] + right
    else:
        return [start_p, end_p]

def main():
    img = Image.open("public/light-drive.png").convert("L")
    grid = get_binary_grid(img, thresh=240)

    height = img.height
    width = img.width

    # Track visited pixels to avoid duplicate tracing
    visited = [[0 for _ in range(width)] for _ in range(height)]

    contours = []

    # Scan grid for untraced black pixels
    for y in range(1, height - 1):
        for x in range(1, width - 1):
            if grid[y][x] == 1 and not visited[y][x]:
                # Trace this component's contour
                contour = trace_contour(grid, x, y)
                if len(contour) > 5: # filter small noise
                    contours.append(contour)
                    # Mark all pixels inside/on the contour as visited
                    for px, py in contour:
                        visited[py][px] = 1
                        # Mark neighbors as visited too to avoid duplicate contours
                        for dy in [-1, 0, 1]:
                            for dx in [-1, 0, 1]:
                                visited[py+dy][px+dx] = 1

    print(f"Found {len(contours)} contours")

    # Simplify and generate SVG paths
    svg_paths = []

    epsilon = 1.8 # simplification threshold (tweak as needed for accuracy vs size)

    for idx, contour in enumerate(contours):
        simplified = rdp(contour, epsilon)
        # Format as SVG path
        if not simplified:
            continue

        path_str = f"M {simplified[0][0]} {simplified[0][1]}"
        for pt in simplified[1:]:
            path_str += f" L {pt[0]} {pt[1]}"
        path_str += " Z"
        svg_paths.append(path_str)

    # Write the output SVG file
    svg_content = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">\n'
    svg_content += '  <style>\n'
    svg_content += '    path {\n'
    svg_content += '      fill: #1a1a1a;\n'
    svg_content += '    }\n'
    svg_content += '    @media (prefers-color-scheme: dark) {\n'
    svg_content += '      path {\n'
    svg_content += '        fill: #fffffd;\n'
    svg_content += '      }\n'
    svg_content += '    }\n'
    svg_content += '  </style>\n'

    for path_str in svg_paths:
        svg_content += f'  <path d="{path_str}" />\n'
    svg_content += '</svg>\n'

    with open("public/favicon.svg", "w") as f:
        f.write(svg_content)

    logo_content = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" fill="currentColor">\n'
    for path_str in svg_paths:
        logo_content += f'  <path d="{path_str}" />\n'
    logo_content += '</svg>\n'

    with open("src/icons/site-logo.svg", "w") as f:
        f.write(logo_content)

    print("Successfully traced light-drive.png and generated public/favicon.svg and src/icons/site-logo.svg")

if __name__ == "__main__":
    main()
