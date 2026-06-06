The structure of a mesh file consists of a header of 196 bytes followed
by a series of chunks of different kinds of data.

## Map Data Format 

The header serves as a table of contents for the data chunks. It is a
series of **32-bit unsigned little-endian integers**,
each of which is either:
- **0** (chunk is not present in the file)

*OR*

- an **intra-file pointer** to **first byte** of the data field.

Here's a table of what each pointer points to:
| pointer address | type of chunk it points to                             |
|:--------------- |:------------------------------------------------------ |
| 0x40            | Primary mesh                                           |
| 0x44            | Texture palettes (color)                               | 
| 0x4c            | Unknown (this pointer is only non-zero in MAP000.5)    |
| 0x64            | Light colors and positions, background gradient colors |
| 0x68            | Terrain (tile heights, slopes, and surface types)      |
| 0x6c            | Texture animation instructions                         |
| 0x70            | Palette animation instructions                         |
| 0x7c            | Texture palettes (grayscale)                           |
| 0x8c            | Mesh animation instructions                            |
| 0x90            | Animated mesh 1                                        |
| 0x94            | Animated mesh 2                                        |
| 0x98            | Animated mesh 3                                        |
| 0x9c            | Animated mesh 4                                        |
| 0xa0            | Animated mesh 5                                        |
| 0xa4            | Animated mesh 6                                        |
| 0xa8            | Animated mesh 7                                        |
| 0xac            | Animated mesh 8                                        |
| 0xb0            | Polygon Render Properties                              |

>Notice that this table skips some pointers. The omitted pointers are 0
in every mesh file: they never point at anything.

### Primary Mesh:
- **required for the Initial mesh**
   - (Primary/Day/No Weather)
- *optional for all other map states*.

- This chunk contains most of the polygons that make up the map. It
contains XYZ coordinates for each vertex, normal vectors for each
vertex, UV coordinates for each vertex, and the ID of the palette to use
for each polygon's texture.

- The polygons are divided into four groups: *Textured triangles*, *, *untextured triangles*, and untextured quadrilaterals. The untextured polygons are always black. They're used mostly around the edges of the map to make the map look like a solid cross-section.*

#### Primary Mesh Header

The mesh chunk begins with a header of 4 16-bit unsigned integers
specifying how many of each type of polygon the mesh contains:

| Width (bits) | Data type | Purpose | Max Value |
 | :------------  | :-------- | :---------------------------------------- | :--------- |
 | 16             | uint      | Number of textured triangles (N)          | 512        |
 | 16             | uint      | Number of textured quadrilaterals (P)     | 768        |
 | 16             | uint      | Number of untextured triangles (Q)        | 64         |
 | 16             | uint      | Number of untextured quadrilaterals (R) | 256        |

##### XYZ coordinates

All vertices used on the map.


| Width (bits) | Data type | Purpose |
| ------------- | --------- | ----------- |
| 16            | int       | Point A, X coordinate  |
| 16            | int       | Point A, Y coordinate  |
| 16            | int       | Point A, Z coordinate  |
| 16            | int       | Point B, X coordinate  |
| 16            | int       | Point B, Y coordinate  |
| 16            | int       | Point B, Z coordinate  |
| 16            | int       | Point C, X coordinate  |
| 16            | int       | Point C, Y coordinate  |
| 16            | int       | Point C, Z coordinate  |

  : Triangle XYZ coordinates

Then P sets of 4 XYZ coordinates:

| Width (bits) | Data type | Purpose |
| ------------ | --------- | --------------------- |
|  16           | int       | Point A, X coordinate |
|  16           | int       | Point A, Y coordinate |
|  16           | int       | Point A, Z coordinate |
|  16           | int       | Point B, X coordinate |
|  16           | int       | Point B, Y coordinate |
|  16           | int       | Point B, Z coordinate |
|  16           | int       | Point C, X coordinate |
|  16           | int       | Point C, Y coordinate |
|  16           | int       | Point C, Z coordinate |
|  16           | int       | Point D, X coordinate |
|  16           | int       | Point D, Y coordinate |
|  16           | int       | Point D, Z coordinate |

  : Quadrilateral XYZ coordinates

Then Q sets of 3 XYZ coordinates (same format as triangles, above), then
R sets of 4 XYZ coordinate (same format as quadrilaterals, above).

### Normal vectors {#normal_vectors}

Next come the normal vectors, which follow the same pattern. Instead of
being integers, however, the values are stored as fixed-point numbers.
They have a sign bit, then a 3-bit whole part and a 12-bit fractional
part. This sounds complicated, but basically it just means you read them
as signed 16-bit integers, then convert them to floating-point numbers
and divide by 4096.0.

Also, there are no normal vectors for the untextured polygons, since
those are always completely black.

First, there are N sets of 3 normal vectors:

  Width (bits)   Data type      Purpose
  -------------- -------------- -------------------------
  16             fixed 1,3,12   Point A, nomal vector X
  16             fixed 1,3,12   Point A, nomal vector Y
  16             fixed 1,3,12   Point A, nomal vector Z
  16             fixed 1,3,12   Point B, nomal vector X
  16             fixed 1,3,12   Point B, nomal vector Y
  16             fixed 1,3,12   Point B, nomal vector Z
  16             fixed 1,3,12   Point C, nomal vector X
  16             fixed 1,3,12   Point C, nomal vector Y
  16             fixed 1,3,12   Point C, nomal vector Z

  : Triangle normal vectors

Then P sets of 4 normal vectors:

  Width (bits)   Data type      Purpose
  -------------- -------------- -------------------------
  16             fixed 1,3,12   Point A, nomal vector X
  16             fixed 1,3,12   Point A, nomal vector Y
  16             fixed 1,3,12   Point A, nomal vector Z
  16             fixed 1,3,12   Point B, nomal vector X
  16             fixed 1,3,12   Point B, nomal vector Y
  16             fixed 1,3,12   Point B, nomal vector Z
  16             fixed 1,3,12   Point C, nomal vector X
  16             fixed 1,3,12   Point C, nomal vector Y
  16             fixed 1,3,12   Point C, nomal vector Z
  16             fixed 1,3,12   Point D, nomal vector X
  16             fixed 1,3,12   Point D, nomal vector Y
  16             fixed 1,3,12   Point D, nomal vector Z

  : Quadrilateral normal vectors

### Polygon texture data {#polygon_texture_data}

This block of data is a little bit different. It has UV coordinates for
each point on the textured polygons, but it also has a texture page
number and palette number for the polygon as a whole. The texture page
number is multiplied by 256 and then added to the V coordinate for each
point on the polygon. This is because the UV coordinates are stored as
bytes, but the textures are 256x1024 pixels, so effectively there are 4
texture pages. The palette number indicates which palette to apply to
the polygon's texture while rendering it.

There are N triangles:

  Width (bits)   Data type   Purpose
  -------------- ----------- ---------------------------------------------------------------------------------------------------------------------------------------------
  8              uint        Point A, U coordinate
  8              uint        Point A, V coordinate
  8              uint        Palette number
  8              N/A         Padding/unknown (Vanilla Maps almost always have this set to (0x78 / 120dec)
  8              uint        Point B, U coordinate
  8              uint        Point B, V coordinate
  4              N/A         Padding/unknown
  2              N/A         Texture Image to use. A value of 3 uses the map's texture. Other values are various UI elements like fonts, icons, and objective messages.
  2              uint        Page number
  8              N/A         Padding/unknown
  8              uint        Point C, U coordinate
  8              uint        Point C, V coordinate

  : Triangle texture data

Followed by P quadrilaterals:

  Width (bits)   Data type   Purpose
  -------------- ----------- ---------------------------------------------------------------------------------------------------------------------------------------------
  8              uint        Point A, U coordinate
  8              uint        Point A, V coordinate
  8              uint        Palette number
  8              N/A         Padding/unknown (Vanilla Maps almost always have this set to (0x78 / 120dec)
  8              uint        Point B, U coordinate
  8              uint        Point B, V coordinate
  4              N/A         Padding/unknown
  2              N/A         Texture Image to use. A value of 3 uses the map's texture. Other values are various UI elements like fonts, icons, and objective messages.
  2              uint        Page number
  8              N/A         Padding/unknown
  8              uint        Point C, U coordinate
  8              uint        Point C, V coordinate
  8              uint        Point D, U coordinate
  8              uint        Point D, V coordinate

  : Quadrilateral texture data

### Unknown Untextured Polygon Data {#unknown_untextured_polygon_data}

After the polygon texture data, there's a block of data whose purpose I
don't understand. Its length is equal to 4 * Q + 4 * R.

### Polygon tile locations {#polygon_tile_locations}

Next comes a block that assigns a terrain coordinate to each textured
polygon. Its length is equal to 2 * N + 2 * P. This data is used when
the game highlights all the tiles you can move to: It looks here to
figure out which polygons to turn blue.

  Width (bits)   Data type   Purpose
  -------------- ----------- --------------
  7              uint        Z coordinate
  1              N/A         Height Level
  8              uint        X coordinate

  : Textured polygon terrain coordinate data

Sometimes, there are 2 bytes of unknown data or padding at the end of
this block.

## Texture palettes (color) {#texture_palettes_color}

This chunk is required for the Initial mesh (Primary/Day/No Weather),
but is optional for all other map states.

A set of 16 palettes, each containing 16 colors. Each color in the
palette is 16 bits in little endian format.

`  8B B1 => B1 8B`\
`  `\
`  1000 1011 1011 0001`\
`  ABBB BBGG GGGR RRRR`

  Width (bits)   Data type   Purpose
  -------------- ----------- ---------
  1              uint        Alpha
  5              uint        Blue
  5              uint        Green
  5              uint        Red

  : Color

If R == G == B == A == 0, then the color is transparent.

## Light colors and positions, background gradient colors {#light_colors_and_positions_background_gradient_colors}

Each map can have 3 directional lights and ambient light. The lighting
data is stored like this:

  Width (bits)   Data type      Purpose
  -------------- -------------- ----------------
  16             fixed 1,3,12   Light 1, red
  16             fixed 1,3,12   Light 2, red
  16             fixed 1,3,12   Light 3, red
  16             fixed 1,3,12   Light 1, green
  16             fixed 1,3,12   Light 2, green
  16             fixed 1,3,12   Light 3, green
  16             fixed 1,3,12   Light 1, blue
  16             fixed 1,3,12   Light 2, blue
  16             fixed 1,3,12   Light 3, blue

  : Directional light colors

Note that these light colors can be overloaded. Colors are defined as a
value between 0 and 255 for each Red, Green, and Blue. However, if the
values for these colors exceed 255, referenced as \"Overflow\" in GDX,
the lighting model is affected. It's unknown how this is affected. For
example, overflowing the first directional light's color values seems
to add to its intensity based on the color, where as overflowing the
second directional light's color value seems to only add white
regardless of which color is overflowed. The third directional light
doesn't appear to make any difference. Sometimes, overflowing these
values will increase the intensity of the ambient light, and I might be
imagining it but it seems like sometimes the color of the backgrounds is
added to the lighting model. On some maps (like the entrance to
Murmond), these overflow values seem to be triggered by events. This
whole system needs a serious investigation, likely by referencing the
actual ASM behind the lighting engine.

  Width (bits)   Data type   Purpose
  -------------- ----------- -----------------------
  16             int         Light 1, X coordinate
  16             int         Light 1, Y coordinate
  16             int         Light 1, Z coordinate
  16             int         Light 2, X coordinate
  16             int         Light 2, Y coordinate
  16             int         Light 2, Z coordinate
  16             int         Light 3, X coordinate
  16             int         Light 3, Y coordinate
  16             int         Light 3, Z coordinate

  : Directional light positions

  Width (bits)   Data type   Purpose
  -------------- ----------- ---------
  8              uint        Red
  8              uint        Green
  8              uint        Blue

  : Ambient light colors

This is immediately followed by the background gradient colors:

  Width (bits)   Data type   Purpose
  -------------- ----------- ---------------------
  8              uint        Top color, red
  8              uint        Top color, green
  8              uint        Top color, blue
  8              uint        Bottom color, red
  8              uint        Bottom color, green
  8              uint        Bottom color, blue

  : Background gradient colors

Sometimes, there are 3 bytes of unknown data or padding at the end of
this chunk.

## Terrain

This chunk is required for the Initial mesh (Primary/Day/No Weather),
but is optional for all other map states.

This chunk contains data about the height, depth, slope, and surface
type (grass, water, stone, etc) of each tile, as well as flags for
whether you can walk on a tile or select it with the cursor.

### Header
There is a two-byte header indicating the size of the X and Z dimensions
of the map, in tiles. The product of X and Z must be <= 256.

| Width (bits) | Data type | Purpose |
| -- | :------- | :--- |
| 8  |   uint   | Number of tiles of terrain, X dimension |
| 8  |   uint   | Number of tiles of terrain, Z dimension |

  : Terrain header

### Main Block {#main_block}

The main block of the terrain data is divided into 2 levels. For a map
with a bridge, for instance, the bridge might be on level 0 and the
water below it on level 1. Each terrain level contains Z rows of X tile
definitions, which look like this:

| Width (bits) | Data Type | Purpose |
| :--- | :----- | :----- |
| 2    | N/A    | unknown/padding |
| 6    | uint   | [Surface type](Terrain_Surface_Types "Surface type"){.wikilink} (grass, water, stone, etc.) |
| 8    | N/A    | unknown/padding |
| 8    | uint   | Height (For sloped tiles, the height of the bottom of the slope) |
| 5    | uint   | Slope height (For sloped tiles, the difference between the height at the top and the height at the bottom) |
| 3    | uint   | Depth |
| 8    | uint   | [Slope types](Slope_Type "Slope types"){.wikilink} |
| 3    | N/A    | unknown/padding |
| 5    | uint   | Thickness, used in [Calculate_Tile_Ceiling](Calculate_Tile_Ceiling "Calculate_Tile_Ceiling"){.wikilink} (and arc trajectory stuff |
| 1    | uint   | Can Walk/Cursor through this tile but not stand on it or select it. |
| 3    | N/A    | unknown/padding |
| 2    | uint   | Terrain Tile Shading. 0 = Normal, 1 = Dark, 2 = Darker, 3 = Darkest |
| 1    | uint   | Can't walk on this tile |
| 1    | uint   | Can't move cursor to this tile |
| 8    | uint   | Controls which angles the camera will auto-rotate to when a unit enters this tile. <br> - 0: Northwest Top <br>- 1: Southwest Top <br> - 2: Southeast Top <br> - 3: Northeast Top <br> - 4: Northwest Bottom <br> - 5: Southwest Bottom<br> - 6: Southeast Bottom <br> - 7: Northeast Bottom |

### Terrain Tiles
These tile definitions are 8 bytes long. Each terrain level always has
room for 256 tiles (i.e. each one is always 256 * 8 bytes long), even
if the map doesn't use them all. In other words, the terrain chunk,
including its header, is always 2 + 256 * 8 * 2 bytes long, no matter
how big the map is. If the map is small, there will be a lot of padding.

| Value | Meaning |
| :--- | :--- |
| 0x00 | Flat |
| 0x85 | Incline N |
| 0x52 | Incline E |
| 0x25 | Incline S |
| 0x58 | Incline W |
| 0x41 | Convex NE |
| 0x11 | Convex SE |
| 0x14 | Convex SW |
| 0x44 | Convex NW |
| 0x96 | Concave NE |
| 0x66 | Concave SE |
| 0x69 | Concave SW |
| 0x99 | Concave NW |

: [Slope types](Slope_Type "Slope types"){.wikilink}

Sometimes, there are 2 bytes of unknown data or padding at the end of
this chunk.

## Texture animation instructions {#texture_animation_instructions}

This chunk is optional for all map states.

There are 32 rows of x14 (20) Bytes, with each row defining a Texture
Animation.

There are two types of Texture Animations: UV Animations, and Palette
Animations. Each row can be either of these two types.

### UV Animation {#uv_animation}

If bytes 1 and 9 are set to x03, the animation will be a UV Animation,
formatted as follows:

Each animation has a Canvas position and size. Animations will play
within this canvas space.

| Field | Width (bits) | Data type | Purpose |
| :--- | ---: | :--- | :--- |
| + | 8 | uint | Canvas X coordinate and Texture Page. Multiply uint value by 4. The Texture Page is defined by how many times the X value loops past 256. For example, a Hex value of x82 would be a uint of 130. Multiplied by 4, it becomes 520. Subtract 256 to get 264. Subtract 256 again to get 8. This value would be Texture Page 2, X coordinate 8. |
| + | 8 | N/A | Unknown, seems to only work if this value is set to x03 |
| + | 8 | uint | Canvas Y coordinate. |
| + | 8 | uint | Unknown |
| + | 8 | uint | Width of the Canvas. This value is multiplied by 4. For example, a width of x05 will be 20 pixels wide. |
| + | 8 | uint | Unknown |
| + | 8 | uint | Height of the Canvas. |
| + | 8 | uint | Unknown |
| + | 8 | uint | First Frame X coordinate. Follows the same rules as the Canvas X coordinate. Subsequent frames are offset by canvas width. |
| + | 8 | N/A | Unknown, seems to only work if this value is set to x03 |
| + | 8 | uint | First Frame Y coordinate. |
| + | 8 | uint | Unknown |
| + | 8 | uint | Unknown |
| + | 8 | uint | Unknown |
| + | 8 | N/A | Animation Technique. This can be one of four values: x01: An indefinitely looping forward playing animation x02: An indefinitely looping forward-then-reverse playing animation x05: A forward playing animation that plays once when the UseFieldObject script command is called x15: A reverse playing animation that plays once when the UseFieldObject script command is called |
| + | 8 | uint | The number of frames in the animation |
| + | 8 | N/A | Unknown |
| + | 8 | uint | Frame Duration (in 1/30ths of a second) |
| + | 8 | N/A | Unknown |
| + | 8 | N/A | Unknown |

: Texture animation instruction

### Palette Animation {#palette_animation}

If bytes 2, 3, and 4 are set to x00 xE0 x01, the animation will be a
Palette Animation, formatted at follows:

| Field | Width (bits) | Data type | Purpose |
| :--- | ---: | :--- | :--- |
| + | 4 | uint | The Palette Id that will be animated |
| + | 4 | N/A | Unknown |
| + | 8 | N/A | Unknown, seems to only work if this value is set to x00 |
| + | 8 | N/A | Unknown, seems to only work if this value is set to xE0 |
| + | 8 | N/A | Unknown, seems to only work if this value is set to x01 |
| + | 32 | N/A | Unknown |
| + | 8 | N/A | The Palette Animation's Starting Index in the Palette Animations data set. |
| + | 40 | N/A | Unknown |
| + | 8 | uint | Animation Technique. This can be one of four values: x03: An indefinitely looping forward playing animation x04: An indefinitely looping forward-then-reverse playing animation x13: A forward playing animation that plays once when the UseFieldObject script command is called x0: A forward playing animation that loops when the UseFieldObject script command is called |
| + | 8 | uint | The number of frames in the animation |
| + | 8 | N/A | Unknown |
| + | 8 | uint | Frame Duration (in 1/30ths of a second) |
| + | 16 | N/A | Unknown |

: Palette animation instruction

## Palette Frames for Texture Animations {#palette_frames_for_texture_animations}

This chunk is optional for all map states.

This section defines Palette Animation Frames. It is a fixed length of
16 sets of 32 bytes each. Each set of 32 bytes is a frame of palette
animation and is structured identically to [the other Texture Palette
data](Maps/Mesh#Texture_palettes_.28color.29 "the other Texture Palette data"){.wikilink}.

Animation details (Palette Index, number of frames, etc) are defined in
the [Texture Animation
data](Maps/Mesh#Texture_animation_instructions "Texture Animation data"){.wikilink}.

## Texture palettes (grayscale) {#texture_palettes_grayscale}

This chunk is required for the Initial mesh (Primary/Day/No Weather),
but is optional for all other map states.

This is a grayscale version of the main palette. It is used when
highlighting polygons with the red movement and blue action squares.

## Mesh animation instructions {#mesh_animation_instructions}

This chunk is optional for all map states.

This chunk is always 14,620 (x0391C) bytes long.

### Animation Methodology {#animation_methodology}

Meshes are animated using pre-defined keyframes that contain values for
Rotation, Position, Scale, Tween Type, and so on. A total of 120
keyframes can be defined.

There are 8 total Animated Meshes. Each Animated Mesh has 8 total States
that can be invoked by in-game scripts/events. Only the first state of
each animated mesh will be active by default.

This makes 64 total Mesh States (8 meshes by 8 states each).

Each of the 64 Mesh States has a list of 16 commands that reference the
pre-defined keyframes. In this way, multiple meshes can use the same
keyframes.

### Overall Structure {#overall_structure}

| Field | Width (bytes) | Purpose |
| :--- | ---: | :--- |
| + | 8 | Header of unknown data. Seems to always be, in hex: `[01 00 00 00 80 00 00 00]` |
| + | 10240 | 128 rows of 80 bytes each that define individual keyframes. |
| + | 8 | Header of unknown data. Seems to always be, in hex: `[02 00 00 00 10 00 40 00]` |
| + | 4096 | 64 rows of 64 bytes each that define mesh animation instructions. |
| + | 8 | Header of unknown data. Seems to always be, in hex: `[03 00 00 00 40 00 00 00]` |
| + | 256 | 64 rows of 4 bytes each that define Mesh Properties. |
| + | 4 | Chunk of unknown data. Seems to always be `00`s. |

: Animated Mesh Instructions Structure

### Keyframes Structure {#keyframes_structure}

Each property is 16 bits/2 bytes. Each row of Keyframes is defined as:

| Word | Purpose | Notes |
| ---: | :--- | :--- |
| 0 | X Rotation | Rotation Values. Rotation = Value / 4096 * 360 |
| 1 | Y Rotation |  |
| 2 | Z Rotation |  |
| 3 | Unknown/Padding |  |
| 4 | X Position | Position Values. |
| 5 | Y Position |  |
| 6 | Z Position |  |
| 7 | Unknown/Padding |  |
| 8 | X Scale | Scale Values. Scale = Value / 4096 |
| 9 | Y Scale |  |
| 10 | Z Scale |  |
| 11 | Unknown/Padding |  |
| 12 | X Rotation Start Percent | Where along the animation this value will start. Calculated between this and the next keyframe. Percent = Value / 4096 * 100 |
| 13 | Y Rotation Start Percent |  |
| 14 | Z Rotation Start Percent |  |
| 15 | X Position Start Percent | Where along the animation this value will start. Calculated between this and the next keyframe. Percent = Value / 4096 * 100 |
| 16 | Y Position Start Percent |  |
| 17 | Z Position Start Percent |  |
| 18 | X Scale Start Percent | Where along the animation this value will start. Calculated between this and the next keyframe. Percent = Value / 4096 * 100 |
| 19 | Y Scale Start Percent |  |
| 20 | Z Scale Start Percent |  |
| 21 | X Rotation End Percent | Where along the animation this value will end. Calculated between this and the next keyframe. Percent = Value / 4096 * 100 |
| 22 | Y Rotation End Percent |  |
| 23 | Z Rotation End Percent |  |
| 24 | X Position End Percent | Where along the animation this value will end. Calculated between this and the next keyframe. Percent = Value / 4096 * 100 |
| 25 | Y Position End Percent |  |
| 26 | Z Position End Percent |  |
| 27 | X Scale End Percent | Where along the animation this value will end. Calculated between this and the next keyframe. Percent = Value / 4096 * 100 |
| 28 | Y Scale End Percent |  |
| 29 | Z Scale End Percent |  |
| 30 | X Rotation Tween Type | The style of Tween used. See the table below for Tween Types. |
| 31 | Y Rotation Tween Type |  |
| 32 | Z Rotation Tween Type |  |
| 33 | X Position Tween Type |  |
| 34 | Y Position Tween Type |  |
| 35 | Z Position Tween Type |  |
| 36 | X Scale Tween Type |  |
| 37 | Y Scale Tween Type |  |
| 38 | Z Scale Tween Type |  |
| 39 | Unknown/Padding |  |

: Per Keyframe

| Value | Tween Type | Method |
| :--- | :--- | :--- |
| 0x00 | Invalid | Will not animate this keyframe. |
| 0x05 | TweenTo | Will tween the animation TO this value. Example: `[X Position: 50, Animation: X Position TweenTo 10]` will translate the mesh to the X position of 10. |
| 0x06 | TweenBy | Will tween the animation BY this value. Example: `[X Position: 50, Animation: X Position TweenBy 10]` will translate the mesh to the X position of 60. |
| 0x09 | Unknown | This value is used in animations but it is unknown what it does. Will break existing animations if changed to another value. |
| 0x0A | Oscillate | Will tween to this value and then back. Example: `[X Position: 50, Animation: X Position Oscillate 10]` will translate the mesh to the X position of 10 and then back to 50. |
| 0x11 | Unknown (7) | This value is used in animations but it is unknown what it does. Will break existing animations if changed to another value. |
| 0x12 | OscillateOffset | Will tween by this value and then back. Example: `[X Position: 50, Animation: X Position OscillateOffset 10]` will translate the mesh to the X position of 60 and then back to 50. |

: Tween Type Values

All other values are unused in the vanilla maps and likely mimic the
behavior of 0x00 Invalid.

### Mesh Animation Instructions Structure {#mesh_animation_instructions_structure}

Of the 64 total Mesh States, each has a list of 16 Frame Instructions
that are 4 bytes long.

| Byte | Purpose | Notes |
| :--- | :--- | :--- |
| 0 | Keyframe Id | References the Keyframe Values — Rotation, Position, Tween Type, etc. — from keyframe data above by Id. |
| 1 | Next Frame Id | References the Frame Instruction Id to go to next after this animation concludes. This is the Frame Id, not the pre-defined Keyframe Id. |
| 2 + 3 | Duration | Int16. The duration of the animation in frames, at 30 frames/sec. |

: Mesh State Instruction

### Mesh Properties Structure {#mesh_properties_structure}

| Byte | Purpose | Notes |
| ---: | :--- | :--- |
| 0 | Parent Id | Uses another animated mesh as a parent and applies that parent's animation to its own, effectively creating a link. `0` = no parent. A value of `1` references Animated Mesh 1, instead of using a typical 0-indexed reference. |
| 1 | Unknown | Unknown. |
| 2 | Unknown | Unknown. |
| 3 | Unknown | Unknown. |

: Mesh Properties

## Animated Meshes 1-8 {#animated_meshes_1_8}

Each of these chunks is optional for all map states.

Each of these chunks is very similar to the primary mesh chunk.

## Polygon Render Properties {#polygon_render_properties}

This chunk is optional for all map states.

This chunk defines properties for polygons on how they should render.
Included are whether the polygon is lit or unlit, and whether it's
visible from each of eight camera viewing angles. This data is used to
remove obstructions like walls from the the camera's view, and also to
avoid drawing certain polygons that are unnecessary because they're
covered up by other polygons anyway.

This chunk is always 4096 bytes long. It consists of 5 blocks:

1.  A block of unknown data 896 bytes long
2.  1024 bytes for 512 textured triangles
3.  1536 bytes for 768 textured quads
4.  128 bytes for 64 untextured triangles
5.  512 bytes for 256 untextured quads

The length of each block is always the same, regardless of the number of
polygons the mesh actually contains. This means that there's a lot of
padding for meshes with low polygon counts. It also means there's an
upper limit on the number of polygons allowed in a mesh.

Bytes are read as Little Endian format (swap the high byte with the low
byte).

bit:

- 0: Polygon is Unlit (appears as pure texture color with no lighting
  applied)
- 1: Unknown
- 2: Southwest
- 3: Northwest
- 4: Northeast
- 5: Southeast
- 6: South Southwest
- 7: West Southwest
- 8: West Northwest
- 9: North Northwest
- 10: North Northeast
- 11: East Northeast
- 12: East Southeast
- 13: South Southeast
- 14: Unknown
- 15: Unknown
